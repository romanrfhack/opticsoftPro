using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Opticsoft.Application.Common.Interfaces;
using Opticsoft.Api.Auth;
using Opticsoft.Infrastructure.Identity;
using Opticsoft.Infrastructure.Persistence;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace Opticsoft.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly UserManager<AppUser> _userManager;
    private readonly RoleManager<IdentityRole<Guid>> _roleManager;
    private readonly AppDbContext _db;
    private readonly ITenantProvider _tenantProvider;

    public UsersController(
        UserManager<AppUser> userManager,
        RoleManager<IdentityRole<Guid>> roleManager,
        AppDbContext db,
        ITenantProvider tenantProvider)
    {
        _userManager = userManager;
        _roleManager = roleManager;
        _db = db;
        _tenantProvider = tenantProvider;
    }

    public sealed record UserItem(Guid Id, string Email, string? FullName, string? PhoneNumber, Guid SucursalId, string SucursalNombre, string[] Roles, bool LockedOut);
    public sealed record CreateUserRequest(string Email, string FullName, Guid SucursalId, string Password, string[] Roles);
    public sealed record UpdateUserRequest(string FullName, Guid SucursalId, string[] Roles);
    public sealed record ResetPasswordRequest(string NewPassword);
    public sealed record LockRequest(bool Lock);

    [HttpGet("roles")]
    [Authorize(Policy = Policies.Usuarios_Admin)]
    public async Task<IEnumerable<string>> Roles()
        => await _roleManager.Roles.Select(r => r.Name!).OrderBy(n => n).ToListAsync();

    [HttpGet]
    [Authorize(Policy = Policies.Usuarios_Admin)]
    public async Task<ActionResult<object>> List([FromQuery] string? query, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        if (page < 1) page = 1;
        if (pageSize < 1 || pageSize > 200) pageSize = 20;

        var q = _userManager.Users.AsNoTracking();
        if (!string.IsNullOrWhiteSpace(query))
        {
            var t = query.Trim().ToLower();
            q = q.Where(u => (u.Email ?? "").ToLower().Contains(t) || (u.FullName ?? "").ToLower().Contains(t));
        }

        var total = await q.CountAsync();
        var users = await q.OrderBy(u => u.Email).Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();

        var sucursales = await _db.Sucursales.ToDictionaryAsync(s => s.Id, s => s.Nombre);
        var items = new List<UserItem>(users.Count);
        foreach (var u in users)
        {
            var roles = await _userManager.GetRolesAsync(u);
            var locked = u.LockoutEnd.HasValue && u.LockoutEnd.Value.UtcDateTime > DateTime.UtcNow;
            items.Add(new UserItem(u.Id, u.Email!, u.FullName, u.PhoneNumber, u.SucursalId, sucursales.GetValueOrDefault(u.SucursalId, ""), roles.ToArray(), locked));
        }

        return Ok(new { total, items });
    }

    [HttpPost]
    [Authorize(Policy = Policies.Usuarios_Admin)]
    public async Task<ActionResult<UserItem>> Create(CreateUserRequest req)
    {
        foreach (var r in req.Roles)
            if (!await _roleManager.RoleExistsAsync(r)) return BadRequest(new { message = $"Rol inexistente: {r}" });

        if (!TryGetCurrentTenantId(out var tenantId, out var tenantError))
            return tenantError!;

        var suc = await _db.Sucursales
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.Id == req.SucursalId);
        if (suc is null)
            return BadRequest(new { message = "Sucursal invalida para el tenant actual." });

        var user = new AppUser
        {
            Id = Guid.NewGuid(),
            UserName = req.Email,
            Email = req.Email,
            EmailConfirmed = true,
            FullName = req.FullName,
            SucursalId = req.SucursalId,
            TenantId = tenantId
        };

        var result = await _userManager.CreateAsync(user, req.Password);
        if (!result.Succeeded) return BadRequest(new { message = string.Join("; ", result.Errors.Select(e => e.Description)) });

        if (req.Roles.Length > 0)
            await _userManager.AddToRolesAsync(user, req.Roles);

        var roles = await _userManager.GetRolesAsync(user);
        return CreatedAtAction(nameof(GetById), new { id = user.Id }, new UserItem(user.Id, user.Email!, user.FullName, user.PhoneNumber, user.SucursalId, suc?.Nombre ?? "", roles.ToArray(), false));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<UserItem>> GetById(Guid id)
    {
        if (!CanAccessUser(id))
            return Forbid();

        var u = await _userManager.Users.FirstOrDefaultAsync(x => x.Id == id);
        if (u is null) return NotFound();
        var roles = await _userManager.GetRolesAsync(u);
        var suc = await _db.Sucursales.FindAsync(u.SucursalId);
        var locked = u.LockoutEnd.HasValue && u.LockoutEnd.Value.UtcDateTime > DateTime.UtcNow;

        return new UserItem(u.Id, u.Email!, u.FullName, u.PhoneNumber, u.SucursalId, suc?.Nombre ?? "", roles.ToArray(), locked);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Policy = Policies.Usuarios_Admin)]
    public async Task<IActionResult> Update(Guid id, UpdateUserRequest req)
    {
        if (!TryGetCurrentTenantId(out _, out var tenantError))
            return tenantError!;

        var u = await _userManager.Users.FirstOrDefaultAsync(x => x.Id == id);
        if (u is null) return NotFound();

        var suc = await _db.Sucursales
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.Id == req.SucursalId);
        if (suc is null)
            return BadRequest(new { message = "Sucursal invalida para el tenant actual." });

        u.FullName = req.FullName;
        u.SucursalId = req.SucursalId;

        var res = await _userManager.UpdateAsync(u);
        if (!res.Succeeded) return BadRequest(new { message = string.Join("; ", res.Errors.Select(e => e.Description)) });

        var current = await _userManager.GetRolesAsync(u);
        var toAdd = req.Roles.Except(current).ToArray();
        var toRemove = current.Except(req.Roles).ToArray();
        if (toAdd.Length > 0) await _userManager.AddToRolesAsync(u, toAdd);
        if (toRemove.Length > 0) await _userManager.RemoveFromRolesAsync(u, toRemove);

        return NoContent();
    }

    [HttpPost("{id:guid}/reset-password")]
    [Authorize(Policy = Policies.Usuarios_Admin)]
    public async Task<IActionResult> ResetPassword(Guid id, ResetPasswordRequest req)
    {
        var u = await _userManager.Users.FirstOrDefaultAsync(x => x.Id == id);
        if (u is null) return NotFound();
        var token = await _userManager.GeneratePasswordResetTokenAsync(u);
        var res = await _userManager.ResetPasswordAsync(u, token, req.NewPassword);
        if (!res.Succeeded) return BadRequest(new { message = string.Join("; ", res.Errors.Select(e => e.Description)) });
        return NoContent();
    }

    [HttpPost("{id:guid}/lock")]
    [Authorize(Policy = Policies.Usuarios_Admin)]
    public async Task<IActionResult> Lock(Guid id, LockRequest req)
    {
        var u = await _userManager.Users.FirstOrDefaultAsync(x => x.Id == id);
        if (u is null) return NotFound();
        if (req.Lock) u.LockoutEnd = DateTimeOffset.UtcNow.AddYears(100);
        else u.LockoutEnd = null;
        await _userManager.UpdateAsync(u);
        return NoContent();
    }

    private bool CanAccessUser(Guid userId)
    {
        if (User.IsInRole("Admin"))
            return true;

        var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub)
            ?? User.FindFirstValue("sub");

        return Guid.TryParse(currentUserId, out var currentUserGuid) && currentUserGuid == userId;
    }

    private bool TryGetCurrentTenantId(out Guid tenantId, out ActionResult? errorResult)
    {
        tenantId = _tenantProvider.CurrentTenantId ?? Guid.Empty;

        if (tenantId != Guid.Empty)
        {
            errorResult = null;
            return true;
        }

        errorResult = Unauthorized(new { message = "Tenant no encontrado o token invalido." });
        return false;
    }
}

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

using Opticsoft.Domain.Dtos;
using Opticsoft.Domain.Entities;
using Opticsoft.Infrastructure.Identity;
using Opticsoft.Infrastructure.Persistence;

namespace Opticsoft.Api.Controllers.Admin
{
    [ApiController]
    [Route("api/admin/[controller]")]
    [Authorize(Roles = "Admin")]
    public class TenantsController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly UserManager<AppUser> _userManager;
        private readonly RoleManager<IdentityRole<Guid>> _roleManager;

        public TenantsController(
            AppDbContext db,
            UserManager<AppUser> userManager,
            RoleManager<IdentityRole<Guid>> roleManager)
        {
            _db = db;
            _userManager = userManager;
            _roleManager = roleManager;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Tenant>>> GetAll()
        {
            var tenants = await _db.Tenants
                .AsNoTracking()
                .OrderBy(t => t.Nombre)
                .ToListAsync();

            return Ok(tenants);
        }

        [HttpPost]
        public async Task<ActionResult> Create([FromBody] CreateTenantRequest model)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            if (await _db.Tenants.AnyAsync(t => t.Dominio == model.Dominio))
                return BadRequest("Ya existe un tenant con ese dominio.");

            using var tx = await _db.Database.BeginTransactionAsync();
            try
            {
                // 1️⃣ Crear Tenant
                var tenant = new Tenant
                {
                    Id = Guid.NewGuid(),
                    Nombre = model.Nombre,
                    Dominio = model.Dominio,
                    CreadoEl = DateTime.UtcNow
                };
                _db.Tenants.Add(tenant);
                await _db.SaveChangesAsync();

                // 2️⃣ Crear Sucursal principal
                var sucursal = new Sucursal
                {
                    Id = Guid.NewGuid(),
                    Nombre = "Sucursal Principal",
                    Activa = true,
                    TenantId = tenant.Id
                };
                _db.Sucursales.Add(sucursal);
                await _db.SaveChangesAsync();

                // 3️⃣ Crear Usuario Administrador
                var admin = new AppUser
                {
                    Id = Guid.NewGuid(),
                    UserName = model.AdminEmail,
                    Email = model.AdminEmail,
                    FullName = model.AdminNombre,
                    EmailConfirmed = true,
                    TenantId = tenant.Id,
                    SucursalId = sucursal.Id,
                    CreatedAt = DateTime.UtcNow,
                    LastLoginAt = null
                };

                var createUser = await _userManager.CreateAsync(admin, model.AdminPassword);
                if (!createUser.Succeeded)
                    return BadRequest(createUser.Errors);

                if (!await _roleManager.RoleExistsAsync("Admin"))
                    await _roleManager.CreateAsync(new IdentityRole<Guid>("Admin"));

                await _userManager.AddToRoleAsync(admin, "Admin");

                await tx.CommitAsync();

                return Ok(new
                {
                    TenantId = tenant.Id,
                    TenantNombre = tenant.Nombre,
                    Dominio = tenant.Dominio,
                    Admin = new
                    {
                        admin.FullName,
                        admin.Email,
                        admin.Id
                    },
                    Sucursal = new
                    {
                        sucursal.Nombre,
                        sucursal.Id
                    },
                    CreadoEl = tenant.CreadoEl
                });

            }
            catch (Exception ex)
            {
                await tx.RollbackAsync();
                return StatusCode(500, $"Error al crear tenant: {ex.Message}");
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var tenant = await _db.Tenants.AsNoTracking()
                .Select(t => new {
                    t.Id,
                    t.Nombre,
                    t.Dominio,
                    t.CreadoEl,
                    Usuarios = _db.Users.Count(u => u.TenantId == t.Id),
                    Sucursales = _db.Sucursales.Count(s => s.TenantId == t.Id)
                })
                .FirstOrDefaultAsync(t => t.Id == id);

            if (tenant == null) return NotFound();
            return Ok(tenant);
        }

        [HttpGet("{id}/usuarios")]
        public async Task<IActionResult> GetUsuariosByTenant(Guid id)
        {
            var data = await _db.Users.AsNoTracking()
                .Where(u => u.TenantId == id)
                .Select(u => new { u.FullName, u.Email, Roles = new[] { "Admin" }, u.LastLoginAt })
                .ToListAsync();
            return Ok(data);
        }

        [HttpGet("{id}/sucursales")]
        public async Task<IActionResult> GetSucursalesByTenant(Guid id)
        {
            var data = await _db.Sucursales.AsNoTracking()
                .Where(s => s.TenantId == id)
                .Select(s => new { s.Nombre, s.Activa })
                .ToListAsync();
            return Ok(data);
        }

    }
}

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

using Opticsoft.Application.Common.Interfaces;
using Opticsoft.Domain.Dtos;
using Opticsoft.Domain.Entities;
using Opticsoft.Infrastructure.Persistence;

using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;

namespace Opticsoft.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SoporteController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly ILogger<SoporteController> _logger;
        private readonly ITenantProvider _tenantProvider;

        public SoporteController(AppDbContext db, ILogger<SoporteController> logger, ITenantProvider tenantProvider)
        {
            _db = db;
            _logger = logger;
            _tenantProvider = tenantProvider;
        }

        // POST /api/soporte
        [HttpPost]
        [Authorize]
        public async Task<ActionResult<object>> Crear([FromBody] SupportCreateRequest req)
        {
            if (!TryGetCurrentTenantId(out var tenantId, out var tenantError))
                return tenantError!;

            // 🔹 Obtener sucursal, usuario y nombre desde el token (igual que en otros controladores)
            string? GetClaim(params string[] types)
                => types.Select(t => User.FindFirst(t)?.Value)
                    .FirstOrDefault(v => !string.IsNullOrEmpty(v));

            var userIdStr = GetClaim(JwtRegisteredClaimNames.Sub, ClaimTypes.NameIdentifier, "sub");
            var userName = GetClaim("name", ClaimTypes.Name, JwtRegisteredClaimNames.UniqueName) ?? User.Identity?.Name;
            var userEmail = GetClaim(JwtRegisteredClaimNames.Email, ClaimTypes.Email, "email");

            if (string.IsNullOrWhiteSpace(userIdStr))
                return BadRequest("No se pudo identificar al usuario.");

            var userId = Guid.Parse(userIdStr);

            // 🔹 Usar el correo del request si se proporcionó, de lo contrario el del token
            var email = string.IsNullOrWhiteSpace(req.Email)
                ? (userEmail ?? "desconocido@local")
                : req.Email.Trim();

            var ticket = new SupportTicket
            {
                TenantId = tenantId,
                Id = Guid.NewGuid(),
                UserId = userId,
                Email = email,
                Asunto = req.Asunto.Trim(),
                Mensaje = req.Mensaje.Trim(),
                CreatedAt = DateTime.UtcNow,
                Estado = "Abierto"
            };

            _db.SupportTickets.Add(ticket);
            await _db.SaveChangesAsync();

            _logger.LogInformation("Nuevo ticket {Id} creado por {Email}", ticket.Id, ticket.Email);

            return Ok(new { folio = ticket.Id, createdAt = ticket.CreatedAt });
        }


        // GET /api/soporte (admin)
        [HttpGet]
        [Authorize(Policy = Opticsoft.Api.Auth.Policies.Usuarios_Admin)]
        public async Task<ActionResult<IEnumerable<SupportTicket>>> Listar(int take = 100)
        {
            var list = await _db.SupportTickets
                .AsNoTracking()
                .OrderByDescending(x => x.CreatedAt)
                .Take(take)
                .ToListAsync();
            return Ok(list);
        }

        [HttpGet("mis-tickets")]
        [Authorize]
        public async Task<ActionResult<IEnumerable<SupportTicket>>> MisTickets()
        {
            string? GetClaim(params string[] types)
                => types.Select(t => User.FindFirst(t)?.Value)
                    .FirstOrDefault(v => !string.IsNullOrEmpty(v));

            // Buscar el identificador de usuario en los claims más comunes
            var userIdStr = GetClaim(JwtRegisteredClaimNames.Sub, ClaimTypes.NameIdentifier, "sub");
            if (string.IsNullOrWhiteSpace(userIdStr) || !Guid.TryParse(userIdStr, out var userId))
                return Unauthorized("No se pudo identificar al usuario desde el token.");

            var tickets = await _db.SupportTickets
                .AsNoTracking()
                .Where(t => t.UserId == userId)
                .OrderByDescending(t => t.CreatedAt)
                .ToListAsync();

            return Ok(tickets);
        }

        // PUT /api/soporte/{id}/cerrar
        [HttpPut("{id:guid}/cerrar")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult> Cerrar(Guid id)
        {
            if (!TryGetCurrentTenantId(out var tenantId, out var tenantError))
                return tenantError!;

            var ticket = await _db.SupportTickets.FirstOrDefaultAsync(t => t.Id == id);
            if (ticket == null)
                return NotFound();

            if (ticket.TenantId == Guid.Empty)
                return Conflict(new { message = "El ticket persistido no tiene un TenantId valido." });

            if (ticket.TenantId != tenantId)
                return BadRequest(new { message = "El ticket no pertenece al tenant actual." });

            ticket.Estado = "Cerrado";
            await _db.SaveChangesAsync();
            return NoContent();
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
}

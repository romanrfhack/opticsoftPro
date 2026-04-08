using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

using Opticsoft.Infrastructure.Persistence;

namespace Opticsoft.Api.Controllers.Admin
{
    [ApiController]
    [Route("api/admin/[controller]")]
    [Authorize(Roles = "Admin")]
    public class DashboardController : ControllerBase
    {
        private readonly AppDbContext _db;

        public DashboardController(AppDbContext db)
        {
            _db = db;
        }

        // 🔹 RESUMEN GENERAL (KPI + CRECIMIENTO)
        [HttpGet("resumen")]
        public async Task<ActionResult<object>> GetResumen([FromQuery] int range = 30)
        {
            var ahora = DateTime.UtcNow;
            var inicioRangoActual = ahora.AddDays(-range);
            var inicioRangoAnterior = inicioRangoActual.AddDays(-range);

            // ===== Usuarios Nuevos =====
            var usuariosActual = await _db.Users
                .CountAsync(u => u.CreatedAt >= inicioRangoActual);
            var usuariosPrevios = await _db.Users
                .CountAsync(u => u.CreatedAt >= inicioRangoAnterior && u.CreatedAt < inicioRangoActual);

            double crecimientoUsuarios = usuariosPrevios > 0
                ? ((double)(usuariosActual - usuariosPrevios) / usuariosPrevios) * 100
                : 100;

            // ===== Tenants =====
            var tenantsActual = await _db.Tenants
                .CountAsync(t => t.CreadoEl >= inicioRangoActual);
            var tenantsPrevios = await _db.Tenants
                .CountAsync(t => t.CreadoEl >= inicioRangoAnterior && t.CreadoEl < inicioRangoActual);

            double crecimientoTenants = tenantsPrevios > 0
                ? ((double)(tenantsActual - tenantsPrevios) / tenantsPrevios) * 100
                : 100;

            // ===== Usuarios Activos =====
            var activosActual = await _db.Users
                .CountAsync(u => u.LastLoginAt != null && u.LastLoginAt >= inicioRangoActual);
            var activosPrevios = await _db.Users
                .CountAsync(u => u.LastLoginAt != null && u.LastLoginAt >= inicioRangoAnterior && u.LastLoginAt < inicioRangoActual);

            double crecimientoActivos = activosPrevios > 0
                ? ((double)(activosActual - activosPrevios) / activosPrevios) * 100
                : 100;

            // ===== Sucursales =====
            var sucursalesActual = await _db.Sucursales.CountAsync();
            var crecimientoSucursales = 0.0; // no se calcula aún de histórico, pero dejamos la estructura

            return Ok(new
            {
                UsuariosNuevos = usuariosActual,
                CrecimientoUsuarios = Math.Round(crecimientoUsuarios, 2),

                TenantsActivos = tenantsActual,
                CrecimientoTenants = Math.Round(crecimientoTenants, 2),

                UsuariosActivos = activosActual,
                CrecimientoActivos = Math.Round(crecimientoActivos, 2),

                Sucursales = sucursalesActual,
                CrecimientoSucursales = Math.Round(crecimientoSucursales, 2)
            });
        }

        // 🔹 CRECIMIENTO DE TENANTS POR DÍA
        [HttpGet("tenants-crecimiento")]
        public async Task<ActionResult<IEnumerable<object>>> GetTenantsCrecimiento([FromQuery] int range = 30)
        {
            var startDate = DateTime.UtcNow.Date.AddDays(-range);

            var data = await _db.Tenants
                .AsNoTracking()
                .Where(t => t.CreadoEl >= startDate)
                .GroupBy(t => t.CreadoEl.Date)
                .Select(g => new { Fecha = g.Key, Crecimiento = g.Count() })
                .OrderBy(g => g.Fecha)
                .ToListAsync();

            // Rellenar fechas vacías para continuidad
            var fechas = Enumerable.Range(0, range)
                .Select(i => startDate.AddDays(i))
                .Select(f => new
                {
                    Fecha = f,
                    Crecimiento = data.FirstOrDefault(x => x.Fecha == f)?.Crecimiento ?? 0
                });

            return Ok(fechas);
        }

        // 🔹 USUARIOS ACTIVOS POR DÍA (LastLoginAt)
        [HttpGet("usuarios-activos")]
        public async Task<ActionResult<IEnumerable<object>>> GetUsuariosActivos([FromQuery] int range = 30)
        {
            var startDate = DateTime.UtcNow.Date.AddDays(-range);

            var data = await _db.Users
                .AsNoTracking()
                .Where(u => u.LastLoginAt != null && u.LastLoginAt >= startDate)
                .GroupBy(u => u.LastLoginAt!.Value.Date)
                .Select(g => new { Fecha = g.Key, Activos = g.Count() })
                .OrderBy(g => g.Fecha)
                .ToListAsync();

            var fechas = Enumerable.Range(0, range)
                .Select(i => startDate.AddDays(i))
                .Select(f => new
                {
                    Fecha = f,
                    Activos = data.FirstOrDefault(x => x.Fecha == f)?.Activos ?? 0
                });

            return Ok(fechas);
        }

        // 🔹 LISTADO RESUMIDO DE TENANTS (para tabla inferior)
        [HttpGet("tenants-resumen")]
        public async Task<ActionResult> GetTenantsResumen()
        {
            var data = await _db.Tenants
                .AsNoTracking()
                .Select(t => new
                {
                    t.Id,
                    t.Nombre,
                    t.Dominio,
                    t.CreadoEl,
                    Usuarios = _db.Users.Count(u => u.TenantId == t.Id),
                    Sucursales = _db.Sucursales.Count(s => s.TenantId == t.Id),
                    UltimaActividad = _db.Users
                        .Where(u => u.TenantId == t.Id && u.LastLoginAt != null)
                        .Max(u => (DateTime?)u.LastLoginAt) ?? t.CreadoEl
                })
                .OrderByDescending(t => t.CreadoEl)
                .ToListAsync();

            return Ok(data);
        }
    }
}

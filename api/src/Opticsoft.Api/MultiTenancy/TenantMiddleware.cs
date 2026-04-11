using System.Threading.Tasks;

using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

using Opticsoft.Application.Common.Interfaces;

namespace Opticsoft.Api.MultiTenancy
{
    public class TenantMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<TenantMiddleware> _logger;

        public TenantMiddleware(RequestDelegate next, ILogger<TenantMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context, ITenantProvider tenantProvider)
        {
            var path = context.Request.Path.Value?.ToLowerInvariant();

            string[] publicPaths = new[]
            {
                "/api/auth/login",
                "/api/auth/register",
                "/api/auth/forgotpassword",
                "/swagger"
            };

            if (publicPaths.Any(p => path != null && path.StartsWith(p)))
            {
                _logger.LogInformation("🔓 Ruta pública detectada ({Path}), se omite validación de Tenant.", path);
                await _next(context);
                return;
            }

            if (tenantProvider.HasAuthenticatedUser)
            {
                var tenantId = await tenantProvider.ResolveTenantAsync();

                if (tenantId == null)
                {
                    _logger.LogWarning("⚠️ Solicitud sin TenantId detectado. Ruta: {Path}", path);
                    context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                    await context.Response.WriteAsync("Tenant no encontrado o token inválido.");
                    return;
                }

                _logger.LogInformation("✅ Tenant activo: {TenantId}", tenantId);
            }

            await _next(context);
        }
    }
}

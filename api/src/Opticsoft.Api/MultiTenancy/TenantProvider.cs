
using Microsoft.EntityFrameworkCore;
using Opticsoft.Application.Common.Interfaces;
using Opticsoft.Infrastructure.Persistence;

namespace Opticsoft.Api.MultiTenancy
{
    public class TenantProvider : ITenantProvider
    {
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly ILogger<TenantProvider> _logger;
        private Guid? _tenantId;

        public Guid? CurrentTenantId => _tenantId;

        public TenantProvider(IHttpContextAccessor httpContextAccessor, ILogger<TenantProvider> logger)
        {
            _httpContextAccessor = httpContextAccessor;
            _logger = logger;
        }

        public Task<Guid?> ResolveTenantAsync()
        {
            var user = _httpContextAccessor.HttpContext?.User;
            var tenantClaim = user?.FindFirst("tenantId")?.Value;

            if (Guid.TryParse(tenantClaim, out var parsed))
            {
                _tenantId = parsed;
                _logger.LogInformation("🟦 Tenant detectado por token: {TenantId}", _tenantId);
            }
            else
            {
                _logger.LogWarning("⚠️ No se detectó TenantId en el token JWT");
            }

            return Task.FromResult(_tenantId);
        }
    }
}

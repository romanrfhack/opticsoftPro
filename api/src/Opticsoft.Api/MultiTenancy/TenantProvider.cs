
using Opticsoft.Application.Common.Interfaces;

namespace Opticsoft.Api.MultiTenancy
{
    public class TenantProvider : ITenantProvider
    {
        private const string TenantClaimType = "tenantId";
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly ILogger<TenantProvider> _logger;
        private Guid? _tenantId;

        public Guid? CurrentTenantId => _tenantId;
        public bool HasAuthenticatedUser => _httpContextAccessor.HttpContext?.User?.Identity?.IsAuthenticated == true;

        public TenantProvider(IHttpContextAccessor httpContextAccessor, ILogger<TenantProvider> logger)
        {
            _httpContextAccessor = httpContextAccessor;
            _logger = logger;
        }

        public Task<Guid?> ResolveTenantAsync()
        {
            _tenantId = null;

            if (!HasAuthenticatedUser)
            {
                _logger.LogDebug("No se resuelve TenantId porque la solicitud actual no está autenticada.");
                return Task.FromResult<Guid?>(null);
            }

            var user = _httpContextAccessor.HttpContext?.User;
            var tenantClaim = user?.FindFirst(TenantClaimType)?.Value;

            if (string.IsNullOrWhiteSpace(tenantClaim))
            {
                _logger.LogWarning("⚠️ Solicitud autenticada sin claim {TenantClaimType}.", TenantClaimType);
                return Task.FromResult<Guid?>(null);
            }

            if (Guid.TryParse(tenantClaim, out var parsed) && parsed != Guid.Empty)
            {
                _tenantId = parsed;
                _logger.LogInformation("🟦 Tenant detectado por token: {TenantId}", _tenantId);
            }
            else
            {
                _logger.LogWarning("⚠️ Claim {TenantClaimType} inválido en solicitud autenticada: {TenantClaim}", TenantClaimType, tenantClaim);
            }

            return Task.FromResult(_tenantId);
        }
    }
}

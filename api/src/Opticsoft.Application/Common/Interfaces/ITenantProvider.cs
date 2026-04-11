namespace Opticsoft.Application.Common.Interfaces
{
    public interface ITenantProvider
    {
        Guid? CurrentTenantId { get; }
        bool HasAuthenticatedUser { get; }
        Task<Guid?> ResolveTenantAsync();
    }
}

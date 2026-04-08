namespace Opticsoft.Application.Common.Interfaces
{
    public interface ITenantProvider
    {
        Guid? CurrentTenantId { get; }
        Task<Guid?> ResolveTenantAsync();
    }
}

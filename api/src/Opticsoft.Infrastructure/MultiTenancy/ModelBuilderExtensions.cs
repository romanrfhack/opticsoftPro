using Microsoft.EntityFrameworkCore;
using System.Linq.Expressions;


namespace Opticsoft.Infrastructure.MultiTenancy
{
    public static class ModelBuilderExtensions
    {
        public static void ApplyTenantFilter<T>(this ModelBuilder builder, Guid tenantId) where T : class
        {
            var param = Expression.Parameter(typeof(T), "e");
            var prop = Expression.Property(param, "TenantId");
            var tenantValue = Expression.Constant(tenantId);
            var eq = Expression.Equal(prop, tenantValue);
            var lambda = Expression.Lambda<Func<T, bool>>(eq, param);

            builder.Entity<T>().HasQueryFilter(lambda);
        }
    }
}

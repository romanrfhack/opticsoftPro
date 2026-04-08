using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Opticsoft.Infrastructure.Persistence;

namespace Opticsoft.Infrastructure;
public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration cfg)
    {
        var cs = cfg.GetConnectionString("SqlServer")
                 ?? cfg["ConnectionStrings:SqlServer"];

        services.AddDbContext<AppDbContext>(options =>
            options.UseSqlServer(cs, sql =>
                sql.MigrationsAssembly(typeof(AppDbContext).Assembly.FullName))
        );

        return services;
    }
}


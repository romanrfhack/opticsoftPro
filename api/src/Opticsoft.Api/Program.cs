using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

using Opticsoft.Api.Auth;
using Opticsoft.Api.MultiTenancy;
using Opticsoft.Application.Common.Interfaces;
using Opticsoft.Domain.Entities;
using Opticsoft.Infrastructure;
using Opticsoft.Infrastructure.Identity;
using Opticsoft.Infrastructure.Persistence;

using System.IdentityModel.Tokens.Jwt;
using System.Text;
const string CorsLocal = "CorsLocal";
const string CorsProd = "CorsProd";
var builder = WebApplication.CreateBuilder(args);
builder.Services.AddInfrastructure(builder.Configuration);
JwtSecurityTokenHandler.DefaultMapInboundClaims = false;
builder.Services
    .AddIdentityCore<AppUser>(opt =>
    {
        opt.Password.RequiredLength = 6;
        opt.Password.RequireNonAlphanumeric = false;
        opt.Password.RequireUppercase = false;
        opt.User.RequireUniqueEmail = true;
    })
    .AddRoles<IdentityRole<Guid>>()
    .AddEntityFrameworkStores<AppDbContext>()
    .AddSignInManager<SignInManager<AppUser>>()
    .AddDefaultTokenProviders();
builder.Services.AddScoped<ITenantProvider, TenantProvider>();
builder.Services.AddScoped<JwtTokenService>();
builder.Services.AddCors(opts =>
{
    opts.AddPolicy(CorsLocal, b => b
        .WithOrigins("http://localhost:4200")
        .AllowAnyHeader()
        .AllowAnyMethod());

    opts.AddPolicy(CorsProd, b => b
        .WithOrigins("https://opticsoft.com.mx", "https://admin.opticsoft.com.mx")
        .AllowAnyHeader()
        .AllowAnyMethod());
});
builder.Services.Configure<JwtOptions>(builder.Configuration.GetSection(JwtOptions.SectionName));
var jwt = builder.Configuration.GetSection(JwtOptions.SectionName).Get<JwtOptions>()!;
builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(o =>
    {
        o.MapInboundClaims = false;
        o.TokenValidationParameters = new()
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwt.Issuer,
            ValidAudience = jwt.Audience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt.Key)),
            ClockSkew = TimeSpan.Zero
        };
    });
builder.Services.AddAuthorization(options => { Policies.Add(options); });
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "Opticsoft API", Version = "v1" });
    var jwtScheme = new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Description = "Bearer {token}",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        Reference = new OpenApiReference
        {
            Type = ReferenceType.SecurityScheme,
            Id = JwtBearerDefaults.AuthenticationScheme
        }
    };
    c.AddSecurityDefinition(jwtScheme.Reference.Id, jwtScheme);
    c.AddSecurityRequirement(new OpenApiSecurityRequirement { { jwtScheme, Array.Empty<string>() } });
});

builder.Services.AddHttpContextAccessor();

builder.Services.AddDataProtection()
    .PersistKeysToFileSystem(new DirectoryInfo("/var/www/opticsoft/api/keys"))
    .SetApplicationName("Opticsoft.Api");

var app = builder.Build();
app.UsePathBase("/api");

using (var scope = app.Services.CreateScope())
{
    var sp = scope.ServiceProvider;
    var db = sp.GetRequiredService<AppDbContext>();
    await db.Database.MigrateAsync();
    if (!await db.Users.AnyAsync())
        await SeedData(sp);
}

app.UseCors(app.Environment.IsDevelopment() ? CorsLocal : CorsProd);
app.UseSwagger();
app.UseSwaggerUI();
app.UseMiddleware<TenantMiddleware>();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.Run();

static async Task SeedData(IServiceProvider sp)
{
    var db = sp.GetRequiredService<AppDbContext>();
    if (!await db.Tenants.AnyAsync())
    {
        db.Tenants.Add(new Tenant
        {
            Id = Guid.Parse("00000000-0000-0000-0000-000000000001"),
            Nombre = "Opticsoft Default",
            Dominio = "localhost",
            CreadoEl = DateTime.UtcNow
        });
        await db.SaveChangesAsync();
    }

    var roleMgr = sp.GetRequiredService<RoleManager<IdentityRole<Guid>>>();
    var userMgr = sp.GetRequiredService<UserManager<AppUser>>();

    var roles = new[] { "Admin", "Vendedor", "Optometrista" };
    foreach (var role in roles)
        if (!await roleMgr.RoleExistsAsync(role))
            await roleMgr.CreateAsync(new IdentityRole<Guid>(role));

    var adminEmail = "admin@opticsoft.local";
    var admin = await userMgr.FindByEmailAsync(adminEmail);
    if (admin is null)
    {
        admin = new AppUser
        {
            Id = Guid.NewGuid(),
            UserName = "admin",
            Email = adminEmail,
            EmailConfirmed = true,
            FullName = "Administrador General",
            TenantId = Guid.Parse("00000000-0000-0000-0000-000000000001")
        };
        var result = await userMgr.CreateAsync(admin, "Admin123!");
        if (result.Succeeded)
            await userMgr.AddToRoleAsync(admin, "Admin");
    }
}

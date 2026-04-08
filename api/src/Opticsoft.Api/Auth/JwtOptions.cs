namespace Opticsoft.Api.Auth;
public sealed class JwtOptions
{
    public const string SectionName = "Jwt";
    public string Issuer { get; set; } = "OpticsoftApi";
    public string Audience { get; set; } = "OpticsoftWeb";
    public string Key { get; set; } = null!;
    public int AccessTokenMinutes { get; set; } = 60;
    public int RefreshTokenDays { get; set; } = 7;
}

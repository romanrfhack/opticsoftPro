namespace Opticsoft.Domain.Entities;

public sealed class Sucursal
{
    public Guid TenantId { get; set; }
    public Guid Id { get; set; }
    public string Nombre { get; set; } = null!;
    public bool Activa { get; set; } = true;
}
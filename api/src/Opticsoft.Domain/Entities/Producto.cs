using Opticsoft.Domain.Enums; namespace Opticsoft.Domain.Entities;

public sealed class Producto
{
    public Guid TenantId { get; set; }
    public Guid Id { get; set; }
    public string Sku { get; set; } = null!;
    public string Nombre { get; set; } = null!;
    public CategoriaProducto Categoria { get; set; }
    public bool Activo { get; set; } = true;
    public ICollection<Inventario> Inventarios { get; set; } = new List<Inventario>();
}
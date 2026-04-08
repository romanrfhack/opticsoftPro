using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Opticsoft.Domain.Entities
{
    public class Tenant
    {
        public Guid Id { get; set; }
        public string Nombre { get; set; } = default!;
        public string Dominio { get; set; } = default!; // ej. visionplus.opticsoft.app
        public string? Conexion { get; set; }            // opcional, si usas BD separada por cliente
        public DateTime CreadoEl { get; set; } = DateTime.UtcNow;
    }
}

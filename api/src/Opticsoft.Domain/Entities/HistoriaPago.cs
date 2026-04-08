using Opticsoft.Domain.Enums;

using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Opticsoft.Domain.Entities
{
    public class HistoriaPago
    {
        public Guid TenantId { get; set; }
        public Guid Id { get; set; }

        public Guid VisitaId { get; set; }
        public HistoriaClinicaVisita Visita { get; set; } = default!;

        public DateTime Fecha { get; set; } = DateTime.UtcNow;
        public MetodoPago Metodo { get; set; }     // Efectivo / Tarjeta
        public decimal Monto { get; set; }         // decimal(12,2)
        public string? Autorizacion { get; set; }  // folio/últimos 4 (tarjeta)
        public string? Nota { get; set; }
    }
}

using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Opticsoft.Domain.Dtos
{

    public class CreateTenantRequest
    {
        [Required, MaxLength(150)]
        public string Nombre { get; set; } = default!;

        [Required, MaxLength(150)]
        public string Dominio { get; set; } = default!;

        [Required, EmailAddress]
        public string AdminEmail { get; set; } = default!;

        [Required, MaxLength(150)]
        public string AdminNombre { get; set; } = default!;

        [Required, MinLength(6)]
        public string AdminPassword { get; set; } = "Admin123!"; // Default temporal
    }
}

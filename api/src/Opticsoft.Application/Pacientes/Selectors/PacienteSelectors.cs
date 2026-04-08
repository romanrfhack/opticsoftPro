using System.Linq.Expressions;
using Opticsoft.Application.Pacientes.Dtos;
using Opticsoft.Domain.Entities;

namespace Opticsoft.Application.Pacientes.Selectors
{
    public static class PacienteSelectors
    {
        public static readonly Expression<Func<Paciente, PacienteItem>> ToItem =
            p => new PacienteItem(
                p.Id,
                p.Nombre,
                p.Edad,
                p.Telefono,
                p.Ocupacion,
                p.SucursalIdAlta,
                p.SucursalAlta != null ? p.SucursalAlta.Nombre : null,
                p.FechaRegistro, // UTC (default en SQL)
                new CreadorDto(p.CreadoPorUsuarioId, p.CreadoPorNombre, p.CreadoPorEmail)
            );
    }
}
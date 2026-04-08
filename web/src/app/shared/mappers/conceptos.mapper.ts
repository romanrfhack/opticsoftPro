import { ConceptoCrearDto, TotalesCobro } from "../../features/ordenes/ordenes.models";


export function mapTotalesToConceptos(
  t: TotalesCobro,
  observaciones?: string | null
): ConceptoCrearDto[] {
  const obs = (observaciones?.trim() || null);

  const conceptos: ConceptoCrearDto[] = [
    { concepto: 'Consulta',          monto: t.consulta,         observaciones: obs },
    { concepto: 'Servicios',         monto: t.servicios,        observaciones: obs },
    { concepto: 'Materiales',        monto: t.materiales,       observaciones: obs },
    { concepto: 'Armazones',         monto: t.armazones,        observaciones: obs },
    { concepto: 'Lentes de contacto',monto: t.lentesContacto,   observaciones: obs },
  ];
  
  return conceptos.filter(c => (c.monto ?? 0) > 0);
}

export enum OrderStatus {
  CREADA = 0,
  REGISTRADA = 1,
  LISTAPARA_ENVIO = 2,
  EN_TRANSITO_A_SUCURSAL_MATRIZ = 3,
  RECIBIDA_EN_SUCURSAL_MATRIZ = 4,
  ENVIADA_A_LABORATORIO = 5,
  LISTA_EN_LABORATORIO = 6,
  EN_TRANSITO_DE_LABORATORIO_A_SUCURSAL_MATRIZ = 7,
  RECIBIDA_LISTA_EN_SUCURSAL_MATRIZ = 8,
  EN_TRANSITO_A_SUCURSAL_ORIGEN = 9,
  RECIBIDA_EN_SUCURSAL_ORIGEN = 10,
  ENTREGADA_AL_CLIENTE = 11
}
export const OrderStatusLabels: { [key in OrderStatus]: string } = {
  [OrderStatus.CREADA]: 'Creada',
  [OrderStatus.REGISTRADA]: 'Registrada',
  [OrderStatus.LISTAPARA_ENVIO]: 'Lista para envío',
  [OrderStatus.EN_TRANSITO_A_SUCURSAL_MATRIZ]: 'En tránsito a sucursal matriz',
  [OrderStatus.RECIBIDA_EN_SUCURSAL_MATRIZ]: 'Recibida en sucursal matriz => lab',
  [OrderStatus.ENVIADA_A_LABORATORIO]: 'Enviada a laboratorio',
  [OrderStatus.LISTA_EN_LABORATORIO]: 'Lista en laboratorio',
  [OrderStatus.EN_TRANSITO_DE_LABORATORIO_A_SUCURSAL_MATRIZ]: 'En tránsito de laboratorio a sucursal matriz',
  [OrderStatus.RECIBIDA_LISTA_EN_SUCURSAL_MATRIZ]: 'Recibida, lista en sucursal matriz',
  [OrderStatus.EN_TRANSITO_A_SUCURSAL_ORIGEN]: 'En tránsito a sucursal origen',
  [OrderStatus.RECIBIDA_EN_SUCURSAL_ORIGEN]: 'Recibida en sucursal origen',
  [OrderStatus.ENTREGADA_AL_CLIENTE]: 'Entregada al cliente'
};

export const STATUS_FLOW: OrderStatus[] = [
  OrderStatus.CREADA,
  OrderStatus.REGISTRADA,
  OrderStatus.LISTAPARA_ENVIO,
  OrderStatus.EN_TRANSITO_A_SUCURSAL_MATRIZ,
  OrderStatus.RECIBIDA_EN_SUCURSAL_MATRIZ,
  OrderStatus.ENVIADA_A_LABORATORIO,
  OrderStatus.LISTA_EN_LABORATORIO,
  OrderStatus.EN_TRANSITO_DE_LABORATORIO_A_SUCURSAL_MATRIZ,
  OrderStatus.RECIBIDA_LISTA_EN_SUCURSAL_MATRIZ,
  OrderStatus.EN_TRANSITO_A_SUCURSAL_ORIGEN,
  OrderStatus.RECIBIDA_EN_SUCURSAL_ORIGEN,
  OrderStatus.ENTREGADA_AL_CLIENTE
];

export interface VisitaCostoRow {
  id: string;
  fecha: string;         // ISO
  paciente: string;
  usuarioNombre: string;
  estado: OrderStatus | string | number;
  total?: number;
  aCuenta?: number;
  resta?: number;
  fechaUltimaActualizacion?: string; // ISO
  labTipo?: string;  
  labNombre?: string;
}

export interface PagedResultCE<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
}

export interface ChangeVisitaStatusRequest {
  toStatus: string;
  observaciones?: string
  labTipo?: string;
  labId?: string;
  labNombre?: string;
}

export interface TotalesCobro {
  consulta: number;
  servicios: number;
  materiales: number;
  armazones: number;
  lentesContacto: number;
  total: number;
}

/** Payload que emite (guardar) desde el componente de pagos. */
export interface GuardarTotalesEvent {
  visitaId: string | number;
  totales: TotalesCobro;
  observaciones: string;
}

//export type PagedResult<T> = { page: number; pageSize: number; total: number; items: T[]; };

export interface ConceptoCrearDto {
  concepto: string;
  monto: number;
  observaciones?: string | null;
}

export interface GuardarConceptosRequest {
  conceptos: ConceptoCrearDto[];
}

export interface GuardarConceptosResponse {
  visitaId: string;
  total: number;
  conceptos: { id: string; concepto: string; monto: number; timestampUtc: string }[];
}
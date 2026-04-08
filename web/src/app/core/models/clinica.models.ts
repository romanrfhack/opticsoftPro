export type Ojo = 'OD' | 'OI';
export type RxDistancia = 'Lejos' | 'Cerca';
export type CondicionAV = 'SinLentes' | 'ConLentes';
export type TipoLenteContacto = 'Esferico' | 'Torico' | 'Otro';
export type MetodoPago = 'Efectivo' | 'Tarjeta' | 'Transferencia';
export type EstadoHistoria = 'Guardado' | 'EnviadoLaboratorio' | 'Recibido' | 'Entregado' | 'Cancelado';

// Interface única para crear historia
export interface CrearHistoriaRequest {
  pacienteId: string;
  observaciones?: string | null;
  av: AgudezaDto[];
  rx: RxDto[];
  materiales: MaterialDto[];
  lentesContacto: LcDto[];
  armazones: ArmazonDto[];
  total: number;
}

export interface AgudezaDto {
  Condicion: string; // 'SinLentes' | 'ConLentes'
  Ojo: string; // 'OD' | 'OI'
  Denominador: number;
}

export interface RxDto {
  Ojo: string; // 'OD' | 'OI'
  Distancia: string; // 'Lejos' | 'Cerca'
  Esf?: number | null;
  Cyl?: number | null;
  Eje?: number | null;
  Add?: number | null;
  Dip?: string | null;
  AltOblea?: number | null;
}

export interface MaterialDto {
  materialId: string;
  observaciones?: string | null;
}

export interface LcDto {
  tipo: string; // 'Esferico' | 'Torico' | 'Otro'
  marca?: string | null;
  modelo?: string | null;
  observaciones?: string | null;
}

export interface ArmazonDto {
  productoId: string;
  observaciones?: string | null;
}

// Interfaces para respuestas (si las necesitas)
export interface HistoriaClinicaVisita {
  id: string;
  pacienteId: string;
  sucursalId: string;
  usuarioId: string;
  usuarioNombre: string;
  usuarioEmail: string;
  fecha: string;
  estado: EstadoHistoria;
  total?: number;
  aCuenta?: number;
  resta?: number;
  fechaEnvioLaboratorio?: string;
  fechaEstimadaEntrega?: string;
  fechaRecibidoSucursal?: string;
  fechaEntregaCliente?: string;
  observaciones?: string;
  agudezas: AgudezaVisual[];
  rx: RxMedicion[];
  materiales: PrescripcionMaterial[];
  lentesContacto: PrescripcionLenteContacto[];
  armazones: PrescripcionArmazon[];
}

export interface AgudezaVisual {
  id: string;
  visitaId: string;
  condicion: CondicionAV;
  ojo: Ojo;
  denominador: number;
}

export interface RxMedicion {
  id: string;
  visitaId: string;
  ojo: Ojo;
  distancia: RxDistancia;
  esf?: number | null;
  cyl?: number | null;
  eje?: number | null;
  add?: number | null;
  dip?: string | null;
  altOblea?: number | null;
}

export interface PrescripcionMaterial {
  id: string;
  visitaId: string;
  materialId: string;
  observaciones?: string | null;
}

export interface PrescripcionLenteContacto {
  id: string;
  visitaId: string;
  tipo: TipoLenteContacto;
  marca?: string | null;
  modelo?: string | null;
  observaciones?: string | null;
}

export interface PrescripcionArmazon {
  id: string;
  visitaId: string;
  productoId: string;
  observaciones?: string | null;
}
export interface Paciente {
  id: string;
  nombre: string;
  edad: number;
  telefono: string;
  ocupacion: string;
  direccion?: string | null;
}



export interface PacienteItem {
  id: string;
  nombre: string;
  edad: number;
  telefono: string;
  ocupacion: string;
  direccion?: string | null;
}

export interface CrearPacienteRequest {  
  nombre: string;
  edad: number;
  telefono: string;
  ocupacion: string;
  direccion?: string | null;
}

export interface UpdatePacienteRequest {
  id: string;
  nombre?: string;
  edad?: number;
  telefono?: string;
  ocupacion?: string;
  direccion?: string | null;
}

export type PacienteLite = { id: string; nombre: string; telefono?: string|null };

export type PacienteGridItem = {
  id: string; nombre: string; edad: number;
  telefono?: string|null; ocupacion?: string|null;
  ultimaVisitaFecha?: string|null; ultimaVisitaEstado?: string|null;
  ultimaVisitaTotal?: number|null; ultimaVisitaACuenta: number; ultimaVisitaResta: number;
  ultimoPagoFecha?: string|null; ultimoPagoMonto?: number|null;
  tieneOrdenPendiente: boolean;
};

export type PagedResult<T> = { page: number; pageSize: number; total: number; items: T[]; };



export interface MaterialItem {
  id: string;
  descripcion: string;
  marca?: string | null;
}

// Interfaces para materiales en historias - UNIFICADAS
export interface MaterialHistoriaDto {
  materialId: string;
  observaciones?: string | null;
}



export interface SucursalStockDto {
  sucursalId: string;
  nombreSucursal: string;
  stock: number;
}

export interface ArmazonesDto {
  id: string;
  sku: string;
  nombre: string;
  categoria: string;
  activo: boolean;
  stock: number;
  enSucursalActiva: boolean;
  sucursalesConStock: SucursalStockDto[];
}

// Interface para productos/armazones
export interface ProductDto {
  id: string;
  sku: string;
  nombre: string;
  categoria: string;
  activo: boolean;
}

// Interfaces para armazones en historias
export interface ArmazonHistoriaDto {
  productoId: string;
  observaciones?: string | null;
}

// Interface para mostrar armazones en el frontend
export interface ArmazonItem {
  productoId: string;
  sku: string;
  nombre: string;
  observaciones?: string | null;
}
export interface EnviarLabRequest {
  total: number;
  pagos?: { monto: number; metodo: MetodoPago; autorizacion?: string | null; nota?: string | null; }[];
  fechaEstimadaEntrega?: string | null; // ISO
}

// Interface para última visita (actualizada)
export interface UltimaHistoriaItem {
  id: string;
  fecha: string;
  estado: string;
  total?: number;
  aCuenta?: number;
  resta?: number;
  nombreSucursal: string;
  usuarioNombre: string;
}

// Interface para el detalle completo de visita
export interface VisitaCompleta {
  id: string;
  pacienteId: string;
  nombreSucursal: string; // ✅ NUEVO
  sucursalId: string;
  usuarioId: string;
  usuarioNombre: string;
  usuarioEmail: string;
  fecha: string;
  estado: EstadoHistoria;
  total?: number;
  aCuenta?: number;
  resta?: number;
  fechaEnvioLaboratorio?: string;
  fechaEstimadaEntrega?: string;
  fechaRecibidoSucursal?: string;
  fechaEntregaCliente?: string;
  observaciones?: string;
  
  // Relaciones
  paciente: Paciente;
  agudezas: AgudezaVisual[];
  rx: RxMedicion[];
  materiales: PrescripcionMaterialCompleto[];
  armazones: PrescripcionArmazonCompleto[];
  lentesContacto: PrescripcionLenteContacto[];
}

export interface PacienteDto {
  id: string;
  nombre: string;
  edad: number;
  telefono: string;
  ocupacion: string;
  direccion?: string;
}

// Interfaces para relaciones completas
export interface PrescripcionMaterialCompleto extends PrescripcionMaterial {
  material: MaterialItem;
}

export interface PrescripcionArmazonCompleto extends PrescripcionArmazon {
  producto: ProductDto;
}


export interface PagoRequest {
  metodo: string;
  monto: number;
  autorizacion?: string;
  nota?: string;
}

export interface PagoResponse {
  id: string;
  metodo: string;
  monto: number;
  autorizacion?: string;
  nota?: string;
  fecha: string;  
}

export interface StatusStepDto {
  fromStatus: string;
  toStatus: string;
  usuarioNombre: string;
  timestampUtc: string;
  observaciones?: string;
  labTipo?: string;
  labNombre?: string;
  tiempoTranscurrido: string;
}

export interface VisitaStatusHistoryDto {
  pacienteNombre: string;
  pacienteTelefono: string;
  sucursalNombre: string;
  usuarioAtendio: string;
  fechaVisita: string;
  estatus: StatusStepDto[];
}
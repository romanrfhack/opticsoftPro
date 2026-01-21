export interface Tenant {
  id: string;
  nombre: string;
  dominio: string;
  creadoEl: string;
  usuarios?: number;
  sucursales?: number;
}

export interface CreateTenantRequest {
  nombre: string;
  dominio: string;
  adminNombre: string;
  adminEmail: string;
  adminPassword: string;
}

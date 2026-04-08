import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { CreateTenantRequest, Tenant } from '../../core/models/tenant.model';

@Injectable({ providedIn: 'root' })
export class TenantsService {
  private http = inject(HttpClient);
  private base = `${environment.apiBaseUrl}/admin/tenants`;

  list() {
    return this.http.get<Tenant[]>(this.base);
  }

  create(model: CreateTenantRequest) {
    return this.http.post<Tenant>(this.base, model);
  }

  getById(id: string) {
    return this.http.get<Tenant>(`${this.base}/admin/tenants/${id}`);
  }

    getUsuariosByTenant(id: string) {
    return this.http.get<any[]>(`${this.base}/admin/tenants/${id}/usuarios`);
  }

    getSucursalesByTenant(id: string) {
    return this.http.get<any[]>(`${this.base}/admin/tenants/${id}/sucursales`);
  }

}


// src/app/core/productos.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';
//import { ArmazonesDto, PagedResult, ProductDto } from './models/clinica.models';
import { ChangeVisitaStatusRequest, GuardarConceptosRequest, GuardarConceptosResponse, PagedResultCE, VisitaCostoRow } from '../features/ordenes/ordenes.models';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class VisitasCostosService {
  private http = inject(HttpClient);
  private base = environment.apiBaseUrl;


  list(params: { page?: number; pageSize?: number; search?: string; estado?: string }) {
    const httpParams = new HttpParams({ fromObject: {
      page: params.page?.toString() ?? '1',
      pageSize: params.pageSize?.toString() ?? '20',
      ...(params.search ? { search: params.search } : {}),
      ...(params.estado ? { estado: params.estado } : {}),
    }});
    return this.http.get<PagedResultCE<VisitaCostoRow>>(this.base + '/historias/visitas-costos', { params: httpParams });
  }

  changeStatus(visitaId: string, nextStatus: ChangeVisitaStatusRequest) {
    return this.http.post(`${this.base}/historias/${visitaId}/status`, nextStatus);
  }

  guardarConceptos(visitaId: string | number, payload: GuardarConceptosRequest ): Observable<GuardarConceptosResponse> {
    return this.http.post<GuardarConceptosResponse>(`${this.base}/api/historias/${visitaId}/conceptos`, payload);
  }
}





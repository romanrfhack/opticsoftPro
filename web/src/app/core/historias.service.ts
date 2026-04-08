import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import {
  CrearHistoriaRequest, EnviarLabRequest, PacienteLite, PagoRequest, PagoResponse, UltimaHistoriaItem,
  VisitaCompleta,
  VisitaStatusHistoryDto
} from './models/clinica.models';
import { VisitaDetalle } from '../clinica/visita-detalle.component';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class HistoriasService {
  private http = inject(HttpClient);
  private base = environment.apiBaseUrl;  

  create(data: CrearHistoriaRequest): Observable<{ id: string }> {
  return this.http.post<{ id: string }>(`${this.base}/historias`, data);
}

  detalle(id: string) {
  return this.http.get<VisitaDetalle>(`${this.base}/visitas/${id}`);
}

  getById(id: string) {
    return this.http.get<any>(`${this.base}/historias/${id}`);
  }

  // ultimas(pacienteId: string, take = 5) {
  //   console.log("Fetching ultimas historias for pacienteId:", pacienteId, " with take:", take);
  //   return this.http.get<UltimaHistoriaItem[]>(`${this.base}/historias/ultimas/${pacienteId}`, { params: { take } as any });
  // }

  enviarALab(id: string, req: EnviarLabRequest) {
    return this.http.post<void>(`${this.base}/historias/${id}/enviar-lab`, req);
  }

  enLaboratorio(take = 100) {
    return this.http.get<any[]>(`${this.base}/historias/en-laboratorio`, { params: { take } as any });
  }  

  pacientesHeader(ids: string[]) {
    if (!ids || ids.length === 0) {
      return Promise.resolve([] as PacienteLite[]);
    }
    return this.http.post<PacienteLite[]>(`${this.base}/pacientes/lite-batch`, { ids }).toPromise();    
  }  

  historial(pacienteId: string, page: number, pageSize: number, estado?: string, from?: string, to?: string, soloPendientes?: boolean) {
    let params: any = { page: String(page), pageSize: String(pageSize) };
    if (estado) params.estado = estado;
    if (from) params.from = from;
    if (to) params.to = to;
    if (soloPendientes) params.soloPendientes = 'true';

    return this.http.get<{ page: number; pageSize: number; total: number; items: any[] }>(
      `${this.base}/pacientes/${pacienteId}/historial`, { params }
    ).toPromise();  
  }

  // Agregar estos métodos al servicio
  getVisitaCompletaById(id: string): Observable<VisitaCompleta> {
    return this.http.get<VisitaCompleta>(`${this.base}/${id}`);
  }

  getByPacienteId(pacienteId: string): Observable<UltimaHistoriaItem[]> {
    return this.http.get<UltimaHistoriaItem[]>(`${this.base}/historias/paciente/${pacienteId}`);
  }

  agregarPagos(VisitaId: string, pagos: PagoRequest[]) {
    return this.http.post<void>(`${this.base}/historias/${VisitaId}/pagos`, pagos);
  }

  // En historias.service.ts
obtenerPagos(historiaId: string) {
  return this.http.get<PagoResponse[]>(`${this.base}/historias/${historiaId}/pagos`);
}

// 🔹 Nuevo método
getStatusHistory(visitaId: string) {
  return this.http.get<VisitaStatusHistoryDto>(`${this.base}/historias/${visitaId}/status-history`);
}


}
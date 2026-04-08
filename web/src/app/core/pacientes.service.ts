import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { CrearPacienteRequest, Paciente, PacienteGridItem, PacienteItem, PacienteLite, PagedResult } from './models/clinica.models';

@Injectable({ providedIn: 'root' })
export class PacientesService {
  private http = inject(HttpClient);
  private base = environment.apiBaseUrl;

  search(term: string) {
    return this.http.get<PacienteItem[]>(`${this.base}/pacientes/search`, { params: { term } });
  }

  create(req: CrearPacienteRequest) {
    return this.http.post<PacienteItem>(`${this.base}/pacientes`, req);
  }

  getById(id: string) {
    return this.http.get<Paciente>(`${this.base}/pacientes/${id}`);
  }

  //https://localhost:59744/api/Pacientes/query?page=1&pageSize=20
  query(page: number, pageSize: number) {
    return this.http.get<PagedResult<PacienteGridItem>>(`${this.base}/pacientes/query`, { params: { page, pageSize } });
  }
   
  gridPaged(page: number, pageSize: number) {
    return this.http.get<PagedResult<PacienteGridItem>>(`${this.base}/pacientes/grid`, { params: { page, pageSize } });
  }

  gridItem(id: string) {
    return this.http.get<PacienteGridItem>(`${this.base}/pacientes/grid/${id}`);
  }
    
}


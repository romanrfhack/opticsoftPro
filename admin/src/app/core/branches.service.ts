import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface Branch {
  activa: boolean; id: string; nombre: string; 
}

@Injectable({ providedIn: 'root' })
export class BranchesService {
  private http = inject(HttpClient);
  private base = environment.apiBaseUrl;
  list() { return this.http.get<Branch[]>(`${this.base}/branches`); }
}

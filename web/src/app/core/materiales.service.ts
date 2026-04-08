import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { MaterialItem } from './models/clinica.models';

@Injectable({ providedIn: 'root' })
export class MaterialesService {
  private http = inject(HttpClient);
  private base = environment.apiBaseUrl;

  list() {
    return this.http.get<MaterialItem[]>(`${this.base}/materiales`);
  }
}

// src/app/core/productos.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { ArmazonesDto, ProductDto } from './models/clinica.models';

@Injectable({ providedIn: 'root' })
export class ProductosService {
  private http = inject(HttpClient);
  private base = environment.apiBaseUrl;

  getArmazones(q?: string) { 
    const params: any = {};
    if (q) params.q = q;
    return this.http.get<ArmazonesDto[]>(`${this.base}/products/armazones`, { params }); 
  }
}
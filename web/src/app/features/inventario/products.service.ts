import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

export interface Product {
  id: string; sku: string; nombre: string; categoria: string; activo: boolean;
}

@Injectable({ providedIn: 'root' })
export class ProductsService {
  private http = inject(HttpClient);
  private base = environment.apiBaseUrl;

  list(q = ''): Observable<Product[]> {
    const params = q ? { params: { q } } : {};
    return this.http.get<Product[]>(`${this.base}/products`, params);
  }
  create(body: { sku: string; nombre: string; categoria: string }) {
    return this.http.post<Product>(`${this.base}/products`, body);
  }
  update(id: string, body: { sku: string; nombre: string; categoria: string; activo: boolean }) {
    return this.http.put<Product>(`${this.base}/products/${id}`, body);
  }
  remove(id: string) {
    return this.http.delete<void>(`${this.base}/products/${id}`);
  }
}

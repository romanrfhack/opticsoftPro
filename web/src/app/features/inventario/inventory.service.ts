import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

export type CategoriaProducto = 'Armazon' | 'Accesorio' | 'Cristal' | 'LenteContacto' | 'Servicio' | 'Otro';

export interface InventorySearchItem {
  productId: string;
  sku: string;
  nombre: string;
  categoria: CategoriaProducto;
  sucursalId: string;          // sucursal a la que pertenece este stock
  sucursalNombre: string;
  stock: number;
  stockMin: number;
  shared: boolean;             // true si es Armazón (visible cross-branch)
  bajoMin: boolean;            // calculado por el back
}

@Injectable({ providedIn: 'root' })
export class InventoryService {
  private http = inject(HttpClient);
  private base = environment.apiBaseUrl;

  search(q: string): Observable<InventorySearchItem[]> {
    const params = new HttpParams().set('q', q ?? '');
    return this.http.get<InventorySearchItem[]>(`${this.base}/inventory/search`, { params });
  }
}

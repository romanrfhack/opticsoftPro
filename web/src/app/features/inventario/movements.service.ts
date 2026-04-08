import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export type MovementType = 'Entrada' | 'Salida' | 'Traslado';

@Injectable({ providedIn: 'root' })
export class MovementsService {
  private http = inject(HttpClient);
  private base = environment.apiBaseUrl;

  create(body: {
    tipo: MovementType;
    productoId: string;
    cantidad: number;
    motivo?: string;
    desdeSucursalId?: string;
    haciaSucursalId?: string;
  }) {
    return this.http.post<void>(`${this.base}/inventory/movements`, body);
  }
}

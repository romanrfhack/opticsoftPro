import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface SupportTicket {
  id: string;
  email: string;
  asunto: string;
  mensaje: string;
  createdAt: string;
  estado: string;
}

@Component({
  standalone: true,
  selector: 'app-soporte-admin',
  imports: [CommonModule],
  template: `
  <div class="p-6 max-w-5xl mx-auto bg-white rounded-2xl shadow-md border border-gray-200">
    <h2 class="text-2xl font-semibold text-gray-800 mb-4">Tickets de soporte</h2>

    <table class="min-w-full border-collapse text-sm">
      <thead class="bg-[#06b6d4]/10">
        <tr class="text-left text-gray-700">
          <th class="py-2 px-4 font-semibold">Folio</th>
          <th class="py-2 px-4 font-semibold">Email</th>
          <th class="py-2 px-4 font-semibold">Asunto</th>
          <th class="py-2 px-4 font-semibold">Fecha</th>
          <th class="py-2 px-4 font-semibold">Estado</th>
          <th class="py-2 px-4 font-semibold"></th>
        </tr>
      </thead>
      <tbody>
        <tr *ngFor="let t of tickets()" class="border-b border-gray-100 hover:bg-[#06b6d4]/5 transition-colors">
          <td class="py-2 px-4 font-mono text-gray-600">{{ t.id | slice:0:8 }}</td>
          <td class="py-2 px-4 text-gray-700">{{ t.email }}</td>
          <td class="py-2 px-4 text-gray-700">{{ t.asunto }}</td>
          <td class="py-2 px-4 text-gray-600">{{ t.createdAt | date:'yyyy-MM-dd HH:mm' }}</td>
          <td class="py-2 px-4">
            <span [class.bg-green-100]="t.estado === 'Cerrado'"
                  [class.bg-yellow-100]="t.estado === 'Abierto'"
                  class="px-3 py-1 rounded-full text-xs font-medium"
                  [class.text-green-700]="t.estado === 'Cerrado'"
                  [class.text-yellow-700]="t.estado === 'Abierto'">
              {{ t.estado }}
            </span>
          </td>
          <td class="py-2 px-4 text-right">
            <button *ngIf="t.estado === 'Abierto'" 
                    (click)="cerrar(t.id)"
                    class="text-sm text-white bg-[#06b6d4] hover:bg-[#0891b2] px-3 py-1 rounded-lg">
              Cerrar
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
  `
})
export class SoporteAdminComponent implements OnInit {
  private http = inject(HttpClient);
  tickets = signal<SupportTicket[]>([]);

  ngOnInit() {
    this.cargar();
  }

  cargar() {
    this.http.get<SupportTicket[]>(`${environment.apiBaseUrl}/soporte`)
      .subscribe({ next: (res) => this.tickets.set(res) });
  }

  cerrar(id: string) {
    this.http.put(`${environment.apiBaseUrl}/soporte/${id}/cerrar`, {})
      .subscribe({
        next: () => this.cargar(),
        error: () => alert('No se pudo cerrar el ticket.')
      });
  }
}

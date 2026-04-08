import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../auth/auth.service';

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
  selector: 'app-soporte-page',
  imports: [CommonModule, ReactiveFormsModule],
  template: `
  <div class="min-h-screen bg-gray-50 flex flex-col items-center py-10 px-4">
    <!-- CABECERA -->
    <div class="w-full max-w-3xl bg-white rounded-2xl shadow-md border border-gray-200 p-6 mb-6">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h1 class="text-2xl font-semibold text-gray-800">Soporte Técnico</h1>
          <p class="text-gray-500 text-sm">Reporta un problema o revisa tus tickets</p>
        </div>
        <button (click)="goLogin()" class="p-2 rounded-lg hover:bg-gray-100 focus:ring-2 focus:ring-[#06b6d4]">
          <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h20"/>
          </svg>
        </button>
      </div>

      <!-- FORMULARIO NUEVO TICKET -->
      <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Correo</label>
          <input type="email" formControlName="email" 
                 [value]="userEmail"
                 class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-[#06b6d4]" />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Asunto</label>
          <input type="text" formControlName="asunto"
                 class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-[#06b6d4]" />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Mensaje</label>
          <textarea rows="4" formControlName="mensaje"
                    class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-[#06b6d4]"></textarea>
        </div>

        <button type="submit"
                [disabled]="form.invalid || loading()"
                class="w-full rounded-lg bg-[#06b6d4] text-white py-2 font-medium hover:opacity-90 disabled:opacity-50 transition">
          {{ loading() ? 'Enviando…' : 'Enviar Ticket' }}
        </button>

        <p *ngIf="folio()" class="text-center text-sm text-green-600">Tu folio es: {{ folio() }}</p>
        <p *ngIf="error()" class="text-center text-sm text-red-600">{{ error() }}</p>
      </form>
    </div>

    <!-- LISTADO DE TICKETS -->
<div class="w-full max-w-3xl bg-white rounded-2xl shadow-md border border-gray-200 p-6">
  <h2 class="text-lg font-semibold text-gray-700 mb-4">Mis Tickets</h2>

  <ng-container *ngIf="tickets().length > 0; else noTickets">
    <table class="min-w-full border-collapse text-sm">
      <thead class="bg-[#06b6d4]/10">
        <tr class="text-left text-gray-700">
          <th class="py-2 px-4 font-semibold">Folio</th>
          <th class="py-2 px-4 font-semibold">Asunto</th>
          <th class="py-2 px-4 font-semibold">Fecha</th>
          <th class="py-2 px-4 font-semibold">Estado</th>
        </tr>
      </thead>
      <tbody>
        <tr *ngFor="let t of tickets()" 
            class="border-b border-gray-100 hover:bg-[#06b6d4]/5 transition-colors">
          <td class="py-2 px-4 font-mono text-gray-600">{{ t.id | slice:0:8 }}</td>
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
        </tr>
      </tbody>
    </table>
  </ng-container>

  <ng-template #noTickets>
    <div class="text-center py-10 text-gray-500 italic">
      {{ error() || 'Aún no tienes tickets registrados.' }}
    </div>
  </ng-template>
</div>

  </div>
  `
})
export class SoportePage implements OnInit {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private router = inject(Router);
  private auth = inject(AuthService);

  userEmail = '';
  loading = signal(false);
  folio = signal<string | null>(null);
  error = signal<string | null>(null);
  tickets = signal<SupportTicket[]>([]);

  form = this.fb.group({
    email: [''],
    asunto: ['', Validators.required],
    mensaje: ['', Validators.required]
  });

  ngOnInit() {
    const user = this.auth.user();
    this.userEmail = user?.email ?? '';
    this.form.controls.email.setValue(this.userEmail);
    this.cargarTickets();
  }

cargarTickets() {
  this.loading.set(true);
  this.error.set(null);

  this.http.get<SupportTicket[]>(`${environment.apiBaseUrl}/soporte/mis-tickets`)
    .subscribe({
      next: (res) => {
        this.tickets.set(res || []);
        this.loading.set(false);

        if (!res || res.length === 0) {
          this.error.set('Aún no tienes tickets registrados.');
        }
      },
      error: () => {
        this.loading.set(false);
        this.error.set('Ocurrió un error al cargar tus tickets.');
      }
    });
}

  submit() {
    if (this.form.invalid) return;
    this.loading.set(true); 
    this.error.set(null); 
    this.folio.set(null);
    this.http.post<any>(`${environment.apiBaseUrl}/soporte`, this.form.value).subscribe({
      next: res => {
        this.folio.set(res?.folio || null);
        this.cargarTickets();
        this.form.controls.asunto.reset();
        this.form.controls.mensaje.reset();
      },
      error: () => this.error.set('No se pudo enviar tu solicitud.'),
      complete: () => this.loading.set(false)
    });
  }

  goLogin() {  
    this.auth.isAuth() ? this.router.navigateByUrl('/dashboard') : this.router.navigateByUrl('/login');
  }
}

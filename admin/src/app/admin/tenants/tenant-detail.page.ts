import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe, NgIf, NgFor } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { TenantsService } from './tenants.service';
import { Toast } from '../../shared/ui/toast.service';
import { Tenant } from '../../core/models/tenant.model';

@Component({
  selector: 'app-tenant-detail',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    NgIf,
    NgFor,
    RouterLink,
    MatCardModule,
    MatTabsModule,
    MatIconModule,
    MatButtonModule
  ],
  template: `
  <div class="p-6 animate-fade-in">
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-3">
        <button mat-icon-button [routerLink]="['/admin/tenants']" matTooltip="Volver">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <h2 class="text-2xl font-semibold text-gray-700 flex items-center gap-2">
          <mat-icon color="primary">apartment</mat-icon>
          {{ tenant()?.nombre || 'Tenant' }}
        </h2>
      </div>

      <div>
        <button mat-flat-button color="accent" (click)="editar()">
          <mat-icon>edit</mat-icon>
          Editar
        </button>
      </div>
    </div>

    <!-- Datos principales -->
    <mat-card *ngIf="tenant(); else loading" class="mb-6 shadow-sm">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 text-sm text-gray-700">
        <div><strong>ID:</strong> {{ tenant()?.id }}</div>
        <div><strong>Dominio:</strong> {{ tenant()?.dominio }}</div>
        <div><strong>Creado el:</strong> {{ tenant()?.creadoEl | date:'medium' }}</div>
        <div><strong>Usuarios:</strong> {{ tenant()?.usuarios ?? 0 }}</div>
        <div><strong>Sucursales:</strong> {{ tenant()?.sucursales ?? 0 }}</div>
      </div>
    </mat-card>

    <!-- Tabs -->
    <mat-card>
      <mat-tab-group>
        <!-- TAB 1 -->
        <mat-tab label="Usuarios">
          <div class="p-4">
            <table class="min-w-full text-sm" *ngIf="usuarios.length; else noUsuarios">
              <thead class="bg-gray-100 text-gray-600 uppercase text-xs">
                <tr>
                  <th class="p-3 text-left">Nombre</th>
                  <th class="p-3 text-left">Correo</th>
                  <th class="p-3 text-left">Rol</th>
                  <th class="p-3 text-left">Último acceso</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let u of usuarios" class="border-t hover:bg-gray-50">
                  <td class="p-3">{{ u.fullName }}</td>
                  <td class="p-3">{{ u.email }}</td>
                  <td class="p-3">{{ u.roles?.join(', ') || '-' }}</td>
                  <td class="p-3">{{ u.lastLoginAt | date:'short' }}</td>
                </tr>
              </tbody>
            </table>
            <ng-template #noUsuarios>
              <p class="text-gray-500 italic text-center p-4">No hay usuarios registrados.</p>
            </ng-template>
          </div>
        </mat-tab>

        <!-- TAB 2 -->
        <mat-tab label="Sucursales">
          <div class="p-4">
            <table class="min-w-full text-sm" *ngIf="sucursales.length; else noSuc">
              <thead class="bg-gray-100 text-gray-600 uppercase text-xs">
                <tr>
                  <th class="p-3 text-left">Nombre</th>
                  <th class="p-3 text-left">Activa</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let s of sucursales" class="border-t hover:bg-gray-50">
                  <td class="p-3">{{ s.nombre }}</td>
                  <td class="p-3">
                    <mat-icon [style.color]="s.activa ? '#10b981' : '#ef4444'">
                      {{ s.activa ? 'check_circle' : 'cancel' }}
                    </mat-icon>
                  </td>
                </tr>
              </tbody>
            </table>
            <ng-template #noSuc>
              <p class="text-gray-500 italic text-center p-4">No hay sucursales registradas.</p>
            </ng-template>
          </div>
        </mat-tab>

        <!-- TAB 3 -->
        <mat-tab label="Resumen">
          <div class="p-4 text-sm text-gray-600">
            <p>📊 <strong>Tenant:</strong> {{ tenant()?.nombre }}</p>
            <p>🌐 <strong>Dominio:</strong> {{ tenant()?.dominio }}</p>
            <p>🕒 Última actualización: {{ now | date:'medium' }}</p>
          </div>
        </mat-tab>
      </mat-tab-group>
    </mat-card>

    <ng-template #loading>
      <div class="text-center text-gray-400 italic mt-6">Cargando información...</div>
    </ng-template>
  </div>
  `,
  styles: [`
    mat-card { border: 1px solid #e5e7eb; }
    .animate-fade-in { animation: fadeIn .4s ease-in; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
  `]
})
export class TenantDetailPage implements OnInit {
  private route = inject(ActivatedRoute);
  private svc = inject(TenantsService);
  private toast = inject(Toast);

  tenant = signal<Tenant | null>(null);
  usuarios: any[] = [];
  sucursales: any[] = [];
  now = new Date();

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    try {
      const t = await this.svc.getById(id).toPromise();
      this.tenant.set(t!);

      // Cargar usuarios y sucursales (ajustar endpoints según tu API)
      this.usuarios = (await this.svc.getUsuariosByTenant(id).toPromise()) ?? [];
      this.sucursales = (await this.svc.getSucursalesByTenant(id).toPromise()) ?? [];
    } catch (err) {
      console.error(err);
      this.toast.err('Error al cargar detalles del tenant');
    }
  }

  editar() {
    this.toast.ok(`✏️ Modo edición activado para "${this.tenant()?.nombre}"`);
  }
}

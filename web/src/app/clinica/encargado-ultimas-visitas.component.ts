import { Component, ChangeDetectionStrategy, inject, signal, effect, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { of, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';

import { HistoriasService } from '../core/historias.service';
import { UltimaHistoriaItem } from '../core/models/clinica.models';
import { VisitaDetalleModalComponent } from './components/visita-detalle-modal.component';

export interface Visita {
  id: string;
  fecha: string | Date;
  estado: string;
  total: number;
  resta: number;
  nombreSucursal: string; // ✅ CAMBIADO
  usuarioNombre: string;
}

@Component({
  standalone: true,
  selector: 'app-encargado-ultimas-visitas',
  imports: [CommonModule, MatTableModule, MatButtonModule, MatIconModule],
  template: `
    <div class="text-sm font-semibold mb-2">Últimas visitas</div>

<div class="w-full overflow-x-auto rounded-lg border border-gray-200">
  <table mat-table [dataSource]="rows()" class="w-full text-sm min-w-full"
         *ngIf="rows().length; else empty">
    <!-- Columna Fecha -->
    <ng-container matColumnDef="fecha">
      <th mat-header-cell *matHeaderCellDef class="whitespace-nowrap px-4 py-2">Fecha</th>
      <td mat-cell *matCellDef="let r" class="whitespace-nowrap px-4 py-2">{{ r.fecha | date:'dd/MM/yy' }}</td>
    </ng-container>

    <!-- Columna Sucursal -->
    <ng-container matColumnDef="sucursal">
      <th mat-header-cell *matHeaderCellDef class="whitespace-nowrap px-4 py-2">Sucursal</th>
      <td mat-cell *matCellDef="let r" class="whitespace-nowrap px-4 py-2">{{ r.nombreSucursal }}</td>
    </ng-container>

    <!-- Columna Atendió -->
    <ng-container matColumnDef="usuario">
      <th mat-header-cell *matHeaderCellDef class="whitespace-nowrap px-4 py-2">Atendió</th>
      <td mat-cell *matCellDef="let r" class="whitespace-nowrap px-4 py-2">{{ r.usuarioNombre }}</td>
    </ng-container>

    <!-- Columna Acciones -->
    <ng-container matColumnDef="acciones">
      <th mat-header-cell *matHeaderCellDef class="whitespace-nowrap px-4 py-2"></th>
      <td mat-cell *matCellDef="let r" class="whitespace-nowrap px-4 py-2">
        <button mat-icon-button 
                (click)="verDetalle(r.id)"
                title="Ver detalle de la visita"
                class="text-cyan-600 hover:text-cyan-700">
          <mat-icon>visibility</mat-icon>
        </button>
      </td>
    </ng-container>

    <tr mat-header-row *matHeaderRowDef="cols"></tr>
    <tr mat-row *matRowDef="let row; columns: cols; trackBy: trackById"></tr>
  </table>
</div>

<ng-template #empty>
  <div class="text-sm text-gray-500">Aún no hay visitas para este paciente.</div>
</ng-template>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    table {
      width: 100%;
      border-radius: 0.375rem;
      overflow: hidden;
    }
    th.mat-header-cell {
      background-color: #f9fafb;
      font-weight: 600;
    }
    td.mat-cell, th.mat-header-cell {
      padding: 0.5rem 1rem;
    }
    tr.mat-row:nth-child(even) {
      background-color: #f3f4f6;
    }

    /* En styles.css o el archivo global */
    .visita-detalle-modal .mat-dialog-container {
      padding: 0;
      border-radius: 12px;
    }

    .visita-detalle-modal .mat-tab-group {
      font-family: inherit;
    }

    .visita-detalle-modal .mat-tab-label {
      min-width: 120px;
    }
  `]
})
export class EncargadoUltimasVisitasComponent {
  private api = inject(HistoriasService);
  private dialog = inject(MatDialog);

  pacienteId = input<string | null>(null);
  rows = signal<Visita[]>([]);  
  cols = ['fecha', 'sucursal', 'usuario', 'acciones'] as const;

  private _loadEff = effect((onCleanup) => {
    const id = this.pacienteId();
    
    if (!id) {
      this.rows.set([]);
      return;
    }

  const sub: Subscription = of(id)
    .pipe(switchMap(pid => this.api.getByPacienteId(pid) ?? of([])))
    .subscribe({
      next: (items: UltimaHistoriaItem[] = []) => {
        console.log("Ultimas visitas fetched:", items);
        const visitas: Visita[] = (items ?? []).map(item => ({
          id: item.id,
          fecha: item.fecha,
          estado: item.estado,
          total: item.total ?? 0,
          resta: item.resta ?? 0,
          nombreSucursal: item.nombreSucursal,
          usuarioNombre: item.usuarioNombre
        }));
          console.log("Mapped visitas:", visitas);
          this.rows.set(visitas);
        },
        error: () => this.rows.set([]),
      });
    onCleanup(() => sub.unsubscribe());
  });


  verDetalle(visitaId: string): void {
    console.log("Ver detalle de visita -encargado-:", visitaId);
    this.api.getById(visitaId).subscribe({
      next: (visitaCompleta) => {
        this.dialog.open(VisitaDetalleModalComponent, {
          width: '95vw',
          maxWidth: '1200px',
          height: '95vh',
          data: visitaCompleta,
          panelClass: 'visita-detalle-modal'
        });
      },
      error: (err) => {
        console.error('Error al cargar detalle de visita:', err);
      }
    });
  }

  trackById = (_: number, v: Visita) => v.id;
}
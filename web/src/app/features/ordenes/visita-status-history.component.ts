import { Component, inject, OnInit, signal, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { HistoriasService } from '../../core/historias.service';
import { VisitaStatusHistoryDto } from '../../core/models/clinica.models';

@Component({
  standalone: true,
  selector: 'app-visita-status-history',
  imports: [CommonModule, MatIconModule, MatDialogModule],
  template: `
  <div class="relative p-6 max-w-5xl mx-auto bg-white rounded-2xl shadow-lg border border-gray-200">

    <!-- BOTÓN CERRAR -->
    <button (click)="cerrar()" 
            class="absolute top-4 right-4 text-[#06b6d4] hover:text-[#0891b2] transition-colors">
      <mat-icon fontIcon="close" class="text-2xl"></mat-icon>
    </button>

    <!-- ENCABEZADO -->
    <div class="flex items-center justify-between border-b border-[#06b6d4]/30 pb-3 mb-4">
      <h2 class="text-xl font-semibold text-gray-800 flex items-center gap-2">
        <mat-icon fontIcon="timeline" class="text-[#06b6d4] text-3xl"></mat-icon>
        Historial de estatus
      </h2>
    </div>

    <!-- CONTENIDO -->
    <ng-container *ngIf="data() as d; else loading">
      <!-- Datos generales -->
      <div class="grid sm:grid-cols-2 md:grid-cols-3 gap-3 mb-6 text-sm">
        <div class="p-3 rounded-xl border border-[#06b6d4]/30 bg-[#06b6d4]/5">
          <p class="font-semibold text-[#06b6d4]">Paciente</p>
          <p class="text-gray-800">{{ d.pacienteNombre }}</p>
          <p class="text-gray-500">{{ d.pacienteTelefono }}</p>
        </div>
        <div class="p-3 rounded-xl border border-[#06b6d4]/30 bg-[#06b6d4]/5">
          <p class="font-semibold text-[#06b6d4]">Sucursal</p>
          <p class="text-gray-800">{{ d.sucursalNombre }}</p>
        </div>
        <div class="p-3 rounded-xl border border-[#06b6d4]/30 bg-[#06b6d4]/5">
          <p class="font-semibold text-[#06b6d4]">Atendió</p>
          <p class="text-gray-800">{{ d.usuarioAtendio }}</p>
          <p class="text-gray-500">{{ d.fechaVisita | date:'yyyy-MM-dd HH:mm' }}</p>
        </div>
      </div>

      <!-- Tabla de estatus -->
      <div class="overflow-x-auto rounded-xl border border-gray-200">
        <table class="min-w-full border-collapse">
          <thead class="bg-[#06b6d4]/10">
            <tr class="text-left text-sm text-gray-700">
              <th class="py-2 px-4 font-semibold border-b border-[#06b6d4]/30">De</th>
              <th class="py-2 px-4 font-semibold border-b border-[#06b6d4]/30">A</th>
              <th class="py-2 px-4 font-semibold border-b border-[#06b6d4]/30">Usuario</th>
              <th class="py-2 px-4 font-semibold border-b border-[#06b6d4]/30">Fecha</th>
              <th class="py-2 px-4 font-semibold border-b border-[#06b6d4]/30">Tiempo</th>
              <th class="py-2 px-4 font-semibold border-b border-[#06b6d4]/30">Notas</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let e of d.estatus"
                class="hover:bg-[#06b6d4]/5 transition-colors border-b border-gray-100">
              <td class="py-2 px-4 text-gray-700 font-medium">{{ e.fromStatus }}</td>
              <td class="py-2 px-4 text-gray-700">{{ e.toStatus }}</td>
              <td class="py-2 px-4 text-gray-700 flex items-center gap-2">
                <mat-icon fontIcon="person" class="text-[#06b6d4] text-base"></mat-icon>
                {{ e.usuarioNombre }}
              </td>
              <td class="py-2 px-4 text-gray-600">{{ e.timestampUtc | date:'yyyy-MM-dd HH:mm' }}</td>
              <td class="py-2 px-4 text-[#06b6d4] font-semibold">{{ e.tiempoTranscurrido }}</td>
              <td class="py-2 px-4 text-gray-500 italic">
                {{ e.observaciones || '—' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </ng-container>

    <!-- Cargando -->
    <ng-template #loading>
      <div class="text-center py-10 text-gray-400 italic">Cargando historial...</div>
    </ng-template>
  </div>
  `,
})
export class VisitaStatusHistoryComponent implements OnInit {
  private historias = inject(HistoriasService);
  private dialogRef = inject(MatDialogRef<VisitaStatusHistoryComponent>);
  data = signal<VisitaStatusHistoryDto | null>(null);

  constructor(@Inject(MAT_DIALOG_DATA) private dialogData: { visitaId: string }) {}

  ngOnInit() {
    const visitaId = this.dialogData.visitaId;
    if (!visitaId) return;
    this.historias.getStatusHistory(visitaId).subscribe({
      next: (res) => this.data.set(res),
      error: (err) => console.error('Error al cargar historial de estatus:', err)
    });
  }

  cerrar() {
    this.dialogRef.close();
  }
}

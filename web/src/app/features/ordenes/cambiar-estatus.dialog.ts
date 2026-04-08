// cambiar-estatus.dialog.ts (standalone)
import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { OrderStatus, OrderStatusLabels, STATUS_FLOW,  } from './ordenes.models';

// Interfaz para los datos de entrada
export interface CambiarEstatusDialogData {
  visitaId: string;
  fromStatus: number; 
  allowed: number[];  
  fecha: string;
  usuarioNombre: string;
  Paciente: string;  
}

@Component({
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatFormFieldModule, MatSelectModule, MatInputModule, MatButtonModule,
    MatDividerModule, MatIconModule
  ],
  template: `
  <div class="p-1 md:p-2 max-w-[640px]">
    <h2 mat-dialog-title class="text-xl font-semibold">Cambiar estatus - {{ data.Paciente }}</h2>
    <h3 mat-dialog-title class="text-md">Último estatus actualizado: {{ getFechaHora(data.fecha) }} por {{ data.usuarioNombre }}</h3>

    <div mat-dialog-content class="space-y-4">

      <!-- Resumen actual → siguiente -->
      <div class="rounded-xl border border-gray-200 p-3 md:p-4 bg-gray-50">
        <div class="flex items-center gap-2 md:gap-3 flex-wrap">
          <span class="chip chip-current" [title]="'Estatus actual'">
            {{ getEstadoNombre(data.fromStatus) }}
          </span>
          <mat-icon class="text-gray-400">arrow_forward</mat-icon>
          <span class="chip chip-next" [title]="'Siguiente sugerido'">
            {{ getEstadoNombre(suggestedNext) || '—' }}
          </span>
        </div>
        <div class="text-xs text-gray-500 mt-2">
          Sugerido según el flujo de estados definido.
        </div>
      </div>

      <mat-divider></mat-divider>

      <!-- Selector de estado (si hay más de una opción) -->
      <div *ngIf="data.allowed.length > 1" class="rounded-lg border border-blue-200 bg-blue-50 p-3">
        <div class="flex items-center gap-2 mb-2">
          <mat-icon>swap_horiz</mat-icon>
          <div class="font-medium">Seleccionar estado destino</div>
        </div>
        
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Estado destino</mat-label>
          <mat-select [(ngModel)]="toStatus">
            <mat-option *ngFor="let status of data.allowed" [value]="status">
              {{ getEstadoNombre(status) }}
            </mat-option>
          </mat-select>
        </mat-form-field>
      </div>

      <!-- Campos de laboratorio (solo si aplica) -->
      <ng-container *ngIf="requiereLab()">
        <div class="rounded-lg border border-cyan-200 bg-cyan-50 p-3">
          <div class="flex items-center gap-2 mb-2">
            <mat-icon>science</mat-icon>
            <div class="font-medium">Detalles de laboratorio</div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <mat-label>Tipo de laboratorio</mat-label>
            <mat-form-field appearance="outline" class="w-full">
              <mat-select [(ngModel)]="labTipo" (ngModelChange)="onLabTipoChange()" required>
                <mat-option value="Interno">Interno</mat-option>
                <mat-option value="Externo">Externo</mat-option>
              </mat-select>
              <mat-error *ngIf="requiereLab() && !labTipo">
                Tipo de laboratorio es requerido
              </mat-error>
            </mat-form-field>

            <mat-label>Nombre del laboratorio</mat-label>
            <mat-form-field appearance="outline" class="w-full">
              <input matInput [(ngModel)]="labNombre"/>
              <mat-hint *ngIf="labTipo !== ''">                
              </mat-hint>
            </mat-form-field>
          </div>
        </div>
      </ng-container>

      <!-- Observaciones -->
      <mat-label>Observaciones</mat-label>
      <mat-form-field appearance="outline" class="w-full">
        <textarea matInput rows="3" [(ngModel)]="observaciones" 
                  placeholder="Motivo, notas o contexto del cambio"></textarea>
        <mat-hint>Queda registrado en el historial de estatus.</mat-hint>
      </mat-form-field>
    </div>

    <div mat-dialog-actions class="justify-end gap-2">
      <button mat-stroked-button (click)="close()">Cancelar</button>
      <button mat-flat-button color="primary" 
              (click)="save()" 
              [disabled]="!canSave()">
        Guardar
      </button>
    </div>
  </div>
  `,
  styles: [`
    .chip {
      display: inline-flex; align-items: center; gap: .5rem;
      padding: .35rem .75rem; border-radius: 9999px;
      font-weight: 600; font-size: .85rem;
    }
    .chip-current {
      border: 1px solid #cbd5e1; background: #f1f5f9; color: #334155;
    }
    .chip-next {
      border: 1px solid #22d3ee; background: #ecfeff; color: #0e7490;
    }
  `]
})
export class CambiarEstatusDialog {
  // Estado elegido por el usuario (NÚMERO)
  toStatus: number;

  // Datos laboratorio/observaciones
  labTipo: 'Interno' | 'Externo' | '' = '';
  labNombre = '';
  observaciones = '';

  // Siguiente sugerido según STATUS_FLOW (NÚMERO)
  suggestedNext: number;

  // Índice del estado "Enviada a laboratorio" (para validaciones)
  private readonly ENVIADA_LABORATORIO_INDEX = 5;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: CambiarEstatusDialogData,
    private ref: MatDialogRef<CambiarEstatusDialog>
  ) {
    console.log("Datos recibidos en CambiarEstatusDialog:", data);
    // Calcular el siguiente estado en el flujo
    this.suggestedNext = data.fromStatus + 1;

    // Verificar si el siguiente estado está dentro del flujo válido
    const isValidNext = this.suggestedNext >= 0 && this.suggestedNext <= OrderStatus.ENTREGADA_AL_CLIENTE;
    
    // Seleccionar estado por defecto
    if (isValidNext && this.data.allowed.includes(this.suggestedNext)) {
      this.toStatus = this.suggestedNext;
    } else if (this.data.allowed?.length) {
      this.toStatus = this.data.allowed[0];
    } else {
      this.toStatus = data.fromStatus; // Mantener estado actual si no hay opciones
    }
  }

  // Nuevo método para manejar el cambio de tipo de laboratorio
  onLabTipoChange(): void {
    if (this.labTipo === 'Interno') {
      this.labNombre = 'Tlahuac';
    } else if (this.labTipo === 'Externo') {
      this.labNombre = 'Externo';
    } else {
      this.labNombre = '';
    }
  }

  getFechaHora(fechaStr: string): string {
    if (!fechaStr) return 'N/A';
    const fecha = new Date(fechaStr);
    console.log("Fecha parseada:", fecha);
    // Hora central pero quiero hora local cdmx
    const opciones: Intl.DateTimeFormatOptions = { timeZone: 'America/Mexico_City' };
    console.log("Fecha formateada:", fecha.toLocaleString('es-MX', opciones));
    return fecha.toLocaleString('es-MX', opciones); // Formato local
  }

  // Verificar si el estado seleccionado requiere datos de laboratorio
  requiereLab(): boolean {
    return this.toStatus === this.ENVIADA_LABORATORIO_INDEX;
  }

  // Validar si se puede guardar
  canSave(): boolean {
    const hasTarget = this.toStatus !== undefined && this.toStatus !== this.data.fromStatus;
    const labOk = !this.requiereLab() || (this.requiereLab() && !!this.labTipo);
    return hasTarget && labOk;
  }

  // Obtener el nombre del estado a partir del número
  getEstadoNombre(estadoIndex: number): string {
    if (estadoIndex >= 0 && estadoIndex < STATUS_FLOW.length) {
      return OrderStatusLabels[STATUS_FLOW[estadoIndex]];
    }
    return 'Desconocido';
  }

  save() {
    this.ref.close({
      toStatus: this.toStatus, // ← Enviamos el NÚMERO al backend
      observaciones: this.observaciones || undefined,
      labTipo: this.requiereLab() ? this.labTipo : undefined,
      labNombre: this.requiereLab() ? (this.labNombre || undefined) : undefined
    });
  }

  close() { 
    this.ref.close(); 
  }
}
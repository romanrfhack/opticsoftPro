

import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { SignoPositivoPipe } from '../../shared/tools/signo-positivo.pipe';

@Component({
  standalone: true,
  selector: 'app-rx-form',
  imports: [
    CommonModule, FormsModule,
    MatCardModule, MatIconModule,
    SignoPositivoPipe // ← Agrega el pipe aquí
  ],
  template: `
    <mat-card class="form-card">
      <mat-card-header class="border-b border-gray-100 pb-3 mb-3">
        <mat-card-title class="flex items-center gap-2 text-base font-semibold">
          <mat-icon [style.color]="'#06b6d4'" class="text-primary" style="width: 18px; height: 18px; font-size: 18px;">healing</mat-icon>
          R.X. - Prescripción
        </mat-card-title>
        <mat-card-subtitle class="text-gray-600 text-xs">
          Valores de lejos y cerca • Cálculo automático
        </mat-card-subtitle>
      </mat-card-header>

      <mat-card-content>
        <!-- Resumen de estado -->
        <div *ngIf="hasAnyError()" class="mb-2 p-1 bg-red-50 border border-red-200 rounded text-xs">
          <div class="flex items-center gap-1 text-red-700">
            <mat-icon class="text-red-500" style="width: 12px; height: 12px; font-size: 12px;">error_outline</mat-icon>
            <span class="font-medium">Valores fuera de rango</span>
          </div>
        </div>

        <div class="overflow-x-auto rounded border border-gray-200">
          <table class="w-full bg-white text-[10px] min-w-max">
            <thead class="bg-gray-50">
              <tr class="text-gray-700">
                <th class="w-12 p-0 font-medium text-center border-r">Dist.</th>
                <th class="w-8 p-0 font-medium text-center border-r">Ojo</th>
                <th class="w-12 p-0 font-medium text-center border-r">Esf.</th>
                <th class="w-12 p-0 font-medium text-center border-r">Cyl.</th>
                <th class="w-10 p-0 font-medium text-center border-r">Eje</th>
                <th class="w-12 p-0 font-medium text-center border-r">ADD</th>
                <th class="w-12 p-0 font-medium text-center border-r">D.I.P.</th>
                <th class="w-14 p-0 font-medium text-center">Alt.Obl.</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let r of filasRx; let i = index" 
                  [class.bg-gray-50]="i % 2 === 0"
                  class="hover:bg-blue-50">
                
                <!-- Distancia -->
                <td class="p-0 font-medium text-center border-r">
                  <div class="px-1 py-0.5 text-[10px]">{{ r.dist }}</div>
                </td>
                
                <!-- Ojo -->
                <td class="p-0 font-medium text-center border-r">
                  <div class="px-1 py-0.5 text-[10px]">{{ r.ojo }}</div>
                </td>
                
                <!-- Esf -->
                <td class="p-0 border-r">
                  <input class="column-input" 
                         type="number" 
                         step="0.25"
                         [(ngModel)]="r.esf" 
                         (ngModelChange)="onEsfChange(r, $event)"
                         [class.error]="hasError(r, 'esf')"
                         [title]="'Esfera: ' + (r.esf | signoPositivo)"
                         placeholder="-20 a +20">
                  <div class="absolute-value-display" *ngIf="r.esf !== null && r.esf !== undefined">
                    {{ r.esf | signoPositivo }}
                  </div>
                </td>
                
                <!-- Cyl -->
                <td class="p-0 border-r">
                  <input class="column-input" 
                         type="number" 
                         step="0.25"
                         [(ngModel)]="r.cyl" 
                         (ngModelChange)="onCylChange(r, $event)"
                         [class.error]="hasError(r, 'cyl')"
                         [title]="'Cilindro: ' + (r.cyl | signoPositivo)"
                         placeholder="-10 a +10">
                  <div class="absolute-value-display" *ngIf="r.cyl !== null && r.cyl !== undefined">
                    {{ r.cyl | signoPositivo }}
                  </div>
                </td>
                
                <!-- Eje -->
                <td class="p-0 border-r">
                  <input class="column-input" 
                         type="number" 
                         [(ngModel)]="r.eje" 
                         (ngModelChange)="onEjeChange(r, $event)"
                         [class.error]="hasError(r, 'eje')"
                         placeholder="0 a 180"
                         title="Eje: 0 a 180">
                </td>
                
                <!-- ADD -->
                <td class="p-0 border-r">
                  <input class="column-input" 
                         type="number" 
                         step="0.25"
                         [(ngModel)]="r.add" 
                         (ngModelChange)="onAddChange(r, $event)"
                         [class.error]="hasError(r, 'add')"
                         [title]="'ADD: ' + (r.add | signoPositivo)"
                         placeholder="1 a 9">
                  <div class="absolute-value-display" *ngIf="r.add !== null && r.add !== undefined">
                    {{ r.add | signoPositivo }}
                  </div>
                </td>
                
                <!-- D.I.P. -->
                <td class="p-0 border-r">
                  <input class="column-input" 
                         type="number" 
                         [(ngModel)]="r.dip" 
                         (ngModelChange)="onDipChange(r, $event)"
                         [class.error]="hasError(r, 'dip')"
                         placeholder="55-70"
                         title="D.I.P.: 55 a 70">
                </td>
                
                <!-- ALT. OBLEA -->
                <td class="p-0">
                  <input class="column-input" 
                         type="number" 
                         [(ngModel)]="r.altOblea" 
                         (ngModelChange)="onAltObleaChange(r, $event)"
                         [class.error]="hasError(r, 'altOblea')"
                         placeholder="10 a 25"
                         title="ALT. OBLEA: 10 a 25">
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Mensajes de error debajo de la tabla -->
        <div *ngIf="hasAnyError()" class="mt-1 space-y-0.5">
          <div *ngFor="let fila of filasRx" class="text-[10px]">
            <div *ngFor="let field of ['esf', 'cyl', 'eje', 'add', 'dip', 'altOblea']">
              <div *ngIf="hasError(fila, field)" 
                   class="text-red-500 flex items-center gap-0.5">
                <mat-icon class="text-red-500" style="width: 10px; height: 10px; font-size: 10px;">error</mat-icon>
                <span>{{fila.dist}} {{fila.ojo}} {{field}}: {{getErrorMessage(fila, field)}}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Leyenda de rangos en una sola fila -->
        <div class="mt-2 p-1 bg-blue-50 border border-blue-200 rounded text-[10px]">
          <div class="flex items-center gap-1 text-blue-700 mb-0.5">
            <mat-icon class="text-blue-500" style="width: 10px; height: 10px; font-size: 10px;">info</mat-icon>
            <span class="font-medium">Rangos:</span>
          </div>
          <div class="flex flex-wrap gap-x-3 gap-y-0.5 text-blue-600">
            <div>Esf: -20 a +20</div>
            <div>Cyl: -10 a +10</div>
            <div>Eje: 0 a 180</div>
            <div>ADD: 1 a 9</div>
            <div>D.I.P.: 55 a 70</div>
            <div>Alt.Obl: 10 a 25</div>
          </div>
        </div>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .column-input {
      width: 100% !important;
      height: 22px !important;
      font-size: 10px !important;
      padding: 0 2px !important;
      margin: 0 !important;
      border: 1px solid #d1d5db !important;
      border-radius: 3px !important;
      text-align: center !important;
      background: white !important;
      line-height: 1 !important;
      
      /* Eliminar flechas en Chrome, Safari, Edge, Opera */
      -webkit-appearance: none !important;
      -moz-appearance: textfield !important;
    }

    /* Eliminar flechas en Firefox */
    .column-input[type=number] {
      -moz-appearance: textfield;
    }

    /* Eliminar flechas en Chrome, Safari, Edge */
    .column-input::-webkit-outer-spin-button,
    .column-input::-webkit-inner-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }

    .column-input:focus {
      outline: none !important;
      border-color: #3b82f6 !important;
      box-shadow: 0 0 0 1px #3b82f6 !important;
    }

    .column-input.error {
      border-color: #ef4444 !important;
      background-color: #fef2f2 !important;
    }

    .column-input.error:focus {
      border-color: #ef4444 !important;
      box-shadow: 0 0 0 1px #ef4444 !important;
    }

    /* Display absoluto para mostrar el valor formateado */
    .absolute-value-display {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      pointer-events: none;
      font-size: 10px;
      font-weight: 500;
      color: #374151;
      z-index: 1;
    }

    /* Posicionamiento relativo para las celdas que muestran valores formateados */
    td:has(.absolute-value-display) {
      position: relative;
    }

    /* Ocultar el input cuando hay valor (opcional, según preferencia) */
    td:has(.absolute-value-display) .column-input {
      color: transparent; /* Hace el texto del input transparente */
      background: transparent; /* Fondo transparente */
    }

    td:has(.absolute-value-display) .column-input:focus {
      color: #000; /* Mostrar texto al enfocar */
      background: white; /* Fondo blanco al enfocar */
    }

    /* Asegurar que los inputs ocupen todo el ancho de la celda */
    td {
      padding: 0 !important;
      margin: 0 !important;
      vertical-align: middle !important;
      height: 24px !important;
    }

    /* Reset completo de estilos de Angular Material */
    :host ::ng-deep .mat-form-field {
      display: none !important;
    }

    :host ::ng-deep .mat-input-element {
      min-width: auto !important;
      width: auto !important;
    }

    /* Tabla ultra compacta */
    table {
      font-size: 10px !important;
      line-height: 1 !important;
      border-collapse: collapse;
    }

    th, td {
      padding: 0 !important;
      margin: 0 !important;
      vertical-align: middle !important;
      height: 24px !important;
    }

    th {
      font-weight: 600;
      font-size: 9px !important;
      background-color: #f9fafb;
      border-bottom: 1px solid #e5e7eb;
    }

    td {
      border-right: 1px solid #e5e7eb;
    }

    /* Asegurar que no haya espacios extra */
    .border-r {
      border-right: 1px solid #e5e7eb;
    }

    /* Hacer que las celdas tengan el ancho exacto */
    th.w-12 { width: 48px; }
    th.w-8 { width: 32px; }
    th.w-10 { width: 40px; }
    th.w-14 { width: 56px; }
  `]
})
export class RxFormComponent {
  @Input() filasRx: any[] = [];
  @Output() filasRxChange = new EventEmitter<any[]>();  

  // Rangos válidos
  private readonly RANGOS = {
    esf: { min: -20, max: 20 },
    cyl: { min: -10, max: 10 },
    eje: { min: 0, max: 180 },
    add: { min: 1, max: 9 },
    dip: { min: 55, max: 70 },
    altOblea: { min: 10, max: 25 }
  };

  // Objeto para rastrear errores por fila y campo
  errors: { [key: string]: { [field: string]: string } } = {};

  // Métodos para manejar cambios con validación
  onEsfChange(fila: any, value: number): void {
    this.validateField(fila, 'esf', value);
    this.calcularValoresCerca(fila);
  }

  onCylChange(fila: any, value: number): void {
    this.validateField(fila, 'cyl', value);
    this.calcularValoresCerca(fila);
  }

  onEjeChange(fila: any, value: number): void {
    this.validateField(fila, 'eje', value);
    this.calcularValoresCerca(fila);
  }

  onAddChange(fila: any, value: number): void {
    this.validateField(fila, 'add', value);
    this.calcularValoresCerca(fila);
  }

  onDipChange(fila: any, value: number): void {
    this.validateField(fila, 'dip', value);
    this.calcularValoresCerca(fila);
  }

  onAltObleaChange(fila: any, value: number): void {
    this.validateField(fila, 'altOblea', value);
  }

  // Validación de campo individual
  validateField(fila: any, field: string, value: number): void {
    const filaKey = this.getFilaKey(fila);
    
    if (value === null || value === undefined) {
      this.setError(filaKey, field, '');
      return;
    }

    if (isNaN(value)) {
      this.setError(filaKey, field, 'Solo números permitidos');
      return;
    }

    const rango = this.RANGOS[field as keyof typeof this.RANGOS];
    if (value < rango.min || value > rango.max) {
      this.setError(filaKey, field, `${rango.min} a ${rango.max}`);
      return;
    }

    // Si pasa todas las validaciones, eliminar el error
    this.clearError(filaKey, field);
  }

  // Cálculo automático de valores para cerca
  calcularValoresCerca(filaLejos: any): void {
    if (filaLejos.dist !== 'Lejos') return;

    const ojo = filaLejos.ojo;
    const filaCerca = this.filasRx.find(f => f.dist === 'Cerca' && f.ojo === ojo);
    
    if (!filaCerca) return;

    // Aplicar reglas de cálculo
    if (filaLejos.esf !== null && filaLejos.esf !== undefined && 
        filaLejos.add !== null && filaLejos.add !== undefined) {
      // Esf (cerca) = Esf (lejos) + ADD
      filaCerca.esf = this.roundToQuarter(Number(filaLejos.esf) + Number(filaLejos.add));
    }

    // CYL = igual a CYL distancia lejos
    if (filaLejos.cyl !== null && filaLejos.cyl !== undefined) {
      filaCerca.cyl = Number(filaLejos.cyl);
    }

    // EJE = igual a EJE distancia lejos
    if (filaLejos.eje !== null && filaLejos.eje !== undefined) {
      filaCerca.eje = Number(filaLejos.eje);
    }

    // D.I.P. = igual a D.I.P. distancia lejos
    if (filaLejos.dip !== null && filaLejos.dip !== undefined) {
      filaCerca.dip = Number(filaLejos.dip);
    }
  }

  // Redondear a 0.25 (cuartos)
  private roundToQuarter(value: number): number {
    return Math.round(value * 4) / 4;
  }

  // Métodos auxiliares para errores
  private getFilaKey(fila: any): string {
    return `${fila.dist}-${fila.ojo}`;
  }

  private setError(filaKey: string, field: string, message: string): void {
    if (!this.errors[filaKey]) {
      this.errors[filaKey] = {};
    }
    this.errors[filaKey][field] = message;
  }

  private clearError(filaKey: string, field: string): void {
    if (this.errors[filaKey]) {
      delete this.errors[filaKey][field];
      if (Object.keys(this.errors[filaKey]).length === 0) {
        delete this.errors[filaKey];
      }
    }
  }

  // Métodos para la plantilla
  hasError(fila: any, field: string): boolean {
    const filaKey = this.getFilaKey(fila);
    return !!(this.errors[filaKey] && this.errors[filaKey][field]);
  }

  getErrorMessage(fila: any, field: string): string {
    const filaKey = this.getFilaKey(fila);
    return this.errors[filaKey]?.[field] || '';
  }

  hasAnyError(): boolean {
    return Object.keys(this.errors).length > 0;
  }
}
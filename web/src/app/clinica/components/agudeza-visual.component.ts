import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';

@Component({
  standalone: true,
  selector: 'app-agudeza-visual',
  imports: [
    CommonModule, FormsModule,
    MatCardModule, MatFormFieldModule, MatInputModule, MatIconModule
  ],
  template: `
    <mat-card class="form-card">
      <mat-card-header class="border-b border-gray-100 pb-4 mb-4">
        <mat-card-title class="flex items-center gap-2 text-lg font-semibold">
          <mat-icon [style.color]="'#06b6d4'" class="text-primary">visibility</mat-icon>
          Agudeza Visual (20/…)
        </mat-card-title>
        <mat-card-subtitle class="text-gray-600">Mediciones de agudeza visual (rango válido: 10-200)</mat-card-subtitle>
      </mat-card-header>

      <mat-card-content>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
          <!-- Sin lentes -->
          <div>
            <div class="font-medium mb-4 flex items-center gap-2">
              <mat-icon class="text-gray-600 text-base">remove_red_eye</mat-icon>
              Sin lentes
            </div>
            <div class="grid grid-cols-2 gap-4">
              <mat-form-field appearance="fill" class="custom-form-field">
                <mat-label>O.D.</mat-label>
                <input matInput 
                       type="number" 
                       min="10" 
                       max="200" 
                       [(ngModel)]="avSinOD"
                       (ngModelChange)="onAvSinODChange($event)"
                       [class.error-field]="hasError('avSinOD')">
                <mat-icon matPrefix class="prefix-icon">visibility</mat-icon>
                
                <!-- Mensajes de error para O.D. -->
                <mat-error *ngIf="hasError('avSinOD')">
                  <div class="text-xs">
                    <span *ngIf="getErrorType('avSinOD') === 'required'">Valor requerido</span>
                    <span *ngIf="getErrorType('avSinOD') === 'min'">Mínimo: 10</span>
                    <span *ngIf="getErrorType('avSinOD') === 'max'">Máximo: 200</span>
                    <span *ngIf="getErrorType('avSinOD') === 'pattern'">Solo números permitidos</span>
                  </div>
                </mat-error>
                
                <!-- Hint con valor actual -->
                <mat-hint align="end" *ngIf="avSinOD && !hasError('avSinOD')">
                  20/{{avSinOD}}
                </mat-hint>
              </mat-form-field>

              <mat-form-field appearance="fill" class="custom-form-field">
                <mat-label>O.I.</mat-label>
                <input matInput 
                       type="number" 
                       min="10" 
                       max="200" 
                       [(ngModel)]="avSinOI"
                       (ngModelChange)="onAvSinOIChange($event)"
                       [class.error-field]="hasError('avSinOI')">
                <mat-icon matPrefix class="prefix-icon">visibility</mat-icon>
                
                <!-- Mensajes de error para O.I. -->
                <mat-error *ngIf="hasError('avSinOI')">
                  <div class="text-xs">
                    <span *ngIf="getErrorType('avSinOI') === 'required'">Valor requerido</span>
                    <span *ngIf="getErrorType('avSinOI') === 'min'">Mínimo: 10</span>
                    <span *ngIf="getErrorType('avSinOI') === 'max'">Máximo: 200</span>
                    <span *ngIf="getErrorType('avSinOI') === 'pattern'">Solo números permitidos</span>
                  </div>
                </mat-error>
                
                <!-- Hint con valor actual -->
                <mat-hint align="end" *ngIf="avSinOI && !hasError('avSinOI')">
                  20/{{avSinOI}}
                </mat-hint>
              </mat-form-field>
            </div>
          </div>

          <!-- Con lentes -->
          <div>
            <div class="font-medium mb-4 flex items-center gap-2">
              <mat-icon class="text-gray-600 text-base">lens</mat-icon>
              Con lentes
            </div>
            <div class="grid grid-cols-2 gap-4">
              <mat-form-field appearance="fill" class="custom-form-field">
                <mat-label>O.D.</mat-label>
                <input matInput 
                       type="number" 
                       min="10" 
                       max="200" 
                       [(ngModel)]="avConOD"
                       (ngModelChange)="onAvConODChange($event)"
                       [class.error-field]="hasError('avConOD')">
                <mat-icon matPrefix class="prefix-icon">lens</mat-icon>
                
                <!-- Mensajes de error para O.D. -->
                <mat-error *ngIf="hasError('avConOD')">
                  <div class="text-xs">
                    <span *ngIf="getErrorType('avConOD') === 'required'">Valor requerido</span>
                    <span *ngIf="getErrorType('avConOD') === 'min'">Mínimo: 10</span>
                    <span *ngIf="getErrorType('avConOD') === 'max'">Máximo: 200</span>
                    <span *ngIf="getErrorType('avConOD') === 'pattern'">Solo números permitidos</span>
                  </div>
                </mat-error>
                
                <!-- Hint con valor actual -->
                <mat-hint align="end" *ngIf="avConOD && !hasError('avConOD')">
                  20/{{avConOD}}
                </mat-hint>
              </mat-form-field>

              <mat-form-field appearance="fill" class="custom-form-field">
                <mat-label>O.I.</mat-label>
                <input matInput 
                       type="number" 
                       min="10" 
                       max="200" 
                       [(ngModel)]="avConOI"
                       (ngModelChange)="onAvConOIChange($event)"
                       [class.error-field]="hasError('avConOI')">
                <mat-icon matPrefix class="prefix-icon">lens</mat-icon>
                
                <!-- Mensajes de error para O.I. -->
                <mat-error *ngIf="hasError('avConOI')">
                  <div class="text-xs">
                    <span *ngIf="getErrorType('avConOI') === 'required'">Valor requerido</span>
                    <span *ngIf="getErrorType('avConOI') === 'min'">Mínimo: 10</span>
                    <span *ngIf="getErrorType('avConOI') === 'max'">Máximo: 200</span>
                    <span *ngIf="getErrorType('avConOI') === 'pattern'">Solo números permitidos</span>
                  </div>
                </mat-error>
                
                <!-- Hint con valor actual -->
                <mat-hint align="end" *ngIf="avConOI && !hasError('avConOI')">
                  20/{{avConOI}}
                </mat-hint>
              </mat-form-field>
            </div>
          </div>
        </div>

        <!-- Resumen de estado de validación -->
        <div *ngIf="hasAnyError()" class="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div class="flex items-center gap-2 text-red-700">
            <mat-icon class="text-red-500 text-sm">error_outline</mat-icon>
            <span class="text-sm font-medium">Corrige los siguientes errores:</span>
          </div>
          <ul class="mt-2 text-xs text-red-600 list-disc list-inside space-y-1">
            <li *ngIf="hasError('avSinOD')">O.D. Sin Lentes: {{getErrorMessage('avSinOD')}}</li>
            <li *ngIf="hasError('avSinOI')">O.I. Sin Lentes: {{getErrorMessage('avSinOI')}}</li>
            <li *ngIf="hasError('avConOD')">O.D. Con Lentes: {{getErrorMessage('avConOD')}}</li>
            <li *ngIf="hasError('avConOI')">O.I. Con Lentes: {{getErrorMessage('avConOI')}}</li>
          </ul>
        </div>

        <!-- Resumen de valores válidos -->
        <div *ngIf="!hasAnyError() && hasAnyValue()" class="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div class="flex items-center gap-2 text-green-700">
            <mat-icon class="text-green-500 text-sm">check_circle</mat-icon>
            <span class="text-sm font-medium">Valores de agudeza visual registrados correctamente</span>
          </div>
          <div class="mt-2 grid grid-cols-2 gap-4 text-xs text-green-600">
            <div *ngIf="avSinOD">Sin Lentes O.D.: 20/{{avSinOD}}</div>
            <div *ngIf="avSinOI">Sin Lentes O.I.: 20/{{avSinOI}}</div>
            <div *ngIf="avConOD">Con Lentes O.D.: 20/{{avConOD}}</div>
            <div *ngIf="avConOI">Con Lentes O.I.: 20/{{avConOI}}</div>
          </div>
        </div>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .error-field .mat-form-field-flex {
      background-color: rgba(254, 226, 226, 0.9) !important;
      border: 1px solid #fecaca !important;
    }
    
    .error-field.mat-focused .mat-form-field-flex {
      box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.2) !important;
    }
  `]
})
export class AgudezaVisualComponent {
  @Input() avSinOD?: number;
  @Output() avSinODChange = new EventEmitter<number>();
  
  @Input() avSinOI?: number;
  @Output() avSinOIChange = new EventEmitter<number>();
  
  @Input() avConOD?: number;
  @Output() avConODChange = new EventEmitter<number>();
  
  @Input() avConOI?: number;
  @Output() avConOIChange = new EventEmitter<number>();

  // Objeto para rastrear errores
  errors: { [key: string]: string } = {};

  // Métodos para manejar cambios con validación
  onAvSinODChange(value: number): void {
    this.validateField('avSinOD', value);
    this.avSinODChange.emit(value);
  }

  onAvSinOIChange(value: number): void {
    this.validateField('avSinOI', value);
    this.avSinOIChange.emit(value);
  }

  onAvConODChange(value: number): void {
    this.validateField('avConOD', value);
    this.avConODChange.emit(value);
  }

  onAvConOIChange(value: number): void {
    this.validateField('avConOI', value);
    this.avConOIChange.emit(value);
  }

  // Validación de campo individual
  validateField(fieldName: string, value: number): void {
    if (value === null || value === undefined) {
      this.errors[fieldName] = 'required';
      return;
    }

    if (isNaN(value)) {
      this.errors[fieldName] = 'pattern';
      return;
    }

    if (value < 10) {
      this.errors[fieldName] = 'min';
      return;
    }

    if (value > 200) {
      this.errors[fieldName] = 'max';
      return;
    }

    // Si pasa todas las validaciones, eliminar el error
    delete this.errors[fieldName];
  }

  // Métodos auxiliares para la plantilla
  hasError(fieldName: string): boolean {
    return !!this.errors[fieldName];
  }

  getErrorType(fieldName: string): string {
    return this.errors[fieldName] || '';
  }

  getErrorMessage(fieldName: string): string {
    const errorType = this.errors[fieldName];
    switch (errorType) {
      case 'required': return 'Valor requerido';
      case 'min': return 'Mínimo: 10';
      case 'max': return 'Máximo: 200';
      case 'pattern': return 'Solo números permitidos';
      default: return 'Error desconocido';
    }
  }

  hasAnyError(): boolean {
    return Object.keys(this.errors).length > 0;
  }

  hasAnyValue(): boolean {
    return !!(this.avSinOD || this.avSinOI || this.avConOD || this.avConOI);
  }
}
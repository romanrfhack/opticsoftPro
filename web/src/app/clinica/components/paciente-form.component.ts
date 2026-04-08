import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatCardModule } from '@angular/material/card';
import { PacienteItem } from '../../core/models/clinica.models';

@Component({
  standalone: true,
  selector: 'app-paciente-form',
  imports: [
    CommonModule, ReactiveFormsModule,
    MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule,
    MatAutocompleteModule, MatCardModule
  ],
  template: `
    <mat-card class="form-card">
      <mat-card-header class="border-b border-gray-100 pb-4 mb-4">
        <mat-card-title class="flex items-center gap-2 text-lg font-semibold">
          <mat-icon [style.color]="'#06b6d4'"few class="text-primary">person</mat-icon>
          Datos del Paciente
        </mat-card-title>
        <mat-card-subtitle class="text-gray-600">Buscar o crear nuevo paciente</mat-card-subtitle>
      </mat-card-header>

      <mat-card-content>
        <form [formGroup]="pacForm" class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <mat-form-field appearance="fill" class="w-full md:col-span-2 custom-form-field">
            <mat-label>Nombre completo</mat-label>
            <input matInput formControlName="nombre" [matAutocomplete]="auto" placeholder="Buscar o escribir nombre..." required>
            <mat-icon matPrefix class="prefix-icon">search</mat-icon>
            <mat-autocomplete #auto="matAutocomplete" (optionSelected)="selectPaciente.emit($event.option.value)">
              <mat-option *ngFor="let p of sugeridos" [value]="p" class="flex justify-between items-center">
                <span>{{ p.nombre }}</span>
                <span class="text-xs text-gray-500 ml-2">{{ p.telefono }}</span>
              </mat-option>
            </mat-autocomplete>
            <mat-error *ngIf="pacForm.controls['nombre'].hasError('required')">Campo requerido</mat-error>
          </mat-form-field>

          <mat-form-field appearance="fill" class="w-full custom-form-field">
            <mat-label>Edad</mat-label>
            <input matInput type="number" formControlName="edad" required min="0" max="120">
            <mat-icon matPrefix class="prefix-icon">calendar_today</mat-icon>
            <mat-error *ngIf="pacForm.controls['edad'].hasError('required')">Campo requerido</mat-error>
            <mat-error *ngIf="pacForm.controls['edad'].hasError('min')">Edad mínima: 0</mat-error>
            <mat-error *ngIf="pacForm.controls['edad'].hasError('max')">Edad máxima: 120</mat-error>
          </mat-form-field>

          <mat-form-field appearance="fill" class="w-full custom-form-field">
            <mat-label>Teléfono</mat-label>
            <input
              matInput
              formControlName="telefono"
              type="tel"
              maxlength="12"                   
              placeholder="55 1234 5678"
              (keypress)="onlyNumbers($event)"
              (input)="formatPhone($event)"
            >
            <mat-icon matPrefix class="prefix-icon">phone</mat-icon>
            <mat-error *ngIf="pacForm.get('telefono')?.hasError('required')">
              El número de teléfono es obligatorio.
            </mat-error>
            <mat-error *ngIf="pacForm.get('telefono')?.hasError('pattern')">
              Debe contener exactamente 10 dígitos numéricos.
            </mat-error>
          </mat-form-field>

          <mat-form-field appearance="fill" class="w-full custom-form-field">
            <mat-label>Ocupación</mat-label>
            <input matInput formControlName="ocupacion">
            <mat-icon matPrefix class="prefix-icon">work</mat-icon>
          </mat-form-field>

          <mat-form-field appearance="fill" class="w-full md:col-span-2 custom-form-field">
            <mat-label>Dirección</mat-label>
            <input matInput formControlName="direccion">
            <mat-icon matPrefix class="prefix-icon">home</mat-icon>
          </mat-form-field>
        </form>

        <div class="flex gap-3 mt-4 pt-4 border-t border-gray-100">
          <button mat-stroked-button 
                  color="primary" 
                  (click)="crearPaciente.emit()" 
                  [disabled]="pacForm.invalid"
                  class="action-button">
            <mat-icon>person_add</mat-icon>
            Crear Paciente
          </button>
        </div>
      </mat-card-content>
    </mat-card>
  `
})
export class PacienteFormComponent {
  @Input() pacForm!: FormGroup;
  @Input() sugeridos: PacienteItem[] = [];
  @Output() selectPaciente = new EventEmitter<PacienteItem>();
  @Output() crearPaciente = new EventEmitter<void>();

  onlyNumbers(event: KeyboardEvent) {
    const charCode = event.charCode;
    if (charCode < 48 || charCode > 57) {
      event.preventDefault();
    }
  }

  formatPhone(event: any) {
    let input = event.target.value.replace(/\D/g, '');
    if (input.length > 2 && input.length <= 6) {
      input = input.replace(/^(\d{2})(\d+)/, '$1 $2');
    } else if (input.length > 6) {
      input = input.replace(/^(\d{2})(\d{4})(\d+)/, '$1 $2 $3');
    }
    event.target.value = input;
    this.pacForm.get('telefono')?.setValue(input, { emitEvent: false });
  }
}
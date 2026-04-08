import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  standalone: true,
  selector: 'app-observaciones-acciones',
  imports: [
    CommonModule, FormsModule,
    MatCardModule, MatFormFieldModule, MatInputModule, 
    MatButtonModule, MatIconModule
  ],
  template: `
    <mat-card class="form-card">
      <mat-card-header class="border-b border-gray-100 pb-4 mb-4">
        <mat-card-title class="flex items-center gap-2 text-lg font-semibold">
          <mat-icon [style.color]="'#06b6d4'" class="text-primary">notes</mat-icon>
          Observaciones Finales
        </mat-card-title>
        <mat-card-subtitle class="text-gray-600">Notas adicionales del examen</mat-card-subtitle>
      </mat-card-header>

      <mat-card-content>
        <mat-form-field appearance="fill" class="w-full custom-form-field">
          <mat-label>Observaciones y notas del examen</mat-label>
          <textarea rows="4" matInput [(ngModel)]="observaciones" placeholder="Escribe aquí cualquier observación importante..."></textarea>
          <mat-icon matPrefix class="prefix-icon">notes</mat-icon>
        </mat-form-field>
      </mat-card-content>
    </mat-card>
  `
})
export class ObservacionesAccionesComponent {
  @Input() observaciones: string = '';
  @Output() observacionesChange = new EventEmitter<string>();

  onObservacionesChange() {
    this.observacionesChange.emit(this.observaciones);
  }
}
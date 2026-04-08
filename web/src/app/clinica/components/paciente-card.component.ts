import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  standalone: true,
  selector: 'app-paciente-card',
  imports: [
    CommonModule, ReactiveFormsModule,
    MatCardModule, MatIconModule, MatButtonModule
  ],
  template: `
    <mat-card class="form-card compact-card">
      <mat-card-header class="compact-header">
        <mat-card-title class="compact-title">
          <div class="title-content">
            <mat-icon [style.color]="'#06b6d4'" class="text-primary icon-sm">person</mat-icon>
            Paciente Seleccionado
          </div>
          <button mat-icon-button 
                  (click)="editarPaciente.emit()" 
                  title="Editar datos del paciente"
                  class="edit-button compact-edit-btn">
            <mat-icon class="icon-sm">edit</mat-icon>
          </button>
        </mat-card-title>
      </mat-card-header>

      <mat-card-content class="compact-content">
        <div class="compact-grid">
          <div class="compact-item">
            <mat-icon [style.color]="'#06b6d4'" class="text-gray-600 icon-xs">person_outline</mat-icon>
            <div class="compact-text">              
              <div [style.color]="'#06b6d4'" class="compact-value font-semibold text-cyan-800">{{ pacForm.value.nombre }}</div>
              <div class="compact-label">Nombre completo</div>
            </div>
          </div>
          
          <div class="compact-item">
            <mat-icon class="text-gray-600 icon-xs">calendar_today</mat-icon>
            <div class="compact-text">
              <div class="compact-value">{{ pacForm.value.edad }} años</div>
              <div class="compact-label">Edad</div>
            </div>
          </div>

          <div class="compact-item" *ngIf="pacForm.value.telefono">
            <mat-icon class="text-gray-600 icon-xs">phone</mat-icon>
            <div class="compact-text">
              <div class="compact-value">{{ pacForm.value.telefono }}</div>
              <div class="compact-label">Teléfono</div>
            </div>
          </div>

          <div class="compact-item" *ngIf="pacForm.value.ocupacion">
            <mat-icon class="text-gray-600 icon-xs">work</mat-icon>
            <div class="compact-text">
              <div class="compact-value">{{ pacForm.value.ocupacion }}</div>
              <div class="compact-label">Ocupación</div>
            </div>
          </div>

          <div class="compact-item full-width" *ngIf="pacForm.value.direccion">
            <mat-icon class="text-gray-600 icon-xs">home</mat-icon>
            <div class="compact-text">
              <div class="compact-value">{{ pacForm.value.direccion }}</div>
              <div class="compact-label">Dirección</div>
            </div>
          </div>
        </div>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .compact-card {
  padding: 0 !important;
}

.compact-header {
  padding: 12px 16px 8px 16px !important;
  position: relative;
  border-bottom: 1px solid #e5e7eb;
  margin-bottom: 0 !important;
}

.compact-title {
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  width: 100%;
  margin: 0 !important;
  font-size: 14px !important;
  padding-right: 0 !important;
  min-height: 32px; /* Altura mínima para alinear verticalmente */
}

.title-content {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  flex: 1;
  height: 100%; /* Asegura que ocupe toda la altura */
}

.compact-edit-btn {
  width: 32px !important;
  height: 32px !important;
  line-height: 32px !important;
  margin: 0 !important; /* Reset de márgenes */
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  flex-shrink: 0;
}

.compact-edit-btn .mat-icon {
  width: 18px !important;
  height: 18px !important;
  font-size: 18px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
}

.compact-content {
  padding: 12px 16px !important;
}

.compact-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.compact-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  min-height: auto;
}

.compact-item.full-width {
  grid-column: 1 / -1;
}

.compact-text {
  flex: 1;
  min-width: 0;
}

.compact-value {
  font-size: 15px;
  font-weight: 500;
  color: #374151;
  line-height: 1.3;
  margin-bottom: 2px;
}

.compact-label {
  font-size: 11px;
  color: #6b7280;
  line-height: 1.2;
}

.icon-sm {
  width: 16px !important;
  height: 16px !important;
  font-size: 16px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
}

.icon-xs {
  width: 14px !important;
  height: 14px !important;
  font-size: 14px !important;
  margin-top: 1px;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
}

.edit-button {
  color: #64748b;
  transition: all 0.3s ease;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
}

.edit-button:hover {
  color: #06b6d4;
  background-color: rgba(6, 182, 212, 0.1);
  transform: scale(1.1);
}

@media (max-width: 640px) {
  .compact-grid {
    grid-template-columns: 1fr;
    gap: 10px;
  }
  
  .compact-header {
    padding: 10px 12px 6px 12px !important;
  }
  
  .compact-content {
    padding: 10px 12px !important;
  }
  
  .compact-title {
    font-size: 13px !important;
    min-height: 28px; /* Altura ajustada para móvil */
  }
  
  .compact-edit-btn {
    width: 28px !important;
    height: 28px !important;
    line-height: 28px !important;
  }
  
  .compact-edit-btn .mat-icon {
    width: 16px !important;
    height: 16px !important;
    font-size: 16px !important;
  }
}
  `]
})
export class PacienteCardComponent {
  @Input() pacForm!: FormGroup;
  @Output() editarPaciente = new EventEmitter<void>();
}
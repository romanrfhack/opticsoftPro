import { Component, inject, signal, computed, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../../auth/auth.service';
import { BranchesService } from '../../core/branches.service';

interface Branch {
  id: string;
  nombre: string;
  direccion?: string;
  activa?: boolean;
}

@Component({
  standalone: true,
  selector: 'app-sucursal-switcher',
  imports: [
    CommonModule, 
    MatSelectModule, 
    MatIconModule, 
    MatFormFieldModule, 
    MatTooltipModule,
    MatCardModule,
    MatProgressSpinnerModule
  ],
  template: `
  <ng-container *ngIf="isAdmin()">
    <div class="sucursal-switcher-container relative">
      <!-- Tarjeta contenedora para consistencia -->
      <mat-card class="sucursal-card" [class.loading]="loading()">
        <mat-card-content class="p-3">
          <!-- Campo de selección mejorado -->
          <mat-form-field appearance="fill" class="sucursal-select custom-form-field">
            <mat-label class="flex items-center gap-2 label-text">
              <mat-icon class="text-primary">storefront</mat-icon>
              <span>Sucursal Activa</span>
            </mat-label>

            <mat-select
              [value]="current()"
              (selectionChange)="onChange($event.value)"
              panelClass="sucursal-panel"
              #branchSelect
              [disabled]="loading()">
              
              <mat-option
                *ngFor="let branch of branches()"
                [value]="branch.id"
                class="sucursal-option">
                <div class="flex items-center justify-between w-full py-1">
                  <div class="flex items-center gap-3 flex-1 min-w-0">
                    <div class="flex-shrink-0">
                      <mat-icon 
                        class="branch-icon"
                        [class.active]="branch.id === current()"
                        [class.inactive]="branch.id !== current()">
                        {{ branch.id === current() ? 'check_circle' : 'location_on' }}
                      </mat-icon>
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="branch-name truncate font-medium">
                        {{ branch.nombre }}
                      </div>
                      <div class="branch-status text-xs text-gray-500 truncate" *ngIf="branch.direccion">
                        {{ branch.direccion }}
                      </div>
                    </div>
                  </div>
                  
                  <div class="flex items-center gap-2 flex-shrink-0 ml-2">
                    <span class="status-indicator" [class.active]="branch.activa"></span>
                    <mat-icon
                      class="current-indicator text-primary text-base"
                      *ngIf="branch.id === current()"
                      matTooltip="Sucursal actual seleccionada"
                      matTooltipPosition="left">
                      star
                    </mat-icon>
                  </div>
                </div>
              </mat-option>
            </mat-select>

            <!-- Ícono personalizado mejorado -->
            <div class="custom-arrow-icon" (click)="!loading() && branchSelect.open()" [class.disabled]="loading()">
              <mat-icon *ngIf="!loading()">arrow_drop_down</mat-icon>
              <mat-spinner diameter="20" *ngIf="loading()"></mat-spinner>
            </div>

            <!-- Indicador de estado actual -->
            <div class="current-branch-indicator" *ngIf="currentBranch()">
              <span class="current-text">Actual:</span>
              <span class="branch-text truncate">{{ currentBranch()?.nombre }}</span>
            </div>
          </mat-form-field>
        </mat-card-content>

        <!-- Indicador de carga mejorado -->
        <div *ngIf="loading()" class="loading-overlay">
          <div class="loading-content">
            <mat-spinner diameter="32" class="text-primary"></mat-spinner>
            <span class="loading-text">Cambiando sucursal...</span>
          </div>
        </div>
      </mat-card>

      <!-- Información rápida de la sucursal actual -->
      <div *ngIf="currentBranch() && !loading()" class="sucursal-info">
        <div class="info-content">
          <div class="info-item">
            <mat-icon class="info-icon">place</mat-icon>
            <span class="info-text truncate">{{ currentBranch()?.direccion || 'Sin dirección registrada' }}</span>
          </div>
          <div class="info-item">
            <mat-icon class="info-icon">circle</mat-icon>
            <span class="info-text" [class.status-active]="currentBranch()?.activa" [class.status-inactive]="!currentBranch()?.activa">
              {{ currentBranch()?.activa ? 'Activa' : 'Inactiva' }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </ng-container>
  `,
  styles: [`
  :host {
    display: block;
    padding: 8px 0;
  }

  .sucursal-switcher-container {
    min-width: 280px;
    max-width: 400px;
  }

  .sucursal-card {
    border-radius: 12px !important;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1) !important;
    border-left: 4px solid #06b6d4;
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
  }

  .sucursal-card:hover:not(.loading) {
    transform: translateY(-2px);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15) !important;
    border-left-color: #0891b2;
  }

  .sucursal-card.loading {
    opacity: 0.8;
  }

  .text-primary {
    color: #06b6d4;
  }

  /* Estilos para el campo de formulario */
  .sucursal-select {
    width: 100%;
  }

  .label-text {
    color: #06b6d4;
    font-weight: 600;
  }

  .custom-form-field .mat-mdc-form-field-flex {
    background: rgba(255, 255, 255, 0.95) !important;
    border-radius: 8px;
    padding: 8px 12px !important;
    border: 2px solid #e2e8f0;
    transition: all 0.3s ease;
  }

  .custom-form-field:hover .mat-mdc-form-field-flex {
    border-color: #06b6d4;
    box-shadow: 0 0 0 3px rgba(6, 182, 212, 0.1);
  }

  .custom-form-field.mat-focused .mat-mdc-form-field-flex {
    border-color: #06b6d4;
    box-shadow: 0 0 0 3px rgba(6, 182, 212, 0.2);
  }

  /* Ocultar elementos nativos no deseados */
  .custom-form-field .mat-mdc-select-arrow-wrapper,
  .custom-form-field .mat-mdc-form-field-icon-suffix {
    display: none !important;
  }

  .custom-form-field .mat-mdc-form-field-subscript-wrapper {
    display: none !important;
  }

  /* Ícono personalizado */
  .custom-arrow-icon {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    cursor: pointer;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    color: #64748b;
    transition: all 0.3s ease;
    border-radius: 4px;
  }

  .custom-arrow-icon:hover:not(.disabled) {
    color: #06b6d4;
    background-color: rgba(6, 182, 212, 0.1);
  }

  .custom-arrow-icon.disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }

  /* Indicador de sucursal actual */
  .current-branch-indicator {
    position: absolute;
    left: 12px;
    bottom: -20px;
    font-size: 11px;
    color: #06b6d4;
    background: rgba(6, 182, 212, 0.1);
    padding: 2px 6px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .current-text {
    font-weight: 600;
  }

  .branch-text {
    max-width: 120px;
  }

  /* Panel de opciones */
  .sucursal-panel {
    border-radius: 12px !important;
    margin-top: 8px !important;
    box-shadow: 0 4px 25px rgba(0, 0, 0, 0.15) !important;
    border: 1px solid #e2e8f0;
    overflow: hidden;
  }

  .sucursal-option {
    padding: 0 !important;
    border-bottom: 1px solid #f1f5f9;
    transition: all 0.3s ease;
  }

  .sucursal-option:last-child {
    border-bottom: none;
  }

  .sucursal-option:hover {
    background-color: #f0f9ff !important;
  }

  .sucursal-option.mat-selected {
    background-color: #ecfeff !important;
  }

  .branch-icon {
    font-size: 20px;
    width: 20px;
    height: 20px;
  }

  .branch-icon.active {
    color: #06b6d4;
  }

  .branch-icon.inactive {
    color: #94a3b8;
  }

  .branch-name {
    color: #1e293b;
    font-size: 14px;
  }

  .branch-status {
    font-size: 11px;
    margin-top: 2px;
  }

  .status-indicator {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    transition: all 0.3s ease;
  }

  .status-indicator.active {
    background-color: #10b981;
  }

  .status-indicator:not(.active) {
    background-color: #ef4444;
  }

  .current-indicator {
    animation: pulse 2s infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.6; }
  }

  /* Overlay de carga */
  .loading-overlay {
    position: absolute;
    inset: 0;
    background: rgba(255, 255, 255, 0.9);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10;
  }

  .loading-content {
    display: flex;
    align-items: center;
    gap: 12px;
    background: white;
    padding: 12px 16px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    border-left: 4px solid #06b6d4;
  }

  .loading-text {
    color: #06b6d4;
    font-weight: 600;
    font-size: 14px;
  }

  /* Información de sucursal */
  .sucursal-info {
    margin-top: 8px;
    animation: slideDown 0.3s ease;
  }

  .info-content {
    background: #f8fafc;
    border-radius: 8px;
    padding: 8px 12px;
    border-left: 3px solid #06b6d4;
  }

  .info-item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    color: #64748b;
  }

  .info-icon {
    font-size: 14px !important;
    width: 14px !important;
    height: 14px !important;
    color: #06b6d4;
  }

  .info-text {
    flex: 1;
  }

  .status-active {
    color: #10b981;
    font-weight: 600;
  }

  .status-inactive {
    color: #ef4444;
    font-weight: 600;
  }

  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* Modo oscuro */
  .dark .sucursal-card {
    background: #1f2937;
  }

  .dark .custom-form-field .mat-mdc-form-field-flex {
    background: rgba(30, 41, 59, 0.95) !important;
    border-color: #4b5563;
  }

  .dark .branch-name {
    color: #f1f5f9;
  }

  .dark .branch-status {
    color: #94a3b8;
  }

  .dark .sucursal-panel {
    background: #1f2937;
    border-color: #4b5563;
  }

  .dark .sucursal-option {
    border-bottom-color: #374151;
  }

  .dark .sucursal-option:hover {
    background-color: #374151 !important;
  }

  .dark .sucursal-option.mat-selected {
    background-color: #164e63 !important;
  }

  .dark .info-content {
    background: #374151;
  }

  .dark .info-item {
    color: #cbd5e1;
  }

  /* Responsive */
  @media (max-width: 768px) {
    .sucursal-switcher-container {
      min-width: 100%;
      max-width: 100%;
    }

    .sucursal-card {
      margin: 0 8px;
    }

    .current-branch-indicator {
      position: relative;
      bottom: 0;
      margin-top: 4px;
      align-self: flex-start;
    }

    .loading-content {
      flex-direction: column;
      gap: 8px;
      text-align: center;
    }
  }

  @media (max-width: 480px) {
    .sucursal-switcher-container {
      min-width: 250px;
    }

    .branch-name {
      font-size: 13px;
    }

    .info-item {
      font-size: 11px;
    }
  }
  `]
})
export class SucursalSwitcherComponent {
  private branchesSvc = inject(BranchesService);
  private auth = inject(AuthService);
  private destroyRef = inject(DestroyRef);

  branches = signal<Branch[]>([]);
  loading = signal(false);
  current = computed(() => this.auth.user()?.sucursalId || '');
  isAdmin = computed(() => !!this.auth.user()?.roles?.includes('Admin'));

  currentBranch = computed(() => {
    const currentId = this.current();
    return this.branches().find(b => b.id === currentId) || null;
  });

  constructor() {
    if (this.isAdmin()) {
      this.loadBranches();
    }
  }

  loadBranches() {
    this.loading.set(true);
    this.branchesSvc.list().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (branches) => {
        this.branches.set(branches.map(b => ({
          ...b,
          activa: b.activa ?? true
        })));
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  onChange(targetSucursalId: string) {
    if (!targetSucursalId || targetSucursalId === this.current() || this.loading()) {
      return;
    }

    this.loading.set(true);
    this.auth.switchBranch(targetSucursalId).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (res) => {
        this.auth.persist(res);
        // Pequeño delay para mejor UX
        setTimeout(() => {
          this.loading.set(false);
        }, 500);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }
}
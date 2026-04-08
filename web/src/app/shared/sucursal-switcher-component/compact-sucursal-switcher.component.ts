import { Component, inject, signal, computed, DestroyRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
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
  selector: 'app-compact-sucursal-switcher',
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatTooltipModule,
    MatProgressSpinnerModule
  ],
  template: `
  <ng-container *ngIf="isAdmin()">
    <!-- Desktop: Texto completo -->
    <button mat-button 
            [matMenuTriggerFor]="sucursalMenu"
            class="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-cyan-50 transition relative"
            [class.loading]="loading()"
            matTooltip="Cambiar sucursal activa"
            matTooltipPosition="below">
      
      <mat-icon class="text-primary scale-90">storefront</mat-icon>
      
      <span class="text-sm font-medium text-gray-700 max-w-[120px] truncate">
        {{ currentBranch()?.nombre || 'Sucursal' }}
      </span>
      
      <mat-icon class="text-gray-500 scale-90">expand_more</mat-icon>
      
      <!-- Indicador de sucursal actual -->
      <div class="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full border border-white" 
           *ngIf="currentBranch()?.activa"></div>
    </button>

    <!-- Mobile: Solo ícono -->
    <button mat-icon-button 
            [matMenuTriggerFor]="sucursalMenu"
            class="md:hidden relative"
            [class.loading]="loading()"
            matTooltip="Cambiar sucursal"
            matTooltipPosition="below">
      
      <mat-icon class="text-primary">storefront</mat-icon>
      
      <!-- Indicador de sucursal actual -->
      <div class="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full border border-white" 
           *ngIf="currentBranch()?.activa"></div>
    </button>

    <!-- Menú de sucursales -->
    <mat-menu #sucursalMenu="matMenu" class="sucursal-menu">
      <div class="px-4 py-2 border-b border-gray-100">
        <div class="text-sm font-semibold text-gray-700">Sucursales</div>
        <div class="text-xs text-gray-500">Selecciona una sucursal</div>
      </div>

      <button mat-menu-item 
              *ngFor="let branch of branches()"
              (click)="onChange(branch.id)"
              [class.active]="branch.id === current()"
              class="flex items-center gap-3 py-2 min-h-[48px]">
        
        <div class="flex items-center gap-2 flex-1 min-w-0">
          <!-- Ícono de estado -->
          <mat-icon class="text-base" 
                    [class.text-primary]="branch.id === current()"
                    [class.text-gray-400]="branch.id !== current()">
            {{ branch.id === current() ? 'check_circle' : 'location_on' }}
          </mat-icon>

          <!-- Información de la sucursal -->
          <div class="flex-1 min-w-0 text-left">
            <div class="font-medium truncate" 
                 [class.text-primary]="branch.id === current()"
                 [class.text-gray-700]="branch.id !== current()">
              {{ branch.nombre }}
            </div>
            <div class="text-xs text-gray-500 truncate" *ngIf="branch.direccion">
              {{ branch.direccion }}
            </div>
          </div>

          <!-- Estado de actividad -->
          <div class="flex items-center gap-1 flex-shrink-0 ml-2">
            <span class="status-dot" [class.active]="branch.activa"></span>
            <span class="text-xs text-gray-400">
              {{ branch.activa ? 'Activa' : 'Inactiva' }}
            </span>
          </div>
        </div>
      </button>

      <!-- Loading state -->
      <div *ngIf="loading()" class="px-4 py-3 flex items-center gap-2 text-gray-500">
        <mat-spinner diameter="16"></mat-spinner>
        <span class="text-sm">Cargando sucursales...</span>
      </div>

      <!-- Empty state -->
      <div *ngIf="!loading() && branches().length === 0" class="px-4 py-3 text-center text-gray-500">
        <mat-icon class="text-base">store_mall_directory</mat-icon>
        <div class="text-sm mt-1">No hay sucursales disponibles</div>
      </div>
    </mat-menu>
  </ng-container>
  `,
  styles: [`
    :host {
      display: block;
    }

    .text-primary {
      color: #06b6d4;
    }

    button.loading {
      opacity: 0.7;
      pointer-events: none;
    }

    .sucursal-menu {
      min-width: 280px;
      max-width: 350px;
      max-height: 400px;
      overflow-y: auto;
    }

    .status-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      display: inline-block;
    }

    .status-dot.active {
      background-color: #10b981;
    }

    .status-dot:not(.active) {
      background-color: #ef4444;
    }

    /* Estilos para el item activo en el menú */
    .mat-menu-item.active {
      background-color: #f0f9ff;
      border-left: 3px solid #06b6d4;
    }

    /* Scrollbar personalizado para el menú */
    .sucursal-menu::-webkit-scrollbar {
      width: 6px;
    }

    .sucursal-menu::-webkit-scrollbar-track {
      background: #f1f5f9;
      border-radius: 3px;
    }

    .sucursal-menu::-webkit-scrollbar-thumb {
      background: #cbd5e1;
      border-radius: 3px;
    }

    .sucursal-menu::-webkit-scrollbar-thumb:hover {
      background: #94a3b8;
    }

    /* Efectos hover para items del menú */
    .mat-menu-item:not(.active):hover {
      background-color: #f8fafc;
    }

    /* Responsive adjustments */
    @media (max-width: 768px) {
      .sucursal-menu {
        min-width: 250px;
        max-width: 300px;
      }
    }

    @media (max-width: 480px) {
      .sucursal-menu {
        min-width: 220px;
        max-width: 280px;
      }
    }
  `]
})
export class CompactSucursalSwitcherComponent {
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

  // Detectar cambios en el tamaño de la ventana para responsive
  isMobile = signal(false);

  @HostListener('window:resize')
  onResize() {
    this.isMobile.set(window.innerWidth < 768);
  }

  constructor() {
    this.onResize(); // Initial check
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
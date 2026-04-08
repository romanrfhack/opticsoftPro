import { Component, ChangeDetectionStrategy, computed, inject, signal  } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged, switchMap, tap, startWith } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { InventoryService, InventorySearchItem } from './inventory.service';
import { ProductsService } from './products.service';
import { Toast } from '../../shared/ui/toast.service';

@Component({
  standalone: true,
  selector: 'app-inventario',
  imports: [
    CommonModule, ReactiveFormsModule,
    MatFormFieldModule, MatInputModule, MatTableModule, MatIconModule,
    MatProgressSpinnerModule, MatChipsModule, MatTooltipModule, MatButtonModule, MatDialogModule
  ],
  template: `
  <section class="space-y-4">
    <header class="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
      <h1 class="text-2xl font-bold">Inventario</h1>

      <div class="flex items-center gap-3">
        <!-- Buscador con borde propio (sin línea/ripple) -->
        <mat-form-field appearance="fill" class="field no-outline w-72">
          <mat-label>Buscar (SKU / nombre)</mat-label>
          <input matInput [formControl]="q" placeholder="ej. ARZ-001 o 'estuche'">
          <button mat-icon-button matSuffix *ngIf="q.value" (click)="q.setValue('')" aria-label="Limpiar">
            <mat-icon>close</mat-icon>
          </button>
        </mat-form-field>

        <button mat-flat-button type="button" class="btn-primary" (click)="nuevoProducto()">
          <mat-icon>add</mat-icon>
          <span class="ml-1">Nuevo producto</span>
        </button>
      </div>
    </header>

    <div class="card p-4">
      <div class="flex items-center gap-2 mb-3" *ngIf="loading()">
        <mat-spinner diameter="22" class="spinner-primary"></mat-spinner>
        <span class="text-sm text-gray-600">Buscando…</span>
      </div>

      <div class="overflow-x-auto">
        <table mat-table [dataSource]="rows()" class="mat-elevation-z0 w-full nice-table" [class.opacity-50]="loading()">

          <!-- SKU -->
          <ng-container matColumnDef="sku">
            <th mat-header-cell *matHeaderCellDef class="th">SKU</th>
            <td mat-cell *matCellDef="let r" class="td font-mono text-slate-800">{{ r.sku }}</td>
          </ng-container>

          <!-- Nombre -->
          <ng-container matColumnDef="nombre">
            <th mat-header-cell *matHeaderCellDef class="th">Producto</th>
            <td mat-cell *matCellDef="let r" class="td">
              <div class="flex items-center gap-2">
                <button mat-button (click)="editarProducto(r)" class="!p-0 !min-w-0 text-left">
                  <span class="font-medium">{{ r.nombre }}</span>
                </button>
                <mat-chip *ngIf="r.shared" class="chip-primary" matTooltip="Inventario compartido entre sucursales">
                  Compartido
                </mat-chip>
                <mat-chip *ngIf="r.bajoMin" color="warn">Bajo stock</mat-chip>
              </div>
              <div class="text-xs text-gray-500">{{ r.categoria }}</div>
            </td>
          </ng-container>

          <!-- Sucursal -->
          <ng-container matColumnDef="sucursal">
            <th mat-header-cell *matHeaderCellDef class="th">Sucursal</th>
            <td mat-cell *matCellDef="let r" class="td">{{ r.sucursalNombre }}</td>
          </ng-container>

          <!-- Stock -->
          <ng-container matColumnDef="stock">
            <th mat-header-cell *matHeaderCellDef class="th">Stock</th>
            <td mat-cell *matCellDef="let r" class="td">
              <span [class.text-red-600]="r.bajoMin">{{ r.stock }}</span>
              <span class="text-xs text-gray-400" *ngIf="r.stockMin">/ min {{ r.stockMin }}</span>
            </td>
          </ng-container>

          <!-- Acciones -->
          <ng-container matColumnDef="acciones">
            <th mat-header-cell *matHeaderCellDef class="th center"></th>
            <td mat-cell *matCellDef="let r" class="td center actions">
              <button mat-icon-button matTooltip="Entrada" (click)="openMovimiento(r, 'Entrada')" aria-label="Entrada">
                <mat-icon>add</mat-icon>
              </button>
              <button mat-icon-button matTooltip="Salida" (click)="openMovimiento(r, 'Salida')" aria-label="Salida">
                <mat-icon>remove</mat-icon>
              </button>
              <button mat-icon-button matTooltip="Traslado" (click)="openMovimiento(r, 'Traslado')" aria-label="Traslado">
                <mat-icon>swap_horiz</mat-icon>
              </button>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns" class="header-row"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="data-row"></tr>
        </table>
      </div>

      <div *ngIf="!loading() && rows().length === 0" class="text-center py-8 text-gray-500">
        No hay resultados.
      </div>
    </div>
  </section>
  `,
  styles: [`
  :host { display: block; padding-top: 6px; }

  /* --------- Botón primario --------- */
  .btn-primary {
    background-color: #06b6d4 !important;
    color: #fff !important;
  }
  .btn-primary:hover { filter: brightness(.95); }
  .btn-primary[disabled] { opacity: .7; }

  /* --------- Spinner al color primario --------- */
  .spinner-primary .mdc-circular-progress__indeterminate-circle-graphic,
  .spinner-primary svg circle {
    stroke: #06b6d4 !important;
  }

  /* --------- Card --------- */
  .card {
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
  }

  /* --------- mat-form-field sin “rayita” (fill) y con borde propio --------- */
  .no-outline .mdc-line-ripple,
  .no-outline .mat-mdc-form-field-focus-overlay,
  .no-outline .mat-mdc-form-field-subscript-wrapper { display: none !important; }

  .field .mdc-text-field {
    background: transparent !important;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    min-height: 42px;
    padding: 0 12px;
    transition: border-color .2s ease, box-shadow .2s ease;
  }
  .field .mdc-text-field:hover { border-color: #06b6d4; }
  .field .mdc-text-field.mdc-text-field--focused {
    border-color: #06b6d4;
    box-shadow: 0 0 0 2px rgba(6,182,212,.18);
  }

  /* --------- Tabla --------- */
  .nice-table { border-collapse: separate; border-spacing: 0; }
  .header-row { background: #f8fafc; }
  .th {
    font-weight: 600;
    color: #334155;
    padding: 10px 12px;
    border-bottom: 1px solid #e2e8f0;
    white-space: nowrap;
  }
  .td {
    padding: 12px;
    border-bottom: 1px solid #f1f5f9;
    color: #1f2937;
  }
  .center { text-align: center; }
  .data-row:hover { background: #f0f9ff; }

  .actions button.mat-mdc-icon-button {
    --mdc-icon-button-state-layer-size: 34px;
  }
  .actions button.mat-mdc-icon-button:hover mat-icon { color: #06b6d4; }

  /* --------- Chip “Compartido” al estilo primario --------- */
  .chip-primary {
    background: #ecfeff !important;
    color: #0369a1 !important;
    border: 1px solid #06b6d4 !important;
  }

  /* --------- Responsive --------- */
  @media (max-width: 640px) {
    .w-72 { width: 100% !important; }
  }

  /* --------- Dark mode opcional --------- */
  .dark .card { background: #111827; border-color: #374151; }
  .dark .header-row { background: #111827; }
  .dark .th { color: #e5e7eb; border-bottom-color: #374151; }
  .dark .td { color: #e5e7eb; border-bottom-color: #374151; }
  .dark .data-row:hover { background: #1f2937; }
  .dark .field .mdc-text-field { border-color: #4b5563; }
  .dark .field .mdc-text-field:hover,
  .dark .field .mdc-text-field.mdc-text-field--focused { border-color: #06b6d4; }
  `]
})
export class InventarioPage {
  private svc = inject(InventoryService);
  private products = inject(ProductsService);
  private dialog = inject(MatDialog);
  private toast = inject(Toast);

  q = new FormControl('', { nonNullable: true });
  loading = signal(false);
  data = signal<InventorySearchItem[]>([]);
  displayedColumns = ['sku','nombre','sucursal','stock','acciones'];

  constructor() {
    this.q.valueChanges.pipe(
      startWith(''),
      debounceTime(250),
      distinctUntilChanged(),
      tap(() => this.loading.set(true)),
      switchMap(txt => this.svc.search(txt ?? ''))
    ,
      takeUntilDestroyed()).subscribe({
      next: res => { this.data.set(res); this.loading.set(false); },
      error: _ => { this.data.set([]); this.loading.set(false); }
    });
  }

  rows = computed(() => this.data());

  async nuevoProducto() {
    const { ProductDialogComponent } = await import('./product-dialog.component');
    this.dialog.open(ProductDialogComponent, { data: { mode: 'create' } })
      .afterClosed().subscribe(created => {
        if (created) {
          this.toast.ok('Producto creado');
          this.q.setValue(this.q.value);
        }
      });
  }

  async editarProducto(r: InventorySearchItem) {
    this.products.list(r.sku).subscribe({
      next: async list => {
        const p = list.find(x => x.id === r.productId);
        if (!p) return;
        const { ProductDialogComponent } = await import('./product-dialog.component');
        this.dialog.open(ProductDialogComponent, { data: { mode: 'edit', product: p } })
          .afterClosed().subscribe(updated => {
            if (updated) {
              this.toast.ok('Producto actualizado');
              this.q.setValue(this.q.value);
            }
          });
      }
    });
  }

  async openMovimiento(r: InventorySearchItem, tipo: 'Entrada'|'Salida'|'Traslado') {
    const { MovementDialogComponent } = await import('./movement-dialog.component');
    const ref = this.dialog.open(MovementDialogComponent, {
      data: {
        productoId: r.productId,
        productoNombre: r.nombre,
        sucursalIdActual: r.sucursalId,
        sucursalNombreActual: r.sucursalNombre
      }
    });
    ref.componentInstance.form.patchValue({ tipo });
    ref.afterClosed().subscribe(ok => { if (ok) this.q.setValue(this.q.value); });
  }
}

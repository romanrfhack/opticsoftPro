import { Component, EventEmitter, inject, Input, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { GuardarConceptosResponse, TotalesCobro } from './ordenes.models';
import { HistoriasService } from '../../core/historias.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { mapTotalesToConceptos } from '../../shared/mappers/conceptos.mapper';
import { VisitasCostosService } from '../../core/visitasCostos.service';
import { EnviarLabDialog } from '../../clinica/enviar-lab.dialog';
import { MatDialog } from '@angular/material/dialog';


@Component({
  selector: 'app-orden-pagos',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  template: `
<mat-card class="form-card">
  <mat-card-header class="border-b border-gray-100 pb-4 mb-4">
    <mat-card-title class="flex items-center gap-2 text-lg font-semibold">
      <mat-icon [style.color]="'#06b6d4'">payments</mat-icon>
      Total a Cobrar y Observaciones
    </mat-card-title>
    <mat-card-subtitle class="text-gray-600">Desglose de costos para esta orden</mat-card-subtitle>
  </mat-card-header>

  <mat-card-content class="space-y-10">
    <div class="flex justify-end mb-2" *ngIf="showAgregarCostoConcepto">    
      <!-- Desglose de costos -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div class="space-y-3">
          <!-- Consulta -->
          <div class="flex items-center justify-between">
            <label class="text-sm font-medium text-gray-700">Consulta:</label>
            <div class="flex items-center gap-2">
              <span class="text-xs text-gray-500">$</span>
              <input type="number" [(ngModel)]="precioConsulta" min="0" step="0.01"
                class="w-24 px-2 py-1 border border-gray-300 rounded text-sm text-right"
                placeholder="0.00" />
            </div>
          </div>

          <!-- Servicios -->
          <div class="flex items-center justify-between">
            <label class="text-sm font-medium text-gray-700">Servicios:</label>
            <div class="flex items-center gap-2">
              <span class="text-xs text-gray-500">$</span>
              <input type="number" [(ngModel)]="precioServicios" min="0" step="0.01"
                class="w-24 px-2 py-1 border border-gray-300 rounded text-sm text-right"
                placeholder="0.00" />
            </div>
          </div>

          <!-- Materiales -->
          <div class="flex items-center justify-between">
            <label class="text-sm font-medium text-gray-700">
              Materiales ({{ materialesCount }}):
            </label>
            <div class="flex items-center gap-2">
              <span class="text-xs text-gray-500">$</span>
              <input type="number" [(ngModel)]="precioMateriales" min="0" step="0.01"
                class="w-24 px-2 py-1 border border-gray-300 rounded text-sm text-right"
                placeholder="0.00" />
            </div>
          </div>
        </div>

        <div class="space-y-3">
          <!-- Armazones -->
          <div class="flex items-center justify-between">
            <label class="text-sm font-medium text-gray-700">Armazones ({{ armazonesCount }}):</label>
            <div class="flex items-center gap-2">
              <span class="text-xs text-gray-500">$</span>
              <input type="number" [(ngModel)]="precioArmazones" min="0" step="0.01"
                class="w-24 px-2 py-1 border border-gray-300 rounded text-sm text-right"
                placeholder="0.00" />
            </div>
          </div>

          <!-- Lentes de Contacto -->
          <div class="flex items-center justify-between">
            <label class="text-sm font-medium text-gray-700">
              Lentes Contacto ({{ lentesContactoCount }}):
            </label>
            <div class="flex items-center gap-2">
              <span class="text-xs text-gray-500">$</span>
              <input type="number" [(ngModel)]="precioLentesContacto" min="0" step="0.01"
                class="w-24 px-2 py-1 border border-gray-300 rounded text-sm text-right"
                placeholder="0.00" />
            </div>
          </div>

          <div class="h-8"></div>
        </div>
      </div>
    </div>

      <!-- Total General -->
      <div class="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 border border-green-200">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <mat-icon class="text-green-600">summarize</mat-icon>
            <span class="font-medium text-green-800">TOTAL GENERAL:</span>
          </div>
          <div class="text-right">
            <div class="text-2xl font-bold text-green-900">{{ formatearMoneda(totalACobrar) }}</div>
            <div class="text-sm text-green-700">IVA incluido</div>
          </div>
        </div>

        <div class="mt-3 grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
          <div *ngIf="precioConsulta > 0" class="text-center bg-white rounded p-1">
            <div class="font-medium">Consulta</div>
            <div class="text-green-600">{{ formatearMoneda(precioConsulta) }}</div>
          </div>
          <div *ngIf="precioServicios > 0" class="text-center bg-white rounded p-1">
            <div class="font-medium">Servicios</div>
            <div class="text-green-600">{{ formatearMoneda(precioServicios) }}</div>
          </div>
          <div *ngIf="precioMateriales > 0" class="text-center bg-white rounded p-1">
            <div class="font-medium">Materiales</div>
            <div class="text-green-600">{{ formatearMoneda(precioMateriales) }}</div>
          </div>
          <div *ngIf="precioArmazones > 0" class="text-center bg-white rounded p-1">
            <div class="font-medium">Armazones</div>
            <div class="text-green-600">{{ formatearMoneda(precioArmazones) }}</div>
          </div>
        
          <div *ngIf="precioLentesContacto > 0" class="text-center bg-white rounded p-1">
            <div class="font-medium">Lentes Contacto</div>
            <div class="text-green-600">{{ formatearMoneda(precioLentesContacto) }}</div>
          </div>
        </div>
      </div>

      <div class="mt-3 text-xs text-gray-500 text-center">
        Este total se enviará al módulo de pagos al registrar un pago/adelanto
      </div>

      <!-- Observaciones -->
      <mat-form-field appearance="fill" class="w-full custom-form-field">
        <mat-label>Observaciones y notas</mat-label>
        <textarea rows="4" matInput [(ngModel)]="observaciones" placeholder="Escribe observaciones de la orden..."></textarea>
        <mat-icon matPrefix class="prefix-icon">notes</mat-icon>
      </mat-form-field>

    <!-- Acciones -->
    <div class="flex gap-3">
      <button *ngIf="showAgregarCostoConcepto" mat-flat-button color="primary" class="save-button flex-1 py-3" (click)="onGuardar()">
        <mat-icon>save</mat-icon>
        Guardar totales/observaciones
      </button>

      <button *ngIf="showAgregarPago" mat-flat-button color="accent" class="payment-button flex-1 py-3" (click)="registrarPagoEncargado()">
        <mat-icon>payments</mat-icon>
        Registrar pago / adelanto
      </button>
    </div>
  </mat-card-content>
</mat-card>
  `,
  styles: [`
    .form-card { border-radius: 1rem; overflow: hidden; }
    .save-button, .payment-button { display: inline-flex; align-items: center; gap: .5rem; }
  `],
})
export class OrdenPagosComponent implements OnInit {
  /** Id de la visita/orden (para guardar en backend si lo deseas) */
  @Input() visitaId!: string | number;

  /** Contadores informativos (útiles para mostrar cantidades seleccionadas) */
  @Input() materialesCount = 0;
  @Input() armazonesCount = 0;
  @Input() lentesContactoCount = 0;

  /** Precios (inicialízalos desde la orden) */
  @Input() precioConsulta = 0;
  @Input() precioServicios = 0;
  @Input() precioMateriales = 0;
  @Input() precioArmazones = 0;
  @Input() precioLentesContacto = 0;

  /** Observaciones (acompañan al total) */
  @Input() observaciones = '';

  /** Eventos para que ordenes.page.ts persista o inicie el flujo de pago */
  @Output() guardar = new EventEmitter<{
    visitaId: string | number;
    totales: TotalesCobro;
    observaciones: string;
  }>();

  @Output() registrarPago = new EventEmitter<{ visitaId: string | number; total: number }>();
  guardando = false;

  private apiVCS = inject(VisitasCostosService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  showAgregarCostoConcepto = false;
  showAgregarPago = false;

  get totalACobrar(): number {
    return (
      (this.precioConsulta || 0) +
      (this.precioServicios || 0) +
      (this.precioMateriales || 0) +
      (this.precioArmazones || 0) +
      (this.precioLentesContacto || 0)
    );
  }

  ngOnInit() {
    this.validShowAgregarCostoConcepto();
  }

  validShowAgregarCostoConcepto() {
    //this.precioConsulta
    console.log('Validando showAgregarCostoConcepto con precioConsulta:', this.precioConsulta);

    console.log('Validando showAgregarCostoConcepto con totalACobrar:', this.totalACobrar);
    if (this.totalACobrar > 0) {
      this.showAgregarCostoConcepto = false;      
    } else {
      this.showAgregarCostoConcepto = true;
      this.snackBar.open('El total a cobrar debe ser mayor a cero.', 'OK', { duration: 3000 });
    }
  }

  formatearMoneda(v?: number) {
    return (v ?? 0).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
  }

  onGuardar() {
    // 1) Armar payload para el endpoint
    const totales: TotalesCobro = {
      consulta: this.precioConsulta || 0,
      servicios: this.precioServicios || 0,
      materiales: this.precioMateriales || 0,
      armazones: this.precioArmazones || 0,
      lentesContacto: this.precioLentesContacto || 0,
      total: this.totalACobrar,
    };
    const conceptos = mapTotalesToConceptos(totales, this.observaciones);
    if (conceptos.length === 0) {
      this.snackBar.open('No hay conceptos con monto para guardar.', 'OK', { duration: 3000 });
      return;
    }

    this.guardando = true;
    this.apiVCS.guardarConceptos(this.visitaId, { conceptos })
      .subscribe({
        next: (res: GuardarConceptosResponse) => {
          // 2) Actualiza la UI local si quieres reflejar totales
          console.log('Conceptos guardados:', res);
          // if (this.visitaId && res.total !== undefined) { {
          //   this.totalACobrar = res.total;
          //   this.ordenSeleccionada.aCuenta = 0;
          //   this.ordenSeleccionada.resta = res.total;
          // }
          this.showAgregarPago = true;
          this.snackBar.open('Conceptos guardados y totales recalculados.', 'OK', { duration: 3000 });
        },
        error: (err) => {
          console.error(err);
          this.snackBar.open('No se pudieron guardar los conceptos.', 'OK', { duration: 4000 });
        },
        complete: () => (this.guardando = false),
      });
  }

  // onRegistrarPago() {
  //   this.registrarPago.emit({ visitaId: this.visitaId, total: this.totalACobrar });
  // }

  registrarPagoEncargado() {
      // Usamos el id de la visita (historiaId) y la resta como total pendiente
      const dialogRef = this.dialog.open(EnviarLabDialog, {      
        maxWidth: '100vw',               
        panelClass: [
          'w-full', 'sm:w-11/12', 'md:w-4/5', 'max-w-screen-xl'
        ],
        data: { 
          historiaId: this.visitaId, 
          total: this.totalACobrar 
        }
      });
  
      dialogRef.afterClosed().subscribe(resultado => {
        if (resultado?.success) {
          console.log('✅ Pagos registrados exitosamente:', resultado.pagos);
          console.log('💰 Total pagado:', resultado.totalPagado);
          
          // Podemos mostrar un mensaje de éxito
          this.snackBar.open('Pagos registrados correctamente', 'Cerrar', { 
            duration: 3000,
            panelClass: ['bg-green-500', 'text-white']
          });
  
          // Aquí podrías recargar los datos de la visita si es necesario
          // this.recargarVisita();
        }
      });
    }
}

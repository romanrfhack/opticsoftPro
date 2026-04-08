import { ChangeDetectionStrategy, Component, Inject, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormArray, FormBuilder, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { NgxMaskDirective } from 'ngx-mask';

// Agregar el servicio
import { HistoriasService } from '../core/historias.service';

export interface EnviarLabData {
  historiaId: string;
  total?: number;
}

export interface PagoRequest {
  metodo: string;
  monto: number;
  autorizacion?: string;
  nota?: string;
}

@Component({
  standalone: true,
  selector: 'app-enviar-lab-dialog',
  imports: [
    CommonModule,
    ReactiveFormsModule, 
    MatDialogModule, MatFormFieldModule, MatInputModule, 
    MatSelectModule, MatButtonModule, MatIconModule, MatCardModule,    
    NgxMaskDirective,
    MatProgressBarModule // Agregar para el loading
  ],
  template: `
  <div class="p-6 w-full">
    <form [formGroup]="form" class="p-6 w-full" (ngSubmit)="registrarPagos()">
      
      <!-- Loading State -->
      <div *ngIf="procesando()" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white rounded-lg p-6 flex flex-col items-center">
          <mat-progress-bar mode="indeterminate" class="w-64 mb-4"></mat-progress-bar>
          <span class="text-gray-700">Registrando pagos...</span>
        </div>
      </div>

      <!-- Resumen de Total -->
      <div *ngIf="data?.total as t" class="bg-blue-50 rounded-lg p-4 border border-blue-200">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <mat-icon class="text-blue-600">payments</mat-icon>
            <span class="font-medium text-blue-800">Total a cubrir:</span>
          </div>
          <span class="text-xl font-bold text-blue-900">{{ t | number:'1.2-2' }}</span>
        </div>
      </div>

      <!-- Pagos -->
      <mat-card class="p-6 w-full form-card">
        <mat-card-header class="border-b border-gray-100 pb-4 mb-4">
          <mat-card-title class="flex items-center gap-2 text-lg font-semibold">
            <mat-icon class="text-primary">payments</mat-icon>
            Registro de Pagos
          </mat-card-title>
          <mat-card-subtitle class="text-gray-600">Agrega los métodos de pago utilizados</mat-card-subtitle>
        </mat-card-header>
        
        <mat-card-content>
          <section formArrayName="pagos" class="space-y-4">
            <div class="flex items-center justify-between">
              <h3 class="font-medium text-gray-700">Pagos registrados</h3>
              <button mat-stroked-button 
                      type="button" 
                      (click)="agregarPago()"
                      class="action-button"
                      [disabled]="procesando()">
                <mat-icon>add</mat-icon>
                Agregar pago
              </button>
            </div>

            <div class="space-y-3">
              <div *ngFor="let pago of pagos.controls; let i = index; trackBy: trackByIndex"
                   [formGroupName]="i"
                   class="pago-item bg-gray-50 rounded-lg p-4 transition-all hover:bg-gray-100">
                <div class="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                  <mat-form-field appearance="fill" class="md:col-span-3 custom-form-field">
                    <mat-label>Método de pago</mat-label>
                    <mat-select formControlName="metodo" [disabled]="procesando()">
                      <mat-option value="Efectivo">Efectivo</mat-option>
                      <mat-option value="Tarjeta">Tarjeta</mat-option>
                      <mat-option value="Transferencia">Transferencia</mat-option>
                    </mat-select>
                    <mat-icon matPrefix class="prefix-icon">payment</mat-icon>
                  </mat-form-field>                  

                  <mat-form-field appearance="fill" class="md:col-span-3 custom-form-field">
                    <mat-label>Monto</mat-label>
                    <input 
                      matInput 
                      type="text"
                      formControlName="monto" 
                      mask="separator.2"
                      [thousandSeparator]="','"
                      [separatorLimit]="'100000000'"
                      [prefix]="'$ '"
                      [allowNegativeNumbers]="false"
                      placeholder="$ 0.00"
                      [disabled]="procesando()" 
                    />
                    <mat-icon matPrefix class="prefix-icon">attach_money</mat-icon>
                    <mat-error *ngIf="pago.get('monto')?.hasError('required')">El monto es requerido</mat-error>
                    <mat-error *ngIf="pago.get('monto')?.hasError('min')">El monto debe ser ≥ 0</mat-error>
                  </mat-form-field>

                  <mat-form-field appearance="fill" class="md:col-span-3 custom-form-field">
                    <mat-label>Autorización</mat-label>
                    <input matInput formControlName="autorizacion" 
                           placeholder="Número de autorización" 
                           [disabled]="procesando()" />
                    <mat-icon matPrefix class="prefix-icon">verified</mat-icon>
                  </mat-form-field>

                  <div class="md:col-span-3 flex items-center gap-2">
                    <mat-form-field appearance="fill" class="flex-1 custom-form-field">
                      <mat-label>Nota adicional</mat-label>
                      <input matInput formControlName="nota" 
                             placeholder="Observación del pago" 
                             [disabled]="procesando()" />
                      <mat-icon matPrefix class="prefix-icon">note</mat-icon>
                    </mat-form-field>
                    <button mat-icon-button 
                            type="button" 
                            (click)="eliminarPago(i)"
                            class="remove-button"
                            [disabled]="pagos.length <= 1 || procesando()">
                      <mat-icon>delete</mat-icon>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- Resumen de Pagos -->
          <div *ngIf="data?.total as t" class="mt-6 pt-4 border-t border-gray-200">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div class="bg-green-50 rounded-lg p-3 border border-green-200">
                <div class="text-sm font-medium text-green-700">Total a Cubrir</div>
                <div class="text-lg font-bold text-green-900">{{ t | number:'1.2-2' }}</div>
              </div>
              <div class="bg-blue-50 rounded-lg p-3 border border-blue-200">
                <div class="text-sm font-medium text-blue-700">Pagado</div>
                <div class="text-lg font-bold text-blue-900">{{ totalPagos | number:'1.2-2' }}</div>
              </div>
              <div [class]="obtenerClasePendiente(t)" class="rounded-lg p-3 border">
                <div class="text-sm font-medium">Pendiente</div>
                <div class="text-lg font-bold">{{ (t - totalPagos) | number:'1.2-2' }}</div>
              </div>
            </div>
            
            <div *ngIf="totalPagos > t" class="mt-3 p-3 bg-red-50 rounded-lg border border-red-200">
              <div class="flex items-center gap-2 text-red-700">
                <mat-icon class="text-base">warning</mat-icon>
                <span class="text-sm font-medium">El monto pagado excede el total a cubrir</span>
              </div>
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Acciones -->
      <div class="flex justify-end gap-3 pt-4">
        <button mat-stroked-button 
                type="button" 
                (click)="cancelar()"
                class="cancel-button"
                [disabled]="procesando()">
          <mat-icon>cancel</mat-icon>
          Cancelar
        </button>
        <button mat-flat-button 
                color="primary" 
                type="submit" 
                [disabled]="form.invalid || ((data.total ?? 0) > 0 && totalPagos > (data.total ?? 0)) || procesando()"
                class="save-button">
          <mat-icon>send</mat-icon>
          {{ procesando() ? 'Registrando...' : 'Registrar pagos' }}
        </button>
      </div>
    </form>
  </div>
  `,
  styles: [`    
    :host {
      display: block;
      width: 100%;      
      max-height: 90vh;
      overflow: auto;
    }

    .form-card { 
      border-radius: 16px; 
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
      border-left: 4px solid #06b6d4;
      transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
    }

    .form-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    }

    .text-primary {
      color: #06b6d4;
    }

    .save-button {
      background-color: #06b6d4 !important;
      color: white !important;
      border-radius: 8px;
      padding: 0 24px;
      transition: all 0.3s ease;
    }

    .save-button:hover:not(:disabled) {
      background-color: #0891b2 !important;
      transform: scale(1.02);
    }

    .save-button:disabled {
      background-color: #cbd5e1 !important;
      transform: none;
    }

    .cancel-button {
      border-color: #94a3b8;
      color: #64748b;
      border-radius: 8px;
      padding: 0 20px;
      transition: all 0.3s ease;
    }

    .cancel-button:hover {
      border-color: #06b6d4;
      color: #06b6d4;
    }

    .action-button {
      border-color: #06b6d4;
      color: #06b6d4;
      border-radius: 8px;
      transition: all 0.3s ease;
    }

    .action-button:hover {
      background-color: rgba(6, 182, 212, 0.1);
      transform: scale(1.02);
    }

    .remove-button {
      color: #94a3b8;
      transition: all 0.3s ease;
    }

    .remove-button:hover:not(:disabled) {
      color: #ef4444;
      background-color: rgba(239, 68, 68, 0.1);
      transform: scale(1.1);
    }

    .remove-button:disabled {
      color: #cbd5e1;
      cursor: not-allowed;
    }

    .pago-item {
      border: 1px solid #e2e8f0;
      transition: all 0.3s ease;
    }

    .pago-item:hover {
      border-color: #06b6d4;
      box-shadow: 0 2px 4px rgba(6, 182, 212, 0.1);
    }

    .custom-form-field {
      width: 100%;
    }

    .prefix-icon {
      color: #06b6d4;
      margin-right: 8px;
    }

    .mat-form-field-appearance-fill .mat-form-field-flex {
      background-color: rgba(255, 255, 255, 0.9);
      border-radius: 8px;
      padding: 0.75em 0.75em 0 0.75em;
      transition: all 0.3s ease;
    }

    .mat-form-field-appearance-fill.mat-form-field-can-float.mat-form-field-should-float .mat-form-field-label {
      transform: translateY(-0.5em) scale(0.75);
    }

    .mat-form-field-appearance-fill .mat-form-field-underline::before {
      background-color: #e2e8f0;
    }

    .mat-form-field-appearance-fill.mat-focused .mat-form-field-flex {
      background-color: rgba(255, 255, 255, 1);
      box-shadow: 0 0 0 2px rgba(6, 182, 212, 0.2);
    }

    .mat-form-field-appearance-fill.mat-focused .mat-form-field-label {
      color: #06b6d4;
    }

    .mat-form-field-appearance-fill.mat-focused .mat-form-field-ripple {
      background-color: #06b6d4;
    }

    .mat-form-field.mat-form-field-invalid .mat-form-field-flex {
      background-color: rgba(254, 242, 242, 0.9);
    }

    mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EnviarLabDialog {
  private fb = inject(FormBuilder);
  private ref = inject(MatDialogRef<EnviarLabDialog>);
  private snackBar = inject(MatSnackBar);
  private historiasService = inject(HistoriasService); 

  constructor(@Inject(MAT_DIALOG_DATA) public data: EnviarLabData) {}

  procesando = signal(false);

  // Formulario simplificado solo para pagos
  form = this.fb.group({
    pagos: this.fb.array([
      this.crearGrupoPago()
    ])
  });

  get pagos(): FormArray { 
    return this.form.get('pagos') as FormArray; 
  }

  get totalPagos(): number {
    return this.pagos.controls.reduce((total, control) => {
      const monto = control.get('monto')?.value;
      return total + this.convertirMontoANumero(monto);
    }, 0);
  }

  private crearGrupoPago() {
    return this.fb.group({
      metodo: ['Efectivo', Validators.required],
      monto: ['', [Validators.required, Validators.min(0)]],
      autorizacion: [''],
      nota: ['']
    });
  }  

  private convertirMontoANumero(montoStr: string | number | null): number {
  console.log('Convirtiendo monto:', montoStr);
  if (!montoStr) return 0;
    
  if (typeof montoStr === 'number') {
    console.log('Monto ya es número:', montoStr);
    return montoStr;
  }
    
  const numeroConvertido = parseFloat(montoStr.replace('$ ', '').replace(/,/g, ''));
  console.log('Monto convertido a número:', numeroConvertido);
  return numeroConvertido;
}

  obtenerClasePendiente(total: number): string {
    const pendiente = total - this.totalPagos;
    if (pendiente === 0) {
      return 'bg-green-50 border-green-200 text-green-900';
    } else if (pendiente > 0) {
      return 'bg-yellow-50 border-yellow-200 text-yellow-900';
    } else {
      return 'bg-red-50 border-red-200 text-red-900';
    }
  }

  agregarPago() {
    this.pagos.push(this.crearGrupoPago());
  }

  eliminarPago(indice: number) {
    if (this.pagos.length > 1) {
      this.pagos.removeAt(indice);
    }
  }

  trackByIndex = (indice: number, _: unknown) => indice;

  cancelar() { 
    this.ref.close(); 
  }

  registrarPagos() {
    if (this.form.invalid) {
      this.mostrarError('❌ Por favor complete todos los campos requeridos');
      return;
    }

    if (typeof this.data?.total === 'number' && this.totalPagos > this.data.total) {
      this.mostrarError('❌ El monto pagado no puede exceder el total a cubrir');
      return;
    }

    // Validar que al menos un pago tenga monto > 0 si hay total
    if (this.data?.total && this.data.total > 0) {
      const tienePagoValido = this.pagos.controls.some(control => 
        this.convertirMontoANumero(control.get('monto')?.value) > 0
      );
      
      if (!tienePagoValido) {
        this.mostrarAdvertencia('⚠️ Debe registrar al menos un pago para enviar la orden');
        return;
      }
    }

    // Preparar datos para enviar al servicio
    const pagosParaEnviar: PagoRequest[] = this.pagos.controls.map(control => ({
      metodo: control.get('metodo')?.value,
      monto: this.convertirMontoANumero(control.get('monto')?.value),
      autorizacion: control.get('autorizacion')?.value || undefined,
      nota: control.get('nota')?.value || undefined
    }));

    // Llamar al servicio directamente desde aquí
    this.procesando.set(true);
    
    this.historiasService.agregarPagos(this.data.historiaId, pagosParaEnviar).subscribe({
      next: () => {
        this.mostrarExito('✅ Pagos registrados exitosamente');
        this.ref.close({ 
          success: true, 
          pagos: pagosParaEnviar,
          totalPagado: this.totalPagos
        });
      },
      error: (err) => {
        console.error('Error al registrar pagos:', err);
        this.mostrarError('❌ Ocurrió un error al registrar los pagos. Intente nuevamente.');
        this.procesando.set(false);
      }
    });
  }

  private mostrarError(mensaje: string) {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 3000,
      panelClass: ['bg-red-500', 'text-white']
    });
  }

  private mostrarAdvertencia(mensaje: string) {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 4000,
      panelClass: ['bg-yellow-500', 'text-white']
    });
  }

  private mostrarExito(mensaje: string) {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 3000,
      panelClass: ['bg-green-500', 'text-white']
    });
  }
}
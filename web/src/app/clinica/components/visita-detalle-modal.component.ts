import { Component, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { RxMedicion, VisitaCompleta } from '../../core/models/clinica.models';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { EnviarLabDialog } from '../enviar-lab.dialog';
import { OrdenPagosComponent } from '../../features/ordenes/orden-pagos.component';
import { TotalesCobro } from '../../features/ordenes/ordenes.models';
import { SignoPositivoPipe } from '../../shared/tools/signo-positivo.pipe';


@Component({
  standalone: true,
  selector: 'app-visita-detalle-modal',
  imports: [CommonModule, MatDialogModule, MatIconModule, MatSnackBarModule, OrdenPagosComponent, SignoPositivoPipe],
  template: `
    <div class="modal-container   rounded-2xl shado xl max-h-[95vh] overflow-hidden flex flex-col">

      <!-- Header -->
      <header class="bg-gradient-to-r from-cyan-50 to-blue-50 border-b border-[#06b6d4] px-6 py-4">
        <div class="flex items-center justify-between  ">
          <div class="flex items-center gap-4 min-w-0 ">
            <div class="h-11 w-11 rounded-xl bg-[#06b6d4] flex items-center justify-center shadow-lg shrink-0">
              <mat-icon class="text-white  ">visibility</mat-icon>
            </div>
            <div class="min-w-0 gap-4">
              <h1 class="   text-2xl     truncate">Detalle de Visita</h1>
              <div class="flex flex-row items-start justify-between gap-4 ">
                <div class="flex flex-row items-start justify-between gap-2">
                  <mat-icon>event</mat-icon>
                  <span>{{ data.fecha | date:'mediumDate' }}</span>
                </div>
                <div class="flex flex-row items-start justify-between gap-2">
                  <mat-icon>business</mat-icon>
                  <span>{{ data.nombreSucursal }}</span>
                </div>
                <div class="flex flex-row items-start justify-between gap-2">
                  <mat-icon>person</mat-icon>
                  <span>{{ data.usuarioNombre }}</span>
                </div>
              </div>
            </div>
          </div>
          <button type="button" (click)="cerrar()"
            class="h-10 w-10 rounded-full   shadow hover:shadow-md transition-all duration-200 flex items-center justify-center text-gray-500 hover:text-[#06b6d4] hover:bg-cyan-50">
            <mat-icon>close</mat-icon>
          </button>
        </div>
      </header>

      <!-- Contenido principal SIN navegación -->
      <main class="flex-1 overflow-y-auto">
        
        <div class="p-4  p-6">
          <div class="flex items-center justify-between gap-4 mb-6">
              <div class="status-badge" [ngClass]="getEstadoBadgeClass(data.estado)">
                <span class="status-dot" [ngClass]="getEstadoDotClass(data.estado)"></span>
                  {{ data.estado }}
              </div>                  
          </div>          
           
          <div class="flex flex-wrap gap-6 no-scrollbar">
            <!-- RESUMEN -->             
            <!-- En la sección de RESUMEN/Pagos -->
            <section id="resumen" class="grid-item">
              <div class="flex flex-wrap gap-4 bg-[#06b6d4]/10 p-3 rounded-lg mb-4">
                <mat-icon class="section-icon">remove_red_eye</mat-icon>
                <h2 class="section-title">Pagos</h2>
              </div>
              <div class="content-card content-section">
                
                <!-- Botón para agregar pago -->
                <div class="mb-4 flex justify-end">
                  <button mat-flat-button 
                          color="primary" 
                          (click)="registrarPago()"
                          [disabled]="!data.resta || data.resta <= 0"
                          class="save-button">
                    <mat-icon>add_circle</mat-icon>
                    {{ (data.resta && data.resta > 0) ? 'Agregar Pago' : 'Pagado Completamente' }}
                  </button>
                </div>

                <div class="grid grid-cols-3">
                  <div class="kpi-item">
                    <div class="kpi-label">Total</div>
                    <div class="kpi-value">{{ data.total | currency }}</div>
                  </div>
                  <div class="kpi-item">
                    <div class="kpi-label">A cuenta</div>
                    <div class="kpi-value text-emerald-600">{{ data.aCuenta | currency }}</div>
                  </div>
                  <div class="kpi-item">
                    <div class="kpi-label">Resta</div>
                    <div class="kpi-value" [class]="getRestaColorClass()">{{ data.resta | currency }}</div>
                  </div>
                </div>
              </div>
            </section>

            <!-- AGUDEZA VISUAL -->
            <section id="av" class="grid-item">
              <div class="content-card content-section h-full">
                <div class="flex flex-wrap gap-4 bg-[#06b6d4]/10 p-3 rounded-lg mb-4">
                  <mat-icon class="section-icon">remove_red_eye</mat-icon>
                  <h2 class="section-title">Agudeza Visual</h2>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 ">
                  <div class="vision-card">
                    <div class="flex flex-row items-start justify-between gap-2 bg-blue-50">
                      <mat-icon class="text-blue-500">visibility_off</mat-icon>
                      <h3 class="card-title">Sin lentes</h3>
                    </div>
                    <div class="vision-content">
                      <div *ngFor="let av of agudezasSinLentes" class="flex flex-row items-start justify-between  ">
                        <span class="eye-label">{{ av.ojo }}</span>
                        <span class="vision-value">20/{{ av.denominador }}</span>
                      </div>
                      <div *ngIf="agudezasSinLentes.length === 0" class="empty-state">
                        <mat-icon>remove_circle</mat-icon>
                        Sin datos
                      </div>
                    </div>
                  </div>
                  <div class="vision-card">
                    <div class="flex flex-row items-start justify-between gap-2 bg-green-50">
                      <mat-icon class="text-green-500">visibility</mat-icon>
                      <h3 class="card-title">Con lentes</h3>
                    </div>
                    <div class="vision-content">
                      <div *ngFor="let av of agudezasConLentes" class="flex flex-row items-start justify-between  ">
                        <span class="eye-label">{{ av.ojo }}</span>
                        <span class="vision-value">20/{{ av.denominador }}</span>
                      </div>
                      <div *ngIf="agudezasConLentes.length === 0" class="empty-state">
                        <mat-icon>remove_circle</mat-icon>
                        Sin datos
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <!-- RX - Prescripción -->
            <section id="rx" class="grid-item">
              <div class="content-card content-section h-full">
                <div class="flex flex-wrap gap-4 bg-[#06b6d4]/10 p-3 rounded-lg mb-4">
                  <mat-icon class="section-icon">healing</mat-icon>
                  <h2 class="section-title">Prescripción RX</h2>                  
                </div>
                <div class="table-wrapper overflow-x-auto rounded-lg shadow-sm border border-gray-200">
                  <table class="modern-table">
                    <thead class="bg-gray-50">
                      <tr>
                        <th class="px-2 py-2 text-left text-sm font-semibold text-gray-700 min-w-[50px]">Distancia</th>
                        <th class="px-2 py-2 text-left text-sm font-semibold text-gray-700 min-w-[50px]">Ojo</th>
                        <th class="px-2 py-2 text-left text-sm font-semibold text-gray-700 min-w-[50px]">Esf.</th>
                        <th class="px-2 py-2 text-left text-sm font-semibold text-gray-700 min-w-[50px]">Cyl.</th>
                        <th class="px-2 py-2 text-left text-sm font-semibold text-gray-700 min-w-[50px]">Eje</th>
                        <th class="px-2 py-2 text-left text-sm font-semibold text-gray-700 min-w-[50px]">ADD</th>
                        <th class="px-2 py-2 text-left text-sm font-semibold text-gray-700 min-w-[50px]">DIP</th>
                        <th class="px-2 py-2 text-left text-sm font-semibold text-gray-700 min-w-[50px]">Alt. Obl.</th>
                      </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                      <tr *ngFor="let r of data.rx" class="hover:bg-gray-50 transition-colors">
                        <td class="px-2 py-2 whitespace-nowrap text-sm font-medium text-cyan-500">{{ r.distancia }}</td>
                        <td class="px-2 py-2 whitespace-nowrap text-sm text-gray-900">{{ r.ojo  }}</td>
                        <td class="px-2 py-2 whitespace-nowrap text-sm text-gray-900">{{ r.esf | signoPositivo }}</td>
                        <td class="px-2 py-2 whitespace-nowrap text-sm text-gray-900">{{ r.cyl | signoPositivo }}</td>
                        <td class="px-2 py-2 whitespace-nowrap text-sm text-gray-900">{{ r.eje  }}</td>
                        <td class="px-2 py-2 whitespace-nowrap text-sm text-gray-900">{{ r.add  }}</td>
                        <td class="px-2 py-2 whitespace-nowrap text-sm text-gray-900">{{ r.dip  }}</td>
                        <td class="px-2 py-2 whitespace-nowrap text-sm text-gray-900">{{ r.altOblea ?? '-' }}</td>
                      </tr>
                      <tr *ngIf="!data.rx || data.rx.length === 0">
                        <td colspan="8" class="empty-table">
                          <div class="flex flex-col items-center justify-center">
                            <mat-icon class="text-gray-400 mb-2">description</mat-icon>
                            <span class="text-sm">No hay datos de prescripción</span>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            <!-- MATERIALES -->
            <section id="materiales" class="grid-item">
              <div class="content-card content-section h-full">
                <div class="flex flex-row gap-4 items-start justify-start   bg-[#06b6d4]/10 p-3 rounded-lg mb-4">
                  <mat-icon class="section-icon">layers</mat-icon>
                  <h2 class="section-title">Materiales</h2>
                </div>
                <ng-container *ngIf="data.materiales?.length; else noMateriales">
                  <div>
                    <div *ngFor="let m of data.materiales" class="item-card">
                      <h4 class="item-title">{{ m.material.descripcion }}</h4>
                      <div class="item-details">
                        <div *ngIf="m.material?.marca" class="item-detail">
                          <span class="detail-label">Marca:</span>
                          <span class="detail-value">{{ m.material.marca }}</span>
                        </div>
                        <div *ngIf="m.observaciones" class="item-detail">
                          <span class="detail-label">Observaciones:</span>
                          <span class="detail-value">{{ m.observaciones }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </ng-container>
                <ng-template #noMateriales>
                  <div class="flex flex-row items-start justify-between gap-2">
                    <mat-icon>inventory_2</mat-icon>
                    <span>No se seleccionaron materiales</span>
                  </div>
                </ng-template>
              </div>
            </section>

            <!-- ARMAZONES -->
            <section id="armazones" class="grid-item">
              <div class="content-card content-section h-full">
                <div class="flex flex-row gap-4 items-start justify-start bg-[#06b6d4]/10 p-3 rounded-lg mb-4">
                  <mat-icon class="section-icon">home</mat-icon>
                  <h2 class="section-title">Armazones</h2>
                </div>
                <ng-container *ngIf="data.armazones?.length; else noArmazones">
                  <div class=" ">
                    <div *ngFor="let a of data.armazones" class="item-card">
                      <div class="flex justify-between items-start gap-2">
                        <label class="field-label text-[#06b6d4]">Armazon:</label>
                        <h4 class="item-title">{{ a.producto.nombre }}</h4>                        
                      </div>
                      <div class="flex justify-between items-start gap-2">
                        <label class="field-label text-[#06b6d4]">sku:</label>                        
                        <span class="sku-tag">SKU: {{ a.producto.sku }}</span>
                      </div>
                      <div *ngIf="a.observaciones" class="item-details mt-2">
                        <div class="item-detail">                          
                          <label class="field-label text-[#06b6d4]">Observaciones:</label>
                          <span class="detail-value">{{ a.observaciones }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </ng-container>
                <ng-template #noArmazones>
                  <div class="empty-content">
                    <mat-icon>style</mat-icon>
                    <span>No se seleccionaron armazones</span>
                  </div>
                </ng-template>
              </div>
            </section>

            <!-- LENTES DE CONTACTO -->
            <section id="lc" class="grid-item">
              <div class="content-card content-section h-full">
                <div class="flex flex-row items-start gap-4 justify-start   bg-[#06b6d4]/10 p-3 rounded-lg mb-4">                  
                  <mat-icon class="section-icon">style</mat-icon>
                  <h2 class="section-title">Lentes de Contacto</h2>
                </div>
                <ng-container *ngIf="data.lentesContacto?.length; else noLc">
                  <div class="flex flex-wrap  ">
                    <div *ngFor="let lc of data.lentesContacto" >
                      <div class="flex flex-wrap gap-4 ">

                        <div class="flex flex-wrap gap-2">
                          <label class="field-label text-[#06b6d4]">Tipo</label>
                          <div class="field-value">{{ lc.tipo || 'No especificado' }}</div>
                        </div>
                        <div class="flex flex-wrap gap-2">
                          <label class="field-label text-[#06b6d4]">Marca</label>
                          <div class="field-value">{{ lc.marca || 'No especificado' }}</div>
                        </div>
                        <div class="flex flex-wrap gap-2">
                          <label class="field-label text-[#06b6d4]">Modelo</label>
                          <div class="field-value">{{ lc.modelo || 'No especificado' }}</div>
                        </div>
                      </div>
                      <div class="field-group gap-2 ">
                        <label class="field-label text-[#06b6d4]">Observaciones:</label>
                        <div class="field-value">{{ lc.observaciones || 'Ninguna' }}</div>
                      </div>
                    </div>
                  </div>
                </ng-container>
                <ng-template #noLc>
                  <div class="empty-content">
                    <mat-icon>contact_lens</mat-icon>
                    <span>No hay lentes de contacto registrados</span>
                  </div>
                </ng-template>
              </div>
            </section>

            <!-- OBSERVACIONES -->
            <section id="obs" class="grid-item">
              <div class="content-card content-section h-full">
                <div class="flex flex-row gap-4 items-start justify-start   bg-[#06b6d4]/10 p-3 rounded-lg mb-4">
                  <mat-icon class="text-[#06b6d4]">chat_bubble</mat-icon>
                  <h2 class="section-title">Observaciones</h2>
                </div>
                <ng-container *ngIf="data.observaciones; else noObs">
                  <div class="flex flex-wrap  ">                      
                      <label class="field-label text-[#06b6d4]">Observaciones: </label>
                      <p class="observations-text">{{ data.observaciones }}</p>
                  </div>                  
                </ng-container>
                <ng-template #noObs>
                  <div class="empty-content">
                    
                    <span>No hay observaciones registradas</span>
                  </div>
                </ng-template>
              </div>
            </section>
              
            <!-- ORDEN DE PAGOS -->
             <section id="orden-pagos" class="grid-item w-full">
              <app-orden-pagos              
                  [visitaId]="data.id"
                  [materialesCount]="data.materiales.length || 0"
                  [armazonesCount]="data.armazones.length || 0"
                  [lentesContactoCount]="data.lentesContacto.length || 0"
                  [precioConsulta]="precioConsulta"
                  [precioServicios]="precioServicios"
                  [precioMateriales]="precioMateriales"
                  [precioArmazones]="precioArmazones"
                  [precioLentesContacto]="precioLentesContacto"
                  [observaciones]="data.observaciones || ''"
                  (guardar)="onGuardarTotales($event)"
                  (registrarPago)="onRegistrarPago($event)">
                </app-orden-pagos>
            </section>
          </div>
        </div>
      </main>
    </div>
  `  
})
export class VisitaDetalleModalComponent {
  private dialogRef = inject(MatDialogRef<VisitaDetalleModalComponent>);  
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  constructor(@Inject(MAT_DIALOG_DATA) public data: VisitaCompleta) {
    console.log('Datos de la visita:', data);
    ordenarRx(data.rx);
  }

  get agudezasSinLentes() { return this.data.agudezas?.filter(a => a.condicion === 'SinLentes') ?? []; }
  get agudezasConLentes() { return this.data.agudezas?.filter(a => a.condicion === 'ConLentes') ?? []; }

  cerrar() { this.dialogRef.close(); }

  getRestaColorClass() { return (this.data.resta || 0) > 0 ? 'text-red-600' : 'text-emerald-600'; }

  getEstadoBadgeClass(estado: string) {
    const map: Record<string, string> = {
      'Borrador': 'border-blue-200 bg-blue-50 text-blue-700',
      'EnviadoLaboratorio': 'border-emerald-200 bg-emerald-50 text-emerald-700',
      'Recibido': 'border-purple-200 bg-purple-50 text-purple-700',
      'Entregado': 'border-teal-200 bg-teal-50 text-teal-700',
      'Cancelado': 'border-rose-200 bg-rose-50 text-rose-700'
    };
    return map[estado] ?? 'border-gray-200 bg-gray-50 text-gray-700';
  }

  getEstadoDotClass(estado: string) {
    const map: Record<string, string> = {
      'Borrador': 'bg-blue-500',
      'EnviadoLaboratorio': 'bg-emerald-500',
      'Recibido': 'bg-purple-500',
      'Entregado': 'bg-teal-500',
      'Cancelado': 'bg-rose-500'
    };
    return map[estado] ?? 'bg-gray-400';
  }
  
  registrarPago() {    
    const dialogRef = this.dialog.open(EnviarLabDialog, {      
      maxWidth: '100vw',               
      panelClass: [
        'w-full', 'sm:w-11/12', 'md:w-4/5', 'max-w-screen-xl'
      ],
      data: { 
        historiaId: this.data.id, 
        total: this.data.resta 
      }
    });

    dialogRef.afterClosed().subscribe(resultado => {
      if (resultado?.success) {
        console.log('✅ Pagos registrados exitosamente:', resultado.pagos);
        console.log('💰 Total pagado:', resultado.totalPagado);                
        this.snackBar.open('Pagos registrados correctamente', 'Cerrar', { 
          duration: 3000,
          panelClass: ['bg-green-500', 'text-white']
        });        
        this.cerrar();
      }
    });
  }

  onGuardarTotales(evt: { visitaId: string | number; totales: TotalesCobro; observaciones: string }): void {
    // aquí persistes datos
    // this.ordenesService.guardarTotales(evt.visitaId, evt.totales, evt.observaciones).subscribe(...)
    console.log('Guardar totales', evt);
    //cerrar modal o mostrar mensaje
    this.cerrar();
  }

  onRegistrarPago(evt: { visitaId: string | number; total: number }): void {
    // aquí lanzas el flujo de pago
    // this.pagosService.iniciarPago(evt.visitaId, evt.total)
    console.log('Registrar pago', evt);
  }  

  // Getters to avoid arrow functions inside template bindings
  private get conceptosData(): any[] | undefined {
    return (this.data as any).conceptos;
  }

  get precioConsulta(): number {
    return this.conceptosData?.find((c: any) => c.concepto === 'Consulta')?.monto ?? 0;
  }
  get precioServicios(): number {
    return this.conceptosData?.find((c: any) => c.concepto === 'Servicios')?.monto ?? 0;
  }
  get precioMateriales(): number {
    return this.conceptosData?.find((c: any) => c.concepto === 'Materiales')?.monto ?? 0;
  }
  get precioArmazones(): number {
    return this.conceptosData?.find((c: any) => c.concepto === 'Armazones')?.monto ?? 0;
  }
  get precioLentesContacto(): number {
    return this.conceptosData?.find((c: any) => c.concepto === 'Lentes de contacto')?.monto ?? 0;
  }
}
function ordenarRx(rx: RxMedicion[]) {
  // Ordenar las mediciones primero distancia (valores: Cerca, Lejos = Primero lejos), luego ojo, luego tipo
  if (!rx || !Array.isArray(rx)) return rx;
  const rankDistancia = (d?: string) => {
    if (d === 'Lejos') return 0;
    if (d === 'Cerca') return 1;
    return 2; // valores desconocidos al final
  };

  return rx.sort((a, b) => {
    const distanciaComparison = rankDistancia(a.distancia) - rankDistancia(b.distancia);
    if (distanciaComparison !== 0) return distanciaComparison;

    const ojoComparison = (a.ojo ?? '').localeCompare(b.ojo ?? '');
    if (ojoComparison !== 0) return ojoComparison;

    // Si son del mismo ojo, ordenar por tipo (si existe 'tipo' en el objeto)
    const tipoA = (a as any).tipo ?? '';
    const tipoB = (b as any).tipo ?? '';
    return String(tipoA).localeCompare(String(tipoB));
  });


  
}


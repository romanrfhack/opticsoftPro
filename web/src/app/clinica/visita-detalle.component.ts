import { Component, ChangeDetectionStrategy, inject, input, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatButtonModule } from '@angular/material/button';
import { HistoriasService } from '../core/historias.service';
import { Subscription, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { Router } from '@angular/router';

export interface AgudezaVisual {
  ojo: string;
  condicion: 'SinLentes' | 'ConLentes' | string;
  denominador: number;
}

export interface VisitaDetalle {
  id: string;
  fecha: string;
  estado: string;
  total: number | null;
  aCuenta: number;
  resta: number;

  pacienteId: string;
  pacienteNombre: string;
  pacienteTelefono?: string | null;

  rx: Array<{ ojo: string; distancia: string; esf?: number|null; cyl?: number|null; eje?: number|null; add?: number|null; dip?: string|null; altOblea?: number|null }>;
  av: AgudezaVisual[]; // Usar la nueva interfaz

  pagos: Array<{ fecha: string; monto: number; metodo: string; autorizacion?: string|null; nota?: string|null }>;

  fechaEstimadaEntrega?: string | null;
  fechaRecibidaSucursal?: string | null;
  fechaEntregadaCliente?: string | null;

  materiales: Array<{ materialId: string; descripcion: string; marca?: string|null; observaciones?: string|null }>;
  lentesContacto: Array<{ tipo: string; marca?: string|null; modelo?: string|null; observaciones?: string|null }>;
  conceptos: Array<{ id: string; concepto: string; monto: number; usuarioNombre: string; fecha: string; observaciones?: string | null }>;
}


/* Pipe auxiliar (opcional) para filtrar AV por condición) */
import { Pipe, PipeTransform } from '@angular/core';
@Pipe({ name: 'avFilter', standalone: true })
export class AvFilterPipe implements PipeTransform {
  transform(av: AgudezaVisual[] = [], cond: string): AgudezaVisual[] {
    return (av || []).filter(a => a.condicion === cond);
  }
}

@Component({
  standalone: true,
  selector: 'app-visita-detalle',
  imports: [CommonModule, MatIconModule, MatDividerModule, MatButtonModule, AvFilterPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,  
  template: `
    <div class="card space-y-4 md:space-y-6" *ngIf="vm(); else loadingTpl">
      <!-- Encabezado -->
      <div class="flex flex-wrap items-center gap-3 justify-between">
        <div class="flex items-center gap-3">
          <span class="chip">
            <mat-icon class="!text-[#06b6d4] !text-base">assignment</mat-icon>
            Orden
          </span>
          <span class="pill">Estado: {{ vm()!.estado }}</span>
          <span class="pill">Fecha: {{ vm()!.fecha | date:'dd/MM/yyyy HH:mm' }}</span>
        </div>
        <div class="text-sm text-gray-600">
          <span class="font-medium">{{ vm()!.pacienteNombre }}</span>
          <span *ngIf="vm()!.pacienteTelefono" class="ml-2"> · {{ vm()!.pacienteTelefono }}</span>
        </div>
      </div>

      <!-- Totales -->
      <div class="grid grid-cols-3 gap-3 text-sm">
        <div class="card !p-3 text-center">
          <div class="text-gray-500">Total</div>
          <div class="text-lg font-semibold">{{ vm()!.total ?? 0 | number:'1.2-2' }}</div>
        </div>
        <div class="card !p-3 text-center">
          <div class="text-gray-500">A cuenta</div>
          <div class="text-lg font-semibold">{{ vm()!.aCuenta | number:'1.2-2' }}</div>
        </div>
        <div class="card !p-3 text-center">
          <div class="text-gray-500">Resta</div>
          <div class="text-lg font-semibold">{{ vm()!.resta | number:'1.2-2' }}</div>
        </div>
      </div>

      <!-- AV -->
      <section class="section">
        <h3><mat-icon>remove_red_eye</mat-icon> Agudeza visual</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <div class="text-xs text-gray-500 mb-1">Sin lentes</div>
            <div class="flex flex-wrap gap-2">
              <span class="pill" *ngFor="let a of vm()!.av | avFilter:'SinLentes'">
                {{ a.ojo }}: 20/{{ a.denominador }}
              </span>
            </div>
          </div>
          <div>
            <div class="text-xs text-gray-500 mb-1">Con lentes</div>
            <div class="flex flex-wrap gap-2">
              <span class="pill" *ngFor="let a of vm()!.av | avFilter:'ConLentes'">
                {{ a.ojo }}: 20/{{ a.denominador }}
              </span>
            </div>
          </div>
        </div>
      </section>

      <mat-divider></mat-divider>

      <!-- RX -->
      <section class="section">
        <h3><mat-icon>grid_on</mat-icon> RX</h3>
        <div class="overflow-auto">
          <table class="min-w-[680px] w-full text-xs border border-gray-200 rounded">
            <thead class="bg-white">
              <tr class="[&>th]:text-left [&>th]:py-1.5 [&>th]:px-2">
                <th>Dist.</th><th>Ojo</th><th>Esf</th><th>Cyl</th><th>Eje</th><th>ADD</th><th>D.I.P.</th><th>ALT. OBLEA</th>
              </tr>
            </thead>
            <tbody class="[&>tr>td]:py-1.5 [&>tr>td]:px-2">
              <tr *ngFor="let m of vm()!.rx" class="border-t border-gray-100">
                <td>{{ m.distancia }}</td>
                <td>{{ m.ojo }}</td>
                <td>{{ m.esf ?? '—' }}</td>
                <td>{{ m.cyl ?? '—' }}</td>
                <td>{{ m.eje ?? '—' }}</td>
                <td>{{ m.add ?? '—' }}</td>
                <td>{{ m.dip ?? '—' }}</td>
                <td>{{ m.altOblea ?? '—' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <mat-divider></mat-divider>

      <!-- Material / LC -->
      <section class="section">
        <h3><mat-icon>category</mat-icon> Material y lentes de contacto</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <div class="text-sm font-medium mb-1">Material</div>
            <div *ngIf="vm()!.materiales.length; else noMat" class="space-y-1">
              <div *ngFor="let m of vm()!.materiales" class="flex items-center justify-between bg-gray-50 rounded px-3 py-2 text-sm">
                <div>
                  <span class="font-medium">{{ m.descripcion }}</span>
                  <span *ngIf="m.marca" class="text-xs text-gray-500"> · {{ m.marca }}</span>
                  <span *ngIf="m.observaciones" class="text-xs text-gray-600"> · {{ m.observaciones }}</span>
                </div>
              </div>
            </div>
            <ng-template #noMat><div class="text-xs text-gray-500">Sin material seleccionado.</div></ng-template>
          </div>
          <div>
            <div class="text-sm font-medium mb-1">Lente de contacto</div>
            <div *ngIf="vm()!.lentesContacto.length; else noLc" class="space-y-1">
              <div *ngFor="let l of vm()!.lentesContacto" class="flex items-center justify-between bg-gray-50 rounded px-3 py-2 text-sm">
                <div>
                  <span class="font-medium">{{ l.tipo }}</span>
                  <span *ngIf="l.marca" class="text-xs text-gray-500"> · {{ l.marca }}</span>
                  <span *ngIf="l.modelo" class="text-xs text-gray-500"> · {{ l.modelo }}</span>
                  <span *ngIf="l.observaciones" class="text-xs text-gray-600"> · {{ l.observaciones }}</span>
                </div>
              </div>
            </div>
            <ng-template #noLc><div class="text-xs text-gray-500">Sin lentes de contacto seleccionados.</div></ng-template>
          </div>
        </div>
      </section>

      <mat-divider></mat-divider>

      <!-- Pagos -->
      <section class="section">
        <h3><mat-icon>payments</mat-icon> Pagos</h3>
        <div *ngIf="vm()!.pagos.length; else noPagos">
          <div class="overflow-auto">
            <table class="min-w-[540px] w-full text-xs border border-gray-200 rounded">
              <thead class="bg-white">
                <tr class="[&>th]:text-left [&>th]:py-1.5 [&>th]:px-2">
                  <th>Fecha</th><th>Método</th><th>Monto</th><th>Autorización</th><th>Nota</th>
                </tr>
              </thead>
              <tbody class="[&>tr>td]:py-1.5 [&>tr>td]:px-2">
                <tr *ngFor="let p of vm()!.pagos" class="border-t border-gray-100">
                  <td>{{ p.fecha | date:'short' }}</td>
                  <td>{{ p.metodo }}</td>
                  <td>{{ p.monto | number:'1.2-2' }}</td>
                  <td>{{ p.autorizacion || '—' }}</td>
                  <td>{{ p.nota || '—' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <ng-template #noPagos><div class="text-xs text-gray-500">Sin pagos registrados.</div></ng-template>
      </section>

      <!-- Fechas logísticas -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-gray-600">
        <div>Estimada entrega: <span class="font-medium">{{ vm()!.fechaEstimadaEntrega ? (vm()!.fechaEstimadaEntrega | date:'shortDate') : '—' }}</span></div>
        <div>Recibida en sucursal: <span class="font-medium">{{ vm()!.fechaRecibidaSucursal ? (vm()!.fechaRecibidaSucursal | date:'short') : '—' }}</span></div>
        <div>Entregada a cliente: <span class="font-medium">{{ vm()!.fechaEntregadaCliente ? (vm()!.fechaEntregadaCliente | date:'short') : '—' }}</span></div>
      </div>

      <div class="flex justify-end">
        <button mat-flat-button class="btn-primary" (click)="volver()">
          <mat-icon class="!text-white mr-1">arrow_back</mat-icon> Regresar
        </button>
      </div>
      <button mat-button class="text-[#06b6d4]" (click)="verDetalle()">
        Ver detalle
        </button>        
    </div>

    <ng-template #loadingTpl>
      <div class="card text-sm text-gray-500">Cargando…</div>
    </ng-template>
  `
})

export class VisitaDetalleComponent {
  private api = inject(HistoriasService);
  private router = inject(Router);

  visitaId = input.required<string>();
  vm = signal<VisitaDetalle | null>(null);

  // carga reactiva
  private eff = effect((onCleanup) => {
    const id = this.visitaId();
    if (!id) { this.vm.set(null); return; }
    const sub: Subscription = of(id)
      .pipe(switchMap(vId => this.api.detalle(vId)))
      .subscribe({
        next: v => this.vm.set(v),
        error: () => this.vm.set(null)
      });
    onCleanup(() => sub.unsubscribe());
  });

  volver() { history.back(); }

  verDetalle() {
    const visita = this.vm();
    if (visita) {
      this.router.navigate(['/visitas', visita.id]);
    }
  }
}
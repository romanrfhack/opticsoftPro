import { Component, ChangeDetectionStrategy, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { HistoriasService } from '../core/historias.service';

type PagedResult<T> = { page:number; pageSize:number; total:number; items:T[]; };

type VisitaRow = {
  id: string;
  fecha: string;
  estado: string;
  total: number|null;
  aCuenta: number;
  resta: number;
  ultimoPagoFecha?: string|null;
  ultimoPagoMonto?: number|null;
  fechaEstimadaEntrega?: string|null;
  fechaRecibidaSucursal?: string|null;
  fechaEntregadaCliente?: string|null;
};

type PacienteHeader = { id:string; nombre:string; telefono?:string|null; ocupacion?:string|null };



@Component({
  standalone: true,
  selector: 'app-paciente-historial',
  imports: [
    CommonModule, ReactiveFormsModule,
    MatTableModule, MatPaginatorModule,
    MatButtonModule, MatIconModule, MatSelectModule, MatInputModule,
    MatDatepickerModule, MatNativeDateModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,  
  template: `
  <section class="space-y-4">
    <!-- Header paciente -->
    <div class="card p-4 md:p-6 flex flex-wrap items-center justify-between gap-3">
      <div class="flex items-center gap-3">
        <span class="chip"><mat-icon class="!text-[#06b6d4] !text-base">person</mat-icon> Paciente</span>
        <div>
          <div class="font-semibold">{{ pac()?.nombre || 'Cargando…' }}</div>
          <div class="text-xs text-gray-500">
            <span *ngIf="pac()?.telefono">Tel: {{ pac()?.telefono }}</span>
            <span *ngIf="pac()?.ocupacion"> · {{ pac()?.ocupacion }}</span>
          </div>
        </div>
      </div>
      <div class="flex gap-2">
        <button mat-stroked-button (click)="nuevaVisita()"><mat-icon>add</mat-icon> Nueva visita</button>
        <button mat-flat-button class="btn-primary" (click)="regresar()"><mat-icon class="!text-white">arrow_back</mat-icon> Regresar</button>
      </div>
    </div>

    <!-- Filtros -->
    <div class="card p-4 md:p-6">
      <form [formGroup]="form" class="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
        <mat-form-field appearance="outline" class="md:col-span-3">
          <mat-label>Estado</mat-label>
          <mat-select formControlName="estado">
            <mat-option [value]="''">Todos</mat-option>
            <mat-option *ngFor="let e of estados" [value]="e.value">{{ e.label }}</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="md:col-span-3">
          <mat-label>Desde</mat-label>
          <input matInput [matDatepicker]="dp1" formControlName="from">
          <mat-datepicker-toggle matSuffix [for]="dp1"></mat-datepicker-toggle>
          <mat-datepicker #dp1></mat-datepicker>
        </mat-form-field>

        <mat-form-field appearance="outline" class="md:col-span-3">
          <mat-label>Hasta</mat-label>
          <input matInput [matDatepicker]="dp2" formControlName="to">
          <mat-datepicker-toggle matSuffix [for]="dp2"></mat-datepicker-toggle>
          <mat-datepicker #dp2></mat-datepicker>
        </mat-form-field>

        <div class="md:col-span-3 flex items-center gap-3">
          <mat-checkbox formControlName="soloPendientes">Solo pendientes</mat-checkbox>
          <button mat-stroked-button color="primary" (click)="buscar()"><mat-icon>search</mat-icon> Buscar</button>
          <button mat-button (click)="limpiar()">Limpiar</button>
        </div>
      </form>
    </div>

    <!-- Tabla -->
    <div class="card p-0 overflow-auto">
      <table mat-table [dataSource]="rows()" class="min-w-[960px] w-full text-sm">

        <ng-container matColumnDef="fecha">
          <th mat-header-cell *matHeaderCellDef>Fecha</th>
          <td mat-cell *matCellDef="let r">{{ r.fecha | date:'short' }}</td>
        </ng-container>

        <ng-container matColumnDef="estado">
          <th mat-header-cell *matHeaderCellDef>Estado</th>
          <td mat-cell *matCellDef="let r"><span class="pill">{{ r.estado }}</span></td>
        </ng-container>

        <ng-container matColumnDef="total">
          <th mat-header-cell *matHeaderCellDef>Total</th>
          <td mat-cell *matCellDef="let r">{{ r.total ?? 0 | number:'1.2-2' }}</td>
        </ng-container>

        <ng-container matColumnDef="resta">
          <th mat-header-cell *matHeaderCellDef>Resta</th>
          <td mat-cell *matCellDef="let r">
            <span [class.text-red-600]="(r.resta||0) > 0" [class.font-semibold]="(r.resta||0) > 0">
              {{ r.resta | number:'1.2-2' }}
            </span>
          </td>
        </ng-container>

        <ng-container matColumnDef="ultimoPago">
          <th mat-header-cell *matHeaderCellDef>Último pago</th>
          <td mat-cell *matCellDef="let r">
            <ng-container *ngIf="r.ultimoPagoFecha; else nop">
              {{ r.ultimoPagoFecha | date:'short' }} · {{ r.ultimoPagoMonto || 0 | number:'1.2-2' }}
            </ng-container>
            <ng-template #nop><span class="text-xs text-gray-400">—</span></ng-template>
          </td>
        </ng-container>

        <ng-container matColumnDef="acciones">
          <th mat-header-cell *matHeaderCellDef></th>
          <td mat-cell *matCellDef="let r" class="text-right pr-3">
            <button mat-button class="accent" (click)="verDetalle(r)">Ver detalle</button>
          </td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="cols"></tr>
        <tr mat-row *matRowDef="let row; columns: cols;"></tr>
      </table>

      <mat-paginator
        [length]="total()"
        [pageIndex]="page()-1"
        [pageSize]="pageSize()"
        [pageSizeOptions]="[10,20,50]"
        (page)="onPage($event)">
      </mat-paginator>
    </div>
  </section>
  `
})
export class PacienteHistorialPage {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private apiService = inject(HistoriasService);
  
  pacienteId = signal<string>('');
  pac = signal<PacienteHeader | null>(null);

  rows = signal<VisitaRow[]>([]);
  total = signal(0);
  page = signal(1);
  pageSize = signal(20);

  cols = ['fecha','estado','total','resta','ultimoPago','acciones'] as const;

  estados = [
    { value:'Borrador',       label:'Borrador' },
    { value:'Guardado',       label:'Guardado' },
    { value:'EnLaboratorio',  label:'En laboratorio' },
    { value:'EnSucursal',     label:'En sucursal' },
    { value:'Entregado',      label:'Entregado' },
    { value:'Cerrado',        label:'Cerrado' }
  ];

  form = this.fb.group({
    estado: [''],
    from:   [null as Date | null],
    to:     [null as Date | null],
    soloPendientes: [false]
  });

  constructor() {
    // lee :id y carga encabezado + primera página
    this.route.paramMap.subscribe(async p => {
    const id = p.get('id')!;
    this.pacienteId.set(id);
    const headers = await this.apiService.pacientesHeader([id]);
    this.pac.set(headers && headers.length > 0 ? headers[0] : null);
    this.page.set(1);
    this.load();
    })
  }

  async load() {
    const id = this.pacienteId();
    const f = this.form.value;
    const from = f.from ? new Date(f.from) : null;
    const to   = f.to   ? new Date(f.to)   : null;

    const res = await this.apiService.historial(
      id,
      this.page(),
      this.pageSize(),
      f.estado || undefined,
      from ? from.toISOString() : undefined,
      to ? to.toISOString() : undefined,
      !!f.soloPendientes
    );

    this.rows.set(res?.items ?? []);
    this.total.set(res?.total ?? 0);
  }

  buscar() { this.page.set(1); this.load(); }
  limpiar() {
    this.form.reset({ estado:'', from:null, to:null, soloPendientes:false });
    this.page.set(1);
    this.load();
  }

  onPage(e: PageEvent) {
    this.page.set(e.pageIndex + 1);
    this.pageSize.set(e.pageSize);
    this.load();
  }

  verDetalle(r: VisitaRow) {
    this.router.navigate(['/visitas', r.id]); // usa el componente VisitaDetalle que ya creamos
  }

  nuevaVisita() {
    this.router.navigate(['/clinica/nueva'], { queryParams: { pacienteId: this.pacienteId() } });
  }

  regresar() { history.back(); }
}

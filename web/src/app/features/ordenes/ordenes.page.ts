import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { VisitasCostosService } from '../../core/visitasCostos.service';
import { ChangeVisitaStatusRequest, OrderStatus, OrderStatusLabels, PagedResultCE, STATUS_FLOW, VisitaCostoRow } from './ordenes.models';
import { HistoriasService } from '../../core/historias.service';
import { MatDialog } from '@angular/material/dialog';
import { VisitaDetalleModalComponent } from '../../clinica/components/visita-detalle-modal.component';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CambiarEstatusDialog, CambiarEstatusDialogData } from './cambiar-estatus.dialog';
import { PacienteGridItem, PacienteLite } from '../../core/models/clinica.models';
import { AuthService } from '../../auth/auth.service';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { PacientesService } from '../../core/pacientes.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, debounceTime, distinctUntilChanged, filter, of, switchMap, tap } from 'rxjs';
import { OrderStatusTimelineComponent } from './order-status-timeline.component';
import { VisitaStatusHistoryComponent } from './visita-status-history.component';

@Component({
  standalone: true,
  imports: [CommonModule, OrderStatusTimelineComponent, MatTableModule, MatPaginatorModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatIconModule],
  selector: 'app-costos-page',
  template: `
  <div class="p-4 space-y-4">
    <h1 *ngIf="isAdmin()" class="text-2xl font-semibold">Ordenes — Todas las sucursales</h1>
    <h1 *ngIf="isEncargado()" class="text-2xl font-semibold">Ordenes — Mi sucursal</h1>
    <h1 *ngIf="isMensajero()" class="text-2xl font-semibold">Ordenes por recoger/entregar</h1>

    <!-- Panel de Búsqueda Principal -->
      <div class="bg-white/20 bg-blue-500/20-md border border-white/30">
        <div class="max-w-2xl mx-auto">
          <div class="text-center mb-6">
            <h2 class="text-xl font-semibold text-gray-800 mb-2">
              ¿A qué cliente buscas?
            </h2>
            <p class="text-gray-600">
              Escribe el nombre o teléfono del cliente
            </p>
          </div>

          <form [formGroup]="searchForm" class="relative">                                    
            <div class="relative max-w-2xl mx-auto">
              <label for="search" class="sr-only">Buscar cliente</label>
              <div
                class="flex items-center rounded-xl border border-gray-300 bg-white focus-within:ring-2 focus-within:ring-cyan-400 transition"
                role="combobox"
                aria-haspopup="listbox"
                aria-owns="result-list"
                [attr.aria-expanded]="open"
              >
                <svg class="mx-3 h-5 w-5 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M21 21l-4.35-4.35M10 18a8 8 0 100-16 8 8 0 000 16z"/>
                </svg>

                <input
                  id="search"
                  type="text"
                  class="flex-1 py-3 pr-10 outline-none bg-transparent text-gray-800 placeholder-gray-400"
                  placeholder="Buscar cliente…"
                  [formControl]="searchForm.controls.searchTerm"
                  (focus)="open = true"
                  (keydown)="onKeydown($event)"
                  aria-autocomplete="list"
                  aria-controls="result-list"
                  [attr.aria-activedescendant]="activeOptionId"
                />

                <button
                  type="button"
                  class="p-2 text-gray-400 hover:text-cyan-600 focus:outline-none"
                  *ngIf="searchForm.controls.searchTerm.value"
                  (click)="clearSearch(); inputEl.focus()"
                  aria-label="Limpiar búsqueda"
                >
                  <mat-icon fontIcon="close"></mat-icon>
                </button>
              </div>

              <!-- Dropdown -->
              <div
                *ngIf="open && suggestedPatients().length > 0"
                id="result-list"
                role="listbox"
                class="absolute z-50 mt-2 w-full rounded-xl border border-gray-200 bg-white shadow-2xl overflow-hidden"
              >
                <button
                  *ngFor="let p of suggestedPatients(); let i = index"
                  role="option"
                  type="button"
                  [id]="'option-'+i"
                  (click)="selectFromList(p)"
                  (mouseenter)="activeIndex = i"
                  class="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-cyan-50"
                  [class.bg-cyan-50]="i === activeIndex"
                  [attr.aria-selected]="i === activeIndex"
                >
                  <span class="inline-flex items-center justify-center h-8 w-8 rounded-full bg-cyan-100 text-cyan-600">
                    <mat-icon fontIcon="person" class="text-base"></mat-icon>
                  </span>
                  <span class="flex-1">
                    <span class="block font-medium text-gray-800">{{ p.nombre }}</span>
                    <span class="block text-xs text-gray-500" *ngIf="p.telefono">{{ p.telefono }}</span>
                  </span>
                </button>
              </div>

              <!-- Estado vacío -->
              <div
                *ngIf="open && searchForm.controls.searchTerm.value && suggestedPatients().length === 0"
                class="absolute z-50 mt-2 w-full rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-500"
              >
                Sin resultados
              </div>
            </div>
          </form>

          <!-- Contadores y Filtros -->
          <div class="flex items-center justify-between mt-6 pt-6 border-t border-gray-100">
            <div class="text-sm text-gray-600">
              <span *ngIf="displayedPatients().length > 0 && !selectedPatient()">
                Mostrando <span class="font-semibold text-[#06b6d4]">{{ displayedPatients().length }}</span> 
                de <span class="font-semibold text-[#06b6d4]">{{ allPatients().length }}</span> clientes
              </span>
              <span *ngIf="displayedPatients().length === 0 && !searchForm.controls.searchTerm.value && !selectedPatient()">
                Escribe para buscar clientes...
              </span>
              <span *ngIf="displayedPatients().length === 0 && searchForm.controls.searchTerm.value && !selectedPatient()">
                No se encontraron clientes
              </span>
              <span *ngIf="selectedPatient()" class="text-[#06b6d4] font-semibold">
                Vista individual - {{ selectedPatient()?.nombre }}
              </span>
            </div>

            <button 
              mat-stroked-button
              (click)="showAllPatients()"
              class="p-2 border-[#06b6d4] text-[#06b6d4] hover:bg-[#06b6d4] hover:text-white hover:p-2 hover:bg-opacity-5 transition-colors">
              <mat-icon>refresh</mat-icon>
              Mostrar Todos
            </button>
          </div>
        </div>
      </div>

      <div class="p-10 space-y-10">    

    <!-- Versión horizontal -->
    <div>
      <h2 class="text-lg font-semibold mb-2 text-gray-700">Flujo</h2>
      <app-order-status-timeline 
        [currentStatus]="currentOrderStatus" 
        orientation="horizontal">
      </app-order-status-timeline>
    </div>

    <!-- <div class="flex justify-center space-x-2">
      <button class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600" (click)="prevStatus()">◀ Anterior</button>
      <button class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600" (click)="nextStatus()">Siguiente ▶</button>
    </div> -->

  </div>

    <div class="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 mb-8">
      <table mat-table [dataSource]="items()" class="w-full">
        <ng-container matColumnDef="fecha">
          <th mat-header-cell *matHeaderCellDef>Fecha</th>
          <td mat-cell *matCellDef="let r">{{ r.fecha | date:'yyyy-MM-dd HH:mm' }}</td>
        </ng-container>

        <ng-container matColumnDef="paciente">
          <th mat-header-cell *matHeaderCellDef>Paciente</th>
          <td mat-cell *matCellDef="let r">{{ r.paciente }}</td>
        </ng-container>

        <ng-container matColumnDef="usuario">
          <th mat-header-cell *matHeaderCellDef>Atendió</th>
          <td mat-cell *matCellDef="let r">{{ r.usuarioNombre }}</td>
        </ng-container>

        <ng-container matColumnDef="sucursal">
          <th mat-header-cell *matHeaderCellDef>Sucursal</th>
          <td mat-cell *matCellDef="let r">{{ r.sucursal }}</td>
        </ng-container>

        <ng-container matColumnDef="estado">
          <th mat-header-cell *matHeaderCellDef>Estado</th>
          <td mat-cell *matCellDef="let r">{{ mostrarEstado(r.estado) }}</td>
        </ng-container>

        <!-- Nueva columna para Laboratorio -->
        <ng-container matColumnDef="laboratorio">
          <th mat-header-cell *matHeaderCellDef>Laboratorio</th>
          <td mat-cell *matCellDef="let r">
            <div *ngIf="r.labTipo" class="flex items-center gap-2">
              <mat-icon 
                [class.text-blue-500]="r.labTipo === 'Interno'"
                [class.text-green-500]="r.labTipo === 'Externo'"
                class="text-lg">
                {{ r.labTipo === 'Interno' ? 'home' : 'business' }}
              </mat-icon>
              <span class="font-medium" 
                    [class.text-blue-600]="r.labTipo === 'Interno'"
                    [class.text-green-600]="r.labTipo === 'Externo'">
                {{ r.labNombre }}
              </span>
            </div>
          </td>
        </ng-container>

        <ng-container matColumnDef="detalle">
          <th mat-header-cell *matHeaderCellDef></th>
          <td mat-cell *matCellDef="let r">            
            <div *ngIf="!isMensajero()">
              <button mat-icon-button 
                  (click)="verDetalle(r.id)"
                  title="Ver detalle de la visita"
                  class="text-cyan-600 hover:text-cyan-700">
                  <mat-icon>visibility</mat-icon>
              </button>
            </div>
          </td>
        </ng-container>

        <!-- <ng-container matColumnDef="acciones">
          <th mat-header-cell *matHeaderCellDef></th>
          <td mat-cell *matCellDef="let r">
            <button mat-icon-button *ngIf="validarPuedeEditar(r)" (click)="abrirCambiarEstatus(r)" title="Cambiar estatus">
              <mat-icon>sync</mat-icon>
            </button>
            <button mat-icon-button (click)="verHistorial(r.id)" title="Ver historial">
              <mat-icon>history</mat-icon>
            </button>
          </td>
        </ng-container> -->

        <ng-container matColumnDef="acciones">
          <th mat-header-cell *matHeaderCellDef></th>
          <td mat-cell *matCellDef="let r">
            <button mat-icon-button *ngIf="validarPuedeEditar(r)" 
                    (click)="abrirCambiarEstatus(r)" 
                    title="Cambiar estatus">
              <mat-icon>sync</mat-icon>
            </button>

            <button mat-icon-button 
                    (click)="verHistorial(r.id)" 
                    title="Ver historial de estatus"
                    class="text-[#06b6d4] hover:text-[#0891b2] transition-colors">
              <mat-icon>history</mat-icon>
            </button>
          </td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="cols"></tr>
        <tr mat-row 
            *matRowDef="let row; columns: cols;" 
            (click)="onRowSelect(row)"
            [class.bg-blue-50]="selectedRow?.id === row.id"
            [class.border-l-4]="selectedRow?.id === row.id"
            [class.border-blue-500]="selectedRow?.id === row.id"
            [class.cursor-pointer]="true"
            [class.hover:bg-blue-50]="true"
            [class.transition-colors]="true"
            [class.fila-laboratorio]="row.labTipo"
            [class.fila-laboratorio-interno]="row.labTipo === 'Interno'"
            [class.fila-laboratorio-externo]="row.labTipo === 'Externo'">
        </tr>
      </table>

      <mat-paginator [length]="total()" [pageSize]="pageSize()" [pageIndex]="page()-1"
                     (page)="onPage($event)"></mat-paginator>
    </div>
  </div>
  `,
  styles: [`
    .fila-laboratorio {
      background-color: rgba(6, 182, 212, 0.05);
      border-left: 4px solid #06b6d4;
    }
    
    .fila-laboratorio-interno {
      background-color: rgba(59, 130, 246, 0.05);
      border-left-color: #3b82f6;
    }
    
    .fila-laboratorio-externo {
      background-color: rgba(16, 185, 129, 0.05);
      border-left-color: #10b981;
    }
    
    .fila-laboratorio:hover {
      background-color: rgba(6, 182, 212, 0.1);
    }
    
    .fila-laboratorio-interno:hover {
      background-color: rgba(59, 130, 246, 0.1);
    }
    
    .fila-laboratorio-externo:hover {
      background-color: rgba(16, 185, 129, 0.1);
    }
  `]
})
export class CostosPageComponent {
  
  private api = inject(VisitasCostosService);
  private apiHS = inject(HistoriasService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private authService = inject(AuthService);

  currentOrderStatus = OrderStatus.CREADA;
  selectedRow: VisitaCostoRow | null = null;

  // Agregar 'laboratorio' a las columnas
  cols = ['fecha','paciente','usuario','sucursal','estado','laboratorio','detalle', 'acciones'];
  estados = Object.values(OrderStatus);
  
  private fb = inject(FormBuilder);    
  open = false;
  activeIndex = -1;
  get activeOptionId() { return this.activeIndex >= 0 ? `option-${this.activeIndex}` : null; }
  suggestedPatients = signal<PacienteLite[]>([]);
  allPatients = signal<PacienteGridItem[]>([]);
  selectedPatient = signal<PacienteGridItem | null>(null);
  private pacApi = inject(PacientesService);
  private destroyRef = inject(DestroyRef);
  loading = signal(false);
  inputEl!: HTMLInputElement;

  searchForm = this.fb.group({ 
    searchTerm: ['', [Validators.minLength(2)]]
  });

  displayedPatients = computed(() => {
    if (this.selectedPatient()) {
      return [this.selectedPatient()!];
    }
    const searchTerm = this.searchForm.controls.searchTerm.value?.toLowerCase() || '';
    const patients = this.allPatients();
    if (!searchTerm) return patients;
    return patients.filter(patient => 
      patient.nombre.toLowerCase().includes(searchTerm) ||
      patient.telefono?.includes(searchTerm) ||
      patient.ocupacion?.toLowerCase().includes(searchTerm)
    );
  });

  // estado local
  items = signal<VisitaCostoRow[]>([]);
  itemsSinFiltrar = signal<VisitaCostoRow[]>([]);
  itemsFiltrados = signal<VisitaCostoRow[]>([]);
  total = signal(0);
  page = signal(1);
  pageSize = signal(20);
  search = signal<string>('');
  estado = signal<string>('');
  isAdmin = computed(() => !!this.authService.user()?.roles?.includes('Admin'));
  isEncargado = computed(() => !!this.authService.user()?.roles?.includes('Encargado de Sucursal'));
  isMensajero = computed(() => !!this.authService.user()?.roles?.includes('Mensajero'));  

  estadosUpdateEncargado = [
    OrderStatus.CREADA,  
    OrderStatus.REGISTRADA, 
    OrderStatus.EN_TRANSITO_A_SUCURSAL_MATRIZ, 
    OrderStatus.RECIBIDA_EN_SUCURSAL_MATRIZ, 
    OrderStatus.ENVIADA_A_LABORATORIO, 
    OrderStatus.EN_TRANSITO_DE_LABORATORIO_A_SUCURSAL_MATRIZ,
    OrderStatus.EN_TRANSITO_A_SUCURSAL_ORIGEN,
    OrderStatus.RECIBIDA_EN_SUCURSAL_ORIGEN,
    OrderStatus.ENTREGADA_AL_CLIENTE
  ];
  estadosUpdateMensajero = [
    OrderStatus.LISTAPARA_ENVIO,
    OrderStatus.LISTA_EN_LABORATORIO,
    OrderStatus.RECIBIDA_LISTA_EN_SUCURSAL_MATRIZ];

  constructor() {      
      this.searchForm.controls.searchTerm.valueChanges.pipe(
        debounceTime(300),
        distinctUntilChanged(),
        tap(() => this.selectedPatient.set(null)),
        filter((term: unknown) => typeof term === 'string'),
        switchMap((term: string) => {
          const q = term.trim();
          if (q.length >= 2) {
            return this.pacApi.search(q).pipe(catchError(() => of([])));
          }
          return of([]);
        }),
        takeUntilDestroyed(this.destroyRef)
      ).subscribe(patients => {
        this.suggestedPatients.set(patients.slice(0, 5));
      });
  
      this.loadAllPatients();
    }

  showAllPatients() {
    this.clearSearch();
    this.loadAllPatients();
    this.items.set(this.itemsSinFiltrar());
  }

  clearSearch() {
    this.searchForm.controls.searchTerm.setValue('');
    this.suggestedPatients.set([]);
    this.activeIndex = -1;
    this.open = true;
  }

  loadAllPatients() {
    this.loading.set(true);
    this.pacApi.query(1, 1000).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (res) => {
        this.allPatients.set(res.items || []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  ngOnInit() { this.load(); }

  load() {
    this.api.list({
      page: this.page(),
      pageSize: this.pageSize(),
      search: this.search() || undefined,
      estado: this.estado() || undefined
    }).subscribe((res: PagedResultCE<VisitaCostoRow>) => {
      console.log("Cargando visitas costos:", res.items);
      this.items.set(res.items);
      this.itemsSinFiltrar.set(res.items);
      this.total.set(res.totalCount);
      this.page.set(res.page);
      this.pageSize.set(res.pageSize);
    });
  }

  onPage(e: PageEvent) {
    this.page.set(e.pageIndex + 1);
    this.pageSize.set(e.pageSize);
    this.load();
  }

  onEstado(v: string) {
    this.page.set(1);
    this.estado.set(v);
    this.load();
  }

  verDetalle(visitaId: string): void {
      console.log("Ver detalle de visita -OrdenesPage-:", visitaId);
      this.apiHS.getById(visitaId).subscribe({
        next: (visitaCompleta) => {
          this.dialog.open(VisitaDetalleModalComponent, {
            width: '95vw',
            maxWidth: '1200px',
            height: '95vh',
            data: visitaCompleta,
            panelClass: 'visita-detalle-modal'
          });
        },
        error: (err) => {
          console.error('Error al cargar detalle de visita:', err);
        }
      });
    }

    mostrarEstado(estadoIndex: number): string {    
    if (estadoIndex >= 0 && estadoIndex < STATUS_FLOW.length) {
      return OrderStatusLabels[STATUS_FLOW[estadoIndex]];
    }
        
    console.warn(`Índice de estado inválido: ${estadoIndex}`);
    return 'Desconocido';
  }
  
    openStatusDialog(visita: any) {                        
      const allowedStatuses = [visita.estado + 1];
      const dialogRef = this.dialog.open(CambiarEstatusDialog, {
        width: '600px',
        data: {
          visitaId: visita.id,
          fromStatus: visita.estado,
          allowed: allowedStatuses,
          usuarioNombre: visita.usuarioNombre,
          fecha: visita.fechaUltimaActualizacion || visita.fecha,
          Paciente: visita.paciente          
        } as CambiarEstatusDialogData
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result) {          
          this.cambiarEstatus(visita.id, result);
        }
      });
    }
    
    abrirCambiarEstatus(visita: any) {
      console.log("Abrir cambiar estatus para visita:", visita);
      this.openStatusDialog(visita);
    }

    validarPuedeEditar(visita: VisitaCostoRow): boolean {
      console.log("Validando si puede editar estatus de visita:", visita);
      let puedeEditar = false;
      let rolUsuario = this.authService.user()?.roles || [];
      
      const estadoNum = typeof visita.estado === 'number'
        ? visita.estado
        : (typeof visita.estado === 'string' && visita.estado !== '' ? parseInt(visita.estado, 10) : NaN);

      if (rolUsuario.includes('Admin')) {
        puedeEditar = true;
      } else if (rolUsuario.includes('Encargado de Sucursal')) {
        puedeEditar = Number.isFinite(estadoNum) ? this.estadosUpdateEncargado.includes(estadoNum) : false;
      } else if (rolUsuario.includes('Mensajero')) {
        puedeEditar = Number.isFinite(estadoNum) ? this.estadosUpdateMensajero.includes(estadoNum) : false;
      }      
      
      return puedeEditar;
    }

    cambiarEstatus(visitaId: string, result: any) {    
    const request: ChangeVisitaStatusRequest = {
      toStatus: result.toStatus,
      observaciones: result.observaciones,
      labTipo: result.labTipo,
      labNombre: result.labNombre
    };

    this.api.changeStatus(visitaId, request).subscribe({
      next: (response) => {        
        this.load();
        this.snackBar.open('Estatus cambiado exitosamente', 'Cerrar', { duration: 3000 });        
      },
      error: (error) => {        
        console.error('Error al cambiar estatus', error);
        this.snackBar.open('Error al cambiar estatus', 'Cerrar', { duration: 3000 });
      }
    });
  }

    onKeydown(e: KeyboardEvent) {
      console.log("Keydown en input de búsqueda:", e.key);
      const len = this.suggestedPatients().length;
      if (!this.open && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) { this.open = true; }
      switch (e.key) {
        case 'ArrowDown':
          if (len > 0) { this.activeIndex = (this.activeIndex + 1) % len; e.preventDefault(); }
          break;
        case 'ArrowUp':
          if (len > 0) { this.activeIndex = (this.activeIndex - 1 + len) % len; e.preventDefault(); }
          break;
        case 'Enter':
          if (this.open && this.activeIndex >= 0) {
            const p = this.suggestedPatients()[this.activeIndex];
            this.selectFromList(p);
            e.preventDefault();
          }
          break;
        case 'Escape':
          this.open = false;
          break;
      }
    }

    selectFromList(p: PacienteLite) {
      this.onPatientSelected(p);
      this.searchForm.controls.searchTerm.setValue(p.nombre, { emitEvent: false });
      this.open = false;
    }

    onPatientSelected(patient: PacienteLite) {    
    this.suggestedPatients.set([]);    
    this.searchForm.controls.searchTerm.setValue(patient.nombre, { emitEvent: false });    
    const fullPatient = this.allPatients().find(p => p.id === patient.id);
    if (fullPatient) {
      this.selectedPatient.set(fullPatient);
    }
    this.itemsFiltrados.set(
      this.itemsSinFiltrar().filter(item => item.paciente === patient.nombre)
    );
    this.items.set(this.itemsFiltrados());
  }
 
verHistorial(visitaId: string) {
  this.dialog.open(VisitaStatusHistoryComponent, {
    width: '90vw',
    maxWidth: '1200px',
    height: '90vh',
    data: { visitaId },
    panelClass: 'historial-dialog'
  });
}


nextStatus() {
    if (this.currentOrderStatus < OrderStatus.ENTREGADA_AL_CLIENTE) {
      this.currentOrderStatus++;
    }
  }

  prevStatus() {
    if (this.currentOrderStatus > OrderStatus.CREADA) {
      this.currentOrderStatus--;
    }
  }

  onRowSelect(row: VisitaCostoRow) {
  this.selectedRow = row;
  
  // Convierte a número si viene como string
  const estadoNum = typeof row.estado === 'number' 
    ? row.estado 
    : parseInt(row.estado as any, 10);

  // Valida y actualiza el timeline
  if (!isNaN(estadoNum)) {
    this.currentOrderStatus = estadoNum;
  }

  console.log('Fila seleccionada:', row);
}
}
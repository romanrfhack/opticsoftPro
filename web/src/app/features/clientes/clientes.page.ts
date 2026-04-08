import { Component, ChangeDetectionStrategy, inject, signal, DestroyRef, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, switchMap, catchError, of, tap, filter } from 'rxjs';
import { PacientesService } from '../../core/pacientes.service';
import { PacienteGridItem, PacienteLite } from '../../core/models/clinica.models';
import { UltimasVisitasComponent } from "../../clinica/ultimas-visitas.component";

@Component({
  standalone: true,
  selector: 'app-clientes',
  imports: [
    CommonModule, ReactiveFormsModule,
    MatCardModule, MatFormFieldModule, MatIconModule, MatButtonModule,
    MatInputModule, MatAutocompleteModule, MatProgressBarModule,
    MatTooltipModule, MatChipsModule, MatBadgeModule,
    UltimasVisitasComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
  <div class="min-h-screen bg-gradient-to-br from-gray-50 to-cyan-50">
    <div class="max-w-7xl mx-auto px-4 py-6">
      <!-- Header Principal -->
      <div class="text-center mb-8">
        <div class="flex flex-row gap-4 justify-center items-center mb-4">
          <div class="inline-flex items-center justify-center w-16 h-16 bg-[#06b6d4] rounded-2xl shadow-lg mb-4">
            <mat-icon class="text-white scale-125">groups</mat-icon>
          </div>
          <h1 class="text-3xl lg:text-4xl font-bold text-gray-800 mb-3">
            Gestión de Clientes
          </h1>
        </div>
        <p class="text-lg text-gray-600 max-w-2xl mx-auto">
          Encuentra y gestiona la información de tus clientes de manera rápida y eficiente
        </p>
      </div>

      <!-- Barra de Progreso -->
      <mat-progress-bar 
        mode="indeterminate" 
        *ngIf="loading()" 
        class="rounded-full mb-6"
        color="primary">
      </mat-progress-bar>

      <!-- Panel de Búsqueda Principal -->
      <div class="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 mb-8">
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
            <!-- INPUT MEJORADO - Sin línea divisora -->

                        <!-- Search Combobox (Tailwind puro) -->
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
              class="border-[#06b6d4] text-[#06b6d4] hover:bg-[#06b6d4] hover:bg-opacity-5 transition-colors">
              <mat-icon>refresh</mat-icon>
              Mostrar Todos
            </button>
          </div>
        </div>
      </div>

      <!-- Información del Paciente Seleccionado -->
      <div *ngIf="selectedPatient()" class="mb-6">
        <div class="bg-white rounded-2xl shadow-lg border border-[#06b6d4] border-opacity-20 p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-xl font-bold text-gray-800 flex items-center gap-3">
              <mat-icon class="text-[#06b6d4]">person</mat-icon>
              Información del Cliente
            </h3>
            <button 
              mat-stroked-button
              (click)="clearSelection()"
              class="border-[#06b6d4] text-[#06b6d4] hover:bg-[#06b6d4] hover:bg-opacity-5">
              <mat-icon>close</mat-icon>
              Ver Todos
            </button>
          </div>
          
          <app-ultimas-visitas 
            [pacienteId]="selectedPatient()?.id ?? null"
            (verDetalle)="onVerDetalleVisita($event)">
          </app-ultimas-visitas>
        </div>
      </div>

      <!-- Grid de Clientes - Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6" *ngIf="displayedPatients().length > 0 && !selectedPatient()">
        <mat-card 
          *ngFor="let patient of displayedPatients()"
          class="patient-card relative overflow-hidden border border-gray-200 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 hover:border-[#06b6d4] hover:border-opacity-50"
          [class.ring-2]="patient.tieneOrdenPendiente"
          [class.ring-amber-200]="patient.tieneOrdenPendiente"
          [class.bg-amber-50]="patient.tieneOrdenPendiente">
          
          <div 
            *ngIf="patient.tieneOrdenPendiente"
            class="absolute top-4 right-4 bg-amber-500 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg z-10">
            <mat-icon class="text-xs mr-1">schedule</mat-icon>
            Pendiente
          </div>

          <div class="p-6 pb-4">
            <div class="flex items-start justify-between mb-4">
              <div class="flex items-center space-x-4">
                <div class="w-14 h-14 bg-gradient-to-br from-[#06b6d4] to-[#0d9488] rounded-2xl flex items-center justify-center shadow-lg">
                  <mat-icon class="text-white scale-110">person</mat-icon>
                </div>
                <div>
                  <h3 class="text-xl font-bold text-gray-800 leading-tight">
                    {{ patient.nombre }}
                  </h3>
                  <p class="text-gray-600 text-sm mt-1" *ngIf="patient.ocupacion">
                    {{ patient.ocupacion }}
                  </p>
                  <p class="text-gray-400 text-xs mt-1" *ngIf="!patient.ocupacion">
                    Sin ocupación registrada
                  </p>
                </div>
              </div>
            </div>

            <div class="flex items-center space-x-2 text-gray-600 mb-3">
              <mat-icon class="text-[#06b6d4] text-base">phone</mat-icon>
              <span class="text-sm">{{ patient.telefono || 'No registrado' }}</span>
            </div>
          </div>

          <div class="px-6 py-4 bg-gray-50 border-t border-gray-100">
            <div class="grid grid-cols-2 gap-4 text-sm">
              <div class="space-y-1">
                <div class="text-gray-500 text-xs font-medium">Última Visita</div>
                <div *ngIf="patient.ultimaVisitaFecha; else noVisit" class="space-y-1">
                  <div class="font-semibold text-gray-800">
                    {{ patient.ultimaVisitaFecha | date:'dd/MM/yy' }}
                  </div>
                  <mat-chip 
                    *ngIf="patient.ultimaVisitaEstado"
                    [class]="getStatusChipClass(patient.ultimaVisitaEstado)"
                    class="!text-xs !h-5 border-0">
                    {{ patient.ultimaVisitaEstado }}
                  </mat-chip>
                </div>
                <ng-template #noVisit>
                  <div class="text-gray-400 text-xs">Sin visitas</div>
                </ng-template>
              </div>

              <div class="space-y-1">
                <div class="text-gray-500 text-xs font-medium">Saldo Pendiente</div>
                <div class="flex items-center space-x-1" [class]="getAmountClass(patient.ultimaVisitaResta || 0)">
                  <mat-icon class="text-base">
                    {{ (patient.ultimaVisitaResta || 0) > 0 ? 'warning' : 'check_circle' }}
                  </mat-icon>
                  <span class="font-bold text-lg">
                    {{ (patient.ultimaVisitaResta || 0) | number:'1.0-0' }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div class="p-4 bg-white border-t border-gray-100">
            <div class="flex space-x-2">
              <button 
                mat-stroked-button
                (click)="selectPatient(patient)"
                class="flex-1 border-[#06b6d4] text-[#06b6d4] hover:bg-[#06b6d4] hover:bg-opacity-5 transition-colors"
                matTooltip="Ver información detallada">
                <mat-icon class="mr-2">visibility</mat-icon>
                Ver Detalle
              </button>
              
              <button 
                mat-flat-button
                (click)="createNewVisit(patient)"
                class="flex-1 custom-primary-button bg-[#06b6d4] hover:bg-[#0d9488] text-white shadow-md hover:shadow-lg transition-all"
                matTooltip="Crear nueva visita">
                <mat-icon class="mr-2">add</mat-icon>
                Nueva Visita
              </button>
            </div>
          </div>
        </mat-card>
      </div>

      <div 
        *ngIf="displayedPatients().length === 0 && searchForm.controls.searchTerm.value && !selectedPatient()"
        class="text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-200">
        <div class="max-w-md mx-auto">
          <div class="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <mat-icon class="text-gray-400 scale-125">search_off</mat-icon>
          </div>
          <h3 class="text-xl font-semibold text-gray-700 mb-2">No se encontraron clientes</h3>
          <p class="text-gray-500 mb-6">
            No hay clientes que coincidan con "{{ searchForm.controls.searchTerm.value }}"
          </p>
          <button 
            mat-flat-button
            (click)="createNewVisit()"
            class="custom-primary-button bg-[#06b6d4] hover:bg-[#0d9488] text-white shadow-lg hover:shadow-xl transition-all">
            <mat-icon class="mr-2">person_add</mat-icon>
            Crear Nuevo Cliente
          </button>
        </div>
      </div>

      <div 
        *ngIf="displayedPatients().length === 0 && !searchForm.controls.searchTerm.value && !selectedPatient()"
        class="text-center py-20">
        <div class="max-w-lg mx-auto">
          <div class="w-24 h-24 bg-[#06b6d4] bg-opacity-10 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <mat-icon class="text-[#06b6d4] scale-150">group</mat-icon>
          </div>
          <h3 class="text-2xl font-bold text-gray-800 mb-3">Comienza a gestionar tus clientes</h3>
          <p class="text-gray-600 text-lg mb-8">
            Busca un cliente existente o crea uno nuevo para empezar
          </p>
          <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              mat-flat-button
              (click)="showAllPatients()"
              class="custom-primary-button bg-[#06b6d4] hover:bg-[#0d9488] text-white shadow-lg hover:shadow-xl transition-all px-8 py-3">
              <mat-icon class="mr-2">visibility</mat-icon>
              Ver Todos los Clientes
            </button>
            <button 
              mat-stroked-button
              (click)="createNewVisit()"
              class="border-[#06b6d4] text-[#06b6d4] hover:bg-[#06b6d4] hover:bg-opacity-5 transition-colors px-8 py-3">
              <mat-icon class="mr-2">person_add</mat-icon>
              Crear Cliente
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
  `,
  styles: [`
    .patient-card { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
    .patient-card:hover { transform: translateY(-4px); }
    .custom-search-field .mat-form-field-flex {
      background: white !important;
      border: 2px solid #e5e7eb !important;
      border-radius: 12px !important;
      padding: 0 !important;
      transition: all 0.3s ease;
    }
    .custom-search-field .mat-form-field-flex:hover {
      border-color: #06b6d4 !important;
      box-shadow: 0 0 0 3px rgba(6, 182, 212, 0.1);
    }
    .custom-search-field .mat-form-field-flex:focus-within {
      border-color: #06b6d4 !important;
      box-shadow: 0 0 0 3px rgba(6, 182, 212, 0.2);
    }
    .custom-search-field .mat-form-field-underline { display: none !important; }
    .custom-search-field .mat-form-field-subscript-wrapper { display: none !important; }
    .custom-primary-button { background-color: #06b6d4 !important; color: white !important; }
    .custom-primary-button:hover { background-color: #0d9488 !important; }
    .mat-autocomplete-panel {
      border-radius: 12px !important;
      margin-top: 8px !important;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1) !important;
      border: 1px solid #e5e7eb !important;
    }
  `]
})
export class ClientesPage {
  private fb = inject(FormBuilder);
  private router = inject(Router);  
  private pacApi = inject(PacientesService);
  private destroyRef = inject(DestroyRef);

  // TS (fragmento esencial)
  open = false;
  activeIndex = -1;
  get activeOptionId() { return this.activeIndex >= 0 ? `option-${this.activeIndex}` : null; }

  // Referencia al input (opcional)
  inputEl!: HTMLInputElement;
  // En ngAfterViewInit puedes asignarla con @ViewChild('search') o template ref


  searchForm = this.fb.group({ 
    searchTerm: ['', [Validators.minLength(2)]]
  });

  loading = signal(false);
  suggestedPatients = signal<PacienteLite[]>([]);
  allPatients = signal<PacienteGridItem[]>([]);
  selectedPatient = signal<PacienteGridItem | null>(null);
  
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

  constructor() {
    // 🔧 Búsqueda en tiempo real robusta: salir de vista individual al teclear y filtrar valores no-string
    this.searchForm.controls.searchTerm.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      tap(() => this.selectedPatient.set(null)),     // <- clave para no “quedarse” en detalle
      filter((term: unknown) => typeof term === 'string'), // <- evita objetos del autocomplete
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

  onPatientSelected(patient: PacienteLite) {
    // Cierra y limpia sugerencias para evitar “fantasmas”
    this.suggestedPatients.set([]);
    // Muestra el nombre sin disparar valueChanges
    this.searchForm.controls.searchTerm.setValue(patient.nombre, { emitEvent: false });
    // Activa vista individual
    const fullPatient = this.allPatients().find(p => p.id === patient.id);
    if (fullPatient) {
      this.selectedPatient.set(fullPatient);
    }
  }

  selectPatient(patient: PacienteGridItem) {
    this.selectedPatient.set(patient);
    this.suggestedPatients.set([]);
    this.searchForm.controls.searchTerm.setValue(patient.nombre, { emitEvent: false });
  }

  clearSelection() {
    this.selectedPatient.set(null);
    this.searchForm.controls.searchTerm.setValue('');
  }

  // clearSearch() {
  //   this.searchForm.controls.searchTerm.setValue('');
  //   this.suggestedPatients.set([]);
  //   this.selectedPatient.set(null);
  // }

  showAllPatients() {
    this.clearSearch();
    this.loadAllPatients();
  }

  viewPatientHistory(patient: PacienteGridItem) {
    this.router.navigate(['/clinica/historial', patient.id]);
  }

  createNewVisit(patient?: PacienteGridItem) {
    if (patient) {
      this.router.navigate(['/clinica/historia'], { queryParams: { pacienteId: patient.id } });
    } else {
      this.router.navigate(['/clinica/historia']);
    }
  }

  onVerDetalleVisita(event: any) {
    const visitaId = typeof event === 'string' ? event : event?.visitaId ?? '';
    console.log('Ver detalle de visita:', visitaId);
  }

  getStatusChipClass(status: string): string {
    const statusMap: { [key: string]: string } = {
      'Completado': 'bg-green-100 text-green-800',
      'Pendiente': 'bg-amber-100 text-amber-800',
      'Cancelado': 'bg-red-100 text-red-800',
      'En Proceso': 'bg-blue-100 text-blue-800',
      'Borrador': 'bg-gray-100 text-gray-800'
    };
    return statusMap[status] || 'bg-gray-100 text-gray-800';
  }

  getAmountClass(amount: number): string {
    if (amount > 0) return 'text-red-600';
    if (amount < 0) return 'text-green-600';
    return 'text-gray-500';
  }

  onKeydown(e: KeyboardEvent) {
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
  this.onPatientSelected(p);           // tu lógica existente
  this.searchForm.controls.searchTerm.setValue(p.nombre, { emitEvent: false });
  this.open = false;
}

clearSearch() {
  this.searchForm.controls.searchTerm.setValue('');
  this.suggestedPatients.set([]);
  this.activeIndex = -1;
  this.open = true; // opcional: deja el dropdown listo para nuevos resultados
}
}

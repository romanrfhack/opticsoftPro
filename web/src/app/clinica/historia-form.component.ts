import { Component, OnInit, inject, signal, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatSelectModule } from '@angular/material/select';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatCardModule } from '@angular/material/card';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';

import { PacientesService } from '../core/pacientes.service';
import { HistoriasService } from '../core/historias.service';
import { MaterialesService } from '../core/materiales.service';
import { AgudezaDto, ArmazonDto, CrearHistoriaRequest, LcDto, MaterialDto, MaterialHistoriaDto, MaterialItem, PacienteItem, PagoResponse, RxDto } from '../core/models/clinica.models';
import { EnviarLabDialog } from './enviar-lab.dialog';
import { UltimasVisitasComponent } from './ultimas-visitas.component';
import { VisitaDetalleModalComponent } from './components/visita-detalle-modal.component';

import { AgudezaVisualComponent } from './components/agudeza-visual.component';
import { RxFormComponent } from './components/rx-form.component';
import { MaterialesFormComponent } from './components/materiales-form.component';
import { PacienteCardComponent } from './components/paciente-card.component';
import { PacienteFormComponent } from './components/paciente-form.component';
import { ActivatedRoute, Router } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  standalone: true,
  selector: 'app-historia-form',
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule,
    MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule,
    MatAutocompleteModule, MatSelectModule, MatDialogModule, MatProgressSpinnerModule,
    MatSnackBarModule, MatProgressBarModule, MatCardModule,    
    // Componentes hijos
    PacienteFormComponent,
    PacienteCardComponent,
    AgudezaVisualComponent,
    RxFormComponent,
    MaterialesFormComponent,    
    UltimasVisitasComponent  
  ],
  templateUrl: './historia-form.component.html'
})
export class HistoriaFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private pacApi = inject(PacientesService);
  private hisApi = inject(HistoriasService);
  private matApi = inject(MaterialesService);
  private dialog = inject(MatDialog);
  private snack = inject(MatSnackBar);
  private destroyRef = inject(DestroyRef);  
  observaciones: string = '';

  loading = signal(false);

  private route = inject(ActivatedRoute);
  private router = inject(Router);

  cargandoPacienteDesdeUrl = signal(false);


  // Paciente
  pacForm = this.fb.group({
    nombre: ['', Validators.required],
    edad:   [0, [Validators.required, Validators.min(0), Validators.max(120)]],
    telefono: ['',  [Validators.required, Validators.pattern(/^\d{2}\s\d{4}\s\d{4}$/)]],
    ocupacion: [''],
    direccion: ['']
  });
  pacienteId = signal<string | null>(null);  
  sugeridos = signal<PacienteItem[]>([]);

  // AV
  avSinOD?: number; avSinOI?: number;
  avConOD?: number; avConOI?: number;

  // RX 4 filas
  filasRx: any[] = [
    { dist: 'Lejos', ojo: 'OD', esf: null, cyl: null, eje: null, add: null, dip: '', altOblea: null },
    { dist: 'Lejos', ojo: 'OI', esf: null, cyl: null, eje: null, add: null, dip: '', altOblea: null },
    { dist: 'Cerca', ojo: 'OD', esf: null, cyl: null, eje: null, add: null, dip: '', altOblea: null },
    { dist: 'Cerca', ojo: 'OI', esf: null, cyl: null, eje: null, add: null, dip: '', altOblea: null },
  ];

  // Materiales
  materiales = signal<MaterialItem[]>([]);
  materialesSel = signal<(MaterialItem & { observaciones?: string })[]>([]);
  visitaGuardada = signal(false);
  materialSelId: string | null = null;
  materialObs: string = '';

  // Lente de contacto
  lcSel = signal<LcDto[]>([]);
  lcTipo: LcDto['tipo'] = 'Esferico';
  lcMarca = ''; lcModelo = ''; lcObs = '';
  
  historiaId = signal<string | null>(null);
  
  armazonesSel: any[] = [];
  lentesContactoSel: any[] = [];

  pagosRegistrados = signal<PagoResponse[]>([]);
  mostrandoPagos = signal(false);
  cargandoPagos = signal(false);

  precioArmazones = 0;
  precioLentesContacto = 0;
  precioMateriales = 0;
  precioServicios = 0;
  precioConsulta = 0;



  ngOnInit() {    
    this.pacForm.controls.nombre.valueChanges.pipe(
      debounceTime(250),
      distinctUntilChanged(),
      switchMap(v => {
        if (!v || (this.pacienteId() && v === this.pacForm.value.nombre)) return of([]);
        return this.pacApi.search(v);
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(list => this.sugeridos.set(list));
    
    this.matApi.list().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (list) => this.materiales.set(list || []),
      error: () => this.materiales.set([])
    });    
  this.route.queryParams.pipe(
    takeUntilDestroyed(this.destroyRef)
  ).subscribe(params => {
    const pacienteIdFromUrl = params['pacienteId'];
    if (pacienteIdFromUrl && !this.pacienteId()) {
      this.cargarPacienteDesdeUrl(pacienteIdFromUrl);
    }
  });
}  

// Actualiza el método cargarPacienteDesdeUrl
cargarPacienteDesdeUrl(pacienteId: string) {
  this.cargandoPacienteDesdeUrl.set(true);
  this.pacApi.getById(pacienteId).pipe(
    takeUntilDestroyed(this.destroyRef)
  ).subscribe({
    next: (paciente) => {
      if (paciente) {
        this.selectPaciente(paciente);
        this.snack.open(`Paciente ${paciente.nombre} cargado automáticamente`, 'Cerrar', { 
          duration: 3000,
          panelClass: ['bg-green-500', 'text-white']
        });
      } else {
        this.snack.open('Paciente no encontrado', 'Cerrar', { duration: 3000 });
      }
      this.cargandoPacienteDesdeUrl.set(false);
    },
    error: (err) => {
      console.error('Error al cargar paciente desde URL:', err);
      this.snack.open('Error al cargar el paciente', 'Cerrar', { duration: 3000 });
      this.cargandoPacienteDesdeUrl.set(false);
    }
  });
}
  selectPaciente(p: PacienteItem) {
    this.pacienteId.set(p.id);
    this.pacForm.patchValue({
      nombre: p.nombre,
      edad: p.edad,
      telefono: p.telefono,
      ocupacion: p.ocupacion,
      direccion: p.direccion || ''
    });
    // Opcional: Limpiar el query parameter después de cargar
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { pacienteId: null },
      queryParamsHandling: 'merge'
    });
  }

  crearPaciente() {
    if (!this.pacForm.valid) return;
    this.loading.set(true);
    const formVal = this.pacForm.value;
    this.pacApi.create({
      nombre: formVal.nombre!,
      edad: formVal.edad!,
      telefono: formVal.telefono || '',
      ocupacion: formVal.ocupacion || '',
      direccion: formVal.direccion || ''
    }).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (res) => {
        this.pacienteId.set(res.id);
        this.snack.open('Paciente creado exitosamente', 'Cerrar', { duration: 3000 });
        this.loading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.snack.open('Error al crear paciente', 'Cerrar', { duration: 3000 });
        this.loading.set(false);
      }
    });
  }

  editarPaciente() {
    this.pacienteId.set(null);
  }
  
  
agregarMaterial(materialData?: MaterialHistoriaDto) {
  if (!this.materialSelId && !materialData) return;
  
  let materialId: string;
  let observaciones: string;
  
  if (materialData) {
    materialId = materialData.materialId;
    observaciones = materialData.observaciones || '';
  } else {    
    materialId = this.materialSelId!;
    observaciones = this.materialObs;
  }

  const mat = this.materiales().find(m => m.id === materialId);
  if (!mat) return;    
  
  this.materialesSel.update(list => [...list, {
    ...mat,
    observaciones: observaciones
  }]);
  
  this.materialSelId = null;
  this.materialObs = '';
  this.calcularPrecioSugerido();
}

quitarMaterial(index: number) {    
  this.materialesSel.update(list => {
    const nuevaLista = list.filter((_, idx) => idx !== index);    
    return nuevaLista;
  });
}

agregarLC() {
    if (!this.lcTipo) return;
    this.lcSel.update(list => [...list, {
      tipo: this.lcTipo,
      marca: this.lcMarca,
      modelo: this.lcModelo,
      observaciones: this.lcObs
    }]);
    this.lcTipo = 'Esferico';
    this.lcMarca = '';
    this.lcModelo = '';
    this.lcObs = '';
    this.calcularPrecioSugerido();
  }

  quitarLC(i: number) {
    this.lcSel.update(list => list.filter((_, idx) => idx !== i));
  } 

  abrirEnviarLab() {
    if (!this.historiaId()) return;
    this.dialog.open(EnviarLabDialog, {      
      maxWidth: '100vw',               
      panelClass: [
        'w-full', 'sm:w-11/12', 'md:w-4/5', 'max-w-screen-xl'
      ],
      data: { historiaId: this.historiaId() }
    });
  }

onLentesContactoChange(lentes: any[]) {
  this.lentesContactoSel = lentes;
  console.log('📦 Lentes de contacto actualizados:', lentes);
}

guardar() {
  if (!this.pacienteId()) return;
  this.loading.set(true);

  const agudeza: AgudezaDto[] = [
    { Condicion: 'SinLentes', Ojo: 'OD', Denominador: this.avSinOD ?? 0 },
    { Condicion: 'SinLentes', Ojo: 'OI', Denominador: this.avSinOI ?? 0 },
    { Condicion: 'ConLentes', Ojo: 'OD', Denominador: this.avConOD ?? 0 },
    { Condicion: 'ConLentes', Ojo: 'OI', Denominador: this.avConOI ?? 0 }
  ];    

  const rx: RxDto[] = this.filasRx.map(fila => ({
    Ojo: fila.ojo,
    Distancia: fila.dist,
    Esf: fila.esf,
    Cyl: fila.cyl,
    Eje: fila.eje,
    Add: fila.add,
    Dip: fila.dip?.toString(),
    AltOblea: fila.altOblea
  }));
  
  const materiales: MaterialDto[] = this.materialesSel().map(m => ({
    materialId: m.id,
    observaciones: m.observaciones || null
  }));
  
  const armazones: ArmazonDto[] = this.armazonesSel.map(a => ({
    productoId: a.productoId || a.id,
    observaciones: a.observaciones || null
  }));
  
  const lentesContacto: LcDto[] = this.lentesContactoSel.map(lc => ({
    tipo: lc.tipo,
    marca: lc.marca || null,
    modelo: lc.modelo || null,
    observaciones: lc.observaciones || null
  }));

  const req: CrearHistoriaRequest = {
    pacienteId: this.pacienteId()!,
    observaciones: this.observaciones,
    av: agudeza,
    rx: rx,
    materiales: materiales,
    armazones: armazones,
    lentesContacto: lentesContacto,
    total: this.totalACobrar
  };

  console.log('📤 Enviando al backend:', req);

  this.hisApi.create(req).pipe(
    takeUntilDestroyed(this.destroyRef)
  ).subscribe({
    next: (res) => {
      this.historiaId.set(res.id);
      this.visitaGuardada.set(true); 
      this.snack.open('Historia guardada exitosamente', 'Cerrar', { duration: 3000 });
      this.loading.set(false);
    },
    error: (err) => {
      console.error('❌ Error al guardar historia:', err);
      this.snack.open('Error al guardar historia', 'Cerrar', { duration: 3000 });
      this.loading.set(false);
    }
  });
}

guardarBorrador() {
  if (!this.pacienteId()) {
    console.error('No hay paciente seleccionado');
    return;
  }    
  
  const agudeza: AgudezaDto[] = [
    { Condicion: 'SinLentes', Ojo: 'OD', Denominador: this.avSinOD ?? 0 },
    { Condicion: 'SinLentes', Ojo: 'OI', Denominador: this.avSinOI ?? 0 },
    { Condicion: 'ConLentes', Ojo: 'OD', Denominador: this.avConOD ?? 0 },
    { Condicion: 'ConLentes', Ojo: 'OI', Denominador: this.avConOI ?? 0 }
  ];

  const rx: RxDto[] = this.filasRx.map(fila => ({
    Ojo: fila.ojo,
    Distancia: fila.dist,
    Esf: fila.esf,
    Cyl: fila.cyl,
    Eje: fila.eje,
    Add: fila.add,
    Dip: fila.dip?.toString(),
    AltOblea: fila.altOblea
  }));

  const materiales: MaterialDto[] = this.materialesSel().map(m => ({
    materialId: m.id,
    observaciones: m.observaciones || null
  }));

  const armazones: ArmazonDto[] = this.armazonesSel.map(a => ({
    productoId: a.productoId || a.id,
    observaciones: a.observaciones || null
  }));

  const lentesContacto: LcDto[] = this.lentesContactoSel.map(lc => ({
    tipo: lc.tipo,
    marca: lc.marca || null,
    modelo: lc.modelo || null,
    observaciones: lc.observaciones || null
  }));

  const datosHistoria = {
    pacienteId: this.pacienteId(),
    agudezaVisual: { 
      sinOD: this.avSinOD,
      sinOI: this.avSinOI,
      conOD: this.avConOD,
      conOI: this.avConOI
    },
    prescripcion: this.filasRx,
    materiales: this.materialesSel().map(m => ({
      id: m.id,
      descripcion: m.descripcion,
      marca: m.marca,
      observaciones: m.observaciones || ''
    })),
    armazones: this.armazonesSel.map(a => ({
      productoId: a.productoId || a.id,
      observaciones: a.observaciones || ''
    })),
    lentesContacto: this.lentesContactoSel,
    observaciones: this.observaciones,
    fecha: new Date().toISOString(),
        
    backendData: {
      pacienteId: this.pacienteId()!,
      observaciones: this.observaciones,
      av: agudeza,
      rx: rx,
      materiales: materiales,
      armazones: armazones,
      lentesContacto: lentesContacto
    } as CrearHistoriaRequest
  };

  console.log('=== GUARDANDO BORRADOR ===');
  console.log('📋 Datos para el backend:', datosHistoria.backendData);
  console.log('============================');
    
  this.guardar();  
}

registrarPagoAdelanto() {
  if (!this.historiaId()) {
    console.error('No hay historia guardada');
    return;
  }

  console.log('Abriendo modal de pago/adelanto para historia:', this.historiaId());  
  const dialogRef = this.dialog.open(EnviarLabDialog, {      
    maxWidth: '100vw',               
    panelClass: [
      'w-full', 'sm:w-11/12', 'md:w-4/5', 'max-w-screen-xl'
    ],
    data: { 
      historiaId: this.historiaId(),
      total: this.totalACobrar - this.totalPagado  // ← Aquí pasamos el total calculado
    }
  });

  dialogRef.afterClosed().subscribe(resultado => {
    if (resultado?.success) {
      console.log('✅ Pagos registrados exitosamente:', resultado.pagos);
      console.log('💰 Total pagado:', resultado.totalPagado);
      
      // Recargar la lista de pagos
      this.cargarPagos();
      
      this.snack.open('Pagos registrados correctamente', 'Cerrar', { 
        duration: 3000,
        panelClass: ['bg-green-500', 'text-white']
      });
    }
  });
}

  // Calcular total de pagos
  get totalPagado(): number {
    return this.pagosRegistrados().reduce((total, pago) => total + pago.monto, 0);
  }

  // Formatear fecha
  formatearFecha(fecha: string): string {
    return new Date(fecha).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

onArmazonesChange(armazones: any[]) {
  console.log('🎯 Armazones recibidos en componente principal:', armazones);
  this.armazonesSel = armazones;
}

agregarLenteContacto(lente: any) {
  this.lentesContactoSel.push(lente);
}

quitarLenteContacto(index: number) {
  this.lentesContactoSel.splice(index, 1);
}

  cargarPagos() {
    if (!this.historiaId()) return;
    
    this.cargandoPagos.set(true);
    this.hisApi.obtenerPagos(this.historiaId()!)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (pagos) => {
          this.pagosRegistrados.set(pagos);
          this.cargandoPagos.set(false);
        },
        error: (err) => {
          console.error('Error al cargar pagos:', err);
          this.cargandoPagos.set(false);
          this.snack.open('Error al cargar los pagos', 'Cerrar', { duration: 3000 });
        }
      });
  }

  // Método para alternar la visualización de pagos
  togglePagos() {
    if (!this.mostrandoPagos()) {
      this.cargarPagos();
    }
    this.mostrandoPagos.update(val => !val);
  }

  // En historia-form.component.ts
getPagoBadgeClass(metodo: string): string {
  switch (metodo) {
    case 'Efectivo':
      return 'bg-green-100 text-green-800';
    case 'Tarjeta':
      return 'bg-blue-100 text-blue-800';
    case 'Transferencia':
      return 'bg-purple-100 text-purple-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

// Getter para calcular el total
get totalACobrar(): number {
  return this.precioConsulta + this.precioServicios + this.precioMateriales + 
         this.precioArmazones + this.precioLentesContacto;
}

// Método para formatear moneda
formatearMoneda(valor: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
  }).format(valor);
}

calcularPrecioSugerido() {
  // Ejemplo: precio base por material seleccionado
  const precioBaseMaterial = this.materialesSel().length * 500; // $500 por material
  const precioBaseArmazones = this.armazonesSel.length * 800; // $800 por armazón
  const precioBaseLentesContacto = this.lentesContactoSel.length * 600; // $600 por lente de contacto
  
  // Si no se ha establecido un precio manual, usar el sugerido
  if (this.precioMateriales === 0) {
    this.precioMateriales = precioBaseMaterial;
  }
  if (this.precioArmazones === 0) {
    this.precioArmazones = precioBaseArmazones;
  }
  if (this.precioLentesContacto === 0) {
    this.precioLentesContacto = precioBaseLentesContacto;
  }
  
  // Precio base de consulta y servicios
  if (this.precioConsulta === 0) {
    this.precioConsulta = 0; 
  }
  if (this.precioServicios === 0) {
    this.precioServicios = 0; 
  }
}

nuevaVisita() {
  // Resetear todos los estados
  this.visitaGuardada.set(false);
  this.pacienteId.set(null);
  this.historiaId.set(null);
  this.pacForm.reset();
  
  // Resetear agudeza visual
  this.avSinOD = undefined;
  this.avSinOI = undefined;
  this.avConOD = undefined;
  this.avConOI = undefined;
  
  // Resetear RX
  this.filasRx = [
    { dist: 'Lejos', ojo: 'OD', esf: null, cyl: null, eje: null, add: null, dip: '', altOblea: null },
    { dist: 'Lejos', ojo: 'OI', esf: null, cyl: null, eje: null, add: null, dip: '', altOblea: null },
    { dist: 'Cerca', ojo: 'OD', esf: null, cyl: null, eje: null, add: null, dip: '', altOblea: null },
    { dist: 'Cerca', ojo: 'OI', esf: null, cyl: null, eje: null, add: null, dip: '', altOblea: null },
  ];
  
  // Resetear materiales
  this.materialesSel.set([]);
  this.materialSelId = null;
  this.materialObs = '';
  
  // Resetear armazones y lentes de contacto
  this.armazonesSel = [];
  this.lentesContactoSel = [];
  
  // Resetear observaciones
  this.observaciones = '';
  
  // Resetear precios
  this.precioArmazones = 0;
  this.precioLentesContacto = 0;
  this.precioMateriales = 0;
  this.precioServicios = 0;
  this.precioConsulta = 0;
  
  // Resetear pagos
  this.pagosRegistrados.set([]);
  
  this.snack.open('Formulario listo para nueva visita', 'Cerrar', { 
    duration: 3000,
    panelClass: ['bg-blue-500', 'text-white']
  });
}

}
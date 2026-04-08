import { Component, Input, Output, EventEmitter, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatTooltipModule } from '@angular/material/tooltip';
import { 
  MaterialItem, 
  ProductDto, 
  ArmazonHistoriaDto,
  MaterialHistoriaDto, 
  ArmazonesDto,
  ArmazonDto,
  MaterialDto
} from '../../core/models/clinica.models';
import { ProductosService } from '../../core/productos.service';

@Component({
  standalone: true,
  selector: 'app-materiales-form',
  imports: [
    CommonModule, FormsModule,
    MatCardModule, MatFormFieldModule, MatInputModule, 
    MatSelectModule, MatButtonModule, MatIconModule,
    MatAutocompleteModule, MatTooltipModule
  ],
  template: `
    <mat-card class="form-card">
      <mat-card-header class="border-b border-gray-100 pb-4 mb-4">
        <mat-card-title class="flex items-center gap-2 text-lg font-semibold">
          <mat-icon [style.color]="'#06b6d4'" class="text-primary">inventory</mat-icon>
          Materiales, Lentes y Armazones
        </mat-card-title>
        <mat-card-subtitle class="text-gray-600">Selecciona los productos requeridos</mat-card-subtitle>
      </mat-card-header>

      <mat-card-content class="space-y-6">
        <!-- Sección de Armazones -->
        <div class="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <h3 class="font-medium text-gray-800 mb-3 flex items-center gap-2">
            <mat-icon class="text-gray-600 text-base">face</mat-icon>
            Armazones
          </h3>
          
          <div class="grid grid-cols-12 gap-3 items-center">
            <mat-form-field appearance="fill" class="col-span-6 custom-form-field">
              <mat-label>Buscar armazón</mat-label>
              <input matInput 
                     [(ngModel)]="armazonBusqueda" 
                     (input)="buscarArmazones()"
                     [matAutocomplete]="autoArmazones"
                     placeholder="Escribe para buscar armazones...">
              <mat-icon matPrefix class="prefix-icon">search</mat-icon>
              <mat-autocomplete #autoArmazones="matAutocomplete" 
                               (optionSelected)="seleccionarArmazon($event.option.value)"
                               [displayWith]="mostrarArmazon">
                <mat-option *ngFor="let armazon of armazonesFiltrados" [value]="armazon">
                  <div class="flex justify-between items-center w-full">
                    <div class="flex flex-col">
                      <span class="font-medium">{{ armazon.nombre }}</span>
                      <span class="text-xs text-gray-500">{{ armazon.sku }}</span>
                    </div>
                    <div class="flex items-center gap-2 ml-2">
                      <span *ngIf="armazon.enSucursalActiva" 
                            class="text-xs bg-green-100 text-green-800 px-2 py-1 rounded whitespace-nowrap">
                        Stock: {{ armazon.stock }}
                      </span>
                      <span *ngIf="!armazon.enSucursalActiva && armazon.sucursalesConStock.length > 0"
                            class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded whitespace-nowrap">
                        En {{ armazon.sucursalesConStock.length }} sucursal(es)
                      </span>
                      <span *ngIf="!armazon.enSucursalActiva && armazon.sucursalesConStock.length === 0"
                            class="text-xs bg-red-100 text-red-800 px-2 py-1 rounded whitespace-nowrap">
                        Sin stock
                      </span>
                    </div>
                  </div>
                </mat-option>
              </mat-autocomplete>
            </mat-form-field>

            <mat-form-field appearance="fill" class="col-span-4 custom-form-field">
              <mat-label>Observaciones</mat-label>
              <input matInput [(ngModel)]="armazonObs" placeholder="Color, medidas, etc.">
            </mat-form-field>

            <div class="col-span-2 flex justify-center">
              <button mat-fab 
                      (click)="agregarArmazon()" 
                      [disabled]="!armazonSeleccionado"
                      class="add-button"
                      matTooltip="Agregar armazón seleccionado"
                      matTooltipPosition="above"
                      [style.background]="!armazonSeleccionado ? '#9ca3af' : '#06b6d4'"
                      [style.color]="'white'">
                <mat-icon>add</mat-icon>
              </button>
            </div>
          </div>

          <!-- Lista de armazones seleccionados -->
          <div class="mt-4" *ngIf="armazonesSel.length">
            <div class="text-sm font-medium mb-2 text-gray-700">Armazones Seleccionados</div>
            <ul class="space-y-2">
              <li *ngFor="let armazon of armazonesSel; let i=index" 
                  class="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-gray-200 transition-all hover:border-blue-300">
                <div class="flex items-center gap-3">
                  <mat-icon class="text-gray-600 text-base">face</mat-icon>
                  <div>
                    <span class="font-medium text-gray-800 text-sm">{{ armazon.nombre }}</span>
                    <span class="text-xs text-gray-500 ml-2">SKU: {{ armazon.sku }}</span>
                    <div class="flex gap-2 mt-1">
                      <span *ngIf="armazon.enSucursalActiva" 
                            class="text-xs bg-green-100 text-green-600 px-2 py-1 rounded">
                        Stock disponible: {{ armazon.stock }}
                      </span>
                      <span *ngIf="!armazon.enSucursalActiva && armazon.sucursalesConStock.length > 0"
                            class="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">
                        Disponible en otras sucursales
                      </span>
                      <span *ngIf="!armazon.enSucursalActiva && armazon.sucursalesConStock.length === 0"
                            class="text-xs bg-red-100 text-red-600 px-2 py-1 rounded">
                        Sin stock
                      </span>
                    </div>
                    <div class="text-xs text-gray-500 mt-1" *ngIf="armazon.observaciones">{{ armazon.observaciones }}</div>
                  </div>
                </div>
                <button mat-icon-button 
                        (click)="quitarArmazon(i)" 
                        title="Quitar armazón"
                        class="remove-button">
                  <mat-icon>close</mat-icon>
                </button>
              </li>
            </ul>
          </div>
        </div>

        <!-- Sección de Materiales y Lentes -->
        <div>
          <h3 class="font-medium text-gray-800 mb-3 flex items-center gap-2">
            <mat-icon class="text-gray-600 text-base">lens</mat-icon>
            Materiales y Lentes
          </h3>
          
          <div class="grid grid-cols-12 gap-3 items-center">
            <mat-form-field appearance="fill" class="col-span-5 custom-form-field">
              <mat-label>Selecciona material</mat-label>
              <mat-select [(ngModel)]="materialSelId" (selectionChange)="onMaterialSeleccionadoChange()">
                <mat-option *ngFor="let m of materiales" [value]="m.id">
                  {{ m.descripcion }} <span *ngIf="m.marca" class="text-gray-500">— {{ m.marca }}</span>
                </mat-option>
              </mat-select>
              <mat-icon matPrefix class="prefix-icon">inventory_2</mat-icon>
            </mat-form-field>

            <mat-form-field appearance="fill" class="col-span-5 custom-form-field">
              <mat-label>Observaciones</mat-label>
              <input matInput [(ngModel)]="materialObs" placeholder="Tratamientos, color, etc.">
              <mat-icon matPrefix class="prefix-icon">note</mat-icon>
            </mat-form-field>

            <div class="col-span-2 flex justify-center">
              <button mat-fab 
                      (click)="agregarMaterialHandler()" 
                      [disabled]="!materialSelId"
                      class="add-button"
                      matTooltip="Agregar material seleccionado"
                      matTooltipPosition="above"
                      [style.background]="!materialSelId ? '#9ca3af' : '#06b6d4'"
                      [style.color]="'white'">
                <mat-icon>add</mat-icon>
              </button>
            </div>
          </div>

          <!-- Lista de materiales seleccionados -->
          <div class="mt-4" *ngIf="materialesSel.length">
            <div class="text-sm font-medium mb-2 text-gray-700">Materiales Seleccionados</div>
            <ul class="space-y-2">
              <li *ngFor="let x of materialesSel; let i=index" 
                  class="flex items-center justify-between bg-blue-50 rounded-lg px-3 py-2 transition-all hover:bg-blue-100">
                <div class="flex items-center gap-3">
                  <mat-icon class="text-primary text-base">lens</mat-icon>
                  <div>
                    <span class="font-medium text-gray-800 text-sm">{{ x.descripcion }}</span>
                    <span class="text-xs text-gray-600 ml-2" *ngIf="x.marca">{{ x.marca }}</span>
                    <div class="text-xs text-gray-500 mt-1" *ngIf="x.observaciones">
                      <strong>Observaciones:</strong> {{ x.observaciones }}
                    </div>
                  </div>
                </div>
                <button mat-icon-button 
                        (click)="quitarMaterialHandler(i)" 
                        title="Quitar material"
                        class="remove-button">
                  <mat-icon>close</mat-icon>
                </button>
              </li>
            </ul>
          </div>
        </div>

        <!-- Sección de Lentes de Contacto -->
        <div>
          <h3 class="font-medium text-gray-800 mb-3 flex items-center gap-2">
            <mat-icon class="text-gray-600 text-base">visibility</mat-icon>
            Lentes de Contacto
          </h3>
          
          <div class="grid grid-cols-12 gap-3 items-center">
            <!-- Tipo -->
            <mat-form-field appearance="fill" class="col-span-3 custom-form-field">
              <mat-label>Tipo</mat-label>
              <input matInput [(ngModel)]="lenteContactoTipo" placeholder="Diario, mensual, etc.">
              <mat-icon matPrefix class="prefix-icon">category</mat-icon>
            </mat-form-field>

            <!-- Marca -->
            <mat-form-field appearance="fill" class="col-span-3 custom-form-field">
              <mat-label>Marca</mat-label>
              <input matInput [(ngModel)]="lenteContactoMarca" placeholder="Marca del lente">
              <mat-icon matPrefix class="prefix-icon">branding_watermark</mat-icon>
            </mat-form-field>

            <!-- Modelo -->
            <mat-form-field appearance="fill" class="col-span-3 custom-form-field">
              <mat-label>Modelo</mat-label>
              <input matInput [(ngModel)]="lenteContactoModelo" placeholder="Modelo específico">
              <mat-icon matPrefix class="prefix-icon">style</mat-icon>
            </mat-form-field>

            <!-- Botón Agregar -->
            <div class="col-span-3 flex justify-center">
              <button mat-fab 
                      (click)="agregarLenteContacto()" 
                      [disabled]="!lenteContactoTipo || !lenteContactoMarca"
                      class="add-button"
                      matTooltip="Agregar lente de contacto"
                      matTooltipPosition="above"
                      [style.background]="(!lenteContactoTipo || !lenteContactoMarca) ? '#9ca3af' : '#06b6d4'"
                      [style.color]="'white'">
                <mat-icon>add</mat-icon>
              </button>
            </div>

            <!-- Observaciones en nueva fila -->
            <div class="col-span-12 mt-2">
              <mat-form-field appearance="fill" class="w-full custom-form-field">
                <mat-label>Observaciones lente de contacto</mat-label>
                <input matInput [(ngModel)]="lenteContactoObs" placeholder="Graduación, características especiales, etc.">
                <mat-icon matPrefix class="prefix-icon">note</mat-icon>
              </mat-form-field>
            </div>
          </div>

          <!-- Lista de lentes de contacto seleccionados -->
          <div class="mt-4" *ngIf="lentesContactoSel.length">
            <div class="text-sm font-medium mb-2 text-gray-700">Lentes de Contacto Seleccionados</div>
            <ul class="space-y-2">
              <li *ngFor="let lente of lentesContactoSel; let i=index" 
                  class="flex items-center justify-between bg-purple-50 rounded-lg px-3 py-2 transition-all hover:bg-purple-100">
                <div class="flex items-center gap-3">
                  <mat-icon class="text-purple-600 text-base">visibility</mat-icon>
                  <div>
                    <div class="flex flex-wrap gap-2 items-center">
                      <span class="font-medium text-gray-800 text-sm">{{ lente.tipo }}</span>
                      <span class="text-xs text-gray-600">• {{ lente.marca }}</span>
                      <span class="text-xs text-gray-600" *ngIf="lente.modelo">• {{ lente.modelo }}</span>
                    </div>
                    <div class="text-xs text-gray-500 mt-1" *ngIf="lente.observaciones">
                      <strong>Observaciones:</strong> {{ lente.observaciones }}
                    </div>
                  </div>
                </div>
                <button mat-icon-button 
                        (click)="quitarLenteContacto(i)" 
                        title="Quitar lente de contacto"
                        class="remove-button">
                  <mat-icon>close</mat-icon>
                </button>
              </li>
            </ul>
          </div>
        </div>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    /* Estilos para el botón personalizado */
    .add-button {
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      border: none;
      cursor: pointer;
    }

    .add-button:not([disabled]):hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(6, 182, 212, 0.3);
    }

    .add-button:not([disabled]):active {
      transform: translateY(0);
    }

    .add-button[disabled] {
      cursor: not-allowed;
      opacity: 0.6;
    }

    /* Efecto de onda personalizado para el color cyan */
    .mat-button-base.mat-primary .mat-ripple-element {
      background-color: rgba(6, 182, 212, 0.1);
    }

    /* Asegurar que los form fields tengan altura consistente */
    .custom-form-field {
      .mat-form-field-wrapper {
        padding-bottom: 0;
      }
    }
  `]
})
export class MaterialesFormComponent implements OnInit {
  private productosService = inject(ProductosService);

  @Input() materiales: MaterialItem[] = [];
  @Input() materialesSel: (MaterialItem & { observaciones?: string | null })[] = [];
  @Input() materialSelId: string | null = null;
  @Input() materialObs: string = '';    
  @Output() materialSelIdChange = new EventEmitter<string | null>();
  @Output() materialObsChange = new EventEmitter<string>();
  @Output() agregarMaterial = new EventEmitter<MaterialHistoriaDto>();
  @Output() quitarMaterial = new EventEmitter<number>();

  // Nuevas propiedades para armazones
  armazonBusqueda: string = '';  
  armazonObs: string = '';
  armazonesSel: (ArmazonesDto & { observaciones?: string | null })[] = [];
  armazonesFiltrados: ArmazonesDto[] = [];
  armazonSeleccionado?: ArmazonesDto;  

  // Propiedades para lentes de contacto
  lenteContactoTipo: string = '';
  lenteContactoMarca: string = '';
  lenteContactoModelo: string = '';
  lenteContactoObs: string = '';
  lentesContactoSel: any[] = [];

  // Output para armazones
  @Output() armazonesChange = new EventEmitter<ArmazonHistoriaDto[]>();
  // Agregar este Output en MaterialesFormComponent
  @Output() lentesContactoChange = new EventEmitter<any[]>();

  ngOnInit() {
    this.buscarArmazones();
  }

  // Métodos para materiales
  onMaterialSeleccionadoChange() {
    this.materialSelIdChange.emit(this.materialSelId);
  }

  // Asegurarnos de que los métodos emitan los datos en el formato correcto

// En agregarMaterialHandler()
agregarMaterialHandler() {
  if (!this.materialSelId) return;

  const materialSeleccionado = this.materiales.find(m => m.id === this.materialSelId);
  if (!materialSeleccionado) return;

  // Crear el objeto en formato MaterialDto
  const materialHistoria: MaterialDto = {
    materialId: this.materialSelId,
    observaciones: this.materialObs || null
  };

  // Emitir al componente padre
  this.agregarMaterial.emit(materialHistoria);

  // También agregar localmente para mostrar en la lista
  this.materialesSel.push({
    ...materialSeleccionado,
    observaciones: this.materialObs
  });

  this.limpiarMaterial();
}

// En emitArmazones() - asegurarnos de usar ArmazonDto
private emitArmazones() {
  const armazonesParaHistoria: ArmazonDto[] = this.armazonesSel.map(armazon => ({
    productoId: armazon.id, // Esto viene de ArmazonesDto
    observaciones: armazon.observaciones || null
  }));
  this.armazonesChange.emit(armazonesParaHistoria);
}

  quitarMaterialHandler(index: number) {
    this.materialesSel.splice(index, 1);
    this.quitarMaterial.emit(index);
  }

  private limpiarMaterial() {
    this.materialSelId = null;
    this.materialObs = '';
    this.materialSelIdChange.emit(null);
    this.materialObsChange.emit('');
  }

  // Métodos para armazones
  buscarArmazones() {
    this.productosService.getArmazones(this.armazonBusqueda).subscribe({
      next: (armazones) => {

        console.log('🔍 Armazones filtrados ANTES DE ORDENAR:', this.armazonesFiltrados)
        this.armazonesFiltrados = armazones.sort((a, b) => {
          if (a.enSucursalActiva && !b.enSucursalActiva) return -1;
          if (!a.enSucursalActiva && b.enSucursalActiva) return 1;
          if (a.enSucursalActiva && b.enSucursalActiva) {
            if (b.stock !== a.stock) return b.stock - a.stock;
          }
          if (!a.enSucursalActiva && !b.enSucursalActiva) {
            if (a.sucursalesConStock.length > 0 && b.sucursalesConStock.length === 0) return -1;
            if (a.sucursalesConStock.length === 0 && b.sucursalesConStock.length > 0) return 1;
          }          
          // Finalmente, ordenar alfabéticamente          
          return a.nombre.localeCompare(b.nombre);
        });
        // Finalmente, ordenar alfabéticamente this.armazonesFiltrados
        this.armazonesFiltrados.sort((a, b) => a.nombre.localeCompare(b.nombre));
        this.armazonesFiltrados = this.armazonesFiltrados.slice(0, 10);
        console.log('🔍 Armazones filtrados:', this.armazonesFiltrados);

      },
      error: (err) => {
        console.error('Error al buscar armazones:', err);
        this.armazonesFiltrados = [];
      }
    });
  }  

  seleccionarArmazon(armazon: ArmazonesDto) {
    console.log('✅ Armazón seleccionado:', armazon);
    console.log('✅ ID del armazón:', armazon.id);
    console.log('✅ Nombre del armazón:', armazon.nombre);
    console.log('✅ SKU del armazón:', armazon.sku);
    this.armazonSeleccionado = armazon;
  }

  agregarArmazon() {
  if (!this.armazonSeleccionado) return;
  
  console.log('🔍 Armazón seleccionado:', this.armazonSeleccionado);
  console.log('📝 Observaciones del armazón:', this.armazonObs);
  
  this.armazonesSel.push({
    ...this.armazonSeleccionado,
    observaciones: this.armazonObs
  });

  console.log('📦 Lista actual de armazones:', this.armazonesSel);
  
  this.emitArmazones();
  this.armazonSeleccionado = undefined;
  this.armazonBusqueda = '';
  this.armazonObs = '';
  this.armazonesFiltrados = [];
}

  quitarArmazon(index: number) {
    this.armazonesSel.splice(index, 1);
    this.emitArmazones();
  }

  // Métodos para lentes de contacto
  // agregarLenteContacto() {
  //   if (!this.lenteContactoTipo || !this.lenteContactoMarca) return;
    
  //   this.lentesContactoSel.push({
  //     tipo: this.lenteContactoTipo,
  //     marca: this.lenteContactoMarca,
  //     modelo: this.lenteContactoModelo,
  //     observaciones: this.lenteContactoObs
  //   });

  //   this.limpiarLenteContacto();
  // }

  // quitarLenteContacto(index: number) {
  //   this.lentesContactoSel.splice(index, 1);
  // }

  private limpiarLenteContacto() {
    this.lenteContactoTipo = '';
    this.lenteContactoMarca = '';
    this.lenteContactoModelo = '';
    this.lenteContactoObs = '';
  }  

//   private emitArmazones() {
//   console.log('🔄 Emitiendo armazones:', this.armazonesSel);
  
//   const armazonesParaHistoria = this.armazonesSel.map(armazon => {
//     // Asegurarnos de que tenemos el ID correcto
//     const armazonData = {
//       productoId: armazon.id, // Intentar ambos
//       observaciones: armazon.observaciones || null
//     };
//     console.log('📦 Procesando armazón:', armazon, '->', armazonData);
//     return armazonData;
//   });
  
//   console.log('📤 Armazones para emitir:', armazonesParaHistoria);
//   this.armazonesChange.emit(armazonesParaHistoria);
// }

  mostrarArmazon(armazon: ArmazonesDto | string): string {
    if (!armazon) return '';
    if (typeof armazon === 'string') return armazon;
    return armazon.nombre || armazon.sku || '';
  }

  

// Actualizar los métodos de lentes de contacto
agregarLenteContacto() {
  if (!this.lenteContactoTipo || !this.lenteContactoMarca) return;
  
  const nuevoLente = {
    tipo: this.lenteContactoTipo,
    marca: this.lenteContactoMarca,
    modelo: this.lenteContactoModelo,
    observaciones: this.lenteContactoObs
  };
  
  this.lentesContactoSel.push(nuevoLente);
  
  // EMITIR EL CAMBIO AL COMPONENTE PADRE
  this.lentesContactoChange.emit(this.lentesContactoSel);
  
  this.limpiarLenteContacto();
}

quitarLenteContacto(index: number) {
  this.lentesContactoSel.splice(index, 1);
  // EMITIR EL CAMBIO AL COMPONENTE PADRE
  this.lentesContactoChange.emit(this.lentesContactoSel);
}
}
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { LcDto } from '../../core/models/clinica.models';

@Component({
  standalone: true,
  selector: 'app-lentes-contacto',
  imports: [
    CommonModule, FormsModule,
    MatCardModule, MatFormFieldModule, MatInputModule, 
    MatSelectModule, MatButtonModule, MatIconModule
  ],
  template: `
    <mat-card class="form-card">
      <mat-card-header class="border-b border-gray-100 pb-4 mb-4">
        <mat-card-title class="flex items-center gap-2 text-lg font-semibold">
          <mat-icon class="text-primary">contact_lens</mat-icon>
          Lentes de Contacto
        </mat-card-title>
        <mat-card-subtitle class="text-gray-600">Especificaciones de lentes de contacto</mat-card-subtitle>
      </mat-card-header>

      <mat-card-content>
        <div class="grid grid-cols-12 gap-4 items-end">
          <mat-form-field appearance="fill" class="col-span-3 custom-form-field">
            <mat-label>Tipo</mat-label>
            <mat-select [(ngModel)]="lcTipo">
              <mat-option value="Esferico">Esférico</mat-option>
              <mat-option value="Torico">Tórico</mat-option>
              <mat-option value="Otro">Otro</mat-option>
            </mat-select>
            <mat-icon matPrefix class="prefix-icon">category</mat-icon>
          </mat-form-field>

          <mat-form-field appearance="fill" class="col-span-3 custom-form-field">
            <mat-label>Marca</mat-label>
            <input matInput [(ngModel)]="lcMarca" placeholder="ACUVUE OASYS, Biofinity...">
            <mat-icon matPrefix class="prefix-icon">branding_watermark</mat-icon>
          </mat-form-field>

          <mat-form-field appearance="fill" class="col-span-3 custom-form-field">
            <mat-label>Modelo</mat-label>
            <input matInput [(ngModel)]="lcModelo" placeholder="ULTRA, XR...">
            <mat-icon matPrefix class="prefix-icon">model_training</mat-icon>
          </mat-form-field>

          <mat-form-field appearance="fill" class="col-span-3 custom-form-field">
            <mat-label>Observaciones</mat-label>
            <input matInput [(ngModel)]="lcObs">
            <mat-icon matPrefix class="prefix-icon">notes</mat-icon>
          </mat-form-field>
        </div>

        <button mat-stroked-button 
                (click)="agregarLC.emit()"
                class="action-button mt-4">
          <mat-icon>add_circle</mat-icon>
          Agregar Lente de Contacto
        </button>

        <div class="mt-6" *ngIf="lcSel.length">
          <div class="text-sm font-medium mb-3 flex items-center gap-2">
            <mat-icon class="text-base">checklist</mat-icon>
            Lentes de Contacto Seleccionados
          </div>
          <ul class="space-y-2">
            <li *ngFor="let x of lcSel; let i=index" 
                class="flex items-center justify-between bg-green-50 rounded-lg px-4 py-3 transition-all hover:bg-green-100">
              <div class="flex items-center gap-3">
                <mat-icon class="text-primary text-base">contact_lens</mat-icon>
                <div>
                  <span class="font-medium text-gray-800">{{ x.tipo }}</span>
                  <span class="text-xs text-gray-600 ml-2" *ngIf="x.marca">• {{ x.marca }}</span>
                  <span class="text-xs text-gray-600 ml-1" *ngIf="x.modelo">• {{ x.modelo }}</span>
                  <div class="text-xs text-gray-500 mt-1" *ngIf="x.observaciones">{{ x.observaciones }}</div>
                </div>
              </div>
              <button mat-icon-button 
                      (click)="quitarLC.emit(i)" 
                      title="Quitar"
                      class="remove-button">
                <mat-icon>close</mat-icon>
              </button>
            </li>
          </ul>
        </div>
      </mat-card-content>
    </mat-card>
  `
})
export class LentesContactoComponent {
  @Input() lcSel: LcDto[] = [];
  @Input() lcTipo: LcDto['tipo'] = 'Esferico';
  @Input() lcMarca: string = '';
  @Input() lcModelo: string = '';
  @Input() lcObs: string = '';
  
  @Output() lcTipoChange = new EventEmitter<LcDto['tipo']>();
  @Output() lcMarcaChange = new EventEmitter<string>();
  @Output() lcModeloChange = new EventEmitter<string>();
  @Output() lcObsChange = new EventEmitter<string>();
  @Output() agregarLC = new EventEmitter<void>();
  @Output() quitarLC = new EventEmitter<number>();
}
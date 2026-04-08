import { ChangeDetectionStrategy, Component, Inject, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';

import { MovementsService, MovementType } from './movements.service';
import { BranchesService, Branch } from '../../core/branches.service';
import { Toast } from '../../shared/ui/toast.service';

export interface MovementData {
  productoId: string;
  productoNombre: string;
  sucursalIdActual: string;
  sucursalNombreActual: string;
}

@Component({
  standalone: true,
  selector: 'app-movement-dialog',
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule
  ],
  template: `
  <h2 mat-dialog-title class="dialog-title">Movimiento de inventario</h2>
  <div class="px-4 text-sm text-gray-600">
    Producto: <strong>{{ data.productoNombre }}</strong>
  </div>

  <form class="p-4 space-y-4" [formGroup]="form" (ngSubmit)="save()">
    <div class="grid md:grid-cols-3 gap-4">
      <mat-form-field appearance="fill" class="field no-outline">
        <mat-label>Tipo</mat-label>
        <mat-select formControlName="tipo" required (selectionChange)="onTipoChange()" panelClass="select-panel">
          <mat-option *ngFor="let t of tipos" [value]="t">{{ t }}</mat-option>
        </mat-select>
      </mat-form-field>

      <mat-form-field appearance="fill" class="field no-outline" *ngIf="showDesde()">
        <mat-label>Desde sucursal</mat-label>
        <mat-select formControlName="desdeSucursalId" panelClass="select-panel">
          <mat-option *ngFor="let b of branches" [value]="b.id">{{ b.nombre }}</mat-option>
        </mat-select>
        <mat-hint>Actual: {{ data.sucursalNombreActual }}</mat-hint>
        <mat-error *ngIf="form.controls.desdeSucursalId.hasError('required')">Obligatorio</mat-error>
      </mat-form-field>

      <mat-form-field appearance="fill" class="field no-outline" *ngIf="showHacia()">
        <mat-label>Hacia sucursal</mat-label>
        <mat-select formControlName="haciaSucursalId" panelClass="select-panel">
          <mat-option *ngFor="let b of branches" [value]="b.id">{{ b.nombre }}</mat-option>
        </mat-select>
        <mat-error *ngIf="form.controls.haciaSucursalId.hasError('required')">Obligatorio</mat-error>
        <mat-error *ngIf="form.errors?.['sameBranch']">No puede ser la misma sucursal</mat-error>
      </mat-form-field>
    </div>

    <div class="grid md:grid-cols-3 gap-4">
      <mat-form-field appearance="fill" class="field no-outline">
        <mat-label>Cantidad</mat-label>
        <input matInput type="number" formControlName="cantidad" min="1" step="1" required />
        <mat-error *ngIf="form.controls.cantidad.hasError('required')">Requerido</mat-error>
        <mat-error *ngIf="form.controls.cantidad.hasError('min')">Debe ser mayor a 0</mat-error>
      </mat-form-field>

      <mat-form-field appearance="fill" class="field no-outline md:col-span-2">
        <mat-label>Motivo (opcional)</mat-label>
        <input matInput formControlName="motivo" maxlength="300" />
      </mat-form-field>
    </div>

    <div class="flex justify-end gap-2 pt-2">
      <button mat-button type="button" (click)="close()">Cancelar</button>
      <button mat-flat-button color="primary" type="submit" class="btn-primary" [disabled]="form.invalid || saving()">
        {{ saving() ? 'Guardando…' : 'Guardar' }}
      </button>
    </div>
  </form>
  `,
  styles: [`
  :host { display:block; }
  .dialog-title { color:#0f172a; margin-bottom:.25rem; }
  .btn-primary { background:#06b6d4 !important; color:#fff !important; }
  .field .mdc-text-field { border-radius:10px; }
  .select-panel { background:#fff !important; border:1px solid #e5e7eb !important; }
  .dark .select-panel { background:#1f2937 !important; border-color:#4b5563 !important; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MovementDialogComponent {
  tipos: MovementType[] = ['Entrada','Salida','Traslado'];
  branches: Branch[] = [];

  saving = signal(false);

  private fb = inject(FormBuilder);
  private svc = inject(MovementsService);
  private toast = inject(Toast);
  private ref = inject(MatDialogRef<MovementDialogComponent>);
  private branchesSvc = inject(BranchesService);

  /** Validador: en Traslado, 'desde' y 'hacia' deben ser distintas */
  private notSameBranchValidator = (group: AbstractControl): ValidationErrors | null => {
    const tipo = group.get('tipo')?.value as MovementType;
    if (tipo !== 'Traslado') return null;
    const d = group.get('desdeSucursalId')?.value;
    const h = group.get('haciaSucursalId')?.value;
    return d && h && d === h ? { sameBranch: true } : null;
  };

  form = this.fb.group({
    tipo: ['Entrada' as MovementType, Validators.required],
    cantidad: [1, [Validators.required, Validators.min(1)]],
    motivo: [''],
    desdeSucursalId: [''],
    haciaSucursalId: [''],
  }, { validators: this.notSameBranchValidator });

  constructor(@Inject(MAT_DIALOG_DATA) public data: MovementData) {
    // Carga sucursales (fallback a la actual si falla)
    this.branchesSvc.list().subscribe({
      next: (bs) => { this.branches = bs; },
      error: () => {
        this.branches = [{ id: data.sucursalIdActual, nombre: data.sucursalNombreActual } as Branch];
      }
    });

    // Por defecto: Entrada hacia la sucursal actual (o la activa en localStorage)
    this.form.patchValue({
      desdeSucursalId: '',
      haciaSucursalId: this.getDefaultTargetBranchId()
    });

    this.applyValidators(this.form.controls.tipo.value as MovementType);
  }

  private getDefaultTargetBranchId(): string {
    return localStorage.getItem('branchId') || this.data.sucursalIdActual;
    }

  close() { this.ref.close(); }

  onTipoChange() {
    const t = this.form.controls.tipo.value as MovementType;
    this.applyValidators(t);
  }

  private applyValidators(t: MovementType) {
    const desde = this.form.controls.desdeSucursalId;
    const hacia = this.form.controls.haciaSucursalId;

    // Limpia validators
    desde.clearValidators();
    hacia.clearValidators();

    if (t === 'Entrada') {
      // Entrada: requiere 'hacia'
      hacia.setValidators([Validators.required]);
    } else if (t === 'Salida') {
      // Salida: requiere 'desde'
      desde.setValidators([Validators.required]);
    } else if (t === 'Traslado') {
      // Traslado: requiere ambos y no iguales (ya validado por el validador de grupo)
      desde.setValidators([Validators.required]);
      hacia.setValidators([Validators.required]);
    }

    desde.updateValueAndValidity({ emitEvent: false });
    hacia.updateValueAndValidity({ emitEvent: false });
  }

  save() {
    if (this.form.invalid || this.saving()) return;
    this.saving.set(true);

    const v = this.form.getRawValue();
    const payload = {
      productoId: this.data.productoId,
      tipo: v.tipo as MovementType,
      cantidad: Number(v.cantidad),
      motivo: v.motivo || undefined,
      desdeSucursalId: v.desdeSucursalId || undefined,
      haciaSucursalId: v.haciaSucursalId || undefined,
    };

    this.svc.create(payload).subscribe({
      next: () => { this.toast.ok('Movimiento registrado'); this.ref.close(true); },
      error: e => { this.toast.err(e?.error?.message ?? 'Error en movimiento'); this.saving.set(false); }
    });
  }

  showDesde() { return this.form.value.tipo === 'Salida' || this.form.value.tipo === 'Traslado'; }
  showHacia() { return this.form.value.tipo === 'Entrada' || this.form.value.tipo === 'Traslado'; }

}

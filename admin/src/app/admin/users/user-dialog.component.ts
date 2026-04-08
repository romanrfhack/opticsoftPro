
import { ChangeDetectionStrategy, Component, Inject, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';

import { UsersService, UserItem } from './users.service';
import { BranchesService } from '../../core/branches.service';

type Mode = 'create' | 'edit';

@Component({
  standalone: true,
  selector: 'app-user-dialog',
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule
  ],
  template: `
  <h2 class="text-lg font-semibold mb-3">
    {{ mode === 'create' ? 'Nuevo usuario' : 'Editar usuario' }}
  </h2>

  <form [formGroup]="form" (ngSubmit)="save()" class="grid gap-4 md:grid-cols-2">
    <mat-form-field appearance="outline" class="w-full" *ngIf="mode==='create'">
      <mat-label>Email</mat-label>
      <input matInput formControlName="email" type="email" required />
      <mat-error *ngIf="form.controls.email.hasError('required')">Requerido</mat-error>
      <mat-error *ngIf="form.controls.email.hasError('email')">Formato inválido</mat-error>
    </mat-form-field>

    <mat-form-field appearance="outline" class="w-full md:col-span-2">
      <mat-label>Nombre</mat-label>
      <input matInput formControlName="fullName" required />
      <mat-error *ngIf="form.controls.fullName.hasError('required')">Requerido</mat-error>
    </mat-form-field>

    <mat-form-field appearance="outline" class="w-full">
      <mat-label>Sucursal</mat-label>
      <mat-select formControlName="sucursalId" required>
        <mat-option *ngFor="let b of branches" [value]="b.id">{{ b.nombre }}</mat-option>
      </mat-select>
      <mat-error *ngIf="form.controls.sucursalId.hasError('required')">Requerido</mat-error>
    </mat-form-field>

    <mat-form-field appearance="outline" class="w-full">
      <mat-label>Roles</mat-label>
      <mat-select formControlName="roles" multiple required>
        <mat-option value="Admin">Admin</mat-option>
        <mat-option value="Gerente">Gerente</mat-option>
        <mat-option value="Optometrista">Optometrista</mat-option>
        <mat-option value="Cajero">Cajero</mat-option>
        <mat-option value="Laboratorio">Laboratorio</mat-option>
      </mat-select>
      <mat-error *ngIf="form.controls.roles.hasError('required')">Requerido</mat-error>
    </mat-form-field>

    <ng-container *ngIf="mode==='create'">
      <mat-form-field appearance="outline" class="w-full md:col-span-2">
        <mat-label>Contraseña</mat-label>
        <input matInput formControlName="password" type="password" required minlength="6" />
        <mat-error *ngIf="form.controls.password.hasError('required')">Requerida</mat-error>
        <mat-error *ngIf="form.controls.password.hasError('minlength')">Mínimo 6 caracteres</mat-error>
      </mat-form-field>
    </ng-container>

    <div class="md:col-span-2 flex justify-end gap-2 pt-2">
      <button mat-button type="button" (click)="close()">Cancelar</button>
      <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid || saving()">
        {{ saving() ? 'Guardando…' : 'Guardar' }}
      </button>
    </div>
  </form>
  `,
  styles: [`
    :host { display:block; max-width: 720px; }
    .mat-mdc-form-field { width:100%; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserDialogComponent {
  private fb = inject(FormBuilder);
  private ref = inject(MatDialogRef<UserDialogComponent>);
  private users = inject(UsersService);
  private branchesSvc = inject(BranchesService);

  mode: Mode = 'create';
  saving = signal(false);

  branches: Array<{ id: string; nombre: string }> = [];

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    fullName: ['', Validators.required],
    sucursalId: ['', Validators.required],
    roles: [<string[]>[], Validators.required],
    password: [''] // sólo en create
  });

  constructor(@Inject(MAT_DIALOG_DATA) public data: UserItem | null) {
    this.mode = data ? 'edit' : 'create';

    this.branchesSvc.list().subscribe({
      next: (res: any[]) => { this.branches = res ?? []; },
      error: () => { this.branches = []; }
    });

    if (data) {
      this.form.patchValue({
        email: data.email,
        fullName: data.fullName,
        sucursalId: (data as any).sucursalId,
        roles: data.roles ?? []
      });
      // En edición no pedimos password
      this.form.controls.password.clearValidators();
      this.form.controls.password.updateValueAndValidity({ emitEvent: false });
      this.form.controls.email.disable({ emitEvent: false });
    } else {
      // En creación password requerido
      this.form.controls.password.addValidators([Validators.required, Validators.minLength(6)]);
      this.form.controls.password.updateValueAndValidity({ emitEvent: false });
    }
  }

  close() { this.ref.close(false); }

  save() {
    if (this.form.invalid || this.saving()) return;
    this.saving.set(true);

    const raw = this.form.getRawValue();
    if (this.mode === 'create') {
      (this.users as any).create?.({
        email: raw.email!, fullName: raw.fullName!, sucursalId: raw.sucursalId!,
        password: raw.password!, roles: raw.roles! as string[]
      }).subscribe({
        next: () => { this.ref.close(true); },
        error: () => { this.saving.set(false); }
      });
    } else if (this.data) {
      (this.users as any).update?.(this.data.id, {
        fullName: raw.fullName!, sucursalId: raw.sucursalId!, roles: raw.roles! as string[]
      }).subscribe({
        next: () => { this.ref.close(true); },
        error: () => { this.saving.set(false); }
      });
    } else {
      this.saving.set(false);
    }
  }
}

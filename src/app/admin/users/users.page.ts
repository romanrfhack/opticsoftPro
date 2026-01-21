
import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged, startWith, switchMap, tap } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { UsersService, UserItem } from './users.service';



@Component({
  standalone: true,
  selector: 'app-users',
  imports: [
    CommonModule, ReactiveFormsModule,
    MatTableModule, MatFormFieldModule, MatInputModule, MatButtonModule,
    MatIconModule, MatDialogModule, MatChipsModule, MatProgressSpinnerModule
  ],
  template: `
  <section class="space-y-4">
    <header class="flex flex-col gap-3">
      <div class="flex items-center gap-2">
        <h1 class="text-2xl font-bold">Usuarios</h1>
        <span class="text-sm text-gray-500" *ngIf="rows().length">{{ rows().length }} resultados</span>
      </div>

      <div class="flex flex-wrap items-center gap-3">
        <mat-form-field class="w-72" appearance="outline">
          <mat-icon matPrefix>search</mat-icon>
          <input matInput [formControl]="q" placeholder="Buscar por correo o nombre" />
        </mat-form-field>

        <button mat-flat-button type="button" class="btn-primary" (click)="openCreate()">
          <mat-icon>add</mat-icon>
          <span class="ml-1">Nuevo</span>
        </button>
      </div>
    </header>

    <div class="card p-4">
      <div class="flex items-center gap-2 mb-3" *ngIf="loading()">
        <mat-spinner diameter="22"></mat-spinner>
        <span class="text-sm text-gray-600">Cargando…</span>
      </div>

      <table mat-table [dataSource]="rows()" class="w-full">
        <!-- Email -->
        <ng-container matColumnDef="email">
          <th mat-header-cell *matHeaderCellDef class="th">Email</th>
          <td mat-cell *matCellDef="let r" class="td font-mono">{{ r.email }}</td>
        </ng-container>

        <!-- Nombre -->
        <ng-container matColumnDef="name">
          <th mat-header-cell *matHeaderCellDef class="th">Nombre</th>
          <td mat-cell *matCellDef="let r" class="td">{{ r.fullName }}</td>
        </ng-container>

        <!-- Sucursal -->
        <ng-container matColumnDef="sucursal">
          <th mat-header-cell *matHeaderCellDef class="th">Sucursal</th>
          <td mat-cell *matCellDef="let r" class="td">{{ r.sucursalNombre || r.sucursalId }}</td>
        </ng-container>

        <!-- Roles -->
        <ng-container matColumnDef="roles">
          <th mat-header-cell *matHeaderCellDef class="th">Roles</th>
          <td mat-cell *matCellDef="let r" class="td">
            <mat-chip-set *ngIf="r.roles?.length; else noroles">
              <mat-chip *ngFor="let role of r.roles">{{ role }}</mat-chip>
            </mat-chip-set>
            <ng-template #noroles><span class="text-gray-400">—</span></ng-template>
          </td>
        </ng-container>

        <!-- Acciones -->
        <ng-container matColumnDef="acciones">
          <th mat-header-cell *matHeaderCellDef class="th center"></th>
          <td mat-cell *matCellDef="let r" class="td center">
            <button mat-icon-button (click)="openEdit(r)" matTooltip="Editar">
              <mat-icon>edit</mat-icon>
            </button>
          </td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="displayedColumns" class="header-row"></tr>
        <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
      </table>
    </div>
  </section>
  `,
  styles: [`
    .card { background: white; border: 1px solid #e5e7eb; border-radius: 12px; }
    .th { text-align: left; font-weight: 600; font-size: 12px; color: #64748b; padding: 10px 12px; border-bottom: 1px solid #e5e7eb; }
    .td { padding: 12px; border-bottom: 1px solid #f1f5f9; }
    .center { text-align: center; }
    .btn-primary { background: #06b6d4; color: white; }
    .btn-primary:hover { background: #0891b2; }
    .dark .card { background: #111827; border-color: #374151; }
    .dark .th { color: #e5e7eb; border-bottom-color: #374151; }
    .dark .td { color: #e5e7eb; border-bottom-color: #374151; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UsersPage {
  private svc = inject(UsersService);
  private dialog = inject(MatDialog);

  q = new FormControl('', { nonNullable: true });
  loading = signal(false);
  data = signal<UserItem[]>([]);

  displayedColumns = ['email','name','sucursal','roles','acciones'] as const;
  rows = computed(() => this.data());

  constructor() {
    this.q.valueChanges.pipe(
      startWith(''),
      debounceTime(250),
      distinctUntilChanged(),
      tap(() => this.loading.set(true)),
      switchMap(txt => {
        const t = (txt ?? '').trim();
        const search = (this.svc as any).search;
        return typeof search === 'function' ? search(t) : this.svc.list();
      }),
      takeUntilDestroyed()
    ).subscribe({
      next: res => { this.data.set(Array.isArray(res) ? res : []); this.loading.set(false); },
      error: (_: any) => { this.data.set([]); this.loading.set(false); },
    });
  }

  async openCreate() {
    const { UserDialogComponent } = await import('./user-dialog.component');
    //import { UserDialogComponent } from './user-dialog.component';
    this.dialog.open(UserDialogComponent, { data: null, width: '640px' })
      .afterClosed().subscribe(ok => { if (ok) this.refresh(); });
  }

  async openEdit(r: UserItem) {
    const { UserDialogComponent } = await import('./user-dialog.component');
    this.dialog.open(UserDialogComponent, { data: r, width: '640px' })
      .afterClosed().subscribe(ok => { if (ok) this.refresh(); });
  }

  private refresh() {
    const t = (this.q.value ?? '').trim();
    const search = (this.svc as any).search;
    const source$ = typeof search === 'function' ? search(t) : this.svc.list();
    this.loading.set(true);
    source$.subscribe({
      next: (res: UserItem[] | null | undefined) => { this.data.set(res ?? []); this.loading.set(false); },
      error: (_: any) => { this.data.set([]); this.loading.set(false); },
    });
  }
}

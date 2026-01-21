import { Component, OnInit, inject, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsuariosService, UserItem, CreateUserRequest, UpdateUserRequest } from '../../core/usuarios.service';
import { BranchesService, Branch } from '../../core/branches.service';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
  <div class="p-4 md:p-6 space-y-6 bg-gray-50 min-h-screen">
    <!-- Header -->
    <div class="bg-white rounded-xl shadow-sm p-4 md:p-6 border border-gray-100">
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 class="text-2xl md:text-3xl font-bold text-gray-800">Gestión de Usuarios</h1>
          <p class="text-gray-600 mt-1">Administra los usuarios y sus permisos del sistema</p>
        </div>
        <button 
          (click)="openForm()" 
          class="bg-[#06b6d4] text-white px-5 py-3 rounded-xl hover:bg-[#0891b2] transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-2 font-medium"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
          </svg>
          Nuevo Usuario
        </button>
      </div>

      <!-- Search and Filters -->
      <div class="mt-6 flex flex-col md:flex-row gap-4">
        <div class="flex-1 relative">
          <svg class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
          <input 
            [(ngModel)]="searchTerm"
            (keyup.enter)="loadUsers()"
            placeholder="Buscar por nombre o email..."
            class="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#06b6d4] focus:border-transparent bg-white transition-all duration-200"
          />
        </div>
        <button 
          (click)="loadUsers()" 
          class="bg-white border border-gray-200 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium flex items-center gap-2 shadow-sm"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
          Buscar
        </button>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div class="flex items-center gap-3">
          <div class="p-3 rounded-lg bg-blue-50">
            <svg class="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"></path>
            </svg>
          </div>
          <div>
            <p class="text-sm text-gray-600">Total Usuarios</p>
            <p class="text-2xl font-bold text-gray-800">{{ total() }}</p>
          </div>
        </div>
      </div>
      
      <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div class="flex items-center gap-3">
          <div class="p-3 rounded-lg bg-green-50">
            <svg class="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
            </svg>
          </div>
          <div>
            <p class="text-sm text-gray-600">Usuarios Activos</p>
            <p class="text-2xl font-bold text-gray-800">{{ activeUsers() }}</p>
          </div>
        </div>
      </div>
      
      <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div class="flex items-center gap-3">
          <div class="p-3 rounded-lg bg-amber-50">
            <svg class="w-6 h-6 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
            </svg>
          </div>
          <div>
            <p class="text-sm text-gray-600">Bloqueados</p>
            <p class="text-2xl font-bold text-gray-800">{{ blockedUsers() }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Table Card -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full text-sm">
          <thead class="bg-gray-50 border-b border-gray-200">
            <tr>
              <th class="px-4 py-4 text-left font-semibold text-gray-700">Usuario</th>
              <th class="px-4 py-4 text-left font-semibold text-gray-700">Email</th>
              <th class="px-4 py-4 text-left font-semibold text-gray-700">Sucursal</th>
              <th class="px-4 py-4 text-left font-semibold text-gray-700">Roles</th>
              <th class="px-4 py-4 text-center font-semibold text-gray-700">Estado</th>
              <th class="px-4 py-4 text-right font-semibold text-gray-700">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr *ngFor="let u of users()" class="hover:bg-gray-50 transition-colors duration-150">
              <td class="px-4 py-4">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 bg-gradient-to-r from-[#06b6d4] to-[#0ea5e9] rounded-full flex items-center justify-center text-white font-medium">
                    {{ u.fullName.charAt(0) }}
                  </div>
                  <span class="font-medium text-gray-800">{{ u.fullName }}</span>
                </div>
              </td>
              <td class="px-4 py-4 text-gray-600">{{ u.email }}</td>
              <td class="px-4 py-4">
                <span class="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-medium">
                  {{ u.sucursalNombre }}
                </span>
              </td>
              <td class="px-4 py-4">
                <div class="flex flex-wrap gap-1">
                  <span *ngFor="let role of u.roles" 
                        class="bg-blue-50 text-blue-700 px-2 py-1 rounded-md text-xs font-medium">
                    {{ role }}
                  </span>
                </div>
              </td>
              <td class="px-4 py-4 text-center">
                <span [class]="u.lockedOut ? 
                  'bg-red-100 text-red-800 px-3 py-1 rounded-full text-xs font-medium' : 
                  'bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium'">
                  {{ u.lockedOut ? 'Bloqueado' : 'Activo' }}
                </span>
              </td>
              <td class="px-4 py-4 text-right">
                <div class="flex justify-end gap-2">
                  <button 
                    (click)="openForm(u)" 
                    class="p-2 text-gray-500 hover:text-[#06b6d4] hover:bg-blue-50 rounded-lg transition-all duration-200"
                    title="Editar usuario"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                    </svg>
                  </button>
                  <button 
                    (click)="resetPassword(u)" 
                    class="p-2 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all duration-200"
                    title="Reiniciar contraseña"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"></path>
                    </svg>
                  </button>
                  <button 
                    (click)="toggleLock(u)" 
                    [class]="u.lockedOut ? 
                      'p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all duration-200' : 
                      'p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200'"
                    [title]="u.lockedOut ? 'Desbloquear usuario' : 'Bloquear usuario'"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path *ngIf="!u.lockedOut" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                      <path *ngIf="u.lockedOut" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"></path>
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="px-4 py-4 border-t border-gray-200 bg-gray-50">
        <div class="flex flex-col md:flex-row justify-between items-center gap-4">
          <p class="text-sm text-gray-600">
            {{ rangeLabel() }}
          </p>
          <div class="flex gap-2">
            <button 
              (click)="prevPage()" 
              [disabled]="page()===1"
              class="px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 disabled:opacity-40 transition-all duration-200 flex items-center gap-2 font-medium"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
              </svg>
              Anterior
            </button>
            <button 
              (click)="nextPage()" 
              [disabled]="page() * pageSize() >= total()"
              class="px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 disabled:opacity-40 transition-all duration-200 flex items-center gap-2 font-medium"
            >
              Siguiente
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal -->
    <div 
      *ngIf="showForm()" 
      class="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50 p-4 transition-all duration-300"
      [class.opacity-0]="!showForm()"
      [class.opacity-100]="showForm()"
    >
      <div 
        class="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all duration-300 max-h-[90vh] overflow-y-auto"
        [class.scale-95]="!showForm()"
        [class.scale-100]="showForm()"
        (click)="$event.stopPropagation()"
      >
        <div class="p-6 border-b border-gray-200">
          <div class="flex justify-between items-center">
            <h2 class="text-xl font-bold text-gray-800 flex items-center gap-2">
              <svg class="w-6 h-6 text-[#06b6d4]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
              </svg>
              {{ editingUser()?.id ? 'Editar Usuario' : 'Crear Nuevo Usuario' }}
            </h2>
            <button 
              (click)="closeForm()" 
              class="text-gray-400 hover:text-gray-600 transition-colors duration-200 p-1 rounded-lg hover:bg-gray-100"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        </div>

        <form (ngSubmit)="saveUser()" class="p-6 space-y-5">
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">Nombre completo</label>
            <input 
              [(ngModel)]="form.fullName" 
              name="fullName" 
              required
              class="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#06b6d4] focus:border-transparent transition-all duration-200"
              placeholder="Ingresa el nombre completo"
            />
          </div>

          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">Email</label>
            <input 
              [(ngModel)]="form.email" 
              name="email" 
              type="email"
              [readonly]="!!editingUser()?.id"
              required
              class="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#06b6d4] focus:border-transparent transition-all duration-200 disabled:bg-gray-100 disabled:text-gray-500"
              placeholder="correo@ejemplo.com"
            />
          </div>

          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">Sucursal</label>
            <select 
              [(ngModel)]="form.sucursalId" 
              name="sucursalId" 
              required
              class="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#06b6d4] focus:border-transparent transition-all duration-200 bg-white"
            >
              <option value="" disabled selected>Selecciona una sucursal</option>
              <option *ngFor="let s of branches()" [value]="s.id">{{ s.nombre }}</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">Roles</label>
            <div class="grid grid-cols-2 gap-3">
              <label *ngFor="let r of roles()" class="flex items-center space-x-3 p-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all duration-200 cursor-pointer">
                <input 
                  type="checkbox" 
                  [value]="r" 
                  (change)="toggleRole(r, $event)" 
                  [checked]="form.roles.includes(r)"
                  class="rounded text-[#06b6d4] focus:ring-[#06b6d4] border-gray-300"
                />
                <span class="text-gray-700 font-medium">{{ r }}</span>
              </label>
            </div>
          </div>

          <div *ngIf="!editingUser()?.id">
            <label class="block text-sm font-semibold text-gray-700 mb-2">Contraseña</label>
            <input 
              [(ngModel)]="form.password" 
              name="password" 
              type="password" 
              required
              class="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#06b6d4] focus:border-transparent transition-all duration-200"
              placeholder="Ingresa una contraseña segura"
            />
          </div>

          <div class="flex justify-end gap-3 pt-4">
            <button 
              type="button" 
              (click)="closeForm()" 
              class="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 transition-all duration-200 font-medium"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              class="px-5 py-2.5 rounded-xl bg-[#06b6d4] text-white hover:bg-[#0891b2] transition-all duration-200 font-medium shadow-md hover:shadow-lg"
            >
              {{ editingUser()?.id ? 'Actualizar' : 'Crear Usuario' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
  `
})
export class UsersComponent implements OnInit {
  private usersService = inject(UsuariosService);
  private branchesService = inject(BranchesService);

  users = signal<UserItem[]>([]);
  roles = signal<string[]>([]);
  branches = signal<Branch[]>([]);
  total = signal(0);
  page = signal(1);
  pageSize = signal(10);
  searchTerm = '';
  showForm = signal(false);
  editingUser = signal<UserItem | null>(null);

  form = {
    email: '',
    fullName: '',
    sucursalId: '',
    password: '',
    roles: [] as string[],
  };

  // Señales para estadísticas
  activeUsers = signal(0);
  blockedUsers = signal(0);

  @HostListener('document:keydown.escape')
  onEscape() {
    this.closeForm();
  }

  ngOnInit() {
    this.loadUsers();
    this.loadRoles();
    this.loadBranches();
  }

  loadUsers() {
    this.usersService.getAll(this.searchTerm, this.page(), this.pageSize()).subscribe({
      next: res => {
        this.users.set(res.items);
        this.total.set(res.total);
        
        // Calcular estadísticas
        const active = res.items.filter(u => !u.lockedOut).length;
        const blocked = res.items.filter(u => u.lockedOut).length;
        this.activeUsers.set(active);
        this.blockedUsers.set(blocked);
      }
    });
  }

  loadRoles() {
    this.usersService.getRoles().subscribe(r => this.roles.set(r));
  }

  loadBranches() {
    this.branchesService.list().subscribe(b => this.branches.set(b));
  }

  rangeLabel() {
    const start = this.page() * this.pageSize() - this.pageSize() + 1;
    const end = Math.min(this.page() * this.pageSize(), this.total());
    return `Mostrando ${start}–${end} de ${this.total()} usuarios`;
  }

  prevPage() {
    if (this.page() > 1) {
      this.page.update(p => p - 1);
      this.loadUsers();
    }
  }

  nextPage() {
    if (this.page() * this.pageSize() < this.total()) {
      this.page.update(p => p + 1);
      this.loadUsers();
    }
  }

  openForm(user?: UserItem) {
    this.showForm.set(true);
    if (user) {
      this.editingUser.set(user);
      this.form = {
        email: user.email,
        fullName: user.fullName,
        sucursalId: user.sucursalId,
        password: '',
        roles: [...user.roles],
      };
    } else {
      this.editingUser.set(null);
      this.form = { email: '', fullName: '', sucursalId: '', password: '', roles: [] };
    }
  }

  closeForm() {
    this.showForm.set(false);
  }

  toggleRole(role: string, ev: Event) {
    const checked = (ev.target as HTMLInputElement).checked;
    if (checked) this.form.roles.push(role);
    else this.form.roles = this.form.roles.filter(r => r !== role);
  }

  saveUser() {
    if (this.editingUser()?.id) {
      const data: UpdateUserRequest = {
        fullName: this.form.fullName,
        sucursalId: this.form.sucursalId,
        roles: this.form.roles,
      };
      this.usersService.update(this.editingUser()!.id, data).subscribe(() => {
        this.loadUsers();
        this.closeForm();
      });
    } else {
      const data: CreateUserRequest = {
        email: this.form.email,
        fullName: this.form.fullName,
        sucursalId: this.form.sucursalId,
        password: this.form.password,
        roles: this.form.roles,
      };
      this.usersService.create(data).subscribe(() => {
        this.loadUsers();
        this.closeForm();
      });
    }
  }

  resetPassword(u: UserItem) {
    const newPass = prompt(`Nueva contraseña para ${u.email}:`);
    if (!newPass) return;
    this.usersService.resetPassword(u.id, newPass).subscribe(() => alert('Contraseña actualizada'));
  }

  toggleLock(u: UserItem) {
    const lock = !u.lockedOut;
    this.usersService.lock(u.id, lock).subscribe(() => this.loadUsers());
  }
}
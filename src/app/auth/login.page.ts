import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';

@Component({
  standalone: true,
  selector: 'app-login-page',
  imports: [CommonModule, ReactiveFormsModule],
  template: `
  <div class="relative min-h-screen flex items-center justify-center p-4 bg-no-repeat bg-cover bg-center"
       [style.background-image]="'url(' + bgUrl + ')'">
    
    <!-- Overlay -->
    <div class="absolute inset-0 bg-black/20"></div>

    <div class="relative w-full max-w-md bg-white/95 backdrop-blur rounded-2xl shadow-xl p-6">
      <!-- Logo -->
      <div class="mb-5 flex justify-center">
        <img [src]="logoUrl" alt="Opticsoft" class="w-20 h-20 object-contain select-none" />
      </div>

      <!-- Encabezado -->
      <div class="mb-6 text-center">
        <div class="text-2xl font-semibold text-gray-900 tracking-tight">Opticsoft</div>
        <div class="text-sm text-gray-500">Sistema de administración <strong>Opticsoft.Admin</strong></div>
      </div>

      <!-- Formulario -->
      <form [formGroup]="form" class="space-y-4" (ngSubmit)="submit()">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Correo electrónico</label>
          <input type="email" formControlName="email"
                 class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#06b6d4]" />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
          <input type="password" formControlName="password"
                 class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#06b6d4]" />
        </div>

        <div class="flex items-center justify-between text-sm">
          <a class="text-[#06b6d4] hover:underline cursor-pointer" (click)="goForgot()">¿Olvidaste tu contraseña?</a>
        </div>

        <button type="submit"
                [disabled]="form.invalid || loading()"
                class="w-full rounded-lg bg-[#06b6d4] text-white py-2 font-medium hover:opacity-90 disabled:opacity-50 transition">
          {{ loading() ? 'Entrando…' : 'Iniciar sesión' }}
        </button>

        <p *ngIf="error()" class="text-center text-sm text-red-600 mt-2">{{ error() }}</p>
      </form>

      <!-- Footer -->
      <div class="text-center text-xs text-gray-500 mt-6">
        © {{year}} Opticsoft.Admin — Panel de gestión multitenant
      </div>
    </div>
  </div>
  `
})
export class LoginPage {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private router = inject(Router);

  logoUrl = 'assets/img/logo.webp';
  bgUrl = 'assets/img/fondo.webp';

  loading = signal(false);
  error = signal<string | null>(null);
  year = new Date().getFullYear();

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  submit() {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set(null);
    const { email, password } = this.form.value as any;

    this.auth.login(email, password).subscribe({
      next: (res) => this.handleLoginSuccess(res),
      error: () => this.handleLoginError()
    });
  }

  private handleLoginSuccess(res: any): void {
    this.auth.persist(res);
    this.loading.set(false);
    const roles = this.auth.user()?.roles || [];
    console.log('Roles del usuario:', roles);
    this.navigateByRole(roles);
  }

  private handleLoginError(): void {
    this.error.set('Credenciales inválidas. Verifica tu correo y contraseña.');
    this.loading.set(false);
  }

  private navigateByRole(roles: string[]): void {
    const navigation = {
      mensajero: '/ordenes',
      admin: '/dashboard',
      encargado: '/dashboard',
      default: '/clinica/historia'
    };
    
    if (roles.includes('Admin')) {
      this.router.navigate([navigation.admin]);
      return;
    }
    this.router.navigate([navigation.default]);
  }

  goForgot() { this.router.navigateByUrl('/forgot-password'); }
}

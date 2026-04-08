import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

@Component({
  standalone: true,
  selector: 'app-forgot-password',
  imports: [CommonModule, ReactiveFormsModule],
  template: `
  <div class="relative min-h-screen flex items-center justify-center p-4 bg-no-repeat bg-cover bg-center"
       [style.background-image]="'url(' + bgUrl + ')'">
    <div class="absolute inset-0 bg-black/10"></div>

    <div class="relative w-full max-w-md bg-white/95 backdrop-blur rounded-2xl shadow-md p-6">
      <div class="absolute left-3 top-3 flex gap-2">
        <button type="button" (click)="goLogin()" class="p-2 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#06b6d4]">
          <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h20"/>
          </svg>
        </button>
        <!-- <button type="button" (click)="goLogin()" class="p-2 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#06b6d4]">
          <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button> -->
      </div>

      <div class="mb-4 flex justify-center">
        <img [src]="logoUrl" alt="Óptica" class="w-20 h-20 object-contain select-none" />
      </div>

      <div class="mb-6 text-center">
        <div class="text-xl font-semibold text-gray-900">Recuperar contraseña</div>
        <div class="text-sm text-gray-500">Ingresa tu correo registrado</div>
      </div>

      <form [formGroup]="form" class="space-y-4" (ngSubmit)="submit()">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Correo</label>
          <input type="email" formControlName="email"
                 class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#06b6d4]" />
        </div>

        <button type="submit"
                [disabled]="form.invalid || loading()"
                class="w-full rounded-lg bg-[#06b6d4] text-white py-2 font-medium hover:opacity-90 disabled:opacity-50 transition">
          {{ loading() ? 'Enviando…' : 'Enviar enlace' }}
        </button>

        <p *ngIf="ok()" class="text-center text-sm text-green-600">Si el correo existe, te enviamos un enlace.</p>
        <p *ngIf="error()" class="text-center text-sm text-red-600">{{ error() }}</p>
      </form>
    </div>
  </div>
  `
})
export class ForgotPasswordPage {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private router = inject(Router);

  logoUrl = 'assets/img/logo.webp';
  bgUrl = 'assets/img/fondo.webp';

  loading = signal(false);
  ok = signal(false);
  error = signal<string | null>(null);

  form = this.fb.group({ email: ['', [Validators.required, Validators.email]] });

  submit() {
    if (this.form.invalid) return;
    this.loading.set(true); this.ok.set(false); this.error.set(null);
    this.http.post(`${environment.apiBaseUrl}/password/forgot`, this.form.value).subscribe({
      next: () => this.ok.set(true),
      error: () => this.error.set('No se pudo procesar la solicitud.'),
      complete: () => this.loading.set(false)
    });
  }

  goLogin(){ this.router.navigateByUrl('/login'); }
}

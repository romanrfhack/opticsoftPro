import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';

@Component({
  standalone: true,
  selector: 'app-login-page',
  imports: [CommonModule, ReactiveFormsModule],
  template: `
  <div class="relative min-h-screen flex items-center justify-center overflow-hidden
              bg-cover bg-center"
       [style.background-image]="'url(' + bgUrl + ')'">

    <!-- Overlay -->
    <div class="absolute inset-0 bg-[rgb(0_0_0_/_0.45)] backdrop-blur-[3px]"></div>

    <!-- Contenedor del formulario -->
    <div class="relative z-10 w-[90%] sm:w-[420px] 
                bg-[rgb(255_255_255_/_0.1)] backdrop-blur-2xl
                border border-[rgb(255_255_255_/_0.2)]
                rounded-[1.5rem] shadow-[0_8px_40px_rgb(0_0_0_/_0.25)]
                p-[2rem] animate-fade-up
                hover:shadow-[0_10px_45px_rgb(6_182_212_/_0.35)] 
                transition-all duration-500 ease-out">

      <!-- Logo -->      
      <div class="flex justify-center mb-[1.5rem] animate-fade-in">
        <img
          [src]="logoUrl"
          alt="Logo Opticsoft"
          class="w-[11rem] h-auto sm:w-[13rem] md:w-[15rem]
                object-contain drop-shadow-[0_6px_12px_rgba(6,182,212,0.35)]
                select-none transition-transform duration-500 hover:scale-105"
        />
      </div>


      <!-- Encabezado -->       
      <div class="text-center mb-[1.5rem] animate-fade-in space-y-[1rem]">
        <h1
          class="text-glow font-semibold tracking-tight leading-[1.4]
                text-[1.75rem] sm:text-[2rem] md:text-[2.25rem]">
          Bienvenido
        </h1>
        <p
          class="text-[0.95rem] sm:text-[1rem] text-[rgb(229_231_235)] opacity-90"
          style="animation: fadeInUpBlur 1.3s ease-out both;">
          Ingresa tus credenciales para continuar
        </p>
      </div>

    




      <!-- Formulario -->
      <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-[1.25rem]">
        
        <!-- Campo correo -->
        <div class="relative">
          <span class="material-icons absolute left-[0.75rem] top-1/2 -translate-y-1/2 
                        text-[rgb(148_163_184)] text-[1.2rem] select-none">mail</span>
          <input type="email" formControlName="email" placeholder="Correo electrónico"
                 class="w-full rounded-[0.75rem] border border-[rgb(255_255_255_/_0.25)]
                        bg-[rgb(255_255_255_/_0.1)] text-[rgb(243_244_246)]
                        pl-[2.5rem] pr-[1rem] py-[0.7rem]
                        placeholder:text-[rgb(156_163_175)]
                        focus:outline-none focus:ring-[2px] focus:ring-[rgb(6_182_212)]
                        transition-all duration-200" />
        </div>

        <!-- Campo contraseña -->
        <div class="relative">
          <span class="material-icons absolute left-[0.75rem] top-1/2 -translate-y-1/2 
                        text-[rgb(148_163_184)] text-[1.2rem] select-none">lock</span>
          <input type="password" formControlName="password" placeholder="Contraseña"
                 class="w-full rounded-[0.75rem] border border-[rgb(255_255_255_/_0.25)]
                        bg-[rgb(255_255_255_/_0.1)] text-[rgb(243_244_246)]
                        pl-[2.5rem] pr-[1rem] py-[0.7rem]
                        placeholder:text-[rgb(156_163_175)]
                        focus:outline-none focus:ring-[2px] focus:ring-[rgb(6_182_212)]
                        transition-all duration-200" />
        </div>

        <!-- Enlace recuperación -->
        <div class="flex justify-end text-[0.85rem]">
          <a class="text-[rgb(6_182_212)] hover:underline cursor-pointer"
             (click)="goForgot()">¿Olvidó su contraseña?</a>
        </div>

        <!-- Botón -->
        <button type="submit"
                [disabled]="form.invalid || loading()"
                class="w-full py-[0.7rem] rounded-[0.75rem] 
                       text-white font-semibold tracking-wide
                       bg-gradient-to-r from-[rgb(37_99_235)] to-[rgb(6_182_212)]
                       shadow-[0_4px_20px_rgb(6_182_212_/_0.3)]
                       transition-all duration-300 ease-out
                       hover:shadow-[0_8px_25px_rgb(6_182_212_/_0.4)]
                       hover:-translate-y-[2px] disabled:opacity-50">
          {{ loading() ? 'Entrando…' : 'Iniciar sesión' }}
        </button>

        <!-- Error -->
        <p *ngIf="error()" 
           class="text-center text-[0.85rem] text-[rgb(252_165_165)] mt-[0.5rem]">
          {{ error() }}
        </p>
      </form>
    </div>
  </div>
  `,
  styles: [`
    @keyframes fade-up {
      0% { opacity: 0; transform: translateY(30px); }
      100% { opacity: 1; transform: translateY(0); }
    }
    .animate-fade-up {
      animation: fade-up 0.8s ease-out both;
    }
  `]
})
export class LoginPage {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  logoUrl = 'assets/img/logoShell.webp';
  bgUrl = 'assets/img/fondo.webp';

  loading = signal(false);
  error = signal<string | null>(null);

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
    this.navigateByRole(roles);
  }

  private handleLoginError(): void {
    this.error.set('Credenciales inválidas');
    this.loading.set(false);
  }

  private navigateByRole(roles: string[]): void {
    const routes = {
      mensajero: '/ordenes',
      admin: '/dashboard',
      encargado: '/dashboard',
      default: '/clinica/historia'
    };
    if (roles.includes('Mensajero')) {
          console.log('El usuario es un Mensajero');
          this.router.navigate([routes.mensajero]);
          return;
      }

      if (roles.includes('Admin') || roles.includes('Encargado')) {
          console.log('El usuario es Admin o Encargado');
          this.router.navigate([routes.admin]);
          return;
      }

      console.log('Navegando a ruta por defecto');
      this.router.navigate([routes.default]);
  }

  goForgot() { this.router.navigateByUrl('/forgot-password'); }
}     
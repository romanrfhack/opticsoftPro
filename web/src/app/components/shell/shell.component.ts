import { Component, computed, effect, inject, signal, viewChild } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet, Router } from '@angular/router';
import { NgIf, NgClass } from '@angular/common';
import { ViewChild } from '@angular/core';
import { MatSidenav } from '@angular/material/sidenav';

// Angular Material
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';

// Responsive (CDK)
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { AuthService } from '../../auth/auth.service';
import { BranchesService } from '../../core/branches.service';
import { CompactSucursalSwitcherComponent } from '../../shared/sucursal-switcher-component/compact-sucursal-switcher.component';


@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    RouterOutlet, RouterLink, RouterLinkActive, MatSidenav,
    MatSidenavModule, MatToolbarModule, MatIconModule, MatButtonModule, 
    MatListModule, MatDividerModule, MatMenuModule, MatTooltipModule,
    CompactSucursalSwitcherComponent,
    NgIf
  ],
  template: `
  <mat-sidenav-container class="h-screen bg-gray-50">
    <!-- SIDENAV -->
    <mat-sidenav #sidenav
      [mode]="isHandset() ? 'over' : 'side'"
      [opened]="opened()"
      [fixedInViewport]="isHandset()"
      [fixedTopGap]="64"
      class="w-72"
    >
      <div class="p-4">
        <div class="flex items-center gap-3">
          <img src="assets/img/logoShell.webp" alt="Opticsoft" class="h-8 w-auto max-w-[180px] object-contain select-none" />
        </div>
        <div class="text-xs text-gray-500 mt-2">Panel de administración</div>
      </div>

      <mat-divider></mat-divider>

      <nav class="p-2">
        <div *ngIf="isAdmin()"> 
          <a routerLink="/dashboard" routerLinkActive="bg-cyan-50 text-cyan-600"
          class="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-cyan-50 hover:text-cyan-600 transition">
          <mat-icon [style.color]="'#06b6d4'">dashboard</mat-icon><span>Dashboard</span>
          </a>                
        </div>
        <div *ngIf="!isMensajero()"> 
        <a routerLink="/clinica/historia" routerLinkActive="bg-cyan-50 text-cyan-600"
           class="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-cyan-50 hover:text-cyan-600 transition">                 
          <mat-icon [style.color]="'#06b6d4'">person_add</mat-icon><span>Nuevo cliente</span>
        </a>
        </div>
        <div *ngIf="isAdmin()||isEncargado()||isMensajero()">
          <a routerLink="/ordenes" routerLinkActive="bg-cyan-50 text-cyan-600"
            class="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-cyan-50 hover:text-cyan-600 transition">                 
            <mat-icon [style.color]="'#06b6d4'">assignment</mat-icon><span>Órdenes</span>
          </a>
        </div>
        <div *ngIf="!isMensajero()"> 
        <a routerLink="/inventario" routerLinkActive="bg-cyan-50 text-cyan-600"
           class="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-cyan-50 hover:text-cyan-600 transition">          
          <mat-icon [style.color]="'#06b6d4'">inventory_2</mat-icon><span>Inventario</span>
        </a>
        </div>
        <div *ngIf="!isMensajero()"> 
        <a routerLink="/clientes" routerLinkActive="bg-cyan-50 text-cyan-600"
           class="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-cyan-50 hover:text-cyan-600 transition">
          <mat-icon [style.color]="'#06b6d4'">groups</mat-icon><span>Clientes</span>
        </a>
        </div>
        <div *ngIf="isAdmin()">
        <a routerLink="/admin/usuarios" routerLinkActive="bg-cyan-50 text-cyan-600"
           class="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-cyan-50 hover:text-cyan-600 transition">
          <mat-icon [style.color]="'#06b6d4'">admin_panel_settings</mat-icon><span>Usuarios</span>
        </a>
        </div>
        
        <!-- <a routerLink="/historias" routerLinkActive="bg-cyan-50 text-cyan-600"
           class="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-cyan-50 hover:text-cyan-600 transition">
          <mat-icon [style.color]="'#06b6d4'">visibility</mat-icon><span>Historias</span>
        </a> -->
        <!-- <a routerLink="/ordenes" routerLinkActive="bg-cyan-50 text-cyan-600"
           class="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-cyan-50 hover:text-cyan-600 transition">
          <mat-icon [style.color]="'#06b6d4'">assignment</mat-icon><span>Órdenes</span>
        </a> -->
      </nav>
    </mat-sidenav>

    <!-- CONTENT -->
    <mat-sidenav-content class="flex flex-col">
      <!-- TOOLBAR sticky -->
      <mat-toolbar class="custom-toolbar sticky top-0 z-50 !bg-white border-b border-gray-200">
        <div class="toolbar-content">
          <!-- Menú para abrir sidenav en móvil -->
          <button mat-icon-button class="md:hidden" (click)="toggle()">
            <mat-icon>menu</mat-icon>
          </button>

          <!-- Logo -->
          <span class="ml-2 font-semibold hidden sm:inline">Opticsoft</span>

          <span class="flex-1"></span>

          <!-- Sucursal Switcher Compacto -->
          <app-compact-sucursal-switcher class="mx-2"></app-compact-sucursal-switcher>

          <!-- Separador -->
          <div class="hidden md:block w-px h-6 bg-gray-200 mx-2"></div>

          <!-- ===== AYUDA ===== -->
          <!-- Versión desktop (texto + icono) -->
          <button
            class="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-cyan-50 transition"
            [matMenuTriggerFor]="menuAyuda">
            <mat-icon class="!text-[#06b6d4]">help_outline</mat-icon>
            <span class="text-gray-700">Ayuda</span>
            <mat-icon>expand_more</mat-icon>
          </button>

          <!-- Versión móvil (solo icono) -->
          <button
            class="md:hidden p-2 rounded-lg hover:bg-cyan-50 transition"
            [matMenuTriggerFor]="menuAyuda"
            matTooltip="Ayuda" matTooltipPosition="below" aria-label="Ayuda">
            <mat-icon class="!text-[#06b6d4]">help_outline</mat-icon>
          </button>

          <mat-menu #menuAyuda="matMenu">
            <button mat-menu-item (click)="goDocs()">
              <mat-icon>menu_book</mat-icon>
              <span>Documentación</span>
            </button>
            <button mat-menu-item (click)="goSoporte()">
              <mat-icon>bug_report</mat-icon>
              <span>Reportar problema</span>
            </button>
          </mat-menu>

          <!-- separador fino -->
          <div class="hidden md:block w-px h-6 bg-gray-200 mx-2"></div>
              

          <!-- ===== USUARIO ===== -->
          <!-- Desktop: avatar + nombre + correo + caret -->
          <button
            class="hidden md:flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-cyan-50 transition"
            [matMenuTriggerFor]="menuUsuario">
            <div class="h-8 w-8 rounded-full bg-[#06b6d4] text-white grid place-items-center">
              <mat-icon class="!text-white">account_circle</mat-icon>
            </div>
            <div class="text-left leading-tight">
              <div class="text-sm font-medium text-gray-900">{{ authService.user()?.name ?? 'Usuario' }}</div>
              <div class="text-xs text-gray-500 truncate max-w-[180px]">{{ authService.user()?.email ?? '' }}</div>
            </div>
            <mat-icon>expand_more</mat-icon>
          </button>

          <!-- Móvil: solo icono -->
          <button
            class="md:hidden p-2 rounded-lg hover:bg-cyan-50 transition"
            [matMenuTriggerFor]="menuUsuario"
            matTooltip="Cuenta" matTooltipPosition="below" aria-label="Cuenta">
            <mat-icon class="!text-[#06b6d4]">account_circle</mat-icon>
          </button>

          <mat-menu #menuUsuario="matMenu">
            <button mat-menu-item (click)="goPerfil()">
              <mat-icon>person</mat-icon>
              <span>Perfil</span>
            </button>      
            <mat-divider></mat-divider>
            <button mat-menu-item (click)="logout()">
              <mat-icon>logout</mat-icon>
              <span>Salir</span>
            </button>
          </mat-menu>
        </div>
      </mat-toolbar>

      <!-- MAIN -->
      <main class="p-4 md:p-6 grow main-content">
        <div class="mx-auto w-full max-w-7xl">
          <router-outlet />
        </div>
      </main>
    </mat-sidenav-content>
  </mat-sidenav-container>
  `,
  styles: [`
    .custom-toolbar {
      min-height: 64px !important;
      height: auto !important;
      padding: 0 !important;
    }
    .custom-toolbar::before,
    .custom-toolbar::after,
    .custom-toolbar .mat-toolbar-row::before,
    .custom-toolbar .mat-toolbar-row::after {
      display: none !important;
      content: none !important;
    }
    .toolbar-content { 
      display: flex; 
      align-items: center; 
      width: 100%; 
      height: 64px; 
      padding: 0 16px; 
    }
    .main-content {
          min-height: 100dvh;
          flex: 1 1 auto;
          overflow: auto;
          padding: 16px 24px;
          background: url(/assets/img/fondo.webp) center / cover no-repeat fixed;
      }
  `]
})
export class ShellComponent {
  private bp = inject(BreakpointObserver);
  private router = inject(Router);

  opened = signal(true);
  isHandset = signal(false);
  isDarkMode = signal(false);
  //auth = inject(AuthService);
  branchesService = inject(BranchesService);
  authService = inject(AuthService);
  isAdmin = computed(() => !!this.authService.user()?.roles?.includes('Admin'));
  //Encargado de Sucursal
  isEncargado = computed(() => !!this.authService.user()?.roles?.includes('Encargado de Sucursal'));
  isMensajero = computed(() => !!this.authService.user()?.roles?.includes('Mensajero'));
  @ViewChild('sidenav') sidenav!: MatSidenav;

  theme = 'light';
  
  toggleTheme() {
    this.theme = this.theme === 'light' ? 'dark' : 'light';
  }
  
  goPerfil() { this.router.navigateByUrl('/perfil'); }
  goDocs()   { window.open('https://tus-docs-o-wiki', '_blank'); }
  goSoporte(){ this.router.navigateByUrl('/soporte'); }

  constructor() {
     this.bp.observe([Breakpoints.Handset]).subscribe(r => {
      this.isHandset.set(r.matches);    
      if (r.matches) {      
        this.opened.set(false);
      } else {      
        this.opened.set(true);
      }
    });
  }

  toggle() {
    this.opened.set(!this.opened());
  }

  logout() {
    this.authService.logout();
    location.href = '/login';
  }
    
}
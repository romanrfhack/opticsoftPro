import { Routes } from '@angular/router';
import { ShellComponent } from './components/shell/shell.component';
import { roleGuard } from './auth/role.guard';
import { authGuard } from './auth/auth.guard';
import { ForgotPasswordPage } from './auth/forgot-password.page';
import { ResetPasswordPage } from './auth/reset-password.page';

export const routes: Routes = [
  // 1) al entrar a '/', manda a /login
  { path: '', pathMatch: 'full', redirectTo: 'login' },

  // 2) login fuera del shell
  { path: 'login', loadComponent: () => import('./auth/login.page').then(m => m.LoginPage) },
  { path: 'forgot-password', component: ForgotPasswordPage },
  { path: 'reset-password', component: ResetPasswordPage }, // espera email y token por query params  

  // 3) app privada dentro del shell
  {
    path: '',
    component: ShellComponent,
    children: [
      // dentro del shell, si navegan a '', manda a dashboard
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },

      // ✅ Nueva ruta: módulo de TENANTS
      {
        path: 'admin/tenants',
        canMatch: [roleGuard(['Admin'])],
        loadComponent: () => import('./admin/tenants/tenants.page').then(m => m.TenantsPage)
      },

      { 
        path: 'admin/tenants/:id',
        canMatch: [roleGuard(['Admin'])],
        loadComponent: () => import('./admin/tenants/tenant-detail.page').then(m => m.TenantDetailPage)
      },

      // ya existente: usuarios
      {
        path: 'admin/usuarios',
        canMatch: [roleGuard(['Admin'])],
        loadComponent: () => import('./admin/users/users.component').then(m => m.UsersComponent)
      },

      // perfil personal
      {
        path: 'perfil',
        canActivate: [authGuard],
        loadComponent: () => import('./account/profile.page').then(m => m.ProfilePage)
      },

      {
        path: 'dashboard',
        canActivate: [authGuard],
        loadComponent: () => import('./admin/dashboard/admin-dashboard.page').then(m => m.AdminDashboardPage)
      },

      // fallback 404
      {
        path: '**',
        loadComponent: () => import('./features/not-found/not-found.page').then(m => m.NotFoundPage)
      }
    ]
  }
];

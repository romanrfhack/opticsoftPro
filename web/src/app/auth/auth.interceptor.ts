// auth.interceptor.ts
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { environment } from '../../environments/environment';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from './auth.service';


function getAccessToken(): string | null {
  try {
    const raw = localStorage.getItem('auth');    
    if (!raw) return null;
    const parsed = JSON.parse(raw);    
    return parsed?.accessToken ?? null;
  } catch { return null; }
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = getAccessToken();  
  
  if (!token) return next(req);

  let base: URL | null = null;
  try { base = new URL(environment.apiBaseUrl); } catch { /* no-op */ }

  const isAbsolute = /^https?:\/\//i.test(req.url);

  let shouldAttach = false;
  if (isAbsolute && base) {    
    const u = new URL(req.url);
    shouldAttach = (u.host === base.host && u.protocol === base.protocol &&
                    u.pathname.startsWith(base.pathname));
  } else {    
    shouldAttach = req.url.startsWith('/api');
  }

  if (shouldAttach && !req.headers.has('Authorization')) {    
    req = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Verificar si es error 401 y el token está expirado
      if (error.status === 401 && token && authService.isTokenExpired()) {
        return authService.handleTokenExpired().pipe(
          switchMap((newToken: string | null) => {
            if (newToken) {
              // Reintentar la request con el nuevo token
              const newReq = req.clone({
                setHeaders: { Authorization: `Bearer ${newToken}` }
              });
              return next(newReq);
            }
            // Si no se pudo renovar, redirigir al login
            authService.logout();
            return throwError(() => error);
          })
        );
      }
      return throwError(() => error);
    })
  );
};
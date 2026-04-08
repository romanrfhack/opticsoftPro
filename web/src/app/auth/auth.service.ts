// src/app/auth/auth.service.ts
import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { ReauthModalComponent } from './reauth-modal.component';
//import { ReauthModalComponent } from '../components/reauth-modal/reauth-modal.component';

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresInSeconds: number;
  user: { id: string; name: string; email: string; sucursalId: string; roles: string[] };
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private modalService = inject(NgbModal);
  private base = environment.apiBaseUrl;

  private _user = signal<TokenResponse['user'] | null>(null);
  private _token = signal<string | null>(null);
  private _refresh = signal<string | null>(null);
  private _exp = signal<number | null>(null);

  user = computed(() => this._user());
  accessToken = computed(() => this._token());

  // Para manejar re-autenticación
  private isReauthenticating = false;
  private reauthSubject = new BehaviorSubject<string | null>(null);

  constructor() {
    const raw = localStorage.getItem('auth');
    if (raw) {
      try {
        const parsed: TokenResponse = JSON.parse(raw);
        this._user.set(parsed.user);
        this._token.set(parsed.accessToken);
        this._refresh.set(parsed.refreshToken);
        this._exp.set(Math.floor(Date.now()/1000) + (parsed.expiresInSeconds ?? 0));
        this.startAutoRefresh();
      } catch {}
    }
  }

  isAuth() {
    const t = this._token();
    if (!t) return false;
    return true;
  }

  login(email: string, password: string) {
    return this.http.post<TokenResponse>(`${this.base}/auth/login`, { email, password });
  }
  
  persist(resp: TokenResponse) {
    localStorage.setItem('auth', JSON.stringify(resp));
    this._user.set(resp.user);
    this._token.set(resp.accessToken);
    this._refresh.set(resp.refreshToken);
    this._exp.set(Math.floor(Date.now()/1000) + resp.expiresInSeconds);
    localStorage.setItem('sucursal_id', resp.user.sucursalId);
    this.startAutoRefresh();
  }

  clear() {
    localStorage.removeItem('auth');
    this._user.set(null);
    this._token.set(null);
    this._refresh.set(null);
    this._exp.set(null);
  }

  refresh() {
    const rt = this._refresh();
    if (!rt) throw new Error('No refresh token');
    return this.http.post<TokenResponse>(`${this.base}/auth/refresh`, { refreshToken: rt });
  }

  logout() {
    const rt = this._refresh();
    this.clear();
    if (rt) this.http.post(`${this.base}/auth/logout`, { refreshToken: rt }).subscribe();
  }

  updateProfile(body: { fullName: string; phoneNumber?: string }) {
    return this.http.put(`${this.base}/auth/me`, { FullName: body.fullName, PhoneNumber: body.phoneNumber ?? null });
  }

  changePassword(changePasswordRequest: { currentPassword: string; newPassword: string }): Observable<any> {
  return this.http.post(`${this.base}/auth/change-password`, changePasswordRequest).pipe(
    catchError((error: HttpErrorResponse) => {
      // Re-lanzamos el error para que el componente lo maneje
      return throwError(() => error);
    })
  );
}

  syncUserName(newName: string) {
    const raw = localStorage.getItem('auth'); if (!raw) return;
    const s = JSON.parse(raw); s.user.name = newName; localStorage.setItem('auth', JSON.stringify(s));
    this._user.set({ ...this._user()!, name: newName });
  }

  switchBranch(targetSucursalId: string) {
    return this.http.post<TokenResponse>(`${this.base}/auth/switch-branch`, { targetSucursalId });
  }

  // Timer de auto-refresh ~30s antes de expirar
  private _timer: any = null;
  startAutoRefresh() {
    if (!this._exp()) return;
    const ms = Math.max(5000, this._exp()! * 1000 - Date.now() - 30_000);
    clearTimeout(this._timer);
    this._timer = setTimeout(() => {
      this.refresh().subscribe({
        next: r => { this.persist(r); this.startAutoRefresh(); },
        error: _ => { /* opcional: logout o reintento */ }
      });
    }, ms);
  }

  // NUEVO: Manejo de token expirado con modal
  handleTokenExpired(): Observable<string | null> {
    // Si ya estamos en proceso de re-autenticación, esperar
    if (this.isReauthenticating) {
      return this.reauthSubject.asObservable();
    }

    this.isReauthenticating = true;
    
    const modalRef = this.modalService.open(ReauthModalComponent, {
      backdrop: 'static',
      keyboard: false,
      centered: true
    });

    modalRef.result.then(
      (newToken: string) => {
        this.isReauthenticating = false;
        this.reauthSubject.next(newToken);
        // Limpiar el subject para próximas veces
        setTimeout(() => this.reauthSubject.next(null), 100);
      },
      () => {
        this.isReauthenticating = false;
        this.reauthSubject.next(null);
      }
    );

    return this.reauthSubject.asObservable();
  }

  // NUEVO: Validar PIN (puedes adaptar según tu backend)
  validatePin(pin: string): Observable<{ success: boolean; token?: string }> {
    // Opción 1: Usar el refresh token normal (más seguro)
    const rt = this._refresh();
    if (!rt) {
      return new Observable(subscriber => subscriber.next({ success: false }));
    }

    return this.http.post<{ success: boolean; accessToken?: string }>(
      `${this.base}/auth/refresh-with-pin`, 
      { 
        pin,
        refreshToken: rt 
      }
    ).pipe(
      tap((response: { success: boolean; accessToken?: string }) => {
        if (response.success && response.accessToken) {
          // Actualizar el token en el estado local
          this._token.set(response.accessToken);
          // También actualizar en localStorage
          const raw = localStorage.getItem('auth');
          if (raw) {
            const authData = JSON.parse(raw);
            authData.accessToken = response.accessToken;
            localStorage.setItem('auth', JSON.stringify(authData));
          }
        }
      })
    );

    // Opción 2: Si quieres algo más simple sin modificar backend:
    // return of({ success: pin === '1234', token: 'nuevo-token-simulado' });
  }

  // NUEVO: Verificar si token está expirado
  isTokenExpired(): boolean {
    const token = this._token();
    if (!token) return true;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp * 1000;
      return Date.now() >= exp;
    } catch {
      return true;
    }
  }
}
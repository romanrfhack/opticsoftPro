import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface UserItem {
  id: string; email: string; fullName: string; phoneNumber: string; sucursalId: string; sucursalNombre: string;
  roles: string[]; lockedOut: boolean;
}

@Injectable({ providedIn: 'root' })
export class UsersService {
  private http = inject(HttpClient);
  private base = environment.apiBaseUrl + '/users';

  list(query = '', page = 1, pageSize = 20) {
    const params = new URLSearchParams();
    if (query) params.set('query', query);
    params.set('page', String(page)); params.set('pageSize', String(pageSize));
    return this.http.get<{ total: number; items: UserItem[] }>(`${this.base}?${params.toString()}`);
  }

  roles() { return this.http.get<string[]>(`${this.base}/roles`); }

  create(body: { email: string; fullName: string; sucursalId: string; password: string; roles: string[] }) {
    return this.http.post<UserItem>(this.base, body);
  }

  update(id: string, body: { fullName: string; sucursalId: string; roles: string[] }) {
    return this.http.put<void>(`${this.base}/${id}`, body);
  }

  resetPassword(id: string, newPassword: string) {
    return this.http.post<void>(`${this.base}/${id}/reset-password`, { newPassword });
  }

  getUserById(id: string) {
    return this.http.get<UserItem>(`${this.base}/${id}`);
  }

  setLock(id: string, lock: boolean) {
    return this.http.post<void>(`${this.base}/${id}/lock`, { lock });
  }
}

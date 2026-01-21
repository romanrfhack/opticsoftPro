import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

export interface UserItem {
  id: string;
  email: string;
  fullName: string;
  phoneNumber?: string;
  sucursalId: string;
  sucursalNombre: string;
  roles: string[];
  lockedOut: boolean;
}

export interface CreateUserRequest {
  email: string;
  fullName: string;
  sucursalId: string;
  password: string;
  roles: string[];
}

export interface UpdateUserRequest {
  fullName: string;
  sucursalId: string;
  roles: string[];
}

@Injectable({ providedIn: 'root' })
export class UsuariosService {
  private baseUrl = `${environment.apiBaseUrl}/users`;

  constructor(private http: HttpClient) {}

  getAll(query = '', page = 1, pageSize = 20): Observable<{ total: number; items: UserItem[] }> {
    return this.http.get<{ total: number; items: UserItem[] }>(
      `${this.baseUrl}?query=${query}&page=${page}&pageSize=${pageSize}`
    );
  }

  getRoles(): Observable<string[]> {
    return this.http.get<string[]>(`${this.baseUrl}/roles`);
  }

  getById(id: string): Observable<UserItem> {
    return this.http.get<UserItem>(`${this.baseUrl}/${id}`);
  }

  create(data: CreateUserRequest): Observable<UserItem> {
    return this.http.post<UserItem>(this.baseUrl, data);
  }

  update(id: string, data: UpdateUserRequest): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${id}`, data);
  }

  resetPassword(id: string, newPassword: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/${id}/reset-password`, { newPassword });
  }

  lock(id: string, lock: boolean): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/${id}/lock`, { lock });
  }
}

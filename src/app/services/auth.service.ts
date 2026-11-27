import { Injectable, inject, signal, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { environment } from '../../environments/environment';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'client' | 'journalist' | 'admin';
}

interface AuthResponse {
  token: string;
  user: AuthUser;
}

export interface OAuthPayload {
  provider: 'google' | 'microsoft' | 'apple';
  idToken?: string;
  accessToken?: string;
  fallbackName?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);

  private getApiBase(): string {
    const raw = environment.apiUrl.trim().replace(/\/+$/, '');
    return /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  }

  private authUrl = `${this.getApiBase()}/auth`;
  currentUser = signal<AuthUser | null>(this.loadStoredUser());

  private loadStoredUser(): AuthUser | null {
    if (!isPlatformBrowser(this.platformId)) return null;
    try {
      const raw = localStorage.getItem('kilimo_user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  getToken(): string | null {
    if (!isPlatformBrowser(this.platformId)) return null;
    return localStorage.getItem('kilimo_token');
  }

  isLoggedIn(): boolean {
    return !!this.getToken() && !!this.currentUser();
  }

  login(email: string, password: string) {
    return this.http
      .post<AuthResponse>(`${this.authUrl}/login`, { email, password })
      .pipe(tap((res) => this.handleAuthSuccess(res)));
  }

  register(payload: { firstName: string; lastName: string; email: string; password: string }) {
    return this.http
      .post<AuthResponse>(`${this.authUrl}/register`, payload)
      .pipe(tap((res) => this.handleAuthSuccess(res)));
  }

  oauthLogin(payload: OAuthPayload) {
    return this.http
      .post<AuthResponse>(`${this.authUrl}/oauth`, payload)
      .pipe(tap((res) => this.handleAuthSuccess(res)));
  }

  private handleAuthSuccess(res: AuthResponse): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('kilimo_token', res.token);
      localStorage.setItem('kilimo_user', JSON.stringify(res.user));
    }
    this.currentUser.set(res.user);

    if (res.user.role === 'admin') {
      this.router.navigate(['/admin']);
    } else if (res.user.role === 'journalist') {
      this.router.navigate(['/post-news']);
    } else {
      this.router.navigate(['/purchase-coffee']);
    }
  }

  logout(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('kilimo_token');
      localStorage.removeItem('kilimo_user');
    }
    this.currentUser.set(null);
    this.router.navigate(['/']);
  }
}

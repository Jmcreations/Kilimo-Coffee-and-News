import { Injectable, PLATFORM_ID, inject, signal, computed } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { environment } from '../../environments/environment';

export type UserRole = 'admin' | 'journalist' | 'delivery';

export interface StaffUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
}

interface LoginResponse {
  token: string;
  user: StaffUser;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);

  private readonly TOKEN_KEY = 'kilimo_staff_token';
  private readonly USER_KEY = 'kilimo_staff_user';

  currentUser = signal<StaffUser | null>(this.loadStoredUser());
  isLoggedIn = computed(() => !!this.currentUser() && !!this.getToken());

  getApiBase(): string {
    const raw = environment.apiUrl.trim().replace(/\/+$/, '');
    return /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  }

  private loadStoredUser(): StaffUser | null {
    if (!isPlatformBrowser(this.platformId)) return null;
    try {
      const raw = localStorage.getItem(this.USER_KEY);
      return raw ? (JSON.parse(raw) as StaffUser) : null;
    } catch {
      return null;
    }
  }

  getToken(): string | null {
    if (!isPlatformBrowser(this.platformId)) return null;
    return localStorage.getItem(this.TOKEN_KEY);
  }

  login(email: string, password: string) {
    return this.http
      .post<LoginResponse>(`${this.getApiBase()}/auth/login`, { email, password })
      .pipe(
        tap((res) => {
          if (isPlatformBrowser(this.platformId)) {
            localStorage.setItem(this.TOKEN_KEY, res.token);
            localStorage.setItem(this.USER_KEY, JSON.stringify(res.user));
          }
          this.currentUser.set(res.user);
        })
      );
  }

  logout(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.USER_KEY);
    }
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  hasRole(...roles: UserRole[]): boolean {
    const user = this.currentUser();
    return !!user && roles.includes(user.role);
  }

  redirectByRole(role?: UserRole): void {
    const activeRole = role || this.currentUser()?.role;
    if (activeRole === 'admin') {
      this.router.navigate(['/admin']);
    } else if (activeRole === 'delivery') {
      this.router.navigate(['/delivery-orders']);
    } else if (activeRole === 'journalist') {
      this.router.navigate(['/post-news']);
    } else {
      this.router.navigate(['/']);
    }
  }
}

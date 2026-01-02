import { Inject, Injectable, PLATFORM_ID, computed, effect, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of, tap, throwError } from 'rxjs';

import { environment } from '../../config/environment';
import { AuthResponse, LoginPayload, RegisterPayload, User } from '../models/user.model';

type AuthState = 'idle' | 'loading' | 'authenticated' | 'error';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly baseUrl = `${environment.apiBaseUrl}/auth`;
  private readonly tokenKey = 'cc_token';
  private readonly profileKey = 'cc_profile';
  private readonly isBrowser: boolean;

  readonly currentUser = signal<User | null>(null);
  readonly authStatus = signal<AuthState>('idle');
  readonly lastError = signal<string | null>(null);
  readonly isLoggedIn = computed(() => Boolean(this.currentUser()));

  constructor(private readonly http: HttpClient, @Inject(PLATFORM_ID) platformId: object) {
    this.isBrowser = isPlatformBrowser(platformId);
    this.bootstrapSession();
    effect(() => {
      if (!this.isBrowser) {
        return;
      }

      const storage = this.storage;
      if (!storage) {
        return;
      }

      const user = this.currentUser();
      if (user) {
        storage.setItem(this.profileKey, JSON.stringify(user));
      } else {
        storage.removeItem(this.profileKey);
      }
    });
  }

  login(payload: LoginPayload) {
    this.authStatus.set('loading');
    this.lastError.set(null);

    return this.http.post<AuthResponse>(`${this.baseUrl}/login`, payload).pipe(
      tap(response => this.persistSession(response)),
      tap(() => this.authStatus.set('authenticated')),
      catchError(error => {
        this.authStatus.set('error');
        this.lastError.set(this.extractMessage(error));
        return throwError(() => error);
      })
    );
  }

  register(payload: RegisterPayload) {
    this.authStatus.set('loading');
    this.lastError.set(null);

    return this.http.post<AuthResponse>(`${this.baseUrl}/register`, payload).pipe(
      tap(response => this.persistSession(response)),
      tap(() => this.authStatus.set('authenticated')),
      catchError(error => {
        this.authStatus.set('error');
        this.lastError.set(this.extractMessage(error));
        return throwError(() => error);
      })
    );
  }

  fetchSession(): Observable<{ user: User } | null> {
    if (!this.token()) {
      return of<{ user: User } | null>(null);
    }

    return this.http.get<{ user: User }>(`${this.baseUrl}/session`).pipe(
      tap(({ user }) => {
        this.currentUser.set(user);
        this.authStatus.set('authenticated');
      }),
      map(response => response as { user: User } | null),
      catchError(error => {
        this.clearSession();
        return of<{ user: User } | null>(null);
      })
    );
  }

  logout(): void {
    this.clearSession();
    this.authStatus.set('idle');
  }

  token(): string | null {
    return this.storage?.getItem(this.tokenKey) ?? null;
  }

  private persistSession(response: AuthResponse): void {
    this.storage?.setItem(this.tokenKey, response.token);
    this.currentUser.set(response.user);
  }

  private bootstrapSession(): void {
    const storage = this.storage;
    if (!storage) {
      return;
    }

    const cached = storage.getItem(this.profileKey);
    if (cached) {
      try {
        this.currentUser.set(JSON.parse(cached));
      } catch (error) {
        storage.removeItem(this.profileKey);
      }
    }

    if (this.token()) {
      this.fetchSession().subscribe({
        error: () => this.clearSession()
      });
    }
  }

  private clearSession(): void {
    const storage = this.storage;
    if (!storage) {
      return;
    }

    storage.removeItem(this.tokenKey);
    storage.removeItem(this.profileKey);
    this.currentUser.set(null);
  }

  private extractMessage(error: unknown): string {
    if (typeof error === 'object' && error && 'error' in error) {
      const payload = (error as { error?: Record<string, unknown> }).error;
      if (payload && typeof payload === 'object' && 'message' in payload) {
        return String(payload['message']);
      }
    }
    return 'Something went wrong. Please try again.';
  }

  private get storage(): Storage | null {
    if (!this.isBrowser || typeof window === 'undefined') {
      return null;
    }
    return window.localStorage;
  }
}

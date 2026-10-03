import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User, AuthResponse, UserLoginRequest, UserRegisterRequest, UserUpdateRequest } from '../models/user.model';
import { NotificationService } from './notification.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private notification = inject(NotificationService);

  private readonly TOKEN_KEY = 'smartmart_access_token';
  private readonly USER_KEY = 'smartmart_user';

  // State Signals
  currentUser = signal<User | null>(this.getStoredUser());
  token = signal<string | null>(this.getStoredToken());

  // Computed Selectors
  isLoggedIn = computed(() => !!this.currentUser());
  isAdmin = computed(() => this.currentUser()?.role === 'ADMIN');
  isCustomer = computed(() => this.currentUser()?.role === 'CUSTOMER');

  constructor() {
    // If token exists, refresh user profile from backend
    if (this.token()) {
      this.refreshProfile().subscribe({
        error: () => this.clearSession()
      });
    }
  }

  private getStoredToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  private getStoredUser(): User | null {
    const raw = localStorage.getItem(this.USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  }

  login(credentials: UserLoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/login`, credentials).pipe(
      tap((res) => {
        this.setSession(res.access_token, res.user);
        this.notification.success(`Welcome back, ${res.user.full_name}!`);
      })
    );
  }

  register(data: UserRegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/register`, data).pipe(
      tap((res) => {
        this.setSession(res.access_token, res.user);
        this.notification.success(`Account created successfully! Welcome to SmartMart.`);
      })
    );
  }

  refreshProfile(): Observable<User> {
    return this.http.get<User>(`${environment.apiUrl}/auth/me`).pipe(
      tap((user) => {
        this.currentUser.set(user);
        localStorage.setItem(this.USER_KEY, JSON.stringify(user));
      })
    );
  }

  updateProfile(updateData: UserUpdateRequest): Observable<User> {
    return this.http.put<User>(`${environment.apiUrl}/auth/profile`, updateData).pipe(
      tap((user) => {
        this.currentUser.set(user);
        localStorage.setItem(this.USER_KEY, JSON.stringify(user));
        this.notification.success('Profile updated successfully');
      })
    );
  }

  logout() {
    this.clearSession();
    this.notification.info('You have been logged out');
    this.router.navigate(['/login']);
  }

  private setSession(token: string, user: User) {
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    this.token.set(token);
    this.currentUser.set(user);
  }

  private clearSession() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.token.set(null);
    this.currentUser.set(null);
  }
}

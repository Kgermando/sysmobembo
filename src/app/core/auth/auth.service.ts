import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, of, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ToastrService } from 'ngx-toastr';

export interface User {
  uuid: string;
  fullname: string;
  email: string;
  telephone: string;
  role: string;
  permission: string;
  status: boolean;
  signature?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface LoginRequest {
  identifier: string; // Email ou téléphone
  password: string;
}

export interface RegisterRequest {
  fullname: string;
  email: string;
  telephone: string;
  password: string;
  password_confirm: string;
  role: string;
  permission: string;
  status?: boolean;
  signature?: string;
}

export interface AuthResponse {
  message: string;
  data: string; // JWT token
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private baseUrl = environment.apiUrl;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private tokenKey = 'auth_token';
  private userKey = 'current_user';

  constructor(
    private http: HttpClient,
    private toastr: ToastrService
  ) {
    this.loadStoredUser();
  }

  /**
   * Connexion utilisateur
   */
  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/auth/login`, credentials)
      .pipe(
        tap(response => {
          if (response.data) {
            this.storeToken(response.data);
            this.getUserInfo().subscribe();
          }
        }),
        catchError(error => {
          this.toastr.error(error.error?.message || 'Erreur de connexion');
          throw error;
        })
      );
  }

  /**
   * Inscription utilisateur
   */
  register(userData: RegisterRequest): Observable<any> {
    return this.http.post(`${this.baseUrl}/auth/register`, userData)
      .pipe(
        catchError(error => {
          this.toastr.error(error.error?.message || 'Erreur lors de l\'inscription');
          throw error;
        })
      );
  }

  /**
   * Récupération des informations utilisateur
   */
  getUserInfo(): Observable<User | null> {
    const token = this.getToken();
    if (!token) {
      return of(null);
    }

    const params = new HttpParams().set('token', token);
    return this.http.get<User>(`${this.baseUrl}/auth/employe`, { params })
      .pipe(
        tap(user => {
          this.currentUserSubject.next(user);
          this.storeUser(user);
        }),
        catchError(error => {
          this.clearStorage();
          this.currentUserSubject.next(null);
          throw error;
        })
      );
  }

  /**
   * Mise à jour du profil utilisateur
   */
  updateProfile(userData: Partial<User>): Observable<any> {
    const token = this.getToken();
    if (!token) {
      return of(null);
    }
    const params = new HttpParams().set('token', token);
    
    return this.http.put(`${this.baseUrl}/auth/profil/info`, userData, { params })
      .pipe(
        tap(response => {
          this.getUserInfo().subscribe();
          this.toastr.success('Profil mis à jour avec succès');
        }),
        catchError(error => {
          this.toastr.error(error.error?.message || 'Erreur lors de la mise à jour');
          throw error;
        })
      );
  }

  /**
   * Changement de mot de passe
   */
  changePassword(passwordData: { currentPassword: string; newPassword: string; confirmPassword: string }): Observable<any> {
    const token = this.getToken();
    if (!token) {
      return throwError(() => new Error('Token d\'authentification manquant'));
    }
    
    // Mapper les données au format attendu par le backend
    const backendData = {
      old_password: passwordData.currentPassword,
      password: passwordData.newPassword,
      password_confirm: passwordData.confirmPassword
    };
    
    const params = new HttpParams().set('token', token);
    
    return this.http.put(`${this.baseUrl}/auth/change-password`, backendData, { params })
      .pipe(
        tap(() => {
          this.toastr.success('Mot de passe modifié avec succès');
        }),
        catchError(error => {
          this.toastr.error(error.error?.message || 'Erreur lors du changement de mot de passe');
          throw error;
        })
      );
  }

  /**
   * Mot de passe oublié
   */
  forgotPassword(email: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/auth/forgot-password`, { email })
      .pipe(
        tap(() => {
          this.toastr.success('Email de récupération envoyé');
        }),
        catchError(error => {
          this.toastr.error(error.error?.message || 'Erreur lors de l\'envoi de l\'email');
          throw error;
        })
      );
  }

  /**
   * Réinitialisation du mot de passe
   */
  resetPassword(token: string, password: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/auth/reset/${token}`, { password })
      .pipe(
        tap(() => {
          this.toastr.success('Mot de passe réinitialisé avec succès');
        }),
        catchError(error => {
          this.toastr.error(error.error?.message || 'Erreur lors de la réinitialisation');
          throw error;
        })
      );
  }

  /**
   * Déconnexion
   */
  logout(): Observable<any> {
    const token = this.getToken();
    
    // Nettoyage local d'abord
    this.clearStorage();
    this.currentUserSubject.next(null);
    
    // Appel API pour déconnexion côté serveur (optionnel)
    if (token) {
      return this.http.post(`${this.baseUrl}/auth/logout`, {}).pipe(
        catchError(() => of(null))
      );
    }
    
    return of(null);
  }

  /**
   * Vérification de l'authentification
   */
  isAuthenticated(): boolean {
    const token = this.getToken();
    const user = this.getCurrentUser();
    return !!(token && user);
  }

  /**
   * Récupération du token
   */
  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  /**
   * Récupération de l'utilisateur courant
   */
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Vérification des permissions
   */
  hasPermission(permission: string): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;
    
    // Admin a toutes les permissions
    if (user.role === 'admin') return true;
    
    // Vérification des permissions spécifiques
    return user.permission?.includes(permission) || false;
  }

  /**
   * Vérification des rôles
   */
  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    return user?.role === role;
  }

  /**
   * Stockage du token
   */
  private storeToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  /**
   * Stockage de l'utilisateur
   */
  private storeUser(user: User): void {
    localStorage.setItem(this.userKey, JSON.stringify(user));
  }

  /**
   * Chargement de l'utilisateur stocké
   */
  private loadStoredUser(): void {
    const storedUser = localStorage.getItem(this.userKey);
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        this.currentUserSubject.next(user);
      } catch (error) {
        console.error('Erreur lors du chargement de l\'utilisateur:', error);
        this.clearStorage();
      }
    }
  }

  /**
   * Nettoyage du stockage
   */
  private clearStorage(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
  }
}

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { IUser } from '../shared/models/user.model';
import { AuthStateService } from '../core/auth/auth-state.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  constructor(
    private http: HttpClient,
    private authState: AuthStateService
  ) { }

  /**
   * Inscription d'un nouvel utilisateur
   */
  register(data: any): Observable<any> {
    return this.http.post<IUser>(`${environment.apiUrl}/auth/register`, data);
  }
 

  /**
   * Mise à jour des informations utilisateur
   * Délègue au AuthStateService pour cohérence
   */
  updateInfo(data: any): Observable<IUser> {
    return this.authState.updateInfo(data);
  }

  /**
   * Mise à jour du mot de passe
   * Délègue au AuthStateService pour cohérence
   */
  updatePassword(data: any): Observable<IUser> {
    return this.authState.updatePassword(data);
  }

  /**
   * Récupération de l'utilisateur actuel
   * Délègue au AuthStateService pour cohérence
   */
  user(): Observable<IUser> {
    return this.authState.user$;
  }

  /**
   * Connexion utilisateur
   * Délègue au AuthStateService pour cohérence
   */
  login(credentials: { identifier: string; password: string }): Observable<boolean> {
    return this.authState.login(credentials);
  }

  /**
   * Déconnexion utilisateur
   * Délègue au AuthStateService pour cohérence
   */
  logout(isManual: boolean = true): Observable<void> {
    return this.authState.logout(isManual);
  }

  /**
   * Vérification de l'état d'authentification
   */
  isAuthenticated(): Observable<boolean> {
    return this.authState.isAuthenticated$;
  }

  /**
   * Récupération des données utilisateur
   */
  fetchUserData(): Observable<IUser> {
    return this.authState.fetchUserData();
  }
}
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, throwError, of, combineLatest, timer } from 'rxjs';
import { map, distinctUntilChanged, timeout, retry, tap, catchError, switchMap, filter, shareReplay } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { IUser } from '../../shared/models/user.model';
import { UserActivityService } from './user-activity.service';

export interface AuthState {
  isAuthenticated: boolean;
  user: IUser | null;
  isLoading: boolean;
  error: string | null;
  isOnline: boolean;
  lastSync: Date | null;
}

const INITIAL_STATE: AuthState = {
  isAuthenticated: false,
  user: null,
  isLoading: false,
  error: null,
  isOnline: navigator.onLine,
  lastSync: null
};

@Injectable({
  providedIn: 'root'
})
export class AuthStateService {
  private readonly TOKEN_KEY = 'token';
  private readonly USER_KEY = 'auth_user_v2';
  private readonly MANUAL_LOGOUT_KEY = 'manual_logout';
  private readonly PASSWORD_HASH_KEY = 'auth_password_hash'; // Nouveau : hash du mot de passe pour unlock local
  private readonly CACHE_DURATION = 3 * 24 * 60 * 60 * 1000; // 3 jours
  private readonly SYNC_INTERVAL = 5 * 60 * 1000; // 5 minutes
  private readonly LOCK_TIMEOUT = 5 * 60 * 1000; // 5 minutes pour lock-screen

  private _state$ = new BehaviorSubject<AuthState>(INITIAL_STATE);
  private _onlineStatus$ = new BehaviorSubject<boolean>(navigator.onLine);

  // Observables publics
  public readonly state$ = this._state$.asObservable();
  public readonly isAuthenticated$ = this.state$.pipe(
    map(state => state.isAuthenticated),
    distinctUntilChanged()
  );
  public readonly user$ = this.state$.pipe(
    map(state => state.user),
    filter(user => user !== null),
    distinctUntilChanged()
  );
  public readonly isLoading$ = this.state$.pipe(
    map(state => state.isLoading),
    distinctUntilChanged()
  );
  public readonly isOnline$ = this._onlineStatus$.asObservable();
  constructor(
    private http: HttpClient,
    private router: Router,
    private userActivityService: UserActivityService
  ) {
    this.initializeNetworkListeners();
    this.initializeAppLifecycleListeners();
    this.initializeUserActivityListeners();
    this.initializeAutoSync();
    this.cleanupOldStorageData(); // Nettoyer les anciennes données
    this.restoreAuthState();
  }
  /**
   * Initialise les listeners pour le statut réseau
   */
  private initializeNetworkListeners(): void {
    window.addEventListener('online', () => {
      this._onlineStatus$.next(true);
      this.updateState({ isOnline: true });
      this.handleNetworkReconnection();
    });

    window.addEventListener('offline', () => {
      this._onlineStatus$.next(false);
      this.updateState({ isOnline: false });
      this.handleNetworkDisconnection();
    });
  }

  /**
   * Gère la reconnexion réseau
   */
  private handleNetworkReconnection(): void {
    const currentState = this._state$.value;
    if (currentState.isAuthenticated) {
      this.debugLog('📡 Reconnexion réseau détectée - Synchronisation des données');
      this.syncUserDataSilently();
    } else {
      this.checkSessionOnAppReturn();
    }
  }

  /**
   * Gère la déconnexion réseau
   */
  private handleNetworkDisconnection(): void {
    const currentState = this._state$.value;
    if (currentState.isAuthenticated) {
      this.debugLog('📡 Déconnexion réseau détectée');
      
      // Optionnel : Rediriger vers lock-screen après une période prolongée hors ligne
      setTimeout(() => {
        if (!navigator.onLine && currentState.isAuthenticated) {
          this.debugLog('🔒 Hors ligne trop longtemps - Redirection vers lock-screen');
          this.redirectToLockScreen();
        }
      }, 30 * 60 * 1000); // 30 minutes hors ligne
    }
  }

  /**
   * Initialise les listeners pour le cycle de vie de l'application
   */
  private initializeAppLifecycleListeners(): void {
    // Détection de fermeture d'onglet/navigateur
    window.addEventListener('beforeunload', (event) => {
      this.handleAppExit();
    });

    // Détection de changement de visibilité de la page
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.handleAppHidden();
      } else if (document.visibilityState === 'visible') {
        this.handleAppVisible();
      }
    });

    // Détection de perte de focus de la fenêtre
    window.addEventListener('blur', () => {
      this.handleAppBlur();
    });

    // Détection de retour de focus sur la fenêtre
    window.addEventListener('focus', () => {
      this.handleAppFocus();
    });    // Détection mobile - pause/resume
    document.addEventListener('pagehide', () => {
      this.handleAppExit();
    });

    window.addEventListener('pageshow', (event: any) => {
      if (event.persisted) {
        this.handleAppVisible();
      }
    });
  }

  /**
   * Gère la fermeture de l'application
   */
  private handleAppExit(): void {
    const currentState = this._state$.value;
    if (currentState.isAuthenticated) {
      // Marquer que l'utilisateur a quitté l'application
      localStorage.setItem('app_exit_timestamp', new Date().toISOString());
      localStorage.setItem('was_authenticated_on_exit', 'true');
    }
  }

  /**
   * Gère le masquage de l'application (changement d'onglet, minimisation)
   */
  private handleAppHidden(): void {
    const currentState = this._state$.value;
    if (currentState.isAuthenticated) {
      localStorage.setItem('app_exit_timestamp', new Date().toISOString());
    }
  }

  /**
   * Gère le retour visible de l'application
   */
  private handleAppVisible(): void {
    this.checkSessionOnAppReturn();
  }

  /**
   * Gère la perte de focus de l'application
   */
  private handleAppBlur(): void {
    const currentState = this._state$.value;
    if (currentState.isAuthenticated) {
      localStorage.setItem('app_exit_timestamp', new Date().toISOString());
    }
  }

  /**
   * Gère le retour de focus sur l'application
   */
  private handleAppFocus(): void {
    this.checkSessionOnAppReturn();
  }

  /**
   * Vérifie la session lors du retour à l'application
   */
  private checkSessionOnAppReturn(): void {
    const exitTimestamp = localStorage.getItem('app_exit_timestamp');
    const wasAuthenticated = localStorage.getItem('was_authenticated_on_exit') === 'true';
    const currentState = this._state$.value;

    this.debugLog(`🔍 Vérification session - Exit: ${exitTimestamp}, WasAuth: ${wasAuthenticated}, Current: ${currentState.isAuthenticated}`);

    if (wasAuthenticated || currentState.isAuthenticated) {
      const now = new Date();
      let shouldRedirectToLockScreen = false;

      // Vérifier si l'application a été fermée pendant plus de 5 minutes
      if (exitTimestamp) {
        const exitTime = new Date(exitTimestamp);
        const timeDiff = now.getTime() - exitTime.getTime();
        this.debugLog(`⏱️ Temps d'absence: ${Math.round(timeDiff / 1000 / 60)} minutes`);
        
        if (timeDiff > this.LOCK_TIMEOUT) {
          shouldRedirectToLockScreen = true;
          this.debugLog('🔒 Absence trop longue - Lock screen requis');
        } else {
          this.debugLog('✅ Absence courte - Restauration normale');
          // Restaurer l'état d'authentification directement
          if (!currentState.isAuthenticated) {
            const cachedUser = localStorage.getItem(this.USER_KEY);
            if (cachedUser) {
              const userData = JSON.parse(cachedUser);
              this.updateState({
                isAuthenticated: true,
                user: userData.user,
                isOnline: navigator.onLine,
                lastSync: new Date(userData.timestamp)
              });
            }
          }
        }
        localStorage.removeItem('app_exit_timestamp');
      }

      // Rediriger vers lock-screen si nécessaire
      if (shouldRedirectToLockScreen && (currentState.isAuthenticated || wasAuthenticated)) {
        this.redirectToLockScreen();
      }

      // Nettoyer les flags
      localStorage.removeItem('was_authenticated_on_exit');
      localStorage.removeItem('app_hidden_timestamp');
      localStorage.removeItem('app_blur_timestamp');
    }
  }

  /**
   * Redirige vers l'écran de verrouillage
   */
  private redirectToLockScreen(): void {
    this.debugLog('🔒 Redirection vers lock-screen');
    
    // Ne pas déconnecter complètement, juste marquer comme non authentifié
    this.updateState({
      isAuthenticated: false,
      isLoading: false
    });

    // Rediriger vers lock-screen avec l'URL actuelle
    const currentUrl = this.router.url;
    this.router.navigate(['/lock-screen'], {
      queryParams: { returnUrl: currentUrl }
    });
  }

  /**
   * Restaure l'état d'authentification depuis le cache local
   */  
  private restoreAuthState(): void {
    try {
      const cachedUser = localStorage.getItem(this.USER_KEY);
      const token = localStorage.getItem(this.TOKEN_KEY);
      const wasManualLogout = localStorage.getItem(this.MANUAL_LOGOUT_KEY) === 'true';

      this.debugLog(`🔄 Restauration état - Token: ${!!token}, Cache: ${!!cachedUser}, Manual logout: ${wasManualLogout}`);

      // Si c'est une déconnexion manuelle, ne pas restaurer
      if (wasManualLogout) {
        this.debugLog('❌ Déconnexion manuelle détectée - Nettoyage');
        this.clearAuthData();
        return;
      }

      // Si on a un token et des données utilisateur, restaurer l'état
      if (cachedUser && token) {
        const userData = JSON.parse(cachedUser);
        const cacheTime = new Date(userData.timestamp);
        const now = new Date();

        // Vérifier si le cache n'est pas expiré (3 jours)
        if (now.getTime() - cacheTime.getTime() < this.CACHE_DURATION) {
          this.debugLog('✅ Restauration de l\'état d\'authentification depuis le cache');
          
          // Nettoyer les flags de sortie d'application pour éviter les conflits
          localStorage.removeItem('app_exit_timestamp');
          localStorage.removeItem('was_authenticated_on_exit');
          
          this.updateState({
            isAuthenticated: true,
            user: userData.user,
            isOnline: navigator.onLine,
            lastSync: cacheTime
          });

          // Synchroniser en arrière-plan si en ligne
          if (navigator.onLine) {
            this.syncUserDataSilently();
          }
          return;
        } else {
          this.debugLog('⏰ Cache expiré - Nettoyage des données');
        }
      }

      // Cache expiré ou inexistant
      this.debugLog('❌ Pas de données valides - Nettoyage');
      this.clearAuthData();
    } catch (error) {
      console.error('Erreur lors de la restauration de l\'état d\'authentification:', error);
      this.clearAuthData();
    }
  }

  /**
   * Connexion utilisateur
   */
  login(credentials: { identifier: string; password: string }): Observable<boolean> {
    this.updateState({ isLoading: true, error: null });

    const loginData = {
      identifier: credentials.identifier.toLowerCase(),
      password: credentials.password
    };

    return this.http.post<any>(`${environment.apiUrl}/auth/login`, loginData, {
      withCredentials: true
    }).pipe(
      timeout(10000), // 10 secondes de timeout
      retry(2), // Retry 2 fois en cas d'échec
      tap(async response => {
        if (response?.data) {
          localStorage.setItem(this.TOKEN_KEY, response.data);
          // Stocker le hash du mot de passe pour déverrouillage local
          await this.storePasswordHash(credentials.password);
          this.debugLog('🔑 Hash du mot de passe stocké pour déverrouillage local');
        }
      }),
      map(() => true),
      catchError((error: HttpErrorResponse) => {
        const errorMessage = error.error?.message || 'Erreur de connexion';
        this.updateState({ isLoading: false, error: errorMessage });
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  /**
   * Récupération des données utilisateur après connexion
   */
  fetchUserData(): Observable<IUser> {
    const token = localStorage.getItem(this.TOKEN_KEY);
    if (!token) {
      return throwError(() => new Error('Token manquant'));
    }

    this.updateState({ isLoading: true });

    return this.http.get<IUser>(`${environment.apiUrl}/auth/user`, {
      params: { token }
    }).pipe(
      timeout(8000),
      retry(1),
      tap(user => {
        if (user && user.uuid) {
          this.debugLog('✅ Données utilisateur récupérées avec succès');
          this.setAuthenticatedUser(user);
        } else {
          this.debugLog('❌ Données utilisateur invalides');
          throw new Error('Données utilisateur invalides');
        }
      }),
      catchError(error => {
        this.debugLog('❌ Erreur récupération données utilisateur');
        this.updateState({ isLoading: false, error: 'Impossible de récupérer les données utilisateur' });
        // Ne pas faire de logout automatique ici, laisser les guards gérer
        return throwError(() => error);
      })
    );
  }

  /**
   * Force la restauration de l'état d'authentification depuis le cache local
   * Méthode publique pour utilisation par les guards
   * Retourne true si la restauration a réussi
   */
  forceRestoreAuthState(): boolean {
    try {
      const cachedUser = localStorage.getItem(this.USER_KEY);
      const token = localStorage.getItem(this.TOKEN_KEY);
      const wasManualLogout = localStorage.getItem(this.MANUAL_LOGOUT_KEY) === 'true';

      this.debugLog(`🔄 Restauration forcée - Token: ${!!token}, Cache: ${!!cachedUser}, Manual logout: ${wasManualLogout}`);

      // Si c'est une déconnexion manuelle, ne pas restaurer
      if (wasManualLogout) {
        this.debugLog('❌ Déconnexion manuelle détectée - Pas de restauration');
        return false;
      }

      // Si on a un token et des données utilisateur, restaurer l'état
      if (cachedUser && token) {
        const userData = JSON.parse(cachedUser);
        const cacheTime = new Date(userData.timestamp);
        const now = new Date();

        // Vérifier si le cache n'est pas expiré (3 jours)
        if (now.getTime() - cacheTime.getTime() < this.CACHE_DURATION) {
          this.debugLog('✅ Restauration forcée réussie');
          
          // Nettoyer les flags de sortie d'application pour éviter les conflits
          localStorage.removeItem('app_exit_timestamp');
          localStorage.removeItem('was_authenticated_on_exit');
          
          this.updateState({
            isAuthenticated: true,
            user: userData.user,
            isOnline: navigator.onLine,
            lastSync: cacheTime
          });

          // Synchroniser en arrière-plan si en ligne
          if (navigator.onLine) {
            this.syncUserDataSilently();
          }
          return true;
        } else {
          this.debugLog('⏰ Cache expiré lors de la restauration forcée');
        }
      }

      // Cache expiré ou inexistant
      this.debugLog('❌ Pas de données valides pour la restauration forcée');
      return false;
    } catch (error) {
      console.error('Erreur lors de la restauration forcée:', error);
      return false;
    }
  }

  /**
   * Synchronisation silencieuse des données utilisateur
   */
  private syncUserDataSilently(): void {
    const currentState = this._state$.value;
    if (!currentState.isAuthenticated || !currentState.isOnline) {
      return;
    }

    const token = localStorage.getItem(this.TOKEN_KEY);
    if (!token) return;

    this.http.get<IUser>(`${environment.apiUrl}/auth/user`, {
      params: { token }
    }).pipe(
      timeout(5000),
      catchError(() => of(null)) // Échec silencieux
    ).subscribe(user => {
      if (user && user.uuid) {
        this.setAuthenticatedUser(user, false); // false = pas de chargement visible
        this.updateState({ lastSync: new Date() });
      }
    });
  }

  /**
   * Définit l'utilisateur authentifié
   */
  private setAuthenticatedUser(user: IUser, showLoading: boolean = true): void {
    // Effacer le flag de déconnexion manuelle lors d'une nouvelle connexion réussie
    this.clearManualLogoutFlag();

    // Utiliser l'utilisateur tel quel avec les bonnes propriétés de l'interface
    const userData = {
      user: user,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem(this.USER_KEY, JSON.stringify(userData));

    // Mettre à jour l'état
    this.updateState({
      isAuthenticated: true,
      user: user,
      isLoading: showLoading ? false : this._state$.value.isLoading,
      error: null,
      lastSync: new Date()
    });
  }
  /**
   * Déconnexion
   */
  logout(isManual: boolean = true): Observable<void> {
    this.updateState({ isLoading: true });

    // Marquer la déconnexion comme manuelle si c'est le cas
    if (isManual) {
      localStorage.setItem(this.MANUAL_LOGOUT_KEY, 'true');
    }

    const logoutRequest$ = this.isOnline$.pipe(
      switchMap(isOnline => {
        if (isOnline) {
          return this.http.post<void>(`${environment.apiUrl}/auth/logout`, {}).pipe(
            timeout(5000),
            catchError(() => of(void 0)) // Continuer même si la requête échoue
          );
        } else {
          return of(void 0);
        }
      }),
      tap(() => {
        this.clearAuthData();
        if (isManual) {
          this.router.navigate(['/auth/login']);
        } else {
          // Déconnexion automatique (token expiré) -> rediriger vers lock-screen si l'utilisateur était connecté
          this.router.navigate(['/lock-screen']);
        }
      }),
      map(() => void 0), // Assurer que le type de retour est void
      shareReplay(1)
    );

    return logoutRequest$;
  }

  /**
   * Vérification de la validité du token
   */
  isTokenValid(): boolean {
    const cachedUser = localStorage.getItem(this.USER_KEY);
    const token = localStorage.getItem(this.TOKEN_KEY);

    if (!cachedUser || !token) return false;

    try {
      const userData = JSON.parse(cachedUser);
      const cacheTime = new Date(userData.timestamp);
      const now = new Date();

      return (now.getTime() - cacheTime.getTime()) < this.CACHE_DURATION;
    } catch {
      return false;
    }
  }

  /**
   * Vérifier si l'utilisateur s'est déconnecté manuellement
   */
  wasManualLogout(): boolean {
    return localStorage.getItem(this.MANUAL_LOGOUT_KEY) === 'true';
  }

  /**
   * Effacer le flag de déconnexion manuelle (utilisé lors d'une nouvelle connexion)
   */
  clearManualLogoutFlag(): void {
    localStorage.removeItem(this.MANUAL_LOGOUT_KEY);
  }

  /**
   * Obtenir l'utilisateur actuel de manière synchrone
   */
  getCurrentUser(): IUser | null {
    return this._state$.value.user;
  }

  /**
   * Obtenir l'état actuel de manière synchrone
   */
  getCurrentState(): AuthState {
    return this._state$.value;
  }

  /**
   * Vérification des permissions
   */
  hasPermission(requiredPermission: string): Observable<boolean> {
    return this.user$.pipe(
      map(user => {
        if (!user || !user.permission) return false;

        const userPermission = user.permission;

        // Permissions spéciales
        if (userPermission === 'ALL') return true;

        // Vérification des permissions CRUD
        return this.checkCRUDPermission(userPermission, requiredPermission);
      })
    );
  }

  /**
   * Vérification des permissions CRUD
   */
  private checkCRUDPermission(userPermission: string, requiredPermission: string): boolean {
    const permissionMap: { [key: string]: string[] } = {
      'C': ['C'],
      'R': ['R'],
      'U': ['U'],
      'D': ['D'],
      'CR': ['C', 'R'],
      'CU': ['C', 'U'],
      'CD': ['C', 'D'],
      'RU': ['R', 'U'],
      'RD': ['R', 'D'],
      'UD': ['U', 'D'],
      'CRU': ['C', 'R', 'U'],
      'CRD': ['C', 'R', 'D'],
      'CUD': ['C', 'U', 'D'],
      'RUD': ['R', 'U', 'D'],
      'CRUD': ['C', 'R', 'U', 'D']
    };

    const allowedPermissions = permissionMap[userPermission] || [];
    return allowedPermissions.includes(requiredPermission);
  }

  /**
   * Mise à jour de l'état
   */
  private updateState(partialState: Partial<AuthState>): void {
    const currentState = this._state$.value;
    const newState = { ...currentState, ...partialState };
    this._state$.next(newState);
  }

  /**
   * Nettoyage des données d'authentification
   */
  private clearAuthData(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem(this.PASSWORD_HASH_KEY); // Nettoyer le hash du mot de passe
    // Ne pas supprimer MANUAL_LOGOUT_KEY ici car on en a besoin pour la logique de redirection
    this.updateState({
      isAuthenticated: false,
      user: null,
      isLoading: false,
      error: null
    });
  }

  /**
   * Méthodes utilitaires pour la compatibilité
   */

  // Pour l'AuthService existant
  user(): Observable<IUser> {
    return this.user$;
  }

  // Pour l'AuthService existant  
  updateInfo(data: any): Observable<IUser> {
    return this.http.put<IUser>(`${environment.apiUrl}/auth/profil/info`, data).pipe(
      tap(updatedUser => {
        if (updatedUser) {
          this.setAuthenticatedUser(updatedUser, false);
        }
      })
    );
  }
  // Pour l'AuthService existant
  updatePassword(data: any): Observable<any> {
    const token = localStorage.getItem(this.TOKEN_KEY);
    if (!token) {
      return throwError(() => new Error('Token d\'authentification manquant'));
    }
    
    // Mapper les données au format attendu par le backend
    const backendData = {
      old_password: data.currentPassword,
      password: data.newPassword,
      password_confirm: data.confirmPassword
    };
    
    return this.http.put<any>(`${environment.apiUrl}/auth/change-password?token=${token}`, backendData);
  }

  /**
   * Demande de réinitialisation de mot de passe
   */
  requestPasswordReset(email: string): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(`${environment.apiUrl}/auth/forgot-password`, { email }).pipe(
      timeout(10000),
      retry(1),
      catchError((error: HttpErrorResponse) => {
        const errorMessage = error.error?.message || 'Erreur lors de l\'envoi de l\'email de réinitialisation';
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  /**
   * Vérification du token de réinitialisation
   */
  verifyResetToken(email: string, token: string): Observable<{ valid: boolean; message: string }> {
    return this.http.post<{ valid: boolean; message: string }>(`${environment.apiUrl}/auth/verify-reset-token`, { email, token }).pipe(
      timeout(8000),
      retry(1),
      catchError((error: HttpErrorResponse) => {
        const errorMessage = error.error?.message || 'Token de réinitialisation invalide';
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  /**
   * Réinitialisation du mot de passe avec token
   */
  resetPasswordWithToken(email: string, token: string, newPassword: string): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(`${environment.apiUrl}/auth/reset-password`, {
      email,
      token,
      password: newPassword
    }).pipe(
      timeout(10000),
      retry(1),
      catchError((error: HttpErrorResponse) => {
        const errorMessage = error.error?.message || 'Erreur lors de la réinitialisation du mot de passe';
        return throwError(() => new Error(errorMessage));
      })
    );
  }
  /**
   * Initialise les listeners pour l'activité utilisateur
   */
  private initializeUserActivityListeners(): void {
    // S'abonner aux événements d'inactivité prolongée du service UserActivityService
    this.userActivityService.longInactivity$.subscribe((isLongInactive) => {
      const currentState = this._state$.value;
      if (isLongInactive && currentState.isAuthenticated) {
        console.log('🔒 Redirection vers lock-screen pour inactivité prolongée');
        this.redirectToLockScreen();
      }
    });
  }

  /**
   * Initialise la synchronisation automatique périodique
   */
  private initializeAutoSync(): void {
    // Synchronisation automatique toutes les 5 minutes si authentifié et en ligne
    timer(0, this.SYNC_INTERVAL).pipe(
      switchMap(() => {
        const currentState = this._state$.value;
        if (currentState.isAuthenticated && currentState.isOnline) {
          return of(true);
        }
        return of(false);
      }),
      filter(shouldSync => shouldSync)
    ).subscribe(() => {
      this.syncUserDataSilently();
    });
  }

  /**
   * Nettoie les anciennes données de localStorage qui ne sont plus utilisées
   */
  private cleanupOldStorageData(): void {
    // Anciens keys qui peuvent exister dans le localStorage
    const oldKeys = [
      'auth_user', 
      'auth_id', 
      'user_session', 
      'token',
      'network_disconnection_timestamp'
    ];

    oldKeys.forEach(key => {
      if (localStorage.getItem(key)) {
        localStorage.removeItem(key);
        this.debugLog(`🧹 Nettoyage: ancienne donnée '${key}' supprimée`);
      }
    });
  }

  /**
   * Méthode de debug pour des logs propres en développement
   */
  private debugLog(message: string): void {
    if (!environment.production) {
      console.log(`[AuthState] ${message}`);
    }
  }

  /**
   * Méthodes de test pour le développement (à supprimer en production)
   */
  public testLockScreen(): void {
    if (!environment.production) {
      this.debugLog('🧪 Test: Simulation de redirection vers lock-screen');
      this.redirectToLockScreen();
    }
  }

  public testCacheExpiry(): void {
    if (!environment.production) {
      this.debugLog('🧪 Test: Simulation d\'expiration du cache');
      localStorage.removeItem(this.USER_KEY);
      localStorage.removeItem(this.TOKEN_KEY);
      this.clearAuthData();
    }
  }

  public getStorageInfo(): any {
    if (!environment.production) {
      return {
        token: !!localStorage.getItem(this.TOKEN_KEY),
        user: !!localStorage.getItem(this.USER_KEY),
        passwordHash: !!localStorage.getItem(this.PASSWORD_HASH_KEY),
        manualLogout: localStorage.getItem(this.MANUAL_LOGOUT_KEY),
        exitTimestamp: localStorage.getItem('app_exit_timestamp'),
        wasAuthenticated: localStorage.getItem('was_authenticated_on_exit'),
        cacheAge: this.getCacheAge()
      };
    }
    return null;
  }

  private getCacheAge(): string | null {
    const userData = localStorage.getItem(this.USER_KEY);
    if (userData) {
      try {
        const parsed = JSON.parse(userData);
        const cacheTime = new Date(parsed.timestamp);
        const now = new Date();
        const diffMs = now.getTime() - cacheTime.getTime();
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        return `${diffHours}h ${diffMinutes}m`;
      } catch {
        return 'Invalid';
      }
    }
    return null;
  }

  /**
   * Génère un hash simple du mot de passe pour le stockage local
   * Note: Utilisé uniquement pour le déverrouillage local, pas pour la sécurité
   */
  private async generatePasswordHash(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + 'ipos_salt_2025'); // Salt simple
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Vérifie si le mot de passe correspond au hash stocké localement
   */
  private async verifyPasswordHash(password: string): Promise<boolean> {
    const storedHash = localStorage.getItem(this.PASSWORD_HASH_KEY);
    if (!storedHash) return false;
    
    const inputHash = await this.generatePasswordHash(password);
    return inputHash === storedHash;
  }

  /**
   * Stocke le hash du mot de passe localement lors de la connexion
   */
  private async storePasswordHash(password: string): Promise<void> {
    const hash = await this.generatePasswordHash(password);
    localStorage.setItem(this.PASSWORD_HASH_KEY, hash);
  }

  /**
   * Déverrouillage local du lock-screen (sans connexion internet)
   */
  async unlockLocal(password: string): Promise<boolean> {
    try {
      const isValidPassword = await this.verifyPasswordHash(password);
      
      if (isValidPassword) {
        this.debugLog('🔓 Déverrouillage local réussi');
        
        // Rétablir l'état d'authentification
        const currentUser = this.getCurrentUser();
        if (currentUser) {
          this.updateState({
            isAuthenticated: true,
            isLoading: false,
            error: null
          });
          
          // Reset l'activité utilisateur
          this.userActivityService.forceActivityReset();
          
          return true;
        }
      }
      
      this.debugLog('🔐 Déverrouillage local échoué - mot de passe incorrect');
      return false;
    } catch (error) {
      this.debugLog('🔐 Erreur lors du déverrouillage local');
      console.error('Erreur déverrouillage local:', error);
      return false;
    }
  }
}

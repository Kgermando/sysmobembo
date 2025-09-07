import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { IUser } from '../../shared/models/user.model';
import { AuthStateService } from '../auth/auth-state.service';

/**
 * Service moderne pour remplacer la classe Auth statique
 * Fournit un accès synchrone et réactif aux données utilisateur
 */
@Injectable({
  providedIn: 'root'
})
export class UserStateService {
  private _currentUser$ = new BehaviorSubject<IUser | null>(null);
  
  // Observable public pour l'état utilisateur
  public readonly currentUser$ = this._currentUser$.asObservable();

  constructor(private authState: AuthStateService) {
    // S'abonner aux changements d'utilisateur depuis AuthStateService
    this.authState.user$.subscribe(user => {
      this._currentUser$.next(user);
    });

    // Gérer la déconnexion
    this.authState.isAuthenticated$.subscribe(isAuth => {
      if (!isAuth) {
        this._currentUser$.next(null);
      }
    });
  }

  /**
   * Obtenir l'utilisateur actuel de manière synchrone
   */
  getCurrentUser(): IUser | null {
    return this._currentUser$.value;
  }

  /**
   * Vérifier si un utilisateur est connecté
   */
  isAuthenticated(): boolean {
    return this._currentUser$.value !== null;
  }

  /**
   * Vérifier les permissions de l'utilisateur actuel
   */
  hasPermission(requiredPermission: string): boolean {
    const user = this._currentUser$.value;
    if (!user || !user.permission) return false;
    
    const userPermission = user.permission;
    
    // Permissions spéciales
    if (userPermission === 'ALL') return true;
    
    // Vérification des permissions CRUD
    return this.checkCRUDPermission(userPermission, requiredPermission);
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
   * Émettre un changement d'utilisateur (pour la compatibilité avec Auth.userEmitter)
   */
  emitUser(user: IUser): void {
    this._currentUser$.next(user);
  }

  /**
   * Nettoyer l'état utilisateur
   */
  clearUser(): void {
    this._currentUser$.next(null);
  }
}

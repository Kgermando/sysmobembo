import { Injectable, inject } from '@angular/core';
import { CanActivateFn, CanActivateChildFn, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, catchError, tap, take } from 'rxjs/operators';
import { AuthStateService } from './auth-state.service';

/**
 * Guard moderne basé sur les fonctions pour l'authentification
 */
export const modernAuthGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> => {
  const authState = inject(AuthStateService);
  const router = inject(Router);

  // Vérifier d'abord les conditions de base de manière synchrone
  const wasManualLogout = authState.wasManualLogout();
  const hasValidToken = authState.isTokenValid();
  const hasValidUser = !!authState.getCurrentUser();
  const currentState = authState.getCurrentState();

  console.log('🔍 ModernAuthGuard - Debug:', {
    isAuthenticated: currentState.isAuthenticated,
    hasValidToken,
    wasManualLogout,
    hasValidUser,
    url: state.url
  });

  // Déconnexion manuelle confirmée -> toujours rediriger vers login
  if (wasManualLogout) {
    console.log('🚪 Déconnexion manuelle détectée -> Login');
    router.navigate(['/auth/login'], { 
      queryParams: { returnUrl: state.url } 
    });
    return of(false);
  }

  // Si on a un token valide et des données utilisateur
  if (hasValidToken && hasValidUser) {
    console.log('🔄 Token et données valides détectés');
    
    // Si l'état n'est pas encore authentifié, forcer la restauration
    if (!currentState.isAuthenticated) {
      console.log('🔧 État non authentifié mais données valides -> Restauration forcée');
      const restored = authState.forceRestoreAuthState();
      
      if (restored) {
        console.log('✅ Restauration réussie -> Accès autorisé');
        return of(true);
      } else {
        console.log('❌ Restauration échouée -> Login');
        router.navigate(['/auth/login'], { 
          queryParams: { returnUrl: state.url } 
        });
        return of(false);
      }
    }
    
    // Permettre l'accès car nous avons des données valides
    console.log('✅ Accès autorisé');
    return of(true);
  }

  // Si l'utilisateur est déjà authentifié dans l'état actuel
  if (currentState.isAuthenticated) {
    console.log('✅ Utilisateur déjà authentifié -> Accès autorisé');
    return of(true);
  }

  // Pas de token ou données invalides -> login
  console.log('❌ Pas de token valide ou données manquantes -> Login');
  router.navigate(['/auth/login'], { 
    queryParams: { returnUrl: state.url } 
  });
  return of(false);
};

/**
 * Guard pour vérifier les permissions CRUD
 */
export const permissionGuard = (requiredPermission: string): CanActivateFn => {
  return (route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> => {
    const authState = inject(AuthStateService);
    const router = inject(Router);

    return authState.hasPermission(requiredPermission).pipe(
      take(1),
      tap(hasPermission => {
        if (!hasPermission) {
          console.warn(`Accès refusé. Permission requise: ${requiredPermission}`);
          router.navigate(['/unauthorized']);
        }
      }),
      catchError(() => {
        router.navigate(['/auth/login']);
        return of(false);
      })
    );
  };
};

/**
 * Guards spécialisés pour les opérations CRUD
 */
export const createGuard: CanActivateFn = permissionGuard('C');
export const readGuard: CanActivateFn = permissionGuard('R');
export const updateGuard: CanActivateFn = permissionGuard('U');
export const deleteGuard: CanActivateFn = permissionGuard('D');

/**
 * Guard pour les utilisateurs non authentifiés (page de login)
 */
export const guestGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> => {
  const authState = inject(AuthStateService);
  const router = inject(Router);

  return authState.isAuthenticated$.pipe(
    take(1),
    map(isAuthenticated => {
      if (isAuthenticated) {
        const returnUrl = route.queryParams['returnUrl'] || '/web/sales';
        router.navigate([returnUrl]);
        return false;
      }
      return true;
    })
  );
};

/**
 * Guard pour vérifier le statut en ligne/hors ligne
 */
export const onlineGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> => {
  const authState = inject(AuthStateService);
  const router = inject(Router);

  return authState.isOnline$.pipe(
    take(1),
    map(isOnline => {
      if (!isOnline && route.data?.['requiresOnline']) {
        router.navigate(['/offline']);
        return false;
      }
      return true;
    })
  );
};

/**
 * Guard combiné pour vérifier l'authentification ET les permissions
 */
export const authWithPermissionGuard = (requiredPermission: string): CanActivateFn => {
  return (route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> => {
    const authState = inject(AuthStateService);
    const router = inject(Router);

    return authState.state$.pipe(
      take(1),
      map(authStateData => {
        // Vérifier l'authentification
        if (!authStateData.isAuthenticated) {
          router.navigate(['/auth/login'], { 
            queryParams: { returnUrl: state.url } 
          });
          return false;
        }

        // Vérifier les permissions
        if (authStateData.user) {
          const userPermission = authStateData.user.permission || '';
          
          if (userPermission === 'ALL') {
            return true;
          }

          const hasPermission = checkCRUDPermission(userPermission, requiredPermission);
          if (!hasPermission) {
            console.warn(`Accès refusé. Permission requise: ${requiredPermission}, Permission utilisateur: ${userPermission}`);
            router.navigate(['/unauthorized']);
            return false;
          }
        }

        return true;
      }),
      catchError(() => {
        router.navigate(['/auth/login']);
        return of(false);
      })
    );
  };
};

/**
 * Fonction utilitaire pour vérifier les permissions CRUD
 */
function checkCRUDPermission(userPermission: string, requiredPermission: string): boolean {
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
 * Service Guard classique pour la compatibilité (si nécessaire)
 */
@Injectable({
  providedIn: 'root'
})
export class ModernAuthGuardService {
  constructor(
    private authState: AuthStateService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    return this.authState.isAuthenticated$.pipe(
      take(1),
      map(isAuthenticated => {
        if (isAuthenticated) {
          return true;
        } else {
          this.router.navigate(['/auth/login'], { 
            queryParams: { returnUrl: state.url } 
          });
          return false;
        }
      })
    );
  }
}

/**
 * Guard pour la page de lock-screen
 * S'assure que l'utilisateur a un token valide mais n'est pas connecté
 */ 
export const lockScreenGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> => {
  const authState = inject(AuthStateService);
  const router = inject(Router);

  return authState.isAuthenticated$.pipe(
    take(1),
    map(isAuthenticated => {
      if (isAuthenticated) {
        // Utilisateur déjà connecté -> rediriger vers l'application
        const returnUrl = route.queryParams['returnUrl'] || '/web/sales';
        router.navigate([returnUrl]);
        return false;
      } else {
        const wasManualLogout = authState.wasManualLogout();
        const hasValidToken = authState.isTokenValid();
        const wasAuthenticated = localStorage.getItem('was_authenticated_on_exit') === 'true';
        const hasValidUser = !!authState.getCurrentUser();
        
        // Permettre l'accès au lock-screen si :
        // 1. L'utilisateur a un token valide et pas de déconnexion manuelle
        // 2. L'utilisateur était authentifié avant de quitter l'app
        // 3. L'utilisateur a des données utilisateur valides en cache
        if ((hasValidToken && !wasManualLogout) || wasAuthenticated || hasValidUser) {
          return true;
        } else {
          // Pas de token valide ou déconnexion manuelle -> page de login
          router.navigate(['/auth/login'], { 
            queryParams: { returnUrl: state.url } 
          });
          return false;
        }
      }
    }),
    catchError(() => {
      router.navigate(['/auth/login']);
      return of(false);
    })
  );
};

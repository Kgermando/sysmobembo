import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router'; 
import { UserStateService } from '../core/user/user-state.service';
import { AuthStateService } from '../core/auth/auth-state.service';
import { map, take } from 'rxjs/operators';

/**
 * Guard d'authentification moderne
 */
export const authGuard: CanActivateFn = (route, state) => {
  const authState = inject(AuthStateService);
  const router = inject(Router);

  return authState.isAuthenticated$.pipe(
    take(1),
    map(isAuthenticated => {
      if (isAuthenticated) {
        return true;
      } else {
        router.navigate(['/auth/login'], { 
          queryParams: { returnUrl: state.url } 
        });
        return false;
      }
    })
  );
};

/**
 * Guard pour vérifier les permissions de création
 */
export const createGuard: CanActivateFn = (route, state) => {
  const userState = inject(UserStateService);
  const router = inject(Router);
  
  return userState.currentUser$.pipe(
    take(1),
    map(user => {
      if (!user) {
        router.navigate(['/auth/login']);
        return false;
      }
      
      if (userState.hasPermission('C')) {
        return true;
      } else {
        console.warn('Accès refusé: permission de création requise');
        router.navigate(['/unauthorized']);
        return false;
      }
    })
  );
};

/**
 * Guard pour vérifier les permissions de lecture
 */
export const readGuard: CanActivateFn = (route, state) => {
  const userState = inject(UserStateService);
  const router = inject(Router);
  
  return userState.currentUser$.pipe(
    take(1),
    map(user => {
      if (!user) {
        router.navigate(['/auth/login']);
        return false;
      }
      
      if (userState.hasPermission('R')) {
        return true;
      } else {
        console.warn('Accès refusé: permission de lecture requise');
        router.navigate(['/unauthorized']);
        return false;
      }
    })
  );
};

/**
 * Guard pour vérifier les permissions de mise à jour
 */
export const updateGuard: CanActivateFn = (route, state) => {
  const userState = inject(UserStateService);
  const router = inject(Router);
  
  return userState.currentUser$.pipe(
    take(1),
    map(user => {
      if (!user) {
        router.navigate(['/auth/login']);
        return false;
      }
      
      if (userState.hasPermission('U')) {
        return true;
      } else {
        console.warn('Accès refusé: permission de mise à jour requise');
        router.navigate(['/unauthorized']);
        return false;
      }
    })
  );
};

/**
 * Guard pour vérifier les permissions de suppression
 */
export const deleteGuard: CanActivateFn = (route, state) => {
  const userState = inject(UserStateService);
  const router = inject(Router);
  
  return userState.currentUser$.pipe(
    take(1),
    map(user => {
      if (!user) {
        router.navigate(['/auth/login']);
        return false;
      }
      
      if (userState.hasPermission('D')) {
        return true;
      } else {
        console.warn('Accès refusé: permission de suppression requise');
        router.navigate(['/unauthorized']);
        return false;
      }
    })
  );
};
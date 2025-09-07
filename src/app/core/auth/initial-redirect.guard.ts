import { Injectable, inject, ɵbypassSanitizationTrustResourceUrl } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, catchError, take } from 'rxjs/operators';
import { AuthStateService } from './auth-state.service';

/**
 * Guard pour la redirection initiale de l'application
 * Gère la logique de redirection basée sur l'état d'authentification et la déconnexion manuelle
 */
export const initialRedirectGuard: CanActivateFn = (): Observable<boolean> => {
  const authState = inject(AuthStateService);
  const router = inject(Router);

  return authState.isAuthenticated$.pipe(
    take(1),
    map((isAuthenticated) => {
      const hasValidToken = authState.isTokenValid();
      const wasManualLogout = authState.wasManualLogout();
      const exitTimestamp = localStorage.getItem('app_exit_timestamp');
      const wasAuthenticated = localStorage.getItem('was_authenticated_on_exit') === 'true';

      // Si l'utilisateur est déjà authentifié, rediriger vers l'application
      if (isAuthenticated) {
        router.navigate(['/web/sales']);
        return true;
      }

      // Vérifier si c'est un retour après fermeture d'application
      if (exitTimestamp || wasAuthenticated) {
        const now = new Date();
        const exitTime = exitTimestamp ? new Date(exitTimestamp) : new Date(0);
        const timeDiff = now.getTime() - exitTime.getTime();
        const LOCK_TIMEOUT = 5 * 60 * 1000; // 5 minutes

        // Si moins de 5 minutes depuis la fermeture et token valide -> lock screen
        if (timeDiff < LOCK_TIMEOUT && hasValidToken && !wasManualLogout) {
          router.navigate(['/lock-screen']);
          return true;
        }
      }

      // Si token valide et pas de déconnexion manuelle (actualisation simple)
      if (hasValidToken && !wasManualLogout && !exitTimestamp && !wasAuthenticated) {
        // C'est probablement juste une actualisation -> rediriger vers l'app
        router.navigate(['/web/sales']);
        return true;
      }

      // Par défaut -> page de login
      router.navigate(['/auth/login']);
      return false;
    }),
    catchError(() => {
      // En cas d'erreur, rediriger vers la page de login
      router.navigate(['/auth/login']);
      return of(false);
    })
  );
};

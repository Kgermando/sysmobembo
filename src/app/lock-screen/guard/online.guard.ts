import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthStateService } from '../../core/auth/auth-state.service';
import { map, take } from 'rxjs/operators';

/**
 * Guard optimisé pour la page lock-screen
 * Utilise le nouveau AuthStateService pour la cohérence
 */
export const lockScreenOnlineGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const authState = inject(AuthStateService);

  return authState.state$.pipe(
    take(1),
    map(currentState => {
      const hasValidToken = authState.isTokenValid();
      const wasManualLogout = authState.wasManualLogout();
      const hasValidUser = !!authState.getCurrentUser();

      // Permettre l'accès au lock-screen si l'utilisateur a des données valides
      if ((hasValidToken && !wasManualLogout) || hasValidUser) {
        return true;
      } else {
        // Rediriger vers login si pas de données valides
        router.navigate(["/auth/login"]);
        return false;
      }
    })
  );
};

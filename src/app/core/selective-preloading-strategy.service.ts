import { Injectable } from '@angular/core';
import { PreloadingStrategy, Route } from '@angular/router';
import { Observable, of, timer } from 'rxjs';
import { mergeMap } from 'rxjs/operators';

/**
 * Stratégie de preloading intelligente
 * Précharge les modules critiques immédiatement et les autres avec un délai
 */
@Injectable({
  providedIn: 'root'
})
export class SelectivePreloadingStrategy implements PreloadingStrategy {
  
  // Modules critiques à précharger immédiatement
  private criticalRoutes = ['dashboard', 'commandes', 'products'];
  
  // Modules à précharger avec délai
  private delayedRoutes = ['clients', 'fournisseurs', 'finances'];
  
  preload(route: Route, fn: () => Observable<any>): Observable<any> {
    const routePath = route.path || '';
    
    // Ne pas précharger les pages d'erreur et d'authentification
    if (routePath.includes('error') || routePath.includes('auth') || routePath.includes('lock-screen')) {
      return of(null);
    }
    
    // Préchargement immédiat pour les routes critiques
    if (this.criticalRoutes.some(critical => routePath.includes(critical))) {
      console.log(`Préchargement immédiat: ${routePath}`);
      return fn();
    }
    
    // Préchargement différé pour les autres routes
    if (this.delayedRoutes.some(delayed => routePath.includes(delayed))) {
      console.log(`Préchargement différé: ${routePath}`);
      return timer(2000).pipe(mergeMap(() => fn()));
    }
    
    // Préchargement très différé pour les autres modules
    console.log(`Préchargement très différé: ${routePath}`);
    return timer(5000).pipe(mergeMap(() => fn()));
  }
}

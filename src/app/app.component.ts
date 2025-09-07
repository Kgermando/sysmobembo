import { isPlatformBrowser } from '@angular/common';
import { Component, Inject, NgZone, PLATFORM_ID, OnInit, OnDestroy, Optional } from '@angular/core';
import { Router } from '@angular/router';
import {
  NavigationEnd,
  NavigationStart,
  Event as RouterEvent,
} from '@angular/router';
import { filter, first } from 'rxjs/operators'; 
import { LoadingService } from './core/loading.service';
import { AuthStateService } from './core/auth/auth-state.service';
import { SwUpdate } from '@angular/service-worker';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  standalone: false,
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'sysmobembo'; 
  public page = '';
  
  constructor(
    @Inject(PLATFORM_ID) private platformId: any,
    private zone: NgZone,
    private router: Router,
    @Optional() private swUpdate: SwUpdate,
    private loadingService: LoadingService,
    private authStateService: AuthStateService, 
  ) {
    this.router.events.subscribe((event: RouterEvent) => {
      if (event instanceof NavigationStart) {
        const URL = event.url.split('/');
        this.page = URL[1];
      }
    });
  }

  ngOnInit(): void {
    // Optimisation du chargement initial
    this.loadingService.show('Initialisation de l\'application...');
    
    if (isPlatformBrowser(this.platformId)) {
      // Gérer la redirection initiale si on est sur la page racine
      this.handleInitialRedirection();

      // Optimiser le preloader
      this.initializePreloader();

      // Vérifier les mises à jour du service worker
      this.initializeServiceWorker();
      
      // Initialiser la détection de visibilité de page
      this.initializeVisibilityDetection();
      
      // Finaliser le chargement après l'initialisation
      setTimeout(() => {
        this.loadingService.hide();
      }, 1000);
    }
  }

  /**
   * Gère la redirection initiale de l'application
   */
  private handleInitialRedirection(): void {
    // Uniquement si on est sur la page racine
    if (this.router.url === '/' || this.router.url === '') {
      const hasValidToken = this.authStateService.isTokenValid();
      const wasManualLogout = this.authStateService.wasManualLogout();
      const exitTimestamp = localStorage.getItem('app_exit_timestamp');
      const wasAuthenticated = localStorage.getItem('was_authenticated_on_exit') === 'true';

      console.log('🚀 Redirection initiale - Debug:', {
        url: this.router.url,
        hasValidToken,
        wasManualLogout,
        exitTimestamp: !!exitTimestamp,
        wasAuthenticated
      });

      // Vérifier si c'est un retour après fermeture d'application
      if (exitTimestamp || wasAuthenticated) {
        const now = new Date();
        const exitTime = exitTimestamp ? new Date(exitTimestamp) : new Date(0);
        const timeDiff = now.getTime() - exitTime.getTime();
        const LOCK_TIMEOUT = 5 * 60 * 1000; // 5 minutes

        // Si moins de 5 minutes depuis la fermeture et token valide -> lock screen
        if (timeDiff < LOCK_TIMEOUT && hasValidToken && !wasManualLogout) {
          this.router.navigate(['/lock-screen']);
          return;
        }
      }

      // Si token valide et pas de déconnexion manuelle -> application
      if (hasValidToken && !wasManualLogout) {
        this.router.navigate(['/web/sales']);
        return;
      }

      // Par défaut -> page de login
      this.router.navigate(['/auth/login']);
    }
  }

  ngOnDestroy(): void {
    // Nettoyer les listeners si nécessaire
  }

  /**
   * Initialise la détection de visibilité de page pour détecter les retours d'application
   */
  private initializeVisibilityDetection(): void {
    // Marquer l'application comme active au démarrage
    if (document.visibilityState === 'visible') {
      this.handleAppBecameVisible();
    }

    // Écouter les changements de visibilité
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.handleAppBecameVisible();
      } else {
        this.handleAppBecameHidden();
      }
    });

    // Écouter les événements de focus/blur pour une détection plus fine
    window.addEventListener('focus', () => {
      this.handleAppBecameVisible();
    });

    window.addEventListener('blur', () => {
      this.handleAppBecameHidden();
    });
  }

  /**
   * Gère le moment où l'application devient visible
   */
  private handleAppBecameVisible(): void {
    // Laisser AuthStateService gérer la logique de session
    // Ceci sera géré par les listeners dans AuthStateService
    console.log('🟢 Application visible - Vérification de session...');
  }

  /**
   * Gère le moment où l'application devient cachée
   */
  private handleAppBecameHidden(): void {
    console.log('🔴 Application cachée - Marquage timestamp...');
    // Le marquage du timestamp est géré par AuthStateService
  }

  private initializePreloader(): void {
    this.zone.runOutsideAngular(() => {
      this.router.events
        .pipe(
          filter((event) => event instanceof NavigationEnd),
          first()
        )
        .subscribe(() => {
          const preloader = document.querySelector('.site-preloader');
          if (!preloader) return;

          preloader.addEventListener('transitionend', (event: Event) => {
            if (
              event instanceof TransitionEvent &&
              event.propertyName === 'opacity'
            ) {
              preloader.remove();
              document.querySelector('.site-preloader-style')?.remove();
              // Performance: forcer le garbage collection
              if ('gc' in window) {
                (window as any).gc();
              }
            }
          });
          
          preloader.classList.add('site-preloader__fade');

          if (
            getComputedStyle(preloader).opacity === '0' &&
            preloader.parentNode
          ) {
            preloader.parentNode.removeChild(preloader);
          }
        });
    });
  }

  private initializeServiceWorker(): void {
    if (!this.swUpdate || !this.swUpdate.isEnabled) {
      console.log('🔧 Service Worker non disponible ou désactivé');
      return;
    }

    console.log('🚀 Service Worker initialisé via PwaService');
    // La logique est maintenant gérée par PwaService
  }


   private clearCache(): void {
    if ('caches' in window) {
      caches.keys().then((cacheNames) => {
        cacheNames.forEach((cacheName) => {
          caches.delete(cacheName);
        });
      });
      console.log('Cache cleared at application startup.');
    }
  }
}

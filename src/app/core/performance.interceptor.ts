import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';

/**
 * Interceptor pour optimiser les performances des requêtes HTTP
 */
@Injectable()
export class PerformanceInterceptor implements HttpInterceptor {
  private activeRequests = 0;
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    this.activeRequests++;
    
    // Only apply performance headers for same-origin requests to avoid CORS issues
    const isSameOrigin = req.url.startsWith('/') || req.url.startsWith(window.location.origin);
    
    let optimizedReq = req;
    if (isSameOrigin) {
      // Optimisations des headers pour les performances
      optimizedReq = req.clone({
        setHeaders: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
          // Removed 'Expires': '0' to avoid CORS issues
        }
      });
    }

    return next.handle(optimizedReq).pipe(
      finalize(() => {
        this.activeRequests--;
        if (this.activeRequests === 0) {
          // Toutes les requêtes sont terminées - on peut faire du cleanup
          this.cleanup();
        }
      })
    );
  }

  private cleanup(): void {
    // Nettoyage des ressources inutilisées
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'CLEANUP' });
    }
  }

  get isLoading(): boolean {
    return this.activeRequests > 0;
  }
}

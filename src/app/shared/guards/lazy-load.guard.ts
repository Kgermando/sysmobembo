import { Injectable } from '@angular/core';
import { CanLoad, Route, UrlSegment } from '@angular/router';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LazyLoadGuard implements CanLoad {

  canLoad(route: Route, segments: UrlSegment[]): Observable<boolean> {
    // Logique pour déterminer si le module doit être chargé
    // Par exemple, vérifier les permissions utilisateur
    
    // Pour l'instant, on autorise tout
    return of(true);
  }
}

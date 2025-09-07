import { Injectable } from '@angular/core';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { tap, shareReplay } from 'rxjs/operators';

/**
 * Service de cache intelligent pour optimiser les performances
 */
@Injectable({
  providedIn: 'root'
})
export class CacheService {
  private cache = new Map<string, any>();
  private cacheTimestamps = new Map<string, number>();
  private cacheValidityTime = 5 * 60 * 1000; // 5 minutes
  private maxCacheSize = 100; // Limite de taille du cache

  private memoryUsage = new BehaviorSubject<number>(0);

  /**
   * Met en cache une donnée avec une clé
   */
  set<T>(key: string, data: T, customTTL?: number): void {
    // Vérifier la taille du cache
    if (this.cache.size >= this.maxCacheSize) {
      this.evictOldestEntries();
    }

    this.cache.set(key, data);
    this.cacheTimestamps.set(key, Date.now());
    this.updateMemoryUsage();

    // Auto-expiration
    const ttl = customTTL || this.cacheValidityTime;
    setTimeout(() => {
      this.delete(key);
    }, ttl);
  }

  /**
   * Récupère une donnée du cache
   */
  get<T>(key: string): T | null {
    if (!this.cache.has(key)) {
      return null;
    }

    const timestamp = this.cacheTimestamps.get(key);
    if (!timestamp || (Date.now() - timestamp) > this.cacheValidityTime) {
      this.delete(key);
      return null;
    }

    return this.cache.get(key) as T;
  }

  /**
   * Supprime une entrée du cache
   */
  delete(key: string): void {
    this.cache.delete(key);
    this.cacheTimestamps.delete(key);
    this.updateMemoryUsage();
  }

  /**
   * Vide complètement le cache
   */
  clear(): void {
    this.cache.clear();
    this.cacheTimestamps.clear();
    this.updateMemoryUsage();
  }

  /**
   * Cache une Observable et la retourne
   */
  cacheObservable<T>(key: string, observable: Observable<T>): Observable<T> {
    const cached = this.get<T>(key);
    if (cached) {
      return of(cached);
    }

    return observable.pipe(
      tap(data => this.set(key, data)),
      shareReplay(1)
    );
  }

  /**
   * Supprime les entrées les plus anciennes
   */
  private evictOldestEntries(): void {
    const entries = Array.from(this.cacheTimestamps.entries())
      .sort((a, b) => a[1] - b[1])
      .slice(0, Math.floor(this.maxCacheSize * 0.3)); // Supprimer 30% des plus anciennes

    entries.forEach(([key]) => this.delete(key));
  }

  /**
   * Met à jour l'utilisation mémoire estimée
   */
  private updateMemoryUsage(): void {
    const estimatedSize = this.cache.size * 1024; // Estimation approximative
    this.memoryUsage.next(estimatedSize);
  }

  /**
   * Retourne les statistiques du cache
   */
  getStats(): any {
    return {
      size: this.cache.size,
      memoryUsage: this.memoryUsage.value,
      maxSize: this.maxCacheSize
    };
  }

  /**
   * Observable pour surveiller l'utilisation mémoire
   */
  get memoryUsage$(): Observable<number> {
    return this.memoryUsage.asObservable();
  }
}

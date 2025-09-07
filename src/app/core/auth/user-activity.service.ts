import { Injectable } from '@angular/core';
import { BehaviorSubject, fromEvent, merge, timer } from 'rxjs';
import { debounceTime, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class UserActivityService {
  private readonly INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 minutes (réduit pour plus de réactivité)
  private readonly LONG_INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes (réduit pour plus de réactivité)

  private lastActivity = new Date();
  private activityTimer?: any;
  private longInactivityTimer?: any;

  // Observable pour l'état d'activité
  private inactivitySubject = new BehaviorSubject<boolean>(false);
  public inactivity$ = this.inactivitySubject.asObservable();

  // Observable pour l'inactivité prolongée
  private longInactivitySubject = new BehaviorSubject<boolean>(false);
  public longInactivity$ = this.longInactivitySubject.asObservable();

  constructor() {
    this.initializeActivityDetection();
  }

  /**
   * Initialise la détection d'activité utilisateur
   */
  private initializeActivityDetection(): void {
    // Événements à surveiller pour détecter l'activité
    const activityEvents = [
      'mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'touchmove',
      'click', 'keydown', 'keyup', 'focus', 'blur'
    ];

    // Créer un observable qui écoute tous les événements d'activité
    const activityObservable = merge(
      ...activityEvents.map(event => fromEvent(document, event))
    );

    // Débouncer les événements pour éviter trop d'appels
    activityObservable.pipe(
      debounceTime(1000), // Attendre 1 seconde entre les événements
      tap(() => this.onUserActivity())
    ).subscribe();

    // Démarrer le timer d'inactivité
    this.resetInactivityTimer();
  }

  /**
   * Appelé quand une activité utilisateur est détectée
   */
  private onUserActivity(): void {
    this.lastActivity = new Date();
    
    // Réinitialiser l'état d'inactivité si l'utilisateur était inactif
    if (this.inactivitySubject.value) {
      this.inactivitySubject.next(false);
    }
    
    if (this.longInactivitySubject.value) {
      this.longInactivitySubject.next(false);
    }

    // Réinitialiser les timers
    this.resetInactivityTimer();
  }

  /**
   * Réinitialise le timer d'inactivité
   */
  private resetInactivityTimer(): void {
    // Nettoyer les timers existants
    if (this.activityTimer) {
      clearTimeout(this.activityTimer);
    }
    if (this.longInactivityTimer) {
      clearTimeout(this.longInactivityTimer);
    }

    // Timer pour inactivité normale (15 minutes)
    this.activityTimer = setTimeout(() => {
      this.inactivitySubject.next(true);
      console.log('⏰ Utilisateur inactif depuis 15 minutes');
    }, this.INACTIVITY_TIMEOUT);

    // Timer pour inactivité prolongée (30 minutes) 
    this.longInactivityTimer = setTimeout(() => {
      this.longInactivitySubject.next(true);
      console.log('🔒 Utilisateur inactif depuis 30 minutes - Lock screen recommandé');
    }, this.LONG_INACTIVITY_TIMEOUT);
  }

  /**
   * Obtient le temps depuis la dernière activité en millisecondes
   */
  getTimeSinceLastActivity(): number {
    return new Date().getTime() - this.lastActivity.getTime();
  }

  /**
   * Vérifie si l'utilisateur est inactif
   */
  isUserInactive(): boolean {
    return this.inactivitySubject.value;
  }

  /**
   * Vérifie si l'utilisateur a une inactivité prolongée
   */
  isUserLongInactive(): boolean {
    return this.longInactivitySubject.value;
  }

  /**
   * Force le reset de l'activité (utile pour les connexions, etc.)
   */
  forceActivityReset(): void {
    this.onUserActivity();
  }

  /**
   * Arrête la détection d'activité
   */
  stopActivityDetection(): void {
    if (this.activityTimer) {
      clearTimeout(this.activityTimer);
    }
    if (this.longInactivityTimer) {
      clearTimeout(this.longInactivityTimer);
    }
  }
}

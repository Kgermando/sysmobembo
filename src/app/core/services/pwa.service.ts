import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { SwUpdate } from '@angular/service-worker';
import { BehaviorSubject, Observable } from 'rxjs';

export interface PwaUpdateInfo {
  available: boolean;
  currentVersion?: any;
  latestVersion?: any;
  timestamp: Date;
}

@Injectable({
  providedIn: 'root'
})
export class PwaService {
  private updateAvailableSubject = new BehaviorSubject<PwaUpdateInfo>({
    available: false,
    timestamp: new Date()
  });

  public updateAvailable$ = this.updateAvailableSubject.asObservable();
  private readonly UPDATE_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes
  private readonly STORAGE_KEY = 'pwa_update_info';

  constructor(
    @Inject(PLATFORM_ID) private platformId: any,
    private swUpdate: SwUpdate
  ) {
    this.initializePwaFeatures();
  }

  /**
   * Initialise les fonctionnalités PWA
   */
  private initializePwaFeatures(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.setupServiceWorker();
    this.setupPeriodicUpdateCheck();
    this.checkStoredUpdateInfo();
  }

  /**
   * Configure le Service Worker
   */
  private setupServiceWorker(): void {
    if (!this.swUpdate.isEnabled) {
      console.log('🔧 Service Worker désactivé');
      return;
    }

    console.log('🚀 Configuration du Service Worker...');

    // Écouter les mises à jour de version
    this.swUpdate.versionUpdates.subscribe((event) => {
      console.log('📦 Événement de version PWA:', event);
      
      switch (event.type) {
        case 'VERSION_DETECTED':
          console.log('🔍 Nouvelle version détectée');
          break;
          
        case 'VERSION_READY':
          this.handleVersionReady(event);
          break;
          
        case 'VERSION_INSTALLATION_FAILED':
          console.error('❌ Échec installation PWA:', event.error);
          break;
      }
    });

    // Écouter les erreurs non récupérables
    this.swUpdate.unrecoverable.subscribe((event) => {
      console.error('💥 Erreur PWA non récupérable:', event);
      this.handleUnrecoverableError();
    });
  }

  /**
   * Gère quand une nouvelle version est prête
   */
  private handleVersionReady(event: any): void {
    const updateInfo: PwaUpdateInfo = {
      available: true,
      currentVersion: event.currentVersion,
      latestVersion: event.latestVersion,
      timestamp: new Date()
    };

    // Mettre à jour le subject
    this.updateAvailableSubject.next(updateInfo);

    // Sauvegarder en localStorage
    this.storeUpdateInfo(updateInfo);

    console.log('✅ Nouvelle version PWA prête:', updateInfo);
  }

  /**
   * Vérifie manuellement les mises à jour
   */
  public checkForUpdate(): Promise<boolean> {
    if (!this.swUpdate.isEnabled) {
      return Promise.resolve(false);
    }

    console.log('🔄 Vérification manuelle des mises à jour PWA...');
    
    return this.swUpdate.checkForUpdate().then((hasUpdate) => {
      console.log(hasUpdate ? '📱 Mise à jour trouvée' : '✅ PWA à jour');
      return hasUpdate;
    }).catch((error) => {
      console.error('❌ Erreur vérification PWA:', error);
      return false;
    });
  }

  /**
   * Active la mise à jour
   */
  public activateUpdate(): Promise<boolean> {
    if (!this.swUpdate.isEnabled) {
      return Promise.resolve(false);
    }

    console.log('⚡ Activation de la mise à jour PWA...');
    
    return this.swUpdate.activateUpdate().then(() => {
      console.log('✅ Mise à jour PWA activée');
      this.clearStoredUpdateInfo();
      return true;
    }).catch((error) => {
      console.error('❌ Erreur activation PWA:', error);
      return false;
    });
  }

  /**
   * Redémarre l'application après mise à jour
   */
  public reloadApp(): void {
    console.log('🔄 Redémarrage de l\'application...');
    window.location.reload();
  }

  /**
   * Configuration de la vérification périodique
   */
  private setupPeriodicUpdateCheck(): void {
    // Vérification initiale après 10 secondes
    setTimeout(() => {
      this.checkForUpdate();
    }, 10000);

    // Vérifications périodiques
    setInterval(() => {
      this.checkForUpdate();
    }, this.UPDATE_CHECK_INTERVAL);
  }

  /**
   * Sauvegarde les informations de mise à jour
   */
  private storeUpdateInfo(updateInfo: PwaUpdateInfo): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updateInfo));
    } catch (error) {
      console.error('❌ Erreur sauvegarde info PWA:', error);
    }
  }

  /**
   * Récupère les informations de mise à jour stockées
   */
  private checkStoredUpdateInfo(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const updateInfo: PwaUpdateInfo = JSON.parse(stored);
        this.updateAvailableSubject.next(updateInfo);
        console.log('📋 Info mise à jour PWA récupérée:', updateInfo);
      }
    } catch (error) {
      console.error('❌ Erreur lecture info PWA:', error);
    }
  }

  /**
   * Nettoie les informations de mise à jour stockées
   */
  private clearStoredUpdateInfo(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      this.updateAvailableSubject.next({
        available: false,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('❌ Erreur nettoyage info PWA:', error);
    }
  }

  /**
   * Gère les erreurs non récupérables
   */
  private handleUnrecoverableError(): void {
    console.error('💥 Service Worker en erreur critique');
    
    // Notifier qu'une erreur est survenue
    // Ici vous pourriez afficher une notification à l'utilisateur
  }

  /**
   * Vérifie si l'application peut être installée
   */
  public canInstall(): boolean {
    return isPlatformBrowser(this.platformId) && 'serviceWorker' in navigator;
  }

  /**
   * Vérifie si l'application est en mode standalone (installée)
   */
  public isStandalone(): boolean {
    if (!isPlatformBrowser(this.platformId)) {
      return false;
    }

    return window.matchMedia('(display-mode: standalone)').matches ||
           (window.navigator as any).standalone === true;
  }

  /**
   * Obtient des informations sur l'état PWA
   */
  public getPwaStatus(): {
    isEnabled: boolean;
    isStandalone: boolean;
    canInstall: boolean;
    updateAvailable: boolean;
  } {
    const currentUpdate = this.updateAvailableSubject.value;
    
    return {
      isEnabled: this.swUpdate?.isEnabled || false,
      isStandalone: this.isStandalone(),
      canInstall: this.canInstall(),
      updateAvailable: currentUpdate.available
    };
  }
}

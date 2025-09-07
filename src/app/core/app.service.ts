import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

// Services principaux
import { AuthService } from './auth/auth.service';
import { EntrepriseService } from './services/entreprise.service';
import { RhService } from './services/rh.service';
import { FinanceService } from './services/finance.service';
import { ComptaService } from './services/compta.service';
import { JournalComptableService } from './services/journal-comptable.service';

/**
 * Interface pour les statistiques globales
 */
export interface GlobalStats {
  entreprise: {
    totalEmployes: number;
    totalDepartements: number;
    totalUtilisateurs: number;
    chiffreAffaires: number;
  };
  rh: {
    totalEmployes: number;
    totalConges: number;
    totalPointages: number;
    masseSalariale: number;
  };
  finance: {
    totalTresorerie: number;
    totalImpots: number;
    totalImmobilisations: number;
    resultats: number;
  };
  compta: {
    totalEcritures: number;
    totalBudgets: number;
    totalCentresCout: number;
    equilibre: boolean;
  };
}

/**
 * Interface pour les alertes système
 */
export interface SystemAlert {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  module: string;
  action?: string;
}

/**
 * Interface pour les notifications
 */
export interface Notification {
  id: string;
  userId: string;
  type: 'rh' | 'finance' | 'compta' | 'system';
  title: string;
  message: string;
  data?: any;
  isRead: boolean;
  createdAt: Date;
}

/**
 * Interface pour les paramètres système
 */
export interface SystemSettings {
  general: {
    timezone: string;
    language: string;
    currency: string;
    dateFormat: string;
  };
  rh: {
    heuresTravailParJour: number;
    joursOuvrablesParSemaine: number;
    tauxCotisationsCnss: number;
    tauxCotisationsInpp: number;
  };
  finance: {
    exerciceFiscal: {
      dateDebut: string;
      dateFin: string;
    };
    tauxTva: number;
    tauxImpotProfessionnel: number;
  };
  compta: {
    planComptable: string;
    numerotationAutoEcritures: boolean;
    validationObligatoire: boolean;
  };
}

@Injectable({
  providedIn: 'root'
})
export class AppService {
  private baseUrl = environment.apiUrl;
  
  // Subjects pour les données réactives
  private globalStatsSubject = new BehaviorSubject<GlobalStats | null>(null);
  private alertsSubject = new BehaviorSubject<SystemAlert[]>([]);
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  private systemSettingsSubject = new BehaviorSubject<SystemSettings | null>(null);

  // Observables publics
  public globalStats$ = this.globalStatsSubject.asObservable();
  public alerts$ = this.alertsSubject.asObservable();
  public notifications$ = this.notificationsSubject.asObservable();
  public systemSettings$ = this.systemSettingsSubject.asObservable();

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private entrepriseService: EntrepriseService,
    private rhService: RhService,
    private financeService: FinanceService,
    private comptaService: ComptaService,
    private journalComptableService: JournalComptableService
  ) {
    this.initializeApp();
  }

  /**
   * Initialisation de l'application
   */
  private initializeApp(): void {
    // Charger les données initiales si l'utilisateur est connecté
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.loadGlobalStats();
        this.loadAlerts();
        this.loadNotifications();
        this.loadSystemSettings();
      }
    });
  }

  // =============================================================================
  // GESTION DES STATISTIQUES GLOBALES
  // =============================================================================

  /**
   * Chargement des statistiques globales
   */
  loadGlobalStats(): void {
    this.http.get<any>(`${this.baseUrl}/dashboard/global-stats`)
      .pipe(
        map(response => response.data || response)
      )
      .subscribe({
        next: (stats: GlobalStats) => {
          this.globalStatsSubject.next(stats);
        },
        error: (error) => {
          console.error('Erreur lors du chargement des statistiques globales:', error);
        }
      });
  }

  /**
   * Récupération des statistiques globales
   */
  getGlobalStats(): Observable<GlobalStats> {
    return this.http.get<any>(`${this.baseUrl}/dashboard/global-stats`)
      .pipe(
        map(response => response.data || response),
        tap(stats => this.globalStatsSubject.next(stats))
      );
  }

  /**
   * Rafraîchissement des statistiques
   */
  refreshGlobalStats(): void {
    this.loadGlobalStats();
  }

  // =============================================================================
  // GESTION DES ALERTES SYSTÈME
  // =============================================================================

  /**
   * Chargement des alertes système
   */
  loadAlerts(): void {
    this.http.get<any>(`${this.baseUrl}/system/alerts`)
      .pipe(
        map(response => response.data || response)
      )
      .subscribe({
        next: (alerts: SystemAlert[]) => {
          this.alertsSubject.next(alerts);
        },
        error: (error) => {
          console.error('Erreur lors du chargement des alertes:', error);
        }
      });
  }

  /**
   * Récupération des alertes système
   */
  getAlerts(): Observable<SystemAlert[]> {
    return this.http.get<any>(`${this.baseUrl}/system/alerts`)
      .pipe(
        map(response => response.data || response),
        tap(alerts => this.alertsSubject.next(alerts))
      );
  }

  /**
   * Marquage d'une alerte comme lue
   */
  markAlertAsRead(alertId: string): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/system/alerts/${alertId}/read`, {})
      .pipe(
        tap(() => {
          const currentAlerts = this.alertsSubject.value;
          const updatedAlerts = currentAlerts.map(alert => 
            alert.id === alertId ? { ...alert, isRead: true } : alert
          );
          this.alertsSubject.next(updatedAlerts);
        })
      );
  }

  /**
   * Suppression d'une alerte
   */
  deleteAlert(alertId: string): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/system/alerts/${alertId}`)
      .pipe(
        tap(() => {
          const currentAlerts = this.alertsSubject.value;
          const updatedAlerts = currentAlerts.filter(alert => alert.id !== alertId);
          this.alertsSubject.next(updatedAlerts);
        })
      );
  }

  // =============================================================================
  // GESTION DES NOTIFICATIONS
  // =============================================================================

  /**
   * Chargement des notifications
   */
  loadNotifications(): void {
    this.http.get<any>(`${this.baseUrl}/notifications`)
      .pipe(
        map(response => response.data || response)
      )
      .subscribe({
        next: (notifications: Notification[]) => {
          this.notificationsSubject.next(notifications);
        },
        error: (error) => {
          console.error('Erreur lors du chargement des notifications:', error);
        }
      });
  }

  /**
   * Récupération des notifications
   */
  getNotifications(): Observable<Notification[]> {
    return this.http.get<any>(`${this.baseUrl}/notifications`)
      .pipe(
        map(response => response.data || response),
        tap(notifications => this.notificationsSubject.next(notifications))
      );
  }

  /**
   * Marquage d'une notification comme lue
   */
  markNotificationAsRead(notificationId: string): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/notifications/${notificationId}/read`, {})
      .pipe(
        tap(() => {
          const currentNotifications = this.notificationsSubject.value;
          const updatedNotifications = currentNotifications.map(notification => 
            notification.id === notificationId ? { ...notification, isRead: true } : notification
          );
          this.notificationsSubject.next(updatedNotifications);
        })
      );
  }

  /**
   * Suppression d'une notification
   */
  deleteNotification(notificationId: string): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/notifications/${notificationId}`)
      .pipe(
        tap(() => {
          const currentNotifications = this.notificationsSubject.value;
          const updatedNotifications = currentNotifications.filter(notification => notification.id !== notificationId);
          this.notificationsSubject.next(updatedNotifications);
        })
      );
  }

  /**
   * Comptage des notifications non lues
   */
  getUnreadNotificationsCount(): Observable<number> {
    return this.notifications$.pipe(
      map(notifications => notifications.filter(n => !n.isRead).length)
    );
  }

  // =============================================================================
  // GESTION DES PARAMÈTRES SYSTÈME
  // =============================================================================

  /**
   * Chargement des paramètres système
   */
  loadSystemSettings(): void {
    this.http.get<any>(`${this.baseUrl}/system/settings`)
      .pipe(
        map(response => response.data || response)
      )
      .subscribe({
        next: (settings: SystemSettings) => {
          this.systemSettingsSubject.next(settings);
        },
        error: (error) => {
          console.error('Erreur lors du chargement des paramètres système:', error);
        }
      });
  }

  /**
   * Récupération des paramètres système
   */
  getSystemSettings(): Observable<SystemSettings> {
    return this.http.get<any>(`${this.baseUrl}/system/settings`)
      .pipe(
        map(response => response.data || response),
        tap(settings => this.systemSettingsSubject.next(settings))
      );
  }

  /**
   * Mise à jour des paramètres système
   */
  updateSystemSettings(settings: Partial<SystemSettings>): Observable<SystemSettings> {
    return this.http.put<any>(`${this.baseUrl}/system/settings`, settings)
      .pipe(
        map(response => response.data || response),
        tap(updatedSettings => this.systemSettingsSubject.next(updatedSettings))
      );
  }

  // =============================================================================
  // GESTION DES LOGS ET AUDIT
  // =============================================================================

  /**
   * Récupération des logs d'audit
   */
  getAuditLogs(startDate?: string, endDate?: string, module?: string): Observable<any[]> {
    const params: any = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    if (module) params.module = module;

    return this.http.get<any>(`${this.baseUrl}/audit/logs`, { params })
      .pipe(
        map(response => response.data || response)
      );
  }

  /**
   * Récupération des logs d'activité utilisateur
   */
  getUserActivityLogs(userId?: string, startDate?: string, endDate?: string): Observable<any[]> {
    const params: any = {};
    if (userId) params.userId = userId;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    return this.http.get<any>(`${this.baseUrl}/audit/user-activity`, { params })
      .pipe(
        map(response => response.data || response)
      );
  }

  // =============================================================================
  // UTILITAIRES SYSTÈME
  // =============================================================================

  /**
   * Vérification de la santé du système
   */
  checkSystemHealth(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/system/health`)
      .pipe(
        map(response => response.data || response)
      );
  }

  /**
   * Récupération des informations système
   */
  getSystemInfo(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/system/info`)
      .pipe(
        map(response => response.data || response)
      );
  }

  /**
   * Sauvegarde des données
   */
  backupData(): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/system/backup`, {})
      .pipe(
        map(response => response.data || response)
      );
  }

  /**
   * Restauration des données
   */
  restoreData(backupFile: File): Observable<any> {
    const formData = new FormData();
    formData.append('backup', backupFile);

    return this.http.post<any>(`${this.baseUrl}/system/restore`, formData)
      .pipe(
        map(response => response.data || response)
      );
  }

  /**
   * Nettoyage des données temporaires
   */
  cleanTempData(): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/system/clean-temp`)
      .pipe(
        map(response => response.data || response)
      );
  }

  // =============================================================================
  // GESTION DES SERVICES
  // =============================================================================

  /**
   * Accès au service d'authentification
   */
  get auth(): AuthService {
    return this.authService;
  }

  /**
   * Accès au service entreprise
   */
  get entreprise(): EntrepriseService {
    return this.entrepriseService;
  }

  /**
   * Accès au service RH
   */
  get rh(): RhService {
    return this.rhService;
  }

  /**
   * Accès au service finance
   */
  get finance(): FinanceService {
    return this.financeService;
  }

  /**
   * Accès au service comptabilité
   */
  get compta(): ComptaService {
    return this.comptaService;
  }

  /**
   * Accès au service journal comptable
   */
  get journalComptable(): JournalComptableService {
    return this.journalComptableService;
  }

  // =============================================================================
  // MÉTHODES DE SUPPORT
  // =============================================================================

  /**
   * Initialisation complète de l'application
   */
  initializeFullApp(): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/system/initialize`, {})
      .pipe(
        map(response => response.data || response),
        tap(() => {
          // Recharger toutes les données après l'initialisation
          this.loadGlobalStats();
          this.loadAlerts();
          this.loadNotifications();
          this.loadSystemSettings();
        })
      );
  }

  /**
   * Réinitialisation de l'application
   */
  resetApp(): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/system/reset`, {})
      .pipe(
        map(response => response.data || response),
        tap(() => {
          // Vider les subjects après la réinitialisation
          this.globalStatsSubject.next(null);
          this.alertsSubject.next([]);
          this.notificationsSubject.next([]);
          this.systemSettingsSubject.next(null);
        })
      );
  }

  /**
   * Vérification des mises à jour
   */
  checkForUpdates(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/system/updates`)
      .pipe(
        map(response => response.data || response)
      );
  }

  /**
   * Installation des mises à jour
   */
  installUpdates(): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/system/install-updates`, {})
      .pipe(
        map(response => response.data || response)
      );
  }
}

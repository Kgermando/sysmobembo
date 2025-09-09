import { Injectable } from '@angular/core';
import { Observable, interval } from 'rxjs';
import { switchMap, shareReplay } from 'rxjs/operators';
import { DashboardBaseService } from './dashboard-base.service';

// ===============================
// REALTIME MONITORING INTERFACES
// ===============================

export interface RealtimeStatistics {
  total_migrants: number;
  migrants_aujourdhui: number;
  alertes_actives: number;
  alertes_critiques: number;
  localisations_recentes: number;
  biometries_enregistrees: number;
}

export interface RecentActivity {
  type: 'nouveau_migrant' | 'nouvelle_alerte' | 'nouvelle_localisation';
  description: string;
  timestamp: Date;
  urgence: 'info' | 'danger' | 'critical';
  migrant_id?: string;
}

export interface RealtimeDashboardData {
  statistics: RealtimeStatistics;
  recent_activities: RecentActivity[];
  last_update: Date;
}

export interface AlertByType {
  type_alerte: string;
  count: number;
}

export interface AlertByGravity {
  niveau_gravite: string;
  count: number;
}

export interface AlertEvolution {
  heure: string;
  count: number;
}

export interface RealtimeAlertsData {
  critical_alerts: any[];
  alerts_by_type: AlertByType[];
  alerts_by_gravity: AlertByGravity[];
  alerts_evolution: AlertEvolution[];
  last_update: Date;
}

export interface RecentMovement {
  migrant_uuid: string;
  migrant_nom: string;
  migrant_prenom: string;
  latitude: number;
  longitude: number;
  ville: string;
  pays: string;
  type_mouvement: string;
  date_mouvement: Date;
  methode_capture: string;
}

export interface HotSpot {
  ville: string;
  pays: string;
  count: number;
  migrants_uniques: number;
}

export interface ActiveFlow {
  pays_origine: string;
  pays_destination: string;
  count: number;
  derniere_activite: string;
}

export interface RealtimeMovementsData {
  recent_movements: RecentMovement[];
  hot_spots: HotSpot[];
  active_flows: ActiveFlow[];
  last_update: Date;
}

export interface MigrationStatus {
  statut_migratoire: string;
  count: number;
  pourcentage: number;
}

export interface DailyEvolution {
  date: string;
  count: number;
}

export interface BiometricActivity {
  type_biometrie: string;
  count: number;
  dernier_ajout: Date;
  qualite_moyenne: string;
}

export interface SystemStatus {
  database_status: string;
  api_status: string;
  last_sync: Date;
  total_records: number;
  system_health: string;
  response_time_ms: number;
}

export interface RealtimeStatusData {
  migration_status: MigrationStatus[];
  daily_evolution: DailyEvolution[];
  biometric_activity: BiometricActivity[];
  system_status: SystemStatus;
  last_update: Date;
}

export interface RealtimeUpdate {
  id: string;
  type: 'migrant' | 'alert' | 'geolocation';
  action: 'created' | 'updated' | 'deleted';
  description: string;
  timestamp: Date;
  priority: 'normal' | 'high' | 'critical';
  migrant_id?: string;
}

export interface RealtimeUpdatesData {
  updates: RealtimeUpdate[];
  timestamp: Date;
  count: number;
}

@Injectable({
  providedIn: 'root'
})
export class RealtimeMonitoringService extends DashboardBaseService {

  // Auto-refresh intervals (in milliseconds)
  private readonly DASHBOARD_REFRESH_INTERVAL = 30000; // 30 seconds
  private readonly ALERTS_REFRESH_INTERVAL = 15000;    // 15 seconds
  private readonly MOVEMENTS_REFRESH_INTERVAL = 45000; // 45 seconds
  private readonly STATUS_REFRESH_INTERVAL = 60000;    // 1 minute
  private readonly UPDATES_REFRESH_INTERVAL = 10000;   // 10 seconds

  // ===============================
  // REALTIME DASHBOARD
  // ===============================

  getRealtimeDashboard(): Observable<RealtimeDashboardData> {
    return this.get<RealtimeDashboardData>('/realtime/dashboard');
  }

  getRealtimeDashboardWithAutoRefresh(): Observable<RealtimeDashboardData> {
    return interval(this.DASHBOARD_REFRESH_INTERVAL).pipe(
      switchMap(() => this.getRealtimeDashboard()),
      shareReplay(1)
    );
  }

  // ===============================
  // REALTIME ALERTS MONITORING
  // ===============================

  getRealtimeAlerts(): Observable<RealtimeAlertsData> {
    return this.get<RealtimeAlertsData>('/realtime/alerts');
  }

  getRealtimeAlertsWithAutoRefresh(): Observable<RealtimeAlertsData> {
    return interval(this.ALERTS_REFRESH_INTERVAL).pipe(
      switchMap(() => this.getRealtimeAlerts()),
      shareReplay(1)
    );
  }

  // ===============================
  // REALTIME MOVEMENTS MONITORING
  // ===============================

  getRealtimeMovements(): Observable<RealtimeMovementsData> {
    return this.get<RealtimeMovementsData>('/realtime/movements');
  }

  getRealtimeMovementsWithAutoRefresh(): Observable<RealtimeMovementsData> {
    return interval(this.MOVEMENTS_REFRESH_INTERVAL).pipe(
      switchMap(() => this.getRealtimeMovements()),
      shareReplay(1)
    );
  }

  // ===============================
  // REALTIME STATUS MONITORING
  // ===============================

  getRealtimeStatus(): Observable<RealtimeStatusData> {
    return this.get<RealtimeStatusData>('/realtime/status');
  }

  getRealtimeStatusWithAutoRefresh(): Observable<RealtimeStatusData> {
    return interval(this.STATUS_REFRESH_INTERVAL).pipe(
      switchMap(() => this.getRealtimeStatus()),
      shareReplay(1)
    );
  }

  // ===============================
  // REALTIME UPDATES STREAM
  // ===============================

  getRealtimeUpdates(): Observable<RealtimeUpdatesData> {
    return this.get<RealtimeUpdatesData>('/realtime/updates');
  }

  getRealtimeUpdatesStream(): Observable<RealtimeUpdatesData> {
    return interval(this.UPDATES_REFRESH_INTERVAL).pipe(
      switchMap(() => this.getRealtimeUpdates()),
      shareReplay(1)
    );
  }

  // ===============================
  // UTILITY METHODS
  // ===============================

  /**
   * Formate une date relative (ex: "il y a 5 minutes")
   */
  formatRelativeTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMinutes < 1) {
      return 'À l\'instant';
    } else if (diffMinutes < 60) {
      return `Il y a ${diffMinutes} minute${diffMinutes > 1 ? 's' : ''}`;
    } else if (diffHours < 24) {
      return `Il y a ${diffHours} heure${diffHours > 1 ? 's' : ''}`;
    } else {
      return `Il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
    }
  }

  /**
   * Détermine la couleur basée sur le niveau d'urgence
   */
  getUrgencyColor(urgence: string): string {
    switch (urgence) {
      case 'critical':
        return '#f44336'; // Rouge
      case 'danger':
        return '#ff9800'; // Orange
      case 'info':
      default:
        return '#2196f3'; // Bleu
    }
  }

  /**
   * Détermine l'icône basée sur le type d'activité
   */
  getActivityIcon(type: string): string {
    switch (type) {
      case 'nouveau_migrant':
        return 'person_add';
      case 'nouvelle_alerte':
        return 'warning';
      case 'nouvelle_localisation':
        return 'location_on';
      case 'migrant':
        return 'person';
      case 'alert':
        return 'notification_important';
      case 'geolocation':
        return 'my_location';
      default:
        return 'info';
    }
  }

  /**
   * Calcule le pourcentage de changement
   */
  calculatePercentageChange(current: number, previous: number): {
    percentage: number;
    isPositive: boolean;
    display: string;
  } {
    if (previous === 0) {
      return {
        percentage: current > 0 ? 100 : 0,
        isPositive: current >= 0,
        display: current > 0 ? '+100%' : '0%'
      };
    }

    const percentage = ((current - previous) / previous) * 100;
    const isPositive = percentage >= 0;
    const display = `${isPositive ? '+' : ''}${percentage.toFixed(1)}%`;

    return { percentage, isPositive, display };
  }

  /**
   * Détermine le statut de santé du système
   */
  getSystemHealthStatus(responseTime: number, errorRate: number = 0): {
    status: 'excellent' | 'good' | 'fair' | 'poor';
    color: string;
    description: string;
  } {
    if (responseTime < 100 && errorRate < 1) {
      return {
        status: 'excellent',
        color: '#4caf50',
        description: 'Système optimal'
      };
    } else if (responseTime < 500 && errorRate < 5) {
      return {
        status: 'good',
        color: '#8bc34a',
        description: 'Système fonctionnel'
      };
    } else if (responseTime < 1000 && errorRate < 10) {
      return {
        status: 'fair',
        color: '#ff9800',
        description: 'Performances dégradées'
      };
    } else {
      return {
        status: 'poor',
        color: '#f44336',
        description: 'Problèmes détectés'
      };
    }
  }

  /**
   * Filtre les activités par priorité
   */
  filterActivitiesByPriority(
    activities: RecentActivity[],
    priority: 'info' | 'danger' | 'critical'
  ): RecentActivity[] {
    return activities.filter(activity => activity.urgence === priority);
  }

  /**
   * Groupe les activités par type
   */
  groupActivitiesByType(activities: RecentActivity[]): { [key: string]: RecentActivity[] } {
    return activities.reduce((groups, activity) => {
      const type = activity.type;
      if (!groups[type]) {
        groups[type] = [];
      }
      groups[type].push(activity);
      return groups;
    }, {} as { [key: string]: RecentActivity[] });
  }
}

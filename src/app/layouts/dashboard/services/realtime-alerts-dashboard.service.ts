import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, interval } from 'rxjs';
import { switchMap, shareReplay, map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { DashboardBaseService } from './dashboard-base.service';

// ===============================
// INTERFACES DASHBOARD ALERTES
// ===============================

export interface GeneralAlertsStats {
  total_alerts: number;
  active_alerts: number;
  resolved_alerts: number;
  dismissed_alerts: number;
  expired_alerts: number;
  critical_alerts: number;
  danger_alerts: number;
  warning_alerts: number;
  info_alerts: number;
  resolution_rate: string;
}

export interface AlertsByType {
  type_alerte: string;
  total: number;
  active: number;
  resolved: number;
  critical_count: number;
}

export interface AlertsByGravity {
  niveau_gravite: string;
  count: number;
  active_count: number;
  avg_resolution_hours: number;
}

export interface AlertsByStatus {
  statut: string;
  count: number;
  percentage: number;
}

export interface RecentAlert {
  uuid: string;
  type_alerte: string;
  niveau_gravite: string;
  titre: string;
  description: string;
  statut: string;
  created_at: Date;
  migrant?: {
    nom: string;
    prenom: string;
    numero_identifiant: string;
  };
}

export interface TrendingAlerts {
  last_24h: number;
  last_7_days: number;
  last_30_days: number;
  types_trends: {
    type_alerte: string;
    count_7days: number;
    count_24h: number;
  }[];
}

export interface GeographicAlert {
  pays: string;
  ville: string;
  alert_count: number;
  critical_count: number;
  active_count: number;
}

export interface MigrantAtRisk {
  uuid: string;
  nom: string;
  prenom: string;
  numero_identifiant: string;
  total_alerts: number;
  active_alerts: number;
  critical_alerts: number;
  last_alert_date: Date;
}

export interface ResolutionMetrics {
  total_resolved: number;
  avg_resolution_hours: string;
  metrics_by_gravity: {
    niveau_gravite: string;
    total_resolved: number;
    avg_hours: number;
  }[];
}

export interface AlertTimeline {
  date: string;
  total_alerts: number;
  critical_alerts: number;
  security_alerts: number;
  health_alerts: number;
  legal_alerts: number;
  admin_alerts: number;
  humanitarian_alerts: number;
}

export interface PerformanceMetrics {
  response_metrics: {
    type_alerte: string;
    total_alerts: number;
    resolved_count: number;
    avg_response_hours: number;
    min_response_hours: number;
    max_response_hours: number;
  }[];
  alertes_en_retard: number;
  monthly_resolution: {
    month: string;
    total_alerts: number;
    resolved_alerts: number;
    resolution_rate: number;
  }[];
}

export interface RealtimeDashboardData {
  timestamp: Date;
  general_stats: GeneralAlertsStats;
  alerts_by_type: AlertsByType[];
  alerts_by_gravity: AlertsByGravity[];
  alerts_by_status: AlertsByStatus[];
  recent_alerts: RecentAlert[];
  critical_alerts: RecentAlert[];
  expired_alerts: RecentAlert[];
  trending_alerts: TrendingAlerts;
  geographic_alerts: GeographicAlert[];
  migrants_at_risk: MigrantAtRisk[];
  resolution_metrics: ResolutionMetrics;
  alert_timeline: AlertTimeline[];
  performance_metrics: PerformanceMetrics;
}

export interface HeatmapData {
  latitude: number;
  longitude: number;
  pays: string;
  ville: string;
  alert_intensity: number;
  critical_intensity: number;
  alert_types: string;
}

export interface AlertNotification {
  uuid: string;
  titre: string;
  type_alerte: string;
  niveau_gravite: string;
  created_at: Date;
  statut: string;
  nom: string;
  prenom: string;
  numero_identifiant: string;
  priority: 'urgent' | 'nouvelle' | 'expirée' | 'normale';
}

export interface BulkUpdateRequest {
  alert_uuids: string[];
  action: 'resolve' | 'dismiss' | 'reactivate';
  comment?: string;
}

export interface BulkUpdateResponse {
  status: string;
  message: string;
  updated_count: number;
  action_performed: string;
}

export interface AlertsExportData {
  uuid: string;
  created_at: Date;
  type_alerte: string;
  niveau_gravite: string;
  titre: string;
  description: string;
  statut: string;
  date_resolution?: Date;
  commentaire_resolution?: string;
  personne_responsable?: string;
  numero_identifiant: string;
  nom: string;
  prenom: string;
  nationalite: string;
  statut_migratoire: string;
  localisation_pays?: string;
  localisation_ville?: string;
  latitude?: number;
  longitude?: number;
}

// ===============================
// SERVICE DASHBOARD ALERTES
// ===============================

@Injectable({
  providedIn: 'root'
})
export class RealtimeAlertsDashboardService extends DashboardBaseService {
  private dashUrl = `${environment.apiUrl}/alerts`;
  
  // Intervalles de rafraîchissement (en millisecondes)
  private readonly DASHBOARD_REFRESH_INTERVAL = 30000; // 30 secondes
  private readonly NOTIFICATIONS_REFRESH_INTERVAL = 15000; // 15 secondes

  constructor(http: HttpClient) {
    super(http);
  }

  // ===============================
  // DASHBOARD PRINCIPAL
  // ===============================

  getRealtimeDashboard(): Observable<RealtimeDashboardData> {
    return this.get<RealtimeDashboardData>(`${this.dashUrl}/realtime`);
  }

  getRealtimeDashboardWithAutoRefresh(): Observable<RealtimeDashboardData> {
    return interval(this.DASHBOARD_REFRESH_INTERVAL).pipe(
      switchMap(() => this.getRealtimeDashboard()),
      shareReplay(1)
    );
  }

  // ===============================
  // ALERTES PAR PÉRIODE
  // ===============================

  getAlertsByDateRange(
    startDate: string,
    endDate: string,
    filters?: {
      type?: string;
      gravite?: string;
      statut?: string;
    }
  ): Observable<RecentAlert[]> {
    let params = new HttpParams()
      .set('start_date', startDate)
      .set('end_date', endDate);

    if (filters?.type) params = params.set('type', filters.type);
    if (filters?.gravite) params = params.set('gravite', filters.gravite);
    if (filters?.statut) params = params.set('statut', filters.statut);

    return this.http.get<{status: string, data: RecentAlert[], count: number}>(
      `${this.dashUrl}/date-range`,
      { params }
    ).pipe(
      map((response: any) => response.data)
    );
  }

  // ===============================
  // HEATMAP GÉOGRAPHIQUE
  // ===============================

  getAlertsHeatmap(): Observable<HeatmapData[]> {
    return this.http.get<{status: string, data: HeatmapData[]}>(
      `${this.dashUrl}/heatmap`
    ).pipe(
      map((response: any) => response.data)
    );
  }

  // ===============================
  // NOTIFICATIONS TEMPS RÉEL
  // ===============================

  getAlertsNotifications(): Observable<{
    data: AlertNotification[];
    timestamp: Date;
  }> {
    return this.http.get<{
      status: string;
      data: AlertNotification[];
      timestamp: Date;
    }>(`${this.dashUrl}/notifications`).pipe(
      map((response: any) => ({
        data: response.data,
        timestamp: response.timestamp
      }))
    );
  }

  getAlertsNotificationsWithAutoRefresh(): Observable<{
    data: AlertNotification[];
    timestamp: Date;
  }> {
    return interval(this.NOTIFICATIONS_REFRESH_INTERVAL).pipe(
      switchMap(() => this.getAlertsNotifications()),
      shareReplay(1)
    );
  }

  // ===============================
  // ACTIONS EN MASSE
  // ===============================

  bulkUpdateAlerts(request: BulkUpdateRequest): Observable<BulkUpdateResponse> {
    return this.http.put<BulkUpdateResponse>(
      `${this.dashUrl}/bulk-update`,
      request
    );
  }

  bulkResolveAlerts(alertUuids: string[], comment?: string): Observable<BulkUpdateResponse> {
    return this.bulkUpdateAlerts({
      alert_uuids: alertUuids,
      action: 'resolve',
      comment
    });
  }

  bulkDismissAlerts(alertUuids: string[]): Observable<BulkUpdateResponse> {
    return this.bulkUpdateAlerts({
      alert_uuids: alertUuids,
      action: 'dismiss'
    });
  }

  bulkReactivateAlerts(alertUuids: string[]): Observable<BulkUpdateResponse> {
    return this.bulkUpdateAlerts({
      alert_uuids: alertUuids,
      action: 'reactivate'
    });
  }

  // ===============================
  // EXPORT DES DONNÉES
  // ===============================

  exportAlertsData(
    format: 'json' | 'csv' = 'json',
    dateRange?: {
      start_date: string;
      end_date: string;
    }
  ): Observable<{
    data: AlertsExportData[];
    count: number;
    timestamp: Date;
  }> {
    let params = new HttpParams().set('format', format);
    
    if (dateRange) {
      params = params.set('start_date', dateRange.start_date);
      params = params.set('end_date', dateRange.end_date);
    }

    return this.http.get<{
      status: string;
      data: AlertsExportData[];
      count: number;
      timestamp: Date;
    }>(`${this.dashUrl}/export`, { params }).pipe(
      map((response: any) => ({
        data: response.data,
        count: response.count,
        timestamp: response.timestamp
      }))
    );
  }

  // ===============================
  // MÉTHODES UTILITAIRES
  // ===============================

  getGravityColor(niveau: string): string {
    switch (niveau) {
      case 'critical': return 'danger';
      case 'danger': return 'warning';
      case 'warning': return 'info';
      case 'info': return 'success';
      default: return 'secondary';
    }
  }

  getGravityIcon(niveau: string): string {
    switch (niveau) {
      case 'critical': return 'ti-alert-triangle';
      case 'danger': return 'ti-exclamation-triangle';
      case 'warning': return 'ti-info-circle';
      case 'info': return 'ti-check-circle';
      default: return 'ti-circle';
    }
  }

  getTypeIcon(type: string): string {
    switch (type) {
      case 'securite': return 'ti-shield';
      case 'sante': return 'ti-heart';
      case 'juridique': return 'ti-scale';
      case 'administrative': return 'ti-file-text';
      case 'humanitaire': return 'ti-users';
      default: return 'ti-bell';
    }
  }

  getTypeColor(type: string): string {
    switch (type) {
      case 'securite': return 'danger';
      case 'sante': return 'warning';
      case 'juridique': return 'info';
      case 'administrative': return 'primary';
      case 'humanitaire': return 'success';
      default: return 'secondary';
    }
  }

  getPriorityBadgeClass(priority: string): string {
    switch (priority) {
      case 'urgent': return 'badge bg-danger';
      case 'nouvelle': return 'badge bg-warning';
      case 'expirée': return 'badge bg-dark';
      case 'normale': return 'badge bg-info';
      default: return 'badge bg-secondary';
    }
  }

  formatResolutionRate(rate: string): string {
    return rate || '0.00%';
  }

  formatDuration(hours: number): string {
    if (hours < 1) {
      return `${Math.round(hours * 60)}min`;
    } else if (hours < 24) {
      return `${Math.round(hours)}h`;
    } else {
      const days = Math.floor(hours / 24);
      const remainingHours = Math.round(hours % 24);
      return `${days}j ${remainingHours}h`;
    }
  }

  calculatePercentageChange(current: number, previous: number): {
    percentage: number;
    trend: 'up' | 'down' | 'stable';
  } {
    if (previous === 0) {
      return { percentage: 0, trend: 'stable' };
    }

    const percentage = ((current - previous) / previous) * 100;
    
    return {
      percentage: Math.abs(percentage),
      trend: percentage > 5 ? 'up' : percentage < -5 ? 'down' : 'stable'
    };
  }
}
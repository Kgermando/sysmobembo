import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { IAlert } from '../../layouts/models/alert.model';
import { IBackendApiResponse } from '../../layouts/models/migrant.model';
import { DateUtils } from '../../shared/utils/date.utils';

// Interface pour les réponses API backend avec pagination
export interface IBackendPaginationResponse<T> {
  status: string;
  message: string;
  data: T[];
  pagination: {
    total_records: number;
    total_pages: number;
    current_page: number;
    page_size: number;
  };
}

export interface IAlertFormData {
  migrant_uuid: string;
  type_alerte: 'securite' | 'sante' | 'juridique' | 'administrative' | 'humanitaire';
  niveau_gravite: 'info' | 'warning' | 'danger' | 'critical';
  titre: string;
  description: string;
  date_expiration?: string; // Gardé en string pour les formulaires HTML
  action_requise?: string;
  personne_responsable?: string;
}

export interface IAlertFilters {
  search?: string;
  migrant_uuid?: string;
  statut?: string;
  gravite?: string;
  type_alerte?: string;
  niveau_gravite?: string;
  start_date?: string;
  end_date?: string;
}

export interface IAlertStats {
  total_alerts: number;
  active_alerts: number;
  resolved_alerts: number;
  critical_alerts: number;
  expired_alerts: number;
  alert_types: Array<{ type_alerte: string; count: number }>;
  gravity_distribution: Array<{ niveau_gravite: string; count: number }>;
}

@Injectable({
  providedIn: 'root'
})
export class AlertService {
  private apiUrl = `${environment.apiUrl}/alerts`;

  constructor(private http: HttpClient) {}

  // Get paginated alerts
  getPaginatedAlerts(
    page: number = 1,
    limit: number = 15,
    filters: IAlertFilters = {}
  ): Observable<IBackendPaginationResponse<IAlert>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (filters.search) params = params.set('search', filters.search);
    if (filters.migrant_uuid) params = params.set('migrant_uuid', filters.migrant_uuid);
    if (filters.statut) params = params.set('statut', filters.statut);
    if (filters.gravite) params = params.set('gravite', filters.gravite);

    return this.http.get<IBackendPaginationResponse<any>>(`${this.apiUrl}/paginate`, { params })
      .pipe(
        map(response => ({
          ...response,
          data: response.data.map((alert: any) => DateUtils.parseApiDates(alert))
        }))
      );
  }

  // Get all alerts
  getAllAlerts(): Observable<IBackendApiResponse<IAlert[]>> {
    return this.http.get<IBackendApiResponse<IAlert[]>>(`${this.apiUrl}/all`);
  }

  // Get one alert
  getAlert(uuid: string): Observable<IBackendApiResponse<IAlert>> {
    return this.http.get<IBackendApiResponse<IAlert>>(`${this.apiUrl}/get/${uuid}`);
  }

  // Get alerts by migrant with pagination
  getAlertsByMigrant(
    migrantUuid: string,
    page: number = 1,
    limit: number = 15,
    filters: Omit<IAlertFilters, 'migrant_uuid'> = {}
  ): Observable<IBackendPaginationResponse<IAlert>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (filters.search) params = params.set('search', filters.search);
    if (filters.statut) params = params.set('statut', filters.statut);
    if (filters.gravite) params = params.set('gravite', filters.gravite);

    return this.http.get<IBackendPaginationResponse<IAlert>>(`${this.apiUrl}/migrant/${migrantUuid}`, { params })
      .pipe(
        map(response => ({
          ...response,
          data: response.data.map((alert: any) => DateUtils.parseApiDates(alert))
        }))
      );
  }

  // Create alert
  createAlert(alertData: IAlertFormData): Observable<IBackendApiResponse<IAlert>> {
    return this.http.post<IBackendApiResponse<IAlert>>(`${this.apiUrl}/create`, alertData);
  }

  // Update alert
  updateAlert(uuid: string, alertData: Partial<IAlertFormData>): Observable<IBackendApiResponse<IAlert>> {
    return this.http.put<IBackendApiResponse<IAlert>>(`${this.apiUrl}/update/${uuid}`, alertData);
  }

  // Resolve alert
  resolveAlert(uuid: string, resolutionData: {
    comment_resolution: string;
  }): Observable<IBackendApiResponse<IAlert>> {
    return this.http.put<IBackendApiResponse<IAlert>>(`${this.apiUrl}/resolve/${uuid}`, resolutionData);
  }

  // Delete alert
  deleteAlert(uuid: string): Observable<IBackendApiResponse<null>> {
    return this.http.delete<IBackendApiResponse<null>>(`${this.apiUrl}/delete/${uuid}`);
  }

  // Get alerts statistics
  getAlertsStats(): Observable<IBackendApiResponse<IAlertStats>> {
    return this.http.get<IBackendApiResponse<IAlertStats>>(`${this.apiUrl}/stats`);
  }

  // Export alerts to Excel
  exportAlertsToExcel(filters: IAlertFilters = {}): Observable<Blob> {
    let params = new HttpParams();

    if (filters.start_date) params = params.set('start_date', filters.start_date);
    if (filters.end_date) params = params.set('end_date', filters.end_date);

    return this.http.get(`${this.apiUrl}/export/excel`, {
      params,
      responseType: 'blob'
    });
  }
}

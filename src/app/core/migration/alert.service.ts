import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { 
  IAlert, 
  IBackendPaginationResponse, 
  IBackendApiResponse,
  DateUtils 
} from '../../shared/models/migrant.model';

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

    return this.http.get<IBackendPaginationResponse<IAlert>>(`${this.apiUrl}/migrant/${migrantUuid}`, { params });
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
    commentaire_resolution: string;
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
}

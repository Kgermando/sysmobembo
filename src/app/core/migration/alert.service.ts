import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { 
  IAlert, 
  IBackendPaginationResponse, 
  IBackendApiResponse 
} from '../../shared/models/migrant.model';

export interface IAlertFormData {
  migrant_uuid: string;
  type_alerte: string;
  niveau_gravite: string;
  titre: string;
  description: string;
  date_expiration?: string;
  action_requise?: string;
  personne_responsable?: string;
  notifier_autorites: boolean;
  latitude?: number;
  longitude?: number;
  adresse?: string;
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
    migrantUuid?: string,
    typeAlerte?: string,
    niveauGravite?: string,
    statut?: string,
    search?: string
  ): Observable<IBackendPaginationResponse<IAlert>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (migrantUuid) params = params.set('migrant_uuid', migrantUuid);
    if (typeAlerte) params = params.set('type_alerte', typeAlerte);
    if (niveauGravite) params = params.set('gravite', niveauGravite); // Match backend parameter name
    if (statut) params = params.set('statut', statut);
    if (search) params = params.set('search', search);

    return this.http.get<IBackendPaginationResponse<IAlert>>(`${this.apiUrl}/paginate`, { params });
  }

  // Get all alerts
  getAllAlerts(): Observable<IBackendApiResponse<IAlert[]>> {
    return this.http.get<IBackendApiResponse<IAlert[]>>(`${this.apiUrl}/all`);
  }

  // Get one alert
  getAlert(uuid: string): Observable<IBackendApiResponse<IAlert>> {
    return this.http.get<IBackendApiResponse<IAlert>>(`${this.apiUrl}/get/${uuid}`);
  }

  // Get alerts by migrant
  getAlertsByMigrant(migrantUuid: string): Observable<IBackendApiResponse<IAlert[]>> {
    return this.http.get<IBackendApiResponse<IAlert[]>>(`${this.apiUrl}/migrant/${migrantUuid}`);
  }

  // Get active alerts
  getActiveAlerts(): Observable<IBackendApiResponse<IAlert[]>> {
    return this.http.get<IBackendApiResponse<IAlert[]>>(`${this.apiUrl}/active`);
  }

  // Get critical alerts
  getCriticalAlerts(): Observable<IBackendApiResponse<IAlert[]>> {
    return this.http.get<IBackendApiResponse<IAlert[]>>(`${this.apiUrl}/critical`);
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
  getAlertsStats(): Observable<IBackendApiResponse<any>> {
    return this.http.get<IBackendApiResponse<any>>(`${this.apiUrl}/stats`);
  }

  // Get alerts dashboard
  getAlertsDashboard(): Observable<IBackendApiResponse<any>> {
    return this.http.get<IBackendApiResponse<any>>(`${this.apiUrl}/dashboard`);
  }

  // Search alerts with filters
  searchAlerts(filters: {
    type_alerte?: string;
    gravite?: string; // Match backend parameter name
    statut?: string;
    date_from?: string;
    date_to?: string;
  }): Observable<IBackendApiResponse<IAlert[]>> {
    let params = new HttpParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        params = params.set(key, value);
      }
    });

    return this.http.get<IBackendApiResponse<IAlert[]>>(`${this.apiUrl}/search`, { params });
  }

  // Auto expire alerts
  autoExpireAlerts(): Observable<IBackendApiResponse<any>> {
    return this.http.post<IBackendApiResponse<any>>(`${this.apiUrl}/auto-expire`, {});
  }
}

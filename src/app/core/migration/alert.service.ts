import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { 
  IAlert, 
  IPaginationResponse, 
  IApiResponse 
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
    statut?: string
  ): Observable<IPaginationResponse<IAlert>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (migrantUuid) params = params.set('migrant_uuid', migrantUuid);
    if (typeAlerte) params = params.set('type_alerte', typeAlerte);
    if (niveauGravite) params = params.set('niveau_gravite', niveauGravite);
    if (statut) params = params.set('statut', statut);

    return this.http.get<IPaginationResponse<IAlert>>(`${this.apiUrl}/paginate`, { params });
  }

  // Get all alerts
  getAllAlerts(): Observable<IApiResponse<IAlert[]>> {
    return this.http.get<IApiResponse<IAlert[]>>(`${this.apiUrl}/all`);
  }

  // Get one alert
  getAlert(uuid: string): Observable<IApiResponse<IAlert>> {
    return this.http.get<IApiResponse<IAlert>>(`${this.apiUrl}/get/${uuid}`);
  }

  // Get alerts by migrant
  getAlertsByMigrant(migrantUuid: string): Observable<IApiResponse<IAlert[]>> {
    return this.http.get<IApiResponse<IAlert[]>>(`${this.apiUrl}/migrant/${migrantUuid}`);
  }

  // Get active alerts
  getActiveAlerts(): Observable<IApiResponse<IAlert[]>> {
    return this.http.get<IApiResponse<IAlert[]>>(`${this.apiUrl}/active`);
  }

  // Get critical alerts
  getCriticalAlerts(): Observable<IApiResponse<IAlert[]>> {
    return this.http.get<IApiResponse<IAlert[]>>(`${this.apiUrl}/critical`);
  }

  // Create alert
  createAlert(alertData: IAlertFormData): Observable<IApiResponse<IAlert>> {
    return this.http.post<IApiResponse<IAlert>>(`${this.apiUrl}/create`, alertData);
  }

  // Update alert
  updateAlert(uuid: string, alertData: Partial<IAlertFormData>): Observable<IApiResponse<IAlert>> {
    return this.http.put<IApiResponse<IAlert>>(`${this.apiUrl}/update/${uuid}`, alertData);
  }

  // Resolve alert
  resolveAlert(uuid: string, resolutionData: {
    commentaire_resolution: string;
  }): Observable<IApiResponse<IAlert>> {
    return this.http.put<IApiResponse<IAlert>>(`${this.apiUrl}/resolve/${uuid}`, resolutionData);
  }

  // Delete alert
  deleteAlert(uuid: string): Observable<IApiResponse<null>> {
    return this.http.delete<IApiResponse<null>>(`${this.apiUrl}/delete/${uuid}`);
  }

  // Get alerts statistics
  getAlertsStats(): Observable<IApiResponse<any>> {
    return this.http.get<IApiResponse<any>>(`${this.apiUrl}/stats`);
  }

  // Get alerts dashboard
  getAlertsDashboard(): Observable<IApiResponse<any>> {
    return this.http.get<IApiResponse<any>>(`${this.apiUrl}/dashboard`);
  }

  // Search alerts with filters
  searchAlerts(filters: {
    type_alerte?: string;
    niveau_gravite?: string;
    statut?: string;
    date_from?: string;
    date_to?: string;
  }): Observable<IApiResponse<IAlert[]>> {
    let params = new HttpParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        params = params.set(key, value);
      }
    });

    return this.http.get<IApiResponse<IAlert[]>>(`${this.apiUrl}/search`, { params });
  }

  // Auto expire alerts
  autoExpireAlerts(): Observable<IApiResponse<any>> {
    return this.http.post<IApiResponse<any>>(`${this.apiUrl}/auto-expire`, {});
  }
}

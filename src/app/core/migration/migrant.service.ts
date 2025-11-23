import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  IMigrant,
  IMigrantFormData,
  IBackendApiResponse,
  IMigrantStats
} from '../../layouts/models/migrant.model';

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

@Injectable({
  providedIn: 'root'
})
export class MigrantService {
  private apiUrl = `${environment.apiUrl}/migrants`;

  constructor(private http: HttpClient) { }

  // Get paginated migrants
  // Backend only supports 'search' filter which searches across:
  // nom, postnom, prenom, numero_identifiant, nationalite, numero_passeport,
  // adresse_actuelle, ville_actuelle, pays_actuel, situation_matrimoniale
  getPaginatedMigrants(
    page: number = 1,
    limit: number = 15,
    filters?: {
      search?: string;
    }
  ): Observable<IBackendPaginationResponse<IMigrant>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (filters?.search && filters.search.trim() !== '') {
      params = params.set('search', filters.search);
    }

    return this.http.get<IBackendPaginationResponse<IMigrant>>(`${this.apiUrl}/paginate`, { params });
  }

  // Get all migrants
  getAllMigrants(): Observable<IBackendApiResponse<IMigrant[]>> {
    return this.http.get<IBackendApiResponse<IMigrant[]>>(`${this.apiUrl}/all`);
  }

  // Get one migrant by UUID
  getMigrant(uuid: string): Observable<IBackendApiResponse<IMigrant>> {
    return this.http.get<IBackendApiResponse<IMigrant>>(`${this.apiUrl}/get/${uuid}`);
  }

  // Create new migrant
  createMigrant(migrantData: IMigrantFormData): Observable<IBackendApiResponse<IMigrant>> {
    return this.http.post<IBackendApiResponse<IMigrant>>(`${this.apiUrl}/create`, migrantData);
  }

  // Update migrant
  updateMigrant(uuid: string, migrantData: Partial<IMigrantFormData>): Observable<IBackendApiResponse<IMigrant>> {
    return this.http.put<IBackendApiResponse<IMigrant>>(`${this.apiUrl}/update/${uuid}`, migrantData);
  }

  // Delete migrant
  deleteMigrant(uuid: string): Observable<IBackendApiResponse<null>> {
    return this.http.delete<IBackendApiResponse<null>>(`${this.apiUrl}/delete/${uuid}`);
  }

  // Get migrants statistics
  getMigrantsStats(): Observable<IBackendApiResponse<IMigrantStats>> {
    return this.http.get<IBackendApiResponse<IMigrantStats>>(`${this.apiUrl}/stats`);
  }

  // Export migrants to Excel
  // Backend supports start_date and end_date filters for export
  exportMigrantsToExcel(filters: {
    start_date?: string;  // Format: YYYY-MM-DD
    end_date?: string;    // Format: YYYY-MM-DD
  } = {}): Observable<Blob> {
    let params = new HttpParams();

    if (filters.start_date) params = params.set('start_date', filters.start_date);
    if (filters.end_date) params = params.set('end_date', filters.end_date);

    return this.http.get(`${this.apiUrl}/export/excel`, {
      params,
      responseType: 'blob'
    });
  }

  // Remove deprecated getMigrantsByNationality method
  // Use getMigrantsStats() for comprehensive statistics instead

  // Remove deprecated search method
  // searchMigrants(filters: {
  //   nationalite?: string;
  //   statut?: string;
  //   sexe?: string;
  //   date_from?: string;
  //   date_to?: string;
  // }): Observable<IBackendApiResponse<IMigrant[]>> {
  //   let params = new HttpParams();

  //   Object.entries(filters).forEach(([key, value]) => {
  //     if (value) {
  //       params = params.set(key, value);
  //     }
  //   });

  //   return this.http.get<IBackendApiResponse<IMigrant[]>>(`${this.apiUrl}/search`, { params });
  // }
}

export type { IMigrantFormData };

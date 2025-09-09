import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  IMigrant,
  IMigrantFormData,
  IBackendApiResponse,
  IMigrantStats
} from '../../shared/models/migrant.model';

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
  applied_filters?: {
    search?: string;
    statut_migratoire?: string;
    nationalite?: string;
    pays_origine?: string;
    genre?: string;
    actif?: string;
    type_document?: string;
    date_creation_debut?: string;
    date_creation_fin?: string;
    date_naissance_debut?: string;
    date_naissance_fin?: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class MigrantService {
  private apiUrl = `${environment.apiUrl}/migrants`;

  constructor(private http: HttpClient) { }

  // Get paginated migrants with advanced filters
  getPaginatedMigrants(
    page: number = 1,
    limit: number = 15,
    filters?: {
      search?: string;
      statut_migratoire?: string;
      nationalite?: string;
      pays_origine?: string;
      genre?: string;
      actif?: string;
      type_document?: string;
      date_creation_debut?: string;
      date_creation_fin?: string;
      date_naissance_debut?: string;
      date_naissance_fin?: string;
    }
  ): Observable<IBackendPaginationResponse<IMigrant>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value.trim() !== '') {
          params = params.set(key, value);
        }
      });
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

  // Get migrant by numero identifiant
  getMigrantByNumero(numero: string): Observable<IBackendApiResponse<IMigrant>> {
    return this.http.get<IBackendApiResponse<IMigrant>>(`${this.apiUrl}/numero/${numero}`);
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

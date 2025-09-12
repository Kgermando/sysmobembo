import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  IMotifDeplacement,
  IMotifDeplacementFormData,
  IMotifDeplacementStats
} from '../../shared/models/motif-deplacement.model';
import {
  IBackendApiResponse,
  IBackendPaginationResponse
} from '../../shared/models/migrant.model';

@Injectable({
  providedIn: 'root'
})
export class MotifDeplacementService {
  private apiUrl = `${environment.apiUrl}/motif-deplacements`;

  constructor(private http: HttpClient) { }

  // Get paginated motifs with filters
  getPaginatedMotifDeplacements(
    page: number = 1,
    limit: number = 15,
    filters?: {
      search?: string;
      migrant_uuid?: string;
    }
  ): Observable<IBackendPaginationResponse<IMotifDeplacement>> {
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

    return this.http.get<IBackendPaginationResponse<IMotifDeplacement>>(`${this.apiUrl}/paginate`, { params });
  }

  // Get all motifs
  getAllMotifDeplacements(): Observable<IBackendApiResponse<IMotifDeplacement[]>> {
    return this.http.get<IBackendApiResponse<IMotifDeplacement[]>>(`${this.apiUrl}/all`);
  }

  // Get one motif by UUID
  getMotifDeplacement(uuid: string): Observable<IBackendApiResponse<IMotifDeplacement>> {
    return this.http.get<IBackendApiResponse<IMotifDeplacement>>(`${this.apiUrl}/get/${uuid}`);
  }

  // Get motifs by migrant with pagination
  getMotifsByMigrant(
    migrantUuid: string,
    page: number = 1,
    limit: number = 15,
    search?: string
  ): Observable<IBackendPaginationResponse<IMotifDeplacement>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (search && search.trim() !== '') {
      params = params.set('search', search);
    }

    return this.http.get<IBackendPaginationResponse<IMotifDeplacement>>(`${this.apiUrl}/migrant/${migrantUuid}`, { params });
  }

  // Create new motif
  createMotifDeplacement(motifData: IMotifDeplacementFormData): Observable<IBackendApiResponse<IMotifDeplacement>> {
    return this.http.post<IBackendApiResponse<IMotifDeplacement>>(`${this.apiUrl}/create`, motifData);
  }

  // Update motif
  updateMotifDeplacement(uuid: string, motifData: Partial<IMotifDeplacementFormData>): Observable<IBackendApiResponse<IMotifDeplacement>> {
    return this.http.put<IBackendApiResponse<IMotifDeplacement>>(`${this.apiUrl}/update/${uuid}`, motifData);
  }

  // Delete motif
  deleteMotifDeplacement(uuid: string): Observable<IBackendApiResponse<null>> {
    return this.http.delete<IBackendApiResponse<null>>(`${this.apiUrl}/delete/${uuid}`);
  }

  // Get motifs statistics
  getMotifsStats(): Observable<IBackendApiResponse<IMotifDeplacementStats>> {
    return this.http.get<IBackendApiResponse<IMotifDeplacementStats>>(`${this.apiUrl}/stats`);
  }
}

export type { IMotifDeplacementFormData };

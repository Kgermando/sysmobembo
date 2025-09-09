import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { 
  IMotifDeplacement, 
  IPaginationResponse, 
  IApiResponse 
} from '../../shared/models/migrant.model';

export interface IMotifDeplacementFormData {
  code: string;
  libelle_fr: string;
  libelle_en?: string;
  description?: string;
  categorie: string;
  priorite: number;
  actif: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class MotifDeplacementService {
  private apiUrl = `${environment.apiUrl}/motif-deplacements`;

  constructor(private http: HttpClient) {}

  // Get paginated motifs
  getPaginatedMotifs(
    page: number = 1,
    limit: number = 15,
    categorie?: string,
    actif?: string
  ): Observable<IPaginationResponse<IMotifDeplacement>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (categorie) params = params.set('categorie', categorie);
    if (actif) params = params.set('actif', actif);

    return this.http.get<IPaginationResponse<IMotifDeplacement>>(`${this.apiUrl}/paginate`, { params });
  }

  // Get all motifs
  getAllMotifs(): Observable<IApiResponse<IMotifDeplacement[]>> {
    return this.http.get<IApiResponse<IMotifDeplacement[]>>(`${this.apiUrl}/all`);
  }

  // Get one motif
  getMotif(uuid: string): Observable<IApiResponse<IMotifDeplacement>> {
    return this.http.get<IApiResponse<IMotifDeplacement>>(`${this.apiUrl}/get/${uuid}`);
  }

  // Get active motifs only
  getActiveMotifs(): Observable<IApiResponse<IMotifDeplacement[]>> {
    return this.http.get<IApiResponse<IMotifDeplacement[]>>(`${this.apiUrl}/active`);
  }

  // Get motifs by category
  getMotifsByCategory(categorie: string): Observable<IApiResponse<IMotifDeplacement[]>> {
    return this.http.get<IApiResponse<IMotifDeplacement[]>>(`${this.apiUrl}/category/${categorie}`);
  }

  // Get motifs by priority range
  getMotifsByPriority(minPriority?: number, maxPriority?: number): Observable<IApiResponse<IMotifDeplacement[]>> {
    let params = new HttpParams();
    if (minPriority) params = params.set('min_priority', minPriority.toString());
    if (maxPriority) params = params.set('max_priority', maxPriority.toString());

    return this.http.get<IApiResponse<IMotifDeplacement[]>>(`${this.apiUrl}/priority`, { params });
  }

  // Create motif
  createMotif(motifData: IMotifDeplacementFormData): Observable<IApiResponse<IMotifDeplacement>> {
    return this.http.post<IApiResponse<IMotifDeplacement>>(`${this.apiUrl}/create`, motifData);
  }

  // Update motif
  updateMotif(uuid: string, motifData: Partial<IMotifDeplacementFormData>): Observable<IApiResponse<IMotifDeplacement>> {
    return this.http.put<IApiResponse<IMotifDeplacement>>(`${this.apiUrl}/update/${uuid}`, motifData);
  }

  // Activate/Deactivate motif
  toggleMotifStatus(uuid: string, actif: boolean): Observable<IApiResponse<IMotifDeplacement>> {
    return this.http.patch<IApiResponse<IMotifDeplacement>>(`${this.apiUrl}/toggle-status/${uuid}`, { actif });
  }

  // Delete motif
  deleteMotif(uuid: string): Observable<IApiResponse<null>> {
    return this.http.delete<IApiResponse<null>>(`${this.apiUrl}/delete/${uuid}`);
  }

  // Search motifs
  searchMotifs(searchText: string, langue?: 'fr' | 'en'): Observable<IApiResponse<IMotifDeplacement[]>> {
    let params = new HttpParams().set('q', searchText);
    if (langue) params = params.set('lang', langue);

    return this.http.get<IApiResponse<IMotifDeplacement[]>>(`${this.apiUrl}/search`, { params });
  }

  // Get motifs statistics
  getMotifsStats(): Observable<IApiResponse<{
    total: number;
    active: number;
    inactive: number;
    by_category: { [key: string]: number };
    by_priority: { [key: string]: number };
  }>> {
    return this.http.get<IApiResponse<any>>(`${this.apiUrl}/stats`);
  }

  // Validate motif code uniqueness
  validateCode(code: string, excludeUuid?: string): Observable<{ available: boolean; message: string }> {
    let params = new HttpParams().set('code', code);
    if (excludeUuid) params = params.set('exclude', excludeUuid);

    return this.http.get<{ available: boolean; message: string }>(`${this.apiUrl}/validate-code`, { params });
  }

  // Get motif categories
  getCategories(): Observable<IApiResponse<string[]>> {
    return this.http.get<IApiResponse<string[]>>(`${this.apiUrl}/categories`);
  }

  // Bulk update priorities
  updatePriorities(updates: { uuid: string; priorite: number }[]): Observable<IApiResponse<IMotifDeplacement[]>> {
    return this.http.patch<IApiResponse<IMotifDeplacement[]>>(`${this.apiUrl}/bulk-priority`, { updates });
  }
}

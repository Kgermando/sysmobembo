import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  IIdentite,
  IIdentiteFormData,
  IBackendApiResponse,
  IIdentiteStats
} from '../../shared/models/identite.model';

// Interface pour les réponses API backend avec pagination
export interface IBackendPaginationResponse<T> {
  status: string;
  message?: string;
  data: T[];
  pagination: {
    total_records: number;
    total_pages: number;
    current_page: number;
    page_size: number;
  };
}

// Interface pour les données d'un fichier scanné
export interface IScannedFileData {
  file_path: string;
  file_name: string;
  image_base64: string;
  mime_type: string;
}

// Interface pour la réponse du scanner
export interface IScannerResponse {
  status: string;
  message: string;
  data: IScannedFileData;
}

// Interface pour la liste des scanners
export interface IScannerListResponse {
  status: string;
  data: {
    scanners: string[];
    count: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class IdentiteService {
  private apiUrl = `${environment.apiUrl}/identites`;

  constructor(private http: HttpClient) { }

  // Get paginated identites with filters
  getPaginatedIdentites(
    page: number = 1,
    limit: number = 15,
    filters?: {
      search?: string;
      nom?: string;
      postnom?: string;
      prenom?: string;
      nationalite?: string;
      sexe?: string;
      numero_passeport?: string;
    }
  ): Observable<IBackendPaginationResponse<IIdentite>> {
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

    return this.http.get<IBackendPaginationResponse<IIdentite>>(`${this.apiUrl}/paginate`, { params });
  }

  // Get one identite by UUID
  getIdentite(uuid: string): Observable<IBackendApiResponse<IIdentite>> {
    return this.http.get<IBackendApiResponse<IIdentite>>(`${this.apiUrl}/${uuid}`);
  }

  // Create new identite
  createIdentite(identiteData: IIdentiteFormData): Observable<IBackendApiResponse<IIdentite>> {
    return this.http.post<IBackendApiResponse<IIdentite>>(`${this.apiUrl}/create`, identiteData);
  }

  // Update identite
  updateIdentite(uuid: string, identiteData: Partial<IIdentiteFormData>): Observable<IBackendApiResponse<IIdentite>> {
    return this.http.put<IBackendApiResponse<IIdentite>>(`${this.apiUrl}/update/${uuid}`, identiteData);
  }

  // Delete identite
  deleteIdentite(uuid: string): Observable<IBackendApiResponse<null>> {
    return this.http.delete<IBackendApiResponse<null>>(`${this.apiUrl}/delete/${uuid}`);
  }

  // Search identites
  searchIdentites(searchQuery: string): Observable<IBackendApiResponse<IIdentite[]>> {
    let params = new HttpParams().set('q', searchQuery);
    return this.http.get<IBackendApiResponse<IIdentite[]>>(`${this.apiUrl}/search`, { params });
  }

  // Get identites statistics
  getIdentitesStats(): Observable<IBackendApiResponse<IIdentiteStats>> {
    return this.http.get<IBackendApiResponse<IIdentiteStats>>(`${this.apiUrl}/statistics`);
  }

  // Export identites to Excel
  exportIdentitesToExcel(filters: {
    nom?: string;
    postnom?: string;
    prenom?: string;
    nationalite?: string;
    sexe?: string;
  } = {}): Observable<Blob> {
    let params = new HttpParams();

    if (filters.nom) params = params.set('nom', filters.nom);
    if (filters.postnom) params = params.set('postnom', filters.postnom);
    if (filters.prenom) params = params.set('prenom', filters.prenom);
    if (filters.nationalite) params = params.set('nationalite', filters.nationalite);
    if (filters.sexe) params = params.set('sexe', filters.sexe);

    return this.http.get(`${this.apiUrl}/export/excel`, {
      params,
      responseType: 'blob'
    });
  }

  // ==================== SCANNER METHODS ====================

  /**
   * Scan a document using a physical scanner
   * Backend will trigger scanner, capture image, and return base64 encoded image
   */
  scanDocument(): Observable<IScannerResponse> {
    return this.http.post<IScannerResponse>(`${this.apiUrl}/scan`, {});
  }

  /**
   * Get a scanned file by filename
   */
  getScannedFile(filename: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/scanned-file/${filename}`, {
      responseType: 'blob'
    });
  }

  /**
   * List all available scanners connected to the backend server
   */
  listAvailableScanners(): Observable<IScannerListResponse> {
    return this.http.get<IScannerListResponse>(`${this.apiUrl}/scanners/list`);
  }
}

export type { IIdentiteFormData };

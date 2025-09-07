import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { IAppartment, IAppartmentFormData } from '../../shared/models/appartment.model';

/**
 * Interface pour la pagination des appartements
 */
export interface AppartmentPaginationResponse {
  status: string;
  message: string;
  data: IAppartment[];
  pagination: {
    total_records: number;
    total_pages: number;
    current_page: number;
    page_size: number;
  };
}

/**
 * Interface pour la réponse API standard
 */
export interface AppartmentApiResponse {
  status: string;
  message: string;
  data: IAppartment | IAppartment[];
}

@Injectable({
  providedIn: 'root'
})
export class AppartmentService {
  private baseUrl = environment.apiUrl + '/appartments';

  constructor(private http: HttpClient) {}

  /**
   * Récupération paginée de tous les appartements (Manager général)
   */
  getPaginatedAppartments(page: number = 1, limit: number = 15, search: string = ''): Observable<AppartmentPaginationResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString())
      .set('search', search);

    return this.http.get<AppartmentPaginationResponse>(`${this.baseUrl}/all/paginate`, { params });
  }

  /**
   * Récupération paginée des appartements par manager UUID
   */
  getPaginatedAppartmentsByManager(managerUuid: string, page: number = 1, limit: number = 15, search: string = ''): Observable<AppartmentPaginationResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString())
      .set('search', search);

    return this.http.get<AppartmentPaginationResponse>(`${this.baseUrl}/all/${managerUuid}/paginate`, { params });
  }

  /**
   * Récupération de tous les appartements
   */
  getAllAppartments(): Observable<AppartmentApiResponse> {
    return this.http.get<AppartmentApiResponse>(`${this.baseUrl}/all`);
  }

  /**
   * Récupération de tous les appartements par manager UUID
   */
  getAllAppartmentsByManagerUUID(managerUuid: string): Observable<AppartmentApiResponse> {
    return this.http.get<AppartmentApiResponse>(`${this.baseUrl}/all/${managerUuid}`);
  }

  /**
   * Récupération d'un appartement par UUID
   */
  getAppartment(uuid: string): Observable<AppartmentApiResponse> {
    return this.http.get<AppartmentApiResponse>(`${this.baseUrl}/get/${uuid}`);
  }

  /**
   * Création d'un appartement
   */
  createAppartment(appartmentData: IAppartmentFormData): Observable<AppartmentApiResponse> {
    return this.http.post<AppartmentApiResponse>(`${this.baseUrl}/create`, appartmentData);
  }

  /**
   * Mise à jour d'un appartement
   */
  updateAppartment(uuid: string, appartmentData: Partial<IAppartmentFormData>): Observable<AppartmentApiResponse> {
    return this.http.put<AppartmentApiResponse>(`${this.baseUrl}/update/${uuid}`, appartmentData);
  }

  /**
   * Suppression d'un appartement
   */
  deleteAppartment(uuid: string): Observable<AppartmentApiResponse> {
    return this.http.delete<AppartmentApiResponse>(`${this.baseUrl}/delete/${uuid}`);
  }

  /**
   * Méthodes utilitaires pour les statuts
   */
  getStatusLabel(status: string): string {
    const statusLabels: { [key: string]: string } = {
      'available': 'Disponible',
      'occupied': 'Occupé',
      'maintenance': 'En maintenance',
      'unavailable': 'Indisponible'
    };
    return statusLabels[status] || status;
  }

  getStatusBadgeClass(status: string): string {
    const badgeClasses: { [key: string]: string } = {
      'available': 'badge bg-success',
      'occupied': 'badge bg-danger',
      'maintenance': 'badge bg-warning',
      'unavailable': 'badge bg-secondary'
    };
    return badgeClasses[status] || 'badge bg-secondary';
  }

  /**
   * Méthode pour calculer le montant de la garantie
   */
  calculateGarantie(monthlyRent: number, garantieMonth: number): number {
    return monthlyRent * garantieMonth;
  }

  /**
   * Méthode pour formater la surface
   */
  formatSurface(surface: number): string {
    return `${surface} m²`;
  }

  /**
   * Méthode pour formater le prix
   */
  formatPrice(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'CDF'
    }).format(amount);
  }
}

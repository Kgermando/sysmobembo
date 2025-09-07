import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { 
  ICaisse, 
  ICaisseFormData, 
  IAppartmentBalance, 
  IGlobalTotals, 
  IManagerTotals,
  ICurrencyConversion,
  ICurrencyConversionResult
} from '../../shared/models/caisse.model';

/**
 * Interface pour la pagination des caisses
 */
export interface CaissePaginationResponse {
  status: string;
  message: string;
  data: ICaisse[];
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
export interface CaisseApiResponse {
  status: string;
  message: string;
  data: ICaisse | ICaisse[] | IAppartmentBalance | IGlobalTotals | IManagerTotals | ICurrencyConversionResult;
}

@Injectable({
  providedIn: 'root'
})
export class CaisseService {
  private baseUrl = environment.apiUrl + '/caisses';

  constructor(private http: HttpClient) {}

  /**
   * Récupération paginée de toutes les caisses (Manager général)
   */
  getPaginatedCaisses(
    page: number = 1, 
    limit: number = 15, 
    search: string = '',
    startDate?: string,
    endDate?: string
  ): Observable<CaissePaginationResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString())
      .set('search', search);

    if (startDate) {
      params = params.set('start_date', startDate);
    }
    if (endDate) {
      params = params.set('end_date', endDate);
    }

    return this.http.get<CaissePaginationResponse>(`${this.baseUrl}/all/paginate`, { params });
  }

  /**
   * Récupération paginée des caisses par appartement UUID
   */
  getPaginatedCaissesByAppartment(
    appartmentUuid: string,
    page: number = 1, 
    limit: number = 15, 
    search: string = '',
    startDate?: string,
    endDate?: string
  ): Observable<CaissePaginationResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString())
      .set('search', search);

    if (startDate) {
      params = params.set('start_date', startDate);
    }
    if (endDate) {
      params = params.set('end_date', endDate);
    }

    return this.http.get<CaissePaginationResponse>(`${this.baseUrl}/all/${appartmentUuid}/paginate`, { params });
  }

  /**
   * Récupération de toutes les caisses
   */
  getAllCaisses(): Observable<CaisseApiResponse> {
    return this.http.get<CaisseApiResponse>(`${this.baseUrl}/all`);
  }

  /**
   * Récupération de toutes les caisses par appartement UUID
   */
  getAllCaissesByAppartmentUUID(appartmentUuid: string): Observable<CaisseApiResponse> {
    return this.http.get<CaisseApiResponse>(`${this.baseUrl}/all/${appartmentUuid}`);
  }

  /**
   * Récupération d'une caisse par UUID
   */
  getCaisse(uuid: string): Observable<CaisseApiResponse> {
    return this.http.get<CaisseApiResponse>(`${this.baseUrl}/get/${uuid}`);
  }

  /**
   * Création d'une caisse
   */
  createCaisse(caisseData: ICaisseFormData): Observable<CaisseApiResponse> {
    return this.http.post<CaisseApiResponse>(`${this.baseUrl}/create`, caisseData);
  }

  /**
   * Mise à jour d'une caisse
   */
  updateCaisse(uuid: string, caisseData: Partial<ICaisseFormData>): Observable<CaisseApiResponse> {
    return this.http.put<CaisseApiResponse>(`${this.baseUrl}/update/${uuid}`, caisseData);
  }

  /**
   * Suppression d'une caisse
   */
  deleteCaisse(uuid: string): Observable<CaisseApiResponse> {
    return this.http.delete<CaisseApiResponse>(`${this.baseUrl}/delete/${uuid}`);
  }

  /**
   * Récupération de la balance d'un appartement
   */
  getAppartmentBalance(
    appartmentUuid: string,
    startDate?: string,
    endDate?: string
  ): Observable<CaisseApiResponse> {
    let params = new HttpParams();

    if (startDate) {
      params = params.set('start_date', startDate);
    }
    if (endDate) {
      params = params.set('end_date', endDate);
    }

    return this.http.get<CaisseApiResponse>(`${this.baseUrl}/balance/${appartmentUuid}`, { params });
  }

  /**
   * Récupération des totaux globaux
   */
  getGlobalTotals(
    startDate?: string,
    endDate?: string
  ): Observable<CaisseApiResponse> {
    let params = new HttpParams();

    if (startDate) {
      params = params.set('start_date', startDate);
    }
    if (endDate) {
      params = params.set('end_date', endDate);
    }

    return this.http.get<CaisseApiResponse>(`${this.baseUrl}/totals/global`, { params });
  }

  /**
   * Récupération des totaux par manager
   */
  getTotalsByManager(
    managerUuid: string,
    startDate?: string,
    endDate?: string
  ): Observable<CaisseApiResponse> {
    let params = new HttpParams();

    if (startDate) {
      params = params.set('start_date', startDate);
    }
    if (endDate) {
      params = params.set('end_date', endDate);
    }

    return this.http.get<CaisseApiResponse>(`${this.baseUrl}/totals/manager/${managerUuid}`, { params });
  }

  /**
   * Conversion de devises
   */
  convertCurrency(conversionData: ICurrencyConversion): Observable<CaisseApiResponse> {
    return this.http.post<CaisseApiResponse>(`${this.baseUrl}/convert`, conversionData);
  }

  // Méthodes utilitaires

  /**
   * Formate un montant en devise
   */
  formatCurrency(amount: number, currency: 'CDF' | 'USD'): string {
    if (currency === 'USD') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2
      }).format(amount);
    } else {
      return new Intl.NumberFormat('fr-CD', {
        style: 'currency',
        currency: 'CDF',
        minimumFractionDigits: 0
      }).format(amount);
    }
  }

  /**
   * Obtient la classe CSS pour le badge de type
   */
  getTypeBadgeClass(type: string): string {
    switch (type) {
      case 'Income':
        return 'badge badge-success';
      case 'Expense':
        return 'badge badge-danger';
      default:
        return 'badge badge-secondary';
    }
  }

  /**
   * Obtient l'icône pour le type de transaction
   */
  getTypeIcon(type: string): string {
    switch (type) {
      case 'Income':
        return 'fas fa-arrow-up text-success';
      case 'Expense':
        return 'fas fa-arrow-down text-danger';
      default:
        return 'fas fa-exchange-alt text-secondary';
    }
  }

  /**
   * Valide si une date est valide
   */
  isValidDate(dateString: string): boolean {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
  }

  /**
   * Formate une date au format local
   */
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Calcule le pourcentage de variation
   */
  calculatePercentageChange(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  }

  /**
   * Convertit un montant selon le taux de change
   */
  convertAmount(amount: number, rate: number): number {
    return amount * rate;
  }
}

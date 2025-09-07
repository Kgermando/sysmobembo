import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

// Dashboard Interfaces
export interface IDashboardStats {
  // Statistiques générales
  total_apartments: number;
  available_apartments: number;
  occupied_apartments: number;
  maintenance_apartments: number;

  // Statistiques financières
  total_income_cdf: number;
  total_income_usd: number;
  total_expense_cdf: number;
  total_expense_usd: number;
  net_balance_cdf: number;
  net_balance_usd: number;

  // Statistiques de revenus
  monthly_revenue_target: number;
  actual_monthly_revenue: number;
  revenue_percentage: number;

  // Top appartements
  top_apartments_by_revenue: IApartmentRevenue[];

  // Statistiques par manager
  manager_stats: IManagerStats[];
}

export interface IApartmentRevenue {
  uuid: string;
  name: string;
  number: string;
  monthly_rent: number;
  total_revenue: number;
  status: string;
  manager_name: string;
}

export interface IManagerStats {
  manager_uuid: string;
  manager_name: string;
  total_apartments: number;
  available_apartments: number;
  occupied_apartments: number;
  total_income_cdf: number;
  total_income_usd: number;
  total_expense_cdf: number;
  total_expense_usd: number;
  net_balance_cdf: number;
  net_balance_usd: number;
  monthly_revenue_target: number;
}

export interface IMonthlyTrend {
  month: string;
  year: number;
  income_cdf: number;
  income_usd: number;
  expense_cdf: number;
  expense_usd: number;
}

export interface IOccupancyStats {
  total_apartments: number;
  occupied_apartments: number;
  available_apartments: number;
  maintenance_apartments: number;
  occupancy_rate: number;
  availability_rate: number;
  average_rent: number;
  total_potential_revenue: number;
  lost_revenue: number;
}

export interface ITopManager {
  manager_uuid: string;
  manager_name: string;
  total_revenue: number;
  net_profit: number;
  apartment_count: number;
  occupancy_rate: number;
  efficiency: number;
}

export interface IFinancialSummary {
  period: string;
  month?: string;
  quarter?: string;
  year?: number;
  income_cdf: number;
  income_usd: number;
  expense_cdf: number;
  expense_usd: number;
  net_balance_cdf: number;
  net_balance_usd: number;
}

export interface IDashboardFilters {
  manager_uuid?: string;
  start_date?: string;
  end_date?: string;
  period?: 'month' | 'quarter' | 'year';
  months?: number;
  limit?: number;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private apiUrl = `${environment.apiUrl}/dashboard`;

  constructor(private http: HttpClient) { }

  /**
   * Récupère les statistiques principales du dashboard
   */
  getDashboardStats(filters?: IDashboardFilters): Observable<{status: string, message: string, data: IDashboardStats}> {
    let params = new HttpParams();
    
    if (filters?.manager_uuid) {
      params = params.set('manager_uuid', filters.manager_uuid);
    }
    if (filters?.start_date) {
      params = params.set('start_date', filters.start_date);
    }
    if (filters?.end_date) {
      params = params.set('end_date', filters.end_date);
    }

    return this.http.get<{status: string, message: string, data: IDashboardStats}>(`${this.apiUrl}/stats`, { params });
  }

  /**
   * Récupère les tendances mensuelles
   */
  getMonthlyTrends(filters?: IDashboardFilters): Observable<{status: string, message: string, data: IMonthlyTrend[]}> {
    let params = new HttpParams();
    
    if (filters?.manager_uuid) {
      params = params.set('manager_uuid', filters.manager_uuid);
    }
    if (filters?.months) {
      params = params.set('months', filters.months.toString());
    }

    return this.http.get<{status: string, message: string, data: IMonthlyTrend[]}>(`${this.apiUrl}/trends`, { params });
  }

  /**
   * Récupère la comparaison entre managers
   */
  getManagerComparison(filters?: IDashboardFilters): Observable<{status: string, message: string, data: IManagerStats[]}> {
    let params = new HttpParams();
    
    if (filters?.start_date) {
      params = params.set('start_date', filters.start_date);
    }
    if (filters?.end_date) {
      params = params.set('end_date', filters.end_date);
    }

    return this.http.get<{status: string, message: string, data: IManagerStats[]}>(`${this.apiUrl}/managers`, { params });
  }

  /**
   * Récupère la performance des appartements
   */
  getApartmentPerformance(filters?: IDashboardFilters): Observable<{status: string, message: string, data: IApartmentRevenue[]}> {
    let params = new HttpParams();
    
    if (filters?.manager_uuid) {
      params = params.set('manager_uuid', filters.manager_uuid);
    }
    if (filters?.start_date) {
      params = params.set('start_date', filters.start_date);
    }
    if (filters?.end_date) {
      params = params.set('end_date', filters.end_date);
    }
    if (filters?.limit) {
      params = params.set('limit', filters.limit.toString());
    }

    return this.http.get<{status: string, message: string, data: IApartmentRevenue[]}>(`${this.apiUrl}/apartments/performance`, { params });
  }

  /**
   * Récupère le résumé financier
   */
  getFinancialSummary(filters?: IDashboardFilters): Observable<{status: string, message: string, data: IFinancialSummary}> {
    let params = new HttpParams();
    
    if (filters?.manager_uuid) {
      params = params.set('manager_uuid', filters.manager_uuid);
    }
    if (filters?.period) {
      params = params.set('period', filters.period);
    }

    return this.http.get<{status: string, message: string, data: IFinancialSummary}>(`${this.apiUrl}/financial`, { params });
  }

  /**
   * Récupère les statistiques d'occupation
   */
  getOccupancyStats(filters?: IDashboardFilters): Observable<{status: string, message: string, data: IOccupancyStats}> {
    let params = new HttpParams();
    
    if (filters?.manager_uuid) {
      params = params.set('manager_uuid', filters.manager_uuid);
    }

    return this.http.get<{status: string, message: string, data: IOccupancyStats}>(`${this.apiUrl}/occupancy`, { params });
  }

  /**
   * Récupère le classement des meilleurs managers
   */
  getTopManagers(filters?: IDashboardFilters): Observable<{status: string, message: string, data: ITopManager[]}> {
    let params = new HttpParams();
    
    if (filters?.period) {
      params = params.set('period', filters.period);
    }
    if (filters?.limit) {
      params = params.set('limit', filters.limit.toString());
    }

    return this.http.get<{status: string, message: string, data: ITopManager[]}>(`${this.apiUrl}/top-managers`, { params });
  }
}

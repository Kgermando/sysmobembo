import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

export interface ApiResponse<T> {
  status: string;
  data: T;
  message?: string;
}

export interface DashboardError {
  code: string;
  message: string;
  details?: any;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardBaseService {
  protected readonly apiUrl = `${environment.apiUrl}/dashboard`;
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  constructor(protected http: HttpClient) {}

  protected setLoading(loading: boolean): void {
    this.loadingSubject.next(loading);
  }

  protected get<T>(endpoint: string, params?: HttpParams): Observable<T> {
    this.setLoading(true);
    
    return this.http.get<ApiResponse<T>>(`${this.apiUrl}${endpoint}`, { params })
      .pipe(
        map(response => response.data),
        catchError(this.handleError.bind(this)),
        map(data => {
          this.setLoading(false);
          return data;
        })
      );
  }

  protected post<T>(endpoint: string, data: any): Observable<T> {
    this.setLoading(true);
    
    return this.http.post<ApiResponse<T>>(`${this.apiUrl}${endpoint}`, data)
      .pipe(
        map(response => response.data),
        catchError(this.handleError.bind(this)),
        map(result => {
          this.setLoading(false);
          return result;
        })
      );
  }

  protected buildParams(params: { [key: string]: any }): HttpParams {
    let httpParams = new HttpParams();
    
    Object.keys(params).forEach(key => {
      if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
        httpParams = httpParams.set(key, params[key].toString());
      }
    });
    
    return httpParams;
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    this.setLoading(false);
    
    let dashboardError: DashboardError;
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      dashboardError = {
        code: 'CLIENT_ERROR',
        message: 'Une erreur client s\'est produite',
        details: error.error.message
      };
    } else {
      // Server-side error
      dashboardError = {
        code: error.status.toString(),
        message: error.error?.message || 'Une erreur serveur s\'est produite',
        details: error.error
      };
    }
    
    console.error('Dashboard Service Error:', dashboardError);
    return throwError(() => dashboardError);
  }

  // Utility methods for common date ranges
  protected getDateRangeParams(days: number = 30): { [key: string]: any } {
    return {
      days: days.toString()
    };
  }

  protected getLocationParams(
    latitude?: number, 
    longitude?: number, 
    radius?: number
  ): { [key: string]: any } {
    const params: { [key: string]: any } = {};
    
    if (latitude !== undefined) params['latitude'] = latitude.toString();
    if (longitude !== undefined) params['longitude'] = longitude.toString();
    if (radius !== undefined) params['radius'] = radius.toString();
    
    return params;
  }

  protected getPaginationParams(
    page: number = 1, 
    limit: number = 20
  ): { [key: string]: any } {
    return {
      page: page.toString(),
      limit: limit.toString()
    };
  }
}

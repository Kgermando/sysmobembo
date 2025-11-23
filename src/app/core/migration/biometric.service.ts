import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface IBiometricFormData {
  migrant_uuid: string;
  type_biometrie: 'empreinte_digitale' | 'reconnaissance_faciale' | 'iris' | 'scan_retine' | 'signature_numerique';
  index_doigt?: number;
  qualite_donnee?: string;
  donnees_biometriques: string;
  algorithme_encodage: string;
  date_capture: string;
  dispositif_capture?: string;
  resolution_capture?: string;
  operateur_capture?: string;
}

export interface IBiometricStats {
  total_biometrics: number;
  verified_biometrics: number;
  encrypted_biometrics: number;
  biometric_types: Array<{ type_biometrie: string; count: number }>;
  quality_distribution: Array<{ qualite_donnee: string; count: number }>;
  avg_confidence_score: number;
  capture_devices: Array<{ dispositif_capture: string; count: number }>;
}

export interface IBiometricFilters {
  start_date?: string;
  end_date?: string;
}

@Injectable({
  providedIn: 'root'
})
export class BiometricService {
  private apiUrl = `${environment.apiUrl}/biometrics`;

  constructor(private http: HttpClient) {}

  getPaginatedBiometrics(
    page: number = 1,
    limit: number = 15,
    search?: string
  ): Observable<any> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (search) params = params.set('search', search);

    return this.http.get<any>(`${this.apiUrl}/paginate`, { params });
  }

  getAllBiometrics(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/all`);
  }

  getBiometric(uuid: string, includeSensitive: boolean = false): Observable<any> {
    const params = new HttpParams().set('include_sensitive', includeSensitive.toString());
    return this.http.get<any>(`${this.apiUrl}/get/${uuid}`, { params });
  }

  getBiometricsByMigrant(
    migrantUuid: string,
    page: number = 1,
    limit: number = 15
  ): Observable<any> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    return this.http.get<any>(`${this.apiUrl}/migrant/${migrantUuid}`, { params });
  }

  createBiometric(biometricData: IBiometricFormData): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/create`, biometricData);
  }

  updateBiometric(uuid: string, biometricData: Partial<IBiometricFormData>): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/update/${uuid}`, biometricData);
  }

  deleteBiometric(uuid: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/delete/${uuid}`);
  }

  getBiometricsStats(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/stats`);
  }

  exportBiometricsToExcel(filters: IBiometricFilters = {}): Observable<Blob> {
    let params = new HttpParams();

    if (filters.start_date) params = params.set('start_date', filters.start_date);
    if (filters.end_date) params = params.set('end_date', filters.end_date);

    return this.http.get(`${this.apiUrl}/export/excel`, {
      params,
      responseType: 'blob'
    });
  }
}
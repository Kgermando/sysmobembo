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

export interface IBiometricVerificationData {
  score_confiance: number;
  operateur_verification: string;
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
  migrant_uuid?: string;
  type_biometrie?: string;
  qualite_donnee?: string;
  verifie?: string;
  chiffre?: string;
  dispositif_capture?: string;
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
    migrantUuid?: string,
    typeBiometrie?: string,
    verifie?: string
  ): Observable<any> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (migrantUuid) params = params.set('migrant_uuid', migrantUuid);
    if (typeBiometrie) params = params.set('type_biometrie', typeBiometrie);
    if (verifie) params = params.set('verifie', verifie);

    return this.http.get<any>(`${this.apiUrl}/paginate`, { params });
  }

  getAllBiometrics(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/all`);
  }

  getBiometric(uuid: string, includeSensitive: boolean = false): Observable<any> {
    const params = new HttpParams().set('include_sensitive', includeSensitive.toString());
    return this.http.get<any>(`${this.apiUrl}/get/${uuid}`, { params });
  }

  getBiometricsByMigrant(migrantUuid: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/migrant/${migrantUuid}`);
  }

  getVerifiedBiometrics(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/verified`);
  }

  createBiometric(biometricData: IBiometricFormData): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/create`, biometricData);
  }

  verifyBiometric(uuid: string, verificationData: IBiometricVerificationData): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/verify/${uuid}`, verificationData);
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

    if (filters.migrant_uuid) params = params.set('migrant_uuid', filters.migrant_uuid);
    if (filters.type_biometrie) params = params.set('type_biometrie', filters.type_biometrie);
    if (filters.qualite_donnee) params = params.set('qualite_donnee', filters.qualite_donnee);
    if (filters.verifie) params = params.set('verifie', filters.verifie);
    if (filters.chiffre) params = params.set('chiffre', filters.chiffre);
    if (filters.dispositif_capture) params = params.set('dispositif_capture', filters.dispositif_capture);

    return this.http.get(`${this.apiUrl}/export/excel`, {
      params,
      responseType: 'blob'
    });
  }
}
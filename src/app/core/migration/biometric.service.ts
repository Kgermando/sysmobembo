import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { 
  IBiometrie, 
  IPaginationResponse, 
  IApiResponse 
} from '../../shared/models/migrant.model';

export interface IBiometricFormData {
  migrant_uuid: string;
  type_biometrie: 'empreinte_digitale' | 'reconnaissance_faciale' | 'iris' | 'scan_retine' | 'signature_numerique';
  index_doigt?: number;
  qualite_donnee?: string; // Optional, will be auto-assessed if not provided
  donnees_biometriques: string; // Base64 encoded data
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
  biometric_types: Array<{type_biometrie: string; count: number}>;
  quality_distribution: Array<{qualite_donnee: string; count: number}>;
  avg_confidence_score: number;
  capture_devices: Array<{dispositif_capture: string; count: number}>;
}

export interface IBiometricSearchFilters {
  type_biometrie?: string;
  qualite?: string;
  verifie?: string;
  date_from?: string;
  date_to?: string;
  min_confidence?: string;
}

@Injectable({
  providedIn: 'root'
})
export class BiometricService {
  private apiUrl = `${environment.apiUrl}/biometrics`;

  constructor(private http: HttpClient) {}

  // Get paginated biometrics (without sensitive data)
  getPaginatedBiometrics(
    page: number = 1,
    limit: number = 15,
    migrantUuid?: string,
    typeBiometrie?: string,
    verifie?: string
  ): Observable<{
    status: string;
    message: string;
    data: IBiometrie[];
    pagination: {
      total_records: number;
      total_pages: number;
      current_page: number;
      page_size: number;
    };
  }> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (migrantUuid) params = params.set('migrant_uuid', migrantUuid);
    if (typeBiometrie) params = params.set('type_biometrie', typeBiometrie);
    if (verifie) params = params.set('verifie', verifie);

    return this.http.get<{
      status: string;
      message: string;
      data: IBiometrie[];
      pagination: {
        total_records: number;
        total_pages: number;
        current_page: number;
        page_size: number;
      };
    }>(`${this.apiUrl}/paginate`, { params });
  }

  // Get all biometrics (without sensitive data)
  getAllBiometrics(): Observable<{
    status: string;
    message: string;
    data: IBiometrie[];
  }> {
    return this.http.get<{
      status: string;
      message: string;
      data: IBiometrie[];
    }>(`${this.apiUrl}/all`);
  }

  // Get one biometric (with option to include sensitive data)
  getBiometric(uuid: string, includeSensitive: boolean = false): Observable<{
    status: string;
    message: string;
    data: IBiometrie;
  }> {
    const params = new HttpParams().set('include_sensitive', includeSensitive.toString());
    return this.http.get<{
      status: string;
      message: string;
      data: IBiometrie;
    }>(`${this.apiUrl}/get/${uuid}`, { params });
  }

  // Get biometrics by migrant
  getBiometricsByMigrant(migrantUuid: string): Observable<{
    status: string;
    message: string;
    data: IBiometrie[];
  }> {
    return this.http.get<{
      status: string;
      message: string;
      data: IBiometrie[];
    }>(`${this.apiUrl}/migrant/${migrantUuid}`);
  }

  // Get verified biometrics
  getVerifiedBiometrics(): Observable<{
    status: string;
    message: string;
    data: IBiometrie[];
  }> {
    return this.http.get<{
      status: string;
      message: string;
      data: IBiometrie[];
    }>(`${this.apiUrl}/verified`);
  }

  // Create biometric
  createBiometric(biometricData: IBiometricFormData): Observable<{
    status: string;
    message: string;
    data: IBiometrie;
  }> {
    return this.http.post<{
      status: string;
      message: string;
      data: IBiometrie;
    }>(`${this.apiUrl}/create`, biometricData);
  }

  // Verify biometric
  verifyBiometric(uuid: string, verificationData: IBiometricVerificationData): Observable<{
    status: string;
    message: string;
    data: IBiometrie;
  }> {
    return this.http.post<{
      status: string;
      message: string;
      data: IBiometrie;
    }>(`${this.apiUrl}/verify/${uuid}`, verificationData);
  }

  // Update biometric (metadata only)
  updateBiometric(uuid: string, updateData: {
    qualite_donnee?: string;
    dispositif_capture?: string;
    resolution_capture?: string;
    operateur_capture?: string;
  }): Observable<{
    status: string;
    message: string;
    data: IBiometrie;
  }> {
    return this.http.put<{
      status: string;
      message: string;
      data: IBiometrie;
    }>(`${this.apiUrl}/update/${uuid}`, updateData);
  }

  // Delete biometric
  deleteBiometric(uuid: string): Observable<{
    status: string;
    message: string;
    data: null;
  }> {
    return this.http.delete<{
      status: string;
      message: string;
      data: null;
    }>(`${this.apiUrl}/delete/${uuid}`);
  }

  // Get biometrics statistics
  getBiometricsStats(): Observable<{
    status: string;
    message: string;
    data: IBiometricStats;
  }> {
    return this.http.get<{
      status: string;
      message: string;
      data: IBiometricStats;
    }>(`${this.apiUrl}/stats`);
  }

  // Search biometrics with filters
  searchBiometrics(filters: IBiometricSearchFilters): Observable<{
    status: string;
    message: string;
    data: IBiometrie[];
  }> {
    let params = new HttpParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        params = params.set(key, value);
      }
    });

    return this.http.get<{
      status: string;
      message: string;
      data: IBiometrie[];
    }>(`${this.apiUrl}/search`, { params });
  }
}

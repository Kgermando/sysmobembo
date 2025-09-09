import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { 
  IGeolocalisation, 
  IPaginationResponse, 
  IApiResponse 
} from '../../shared/models/migrant.model';

export interface IGeolocationFormData {
  migrant_uuid: string;
  latitude: number;
  longitude: number;
  altitude?: number;
  precision?: number;
  type_localisation: string;
  description?: string;
  adresse?: string;
  ville?: string;
  pays: string;
  code_postal?: string;
  date_enregistrement: string;
  methode_capture: string;
  dispositif_source?: string;
  fiabilite_source: string;
  actif: boolean;
  commentaire?: string;
  type_mouvement?: string;
  duree_sejour?: number;
  prochaine_destination?: string;
}

@Injectable({
  providedIn: 'root'
})
export class GeolocationService {
  private apiUrl = `${environment.apiUrl}/geolocations`;

  constructor(private http: HttpClient) {}

  // Get paginated geolocations
  getPaginatedGeolocations(
    page: number = 1,
    limit: number = 15,
    migrantUuid?: string,
    typeLocalisation?: string,
    pays?: string,
    actif?: string
  ): Observable<IPaginationResponse<IGeolocalisation>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (migrantUuid) params = params.set('migrant_uuid', migrantUuid);
    if (typeLocalisation) params = params.set('type_localisation', typeLocalisation);
    if (pays) params = params.set('pays', pays);
    if (actif) params = params.set('actif', actif);

    return this.http.get<IPaginationResponse<IGeolocalisation>>(`${this.apiUrl}/paginate`, { params });
  }

  // Get all geolocations
  getAllGeolocations(): Observable<IApiResponse<IGeolocalisation[]>> {
    return this.http.get<IApiResponse<IGeolocalisation[]>>(`${this.apiUrl}/all`);
  }

  // Get one geolocation
  getGeolocation(uuid: string): Observable<IApiResponse<IGeolocalisation>> {
    return this.http.get<IApiResponse<IGeolocalisation>>(`${this.apiUrl}/get/${uuid}`);
  }

  // Get geolocations by migrant
  getGeolocationsByMigrant(migrantUuid: string): Observable<IApiResponse<IGeolocalisation[]>> {
    return this.http.get<IApiResponse<IGeolocalisation[]>>(`${this.apiUrl}/migrant/${migrantUuid}`);
  }

  // Get active geolocations
  getActiveGeolocations(): Observable<IApiResponse<IGeolocalisation[]>> {
    return this.http.get<IApiResponse<IGeolocalisation[]>>(`${this.apiUrl}/active`);
  }

  // Get geolocations within radius
  getGeolocationsWithinRadius(
    latitude: number,
    longitude: number,
    radius: number = 10
  ): Observable<IApiResponse<IGeolocalisation[]>> {
    const params = new HttpParams()
      .set('latitude', latitude.toString())
      .set('longitude', longitude.toString())
      .set('radius', radius.toString());

    return this.http.get<IApiResponse<IGeolocalisation[]>>(`${this.apiUrl}/radius`, { params });
  }

  // Create geolocation
  createGeolocation(geoData: IGeolocationFormData): Observable<IApiResponse<IGeolocalisation>> {
    return this.http.post<IApiResponse<IGeolocalisation>>(`${this.apiUrl}/create`, geoData);
  }

  // Update geolocation
  updateGeolocation(uuid: string, geoData: Partial<IGeolocationFormData>): Observable<IApiResponse<IGeolocalisation>> {
    return this.http.put<IApiResponse<IGeolocalisation>>(`${this.apiUrl}/update/${uuid}`, geoData);
  }

  // Validate geolocation
  validateGeolocation(uuid: string, validationData: {
    valide_par: string;
    commentaire: string;
  }): Observable<IApiResponse<IGeolocalisation>> {
    return this.http.put<IApiResponse<IGeolocalisation>>(`${this.apiUrl}/validate/${uuid}`, validationData);
  }

  // Delete geolocation
  deleteGeolocation(uuid: string): Observable<IApiResponse<null>> {
    return this.http.delete<IApiResponse<null>>(`${this.apiUrl}/delete/${uuid}`);
  }

  // Get geolocations statistics
  getGeolocationsStats(): Observable<IApiResponse<any>> {
    return this.http.get<IApiResponse<any>>(`${this.apiUrl}/stats`);
  }

  // Get migration routes
  getMigrationRoutes(): Observable<IApiResponse<any[]>> {
    return this.http.get<IApiResponse<any[]>>(`${this.apiUrl}/migration-routes`);
  }

  // Get hotspots
  getGeolocationHotspots(): Observable<IApiResponse<any[]>> {
    return this.http.get<IApiResponse<any[]>>(`${this.apiUrl}/hotspots`);
  }

  // Search geolocations with filters
  searchGeolocations(filters: {
    type_localisation?: string;
    pays?: string;
    ville?: string;
    methode_capture?: string;
    fiabilite?: string;
    type_mouvement?: string;
    actif?: string;
    date_from?: string;
    date_to?: string;
  }): Observable<IApiResponse<IGeolocalisation[]>> {
    let params = new HttpParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        params = params.set(key, value);
      }
    });

    return this.http.get<IApiResponse<IGeolocalisation[]>>(`${this.apiUrl}/search`, { params });
  }
}

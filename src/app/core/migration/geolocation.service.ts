import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { IGeolocalisation } from '../../layouts/models/geolocalisation.model';
import { IBackendApiResponse } from '../../layouts/models/migrant.model';

export interface IGeolocationFormData {
  identite_uuid: string;
  latitude: number;
  longitude: number;
}

export interface ICoordinateData {
  latitude: number;
  longitude: number;
  fullname: string;
}

@Injectable({
  providedIn: 'root'
})
export class GeolocationService {
  private apiUrl = `${environment.apiUrl}/geolocations`;

  constructor(private http: HttpClient) {}

  // Get coordinates list with full names
  getCoordinatesList(): Observable<IBackendApiResponse<ICoordinateData[]>> {
    return this.http.get<IBackendApiResponse<ICoordinateData[]>>(`${this.apiUrl}/coordinates`);
  }

  // Create geolocation
  createGeolocation(geoData: IGeolocationFormData): Observable<IBackendApiResponse<IGeolocalisation>> {
    return this.http.post<IBackendApiResponse<IGeolocalisation>>(`${this.apiUrl}/create`, geoData);
  }

  // Update geolocation
  updateGeolocation(uuid: string, geoData: Partial<IGeolocationFormData>): Observable<IBackendApiResponse<IGeolocalisation>> {
    return this.http.put<IBackendApiResponse<IGeolocalisation>>(`${this.apiUrl}/update/${uuid}`, geoData);
  }

  // Delete geolocation
  deleteGeolocation(uuid: string): Observable<IBackendApiResponse<null>> {
    return this.http.delete<IBackendApiResponse<null>>(`${this.apiUrl}/delete/${uuid}`);
  }

  // Export geolocations to Excel
  exportGeolocationsToExcel(
    startDate?: string,
    endDate?: string
  ): Observable<Blob> {
    let params = new HttpParams();

    if (startDate) params = params.set('start_date', startDate);
    if (endDate) params = params.set('end_date', endDate);

    return this.http.get(`${this.apiUrl}/export/excel`, {
      params,
      responseType: 'blob'
    });
  }

  // Calculate distance between two points (utility method)
  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const earthRadius = 6371; // Earth radius in kilometers

    // Convert to radians
    const lat1Rad = lat1 * Math.PI / 180;
    const lon1Rad = lon1 * Math.PI / 180;
    const lat2Rad = lat2 * Math.PI / 180;
    const lon2Rad = lon2 * Math.PI / 180;

    // Differences
    const dlat = lat2Rad - lat1Rad;
    const dlon = lon2Rad - lon1Rad;

    // Haversine formula
    const a = Math.sin(dlat/2) * Math.sin(dlat/2) + 
              Math.cos(lat1Rad) * Math.cos(lat2Rad) * 
              Math.sin(dlon/2) * Math.sin(dlon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return earthRadius * c;
  }

  // Validate coordinates
  validateCoordinates(lat: number, lon: number): { valid: boolean; error?: string } {
    if (lat < -90 || lat > 90) {
      return { valid: false, error: 'Latitude must be between -90 and 90 degrees' };
    }
    if (lon < -180 || lon > 180) {
      return { valid: false, error: 'Longitude must be between -180 and 180 degrees' };
    }
    return { valid: true };
  }
}

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { 
  IndicateursDeplacementResponse,
  AlertesTempsReelResponse,
  RepartitionGeographiqueResponse
} from '../interfaces/deplacement.interface';
import { environment } from '../../../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DeplacementService {
  private baseUrl = `${environment.apiUrl}/dashboard/overview`;
 
  constructor(private http: HttpClient) {}

  /**
   * Récupère tous les indicateurs de déplacement
   * GET /api/overview/indicateurs?periode=12&province=
   */
  getIndicateursGeneraux(periode?: number, province?: string): Observable<IndicateursDeplacementResponse> {
    let params = new HttpParams();
    if (periode) params = params.set('periode', periode.toString());
    if (province && province.trim() !== '') params = params.set('province', province);
    
    return this.http.get<IndicateursDeplacementResponse>(`${this.baseUrl}/indicateurs`, { params });
  }

  /**
   * Récupère les alertes en temps réel
   * GET /api/overview/alertes?niveaux=danger,critical&province=&jours=7
   */
  getAlertesTempsReel(niveaux?: string, province?: string, jours?: number): Observable<AlertesTempsReelResponse> {
    let params = new HttpParams();
    if (niveaux && niveaux.trim() !== '') params = params.set('niveaux', niveaux);
    if (province && province.trim() !== '') params = params.set('province', province);
    if (jours) params = params.set('jours', jours.toString());
    
    return this.http.get<AlertesTempsReelResponse>(`${this.baseUrl}/alertes`, { params });
  }

  /**
   * Récupère la répartition géographique détaillée
   * GET /api/overview/repartition?periode=12
   */
  getRepartitionGeographique(periode?: number): Observable<RepartitionGeographiqueResponse> {
    let params = new HttpParams();
    if (periode) params = params.set('periode', periode.toString());
    
    return this.http.get<RepartitionGeographiqueResponse>(`${this.baseUrl}/repartition`, { params });
  }
}
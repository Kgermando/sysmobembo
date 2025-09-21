import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { 
  IndicateursDeplacementResponse,
  VolumeLocalisationIndicateurs,
  CausesDeplacementsIndicateurs,
  RepartitionProvinceStats,
  EvolutionTemporelleStats,
  AlertePrecoceStats
} from '../interfaces/deplacement.interface';
import { environment } from '../../../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DeplacementService {
    private baseUrl = `${environment.apiUrl}/dashboard/deplacement`;
 
  constructor(private http: HttpClient) {}

  /**
   * Récupère tous les indicateurs de déplacement
   */
  getIndicateursGeneraux(periode?: number, province?: string): Observable<IndicateursDeplacementResponse> {
    let params = new HttpParams();
    if (periode) params = params.set('periode', periode.toString());
    if (province) params = params.set('province', province);
    
    return this.http.get<IndicateursDeplacementResponse>(`${this.baseUrl}/analyse`, { params });
  }

  /**
   * Récupère les indicateurs pour une province spécifique
   */
  getIndicateursParProvince(province: string, periode?: number): Observable<IndicateursDeplacementResponse> {
    let params = new HttpParams();
    if (periode) params = params.set('periode', periode.toString());
    
    return this.http.get<IndicateursDeplacementResponse>(`${this.baseUrl}/province/${province}`, { params });
  }

  /**
   * Récupère les tendances d'évolution
   */
  getTendancesEvolution(periode?: number, province?: string): Observable<any> {
    let params = new HttpParams();
    if (periode) params = params.set('periode', periode.toString());
    if (province) params = params.set('province', province);
    
    return this.http.get<any>(`${this.baseUrl}/tendances-evolution`, { params });
  }

  /**
   * Récupère les alertes en temps réel
   */
  getAlertesTempsReel(niveau?: string, province?: string, jours?: number): Observable<any> {
    let params = new HttpParams();
    if (niveau) params = params.set('niveau', niveau);
    if (province) params = params.set('province', province);
    if (jours) params = params.set('jours', jours.toString());
    
    return this.http.get<any>(`${this.baseUrl}/alertes-temps-reel`, { params });
  }

  /**
   * Récupère la répartition géographique détaillée
   */
  getRepartitionGeographique(periode?: number): Observable<any> {
    let params = new HttpParams();
    if (periode) params = params.set('periode', periode.toString());
    
    return this.http.get<any>(`${this.baseUrl}/repartition-geographique-detaillee`, { params });
  }

  /**
   * Récupère l'analyse détaillée des causes
   */
  getAnalyseCausesDetaillees(periode?: number, province?: string): Observable<any> {
    let params = new HttpParams();
    if (periode) params = params.set('periode', periode.toString());
    if (province) params = params.set('province', province);
    
    return this.http.get<any>(`${this.baseUrl}/analyse-causes-detaillees`, { params });
  }
}
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpParams } from '@angular/common/http';
import { DashboardBaseService } from './dashboard-base.service';

// ===============================
// SPATIAL ANALYSIS INTERFACES
// ===============================

export interface SpatialCluster {
  center_latitude: number;
  center_longitude: number;
  radius_km: number;
  migrant_count: number;
  ville: string;
  pays: string;
  density_score: number;
}

export interface HeatmapPoint {
  latitude: number;
  longitude: number;
  intensity: number;
  count: number;
}

export interface SpatialDensityAnalysis {
  clusters: SpatialCluster[];
  heatmap_data: HeatmapPoint[];
  analysis_radius: number;
  analysis_period: number;
  total_clusters: number;
  max_intensity: number;
}

export interface MigrationCorridor {
  ville_origine: string;
  pays_origine: string;
  ville_destination: string;
  pays_destination: string;
  flow_count: number;
  lat_origine: number;
  lon_origine: number;
  lat_destination: number;
  lon_destination: number;
  distance_km: number;
}

export interface TransitPoint {
  ville: string;
  pays: string;
  latitude: number;
  longitude: number;
  transit_count: number;
  unique_routes: number;
  avg_stay_duration_hours: number;
  connectivity_score: number;
}

export interface MigrationCorridorsData {
  corridors: MigrationCorridor[];
  transit_points: TransitPoint[];
  analysis_period: number;
  min_flow_threshold: number;
}

export interface NearbyMigrant {
  migrant_uuid: string;
  migrant_nom: string;
  migrant_prenom: string;
  latitude: number;
  longitude: number;
  distance_km: number;
  ville: string;
  pays: string;
  last_seen: Date;
  type_localisation: string;
}

export interface DensityZone {
  radius_km: number;
  migrant_count: number;
  area_km2: number;
  density: number;
}

export interface ProximityStats {
  search_center: {
    latitude: number;
    longitude: number;
  };
  search_radius_km: number;
  total_migrants: number;
  total_alerts: number;
  analysis_period: number;
  area_km2: number;
  density: number;
}

export interface ProximityAnalysisData {
  nearby_migrants: NearbyMigrant[];
  nearby_alerts: any[];
  density_zones: DensityZone[];
  proximity_stats: ProximityStats;
}

export interface HotZone {
  ville: string;
  pays: string;
  center_latitude: number;
  center_longitude: number;
  activity_count: number;
  unique_migrants: number;
  alert_count: number;
  risk_score: number;
  activity_type: string;
}

export interface BorderZone {
  ville: string;
  pays: string;
  latitude: number;
  longitude: number;
  crossing_count: number;
  unique_migrants: number;
  avg_stay_hours: number;
  security_alerts: number;
  humanitarian_alerts: number;
}

export interface ReceptionCenter {
  ville: string;
  pays: string;
  latitude: number;
  longitude: number;
  current_occupancy: number;
  total_visits: number;
  avg_stay_days: number;
  capacity_stress: number;
}

export interface AreasOfInterestData {
  hot_zones: HotZone[];
  border_zones: BorderZone[];
  reception_centers: ReceptionCenter[];
  analysis_period: number;
  min_activity: number;
}

@Injectable({
  providedIn: 'root'
})
export class SpatialAnalysisService extends DashboardBaseService {

  // ===============================
  // SPATIAL DENSITY ANALYSIS
  // ===============================

  getSpatialDensityAnalysis(params?: {
    radius?: number;
    days?: number;
    min_migrants?: number;
  }): Observable<SpatialDensityAnalysis> {
    const httpParams = this.buildParams({
      radius: params?.radius || 10,
      days: params?.days || 30,
      min_migrants: params?.min_migrants || 3
    });
    
    return this.get<SpatialDensityAnalysis>('/spatial/density', httpParams);
  }

  // ===============================
  // MIGRATION CORRIDORS ANALYSIS
  // ===============================

  getMigrationCorridors(params?: {
    days?: number;
    min_flow?: number;
  }): Observable<MigrationCorridorsData> {
    const httpParams = this.buildParams({
      days: params?.days || 60,
      min_flow: params?.min_flow || 2
    });
    
    return this.get<MigrationCorridorsData>('/spatial/corridors', httpParams);
  }

  // ===============================
  // PROXIMITY ANALYSIS
  // ===============================

  getProximityAnalysis(params: {
    latitude: number;
    longitude: number;
    radius?: number;
    days?: number;
  }): Observable<ProximityAnalysisData> {
    const httpParams = this.buildParams({
      latitude: params.latitude,
      longitude: params.longitude,
      radius: params.radius || 50,
      days: params.days || 30
    });
    
    return this.get<ProximityAnalysisData>('/spatial/proximity', httpParams);
  }

  // ===============================
  // AREAS OF INTEREST ANALYSIS
  // ===============================

  getAreasOfInterest(params?: {
    days?: number;
    min_activity?: number;
  }): Observable<AreasOfInterestData> {
    const httpParams = this.buildParams({
      days: params?.days || 30,
      min_activity: params?.min_activity || 5
    });
    
    return this.get<AreasOfInterestData>('/spatial/areas-of-interest', httpParams);
  }

  // ===============================
  // SPATIAL CALCULATION UTILITIES
  // ===============================

  /**
   * Calcule la distance entre deux points GPS (formule de Haversine)
   */
  calculateDistance(
    lat1: number, 
    lon1: number, 
    lat2: number, 
    lon2: number
  ): number {
    const earthRadius = 6371; // Rayon de la Terre en kilomètres
    
    const lat1Rad = lat1 * Math.PI / 180;
    const lon1Rad = lon1 * Math.PI / 180;
    const lat2Rad = lat2 * Math.PI / 180;
    const lon2Rad = lon2 * Math.PI / 180;

    const dlat = lat2Rad - lat1Rad;
    const dlon = lon2Rad - lon1Rad;

    const a = Math.sin(dlat/2) * Math.sin(dlat/2) + 
              Math.cos(lat1Rad) * Math.cos(lat2Rad) * 
              Math.sin(dlon/2) * Math.sin(dlon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return earthRadius * c;
  }

  /**
   * Calcule l'aire d'un cercle
   */
  calculateCircleArea(radiusKm: number): number {
    return Math.PI * radiusKm * radiusKm;
  }

  /**
   * Calcule la densité (éléments par km²)
   */
  calculateDensity(count: number, areaKm2: number): number {
    return areaKm2 > 0 ? count / areaKm2 : 0;
  }

  /**
   * Détermine si un point est dans un rayon donné
   */
  isPointInRadius(
    centerLat: number,
    centerLon: number,
    pointLat: number,
    pointLon: number,
    radiusKm: number
  ): boolean {
    const distance = this.calculateDistance(centerLat, centerLon, pointLat, pointLon);
    return distance <= radiusKm;
  }

  /**
   * Calcule le centre géographique d'un ensemble de points
   */
  calculateGeographicCenter(points: { latitude: number; longitude: number }[]): {
    latitude: number;
    longitude: number;
  } {
    if (points.length === 0) {
      return { latitude: 0, longitude: 0 };
    }

    const sum = points.reduce(
      (acc, point) => ({
        latitude: acc.latitude + point.latitude,
        longitude: acc.longitude + point.longitude
      }),
      { latitude: 0, longitude: 0 }
    );

    return {
      latitude: sum.latitude / points.length,
      longitude: sum.longitude / points.length
    };
  }

  /**
   * Calcule les bounds (limites) géographiques d'un ensemble de points
   */
  calculateBounds(points: { latitude: number; longitude: number }[]): {
    north: number;
    south: number;
    east: number;
    west: number;
    center: { latitude: number; longitude: number };
  } {
    if (points.length === 0) {
      return { north: 0, south: 0, east: 0, west: 0, center: { latitude: 0, longitude: 0 } };
    }

    const lats = points.map(p => p.latitude);
    const lngs = points.map(p => p.longitude);

    const north = Math.max(...lats);
    const south = Math.min(...lats);
    const east = Math.max(...lngs);
    const west = Math.min(...lngs);

    return {
      north,
      south,
      east,
      west,
      center: {
        latitude: (north + south) / 2,
        longitude: (east + west) / 2
      }
    };
  }

  /**
   * Génère des points pour dessiner un cercle sur une carte
   */
  generateCirclePoints(
    centerLat: number,
    centerLon: number,
    radiusKm: number,
    numPoints: number = 32
  ): { latitude: number; longitude: number }[] {
    const points: { latitude: number; longitude: number }[] = [];
    
    for (let i = 0; i < numPoints; i++) {
      const angle = (i * 2 * Math.PI) / numPoints;
      
      // Approximation simple pour créer un cercle
      const deltaLat = (radiusKm / 111) * Math.cos(angle);
      const deltaLon = (radiusKm / (111 * Math.cos(centerLat * Math.PI / 180))) * Math.sin(angle);
      
      points.push({
        latitude: centerLat + deltaLat,
        longitude: centerLon + deltaLon
      });
    }
    
    return points;
  }

  /**
   * Classifie la densité selon des seuils
   */
  classifyDensity(density: number): {
    level: 'very_low' | 'low' | 'medium' | 'high' | 'very_high';
    label: string;
    color: string;
  } {
    if (density < 0.1) {
      return { level: 'very_low', label: 'Très faible', color: '#e8f5e8' };
    } else if (density < 0.5) {
      return { level: 'low', label: 'Faible', color: '#a5d6a7' };
    } else if (density < 2.0) {
      return { level: 'medium', label: 'Modérée', color: '#ffcc02' };
    } else if (density < 5.0) {
      return { level: 'high', label: 'Élevée', color: '#ff9800' };
    } else {
      return { level: 'very_high', label: 'Très élevée', color: '#f44336' };
    }
  }

  /**
   * Calcule le score de connectivité d'un point de transit
   */
  calculateConnectivityScore(
    transitCount: number,
    uniqueRoutes: number,
    avgStayHours: number
  ): {
    score: number;
    level: 'low' | 'medium' | 'high';
    description: string;
  } {
    let score = 0;
    
    // Score basé sur le nombre de transits (0-40 points)
    score += Math.min(40, (transitCount / 10) * 10);
    
    // Score basé sur la diversité des routes (0-30 points)
    score += Math.min(30, (uniqueRoutes / 5) * 10);
    
    // Score basé sur la durée de séjour optimale (0-30 points)
    const optimalStayHours = 24; // 1 jour
    const stayScore = 30 - Math.abs(avgStayHours - optimalStayHours);
    score += Math.max(0, stayScore);
    
    let level: 'low' | 'medium' | 'high';
    let description: string;
    
    if (score >= 70) {
      level = 'high';
      description = 'Point de transit majeur';
    } else if (score >= 40) {
      level = 'medium';
      description = 'Point de transit modéré';
    } else {
      level = 'low';
      description = 'Point de transit mineur';
    }
    
    return { score: Math.round(score), level, description };
  }
}

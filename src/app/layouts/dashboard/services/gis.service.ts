import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpParams } from '@angular/common/http';
import { DashboardBaseService } from './dashboard-base.service';

// ===============================
// GIS DATA INTERFACES
// ===============================

export interface GISMapConfiguration {
  map_config: {
    default_center: {
      latitude: number;
      longitude: number;
    };
    default_zoom: number;
    min_zoom: number;
    max_zoom: number;
    map_style: string;
    projection: string;
    bounds: {
      north: number;
      south: number;
      east: number;
      west: number;
    };
  };
  available_layers: GISLayer[];
  map_tools: GISMapTool[];
  last_updated: Date;
}

export interface GISLayer {
  layer_id: string;
  layer_name: string;
  layer_type: string;
  category: string;
  visible: boolean;
  style: { [key: string]: any };
}

export interface GISMapTool {
  tool_id: string;
  tool_name: string;
  icon: string;
  enabled: boolean;
}

export interface GISFeature {
  id: string;
  type: string;
  geometry: {
    type: string;
    coordinates: number[] | number[][] | number[][][];
  };
  properties: { [key: string]: any };
}

export interface GISLayerData {
  layer_id: string;
  layer_type: string;
  data: {
    type: string;
    features: GISFeature[];
  };
  count: number;
  timestamp: Date;
}

export interface MigrantLocation {
  migrant_uuid: string;
  migrant_nom: string;
  migrant_prenom: string;
  latitude: number;
  longitude: number;
  ville: string;
  pays: string;
  last_update: Date;
  statut_migrant: string;
  alerte_active: boolean;
  type_location: string;
}

export interface MigrationRoute {
  route_id: string;
  pays_origine: string;
  pays_destination: string;
  lat_origine: number;
  lon_origine: number;
  lat_destination: number;
  lon_destination: number;
  flow_count: number;
  route_type: string;
}

export interface AlertZone {
  alert_uuid: string;
  type_alerte: string;
  niveau_gravite: string;
  latitude: number;
  longitude: number;
  titre: string;
  description: string;
  date_creation: Date;
  statut: string;
  adresse: string;
  radius_meters: number;
}

export interface InfrastructurePoint {
  point_id: string;
  point_type: string;
  nom: string;
  ville: string;
  pays: string;
  latitude: number;
  longitude: number;
  activity_count: number;
  status: string;
  description: string;
}

export interface DensityPoint {
  latitude: number;
  longitude: number;
  weight: number;
}

export interface DensityHeatmapData {
  layer_id: string;
  layer_type: string;
  data: DensityPoint[];
  count: number;
  intensity_type: string;
  analysis_period: number;
  max_weight: number;
  timestamp: Date;
}

export interface GISExportData {
  export_format: string;
  export_layers: string;
  export_date: Date;
  download_url: string;
  file_size_mb: number;
  status: string;
}

@Injectable({
  providedIn: 'root'
})
export class GisService extends DashboardBaseService {

  // ===============================
  // GIS MAP CONFIGURATION
  // ===============================

  getMapConfiguration(): Observable<GISMapConfiguration> {
    return this.get<GISMapConfiguration>('/gis/map-config');
  }

  // ===============================
  // GIS LAYERS DATA
  // ===============================

  getMigrantsLayer(): Observable<GISLayerData> {
    return this.get<GISLayerData>('/gis/migrants-layer');
  }

  getMigrationRoutesLayer(params?: {
    days?: number;
    min_flow?: number;
  }): Observable<GISLayerData> {
    const httpParams = this.buildParams({
      days: params?.days || 30,
      min_flow: params?.min_flow || 3
    });
    
    return this.get<GISLayerData>('/gis/routes-layer', httpParams);
  }

  getAlertZonesLayer(): Observable<GISLayerData> {
    return this.get<GISLayerData>('/gis/alert-zones-layer');
  }

  getInfrastructureLayer(type: 'border_points' | 'reception_centers' | 'all' = 'all'): Observable<GISLayerData> {
    const params = this.buildParams({ type });
    return this.get<GISLayerData>('/gis/infrastructure-layer', params);
  }

  getDensityHeatmapLayer(params?: {
    days?: number;
    intensity?: 'migrant_count' | 'alert_count' | 'movement_count';
  }): Observable<DensityHeatmapData> {
    const httpParams = this.buildParams({
      days: params?.days || 30,
      intensity: params?.intensity || 'migrant_count'
    });
    
    return this.get<DensityHeatmapData>('/gis/density-heatmap-layer', httpParams);
  }

  // ===============================
  // GIS EXPORT FUNCTIONALITY
  // ===============================

  exportGISData(params: {
    format?: 'geojson' | 'kml' | 'shapefile';
    layers?: string;
  }): Observable<GISExportData> {
    const httpParams = this.buildParams({
      format: params.format || 'geojson',
      layers: params.layers || 'all'
    });
    
    return this.get<GISExportData>('/gis/export', httpParams);
  }

  // ===============================
  // UTILITY METHODS
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
   * Convertit des degrés en radians
   */
  degreesToRadians(degrees: number): number {
    return degrees * Math.PI / 180;
  }

  /**
   * Convertit des radians en degrés
   */
  radiansToDegrees(radians: number): number {
    return radians * 180 / Math.PI;
  }

  /**
   * Calcule le centre d'un ensemble de points
   */
  calculateCenter(points: { latitude: number; longitude: number }[]): { latitude: number; longitude: number } {
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
   * Calcule les bounds d'un ensemble de points
   */
  calculateBounds(points: { latitude: number; longitude: number }[]): {
    north: number;
    south: number;
    east: number;
    west: number;
  } {
    if (points.length === 0) {
      return { north: 0, south: 0, east: 0, west: 0 };
    }

    const lats = points.map(p => p.latitude);
    const lngs = points.map(p => p.longitude);

    return {
      north: Math.max(...lats),
      south: Math.min(...lats),
      east: Math.max(...lngs),
      west: Math.min(...lngs)
    };
  }
}

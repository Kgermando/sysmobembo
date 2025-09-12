import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

// Interfaces matching Go API structures
interface CountryStats {
  country: string;
  count: number;
  percent: number;
}

interface StatusStats {
  status: string;
  count: number;
  percent: number;
  color: string;
}

interface MonthlyFlow {
  month: string;
  year: number;
  arrivals: number;
  departures: number;
  net_flow: number;
}

interface Hotspot {
  uuid: string;
  latitude: number;
  longitude: number;
  city: string;
  country: string;
  count: number;
  intensity: number;
  type: string;
  description: string;
}

interface Corridor {
  from_country: string;
  to_country: string;
  from_latitude: number;
  from_longitude: number;
  to_latitude: number;
  to_longitude: number;
  count: number;
  flow_direction: string;
}

interface DensityPoint {
  latitude: number;
  longitude: number;
  density: number;
  radius: number;
}

interface RealTimePosition {
  migrant_uuid: string;
  migrant_name: string;
  latitude: number;
  longitude: number;
  status: string;
  last_update: string;
  city: string;
  country: string;
  movement_type: string;
  risk_level: string;
}

interface RiskZone {
  uuid: string;
  name: string;
  latitude: number;
  longitude: number;
  radius: number;
  risk_level: string;
  risk_score: number;
  factors: string[];
  alert_count: number;
  last_update: string;
}

interface SeasonalPattern {
  month: string;
  average_arrivals: number;
  trend: number;
}

interface RiskPrediction {
  zone: string;
  risk_level: string;
  probability: number;
  factors: string[];
}

interface PredictedHotspot {
  latitude: number;
  longitude: number;
  probability: number;
  timeframe: string;
}

interface PredictiveData {
  next_month_prediction: number;
  trend_direction: string;
  seasonal_patterns: SeasonalPattern[];
  risk_predictions: RiskPrediction[];
  population_growth_rate: number;
  predicted_hotspots: PredictedHotspot[];
}

interface GISStatistics {
  total_migrants: number;
  migrants_by_country: CountryStats[];
  migrants_by_status: StatusStats[];
  migration_flows_by_month: MonthlyFlow[];
  hotspot_locations: Hotspot[];
  migration_corridors: Corridor[];
  density_map: DensityPoint[];
  realtime_positions: RealTimePosition[];
  predictive_analysis: PredictiveData;
  geographic_distribution: any[];
  movement_patterns: any[];
  risk_zones: RiskZone[];
}

interface HeatmapResponse {
  heatmap_data: DensityPoint[];
  metadata: {
    total_points: number;
    generated_at: string;
    type: string;
  };
}

interface LiveDataResponse {
  live_data: RealTimePosition[];
  timestamp: string;
  total_active: number;
}

interface PredictiveInsightsResponse {
  predictive_insights: PredictiveData;
  confidence_level: string;
  analysis_date: string;
}

interface InteractiveMapResponse {
  map_data: {
    hotspots: Hotspot[];
    corridors: Corridor[];
    risk_zones: RiskZone[];
    real_time_positions: RealTimePosition[];
  };
  map_config: {
    center: {
      latitude: number;
      longitude: number;
    };
    zoom: number;
    style: string;
  };
  generated_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class GisDashboardService {
  private readonly apiUrl = `${environment.apiUrl}/api/dashboard/gis`;

  constructor(private http: HttpClient) {}

  /**
   * Récupère toutes les statistiques GIS
   */
  getGISStatistics(): Observable<GISStatistics> {
    return this.http.get<GISStatistics>(`${this.apiUrl}/statistics`);
  }

  /**
   * Récupère les données de la carte de chaleur
   */
  getMigrationHeatmap(): Observable<HeatmapResponse> {
    return this.http.get<HeatmapResponse>(`${this.apiUrl}/heatmap`);
  }

  /**
   * Récupère les données en temps réel
   */
  getLiveMigrationData(): Observable<LiveDataResponse> {
    return this.http.get<LiveDataResponse>(`${this.apiUrl}/live-data`);
  }

  /**
   * Récupère les insights prédictifs
   */
  getPredictiveInsights(): Observable<PredictiveInsightsResponse> {
    return this.http.get<PredictiveInsightsResponse>(`${this.apiUrl}/predictive-insights`);
  }

  /**
   * Récupère les données de la carte interactive
   */
  getInteractiveMap(): Observable<InteractiveMapResponse> {
    return this.http.get<InteractiveMapResponse>(`${this.apiUrl}/interactive-map`);
  }

  // Méthodes utilitaires pour les analyses

  /**
   * Analyse des tendances migratoires
   */
  analyzeMigrationTrends(monthlyFlows: MonthlyFlow[]): {
    trend: 'croissante' | 'décroissante' | 'stable';
    averageMonthlyFlow: number;
    peakMonth: string;
    growthRate: number;
  } {
    if (monthlyFlows.length < 2) {
      return {
        trend: 'stable',
        averageMonthlyFlow: 0,
        peakMonth: '',
        growthRate: 0
      };
    }

    const totalFlow = monthlyFlows.reduce((sum, flow) => sum + flow.net_flow, 0);
    const averageMonthlyFlow = totalFlow / monthlyFlows.length;

    // Trouver le mois de pic
    const peakFlow = monthlyFlows.reduce((max, flow) => 
      flow.net_flow > max.net_flow ? flow : max
    );
    const peakMonth = `${peakFlow.month} ${peakFlow.year}`;

    // Calculer le taux de croissance
    const firstHalf = monthlyFlows.slice(0, Math.floor(monthlyFlows.length / 2));
    const secondHalf = monthlyFlows.slice(Math.floor(monthlyFlows.length / 2));
    
    const firstHalfAvg = firstHalf.reduce((sum, flow) => sum + flow.net_flow, 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((sum, flow) => sum + flow.net_flow, 0) / secondHalf.length;
    
    const growthRate = firstHalfAvg > 0 ? ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100 : 0;

    let trend: 'croissante' | 'décroissante' | 'stable' = 'stable';
    if (growthRate > 5) trend = 'croissante';
    else if (growthRate < -5) trend = 'décroissante';

    return {
      trend,
      averageMonthlyFlow: Math.round(averageMonthlyFlow),
      peakMonth,
      growthRate: Math.round(growthRate * 100) / 100
    };
  }

  /**
   * Calcule la densité de migration par zone
   */
  calculateMigrationDensity(hotspots: Hotspot[]): {
    highDensityZones: Hotspot[];
    mediumDensityZones: Hotspot[];
    lowDensityZones: Hotspot[];
    averageDensity: number;
  } {
    if (hotspots.length === 0) {
      return {
        highDensityZones: [],
        mediumDensityZones: [],
        lowDensityZones: [],
        averageDensity: 0
      };
    }

    const totalMigrants = hotspots.reduce((sum, hotspot) => sum + hotspot.count, 0);
    const averageDensity = totalMigrants / hotspots.length;

    const highDensityZones = hotspots.filter(h => h.intensity > 0.7);
    const mediumDensityZones = hotspots.filter(h => h.intensity >= 0.3 && h.intensity <= 0.7);
    const lowDensityZones = hotspots.filter(h => h.intensity < 0.3);

    return {
      highDensityZones,
      mediumDensityZones,
      lowDensityZones,
      averageDensity: Math.round(averageDensity)
    };
  }

  /**
   * Évalue les niveaux de risque
   */
  assessRiskLevels(riskZones: RiskZone[]): {
    criticalZones: RiskZone[];
    highRiskZones: RiskZone[];
    mediumRiskZones: RiskZone[];
    lowRiskZones: RiskZone[];
    overallRiskScore: number;
  } {
    const criticalZones = riskZones.filter(z => z.risk_level === 'critique');
    const highRiskZones = riskZones.filter(z => z.risk_level === 'élevé');
    const mediumRiskZones = riskZones.filter(z => z.risk_level === 'moyen');
    const lowRiskZones = riskZones.filter(z => z.risk_level === 'faible');

    const totalRiskScore = riskZones.reduce((sum, zone) => sum + zone.risk_score, 0);
    const overallRiskScore = riskZones.length > 0 ? totalRiskScore / riskZones.length : 0;

    return {
      criticalZones,
      highRiskZones,
      mediumRiskZones,
      lowRiskZones,
      overallRiskScore: Math.round(overallRiskScore * 100) / 100
    };
  }

  /**
   * Analyse la distribution géographique
   */
  analyzeGeographicDistribution(migrantsByCountry: CountryStats[]): {
    topOriginCountries: CountryStats[];
    concentrationIndex: number;
    diversityScore: number;
  } {
    const topOriginCountries = migrantsByCountry
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Calcul de l'indice de concentration (Herfindahl)
    const totalMigrants = migrantsByCountry.reduce((sum, country) => sum + country.count, 0);
    const concentrationIndex = migrantsByCountry.reduce((sum, country) => {
      const share = country.count / totalMigrants;
      return sum + (share * share);
    }, 0);

    // Score de diversité (inverse de la concentration)
    const diversityScore = 1 - concentrationIndex;

    return {
      topOriginCountries,
      concentrationIndex: Math.round(concentrationIndex * 1000) / 1000,
      diversityScore: Math.round(diversityScore * 1000) / 1000
    };
  }

  /**
   * Génère des recommandations basées sur les données
   */
  generateRecommendations(statistics: GISStatistics): {
    priority: 'haute' | 'moyenne' | 'faible';
    type: string;
    description: string;
    actions: string[];
  }[] {
    const recommendations: {
      priority: 'haute' | 'moyenne' | 'faible';
      type: string;
      description: string;
      actions: string[];
    }[] = [];

    // Analyse des zones de risque critique
    const criticalRiskZones = statistics.risk_zones.filter(z => z.risk_level === 'critique');
    if (criticalRiskZones.length > 0) {
      recommendations.push({
        priority: 'haute',
        type: 'Sécurité',
        description: `${criticalRiskZones.length} zone(s) de risque critique détectée(s)`,
        actions: [
          'Déployer une surveillance renforcée',
          'Augmenter les patrouilles de sécurité',
          'Établir des points de contrôle',
          'Coordonner avec les autorités locales'
        ]
      });
    }

    // Analyse des points chauds à haute intensité
    const highIntensityHotspots = statistics.hotspot_locations.filter(h => h.intensity > 0.8);
    if (highIntensityHotspots.length > 0) {
      recommendations.push({
        priority: 'haute',
        type: 'Gestion des flux',
        description: `${highIntensityHotspots.length} point(s) chaud(s) à haute intensité`,
        actions: [
          'Installer des centres d\'accueil temporaires',
          'Organiser des transports vers des zones moins denses',
          'Fournir des services d\'assistance humanitaire',
          'Mettre en place un système de gestion des files d\'attente'
        ]
      });
    }

    // Analyse des tendances prédictives
    if (statistics.predictive_analysis.trend_direction === 'croissante') {
      recommendations.push({
        priority: 'moyenne',
        type: 'Planification',
        description: 'Tendance migratoire croissante prévue',
        actions: [
          'Augmenter les capacités d\'accueil',
          'Recruter du personnel supplémentaire',
          'Prévoir des stocks de fournitures d\'urgence',
          'Élaborer des plans de contingence'
        ]
      });
    }

    // Analyse de la distribution par statut
    const irregularMigrants = statistics.migrants_by_status.find(s => s.status === 'irregulier');
    if (irregularMigrants && irregularMigrants.percent > 30) {
      recommendations.push({
        priority: 'moyenne',
        type: 'Régularisation',
        description: `${irregularMigrants.percent.toFixed(1)}% de migrants en situation irrégulière`,
        actions: [
          'Organiser des campagnes de régularisation',
          'Faciliter les procédures administratives',
          'Sensibiliser sur les voies légales de migration',
          'Renforcer les services juridiques'
        ]
      });
    }

    return recommendations;
  }

  /**
   * Exporte les données GIS dans différents formats
   */
  exportGISData(format: 'json' | 'csv' | 'xlsx' | 'geojson', data: any): Blob {
    switch (format) {
      case 'json':
        return new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      
      case 'csv':
        return this.convertToCSV(data);
      
      case 'geojson':
        return this.convertToGeoJSON(data);
      
      default:
        return new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    }
  }

  private convertToCSV(data: any): Blob {
    // Implémentation simplifiée pour la conversion CSV
    const csvContent = 'data:text/csv;charset=utf-8,';
    // TODO: Implémenter la conversion complète vers CSV
    return new Blob([csvContent], { type: 'text/csv' });
  }

  private convertToGeoJSON(data: any): Blob {
    // Implémentation simplifiée pour la conversion GeoJSON
    const geoJSON = {
      type: 'FeatureCollection',
      features: []
    };
    // TODO: Implémenter la conversion complète vers GeoJSON
    return new Blob([JSON.stringify(geoJSON, null, 2)], { type: 'application/geo+json' });
  }
}

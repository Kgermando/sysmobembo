import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpParams } from '@angular/common/http';
import { DashboardBaseService } from './dashboard-base.service';

// ===============================
// TRAJECTORY ANALYSIS INTERFACES
// ===============================

export interface TrajectoryPoint {
  latitude: number;
  longitude: number;
  timestamp: Date;
  ville: string;
  pays: string;
  type_mouvement: string;
  distance_prevue: number;
  vitesse_moyenne: number;
}

export interface Trajectory {
  migrant_uuid: string;
  migrant_nom: string;
  migrant_prenom: string;
  points: TrajectoryPoint[];
  distance_totale: number;
  duree_trajet_heures: number;
  vitesse_moyenne_kmh: number;
  statut_actuel: string;
}

export interface TrajectoryOverview {
  uuid: string;
  nom: string;
  prenom: string;
  pays_origine: string;
  pays_destination: string;
  nb_points: number;
  premier_point: Date;
  dernier_point: Date;
}

export interface DetailedTrajectory {
  migrant: TrajectoryOverview;
  distance_totale: number;
  duree_heures: number;
  vitesse_moyenne: number;
  vitesse_max: number;
  pays_traverses: string[];
  nb_pays: number;
  points_trajectory: number;
}

export interface GroupTrajectoriesData {
  trajectories: DetailedTrajectory[];
  analysis_period: number;
  total_count: number;
}

export interface FrequentRoute {
  pays_origine: string;
  pays_destination: string;
  nb_migrants: number;
  distance_moyenne: number;
  duree_moyenne: number;
}

export interface TransitPoint {
  ville: string;
  pays: string;
  nb_passages: number;
  migrants_uniques: number;
  duree_moyenne_heures: number;
}

export interface TemporalPattern {
  jour_semaine: string;
  heure: number;
  nb_mouvements: number;
}

export interface RegionalSpeed {
  pays: string;
  vitesse_moyenne_kmh: number;
  nb_trajectoires: number;
  distance_moyenne_km: number;
}

export interface MovementPatternsData {
  frequent_routes: FrequentRoute[];
  transit_points: TransitPoint[];
  temporal_patterns: TemporalPattern[];
  regional_speeds: RegionalSpeed[];
  analysis_period: number;
}

export interface AbnormalSpeed {
  migrant_uuid: string;
  migrant_nom: string;
  vitesse_kmh: number;
  distance_km: number;
  date_mouvement: Date;
  ville_depart: string;
  ville_arrivee: string;
  type_anomalie: string;
}

export interface UnusualTrajectory {
  migrant_uuid: string;
  migrant_nom: string;
  type_anomalie: string;
  description: string;
  date_detection: Date;
  niveau_risque: string;
}

export interface AbnormalConcentration {
  ville: string;
  pays: string;
  nb_migrants: number;
  date_pic: Date;
  taux_croissance: number;
}

export interface TrajectoryAnomaliesData {
  abnormal_speeds: AbnormalSpeed[];
  unusual_trajectories: UnusualTrajectory[];
  abnormal_concentrations: AbnormalConcentration[];
  analysis_period: number;
  detection_timestamp: Date;
}

@Injectable({
  providedIn: 'root'
})
export class TrajectoryAnalysisService extends DashboardBaseService {

  // ===============================
  // INDIVIDUAL TRAJECTORIES
  // ===============================

  getIndividualTrajectories(params: {
    migrant_uuid: string;
    days?: number;
  }): Observable<Trajectory> {
    const httpParams = this.buildParams({
      migrant_uuid: params.migrant_uuid,
      days: params.days || 30
    });
    
    return this.get<Trajectory>('/trajectory/individual', httpParams);
  }

  // ===============================
  // GROUP TRAJECTORIES
  // ===============================

  getGroupTrajectories(params?: {
    days?: number;
    pays_origine?: string;
    pays_destination?: string;
    limit?: number;
  }): Observable<GroupTrajectoriesData> {
    const httpParams = this.buildParams({
      days: params?.days || 7,
      pays_origine: params?.pays_origine || '',
      pays_destination: params?.pays_destination || '',
      limit: params?.limit || 20
    });
    
    return this.get<GroupTrajectoriesData>('/trajectory/group', httpParams);
  }

  // ===============================
  // MOVEMENT PATTERNS
  // ===============================

  getMovementPatterns(params?: {
    days?: number;
  }): Observable<MovementPatternsData> {
    const httpParams = this.buildParams({
      days: params?.days || 30
    });
    
    return this.get<MovementPatternsData>('/trajectory/patterns', httpParams);
  }

  // ===============================
  // TRAJECTORY ANOMALIES
  // ===============================

  getTrajectoryAnomalies(params?: {
    days?: number;
  }): Observable<TrajectoryAnomaliesData> {
    const httpParams = this.buildParams({
      days: params?.days || 7
    });
    
    return this.get<TrajectoryAnomaliesData>('/trajectory/anomalies', httpParams);
  }

  // ===============================
  // TRAJECTORY CALCULATION UTILITIES
  // ===============================

  /**
   * Calcule la distance entre deux points GPS (formule de Haversine)
   */
  calculateDistanceBetweenPoints(
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
   * Calcule la vitesse entre deux points
   */
  calculateSpeed(distanceKm: number, timeHours: number): number {
    if (timeHours <= 0) return 0;
    return distanceKm / timeHours;
  }

  /**
   * Calcule la distance totale d'une trajectoire
   */
  calculateTrajectoryDistance(points: TrajectoryPoint[]): number {
    let totalDistance = 0;
    
    for (let i = 1; i < points.length; i++) {
      const distance = this.calculateDistanceBetweenPoints(
        points[i-1].latitude,
        points[i-1].longitude,
        points[i].latitude,
        points[i].longitude
      );
      totalDistance += distance;
    }
    
    return totalDistance;
  }

  /**
   * Calcule la durée totale d'une trajectoire en heures
   */
  calculateTrajectoryDuration(points: TrajectoryPoint[]): number {
    if (points.length < 2) return 0;
    
    const startTime = new Date(points[0].timestamp).getTime();
    const endTime = new Date(points[points.length - 1].timestamp).getTime();
    
    return (endTime - startTime) / (1000 * 60 * 60); // en heures
  }

  /**
   * Détecte les anomalies de vitesse
   */
  detectSpeedAnomalies(
    points: TrajectoryPoint[],
    maxReasonableSpeed: number = 300, // km/h
    minReasonableSpeed: number = 1    // km/h
  ): {
    point: TrajectoryPoint;
    anomalyType: 'too_fast' | 'too_slow';
    severity: 'low' | 'medium' | 'high';
  }[] {
    const anomalies: {
      point: TrajectoryPoint;
      anomalyType: 'too_fast' | 'too_slow';
      severity: 'low' | 'medium' | 'high';
    }[] = [];
    
    for (const point of points) {
      if (point.vitesse_moyenne > maxReasonableSpeed) {
        let severity: 'low' | 'medium' | 'high' = 'low';
        if (point.vitesse_moyenne > maxReasonableSpeed * 2) severity = 'high';
        else if (point.vitesse_moyenne > maxReasonableSpeed * 1.5) severity = 'medium';
        
        anomalies.push({
          point,
          anomalyType: 'too_fast',
          severity
        });
      } else if (point.vitesse_moyenne < minReasonableSpeed && point.vitesse_moyenne > 0) {
        anomalies.push({
          point,
          anomalyType: 'too_slow',
          severity: 'medium'
        });
      }
    }
    
    return anomalies;
  }

  /**
   * Simplifie une trajectoire en gardant les points importants
   */
  simplifyTrajectory(
    points: TrajectoryPoint[],
    tolerance: number = 0.001
  ): TrajectoryPoint[] {
    if (points.length <= 2) return points;
    
    // Algorithme de Douglas-Peucker simplifié
    const simplified: TrajectoryPoint[] = [points[0]];
    
    for (let i = 1; i < points.length - 1; i++) {
      const current = points[i];
      const prev = simplified[simplified.length - 1];
      
      const distance = this.calculateDistanceBetweenPoints(
        prev.latitude,
        prev.longitude,
        current.latitude,
        current.longitude
      );
      
      // Garder le point s'il y a un changement significatif
      if (distance > tolerance || current.type_mouvement !== prev.type_mouvement) {
        simplified.push(current);
      }
    }
    
    simplified.push(points[points.length - 1]);
    return simplified;
  }

  /**
   * Calcule les statistiques d'une trajectoire
   */
  calculateTrajectoryStats(trajectory: Trajectory): {
    totalDistance: number;
    avgSpeed: number;
    maxSpeed: number;
    stops: number;
    countriesCrossed: string[];
    duration: number;
    efficiency: number; // ratio distance directe / distance parcourue
  } {
    const points = trajectory.points;
    
    if (points.length < 2) {
      return {
        totalDistance: 0,
        avgSpeed: 0,
        maxSpeed: 0,
        stops: 0,
        countriesCrossed: [],
        duration: 0,
        efficiency: 0
      };
    }
    
    const totalDistance = this.calculateTrajectoryDistance(points);
    const duration = this.calculateTrajectoryDuration(points);
    const avgSpeed = duration > 0 ? totalDistance / duration : 0;
    const maxSpeed = Math.max(...points.map(p => p.vitesse_moyenne));
    
    // Compter les arrêts (vitesse proche de 0)
    const stops = points.filter(p => p.vitesse_moyenne < 1).length;
    
    // Pays traversés
    const countriesCrossed = [...new Set(points.map(p => p.pays).filter(p => p))];
    
    // Efficacité du trajet (distance directe vs distance parcourue)
    const directDistance = this.calculateDistanceBetweenPoints(
      points[0].latitude,
      points[0].longitude,
      points[points.length - 1].latitude,
      points[points.length - 1].longitude
    );
    const efficiency = totalDistance > 0 ? directDistance / totalDistance : 0;
    
    return {
      totalDistance,
      avgSpeed,
      maxSpeed,
      stops,
      countriesCrossed,
      duration,
      efficiency
    };
  }

  /**
   * Classifie le type de mouvement basé sur la vitesse et la distance
   */
  classifyMovementType(speed: number, distance: number): {
    type: 'stationary' | 'walking' | 'vehicle' | 'transport' | 'anomaly';
    confidence: number;
    description: string;
  } {
    if (speed < 1) {
      return {
        type: 'stationary',
        confidence: 0.9,
        description: 'Stationnaire ou arrêt'
      };
    } else if (speed >= 1 && speed <= 8) {
      return {
        type: 'walking',
        confidence: 0.8,
        description: 'Déplacement à pied'
      };
    } else if (speed > 8 && speed <= 80) {
      return {
        type: 'vehicle',
        confidence: 0.7,
        description: 'Véhicule routier'
      };
    } else if (speed > 80 && speed <= 300) {
      return {
        type: 'transport',
        confidence: 0.6,
        description: 'Transport rapide'
      };
    } else {
      return {
        type: 'anomaly',
        confidence: 0.3,
        description: 'Vitesse anormale'
      };
    }
  }

  /**
   * Détecte les patterns temporels dans les mouvements
   */
  analyzeTemporalPatterns(points: TrajectoryPoint[]): {
    mostActiveHour: number;
    mostActiveDay: string;
    activityByHour: { [hour: number]: number };
    activityByDay: { [day: string]: number };
  } {
    const activityByHour: { [hour: number]: number } = {};
    const activityByDay: { [day: string]: number } = {};
    
    points.forEach(point => {
      const date = new Date(point.timestamp);
      const hour = date.getHours();
      const dayName = date.toLocaleDateString('fr-FR', { weekday: 'long' });
      
      activityByHour[hour] = (activityByHour[hour] || 0) + 1;
      activityByDay[dayName] = (activityByDay[dayName] || 0) + 1;
    });
    
    const mostActiveHour = Object.keys(activityByHour).reduce((a, b) => 
      activityByHour[parseInt(a)] > activityByHour[parseInt(b)] ? a : b
    );
    
    const mostActiveDay = Object.keys(activityByDay).reduce((a, b) => 
      activityByDay[a] > activityByDay[b] ? a : b
    );
    
    return {
      mostActiveHour: parseInt(mostActiveHour),
      mostActiveDay,
      activityByHour,
      activityByDay
    };
  }
}

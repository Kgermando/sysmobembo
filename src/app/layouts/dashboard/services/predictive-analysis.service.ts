import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpParams } from '@angular/common/http';
import { DashboardBaseService } from './dashboard-base.service';

// ===============================
// PREDICTIVE ANALYSIS INTERFACES
// ===============================

export interface MigrationFlowPrediction {
  historical_data: {
    date: Date;
    count: number;
  }[];
  predictions: {
    date: string;
    predicted_count: number;
    confidence: number;
  }[];
  analysis_period: number;
  base_average: number;
}

export interface RiskAnalysisData {
  type_alerte: string;
  niveau_gravite: string;
  count: number;
  tendance_mois: number;
}

export interface ZoneRisk {
  pays: string;
  ville: string;
  alert_count: number;
  migrant_count: number;
  risk_score: number;
}

export interface MotifTrend {
  type_motif: string;
  current_count: number;
  previous_count: number;
  growth_rate: number;
}

export interface RiskPredictionAnalysis {
  risk_analysis: RiskAnalysisData[];
  zone_risks: ZoneRisk[];
  motif_trends: MotifTrend[];
  analysis_date: Date;
}

export interface DemographicData {
  tranche_age: string;
  count: number;
  sexe: string;
  tendance_mois: number;
}

export interface NationalityTrend {
  nationalite: string;
  current_count: number;
  monthly_growth: number;
  projection_3_months: number;
}

export interface DemographicPrediction {
  demographic_data: DemographicData[];
  nationality_trends: NationalityTrend[];
  analysis_date: Date;
  projection_period: string;
}

export interface MigrationRoutePattern {
  pays_origine: string;
  pays_destination: string;
  count: number;
  tendance_mois: number;
  pourcentage_total: number;
}

export interface SeasonalAnalysis {
  mois: string;
  count: number;
  annee: number;
}

export interface CriticalPoint {
  ville: string;
  pays: string;
  passage_count: number;
  alert_count: number;
  critical_score: number;
}

export interface MovementPatternPrediction {
  migration_routes: MigrationRoutePattern[];
  seasonal_analysis: SeasonalAnalysis[];
  critical_points: CriticalPoint[];
  analysis_period: string;
}

@Injectable({
  providedIn: 'root'
})
export class PredictiveAnalysisService extends DashboardBaseService {

  // ===============================
  // MIGRATION FLOW PREDICTION
  // ===============================

  getMigrationFlowPrediction(params?: {
    periode_days?: number;
    pays_origine?: string;
    pays_destination?: string;
  }): Observable<MigrationFlowPrediction> {
    const httpParams = this.buildParams({
      periode_days: params?.periode_days || 30,
      pays_origine: params?.pays_origine || '',
      pays_destination: params?.pays_destination || ''
    });
    
    return this.get<MigrationFlowPrediction>('/predictive/migration-flow', httpParams);
  }

  // ===============================
  // RISK PREDICTION ANALYSIS
  // ===============================

  getRiskPredictionAnalysis(): Observable<RiskPredictionAnalysis> {
    return this.get<RiskPredictionAnalysis>('/predictive/risk-analysis');
  }

  // ===============================
  // DEMOGRAPHIC PREDICTION
  // ===============================

  getDemographicPrediction(): Observable<DemographicPrediction> {
    return this.get<DemographicPrediction>('/predictive/demographic');
  }

  // ===============================
  // MOVEMENT PATTERN PREDICTION
  // ===============================

  getMovementPatternPrediction(): Observable<MovementPatternPrediction> {
    return this.get<MovementPatternPrediction>('/predictive/movement-patterns');
  }

  // ===============================
  // ANALYTICS UTILITIES
  // ===============================

  /**
   * Calcule la tendance (croissance/décroissance) entre deux valeurs
   */
  calculateTrend(current: number, previous: number): {
    percentage: number;
    direction: 'up' | 'down' | 'stable';
    label: string;
  } {
    if (previous === 0) {
      return {
        percentage: current > 0 ? 100 : 0,
        direction: current > 0 ? 'up' : 'stable',
        label: current > 0 ? '+100%' : '0%'
      };
    }

    const percentage = ((current - previous) / previous) * 100;
    const direction = percentage > 5 ? 'up' : percentage < -5 ? 'down' : 'stable';
    const label = percentage > 0 ? `+${percentage.toFixed(1)}%` : `${percentage.toFixed(1)}%`;

    return { percentage, direction, label };
  }

  /**
   * Calcule le niveau de confiance basé sur la variabilité des données historiques
   */
  calculateConfidenceLevel(historicalData: number[]): number {
    if (historicalData.length < 2) return 50;

    const mean = historicalData.reduce((sum, val) => sum + val, 0) / historicalData.length;
    const variance = historicalData.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / historicalData.length;
    const standardDeviation = Math.sqrt(variance);
    const coefficientOfVariation = standardDeviation / mean;

    // Plus le coefficient de variation est faible, plus la confiance est élevée
    const confidence = Math.max(50, Math.min(95, 95 - (coefficientOfVariation * 100)));
    return Math.round(confidence);
  }

  /**
   * Génère des prédictions basées sur une moyenne mobile
   */
  generateMovingAveragePrediction(
    historicalData: number[], 
    periodsToPredict: number,
    windowSize: number = 3
  ): number[] {
    if (historicalData.length < windowSize) {
      const average = historicalData.reduce((sum, val) => sum + val, 0) / historicalData.length;
      return Array(periodsToPredict).fill(average);
    }

    const predictions: number[] = [];
    let dataToUse = [...historicalData];

    for (let i = 0; i < periodsToPredict; i++) {
      const window = dataToUse.slice(-windowSize);
      const prediction = window.reduce((sum, val) => sum + val, 0) / window.length;
      predictions.push(Math.round(prediction));
      dataToUse.push(prediction);
    }

    return predictions;
  }

  /**
   * Calcule le score de risque basé sur plusieurs facteurs
   */
  calculateRiskScore(factors: {
    alertCount: number;
    migrantCount: number;
    criticalAlerts: number;
    timeFactorHours: number;
  }): {
    score: number;
    level: 'low' | 'medium' | 'high' | 'critical';
    description: string;
  } {
    let score = 0;

    // Facteur alertes par migrants (0-40 points)
    if (factors.migrantCount > 0) {
      const alertRatio = factors.alertCount / factors.migrantCount;
      score += Math.min(40, alertRatio * 100);
    }

    // Facteur alertes critiques (0-30 points)
    score += Math.min(30, factors.criticalAlerts * 10);

    // Facteur temporel - plus récent = plus de points (0-30 points)
    const recentnessFactor = Math.max(0, 30 - (factors.timeFactorHours / 24) * 5);
    score += recentnessFactor;

    // Déterminer le niveau
    let level: 'low' | 'medium' | 'high' | 'critical';
    let description: string;

    if (score >= 80) {
      level = 'critical';
      description = 'Risque critique - Action immédiate requise';
    } else if (score >= 60) {
      level = 'high';
      description = 'Risque élevé - Surveillance renforcée';
    } else if (score >= 30) {
      level = 'medium';
      description = 'Risque modéré - Attention requise';
    } else {
      level = 'low';
      description = 'Risque faible - Surveillance normale';
    }

    return {
      score: Math.round(score),
      level,
      description
    };
  }

  /**
   * Analyse saisonnière des données
   */
  analyzeSeasonalPattern(monthlyData: { month: number; value: number }[]): {
    peakMonth: number;
    lowMonth: number;
    seasonalityIndex: number;
    pattern: 'increasing' | 'decreasing' | 'cyclical' | 'random';
  } {
    if (monthlyData.length === 0) {
      return {
        peakMonth: 1,
        lowMonth: 1,
        seasonalityIndex: 0,
        pattern: 'random'
      };
    }

    const sorted = [...monthlyData].sort((a, b) => b.value - a.value);
    const peakMonth = sorted[0].month;
    const lowMonth = sorted[sorted.length - 1].month;

    // Calcul de l'index de saisonnalité
    const mean = monthlyData.reduce((sum, item) => sum + item.value, 0) / monthlyData.length;
    const maxDeviation = Math.max(...monthlyData.map(item => Math.abs(item.value - mean)));
    const seasonalityIndex = maxDeviation / mean;

    // Détermination du pattern
    let pattern: 'increasing' | 'decreasing' | 'cyclical' | 'random';
    
    if (seasonalityIndex > 0.5) {
      pattern = 'cyclical';
    } else {
      const firstHalf = monthlyData.slice(0, 6).reduce((sum, item) => sum + item.value, 0) / 6;
      const secondHalf = monthlyData.slice(6).reduce((sum, item) => sum + item.value, 0) / 6;
      
      if (secondHalf > firstHalf * 1.1) {
        pattern = 'increasing';
      } else if (firstHalf > secondHalf * 1.1) {
        pattern = 'decreasing';
      } else {
        pattern = 'random';
      }
    }

    return {
      peakMonth,
      lowMonth,
      seasonalityIndex,
      pattern
    };
  }
}

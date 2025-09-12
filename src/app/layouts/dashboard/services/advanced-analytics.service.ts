import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpParams } from '@angular/common/http';
import { DashboardBaseService } from './dashboard-base.service';
import {
  GlobalMigrationStats,
  PredictiveAnalysis,
  MigrationTrend,
  AdvancedRiskAnalysis,
  PredictiveModelsPerformance,
  ApiResponse
} from '../interfaces/advanced-analytics.interface';

@Injectable({
  providedIn: 'root'
})
export class AdvancedAnalyticsService extends DashboardBaseService {

  // ===============================
  // STATISTIQUES GLOBALES AVANCÉES
  // ===============================

  /**
   * Récupère les statistiques globales des migrations avancées
   */
  getAdvancedMigrationStats(): Observable<ApiResponse<GlobalMigrationStats>> {
    return this.get<ApiResponse<GlobalMigrationStats>>('/predictive/stats');
  }

  // ===============================
  // ANALYSE PRÉDICTIVE AVANCÉE
  // ===============================

  /**
   * Récupère l'analyse prédictive complète
   */
  getAdvancedPredictiveAnalysis(): Observable<ApiResponse<PredictiveAnalysis>> {
    return this.get<ApiResponse<PredictiveAnalysis>>('/predictive/predictive');
  }

  // ===============================
  // TENDANCES MIGRATOIRES DÉTAILLÉES
  // ===============================

  /**
   * Récupère les tendances migratoires détaillées
   * @param period Période en mois (défaut: 12)
   */
  getAdvancedMigrationTrends(period: number = 12): Observable<ApiResponse<MigrationTrend[]>> {
    const params = new HttpParams().set('period', period.toString());
    return this.get<ApiResponse<MigrationTrend[]>>('/predictive/trends', params);
  }

  // ===============================
  // ANALYSE DE RISQUES AVANCÉE
  // ===============================

  /**
   * Récupère l'analyse de risques avancée
   */
  getAdvancedRiskAnalysis(): Observable<ApiResponse<AdvancedRiskAnalysis>> {
    return this.get<ApiResponse<AdvancedRiskAnalysis>>('/predictive/risk');
  }

  // ===============================
  // PERFORMANCE DES MODÈLES PRÉDICTIFS
  // ===============================

  /**
   * Récupère les métriques de performance des modèles prédictifs
   */
  getPredictiveModelsPerformance(): Observable<ApiResponse<PredictiveModelsPerformance>> {
    return this.get<ApiResponse<PredictiveModelsPerformance>>('/predictive/models-performance');
  }

  // ===============================
  // MÉTHODES UTILITAIRES
  // ===============================

  /**
   * Calcule le niveau de risque basé sur un score
   */
  getRiskLevel(score: number): {
    level: 'faible' | 'moyen' | 'eleve' | 'critique';
    color: string;
    icon: string;
  } {
    if (score >= 80) {
      return { level: 'critique', color: '#dc3545', icon: 'fas fa-exclamation-triangle' };
    } else if (score >= 60) {
      return { level: 'eleve', color: '#fd7e14', icon: 'fas fa-exclamation-circle' };
    } else if (score >= 40) {
      return { level: 'moyen', color: '#ffc107', icon: 'fas fa-info-circle' };
    } else {
      return { level: 'faible', color: '#28a745', icon: 'fas fa-check-circle' };
    }
  }

  /**
   * Détermine la couleur de la tendance
   */
  getTrendColor(variation: number): string {
    if (variation > 10) return '#28a745'; // Vert pour croissance forte
    if (variation > 0) return '#17a2b8'; // Bleu pour croissance modérée
    if (variation > -10) return '#ffc107'; // Jaune pour décroissance modérée
    return '#dc3545'; // Rouge pour décroissance forte
  }

  /**
   * Formate une valeur de probabilité en pourcentage
   */
  formatProbability(probability: number): string {
    return `${(probability * 100).toFixed(1)}%`;
  }

  /**
   * Détermine l'icône basée sur le type d'alerte
   */
  getAlertIcon(type: string): string {
    const iconMap: { [key: string]: string } = {
      'flux_massif': 'fas fa-users',
      'risque_securitaire': 'fas fa-shield-alt',
      'saturation_capacite': 'fas fa-home',
      'risque_humanitaire': 'fas fa-heart',
      'risque_sante': 'fas fa-heartbeat',
      'default': 'fas fa-bell'
    };
    return iconMap[type] || iconMap['default'];
  }

  /**
   * Calcule la variation en pourcentage
   */
  calculateVariation(current: number, previous: number): {
    value: number;
    isPositive: boolean;
    formatted: string;
  } {
    if (previous === 0) {
      return {
        value: current > 0 ? 100 : 0,
        isPositive: current > 0,
        formatted: current > 0 ? '+100%' : '0%'
      };
    }

    const variation = ((current - previous) / previous) * 100;
    return {
      value: Math.abs(variation),
      isPositive: variation >= 0,
      formatted: `${variation >= 0 ? '+' : ''}${variation.toFixed(1)}%`
    };
  }

  /**
   * Génère des couleurs pour les graphiques
   */
  generateChartColors(count: number): string[] {
    const baseColors = [
      '#007bff', '#28a745', '#ffc107', '#dc3545', '#6f42c1',
      '#fd7e14', '#20c997', '#6610f2', '#e83e8c', '#17a2b8'
    ];
    
    const colors: string[] = [];
    for (let i = 0; i < count; i++) {
      colors.push(baseColors[i % baseColors.length]);
    }
    return colors;
  }

  /**
   * Formate les nombres avec séparateurs
   */
  formatNumber(value: number): string {
    return new Intl.NumberFormat('fr-FR').format(value);
  }

  /**
   * Convertit une date au format français
   */
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  /**
   * Convertit une date/heure au format français
   */
  formatDateTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Calcule la moyenne d'un tableau de nombres
   */
  calculateAverage(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }

  /**
   * Trouve la valeur maximale dans un tableau
   */
  findMaxValue(values: number[]): number {
    return Math.max(...values);
  }

  /**
   * Trouve la valeur minimale dans un tableau
   */
  findMinValue(values: number[]): number {
    return Math.min(...values);
  }

  /**
   * Calcule la médiane d'un tableau de nombres
   */
  calculateMedian(values: number[]): number {
    if (values.length === 0) return 0;
    
    const sorted = [...values].sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);
    
    if (sorted.length % 2 === 0) {
      return (sorted[middle - 1] + sorted[middle]) / 2;
    } else {
      return sorted[middle];
    }
  }
}

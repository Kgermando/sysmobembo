import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Subject, takeUntil, finalize, forkJoin } from 'rxjs';
import { 
  PredictiveAnalysisService,
  MigrationFlowPrediction,
  RiskPredictionAnalysis,
  DemographicPrediction,
  MovementPatternPrediction
} from '../../services/predictive-analysis.service';
import { AdvancedAnalyticsService } from '../../services/advanced-analytics.service';
import {
  GlobalMigrationStats,
  PredictiveAnalysis,
  MigrationTrend,
  AdvancedRiskAnalysis,
  PredictiveModelsPerformance,
  AlertePredictive,
  ScenarioPrevision
} from '../../interfaces/advanced-analytics.interface';
import { ChartComponent, ApexAxisChartSeries, ApexChart, ApexXAxis, ApexTitleSubtitle, ApexDataLabels, ApexStroke, ApexYAxis, ApexLegend, ApexPlotOptions, ApexFill } from 'ng-apexcharts';

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  title: ApexTitleSubtitle;
  dataLabels: ApexDataLabels;
  stroke: ApexStroke;
  yaxis: ApexYAxis;
  legend: ApexLegend;
  plotOptions: ApexPlotOptions;
  colors: string[];
  fill: ApexFill;
  labels: any;
};

@Component({
  selector: 'app-predictive-analytics',
  standalone: false,
  templateUrl: './predictive-analytics.component.html',
  styleUrl: './predictive-analytics.component.scss'
})
export class PredictiveAnalyticsComponent implements OnInit, OnDestroy {
  @ViewChild('migrationFlowChart') migrationFlowChart!: ChartComponent;
  @ViewChild('riskAnalysisChart') riskAnalysisChart!: ChartComponent;
  @ViewChild('demographicChart') demographicChart!: ChartComponent;
  @ViewChild('seasonalChart') seasonalChart!: ChartComponent;
  @ViewChild('advancedStatsChart') advancedStatsChart!: ChartComponent;
  @ViewChild('predictiveModelsChart') predictiveModelsChart!: ChartComponent;
  @ViewChild('riskEvolutionChart') riskEvolutionChart!: ChartComponent;

  private destroy$ = new Subject<void>();
  
  // Données existantes
  migrationFlowData: MigrationFlowPrediction | null = null;
  riskAnalysisData: RiskPredictionAnalysis | null = null;
  demographicData: DemographicPrediction | null = null;
  movementPatternData: MovementPatternPrediction | null = null;

  // Nouvelles données avancées
  globalStats: GlobalMigrationStats | null = null;
  advancedPredictiveAnalysis: PredictiveAnalysis | null = null;
  migrationTrends: MigrationTrend[] = [];
  advancedRiskAnalysis: AdvancedRiskAnalysis | null = null;
  modelsPerformance: PredictiveModelsPerformance | null = null;
  
  // UI State
  isLoading = false;
  error: string | null = null;
  activeTab = 'global-stats';
  activeAnalysisTab = 'migration-flow';
  
  // Chart configurations
  migrationFlowChartOptions: Partial<ChartOptions> = {};
  riskAnalysisChartOptions: Partial<ChartOptions> = {};
  demographicChartOptions: Partial<ChartOptions> = {};
  seasonalChartOptions: Partial<ChartOptions> = {};
  advancedStatsChartOptions: Partial<ChartOptions> = {};
  predictiveModelsChartOptions: Partial<ChartOptions> = {};
  riskEvolutionChartOptions: Partial<ChartOptions> = {};
  trendsChartOptions: Partial<ChartOptions> = {};
  
  // Filter parameters
  filterParams = {
    periode_days: 30,
    pays_origine: '',
    pays_destination: '',
    period_months: 12
  };
  
  // Insights et alertes
  insights: {
    type: 'positive' | 'negative' | 'neutral';
    title: string;
    description: string;
    confidence: number;
  }[] = [];

  alertesPredictives: AlertePredictive[] = [];
  scenariosPrevision: ScenarioPrevision[] = [];

  constructor(
    private predictiveService: PredictiveAnalysisService,
    private advancedAnalyticsService: AdvancedAnalyticsService
  ) {
    this.initializeChartOptions();
  }

  ngOnInit(): void {
    this.loadAllData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ===============================
  // DATA LOADING
  // ===============================

  loadAllData(): void {
    this.isLoading = true;
    this.error = null;

    // Charger toutes les données en parallèle
    forkJoin({
      globalStats: this.advancedAnalyticsService.getAdvancedMigrationStats(),
      predictiveAnalysis: this.advancedAnalyticsService.getAdvancedPredictiveAnalysis(),
      migrationTrends: this.advancedAnalyticsService.getAdvancedMigrationTrends(this.filterParams.period_months),
      riskAnalysis: this.advancedAnalyticsService.getAdvancedRiskAnalysis(),
      modelsPerformance: this.advancedAnalyticsService.getPredictiveModelsPerformance(),
      // Données existantes
      migrationFlow: this.predictiveService.getMigrationFlowPrediction(this.filterParams),
      riskPrediction: this.predictiveService.getRiskPredictionAnalysis(),
      demographic: this.predictiveService.getDemographicPrediction(),
      movementPattern: this.predictiveService.getMovementPatternPrediction()
    }).pipe(
      takeUntil(this.destroy$),
      finalize(() => this.isLoading = false)
    ).subscribe({
      next: (responses) => {
        // Nouvelles données avancées
        this.globalStats = responses.globalStats.data;
        this.advancedPredictiveAnalysis = responses.predictiveAnalysis.data;
        this.migrationTrends = responses.migrationTrends.data;
        this.advancedRiskAnalysis = responses.riskAnalysis.data;
        this.modelsPerformance = responses.modelsPerformance.data;

        // Données existantes
        this.migrationFlowData = responses.migrationFlow;
        this.riskAnalysisData = responses.riskPrediction;
        this.demographicData = responses.demographic;
        this.movementPatternData = responses.movementPattern;

        // Extraire les alertes et scénarios
        if (this.advancedPredictiveAnalysis) {
          this.alertesPredictives = this.advancedPredictiveAnalysis.alertes_predictives;
          this.scenariosPrevision = this.advancedPredictiveAnalysis.scenarios_prevision;
        }

        // Mettre à jour les graphiques
        this.updateAllCharts();
        this.generateAdvancedInsights();
      },
      error: (error) => {
        console.error('Erreur lors du chargement des données:', error);
        this.error = 'Erreur lors du chargement des données d\'analyse prédictive';
      }
    });
  }

  loadAllPredictiveData(): void {
    this.isLoading = true;
    this.error = null;

    // Load migration flow prediction
    this.predictiveService.getMigrationFlowPrediction(this.filterParams)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.migrationFlowData = data;
          this.updateMigrationFlowChart(data);
          this.generateMigrationInsights(data);
        },
        error: (error) => {
          console.error('Migration flow error:', error);
        }
      });

    // Load risk prediction analysis
    this.predictiveService.getRiskPredictionAnalysis()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.riskAnalysisData = data;
          this.updateRiskAnalysisChart(data);
          this.generateRiskInsights(data);
        },
        error: (error) => {
          console.error('Risk analysis error:', error);
        }
      });

    // Load demographic prediction
    this.predictiveService.getDemographicPrediction()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.demographicData = data;
          this.updateDemographicChart(data);
          this.generateDemographicInsights(data);
        },
        error: (error) => {
          console.error('Demographic error:', error);
        }
      });

    // Load movement pattern prediction
    this.predictiveService.getMovementPatternPrediction()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (data) => {
          this.movementPatternData = data;
          this.updateSeasonalChart(data);
          this.generateMovementInsights(data);
        },
        error: (error) => {
          console.error('Movement pattern error:', error);
          this.isLoading = false;
        }
      });
  }

  // ===============================
  // CHART INITIALIZATION
  // ===============================

  private initializeChartOptions(): void {
    // Migration flow chart
    this.migrationFlowChartOptions = {
      series: [],
      chart: {
        type: 'line',
        height: 350,
        toolbar: { show: true },
        zoom: { enabled: true }
      },
      dataLabels: {
        enabled: false
      },
      stroke: {
        curve: 'smooth',
        width: 3
      },
      xaxis: {
        categories: [],
        title: { text: 'Période' }
      },
      yaxis: {
        title: { text: 'Nombre de migrants' }
      },
      colors: ['#2196f3', '#4caf50'],
      legend: {
        position: 'top'
      },
      title: {
        text: 'Prédiction des flux migratoires',
        align: 'center'
      }
    };

    // Risk analysis chart
    this.riskAnalysisChartOptions = {
      series: [],
      chart: {
        type: 'radar',
        height: 350,
        toolbar: { show: false }
      },
      dataLabels: {
        enabled: true
      },
      plotOptions: {
        radar: {
          size: 140,
          polygons: {
            strokeColors: '#e9e9e9',
            fill: {
              colors: ['#f8f9fa', '#ffffff']
            }
          }
        }
      },
      colors: ['#f44336', '#ff9800', '#ffeb3b'],
      title: {
        text: 'Analyse des risques par zone',
        align: 'center'
      },
      xaxis: {
        categories: []
      }
    };

    // Demographic chart
    this.demographicChartOptions = {
      series: [],
      chart: {
        type: 'donut',
        height: 350,
        toolbar: { show: false }
      },
      dataLabels: {
        enabled: true,
        formatter: function (val, opts) {
          return opts.w.config.series[opts.seriesIndex] + '%';
        }
      },
      legend: {
        position: 'bottom'
      },
      colors: ['#2196f3', '#4caf50', '#ff9800', '#f44336', '#9c27b0'],
      title: {
        text: 'Répartition démographique prédite',
        align: 'center'
      }
    };

    // Seasonal chart
    this.seasonalChartOptions = {
      series: [],
      chart: {
        type: 'heatmap',
        height: 350,
        toolbar: { show: false }
      },
      dataLabels: {
        enabled: false
      },
      colors: ['#008FFB'],
      title: {
        text: 'Analyse saisonnière des mouvements',
        align: 'center'
      },
      xaxis: {
        categories: []
      }
    };
  }

  // ===============================
  // CHART UPDATES
  // ===============================

  private updateMigrationFlowChart(data: MigrationFlowPrediction): void {
    if (data.historical_data && data.predictions) {
      const historicalSeries = data.historical_data.map(item => item.count);
      const predictionSeries = data.predictions.map(item => item.predicted_count);
      
      const categories = [
        ...data.historical_data.map(item => new Date(item.date).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' })),
        ...data.predictions.map(item => new Date(item.date).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' }))
      ];

      this.migrationFlowChartOptions = {
        ...this.migrationFlowChartOptions,
        series: [
          {
            name: 'Données historiques',
            data: [...historicalSeries, ...Array(data.predictions.length).fill(null)]
          },
          {
            name: 'Prédictions',
            data: [...Array(data.historical_data.length).fill(null), ...predictionSeries]
          }
        ],
        xaxis: {
          ...this.migrationFlowChartOptions.xaxis,
          categories: categories
        }
      };
    }
  }

  private updateRiskAnalysisChart(data: RiskPredictionAnalysis): void {
    if (data.zone_risks) {
      const topZones = data.zone_risks.slice(0, 8);
      const series = [{
        name: 'Score de risque',
        data: topZones.map(zone => zone.risk_score)
      }];
      
      const categories = topZones.map(zone => `${zone.ville}, ${zone.pays}`);

      this.riskAnalysisChartOptions = {
        ...this.riskAnalysisChartOptions,
        series: series,
        xaxis: {
          ...this.riskAnalysisChartOptions.xaxis,
          categories: categories
        }
      };
    }
  }

  private updateDemographicChart(data: DemographicPrediction): void {
    if (data.demographic_data) {
      const ageGroups = data.demographic_data.reduce((acc, item) => {
        if (!acc[item.tranche_age]) {
          acc[item.tranche_age] = 0;
        }
        acc[item.tranche_age] += item.count;
        return acc;
      }, {} as { [key: string]: number });

      const series = Object.values(ageGroups);
      const labels = Object.keys(ageGroups);

      this.demographicChartOptions = {
        ...this.demographicChartOptions,
        series: [{
          name: 'Population',
          data: series
        }],
        xaxis: {
          ...this.demographicChartOptions.xaxis,
          categories: labels
        }
      };
    }
  }

  private updateSeasonalChart(data: MovementPatternPrediction): void {
    if (data.seasonal_analysis) {
      const monthlyData = data.seasonal_analysis.reduce((acc, item) => {
        const month = item.mois.substring(5, 7); // Extract month
        if (!acc[month]) {
          acc[month] = 0;
        }
        acc[month] += item.count;
        return acc;
      }, {} as { [key: string]: number });

      const series = [{
        name: 'Mouvements',
        data: Object.entries(monthlyData).map(([month, count]) => ({
          x: this.getMonthName(parseInt(month)),
          y: count
        }))
      }];

      this.seasonalChartOptions = {
        ...this.seasonalChartOptions,
        series: series
      };
    }
  }

  // ===============================
  // INSIGHTS GENERATION
  // ===============================

  private generateMigrationInsights(data: MigrationFlowPrediction): void {
    if (data.predictions && data.predictions.length > 0) {
      const firstPrediction = data.predictions[0];
      const trend = firstPrediction.predicted_count > data.base_average ? 'positive' : 'negative';
      
      this.insights.push({
        type: trend === 'positive' ? 'negative' : 'positive', // Increase is concerning for migration
        title: 'Prédiction des flux migratoires',
        description: `${trend === 'positive' ? 'Augmentation' : 'Diminution'} prévue de ${Math.abs(((firstPrediction.predicted_count - data.base_average) / data.base_average) * 100).toFixed(1)}% par rapport à la moyenne`,
        confidence: firstPrediction.confidence
      });
    }
  }

  private generateRiskInsights(data: RiskPredictionAnalysis): void {
    if (data.zone_risks && data.zone_risks.length > 0) {
      const highRiskZones = data.zone_risks.filter(zone => zone.risk_score > 50);
      
      this.insights.push({
        type: highRiskZones.length > 0 ? 'negative' : 'positive',
        title: 'Analyse des zones à risque',
        description: `${highRiskZones.length} zone(s) à risque élevé identifiée(s)`,
        confidence: 85
      });
    }
  }

  private generateDemographicInsights(data: DemographicPrediction): void {
    if (data.nationality_trends && data.nationality_trends.length > 0) {
      const growingNationalities = data.nationality_trends.filter(trend => trend.monthly_growth > 10);
      
      this.insights.push({
        type: 'neutral',
        title: 'Tendances démographiques',
        description: `${growingNationalities.length} nationalité(s) en forte croissance (>10%)`,
        confidence: 75
      });
    }
  }

  private generateMovementInsights(data: MovementPatternPrediction): void {
    if (data.critical_points && data.critical_points.length > 0) {
      const criticalPoints = data.critical_points.filter(point => point.critical_score > 30);
      
      this.insights.push({
        type: 'negative',
        title: 'Points de passage critiques',
        description: `${criticalPoints.length} point(s) de passage nécessitent une attention particulière`,
        confidence: 80
      });
    }
  }


  // ===============================
  // FILTER MANAGEMENT
  // ===============================

  updateFilters(): void {
    this.loadAllData();
  }

  resetFilters(): void {
    this.filterParams = {
      periode_days: 30,
      pays_origine: '',
      pays_destination: '',
      period_months: 12
    };
    this.onFilterChange();
  }

  // ===============================
  // UTILITY METHODS
  // ===============================

  private getMonthName(month: number): string {
    const months = [
      'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin',
      'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'
    ];
    return months[month - 1] || 'N/A';
  }

  calculateTrend(current: number, previous: number): any {
    return this.predictiveService.calculateTrend(current, previous);
  }

  getInsightIcon(type: string): string {
    switch (type) {
      case 'positive':
        return 'trending_up';
      case 'negative':
        return 'trending_down';
      default:
        return 'info';
    }
  }

  getInsightColor(type: string): string {
    switch (type) {
      case 'positive':
        return '#4caf50';
      case 'negative':
        return '#f44336';
      default:
        return '#2196f3';
    }
  }

  exportPredictiveData(): void {
    const data = {
      migration_flow: this.migrationFlowData,
      risk_analysis: this.riskAnalysisData,
      demographic: this.demographicData,
      movement_patterns: this.movementPatternData,
      insights: this.insights,
      filters: this.filterParams,
      exportDate: new Date()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { 
      type: 'application/json' 
    });
    
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `predictive-analysis-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    window.URL.revokeObjectURL(url);
  }

  // ===============================
  // NOUVELLES MÉTHODES AVANCÉES
  // ===============================

  updateAllCharts(): void {
    if (this.globalStats) {
      this.updateAdvancedStatsChart();
    }
    if (this.modelsPerformance) {
      this.updatePredictiveModelsChart();
    }
    if (this.advancedRiskAnalysis) {
      this.updateRiskEvolutionChart();
    }
    if (this.migrationTrends.length > 0) {
      this.updateTrendsChart();
    }
    
    // Graphiques existants
    if (this.migrationFlowData) {
      this.updateMigrationFlowChart(this.migrationFlowData);
    }
    if (this.riskAnalysisData) {
      this.updateRiskAnalysisChart(this.riskAnalysisData);
    }
    if (this.demographicData) {
      this.updateDemographicChart(this.demographicData);
    }
    if (this.movementPatternData) {
      this.updateSeasonalChart(this.movementPatternData);
    }
  }

  updateAdvancedStatsChart(): void {
    if (!this.globalStats) return;

    const distributionGenreData = Object.entries(this.globalStats.distribution_genre).map(([key, value]) => ({
      x: key,
      y: value
    }));

    this.advancedStatsChartOptions = {
      series: [{
        name: 'Distribution par genre',
        data: distributionGenreData.map(item => item.y)
      }],
      chart: {
        type: 'donut',
        height: 350
      },
      labels: distributionGenreData.map(item => item.x),
      colors: this.advancedAnalyticsService.generateChartColors(distributionGenreData.length),
      dataLabels: {
        enabled: true,
        formatter: (val: number) => `${val.toFixed(1)}%`
      },
      plotOptions: {
        pie: {
          donut: {
            size: '70%',
            labels: {
              show: true,
              total: {
                show: true,
                label: 'Total',
                formatter: () => this.advancedAnalyticsService.formatNumber(this.globalStats!.total_migrants)
              }
            }
          }
        }
      },
      title: {
        text: 'Répartition des migrants par genre',
        align: 'center'
      },
      legend: {
        position: 'bottom'
      }
    };
  }

  updatePredictiveModelsChart(): void {
    if (!this.modelsPerformance) return;

    const modelNames = this.modelsPerformance.comparaison_modeles.map(m => m.nom);
    const accuracyData = this.modelsPerformance.comparaison_modeles.map(m => (m.accuracy * 100));
    const trainingTimeData = this.modelsPerformance.comparaison_modeles.map(m => m.temps_entrainement_heures);

    this.predictiveModelsChartOptions = {
      series: [
        {
          name: 'Précision (%)',
          type: 'column',
          data: accuracyData
        },
        {
          name: 'Temps d\'entraînement (h)',
          type: 'line',
          data: trainingTimeData
        }
      ],
      chart: {
        type: 'line',
        height: 350,
        toolbar: { show: true }
      },
      stroke: {
        width: [0, 4]
      },
      dataLabels: {
        enabled: true,
        enabledOnSeries: [1]
      },
      xaxis: {
        categories: modelNames,
        title: { text: 'Modèles' }
      },
      yaxis: {
        title: { text: 'Précision (%)' },
        min: 0,
        max: 100
      } as ApexYAxis,
      colors: ['#2196f3', '#ff9800'],
      title: {
        text: 'Performance des Modèles Prédictifs',
        align: 'center'
      },
      legend: {
        position: 'top'
      }
    };
  }

  updateRiskEvolutionChart(): void {
    if (!this.advancedRiskAnalysis) return;

    const dates = this.advancedRiskAnalysis.evolution_risque.map(item => 
      this.advancedAnalyticsService.formatDate(item.date)
    );
    const scores = this.advancedRiskAnalysis.evolution_risque.map(item => item.score);

    this.riskEvolutionChartOptions = {
      series: [{
        name: 'Score de risque',
        data: scores
      }],
      chart: {
        type: 'area',
        height: 350,
        zoom: { enabled: true }
      },
      dataLabels: {
        enabled: false
      },
      stroke: {
        curve: 'smooth',
        width: 2
      },
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.7,
          opacityTo: 0.3,
          stops: [0, 90, 100]
        }
      },
      xaxis: {
        categories: dates,
        title: { text: 'Date' }
      },
      yaxis: {
        title: { text: 'Score de risque' },
        min: 0,
        max: 100
      },
      colors: ['#f44336'],
      title: {
        text: 'Évolution du Score de Risque Global',
        align: 'center'
      }
    };
  }

  updateTrendsChart(): void {
    if (this.migrationTrends.length === 0) return;

    // Grouper par type de statut
    const groupedData = this.migrationTrends.reduce((acc, trend) => {
      if (!acc[trend.type]) {
        acc[trend.type] = [];
      }
      acc[trend.type].push({
        x: trend.date,
        y: trend.count
      });
      return acc;
    }, {} as any);

    const series = Object.entries(groupedData).map(([type, data]) => ({
      name: type,
      data: (data as any[]).map(item => item.y)
    }));

    this.trendsChartOptions = {
      series: series,
      chart: {
        type: 'line',
        height: 350,
        zoom: { enabled: true }
      },
      stroke: {
        curve: 'smooth',
        width: 3
      },
      xaxis: {
        type: 'datetime',
        title: { text: 'Période' }
      },
      yaxis: {
        title: { text: 'Nombre de migrants' }
      },
      colors: this.advancedAnalyticsService.generateChartColors(series.length),
      title: {
        text: 'Tendances Migratoires par Statut',
        align: 'center'
      },
      legend: {
        position: 'top'
      },
      dataLabels: {
        enabled: false
      }
    };
  }

  generateAdvancedInsights(): void {
    this.insights = [];

    // Insights basés sur les statistiques globales
    if (this.globalStats) {
      if (this.globalStats.taux_croissance_mensuel > 15) {
        this.insights.push({
          type: 'negative',
          title: 'Croissance élevée des migrations',
          description: `Le taux de croissance mensuel de ${this.globalStats.taux_croissance_mensuel.toFixed(1)}% indique une augmentation significative des flux migratoires.`,
          confidence: 85
        });
      }

      if (this.globalStats.indicateurs_risque.score_vulnerabilite > 70) {
        this.insights.push({
          type: 'negative',
          title: 'Score de vulnérabilité élevé',
          description: `Le score de vulnérabilité de ${this.globalStats.indicateurs_risque.score_vulnerabilite.toFixed(1)} nécessite une attention particulière.`,
          confidence: 90
        });
      }
    }

    // Insights basés sur l'analyse prédictive
    if (this.advancedPredictiveAnalysis) {
      const highPriorityAlerts = this.alertesPredictives.filter(alert => 
        alert.priorite === 'HAUTE' || alert.priorite === 'CRITIQUE'
      );
      
      if (highPriorityAlerts.length > 0) {
        this.insights.push({
          type: 'negative',
          title: `${highPriorityAlerts.length} alerte(s) de haute priorité`,
          description: 'Des événements critiques sont prévus dans les prochains jours.',
          confidence: 80
        });
      }

      // Insight sur la précision du modèle
      if (this.advancedPredictiveAnalysis.modele_predictif.precision > 85) {
        this.insights.push({
          type: 'positive',
          title: 'Modèle prédictif performant',
          description: `Précision de ${this.advancedPredictiveAnalysis.modele_predictif.precision}% garantit des prédictions fiables.`,
          confidence: 95
        });
      }
    }

    // Insights basés sur l'analyse de risque
    if (this.advancedRiskAnalysis) {
      const riskLevel = this.advancedAnalyticsService.getRiskLevel(this.advancedRiskAnalysis.score_global);
      
      if (riskLevel.level === 'critique' || riskLevel.level === 'eleve') {
        this.insights.push({
          type: 'negative',
          title: `Niveau de risque ${riskLevel.level}`,
          description: `Score global de ${this.advancedRiskAnalysis.score_global.toFixed(1)} avec tendance ${this.advancedRiskAnalysis.tendance_risque.toLowerCase()}.`,
          confidence: 88
        });
      }
    }

    // Générer des insights existants
    if (this.migrationFlowData) {
      this.generateMigrationInsights(this.migrationFlowData);
    }
    if (this.riskAnalysisData) {
      this.generateRiskInsights(this.riskAnalysisData);
    }
  }

  // Méthodes utilitaires pour l'interface
  getRiskLevelInfo(score: number) {
    return this.advancedAnalyticsService.getRiskLevel(score);
  }

  getTrendColor(variation: number): string {
    return this.advancedAnalyticsService.getTrendColor(variation);
  }

  formatProbability(probability: number): string {
    return this.advancedAnalyticsService.formatProbability(probability);
  }

  getAlertIcon(type: string): string {
    return this.advancedAnalyticsService.getAlertIcon(type);
  }

  formatNumber(value: number): string {
    return this.advancedAnalyticsService.formatNumber(value);
  }

  formatDate(dateString: string): string {
    return this.advancedAnalyticsService.formatDate(dateString);
  }

  formatDateTime(dateString: string): string {
    return this.advancedAnalyticsService.formatDateTime(dateString);
  }

  // Méthodes de filtrage et rafraîchissement
  onFilterChange(): void {
    this.loadAllData();
  }

  refreshData(): void {
    this.loadAllData();
  }

 

  setActiveAnalysisTab(tab: string): void {
    this.activeAnalysisTab = tab;
  }

  // Export avancé des données
  exportAdvancedData(): void {
    const dataToExport = {
      globalStats: this.globalStats,
      predictiveAnalysis: this.advancedPredictiveAnalysis,
      migrationTrends: this.migrationTrends,
      riskAnalysis: this.advancedRiskAnalysis,
      modelsPerformance: this.modelsPerformance,
      insights: this.insights,
      exportDate: new Date().toISOString()
    };

    const dataStr = JSON.stringify(dataToExport, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = window.URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `advanced-predictive-analysis-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    window.URL.revokeObjectURL(url);
  }

  trackByInsightTitle(index: number, insight: any): any {
    return insight.title || insight.id || index;
  }

  trackByZoneName(index: number, zone: any): any {
    return zone.ville + '_' + zone.pays || zone.id || index;
  }

  trackByNationality(index: number, trend: any): any {
    return trend.nationalite || trend.id || index;
  }

  trackByRouteId(index: number, route: any): any {
    return route.pays_origine + '_' + route.pays_destination || route.id || index;
  }

  trackByAlertId(index: number, alert: AlertePredictive): any {
    return alert.id || index;
  }

  trackByScenarioName(index: number, scenario: ScenarioPrevision): any {
    return scenario.nom || index;
  }
}

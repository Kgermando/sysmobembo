import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Subject, takeUntil, finalize } from 'rxjs';
import { 
  PredictiveAnalysisService,
  MigrationFlowPrediction,
  RiskPredictionAnalysis,
  DemographicPrediction,
  MovementPatternPrediction
} from '../../services/predictive-analysis.service';
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

  private destroy$ = new Subject<void>();
  
  // Data
  migrationFlowData: MigrationFlowPrediction | null = null;
  riskAnalysisData: RiskPredictionAnalysis | null = null;
  demographicData: DemographicPrediction | null = null;
  movementPatternData: MovementPatternPrediction | null = null;
  
  // UI State
  isLoading = false;
  error: string | null = null;
  activeTab = 'migration-flow';
  
  // Chart configurations
  migrationFlowChartOptions: Partial<ChartOptions> = {};
  riskAnalysisChartOptions: Partial<ChartOptions> = {};
  demographicChartOptions: Partial<ChartOptions> = {};
  seasonalChartOptions: Partial<ChartOptions> = {};
  
  // Filter parameters
  filterParams = {
    periode_days: 30,
    pays_origine: '',
    pays_destination: ''
  };
  
  // Prediction insights
  insights: {
    type: 'positive' | 'negative' | 'neutral';
    title: string;
    description: string;
    confidence: number;
  }[] = [];

  constructor(private predictiveService: PredictiveAnalysisService) {
    this.initializeChartOptions();
  }

  ngOnInit(): void {
    this.loadAllPredictiveData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ===============================
  // DATA LOADING
  // ===============================

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
  // TAB MANAGEMENT
  // ===============================

  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  // ===============================
  // FILTER MANAGEMENT
  // ===============================

  updateFilters(): void {
    this.loadAllPredictiveData();
  }

  resetFilters(): void {
    this.filterParams = {
      periode_days: 30,
      pays_origine: '',
      pays_destination: ''
    };
    this.updateFilters();
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
}

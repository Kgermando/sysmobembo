import { Component, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { ApexAxisChartSeries, ApexChart, ApexXAxis, ApexYAxis, ApexLegend, 
         ApexDataLabels, ApexTooltip, ApexStroke, ApexPlotOptions, 
         ApexFill, ApexGrid, ApexMarkers } from 'ng-apexcharts';
import { Subject, combineLatest, timer } from 'rxjs';
import { takeUntil, map, startWith } from 'rxjs/operators';
import { TrajectoryAnalysisService } from '../../services/trajectory-analysis.service';

@Component({
  selector: 'app-trajectory-analysis',
  standalone: false,
  templateUrl: './trajectory-analysis.component.html',
  styleUrls: ['./trajectory-analysis.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TrajectoryAnalysisComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Loading states
  loading = true;
  trajectoryLoading = false;
  anomalyLoading = false;
  patternLoading = false;

  // Data properties
  trajectoryData: any[] = [];
  anomalyData: any[] = [];
  patternData: any[] = [];
  trajectoryMetrics: any = {};
  movementPatterns: any[] = [];
  speedAnomalies: any[] = [];

  // Chart configurations
  trajectoryChartOptions: any = {};
  speedChartOptions: any = {};
  anomalyChartOptions: any = {};
  patternChartOptions: any = {};
  temporalChartOptions: any = {};

  // Active tab
  activeTab = 'trajectories';

  // Filters
  selectedTimeRange = '7d';
  selectedTrajectoryType = 'all';

  constructor(private trajectoryService: TrajectoryAnalysisService) {
    this.initializeChartOptions();
  }

  ngOnInit(): void {
    this.loadTrajectoryData();
    this.setupAutoRefresh();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeChartOptions(): void {
    // Trajectory Path Chart
    this.trajectoryChartOptions = {
      series: [],
      chart: {
        height: 400,
        type: 'line',
        toolbar: { show: false },
        animations: { enabled: true }
      },
      dataLabels: { enabled: false },
      stroke: {
        curve: 'smooth',
        width: 3
      },
      xaxis: {
        type: 'category',
        categories: [],
        labels: {
          style: { fontSize: '12px', fontWeight: 500 }
        }
      },
      yaxis: {
        title: { text: 'Distance (km)' },
        labels: {
          formatter: (val: number) => `${val.toFixed(1)}`
        }
      },
      legend: {
        position: 'top'
      },
      colors: ['#06b6d4', '#8b5cf6', '#f59e0b', '#ef4444', '#10b981'],
      tooltip: {
        y: {
          formatter: (val: number) => `${val.toFixed(1)} km`
        }
      },
      grid: {
        borderColor: '#f1f5f9',
        strokeDashArray: 3
      }
    };

    // Speed Analysis Chart
    this.speedChartOptions = {
      series: [{
        name: 'Average Speed',
        data: []
      }, {
        name: 'Max Speed',
        data: []
      }],
      chart: {
        height: 350,
        type: 'area',
        toolbar: { show: false }
      },
      dataLabels: { enabled: false },
      stroke: {
        curve: 'smooth',
        width: 2
      },
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.3,
          opacityTo: 0.1,
          stops: [0, 100]
        }
      },
      xaxis: {
        type: 'category',
        categories: []
      },
      yaxis: {
        title: { text: 'Speed (km/h)' }
      },
      colors: ['#3b82f6', '#ef4444'],
      tooltip: {
        y: {
          formatter: (val: number) => `${val.toFixed(1)} km/h`
        }
      }
    };

    // Anomaly Detection Chart
    this.anomalyChartOptions = {
      series: [{
        name: 'Normal Movement',
        data: []
      }, {
        name: 'Speed Anomalies',
        data: []
      }, {
        name: 'Direction Anomalies',
        data: []
      }],
      chart: {
        height: 350,
        type: 'scatter',
        toolbar: { show: false }
      },
      xaxis: {
        title: { text: 'Time (hours)' },
        type: 'numeric'
      },
      yaxis: {
        title: { text: 'Anomaly Score' }
      },
      colors: ['#22c55e', '#f59e0b', '#ef4444'],
      markers: {
        size: 6
      },
      tooltip: {
        y: {
          formatter: (val: number) => `Score: ${val.toFixed(2)}`
        }
      }
    };

    // Movement Pattern Chart
    this.patternChartOptions = {
      series: [{
        name: 'Pattern Frequency',
        data: []
      }],
      chart: {
        height: 300,
        type: 'donut'
      },
      labels: [],
      colors: ['#3b82f6', '#8b5cf6', '#06b6d4', '#f59e0b', '#ef4444'],
      legend: {
        position: 'bottom'
      },
      plotOptions: {
        pie: {
          donut: {
            size: '70%',
            labels: {
              show: true,
              total: {
                show: true,
                label: 'Total Patterns',
                formatter: () => `${this.movementPatterns.length}`
              }
            }
          }
        }
      },
      tooltip: {
        y: {
          formatter: (val: number) => `${val} occurrences`
        }
      }
    };

    // Temporal Pattern Chart
    this.temporalChartOptions = {
      series: [],
      chart: {
        height: 300,
        type: 'heatmap',
        toolbar: { show: false }
      },
      dataLabels: { enabled: false },
      colors: ['#008FFB'],
      title: {
        text: 'Movement Patterns by Time',
        style: { fontSize: '14px', fontWeight: 600 }
      },
      xaxis: {
        type: 'category'
      },
      plotOptions: {
        heatmap: {
          shadeIntensity: 0.5,
          colorScale: {
            ranges: [
              { from: 0, to: 10, color: '#f8fafc', name: 'Low' },
              { from: 11, to: 25, color: '#e2e8f0', name: 'Medium' },
              { from: 26, to: 50, color: '#cbd5e1', name: 'High' },
              { from: 51, to: 100, color: '#94a3b8', name: 'Very High' }
            ]
          }
        }
      }
    };
  }

  private loadTrajectoryData(): void {
    this.loading = true;

    const days = this.selectedTimeRange === '7d' ? 7 : 
                 this.selectedTimeRange === '30d' ? 30 : 
                 this.selectedTimeRange === '90d' ? 90 : 30;

    combineLatest([
      this.trajectoryService.getGroupTrajectories({
        days: days
      }),
      this.trajectoryService.getTrajectoryAnomalies({
        days: days
      }),
      this.trajectoryService.getMovementPatterns({
        days: days
      })
    ]).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: ([trajectories, anomalies, patterns]) => {
        this.trajectoryData = trajectories.trajectories;
        this.anomalyData = anomalies.abnormal_speeds || [];
        this.patternData = patterns.frequent_routes || [];
        this.trajectoryMetrics = {
          totalTrajectories: trajectories.total_count || 0,
          avgDistance: 0,
          avgSpeed: 0,
          completionRate: 0
        };
        this.movementPatterns = patterns.temporal_patterns || [];
        this.speedAnomalies = anomalies.abnormal_speeds || [];

        this.updateCharts();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading trajectory data:', error);
        this.loading = false;
      }
    });
  }

  private updateCharts(): void {
    this.updateTrajectoryChart();
    this.updateSpeedChart();
    this.updateAnomalyChart();
    this.updatePatternChart();
    this.updateTemporalChart();
  }

  private updateTrajectoryChart(): void {
    const series = this.trajectoryData.slice(0, 5).map(trajectory => ({
      name: `Trajectory ${trajectory.id}`,
      data: trajectory.points.map((point: any, index: number) => ({
        x: index,
        y: point.cumulativeDistance
      }))
    }));

    this.trajectoryChartOptions = {
      ...this.trajectoryChartOptions,
      series: series
    };
  }

  private updateSpeedChart(): void {
    const timePoints = this.trajectoryData[0]?.points.map((point: any, index: number) => 
      `Point ${index + 1}`
    ) || [];

    const avgSpeeds = this.trajectoryData[0]?.points.map((point: any) => point.speed) || [];
    const maxSpeeds = this.trajectoryData[0]?.points.map((point: any) => point.maxSpeed || point.speed * 1.5) || [];

    this.speedChartOptions = {
      ...this.speedChartOptions,
      series: [
        { name: 'Average Speed', data: avgSpeeds },
        { name: 'Max Speed', data: maxSpeeds }
      ],
      xaxis: {
        ...this.speedChartOptions.xaxis,
        categories: timePoints
      }
    };
  }

  private updateAnomalyChart(): void {
    const normalPoints = this.anomalyData
      .filter(anomaly => anomaly.type === 'normal')
      .map(anomaly => ({ x: anomaly.timeOffset, y: anomaly.score }));

    const speedAnomalies = this.anomalyData
      .filter(anomaly => anomaly.type === 'speed')
      .map(anomaly => ({ x: anomaly.timeOffset, y: anomaly.score }));

    const directionAnomalies = this.anomalyData
      .filter(anomaly => anomaly.type === 'direction')
      .map(anomaly => ({ x: anomaly.timeOffset, y: anomaly.score }));

    this.anomalyChartOptions = {
      ...this.anomalyChartOptions,
      series: [
        { name: 'Normal Movement', data: normalPoints },
        { name: 'Speed Anomalies', data: speedAnomalies },
        { name: 'Direction Anomalies', data: directionAnomalies }
      ]
    };
  }

  private updatePatternChart(): void {
    const patternCounts = this.movementPatterns.map(pattern => pattern.frequency);
    const patternLabels = this.movementPatterns.map(pattern => pattern.type);

    this.patternChartOptions = {
      ...this.patternChartOptions,
      series: patternCounts,
      labels: patternLabels
    };
  }

  private updateTemporalChart(): void {
    const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`);
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    
    const series = days.map(day => ({
      name: day,
      data: hours.map(hour => ({
        x: hour,
        y: Math.floor(Math.random() * 100) + 1
      }))
    }));

    this.temporalChartOptions = {
      ...this.temporalChartOptions,
      series: series
    };
  }

  private setupAutoRefresh(): void {
    timer(0, 60000).pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      if (!this.loading) {
        this.refreshData();
      }
    });
  }

  private getTimeRange(): { start: Date; end: Date } {
    const end = new Date();
    const start = new Date();
    
    switch (this.selectedTimeRange) {
      case '1d':
        start.setDate(end.getDate() - 1);
        break;
      case '7d':
        start.setDate(end.getDate() - 7);
        break;
      case '30d':
        start.setDate(end.getDate() - 30);
        break;
      default:
        start.setDate(end.getDate() - 7);
    }

    return { start, end };
  }

  onTabChange(tab: string): void {
    this.activeTab = tab;
  }

  onTimeRangeChange(range: string): void {
    this.selectedTimeRange = range;
    this.loadTrajectoryData();
  }

  onTrajectoryTypeChange(type: string): void {
    this.selectedTrajectoryType = type;
    this.loadTrajectoryData();
  }

  refreshData(): void {
    this.loadTrajectoryData();
  }

  exportTrajectoryData(): void {
    this.exportToCSV(this.trajectoryData, 'trajectory-analysis.csv');
  }

  exportAnomalyData(): void {
    this.exportToCSV(this.anomalyData, 'anomaly-detection.csv');
  }

  exportPatternData(): void {
    this.exportToCSV(this.patternData, 'movement-patterns.csv');
  }

  private exportToCSV(data: any[], filename: string): void {
    if (!data || data.length === 0) {
      console.warn('No data to export');
      return;
    }

    const csvContent = this.convertToCSV(data);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  private convertToCSV(data: any[]): string {
    if (!data || data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
        }).join(',')
      )
    ];
    
    return csvRows.join('\n');
  }

  getAnomalyTypeClass(type: string): string {
    switch (type) {
      case 'speed': return 'anomaly-speed';
      case 'direction': return 'anomaly-direction';
      case 'acceleration': return 'anomaly-acceleration';
      default: return 'anomaly-normal';
    }
  }

  getAnomalySeverity(score: number): string {
    if (score >= 0.8) return 'Critical';
    if (score >= 0.6) return 'High';
    if (score >= 0.4) return 'Medium';
    if (score >= 0.2) return 'Low';
    return 'Normal';
  }

  getPatternComplexity(pattern: any): string {
    if (pattern.complexity >= 0.8) return 'Very Complex';
    if (pattern.complexity >= 0.6) return 'Complex';
    if (pattern.complexity >= 0.4) return 'Moderate';
    if (pattern.complexity >= 0.2) return 'Simple';
    return 'Very Simple';
  }

  formatSpeed(speed: number): string {
    return `${speed.toFixed(1)} km/h`;
  }

  formatDistance(distance: number): string {
    return `${distance.toFixed(1)} km`;
  }

  formatDuration(duration: number): string {
    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);
    return `${hours}h ${minutes}m`;
  }

  formatConfidence(confidence: number): string {
    return `${(confidence * 100).toFixed(1)}%`;
  }
}

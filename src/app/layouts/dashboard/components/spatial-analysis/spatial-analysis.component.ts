import { Component, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { ApexAxisChartSeries, ApexChart, ApexXAxis, ApexYAxis, ApexLegend, 
         ApexDataLabels, ApexTooltip, ApexStroke, ApexPlotOptions, 
         ApexFill, ApexGrid, ApexMarkers } from 'ng-apexcharts';
import { Subject, combineLatest, timer } from 'rxjs';
import { takeUntil, map, startWith } from 'rxjs/operators';
import { SpatialAnalysisService } from '../../services/spatial-analysis.service';

@Component({
  selector: 'app-spatial-analysis',
  standalone: false,
  templateUrl: './spatial-analysis.component.html',
  styleUrls: ['./spatial-analysis.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SpatialAnalysisComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Loading states
  loading = true;
  densityLoading = false;
  corridorLoading = false;
  proximityLoading = false;

  // Data properties
  densityData: any[] = [];
  corridorData: any[] = [];
  proximityData: any[] = [];
  spatialMetrics: any = {};
  densityClusters: any[] = [];

  // Chart configurations
  densityChartOptions: any = {};
  corridorChartOptions: any = {};
  proximityChartOptions: any = {};
  clusterChartOptions: any = {};
  heatmapChartOptions: any = {};

  // Active tab
  activeTab = 'density';

  constructor(private spatialService: SpatialAnalysisService) {
    this.initializeChartOptions();
  }

  ngOnInit(): void {
    this.loadSpatialData();
    this.setupAutoRefresh();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeChartOptions(): void {
    // Density Analysis Chart
    this.densityChartOptions = {
      series: [{
        name: 'Population Density',
        data: []
      }],
      chart: {
        height: 350,
        type: 'area',
        toolbar: { show: false },
        animations: { enabled: true }
      },
      dataLabels: { enabled: false },
      stroke: {
        curve: 'smooth',
        width: 3,
        colors: ['#6366f1']
      },
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.7,
          opacityTo: 0.1,
          stops: [0, 100]
        }
      },
      xaxis: {
        type: 'category',
        categories: [],
        labels: {
          style: { fontSize: '12px', fontWeight: 500 }
        }
      },
      yaxis: {
        title: { text: 'Density (per km²)' },
        labels: {
          formatter: (val: number) => `${val.toFixed(0)}`
        }
      },
      tooltip: {
        y: {
          formatter: (val: number) => `${val.toFixed(1)} people/km²`
        }
      },
      grid: {
        borderColor: '#f1f5f9',
        strokeDashArray: 3
      }
    };

    // Migration Corridor Chart
    this.corridorChartOptions = {
      series: [],
      chart: {
        height: 350,
        type: 'line',
        toolbar: { show: false }
      },
      dataLabels: { enabled: false },
      stroke: {
        curve: 'smooth',
        width: 3
      },
      xaxis: {
        type: 'category',
        categories: []
      },
      yaxis: {
        title: { text: 'Migration Flow' },
        labels: {
          formatter: (val: number) => `${val.toFixed(0)}`
        }
      },
      legend: {
        position: 'top'
      },
      colors: ['#06b6d4', '#8b5cf6', '#f59e0b', '#ef4444'],
      tooltip: {
        y: {
          formatter: (val: number) => `${val.toFixed(0)} migrants`
        }
      }
    };

    // Proximity Analysis Chart
    this.proximityChartOptions = {
      series: [{
        name: 'Average Distance',
        data: []
      }],
      chart: {
        height: 350,
        type: 'bar',
        toolbar: { show: false }
      },
      plotOptions: {
        bar: {
          borderRadius: 8,
          horizontal: false,
          columnWidth: '60%'
        }
      },
      dataLabels: {
        enabled: true,
        formatter: (val: number) => `${val.toFixed(1)}km`
      },
      stroke: {
        show: true,
        width: 2,
        colors: ['transparent']
      },
      xaxis: {
        categories: [],
        labels: {
          style: { fontSize: '12px' }
        }
      },
      yaxis: {
        title: { text: 'Distance (km)' }
      },
      fill: {
        opacity: 1,
        colors: ['#10b981']
      },
      tooltip: {
        y: {
          formatter: (val: number) => `${val.toFixed(1)} km`
        }
      }
    };

    // Cluster Analysis Chart
    this.clusterChartOptions = {
      series: [{
        name: 'Cluster Size',
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
                label: 'Total Clusters',
                formatter: () => `${this.densityClusters.length}`
              }
            }
          }
        }
      },
      tooltip: {
        y: {
          formatter: (val: number) => `${val} people`
        }
      }
    };

    // Spatial Heatmap Chart
    this.heatmapChartOptions = {
      series: [],
      chart: {
        height: 300,
        type: 'heatmap',
        toolbar: { show: false }
      },
      dataLabels: { enabled: false },
      colors: ['#008FFB'],
      title: {
        text: 'Spatial Distribution Heatmap',
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
              { from: 0, to: 50, color: '#f8fafc', name: 'Low' },
              { from: 51, to: 100, color: '#e2e8f0', name: 'Medium' },
              { from: 101, to: 200, color: '#cbd5e1', name: 'High' },
              { from: 201, to: 500, color: '#94a3b8', name: 'Very High' }
            ]
          }
        }
      }
    };
  }

  private loadSpatialData(): void {
    this.loading = true;

    combineLatest([
      this.spatialService.getSpatialDensityAnalysis({
        radius: 100,
        days: 30,
        min_migrants: 3
      }),
      this.spatialService.getMigrationCorridors({
        days: 30,
        min_flow: 5
      }),
      this.spatialService.getProximityAnalysis({
        latitude: 35.7596,
        longitude: -5.8340,
        radius: 100,
        days: 30
      }),
      this.spatialService.getAreasOfInterest({
        days: 30,
        min_activity: 10
      })
    ]).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: ([density, corridor, proximity, areas]) => {
        this.densityData = (density as any)['density_zones'] || [];
        this.corridorData = corridor.corridors || [];
        this.proximityData = (proximity as any)['analysis_data'] || [];
        this.spatialMetrics = {
          totalClusters: (density as any)['total_zones'] || 0,
          coverageArea: (density as any)['total_area'] || 0,
          activeCorrridors: (corridor as any)['total_corridors'] || 0,
          avgDistance: (proximity as any)['avg_distance'] || 0
        };
        this.densityClusters = (density as any)['density_zones'] || [];

        this.updateCharts();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading spatial data:', error);
        this.loading = false;
      }
    });
  }

  private updateCharts(): void {
    this.updateDensityChart();
    this.updateCorridorChart();
    this.updateProximityChart();
    this.updateClusterChart();
    this.updateHeatmapChart();
  }

  private updateDensityChart(): void {
    const chartData = this.densityData.map(item => ({
      x: item.ville || item.region || 'Unknown',
      y: item.density_score || item.density || 0
    }));

    this.densityChartOptions = {
      ...this.densityChartOptions,
      series: [{
        name: 'Population Density',
        data: chartData.map(item => item.y)
      }],
      xaxis: {
        ...this.densityChartOptions.xaxis,
        categories: chartData.map(item => item.x)
      }
    };
  }

  private updateCorridorChart(): void {
    const series = this.corridorData.map(corridor => ({
      name: `${corridor.origin} → ${corridor.destination}`,
      data: corridor.monthlyData.map((item: any) => item.count)
    }));

    const categories = this.corridorData[0]?.monthlyData.map((item: any) => 
      new Date(item.month).toLocaleDateString('en-US', { month: 'short' })
    ) || [];

    this.corridorChartOptions = {
      ...this.corridorChartOptions,
      series: series,
      xaxis: {
        ...this.corridorChartOptions.xaxis,
        categories: categories
      }
    };
  }

  private updateProximityChart(): void {
    const chartData = this.proximityData.map(item => ({
      x: item.center,
      y: item.avgDistance
    }));

    this.proximityChartOptions = {
      ...this.proximityChartOptions,
      series: [{
        name: 'Average Distance',
        data: chartData.map(item => item.y)
      }],
      xaxis: {
        ...this.proximityChartOptions.xaxis,
        categories: chartData.map(item => item.x)
      }
    };
  }

  private updateClusterChart(): void {
    const clusterSizes = this.densityClusters.map(cluster => cluster.size);
    const clusterLabels = this.densityClusters.map(cluster => cluster.label);

    this.clusterChartOptions = {
      ...this.clusterChartOptions,
      series: clusterSizes,
      labels: clusterLabels
    };
  }

  private updateHeatmapChart(): void {
    // Generate sample heatmap data
    const regions = ['North', 'South', 'East', 'West', 'Central'];
    const timeSlots = ['00:00', '06:00', '12:00', '18:00'];
    
    const series = timeSlots.map(time => ({
      name: time,
      data: regions.map(region => ({
        x: region,
        y: Math.floor(Math.random() * 300) + 50
      }))
    }));

    this.heatmapChartOptions = {
      ...this.heatmapChartOptions,
      series: series
    };
  }

  private setupAutoRefresh(): void {
    timer(0, 30000).pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      if (!this.loading) {
        this.refreshData();
      }
    });
  }

  onTabChange(tab: string): void {
    this.activeTab = tab;
  }

  refreshData(): void {
    this.loadSpatialData();
  }

  exportDensityData(): void {
    this.exportToCSV(this.densityData, 'density-analysis.csv');
  }

  exportCorridorData(): void {
    this.exportToCSV(this.corridorData, 'corridor-analysis.csv');
  }

  exportProximityData(): void {
    this.exportToCSV(this.proximityData, 'proximity-analysis.csv');
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
          return typeof value === 'string' ? `"${value}"` : value;
        }).join(',')
      )
    ];
    
    return csvRows.join('\n');
  }

  getDensityColor(density: number): string {
    if (density < 50) return '#22c55e';
    if (density < 100) return '#f59e0b';
    if (density < 200) return '#ef4444';
    return '#dc2626';
  }

  getClusterSizeClass(size: number): string {
    if (size < 100) return 'small';
    if (size < 500) return 'medium';
    if (size < 1000) return 'large';
    return 'xlarge';
  }

  formatDistance(distance: number): string {
    return `${distance.toFixed(1)} km`;
  }

  formatDensity(density: number): string {
    return `${density.toFixed(1)} people/km²`;
  }

  getCorridorIntensity(intensity: number): string {
    if (intensity >= 80) return 'Very High';
    if (intensity >= 60) return 'High';
    if (intensity >= 40) return 'Medium';
    if (intensity >= 20) return 'Low';
    return 'Very Low';
  }

  getCorridorIntensityClass(intensity: number): string {
    if (intensity >= 80) return 'very-high';
    if (intensity >= 60) return 'high';
    if (intensity >= 40) return 'medium';
    if (intensity >= 20) return 'low';
    return 'very-low';
  }
}

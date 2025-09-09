import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Subject, takeUntil, timer, switchMap } from 'rxjs';
import { 
  RealtimeMonitoringService,
  RealtimeDashboardData,
  RealtimeAlertsData,
  RealtimeMovementsData,
  RealtimeStatusData,
  RecentActivity
} from '../../services/realtime-monitoring.service';
import { ChartComponent, ApexAxisChartSeries, ApexChart, ApexXAxis, ApexTitleSubtitle, ApexDataLabels, ApexStroke, ApexYAxis, ApexLegend, ApexPlotOptions } from 'ng-apexcharts';

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  title: ApexTitleSubtitle;
  stroke: ApexStroke;
  yaxis: ApexYAxis;
  legend: ApexLegend;
  plotOptions: ApexPlotOptions;
  colors: string[];
  dataLabels: ApexDataLabels;
  labels: string[];
};

@Component({
  selector: 'app-realtime-dashboard',
  standalone: false,
  templateUrl: './realtime-dashboard.component.html',
  styleUrl: './realtime-dashboard.component.scss'
})
export class RealtimeDashboardComponent implements OnInit, OnDestroy {
  @ViewChild('alertsChart') alertsChart!: ChartComponent;
  @ViewChild('movementsChart') movementsChart!: ChartComponent;
  @ViewChild('statusChart') statusChart!: ChartComponent;

  private destroy$ = new Subject<void>();
  
  // Dashboard data
  dashboardData: RealtimeDashboardData | null = null;
  alertsData: RealtimeAlertsData | null = null;
  movementsData: RealtimeMovementsData | null = null;
  statusData: RealtimeStatusData | null = null;
  
  // UI State
  isLoading = false;
  error: string | null = null;
  lastUpdateTime: Date = new Date();
  autoRefreshEnabled = true;
  
  // Chart configurations
  alertsChartOptions: Partial<ChartOptions> = {};
  movementsChartOptions: Partial<ChartOptions> = {};
  statusChartOptions: Partial<ChartOptions> = {};
  
  // Activity filters
  activityFilters = {
    priority: 'all' as 'all' | 'info' | 'danger' | 'critical',
    type: 'all' as 'all' | 'nouveau_migrant' | 'nouvelle_alerte' | 'nouvelle_localisation'
  };
  
  // Pagination for activities
  activitiesPerPage = 10;
  currentActivitiesPage = 1;
  
  constructor(private realtimeService: RealtimeMonitoringService) {
    this.initializeChartOptions();
  }

  ngOnInit(): void {
    this.loadAllRealtimeData();
    this.startAutoRefresh();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ===============================
  // DATA LOADING
  // ===============================

  loadAllRealtimeData(): void {
    this.isLoading = true;
    this.error = null;

    // Load dashboard overview
    this.realtimeService.getRealtimeDashboard()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.dashboardData = data;
          this.lastUpdateTime = new Date();
        },
        error: (error) => {
          this.error = 'Erreur lors du chargement du tableau de bord';
          console.error('Dashboard error:', error);
        }
      });

    // Load alerts data
    this.realtimeService.getRealtimeAlerts()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.alertsData = data;
          this.updateAlertsChart(data);
        },
        error: (error) => {
          console.error('Alerts error:', error);
        }
      });

    // Load movements data
    this.realtimeService.getRealtimeMovements()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.movementsData = data;
          this.updateMovementsChart(data);
        },
        error: (error) => {
          console.error('Movements error:', error);
        }
      });

    // Load status data
    this.realtimeService.getRealtimeStatus()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.statusData = data;
          this.updateStatusChart(data);
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Status error:', error);
          this.isLoading = false;
        }
      });
  }

  startAutoRefresh(): void {
    if (this.autoRefreshEnabled) {
      timer(30000, 30000) // Refresh every 30 seconds
        .pipe(
          takeUntil(this.destroy$),
          switchMap(() => this.realtimeService.getRealtimeDashboard())
        )
        .subscribe({
          next: (data) => {
            this.dashboardData = data;
            this.lastUpdateTime = new Date();
          },
          error: (error) => {
            console.error('Auto refresh error:', error);
          }
        });
    }
  }

  toggleAutoRefresh(): void {
    this.autoRefreshEnabled = !this.autoRefreshEnabled;
    if (this.autoRefreshEnabled) {
      this.startAutoRefresh();
    }
  }

  // ===============================
  // CHART INITIALIZATION
  // ===============================

  private initializeChartOptions(): void {
    // Alerts chart configuration
    this.alertsChartOptions = {
      series: [],
      chart: {
        type: 'donut',
        height: 350,
        toolbar: { show: false }
      },
      legend: {
        position: 'bottom'
      },
      colors: ['#f44336', '#ff9800', '#ffeb3b', '#4caf50'],
      title: {
        text: 'Répartition des alertes par gravité',
        align: 'center'
      }
    };

    // Movements chart configuration
    this.movementsChartOptions = {
      series: [],
      chart: {
        type: 'bar',
        height: 350,
        toolbar: { show: false }
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: '55%',
        }
      },
      stroke: {
        show: true,
        width: 2,
        colors: ['transparent']
      },
      xaxis: {
        categories: []
      },
      yaxis: {
        title: {
          text: 'Nombre de mouvements'
        }
      },
      colors: ['#2196f3'],
      title: {
        text: 'Points chauds d\'activité',
        align: 'center'
      }
    };

    // Status chart configuration
    this.statusChartOptions = {
      series: [],
      chart: {
        type: 'area',
        height: 350,
        toolbar: { show: false }
      },
      stroke: {
        curve: 'smooth'
      },
      xaxis: {
        categories: []
      },
      yaxis: {
        title: {
          text: 'Nombre d\'enregistrements'
        }
      },
      colors: ['#4caf50'],
      title: {
        text: 'Évolution quotidienne des enregistrements',
        align: 'center'
      }
    };
  }

  // ===============================
  // CHART UPDATES
  // ===============================

  private updateAlertsChart(data: RealtimeAlertsData): void {
    if (data.alerts_by_gravity) {
      const series = data.alerts_by_gravity.map(item => item.count);
      const labels = data.alerts_by_gravity.map(item => {
        switch(item.niveau_gravite) {
          case 'critical': return 'Critique';
          case 'danger': return 'Danger';
          case 'warning': return 'Avertissement';
          default: return 'Info';
        }
      });

      this.alertsChartOptions = {
        ...this.alertsChartOptions,
        series: [{ data: series }],
          xaxis: {
            ...this.alertsChartOptions.xaxis,
            categories: labels
          }
      };
    }
  }

  private updateMovementsChart(data: RealtimeMovementsData): void {
    if (data.hot_spots) {
      const series = [{
        name: 'Migrants uniques',
        data: data.hot_spots.map(spot => spot.migrants_uniques)
      }];
      
      const categories = data.hot_spots.map(spot => `${spot.ville}, ${spot.pays}`);

      this.movementsChartOptions = {
        ...this.movementsChartOptions,
        series: series,
        xaxis: {
          ...this.movementsChartOptions.xaxis,
          categories: categories
        }
      };
    }
  }

  private updateStatusChart(data: RealtimeStatusData): void {
    if (data.daily_evolution) {
      const series = [{
        name: 'Enregistrements',
        data: data.daily_evolution.map(item => item.count)
      }];
      
      const categories = data.daily_evolution.map(item => 
        new Date(item.date).toLocaleDateString('fr-FR', { 
          month: 'short', 
          day: 'numeric' 
        })
      );

      this.statusChartOptions = {
        ...this.statusChartOptions,
        series: series,
        xaxis: {
          ...this.statusChartOptions.xaxis,
          categories: categories
        }
      };
    }
  }

  // ===============================
  // ACTIVITY MANAGEMENT
  // ===============================

  get filteredActivities(): RecentActivity[] {
    if (!this.dashboardData?.recent_activities) return [];

    let activities = this.dashboardData.recent_activities;

    // Filter by priority
    if (this.activityFilters.priority !== 'all') {
      activities = activities.filter(activity => 
        activity.urgence === this.activityFilters.priority
      );
    }

    // Filter by type
    if (this.activityFilters.type !== 'all') {
      activities = activities.filter(activity => 
        activity.type === this.activityFilters.type
      );
    }

    return activities;
  }

  get paginatedActivities(): RecentActivity[] {
    const startIndex = (this.currentActivitiesPage - 1) * this.activitiesPerPage;
    const endIndex = startIndex + this.activitiesPerPage;
    return this.filteredActivities.slice(startIndex, endIndex);
  }

  get totalActivitiesPages(): number {
    return Math.ceil(this.filteredActivities.length / this.activitiesPerPage);
  }

  onActivityFilterChange(): void {
    this.currentActivitiesPage = 1;
  }

  getActivityIcon(type: string): string {
    return this.realtimeService.getActivityIcon(type);
  }

  getUrgencyColor(urgence: string): string {
    return this.realtimeService.getUrgencyColor(urgence);
  }

  formatRelativeTime(date: Date): string {
    return this.realtimeService.formatRelativeTime(date);
  }

  // ===============================
  // SYSTEM HEALTH
  // ===============================

  getSystemHealthStatus(): any {
    if (!this.statusData?.system_status) return null;
    
    return this.realtimeService.getSystemHealthStatus(
      this.statusData.system_status.response_time_ms
    );
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'operational':
        return 'check_circle';
      case 'warning':
        return 'warning';
      case 'error':
        return 'error';
      default:
        return 'help';
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'operational':
        return '#4caf50';
      case 'warning':
        return '#ff9800';
      case 'error':
        return '#f44336';
      default:
        return '#6c757d';
    }
  }

  // ===============================
  // UTILITY METHODS
  // ===============================

  refreshData(): void {
    this.loadAllRealtimeData();
  }

  getPercentageChange(current: number, previous: number): any {
    return this.realtimeService.calculatePercentageChange(current, previous);
  }

  exportRealtimeData(): void {
    const data = {
      dashboard: this.dashboardData,
      alerts: this.alertsData,
      movements: this.movementsData,
      status: this.statusData,
      exportDate: new Date()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { 
      type: 'application/json' 
    });
    
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `realtime-dashboard-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    window.URL.revokeObjectURL(url);
  }

  trackByActivityId(index: number, activity: any): any {
    return activity.id || activity.activity_id || index;
  }
}

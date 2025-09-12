import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { Subject, takeUntil, finalize, interval } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';

declare var L: any; // Leaflet maps

// Service simple pour les données GIS
class GisDashboardService {
  private apiUrl = `${environment.apiUrl}/dashboard/gis`;

  constructor(private http: HttpClient) {}

  getGISStatistics() {
    return this.http.get<any>(`${this.apiUrl}/statistics`);
  }

  getMigrationHeatmap() {
    return this.http.get<any>(`${this.apiUrl}/heatmap`);
  }

  getLiveMigrationData() {
    return this.http.get<any>(`${this.apiUrl}/live-data`);
  }

  getPredictiveInsights() {
    return this.http.get<any>(`${this.apiUrl}/predictive-insights`);
  }

  getInteractiveMap() {
    return this.http.get<any>(`${this.apiUrl}/interactive-map`);
  }
}

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

interface PredictiveData {
  next_month_prediction: number;
  trend_direction: string;
  seasonal_patterns: SeasonalPattern[];
  risk_predictions: RiskPrediction[];
  population_growth_rate: number;
  predicted_hotspots: PredictedHotspot[];
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

@Component({
  selector: 'app-gis-dashboard',
  standalone: false,
  templateUrl: './gis-dashboard.component.html',
  styleUrl: './gis-dashboard.component.scss'
})
export class GisDashboardComponent implements OnInit, OnDestroy {
  @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef;

  private destroy$ = new Subject<void>();
  
  // Map instance and configuration
  private map: any;
  private layerGroups: { [key: string]: any } = {};
  private baseLayers: { [key: string]: any } = {};
  private overlayLayers: { [key: string]: any } = {};
  
  // Data from API
  gisStatistics: GISStatistics | null = null;
  heatmapData: DensityPoint[] = [];
  liveData: RealTimePosition[] = [];
  predictiveInsights: PredictiveData | null = null;
  
  // UI State
  isLoading = false;
  error: string | null = null;
  selectedView: 'overview' | 'heatmap' | 'live' | 'predictive' | 'interactive' = 'overview';
  autoRefresh = true;
  refreshInterval = 30000; // 30 seconds
  selectedTool: string | null = null;
  
  // Filter parameters
  filterParams = {
    days: 30,
    minFlow: 1,
    intensityType: 'high'
  };
  
  // Statistics for dashboard widgets
  totalMigrants = 0;
  migrantsByCountry: CountryStats[] = [];
  migrantsByStatus: StatusStats[] = [];
  monthlyFlows: MonthlyFlow[] = [];
  hotspots: Hotspot[] = [];
  corridors: Corridor[] = [];
  riskZones: RiskZone[] = [];

  private gisService: GisDashboardService;

  constructor(private http: HttpClient) {
    this.gisService = new GisDashboardService(this.http);
  }

  ngOnInit(): void {
    this.initializeMap();
    this.loadInitialData();
    this.setupAutoRefresh();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    
    if (this.map) {
      this.map.remove();
    }
  }

  // ===============================
  // MAP INITIALIZATION
  // ===============================

  private initializeMap(): void {
    // Initialize Leaflet map with RDC center
    this.map = L.map(this.mapContainer.nativeElement, {
      center: [-4.4419, 15.2663], // Kinshasa, RDC
      zoom: 6,
      zoomControl: true,
      attributionControl: true
    });

    // Add base layers
    this.baseLayers = {
      'Satellite': L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri'
      }),
      'Streets': L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }),
      'Terrain': L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenTopoMap contributors'
      })
    };

    // Set default base layer
    this.baseLayers['Satellite'].addTo(this.map);

    // Initialize layer groups
    this.layerGroups = {
      hotspots: L.layerGroup(),
      corridors: L.layerGroup(),
      realtime: L.layerGroup(),
      riskZones: L.layerGroup(),
      heatmap: L.layerGroup(),
      predictive: L.layerGroup()
    };

    // Add overlay layers
    this.overlayLayers = {
      'Points chauds': this.layerGroups['hotspots'],
      'Corridors migratoires': this.layerGroups['corridors'],
      'Positions temps réel': this.layerGroups['realtime'],
      'Zones de risque': this.layerGroups['riskZones'],
      'Carte de densité': this.layerGroups['heatmap'],
      'Prédictions': this.layerGroups['predictive']
    };

    L.control.layers(this.baseLayers, this.overlayLayers).addTo(this.map);

    // Add scale control
    L.control.scale().addTo(this.map);

    // Add custom controls
    this.addCustomControls();
  }

  private addCustomControls(): void {
    // View selector control
    const viewControl = L.control({ position: 'topright' });
    
    viewControl.onAdd = () => {
      const div = L.DomUtil.create('div', 'gis-view-control');
      div.innerHTML = `
        <div class="btn-group-vertical" role="group">
          <button type="button" class="btn btn-sm btn-primary" data-view="overview" title="Vue d'ensemble">
            <i class="material-icons">dashboard</i>
          </button>
          <button type="button" class="btn btn-sm btn-outline-primary" data-view="heatmap" title="Carte de chaleur">
            <i class="material-icons">whatshot</i>
          </button>
          <button type="button" class="btn btn-sm btn-outline-primary" data-view="live" title="Temps réel">
            <i class="material-icons">track_changes</i>
          </button>
          <button type="button" class="btn btn-sm btn-outline-primary" data-view="predictive" title="Prédictions">
            <i class="material-icons">trending_up</i>
          </button>
        </div>
      `;
      
      L.DomEvent.disableClickPropagation(div);
      
      div.addEventListener('click', (e: Event) => {
        const target = e.target as HTMLElement;
        const button = target.closest('[data-view]') as HTMLElement;
        if (button) {
          this.switchView(button.dataset['view'] as any);
          // Update button states
          div.querySelectorAll('.btn').forEach((btn: Element) => btn.className = 'btn btn-sm btn-outline-primary');
          button.className = 'btn btn-sm btn-primary';
        }
      });
      
      return div;
    };
    
    viewControl.addTo(this.map);

    // Auto-refresh toggle
    const refreshControl = L.control({ position: 'bottomright' });
    
    refreshControl.onAdd = () => {
      const div = L.DomUtil.create('div', 'gis-refresh-control');
      div.innerHTML = `
        <button type="button" class="btn btn-sm ${this.autoRefresh ? 'btn-success' : 'btn-outline-secondary'}" 
                id="autoRefreshBtn" title="Actualisation automatique">
          <i class="material-icons">refresh</i>
        </button>
      `;
      
      L.DomEvent.disableClickPropagation(div);
      
      div.addEventListener('click', () => {
        this.toggleAutoRefresh();
        const btn = div.querySelector('#autoRefreshBtn') as HTMLElement;
        btn.className = `btn btn-sm ${this.autoRefresh ? 'btn-success' : 'btn-outline-secondary'}`;
      });
      
      return div;
    };
    
    refreshControl.addTo(this.map);
  }

  // ===============================
  // DATA LOADING
  // ===============================

  private loadInitialData(): void {
    this.loadGISStatistics();
  }

  loadGISStatistics(): void {
    this.isLoading = true;
    this.error = null;

    this.gisService.getGISStatistics()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (data: any) => {
          this.gisStatistics = data;
          this.processStatisticsData(data);
          this.renderAllLayers();
        },
        error: (error: any) => {
          this.error = 'Erreur lors du chargement des statistiques GIS';
          console.error('GIS Statistics error:', error);
        }
      });
  }

  loadHeatmapData(): void {
    this.gisService.getMigrationHeatmap()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: any) => {
          this.heatmapData = data.heatmap_data;
          this.renderHeatmapLayer();
        },
        error: (error: any) => {
          console.error('Heatmap error:', error);
        }
      });
  }

  loadLiveData(): void {
    this.gisService.getLiveMigrationData()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: any) => {
          this.liveData = data.live_data;
          this.renderRealTimeLayer();
        },
        error: (error: any) => {
          console.error('Live data error:', error);
        }
      });
  }

  loadPredictiveInsights(): void {
    this.gisService.getPredictiveInsights()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: any) => {
          this.predictiveInsights = data.predictive_insights;
          this.renderPredictiveLayer();
        },
        error: (error: any) => {
          console.error('Predictive insights error:', error);
        }
      });
  }

  loadInteractiveMap(): void {
    this.gisService.getInteractiveMap()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: any) => {
          // Process and render all interactive map data
          this.renderInteractiveMapData(data.map_data);
        },
        error: (error: any) => {
          console.error('Interactive map error:', error);
        }
      });
  }

  private processStatisticsData(data: GISStatistics): void {
    this.totalMigrants = data.total_migrants;
    this.migrantsByCountry = data.migrants_by_country;
    this.migrantsByStatus = data.migrants_by_status;
    this.monthlyFlows = data.migration_flows_by_month;
    this.hotspots = data.hotspot_locations;
    this.corridors = data.migration_corridors;
    this.riskZones = data.risk_zones;
  }

  // ===============================
  // LAYER RENDERING
  // ===============================

  private renderAllLayers(): void {
    this.renderHotspotsLayer();
    this.renderCorridorsLayer();
    this.renderRiskZonesLayer();
    
    // Also load additional data for complete view
    this.loadHeatmapData();
    this.loadLiveData();
  }

  private renderHotspotsLayer(): void {
    this.layerGroups['hotspots'].clearLayers();

    this.hotspots.forEach(hotspot => {
      const marker = L.circleMarker([hotspot.latitude, hotspot.longitude], {
        radius: 8 + (hotspot.intensity * 15),
        fillColor: this.getHotspotColor(hotspot.intensity),
        color: '#ffffff',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.7
      });

      const popupContent = `
        <div class="gis-popup">
          <h6><i class="material-icons">place</i> ${hotspot.city}, ${hotspot.country}</h6>
          <p><strong>Type:</strong> ${hotspot.type}</p>
          <p><strong>Migrants:</strong> ${hotspot.count}</p>
          <p><strong>Intensité:</strong> ${(hotspot.intensity * 100).toFixed(1)}%</p>
          <p><strong>Description:</strong> ${hotspot.description}</p>
        </div>
      `;

      marker.bindPopup(popupContent);
      marker.addTo(this.layerGroups['hotspots']);
    });

    // Add hotspots layer to map by default
    this.layerGroups['hotspots'].addTo(this.map);
  }

  private renderCorridorsLayer(): void {
    this.layerGroups['corridors'].clearLayers();

    this.corridors.forEach(corridor => {
      const polyline = L.polyline([
        [corridor.from_latitude, corridor.from_longitude],
        [corridor.to_latitude, corridor.to_longitude]
      ], {
        color: '#2196f3',
        weight: Math.min(8, Math.max(2, corridor.count / 5)),
        opacity: 0.8,
        dashArray: corridor.flow_direction === 'unidirectional' ? '' : '10, 10'
      });

      // Add arrow for direction
      const decorator = L.polylineDecorator(polyline, {
        patterns: [{
          offset: '50%',
          repeat: 0,
          symbol: L.Symbol.arrowHead({
            pixelSize: 15,
            polygon: false,
            pathOptions: { stroke: true, weight: 2, color: '#2196f3' }
          })
        }]
      });

      const popupContent = `
        <div class="gis-popup">
          <h6><i class="material-icons">trending_flat</i> Corridor migratoire</h6>
          <p><strong>De:</strong> ${corridor.from_country}</p>
          <p><strong>Vers:</strong> ${corridor.to_country}</p>
          <p><strong>Flux:</strong> ${corridor.count} migrants</p>
          <p><strong>Direction:</strong> ${corridor.flow_direction === 'unidirectional' ? 'Unidirectionnel' : 'Bidirectionnel'}</p>
        </div>
      `;

      polyline.bindPopup(popupContent);
      polyline.addTo(this.layerGroups['corridors']);
      
      if (decorator) {
        decorator.addTo(this.layerGroups['corridors']);
      }
    });
  }

  private renderRiskZonesLayer(): void {
    this.layerGroups['riskZones'].clearLayers();

    this.riskZones.forEach(zone => {
      const circle = L.circle([zone.latitude, zone.longitude], {
        radius: zone.radius * 1000, // Convert to meters
        fillColor: this.getRiskZoneColor(zone.risk_level),
        color: this.getRiskZoneColor(zone.risk_level),
        weight: 2,
        opacity: 0.8,
        fillOpacity: 0.3
      });

      const popupContent = `
        <div class="gis-popup">
          <h6><i class="material-icons">warning</i> ${zone.name}</h6>
          <p><strong>Niveau de risque:</strong> 
            <span class="badge" style="background-color: ${this.getRiskZoneColor(zone.risk_level)}">${zone.risk_level}</span>
          </p>
          <p><strong>Score:</strong> ${zone.risk_score}/10</p>
          <p><strong>Alertes:</strong> ${zone.alert_count}</p>
          <p><strong>Facteurs:</strong> ${zone.factors.join(', ')}</p>
          <p><strong>Dernière MAJ:</strong> ${new Date(zone.last_update).toLocaleString()}</p>
        </div>
      `;

      circle.bindPopup(popupContent);
      circle.addTo(this.layerGroups['riskZones']);
    });
  }

  private renderHeatmapLayer(): void {
    this.layerGroups['heatmap'].clearLayers();

    this.heatmapData.forEach(point => {
      const circle = L.circleMarker([point.latitude, point.longitude], {
        radius: 5 + (point.density * 20),
        fillColor: this.getHeatmapColor(point.density),
        color: 'transparent',
        fillOpacity: 0.6
      });

      circle.bindTooltip(`Densité: ${(point.density * 100).toFixed(1)}%`, {
        permanent: false,
        direction: 'top'
      });

      circle.addTo(this.layerGroups['heatmap']);
    });
  }

  private renderRealTimeLayer(): void {
    this.layerGroups['realtime'].clearLayers();

    this.liveData.forEach(position => {
      const marker = L.circleMarker([position.latitude, position.longitude], {
        radius: 6,
        fillColor: this.getRiskLevelColor(position.risk_level),
        color: '#ffffff',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.8
      });

      // Add pulsing animation for real-time effect
      marker.bindTooltip(`${position.migrant_name} - ${position.status}`, {
        permanent: false,
        direction: 'top'
      });

      const popupContent = `
        <div class="gis-popup">
          <h6><i class="material-icons">person_pin</i> ${position.migrant_name}</h6>
          <p><strong>Localisation:</strong> ${position.city}, ${position.country}</p>
          <p><strong>Statut:</strong> ${position.status}</p>
          <p><strong>Type mouvement:</strong> ${position.movement_type}</p>
          <p><strong>Niveau de risque:</strong> 
            <span class="badge" style="background-color: ${this.getRiskLevelColor(position.risk_level)}">${position.risk_level}</span>
          </p>
          <p><strong>Dernière MAJ:</strong> ${new Date(position.last_update).toLocaleString()}</p>
        </div>
      `;

      marker.bindPopup(popupContent);
      marker.addTo(this.layerGroups['realtime']);
    });
  }

  private renderPredictiveLayer(): void {
    if (!this.predictiveInsights) return;

    this.layerGroups['predictive'].clearLayers();

    this.predictiveInsights.predicted_hotspots.forEach(hotspot => {
      const marker = L.circleMarker([hotspot.latitude, hotspot.longitude], {
        radius: 8 + (hotspot.probability * 12),
        fillColor: '#ff9800',
        color: '#ffffff',
        weight: 2,
        opacity: 0.7,
        fillOpacity: 0.5,
        dashArray: '5, 5'
      });

      const popupContent = `
        <div class="gis-popup">
          <h6><i class="material-icons">trending_up</i> Point chaud prédit</h6>
          <p><strong>Probabilité:</strong> ${(hotspot.probability * 100).toFixed(1)}%</p>
          <p><strong>Délai:</strong> ${hotspot.timeframe}</p>
        </div>
      `;

      marker.bindPopup(popupContent);
      marker.addTo(this.layerGroups['predictive']);
    });
  }

  private renderInteractiveMapData(mapData: any): void {
    // Clear all layers
    Object.values(this.layerGroups).forEach(layer => layer.clearLayers());

    // Render all data from interactive map endpoint
    if (mapData.hotspots) {
      this.hotspots = mapData.hotspots;
      this.renderHotspotsLayer();
    }

    if (mapData.corridors) {
      this.corridors = mapData.corridors;
      this.renderCorridorsLayer();
    }

    if (mapData.risk_zones) {
      this.riskZones = mapData.risk_zones;
      this.renderRiskZonesLayer();
    }

    if (mapData.real_time_positions) {
      this.liveData = mapData.real_time_positions;
      this.renderRealTimeLayer();
    }
  }

  // ===============================
  // VIEW MANAGEMENT
  // ===============================

  switchView(view: 'overview' | 'heatmap' | 'live' | 'predictive' | 'interactive'): void {
    this.selectedView = view;

    // Clear all layers first
    Object.values(this.layerGroups).forEach(layer => this.map.removeLayer(layer));

    switch (view) {
      case 'overview':
        this.layerGroups['hotspots'].addTo(this.map);
        this.layerGroups['corridors'].addTo(this.map);
        this.layerGroups['riskZones'].addTo(this.map);
        break;
        
      case 'heatmap':
        this.layerGroups['heatmap'].addTo(this.map);
        if (this.heatmapData.length === 0) {
          this.loadHeatmapData();
        }
        break;
        
      case 'live':
        this.layerGroups['realtime'].addTo(this.map);
        this.layerGroups['riskZones'].addTo(this.map);
        if (this.liveData.length === 0) {
          this.loadLiveData();
        }
        break;
        
      case 'predictive':
        this.layerGroups['predictive'].addTo(this.map);
        this.layerGroups['hotspots'].addTo(this.map);
        if (!this.predictiveInsights) {
          this.loadPredictiveInsights();
        }
        break;
        
      case 'interactive':
        this.loadInteractiveMap();
        break;
    }
  }

  // ===============================
  // AUTO REFRESH
  // ===============================

  private setupAutoRefresh(): void {
    if (this.autoRefresh) {
      interval(this.refreshInterval)
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          if (this.selectedView === 'live') {
            this.loadLiveData();
          } else if (this.selectedView === 'overview') {
            this.loadGISStatistics();
          }
        });
    }
  }

  toggleAutoRefresh(): void {
    this.autoRefresh = !this.autoRefresh;
    if (this.autoRefresh) {
      this.setupAutoRefresh();
    }
  }

  // ===============================
  // UTILITY METHODS
  // ===============================

  private getHotspotColor(intensity: number): string {
    if (intensity < 0.3) return '#4caf50';
    if (intensity < 0.6) return '#ff9800';
    return '#f44336';
  }

  private getRiskZoneColor(riskLevel: string): string {
    switch (riskLevel) {
      case 'critique': return '#d32f2f';
      case 'élevé': return '#f57c00';
      case 'moyen': return '#fbc02d';
      case 'faible': return '#388e3c';
      default: return '#9e9e9e';
    }
  }

  private getHeatmapColor(density: number): string {
    if (density < 0.2) return '#2196f3';
    if (density < 0.4) return '#00bcd4';
    if (density < 0.6) return '#4caf50';
    if (density < 0.8) return '#ff9800';
    return '#f44336';
  }

  // ===============================
  // PUBLIC METHODS
  // ===============================

  refreshData(): void {
    this.loadGISStatistics();
    
    switch (this.selectedView) {
      case 'heatmap':
        this.loadHeatmapData();
        break;
      case 'live':
        this.loadLiveData();
        break;
      case 'predictive':
        this.loadPredictiveInsights();
        break;
      case 'interactive':
        this.loadInteractiveMap();
        break;
    }
  }

  exportCurrentView(): void {
    // Implementation for exporting current map view
    console.log('Exporting current view:', this.selectedView);
  }

  resetMapView(): void {
    this.map.setView([-4.4419, 15.2663], 6);
  }

  // ===============================
  // TEMPLATE HELPER METHODS
  // ===============================

  getViewTitle(): string {
    switch (this.selectedView) {
      case 'overview': return 'Vue d\'ensemble';
      case 'heatmap': return 'Carte de densité';
      case 'live': return 'Données temps réel';
      case 'predictive': return 'Analyses prédictives';
      case 'interactive': return 'Carte interactive';
      default: return 'Vue d\'ensemble';
    }
  }

  getStatusLabel(status: string): string {
    const statusLabels: { [key: string]: string } = {
      'regulier': 'Régulier',
      'irregulier': 'Irrégulier',
      'demandeur_asile': 'Demandeur d\'asile',
      'refugie': 'Réfugié'
    };
    return statusLabels[status] || status;
  }

  getLiveDataByRisk(riskLevel: string): RealTimePosition[] {
    return this.liveData.filter(pos => pos.risk_level === riskLevel);
  }

  getTimeAgo(dateString: string): string {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'À l\'instant';
    if (diffInMinutes < 60) return `Il y a ${diffInMinutes} min`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `Il y a ${diffInHours}h`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `Il y a ${diffInDays} jour${diffInDays > 1 ? 's' : ''}`;
  }

  // Méthodes manquantes pour le template

  getRiskLevelColor(riskLevel: string): string {
    const colors: { [key: string]: string } = {
      'faible': '#28a745',
      'moyen': '#ffc107', 
      'élevé': '#fd7e14',
      'critique': '#dc3545'
    };
    return colors[riskLevel] || '#6c757d';
  }

  isLayerActive(layerName: string): boolean {
    // Implémentation simple - peut être étendue selon les besoins
    return true; // Par défaut, toutes les couches sont actives
  }

  toggleLayer(layerName: string): void {
    console.log(`Toggle layer: ${layerName}`);
    // Implémentation pour activer/désactiver les couches
  }

  updateFilters(): void {
    console.log('Updating filters:', this.filterParams);
    // Recharger les données avec les nouveaux filtres
    this.loadGISStatistics();
  }

  loadDensityHeatmap(): void {
    console.log('Loading density heatmap with filters:', this.filterParams);
    this.loadHeatmapData();
  }

  activateTool(toolName: string): void {
    this.selectedTool = this.selectedTool === toolName ? null : toolName;
    console.log(`Activated tool: ${toolName}`);
  }

  resetFilters(): void {
    this.filterParams = {
      days: 30,
      minFlow: 1,
      intensityType: 'high'
    };
    this.updateFilters();
  }
}

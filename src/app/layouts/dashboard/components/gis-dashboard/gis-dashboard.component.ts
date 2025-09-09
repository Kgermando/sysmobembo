import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { Subject, takeUntil, finalize } from 'rxjs';
import { 
  GisService, 
  GISMapConfiguration, 
  GISLayerData, 
  GISFeature,
  DensityHeatmapData 
} from '../../services/gis.service';

declare var L: any; // Leaflet maps

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
  mapConfig: GISMapConfiguration | null = null;
  
  // Layer data
  migrantsLayer: GISLayerData | null = null;
  routesLayer: GISLayerData | null = null;
  alertZonesLayer: GISLayerData | null = null;
  infrastructureLayer: GISLayerData | null = null;
  densityData: DensityHeatmapData | null = null;
  
  // Layer groups for Leaflet
  private layerGroups: { [key: string]: any } = {};
  private baseLayers: { [key: string]: any } = {};
  private overlayLayers: { [key: string]: any } = {};
  
  // UI State
  isLoading = false;
  error: string | null = null;
  activeLayerIds: string[] = [];
  selectedTool: string | null = null;
  
  // Filter parameters
  filterParams = {
    days: 30,
    minFlow: 3,
    intensityType: 'migrant_count' as 'migrant_count' | 'alert_count' | 'movement_count'
  };
  
  // Statistics
  stats = {
    totalMigrants: 0,
    activeAlerts: 0,
    migrationRoutes: 0,
    infrastructurePoints: 0
  };

  constructor(private gisService: GisService) {}

  ngOnInit(): void {
    this.initializeMap();
    this.loadMapConfiguration();
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
    // Initialize Leaflet map
    this.map = L.map(this.mapContainer.nativeElement, {
      center: [-4.038333, 21.758664], // Centre RDC par défaut
      zoom: 6,
      zoomControl: true,
      attributionControl: true
    });

    // Add base layers
    this.baseLayers = {
      'Satellite': L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }),
      'Terrain': L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenTopoMap contributors'
      }),
      'Streets': L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      })
    };

    // Set default base layer
    this.baseLayers['Satellite'].addTo(this.map);

    // Initialize layer groups
    this.layerGroups = {
      migrants: L.layerGroup(),
      routes: L.layerGroup(),
      alerts: L.layerGroup(),
      infrastructure: L.layerGroup(),
      heatmap: L.layerGroup()
    };

    // Add layer control
    this.overlayLayers = {
      'Migrants actuels': this.layerGroups['migrants'],
      'Routes de migration': this.layerGroups['routes'],
      'Zones d\'alerte': this.layerGroups['alerts'],
      'Infrastructure': this.layerGroups['infrastructure'],
      'Carte de densité': this.layerGroups['heatmap']
    };

    L.control.layers(this.baseLayers, this.overlayLayers).addTo(this.map);

    // Add map tools
    this.addMapTools();
  }

  private addMapTools(): void {
    // Scale control
    L.control.scale().addTo(this.map);

    // Custom control for tools
    const toolsControl = L.control({ position: 'topright' });
    
    toolsControl.onAdd = () => {
      const div = L.DomUtil.create('div', 'gis-tools-control');
      div.innerHTML = `
        <div class="btn-group-vertical" role="group">
          <button type="button" class="btn btn-sm btn-outline-primary" data-tool="measure">
            <i class="material-icons">straighten</i>
          </button>
          <button type="button" class="btn btn-sm btn-outline-primary" data-tool="area">
            <i class="material-icons">crop_square</i>
          </button>
          <button type="button" class="btn btn-sm btn-outline-primary" data-tool="identify">
            <i class="material-icons">info</i>
          </button>
        </div>
      `;
      
      L.DomEvent.disableClickPropagation(div);
      
      div.addEventListener('click', (e: Event) => {
        const target = e.target as HTMLElement;
        const button = target.closest('[data-tool]') as HTMLElement;
        if (button) {
          this.activateTool(button.dataset['tool']!);
        }
      });
      
      return div;
    };
    
    toolsControl.addTo(this.map);
  }

  // ===============================
  // DATA LOADING
  // ===============================

  private loadMapConfiguration(): void {
    this.isLoading = true;
    this.error = null;

    this.gisService.getMapConfiguration()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (config) => {
          this.mapConfig = config;
          this.applyMapConfiguration(config);
          this.loadAllLayers();
        },
        error: (error) => {
          this.error = 'Erreur lors du chargement de la configuration de la carte';
          console.error('Map configuration error:', error);
        }
      });
  }

  private applyMapConfiguration(config: GISMapConfiguration): void {
    if (config.map_config) {
      // Update map center and zoom
      this.map.setView([
        config.map_config.default_center.latitude,
        config.map_config.default_center.longitude
      ], config.map_config.default_zoom);

      // Set bounds if available
      if (config.map_config.bounds) {
        const bounds = L.latLngBounds([
          [config.map_config.bounds.south, config.map_config.bounds.west],
          [config.map_config.bounds.north, config.map_config.bounds.east]
        ]);
        this.map.setMaxBounds(bounds);
      }
    }
  }

  loadAllLayers(): void {
    this.loadMigrantsLayer();
    this.loadMigrationRoutesLayer();
    this.loadAlertZonesLayer();
    this.loadInfrastructureLayer();
  }

  loadMigrantsLayer(): void {
    this.gisService.getMigrantsLayer()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.migrantsLayer = data;
          this.renderMigrantsLayer(data);
          this.stats.totalMigrants = data.count;
        },
        error: (error) => {
          console.error('Migrants layer error:', error);
        }
      });
  }

  loadMigrationRoutesLayer(): void {
    this.gisService.getMigrationRoutesLayer({
      days: this.filterParams.days,
      min_flow: this.filterParams.minFlow
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.routesLayer = data;
          this.renderRoutesLayer(data);
          this.stats.migrationRoutes = data.count;
        },
        error: (error) => {
          console.error('Routes layer error:', error);
        }
      });
  }

  loadAlertZonesLayer(): void {
    this.gisService.getAlertZonesLayer()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.alertZonesLayer = data;
          this.renderAlertZonesLayer(data);
          this.stats.activeAlerts = data.count;
        },
        error: (error) => {
          console.error('Alert zones layer error:', error);
        }
      });
  }

  loadInfrastructureLayer(): void {
    this.gisService.getInfrastructureLayer('all')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.infrastructureLayer = data;
          this.renderInfrastructureLayer(data);
          this.stats.infrastructurePoints = data.count;
        },
        error: (error) => {
          console.error('Infrastructure layer error:', error);
        }
      });
  }

  loadDensityHeatmap(): void {
    this.gisService.getDensityHeatmapLayer({
      days: this.filterParams.days,
      intensity: this.filterParams.intensityType
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.densityData = data;
          this.renderHeatmapLayer(data);
        },
        error: (error) => {
          console.error('Heatmap layer error:', error);
        }
      });
  }

  // ===============================
  // LAYER RENDERING
  // ===============================

  private renderMigrantsLayer(data: GISLayerData): void {
    this.layerGroups['migrants'].clearLayers();

    if (data.data?.features) {
      data.data.features.forEach((feature: GISFeature) => {
        const coords = feature.geometry.coordinates as number[];
        const props = feature.properties;

        const marker = L.circleMarker([coords[1], coords[0]], {
          radius: 8,
          fillColor: props['alerte_active'] ? '#f44336' : '#2196f3',
          color: '#ffffff',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.8
        });

        const popupContent = `
          <div class="gis-popup">
            <h6>${props['migrant_nom']} ${props['migrant_prenom']}</h6>
            <p><strong>Localisation:</strong> ${props['ville']}, ${props['pays']}</p>
            <p><strong>Statut:</strong> ${props['statut_migrant']}</p>
            <p><strong>Dernière MAJ:</strong> ${new Date(props['last_update']).toLocaleString()}</p>
            ${props['alerte_active'] ? '<span class="badge badge-danger">Alerte active</span>' : ''}
          </div>
        `;

        marker.bindPopup(popupContent);
        marker.addTo(this.layerGroups['migrants']);
      });
    }
  }

  private renderRoutesLayer(data: GISLayerData): void {
    this.layerGroups['routes'].clearLayers();

    if (data.data?.features) {
      data.data.features.forEach((feature: GISFeature) => {
        const coords = feature.geometry.coordinates as number[][];
        const props = feature.properties;

        const polyline = L.polyline(
          coords.map(coord => [coord[1], coord[0]]),
          {
            color: '#2196f3',
            weight: Math.min(8, Math.max(2, props['flow_count'] / 2)),
            opacity: 0.7
          }
        );

        const popupContent = `
          <div class="gis-popup">
            <h6>Route migratoire</h6>
            <p><strong>De:</strong> ${props['pays_origine']}</p>
            <p><strong>Vers:</strong> ${props['pays_destination']}</p>
            <p><strong>Flux:</strong> ${props['flow_count']} migrants</p>
          </div>
        `;

        polyline.bindPopup(popupContent);
        polyline.addTo(this.layerGroups['routes']);
      });
    }
  }

  private renderAlertZonesLayer(data: GISLayerData): void {
    this.layerGroups['alerts'].clearLayers();

    if (data.data?.features) {
      data.data.features.forEach((feature: GISFeature) => {
        const coords = feature.geometry.coordinates as number[][][];
        const props = feature.properties;

        let fillColor = '#ffeb3b';
        if (props['niveau_gravite'] === 'critical') fillColor = '#f44336';
        else if (props['niveau_gravite'] === 'danger') fillColor = '#ff9800';

        const polygon = L.polygon(
          coords[0].map(coord => [coord[1], coord[0]]),
          {
            fillColor: fillColor,
            fillOpacity: 0.3,
            color: fillColor,
            weight: 2
          }
        );

        const popupContent = `
          <div class="gis-popup">
            <h6>${props['titre']}</h6>
            <p><strong>Type:</strong> ${props['type_alerte']}</p>
            <p><strong>Gravité:</strong> ${props['niveau_gravite']}</p>
            <p><strong>Description:</strong> ${props['description']}</p>
            <p><strong>Date:</strong> ${new Date(props['date_creation']).toLocaleString()}</p>
          </div>
        `;

        polygon.bindPopup(popupContent);
        polygon.addTo(this.layerGroups['alerts']);
      });
    }
  }

  private renderInfrastructureLayer(data: GISLayerData): void {
    this.layerGroups['infrastructure'].clearLayers();

    if (data.data?.features) {
      data.data.features.forEach((feature: GISFeature) => {
        const coords = feature.geometry.coordinates as number[];
        const props = feature.properties;

        let iconClass = 'place';
        let iconColor = '#9c27b0';

        if (props['point_type'] === 'frontiere') {
          iconClass = 'gps_fixed';
          iconColor = '#9c27b0';
        } else if (props['point_type'] === 'centre_accueil') {
          iconClass = 'home';
          iconColor = '#4caf50';
        }

        const divIcon = L.divIcon({
          html: `<i class="material-icons" style="color: ${iconColor}; font-size: 24px;">${iconClass}</i>`,
          iconSize: [24, 24],
          className: 'gis-infrastructure-icon'
        });

        const marker = L.marker([coords[1], coords[0]], { icon: divIcon });

        const popupContent = `
          <div class="gis-popup">
            <h6>${props['nom']}</h6>
            <p><strong>Type:</strong> ${props['point_type']}</p>
            <p><strong>Localisation:</strong> ${props['ville']}, ${props['pays']}</p>
            <p><strong>Activité:</strong> ${props['activity_count']} passages</p>
            <p><strong>Description:</strong> ${props['description']}</p>
          </div>
        `;

        marker.bindPopup(popupContent);
        marker.addTo(this.layerGroups['infrastructure']);
      });
    }
  }

  private renderHeatmapLayer(data: DensityHeatmapData): void {
    this.layerGroups['heatmap'].clearLayers();

    if (data.data && data.data.length > 0) {
      const heatmapData = data.data.map(point => [
        point.latitude,
        point.longitude,
        point.weight
      ]);

      // Note: This requires leaflet-heatmap plugin
      // const heatLayer = L.heatLayer(heatmapData, {
      //   radius: 25,
      //   blur: 15,
      //   maxZoom: 18
      // });

      // For now, render as circle markers
      data.data.forEach(point => {
        const circle = L.circleMarker([point.latitude, point.longitude], {
          radius: 5 + (point.weight * 20),
          fillColor: this.getHeatmapColor(point.weight),
          color: 'transparent',
          fillOpacity: 0.6
        });

        circle.addTo(this.layerGroups['heatmap']);
      });
    }
  }

  private getHeatmapColor(intensity: number): string {
    if (intensity < 0.2) return '#0000ff';
    if (intensity < 0.4) return '#00ffff';
    if (intensity < 0.6) return '#00ff00';
    if (intensity < 0.8) return '#ffff00';
    return '#ff0000';
  }

  // ===============================
  // TOOL ACTIVATION
  // ===============================

  activateTool(toolId: string): void {
    this.selectedTool = toolId;

    // Reset all tool states
    this.map.getContainer().style.cursor = '';

    switch (toolId) {
      case 'measure':
        this.activateMeasureTool();
        break;
      case 'area':
        this.activateAreaTool();
        break;
      case 'identify':
        this.activateIdentifyTool();
        break;
    }
  }

  private activateMeasureTool(): void {
    this.map.getContainer().style.cursor = 'crosshair';
    // Implementation for measure tool
  }

  private activateAreaTool(): void {
    this.map.getContainer().style.cursor = 'crosshair';
    // Implementation for area measurement tool
  }

  private activateIdentifyTool(): void {
    this.map.getContainer().style.cursor = 'help';
    // Implementation for identify tool
  }

  // ===============================
  // LAYER MANAGEMENT
  // ===============================

  toggleLayer(layerId: string): void {
    const index = this.activeLayerIds.indexOf(layerId);
    
    if (index > -1) {
      this.activeLayerIds.splice(index, 1);
      this.map.removeLayer(this.layerGroups[layerId]);
    } else {
      this.activeLayerIds.push(layerId);
      this.map.addLayer(this.layerGroups[layerId]);
    }
  }

  isLayerActive(layerId: string): boolean {
    return this.activeLayerIds.includes(layerId);
  }

  // ===============================
  // FILTER MANAGEMENT
  // ===============================

  updateFilters(): void {
    this.loadMigrationRoutesLayer();
    this.loadDensityHeatmap();
  }

  resetFilters(): void {
    this.filterParams = {
      days: 30,
      minFlow: 3,
      intensityType: 'migrant_count'
    };
    this.updateFilters();
  }

  // ===============================
  // EXPORT FUNCTIONALITY
  // ===============================

  exportMap(): void {
    const activeLayersString = this.activeLayerIds.join(',');
    
    this.gisService.exportGISData({
      format: 'geojson',
      layers: activeLayersString || 'all'
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (exportData) => {
          // Handle export download
          window.open(exportData.download_url, '_blank');
        },
        error: (error) => {
          console.error('Export error:', error);
        }
      });
  }
}

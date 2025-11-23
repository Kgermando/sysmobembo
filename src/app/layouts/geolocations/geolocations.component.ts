import { Component, OnInit, OnDestroy, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { Subject, firstValueFrom, takeUntil } from 'rxjs'; 
import { GeolocationService, ICoordinateData } from '../../core/migration/geolocation.service';
import { GoogleMap } from '@angular/google-maps';

@Component({
  selector: 'app-geolocations',
  standalone: false,
  templateUrl: './geolocations.component.html',
  styleUrl: './geolocations.component.scss'
})
export class GeolocationsComponent implements OnInit, OnDestroy, AfterViewInit {
  private destroy$ = new Subject<void>();

  @ViewChild(GoogleMap, { static: false }) map!: GoogleMap;

  // Map properties
  center: google.maps.LatLngLiteral = { lat: -4.3217, lng: 15.3125 }; // Centre de la RDC
  zoom = 6;
  mapOptions: google.maps.MapOptions = {
    mapTypeId: 'roadmap',
    zoomControl: true,
    scrollwheel: true,
    disableDoubleClickZoom: false,
    maxZoom: 18,
    minZoom: 3,
  };

  // Markers data
  markers: google.maps.MarkerOptions[] = [];
  coordinatesData: ICoordinateData[] = [];
  infoWindowContent: string = '';
  infoWindowOptions: google.maps.InfoWindowOptions = {
    maxWidth: 300
  };

  // States
  isLoading = false;
  isExportDialogOpen = false;
  error: string | null = null;

  // Export filters
  startDate = '';
  endDate = '';

  constructor( 
    private geolocationService: GeolocationService
  ) { }

  ngOnInit(): void { 
    this.loadCoordinates();
  }

  ngAfterViewInit(): void {
    // Initialize any view-dependent logic here
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Charge la liste des coordonnées avec les noms complets
   */
  async loadCoordinates(): Promise<void> {
    this.isLoading = true;
    this.error = null;

    try {
      const response = await firstValueFrom(
        this.geolocationService.getCoordinatesList()
          .pipe(takeUntil(this.destroy$))
      );

      if (response.status === 'success') {
        this.coordinatesData = response.data;
        this.createMarkers();
        
        // Ajuster le centre de la carte si des données existent
        if (this.coordinatesData.length > 0) {
          this.adjustMapCenter();
        }
      }
    } catch (error: any) {
      this.error = error.error?.message || 'Erreur lors du chargement des coordonnées';
      console.error('Erreur lors du chargement des coordonnées:', error);
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Crée les marqueurs pour la carte à partir des coordonnées
   */
  createMarkers(): void {
    this.markers = this.coordinatesData.map(coord => ({
      position: {
        lat: coord.latitude,
        lng: coord.longitude
      },
      title: coord.fullname
    }));
  }

  /**
   * Ajuste le centre de la carte pour afficher tous les marqueurs
   */
  adjustMapCenter(): void {
    if (this.coordinatesData.length === 0) return;

    const bounds = new google.maps.LatLngBounds();
    this.coordinatesData.forEach(coord => {
      bounds.extend({ lat: coord.latitude, lng: coord.longitude });
    });

    // Attendre que la carte soit chargée
    setTimeout(() => {
      if (this.map && this.map.googleMap) {
        this.map.googleMap.fitBounds(bounds);
      }
    }, 100);
  }

  /**
   * Ouvre une info window sur un marqueur
   */
  openInfoWindow(marker: google.maps.MarkerOptions, index: number): void {
    const coord = this.coordinatesData[index];
    this.infoWindowContent = `
      <div class="p-2">
        <h6 class="mb-2">${coord.fullname}</h6>
        <p class="mb-1 small"><strong>Latitude:</strong> ${coord.latitude.toFixed(6)}</p>
        <p class="mb-0 small"><strong>Longitude:</strong> ${coord.longitude.toFixed(6)}</p>
      </div>
    `;
  }

  /**
   * Rafraîchit les données
   */
  refreshData(): void {
    this.loadCoordinates();
  }

  /**
   * Ouvre le dialogue d'export
   */
  openExportDialog(): void {
    // Set default dates (1 month range)
    const today = new Date();
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(today.getMonth() - 1);

    this.endDate = today.toISOString().split('T')[0];
    this.startDate = oneMonthAgo.toISOString().split('T')[0];
    this.isExportDialogOpen = true;
  }

  /**
   * Ferme le dialogue d'export
   */
  closeExportDialog(): void {
    this.isExportDialogOpen = false;
  }

  /**
   * Confirme et lance l'export Excel
   */
  confirmExportToExcel(): void {
    this.isExportDialogOpen = false;
    this.exportToExcel();
  }

  /**
   * Exporte les données vers Excel
   */
  exportToExcel(): void {
    this.isLoading = true;
    this.error = null;

    console.log('Début de l\'export Excel des géolocalisations...');

    this.geolocationService.exportGeolocationsToExcel(this.startDate, this.endDate).subscribe({
      next: (blob: Blob) => {
        try {
          // Créer un lien de téléchargement pour le fichier Excel
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          
          // Générer un nom de fichier avec timestamp
          const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
          link.download = `geolocalisations_export_${timestamp}.xlsx`;
          
          // Déclencher le téléchargement
          document.body.appendChild(link);
          link.click();
          
          // Nettoyer
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
          
          this.isLoading = false;
          
          console.log('✅ Export Excel des géolocalisations terminé avec succès');
        } catch (error) {
          console.error('Erreur lors de la création du fichier Excel:', error);
          this.error = 'Erreur lors de la création du fichier Excel';
          this.isLoading = false;
        }
      },
      error: (error) => {
        console.error('Erreur lors de l\'export Excel:', error);
        this.error = error.error?.message || 'Erreur lors de l\'export Excel des géolocalisations';
        this.isLoading = false;
      }
    });
  }

  /**
   * Réinitialise les filtres d'export
   */
  resetExportFilters(): void {
    const today = new Date();
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(today.getMonth() - 1);

    this.endDate = today.toISOString().split('T')[0];
    this.startDate = oneMonthAgo.toISOString().split('T')[0];
  }
}

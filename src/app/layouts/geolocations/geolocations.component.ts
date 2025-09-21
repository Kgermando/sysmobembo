import { Component, OnInit, OnDestroy, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { Sort } from '@angular/material/sort';
import { PageEvent } from '@angular/material/paginator';
import { Subject, firstValueFrom, takeUntil } from 'rxjs';
import { IGeolocalisation, IMigrant } from '../../shared/models/migrant.model';
import { GeolocationService, IGeolocationFormData } from '../../core/migration/geolocation.service';
import { MigrantService } from '../../core/migration/migrant.service';
import { AutoGeolocationService, CustomGeolocationPosition, ReverseGeocodingResult, GeolocationError } from '../../core/services/auto-geolocation.service';
import { PAYS_ORIGINE_COMMUNS } from '../../shared/utils';

@Component({
  selector: 'app-geolocations',
  standalone: false,
  templateUrl: './geolocations.component.html',
  styleUrl: './geolocations.component.scss'
})
export class GeolocationsComponent implements OnInit, OnDestroy, AfterViewInit {
  private destroy$ = new Subject<void>();

  @ViewChild('offcanvasToggle') offcanvasToggle!: ElementRef;

  // Math reference for template
  Math = Math;

  // Angular Material Table
  dataSource = new MatTableDataSource<IGeolocalisation>();
  displayedColumns: string[] = [
    'migrant', 'type_localisation', 'coordonnees', 'pays', 'ville', 
    'type_mouvement', 'created_at', 'actions'
  ];

  // Data
  geolocations: IGeolocalisation[] = [];
  migrants: IMigrant[] = [];
  geolocationStats: any = null;

  // Form
  geolocationForm: FormGroup;
  editingGeolocation: IGeolocalisation | null = null;
  viewingGeolocation: IGeolocalisation | null = null;

  // States
  isLoading = false;
  isLoadingData = false;
  isSaving = false;
  isGettingLocation = false;
  isReverseGeocoding = false;
  error: string | null = null;
  locationError: string | null = null;
  successMessage: string | null = null;

  // Pagination
  total_records = 0;
  page_size = 15;
  current_page = 1;

  // Search & Filters
  searchTerm = '';
  selectedMigrant = '';
  selectedTypeLocalisation = '';
  selectedPays = '';
  selectedTypeMouvement = '';

  // Options aligned with backend
  typeLocalisationOptions = [
    { value: 'residence_actuelle', label: 'Résidence actuelle' },
    { value: 'lieu_travail', label: 'Lieu de travail' },
    { value: 'point_passage', label: 'Point de passage' },
    { value: 'frontiere', label: 'Frontière' },
    { value: 'centre_accueil', label: 'Centre d\'accueil' },
    { value: 'urgence', label: 'Urgence' }
  ];

  typeMouvementOptions = [
    { value: 'arrivee', label: 'Arrivée' },
    { value: 'depart', label: 'Départ' },
    { value: 'transit', label: 'Transit' },
    { value: 'residence_temporaire', label: 'Résidence temporaire' },
    { value: 'residence_permanente', label: 'Résidence permanente' }
  ];

  // New options for backend alignment
  methodeCaptureOptions = [
    { value: 'gps', label: 'GPS' },
    { value: 'manuel', label: 'Manuel' },
    { value: 'automatique', label: 'Automatique' }
  ];

  fiabiliteSourceOptions = [
    { value: 'elevee', label: 'Élevée' },
    { value: 'moyenne', label: 'Moyenne' },
    { value: 'faible', label: 'Faible' }
  ];

  // Common countries for select options
  paysOptions = PAYS_ORIGINE_COMMUNS;

  constructor(
    private fb: FormBuilder,
    private geolocationService: GeolocationService,
    private migrantService: MigrantService,
    private autoGeolocationService: AutoGeolocationService
  ) {
    this.geolocationForm = this.createForm();
  }

  ngOnInit(): void {
    this.loadData();
    this.loadMigrants();
    this.loadStats();
  }

  ngAfterViewInit(): void {
    // Initialize any view-dependent logic here
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private createForm(): FormGroup {
    return this.fb.group({
      migrant_uuid: ['', Validators.required],
      latitude: [null, [Validators.required, Validators.min(-90), Validators.max(90)]],
      longitude: [null, [Validators.required, Validators.min(-180), Validators.max(180)]],
      type_localisation: ['', Validators.required],
      description: [''],
      adresse: [''],
      ville: [''],
      pays: ['', Validators.required],
      code_postal: [''],
      
      // Required fields with defaults
      date_enregistrement: [new Date().toISOString(), Validators.required],
      methode_capture: ['manuel', Validators.required],
      fiabilite_source: ['moyenne', Validators.required], 
      actif: [true, Validators.required],
      
      // Optional fields
      altitude: [null],
      precision: [null],
      dispositif_source: [''],
      commentaire: [''],
      
      // Movement information
      type_mouvement: [''],
      duree_sejour: [null],
      prochaine_destination: ['']
    });
  }

  async loadData(): Promise<void> {
    this.isLoadingData = true;
    this.error = null;

    try {
      const response = await firstValueFrom(
        this.geolocationService.getPaginatedGeolocations(
          this.current_page,
          this.page_size,
          this.selectedMigrant,
          this.selectedTypeLocalisation,
          this.selectedPays
        ).pipe(takeUntil(this.destroy$))
      );

      if (response.status === 'success') {
        this.geolocations = response.data;
        this.dataSource.data = response.data;
        this.total_records = response.pagination.total_records;
        this.current_page = response.pagination.current_page;
        this.page_size = response.pagination.page_size;
      }
    } catch (error: any) {
      this.error = error.error?.message || 'Erreur lors du chargement des données';
      console.error('Erreur lors du chargement des géolocalisations:', error);
    } finally {
      this.isLoadingData = false;
    }
  }

  async loadMigrants(): Promise<void> {
    try {
      const response = await firstValueFrom(
        this.migrantService.getAllMigrants().pipe(takeUntil(this.destroy$))
      );

      if (response.status === 'success') {
        this.migrants = Array.isArray(response.data) ? response.data : [];
      }
    } catch (error: any) {
      console.error('Erreur lors du chargement des migrants:', error);
    }
  }

  async loadStats(): Promise<void> {
    try {
      const response = await firstValueFrom(
        this.geolocationService.getGeolocationsStats().pipe(takeUntil(this.destroy$))
      );

      if (response.status === 'success') {
        this.geolocationStats = response.data;
      }
    } catch (error: any) {
      console.error('Erreur lors du chargement des statistiques:', error);
    }
  }

  async onSubmit(): Promise<void> {
    // Vérifier que les coordonnées sont présentes
    const latitude = this.geolocationForm.get('latitude')?.value;
    const longitude = this.geolocationForm.get('longitude')?.value;
    
    if (!latitude || !longitude) {
      this.locationError = 'Les coordonnées géographiques sont requises. Veuillez activer la géolocalisation.';
      return;
    }

    if (this.geolocationForm.invalid || this.isSaving) return;

    this.isSaving = true;
    this.error = null;

    try {
      // Get raw form values and properly format them
      const formValues = this.geolocationForm.value;
      
      // Prepare data with correct types
      const formData: IGeolocationFormData = {
        migrant_uuid: formValues.migrant_uuid,
        latitude: Number(formValues.latitude),
        longitude: Number(formValues.longitude),
        type_localisation: formValues.type_localisation,
        description: formValues.description || '',
        adresse: formValues.adresse || '',
        ville: formValues.ville || '',
        pays: formValues.pays,
        code_postal: formValues.code_postal || '',
        
        // Required fields with proper formatting
        date_enregistrement: formValues.date_enregistrement || new Date().toISOString(),
        methode_capture: formValues.methode_capture || 'manuel',
        fiabilite_source: formValues.fiabilite_source || 'moyenne',
        actif: Boolean(formValues.actif !== false), // Ensure boolean true by default
        
        // Optional fields with proper types
        altitude: formValues.altitude ? Number(formValues.altitude) : undefined,
        precision: formValues.precision ? Number(formValues.precision) : undefined,
        dispositif_source: formValues.dispositif_source || '',
        commentaire: formValues.commentaire || '',
        
        // Movement information
        type_mouvement: formValues.type_mouvement || undefined,
        duree_sejour: formValues.duree_sejour ? Number(formValues.duree_sejour) : undefined,
        prochaine_destination: formValues.prochaine_destination || undefined
      };

      let response;
      if (this.editingGeolocation) {
        response = await firstValueFrom(
          this.geolocationService.updateGeolocation(this.editingGeolocation.uuid, formData)
            .pipe(takeUntil(this.destroy$))
        );
      } else {
        response = await firstValueFrom(
          this.geolocationService.createGeolocation(formData)
            .pipe(takeUntil(this.destroy$))
        );
      }

      if (response.status === 'success') {
        // Show success message
        this.successMessage = this.editingGeolocation 
          ? 'Géolocalisation modifiée avec succès !'
          : 'Géolocalisation ajoutée avec succès !';
        
        await this.loadData();
        this.resetForm();
        
        // Add a small delay to show success message before closing
        setTimeout(() => {
          this.closeOffcanvas();
          // Clear success message after closing
          setTimeout(() => {
            this.successMessage = null;
          }, 500);
        }, 800);
      }
    } catch (error: any) {
      this.error = error.error?.message || 'Erreur lors de l\'enregistrement';
      console.error('Erreur lors de l\'enregistrement de la géolocalisation:', error);
    } finally {
      this.isSaving = false;
    }
  }

  prepareNewGeolocation(): void {
    this.editingGeolocation = null;
    this.resetForm();
    // Récupérer automatiquement la géolocalisation pour une nouvelle entrée
    this.autoGetLocation();
  }

  prepareEditGeolocation(geolocation: IGeolocalisation): void {
    this.editingGeolocation = geolocation;
    this.geolocationForm.patchValue({
      migrant_uuid: geolocation.migrant_uuid,
      latitude: geolocation.latitude,
      longitude: geolocation.longitude,
      type_localisation: geolocation.type_localisation,
      description: geolocation.description || '',
      adresse: geolocation.adresse || '',
      ville: geolocation.ville || '',
      pays: geolocation.pays,
      code_postal: geolocation.code_postal || '',
      
      // Required fields from backend
      date_enregistrement: geolocation.date_enregistrement || new Date().toISOString(),
      methode_capture: geolocation.methode_capture || 'manuel',
      fiabilite_source: geolocation.fiabilite_source || 'moyenne',
      actif: geolocation.actif !== undefined ? geolocation.actif : true,
      
      // Optional fields
      altitude: geolocation.altitude || null,
      precision: geolocation.precision || null,
      dispositif_source: geolocation.dispositif_source || '',
      commentaire: geolocation.commentaire || '',
      
      // Movement information
      type_mouvement: geolocation.type_mouvement || '',
      duree_sejour: geolocation.duree_sejour || null,
      prochaine_destination: geolocation.prochaine_destination || ''
    });
  }

  async deleteGeolocation(geolocation: IGeolocalisation): Promise<void> {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette géolocalisation ?')) return;

    try {
      const response = await firstValueFrom(
        this.geolocationService.deleteGeolocation(geolocation.uuid)
          .pipe(takeUntil(this.destroy$))
      );

      if (response.status === 'success') {
        await this.loadData();
      }
    } catch (error: any) {
      this.error = error.error?.message || 'Erreur lors de la suppression';
      console.error('Erreur lors de la suppression de la géolocalisation:', error);
    }
  }

  resetForm(): void {
    this.geolocationForm.reset();
    // Reset with default values for required fields
    this.geolocationForm.patchValue({
      date_enregistrement: new Date().toISOString(),
      methode_capture: 'manuel',
      fiabilite_source: 'moyenne',
      actif: true
    });
    this.editingGeolocation = null;
    this.error = null;
    this.locationError = null;
    this.successMessage = null;
  }

  // Auto-geolocation methods
  async autoGetLocation(): Promise<void> {
    if (!this.autoGeolocationService.isGeolocationSupported()) {
      this.locationError = 'La géolocalisation n\'est pas supportée par ce navigateur. Les coordonnées devront être saisies manuellement.';
      return;
    }

    this.isGettingLocation = true;
    this.locationError = null;

    try {
      const result = await firstValueFrom(
        this.autoGeolocationService.getCurrentPositionWithAddress(true).pipe(takeUntil(this.destroy$))
      );

      // Mettre à jour le formulaire avec les coordonnées et l'adresse
      this.geolocationForm.patchValue({
        latitude: result.position.latitude,
        longitude: result.position.longitude,
        adresse: result.address.formattedAddress,
        ville: result.address.city,
        pays: result.address.countryCode || result.address.country,
        methode_capture: 'gps', // Set to GPS when using auto-geolocation
        fiabilite_source: 'elevee', // GPS is generally high reliability
        precision: result.position.accuracy || null
      });

    } catch (error: any) {
      // Afficher le message d'erreur spécifique du service de géolocalisation
      if (error?.message) {
        this.locationError = error.message;
      } else if (typeof error === 'string') {
        this.locationError = error;
      } else {
        this.locationError = 'Impossible de récupérer automatiquement votre position. Vous pouvez réessayer avec les boutons ci-dessous.';
      }
      console.error('Erreur de géolocalisation automatique:', error);
    } finally {
      this.isGettingLocation = false;
    }
  }

  async getCurrentLocation(): Promise<void> {
    const check = this.autoGeolocationService.canUseGeolocation();
    if (!check.canUse) {
      this.locationError = check.reason || 'La géolocalisation n\'est pas disponible';
      return;
    }

    this.isGettingLocation = true;
    this.locationError = null;

    try {
      const position = await firstValueFrom(
        this.autoGeolocationService.getCurrentPosition(true).pipe(takeUntil(this.destroy$))
      );

      // Mettre à jour le formulaire avec les coordonnées
      this.geolocationForm.patchValue({
        latitude: position.latitude,
        longitude: position.longitude
      });

      // Optionnellement, récupérer l'adresse automatiquement
      await this.reverseGeocodeCurrentPosition(position);

    } catch (error: any) {
      // Afficher le message d'erreur spécifique du service de géolocalisation
      if (error?.message) {
        this.locationError = error.message;
      } else if (typeof error === 'string') {
        this.locationError = error;
      } else {
        this.locationError = 'Erreur lors de la récupération de la position';
      }
      console.error('Erreur de géolocalisation:', error);
    } finally {
      this.isGettingLocation = false;
    }
  }

  async getCurrentLocationWithAddress(): Promise<void> {
    const check = this.autoGeolocationService.canUseGeolocation();
    if (!check.canUse) {
      this.locationError = check.reason || 'La géolocalisation n\'est pas disponible';
      return;
    }

    this.isGettingLocation = true;
    this.isReverseGeocoding = true;
    this.locationError = null;

    try {
      const result = await firstValueFrom(
        this.autoGeolocationService.getCurrentPositionWithAddress(true).pipe(takeUntil(this.destroy$))
      );

      // Mettre à jour le formulaire avec les coordonnées et l'adresse
      this.geolocationForm.patchValue({
        latitude: result.position.latitude,
        longitude: result.position.longitude,
        adresse: result.address.formattedAddress,
        ville: result.address.city,
        pays: result.address.countryCode || result.address.country
      });

    } catch (error: any) {
      // Afficher le message d'erreur spécifique du service de géolocalisation
      if (error?.message) {
        this.locationError = error.message;
      } else if (typeof error === 'string') {
        this.locationError = error;
      } else {
        this.locationError = 'Erreur lors de la récupération de la position et de l\'adresse';
      }
      console.error('Erreur de géolocalisation avec adresse:', error);
    } finally {
      this.isGettingLocation = false;
      this.isReverseGeocoding = false;
    }
  }

  async reverseGeocodeCurrentPosition(position?: CustomGeolocationPosition): Promise<void> {
    const lat = position?.latitude || this.geolocationForm.get('latitude')?.value;
    const lng = position?.longitude || this.geolocationForm.get('longitude')?.value;

    if (!lat || !lng) {
      this.locationError = 'Coordonnées manquantes pour le géocodage inverse';
      return;
    }

    this.isReverseGeocoding = true;
    this.locationError = null;

    try {
      const address = await firstValueFrom(
        this.autoGeolocationService.reverseGeocode(lat, lng).pipe(takeUntil(this.destroy$))
      );

      // Mettre à jour le formulaire avec l'adresse trouvée
      this.geolocationForm.patchValue({
        adresse: address.formattedAddress,
        ville: address.city,
        pays: address.countryCode || address.country
      });

    } catch (error: any) {
      this.locationError = error.message || 'Erreur lors du géocodage inverse';
      console.error('Erreur de géocodage inverse:', error);
    } finally {
      this.isReverseGeocoding = false;
    }
  }

  clearLocationError(): void {
    this.locationError = null;
  }

  // Helper methods for geolocation
  isGeolocationSupported(): boolean {
    return this.autoGeolocationService.isGeolocationSupported();
  }

  hasValidCoordinates(): boolean {
    const lat = this.geolocationForm.get('latitude')?.value;
    const lng = this.geolocationForm.get('longitude')?.value;
    return lat !== null && lng !== null && !isNaN(lat) && !isNaN(lng);
  }

  formatCoordinatesDisplay(lat: number, lng: number): string {
    return this.autoGeolocationService.formatCoordinates(lat, lng);
  }

  getCoordinatesDMS(lat: number, lng: number): { latitude: string; longitude: string } {
    return this.autoGeolocationService.toDMS(lat, lng);
  }

  // Search and filters
  onSearchChange(searchTerm: string): void {
    this.searchTerm = searchTerm;
    this.current_page = 1;
    this.loadData();
  }

  applyFilters(): void {
    this.current_page = 1;
    this.loadData();
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.selectedMigrant = '';
    this.selectedTypeLocalisation = '';
    this.selectedPays = '';
    this.selectedTypeMouvement = '';
    this.current_page = 1;
    this.loadData();
  }

  // Export to Excel
  exportToExcel(): void {
    this.isLoading = true;
    this.error = null;

    // Afficher un message d'information pendant l'export
    console.log('Début de l\'export Excel des géolocalisations...');

    this.geolocationService.exportGeolocationsToExcel(
      this.selectedMigrant,
      this.selectedTypeLocalisation,
      this.selectedPays
    ).subscribe({
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
          
          // Afficher un message de succès
          console.log('✅ Export Excel terminé avec succès');
          
        } catch (downloadError) {
          console.error('❌ Erreur lors du téléchargement:', downloadError);
          this.error = 'Erreur lors du téléchargement du fichier Excel.';
          this.isLoading = false;
        }
      },
      error: (error) => {
        console.error('❌ Erreur lors de l\'export Excel:', error);
        
        let errorMessage = 'Une erreur est survenue lors de l\'export Excel.';
        
        if (error.status === 404) {
          errorMessage = 'Service d\'export non disponible. Contactez l\'administrateur.';
        } else if (error.status === 500) {
          errorMessage = 'Erreur serveur lors de l\'export. Veuillez réessayer plus tard.';
        } else if (error.status === 0) {
          errorMessage = 'Problème de connexion réseau. Vérifiez votre connexion internet.';
        }
        
        this.error = errorMessage;
        this.isLoading = false;
      }
    });
  }

  search(): void {
    this.current_page = 1;
    this.loadData();
  }

  // Pagination
  onPageChange(event: PageEvent): void {
    this.current_page = event.pageIndex + 1;
    this.page_size = event.pageSize;
    this.loadData();
  }

  // Custom pagination methods for HTML pagination
  goToPage(page: number): void {
    if (page >= 1 && page <= this.getTotalPages()) {
      this.current_page = page;
      this.loadData();
    }
  }

  getPageNumbers(): number[] {
    const totalPages = this.getTotalPages();
    const pages: number[] = [];
    const startPage = Math.max(1, this.current_page - 2);
    const endPage = Math.min(totalPages, this.current_page + 2);

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  }

  // Sorting
  sortData(sort: Sort): void {
    // Implement sorting logic if needed
  }

  // UI Modal Controls
  openEditOffcanvas(): void {
    if (this.offcanvasToggle) {
      this.offcanvasToggle.nativeElement.click();
    }
  }

  openNewGeolocationOffcanvas(): void {
    this.prepareNewGeolocation();
    this.openEditOffcanvas();
  }

  closeOffcanvas(): void {
    try {
      // Method 1: Try to close using Bootstrap's offcanvas instance
      const offcanvasElement = document.getElementById('addGeolocationOffcanvas');
      if (offcanvasElement) {
        // Check if Bootstrap is available
        if (typeof (window as any).bootstrap !== 'undefined' && (window as any).bootstrap.Offcanvas) {
          const offcanvasInstance = (window as any).bootstrap.Offcanvas.getInstance(offcanvasElement);
          if (offcanvasInstance) {
            offcanvasInstance.hide();
            return;
          } else {
            // Create new instance and hide
            const newOffcanvasInstance = new (window as any).bootstrap.Offcanvas(offcanvasElement);
            newOffcanvasInstance.hide();
            return;
          }
        }
      }
      
      // Method 2: Fallback - trigger click on close button
      const closeButton = document.querySelector('#addGeolocationOffcanvas .btn-close');
      if (closeButton) {
        (closeButton as HTMLElement).click();
        return;
      }
      
      // Method 3: Final fallback - use ViewChild reference if available
      if (this.offcanvasToggle?.nativeElement) {
        this.offcanvasToggle.nativeElement.click();
      }
    } catch (error) {
      console.warn('Error closing offcanvas:', error);
      // Silent fail - the user can still close manually
    }
  }

  openViewModal(geolocation: IGeolocalisation): void {
    this.viewingGeolocation = geolocation;
  }

  closeViewModal(): void {
    this.viewingGeolocation = null;
  }

  // UI helpers
  getInitials(migrant: IMigrant): string {
    return `${migrant.nom.charAt(0)}${migrant.prenom.charAt(0)}`.toUpperCase();
  }

  getMigrantName(geolocation: IGeolocalisation): string {
    if (geolocation.migrant) {
      return `${geolocation.migrant.nom} ${geolocation.migrant.prenom}`;
    }
    // Find migrant by UUID if not preloaded
    const migrant = this.migrants.find(m => m.uuid === geolocation.migrant_uuid);
    return migrant ? `${migrant.nom} ${migrant.prenom}` : 'N/A';
  }

  getTypeLocalisationLabel(typeLocalisation: string): string {
    const option = this.typeLocalisationOptions.find(opt => opt.value === typeLocalisation);
    return option ? option.label : typeLocalisation;
  }

  getTypeMouvementLabel(typeMouvement: string | undefined): string {
    if (!typeMouvement) return '-';
    const option = this.typeMouvementOptions.find(opt => opt.value === typeMouvement);
    return option ? option.label : typeMouvement;
  }

  getTypeMouvementBadgeClass(typeMouvement: string | undefined): string {
    if (!typeMouvement) return 'badge bg-light text-dark';
    switch (typeMouvement) {
      case 'arrivee': return 'badge bg-success';
      case 'depart': return 'badge bg-warning';
      case 'transit': return 'badge bg-info';
      case 'residence_temporaire': return 'badge bg-secondary';
      case 'residence_permanente': return 'badge bg-primary';
      default: return 'badge bg-light text-dark';
    }
  }

  formatCoordinates(lat: number, lon: number): string {
    return `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
  }

  // Stats helpers
  getStatValue(statKey: string): number {
    return this.geolocationStats ? this.geolocationStats[statKey] || 0 : 0;
  }

  getTotalGeolocations(): number {
    return this.getStatValue('total_geolocations');
  }

  // Form validation helpers
  isFieldInvalid(fieldName: string): boolean {
    const field = this.geolocationForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  // TrackBy function for performance optimization
  trackByGeolocationUuid(index: number, geolocation: IGeolocalisation): string {
    return geolocation.uuid;
  }

  // Custom pagination methods
  getTotalPages(): number {
    return Math.ceil(this.total_records / this.page_size);
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.getTotalPages()) {
      this.current_page = page;
      this.loadData();
    }
  }
}

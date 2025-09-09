import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { Sort } from '@angular/material/sort';
import { PageEvent } from '@angular/material/paginator';
import { Subject, firstValueFrom, takeUntil } from 'rxjs';
import { IGeolocalisation, IMigrant } from '../../shared/models/migrant.model';
import { GeolocationService, IGeolocationFormData } from '../../core/migration/geolocation.service';
import { MigrantService } from '../../core/migration/migrant.service';

@Component({
  selector: 'app-geolocations',
  standalone: false,
  templateUrl: './geolocations.component.html',
  styleUrl: './geolocations.component.scss'
})
export class GeolocationsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Math reference for template
  Math = Math;

  // Angular Material Table
  dataSource = new MatTableDataSource<IGeolocalisation>();
  displayedColumns: string[] = [
    'migrant', 'type_localisation', 'coordonnees', 'pays', 'ville', 
    'date_enregistrement', 'methode_capture', 'fiabilite_source', 'actif', 'actions'
  ];

  // Data
  geolocations: IGeolocalisation[] = [];
  migrants: IMigrant[] = [];

  // Form
  geolocationForm: FormGroup;
  editingGeolocation: IGeolocalisation | null = null;
  viewingGeolocation: IGeolocalisation | null = null;

  // States
  isLoading = false;
  isLoadingData = false;
  isSaving = false;
  error: string | null = null;

  // Pagination
  total_records = 0;
  page_size = 15;
  current_page = 1;

  // Filters
  selectedMigrant = '';
  selectedTypeLocalisation = '';
  selectedPays = '';
  selectedVille = '';
  selectedMethodeCapture = '';
  selectedFiabilite = '';
  selectedTypeMouvement = '';
  selectedActif = '';
  dateFrom = '';
  dateTo = '';

  // Advanced search mode
  showAdvancedFilters = false;

  // Map/radius search
  radiusLat: number | null = null;
  radiusLon: number | null = null;
  radiusKm = 10;

  // Statistics and analytics
  stats: any = null;
  migrationRoutes: any[] = [];
  hotspots: any[] = [];
  showStatsPanel = false;

  // Options
  typeLocalisationOptions = [
    { value: 'residence_actuelle', label: 'Résidence actuelle' },
    { value: 'lieu_travail', label: 'Lieu de travail' },
    { value: 'point_passage', label: 'Point de passage' },
    { value: 'frontiere', label: 'Frontière' },
    { value: 'centre_accueil', label: 'Centre d\'accueil' },
    { value: 'urgence', label: 'Urgence' }
  ];

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

  typeMouvementOptions = [
    { value: 'arrivee', label: 'Arrivée' },
    { value: 'depart', label: 'Départ' },
    { value: 'transit', label: 'Transit' },
    { value: 'residence_temporaire', label: 'Résidence temporaire' },
    { value: 'residence_permanente', label: 'Résidence permanente' }
  ];

  constructor(
    private fb: FormBuilder,
    private geolocationService: GeolocationService,
    private migrantService: MigrantService
  ) {
    this.geolocationForm = this.createForm();
  }

  ngOnInit(): void {
    this.loadData();
    this.loadMigrants();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private createForm(): FormGroup {
    return this.fb.group({
      migrant_uuid: ['', Validators.required],
      latitude: ['', [Validators.required, Validators.min(-90), Validators.max(90)]],
      longitude: ['', [Validators.required, Validators.min(-180), Validators.max(180)]],
      altitude: [''],
      precision: [''],
      type_localisation: ['', Validators.required],
      description: [''],
      adresse: [''],
      ville: [''],
      pays: ['', Validators.required],
      code_postal: [''],
      date_enregistrement: ['', Validators.required],
      methode_capture: ['manuel'],
      dispositif_source: [''],
      fiabilite_source: ['moyenne'],
      actif: [true],
      commentaire: [''],
      type_mouvement: [''],
      duree_sejour: [''],
      prochaine_destination: ['']
    });
  }

  async loadData(): Promise<void> {
    this.isLoadingData = true;
    this.error = null;

    try {
      // Use advanced search if filters are applied
      if (this.hasAdvancedFilters()) {
        await this.performAdvancedSearch();
      } else {
        const response = await firstValueFrom(
          this.geolocationService.getPaginatedGeolocations(
            this.current_page, 
            this.page_size,
            this.selectedMigrant,
            this.selectedTypeLocalisation,
            this.selectedPays,
            this.selectedActif
          ).pipe(takeUntil(this.destroy$))
        );

        if (response.status === 'success') {
          this.geolocations = response.data;
          this.dataSource.data = response.data;
          this.total_records = response.pagination.total_records;
          this.current_page = response.pagination.current_page;
          this.page_size = response.pagination.page_size;
        }
      }
    } catch (error: any) {
      this.error = error.error?.message || 'Erreur lors du chargement des données';
      console.error('Erreur lors du chargement des géolocalisations:', error);
    } finally {
      this.isLoadingData = false;
    }
  }

  private hasAdvancedFilters(): boolean {
    return !!(this.selectedVille || this.selectedMethodeCapture || 
              this.selectedFiabilite || this.selectedTypeMouvement || 
              this.dateFrom || this.dateTo);
  }

  private async performAdvancedSearch(): Promise<void> {
    const filters: any = {};
    
    if (this.selectedTypeLocalisation) filters.type_localisation = this.selectedTypeLocalisation;
    if (this.selectedPays) filters.pays = this.selectedPays;
    if (this.selectedVille) filters.ville = this.selectedVille;
    if (this.selectedMethodeCapture) filters.methode_capture = this.selectedMethodeCapture;
    if (this.selectedFiabilite) filters.fiabilite = this.selectedFiabilite;
    if (this.selectedTypeMouvement) filters.type_mouvement = this.selectedTypeMouvement;
    if (this.selectedActif) filters.actif = this.selectedActif;
    if (this.dateFrom) filters.date_from = this.dateFrom;
    if (this.dateTo) filters.date_to = this.dateTo;

    const response = await firstValueFrom(
      this.geolocationService.searchGeolocations(filters).pipe(takeUntil(this.destroy$))
    );

    if (response.status === 'success') {
      this.geolocations = response.data;
      this.dataSource.data = response.data;
      this.total_records = response.data.length;
      this.current_page = 1;
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

  async onSubmit(): Promise<void> {
    if (this.geolocationForm.invalid || this.isSaving) return;

    this.isSaving = true;
    this.error = null;

    try {
      const formData: IGeolocationFormData = this.geolocationForm.value;

      // Convertir les champs de date en format ISO string
      const geolocationData = {
        ...formData,
        date_enregistrement: formData.date_enregistrement ? new Date(formData.date_enregistrement).toISOString() : ''
      };

      let response;
      if (this.editingGeolocation) {
        response = await firstValueFrom(
          this.geolocationService.updateGeolocation(this.editingGeolocation.uuid, geolocationData)
            .pipe(takeUntil(this.destroy$))
        );
      } else {
        response = await firstValueFrom(
          this.geolocationService.createGeolocation(geolocationData)
            .pipe(takeUntil(this.destroy$))
        );
      }

      if (response.status === 'success') {
        await this.loadData();
        this.resetForm();
        this.closeOffcanvas();
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
    // Set current date as default
    const now = new Date();
    this.geolocationForm.patchValue({
      date_enregistrement: now.toISOString().split('T')[0]
    });
  }

  prepareEditGeolocation(geolocation: IGeolocalisation): void {
    this.editingGeolocation = geolocation;
    this.geolocationForm.patchValue({
      migrant_uuid: geolocation.migrant_uuid,
      latitude: geolocation.latitude,
      longitude: geolocation.longitude,
      altitude: geolocation.altitude,
      precision: geolocation.precision,
      type_localisation: geolocation.type_localisation,
      description: geolocation.description,
      adresse: geolocation.adresse,
      ville: geolocation.ville,
      pays: geolocation.pays,
      code_postal: geolocation.code_postal,
      date_enregistrement: geolocation.date_enregistrement ? geolocation.date_enregistrement.split('T')[0] : '',
      methode_capture: geolocation.methode_capture,
      dispositif_source: geolocation.dispositif_source,
      fiabilite_source: geolocation.fiabilite_source,
      actif: geolocation.actif,
      commentaire: geolocation.commentaire,
      type_mouvement: geolocation.type_mouvement,
      duree_sejour: geolocation.duree_sejour,
      prochaine_destination: geolocation.prochaine_destination
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

  async validateGeolocation(geolocation: IGeolocalisation): Promise<void> {
    const validePar = prompt('Nom du validateur:');
    if (!validePar) return;

    const commentaire = prompt('Commentaire de validation:') || '';

    try {
      const response = await firstValueFrom(
        this.geolocationService.validateGeolocation(geolocation.uuid, {
          valide_par: validePar,
          commentaire: commentaire
        }).pipe(takeUntil(this.destroy$))
      );

      if (response.status === 'success') {
        await this.loadData();
      }
    } catch (error: any) {
      this.error = error.error?.message || 'Erreur lors de la validation';
      console.error('Erreur lors de la validation:', error);
    }
  }

  resetForm(): void {
    this.geolocationForm.reset();
    this.geolocationForm.patchValue({
      methode_capture: 'manuel',
      fiabilite_source: 'moyenne',
      actif: true
    });
    this.error = null;
  }

  // Search and filters
  applyFilters(): void {
    this.current_page = 1;
    this.loadData();
  }

  resetFilters(): void {
    this.selectedMigrant = '';
    this.selectedTypeLocalisation = '';
    this.selectedPays = '';
    this.selectedVille = '';
    this.selectedMethodeCapture = '';
    this.selectedFiabilite = '';
    this.selectedTypeMouvement = '';
    this.selectedActif = '';
    this.dateFrom = '';
    this.dateTo = '';
    this.radiusLat = null;
    this.radiusLon = null;
    this.radiusKm = 10;
    this.current_page = 1;
    this.showAdvancedFilters = false;
    this.loadData();
  }

  // Pagination
  onPageChange(event: PageEvent): void {
    this.current_page = event.pageIndex + 1;
    this.page_size = event.pageSize;
    this.loadData();
  }

  // Sorting
  sortData(sort: Sort): void {
    // Implement sorting logic if needed
  }

  // UI helpers
  getMigrantName(migrantUuid: string): string {
    const migrant = this.migrants.find(m => m.uuid === migrantUuid);
    return migrant ? `${migrant.nom} ${migrant.prenom}` : 'Migrant inconnu';
  }

  getMigrantInitials(migrantUuid: string): string {
    const migrantName = this.getMigrantName(migrantUuid);
    if (migrantName === 'Migrant inconnu') return 'MI';
    return migrantName.split(' ')
      .map(n => n[0] || '')
      .join('')
      .substring(0, 2)
      .toUpperCase();
  }

  getTypeLocalisationLabel(type: string): string {
    const option = this.typeLocalisationOptions.find(o => o.value === type);
    return option?.label || type;
  }

  getMethodeCaptureLabel(methode: string): string {
    const option = this.methodeCaptureOptions.find(o => o.value === methode);
    return option?.label || methode;
  }

  getFiabiliteLabel(fiabilite: string): string {
    const option = this.fiabiliteSourceOptions.find(o => o.value === fiabilite);
    return option?.label || fiabilite;
  }

  getFiabiliteBadgeClass(fiabilite: string): string {
    switch (fiabilite) {
      case 'elevee': return 'badge bg-success';
      case 'moyenne': return 'badge bg-warning';
      case 'faible': return 'badge bg-danger';
      default: return 'badge bg-secondary';
    }
  }

  getStatusBadgeClass(actif: boolean): string {
    return actif ? 'badge bg-success' : 'badge bg-danger';
  }

  formatDate(dateString: string): string {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('fr-FR');
  }

  formatCoordinates(lat: number, lon: number): string {
    return `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
  }

  // Form validation helpers
  isFieldInvalid(fieldName: string): boolean {
    const field = this.geolocationForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.geolocationForm.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) return `${fieldName} est requis`;
      if (field.errors['min']) return 'Valeur trop petite';
      if (field.errors['max']) return 'Valeur trop grande';
    }
    return '';
  }

  // Modal/Offcanvas controls
  openAddOffcanvas(): void {
    // Implement offcanvas open logic
  }

  openEditOffcanvas(): void {
    // Implement offcanvas open logic
  }

  closeOffcanvas(): void {
    // Implement offcanvas close logic
  }

  openViewModal(geolocation: IGeolocalisation): void {
    this.viewingGeolocation = geolocation;
  }

  closeViewModal(): void {
    this.viewingGeolocation = null;
  }

  // Get current location (browser geolocation)
  getCurrentLocation(): void {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.geolocationForm.patchValue({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            precision: position.coords.accuracy,
            methode_capture: 'gps'
          });
        },
        (error) => {
          console.error('Erreur de géolocalisation:', error);
          alert('Impossible d\'obtenir votre position actuelle');
        }
      );
    } else {
      alert('La géolocalisation n\'est pas supportée par ce navigateur');
    }
  }

  // Advanced features based on backend API

  // Get geolocations within radius
  async searchInRadius(): Promise<void> {
    if (!this.radiusLat || !this.radiusLon) {
      alert('Veuillez spécifier les coordonnées du centre de recherche');
      return;
    }

    // Validate coordinates
    const validation = this.geolocationService.validateCoordinates(this.radiusLat, this.radiusLon);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    this.isLoadingData = true;
    try {
      const response = await firstValueFrom(
        this.geolocationService.getGeolocationsWithinRadius(
          this.radiusLat, 
          this.radiusLon, 
          this.radiusKm
        ).pipe(takeUntil(this.destroy$))
      );

      if (response.status === 'success') {
        this.geolocations = response.data;
        this.dataSource.data = response.data;
        this.total_records = response.data.length;
      }
    } catch (error: any) {
      this.error = error.error?.message || 'Erreur lors de la recherche par rayon';
      console.error('Erreur lors de la recherche par rayon:', error);
    } finally {
      this.isLoadingData = false;
    }
  }

  // Set radius center to current location
  setRadiusCenterToCurrent(): void {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.radiusLat = position.coords.latitude;
          this.radiusLon = position.coords.longitude;
        },
        (error) => {
          console.error('Erreur de géolocalisation:', error);
          alert('Impossible d\'obtenir votre position actuelle');
        }
      );
    } else {
      alert('La géolocalisation n\'est pas supportée par ce navigateur');
    }
  }

  // Calculate distance between two geolocations
  calculateDistance(geo1: IGeolocalisation, geo2: IGeolocalisation): number {
    return this.geolocationService.calculateDistance(
      geo1.latitude, geo1.longitude,
      geo2.latitude, geo2.longitude
    );
  }

  // Get geolocation statistics
  async loadStats(): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.geolocationService.getGeolocationsStats().pipe(takeUntil(this.destroy$))
      );
      return response.status === 'success' ? response.data : null;
    } catch (error: any) {
      console.error('Erreur lors du chargement des statistiques:', error);
      return null;
    }
  }

  // Get migration routes
  async loadMigrationRoutes(): Promise<any[]> {
    try {
      const response = await firstValueFrom(
        this.geolocationService.getMigrationRoutes().pipe(takeUntil(this.destroy$))
      );
      return response.status === 'success' ? response.data : [];
    } catch (error: any) {
      console.error('Erreur lors du chargement des routes de migration:', error);
      return [];
    }
  }

  // Get hotspots
  async loadHotspots(): Promise<any[]> {
    try {
      const response = await firstValueFrom(
        this.geolocationService.getGeolocationHotspots().pipe(takeUntil(this.destroy$))
      );
      return response.status === 'success' ? response.data : [];
    } catch (error: any) {
      console.error('Erreur lors du chargement des hotspots:', error);
      return [];
    }
  }

  // Load geolocations for specific migrant
  async loadGeolocationsByMigrant(migrantUuid: string): Promise<void> {
    this.isLoadingData = true;
    try {
      const response = await firstValueFrom(
        this.geolocationService.getGeolocationsByMigrant(migrantUuid).pipe(takeUntil(this.destroy$))
      );

      if (response.status === 'success') {
        this.geolocations = response.data;
        this.dataSource.data = response.data;
        this.total_records = response.data.length;
      }
    } catch (error: any) {
      this.error = error.error?.message || 'Erreur lors du chargement des géolocalisations du migrant';
      console.error('Erreur:', error);
    } finally {
      this.isLoadingData = false;
    }
  }

  // Load only active geolocations
  async loadActiveGeolocations(): Promise<void> {
    this.isLoadingData = true;
    try {
      const response = await firstValueFrom(
        this.geolocationService.getActiveGeolocations().pipe(takeUntil(this.destroy$))
      );

      if (response.status === 'success') {
        this.geolocations = response.data;
        this.dataSource.data = response.data;
        this.total_records = response.data.length;
      }
    } catch (error: any) {
      this.error = error.error?.message || 'Erreur lors du chargement des géolocalisations actives';
      console.error('Erreur:', error);
    } finally {
      this.isLoadingData = false;
    }
  }

  // Toggle advanced filters
  toggleAdvancedFilters(): void {
    this.showAdvancedFilters = !this.showAdvancedFilters;
    if (!this.showAdvancedFilters) {
      // Reset advanced filters when hiding
      this.selectedVille = '';
      this.selectedMethodeCapture = '';
      this.selectedFiabilite = '';
      this.selectedTypeMouvement = '';
      this.dateFrom = '';
      this.dateTo = '';
    }
  }

  // Form validation for coordinates
  validateCoordinates(): void {
    const lat = this.geolocationForm.get('latitude')?.value;
    const lon = this.geolocationForm.get('longitude')?.value;

    if (lat && lon) {
      const validation = this.geolocationService.validateCoordinates(lat, lon);
      if (!validation.valid) {
        this.geolocationForm.get('latitude')?.setErrors({ 'invalidCoords': validation.error });
        this.geolocationForm.get('longitude')?.setErrors({ 'invalidCoords': validation.error });
      }
    }
  }

  // Export geolocations to CSV
  exportToCSV(): void {
    if (this.geolocations.length === 0) {
      alert('Aucune donnée à exporter');
      return;
    }

    const headers = [
      'UUID', 'Migrant UUID', 'Migrant', 'Type Localisation', 'Latitude', 'Longitude',
      'Altitude', 'Précision', 'Pays', 'Ville', 'Adresse', 'Date Enregistrement',
      'Méthode Capture', 'Fiabilité Source', 'Actif', 'Type Mouvement', 'Durée Séjour',
      'Prochaine Destination', 'Validé Par', 'Date Validation', 'Commentaire'
    ];

    const csvData = this.geolocations.map(geo => [
      geo.uuid,
      geo.migrant_uuid,
      this.getMigrantName(geo.migrant_uuid),
      geo.type_localisation,
      geo.latitude,
      geo.longitude,
      geo.altitude || '',
      geo.precision || '',
      geo.pays,
      geo.ville || '',
      geo.adresse || '',
      geo.date_enregistrement,
      geo.methode_capture,
      geo.fiabilite_source,
      geo.actif,
      geo.type_mouvement || '',
      geo.duree_sejour || '',
      geo.prochaine_destination || '',
      geo.valide_par || '',
      geo.date_validation || '',
      geo.commentaire || ''
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `geolocalisations_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Get coordinate display format
  getCoordinateDisplay(lat: number, lon: number): string {
    return `${lat.toFixed(6)}°, ${lon.toFixed(6)}°`;
  }

  // Get movement type badge class
  getMovementTypeBadgeClass(typeMovement?: string): string {
    switch (typeMovement) {
      case 'arrivee': return 'badge bg-success';
      case 'depart': return 'badge bg-danger';
      case 'transit': return 'badge bg-warning';
      case 'residence_temporaire': return 'badge bg-info';
      case 'residence_permanente': return 'badge bg-primary';
      default: return 'badge bg-secondary';
    }
  }

  // Get movement type label
  getMovementTypeLabel(typeMovement?: string): string {
    const option = this.typeMouvementOptions.find(o => o.value === typeMovement);
    return option?.label || typeMovement || '-';
  }

  // Check if geolocation is validated
  isValidated(geolocation: IGeolocalisation): boolean {
    return !!(geolocation.date_validation && geolocation.valide_par);
  }

  // Get validation status badge
  getValidationBadgeClass(geolocation: IGeolocalisation): string {
    return this.isValidated(geolocation) ? 'badge bg-success' : 'badge bg-warning';
  }

  // Get validation status text
  getValidationStatus(geolocation: IGeolocalisation): string {
    return this.isValidated(geolocation) ? 'Validé' : 'Non validé';
  }
}

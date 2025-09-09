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
  selectedActif = '';

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

      if (response.success) {
        this.geolocations = response.data;
        this.dataSource.data = response.data;
        this.total_records = response.total;
        this.current_page = response.page;
        this.page_size = response.limit;
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

      if (response.success) {
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

      if (response.success) {
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

      if (response.success) {
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

      if (response.success) {
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
    this.selectedActif = '';
    this.current_page = 1;
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
}

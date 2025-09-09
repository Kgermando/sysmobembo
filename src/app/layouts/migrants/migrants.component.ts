import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { Sort } from '@angular/material/sort';
import { PageEvent } from '@angular/material/paginator';
import { Subject, firstValueFrom, takeUntil } from 'rxjs';
import { IMigrant } from '../../shared/models/migrant.model';
import { MigrantService, IMigrantFormData, IBackendPaginationResponse } from '../../core/migration/migrant.service';
import { NATIONALITES, searchNationalites, PAYS_ORIGINE_COMMUNS } from '../../shared/utils';

@Component({
  selector: 'app-migrants',
  standalone: false,
  templateUrl: './migrants.component.html',
  styleUrl: './migrants.component.scss'
})
export class MigrantsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Math reference for template
  Math = Math;

  // Angular Material Table
  dataSource = new MatTableDataSource<IMigrant>();
  displayedColumns: string[] = [
    'nom', 'prenom', 'sexe', 'nationalite', 'numero_identifiant', 
    'statut_migratoire', 'pays_origine', 'date_naissance', 'actif', 'actions'
  ];

  // Data
  migrants: IMigrant[] = [];
  dataList: IMigrant[] = [];
  migrantStats: any = null;

  // Form
  migrantForm: FormGroup;
  editingMigrant: IMigrant | null = null;
  viewingMigrant: IMigrant | null = null;

  // States
  isLoading = false;
  isLoadingData = false;
  isSaving = false;
  error: string | null = null;

  // Pagination
  total_records = 0;
  page_size = 15;
  current_page = 1;
  currentPage = 1;
  pageSize = 15;

  // Filters - Updated to match backend
  searchTerm = '';
  selectedNationalite = '';
  selectedStatutMigratoire = '';
  selectedGenre = '';
  selectedActif = '';
  selectedTypeDocument = '';
  dateCreationDebut = '';
  dateCreationFin = '';
  dateNaissanceDebut = '';
  dateNaissanceFin = '';
  selectedPaysOrigine = '';

  // Options pour les filtres
  sexeOptions = [
    { value: 'M', label: 'Masculin' },
    { value: 'F', label: 'Féminin' }
  ];

  typeDocumentOptions = [
    { value: 'passport', label: 'Passeport' },
    { value: 'carte_identite', label: 'Carte d\'identité' },
    { value: 'permis_conduire', label: 'Permis de conduire' }
  ];

  situationMatrimonialeOptions = [
    { value: 'celibataire', label: 'Célibataire' },
    { value: 'marie', label: 'Marié(e)' },
    { value: 'divorce', label: 'Divorcé(e)' },
    { value: 'veuf', label: 'Veuf/Veuve' }
  ];

  statutMiratoireOptions = [
    { value: 'regulier', label: 'Régulier' },
    { value: 'irregulier', label: 'Irrégulier' },
    { value: 'demandeur_asile', label: 'Demandeur d\'asile' },
    { value: 'refugie', label: 'Réfugié' }
  ];

  // Options pour les filtres de statut actif
  actifOptions = [
    { value: 'true', label: 'Actif' },
    { value: 'false', label: 'Inactif' }
  ];

  // Getter pour les pays d'origine (utilise l'utilitaire)
  get paysOrigineOptions(): string[] {
    return PAYS_ORIGINE_COMMUNS;
  }

  // Nationalités communes (vous pouvez étendre cette liste)
  nationaliteOptions = [
    'Congolaise (RDC)', 'Française', 'Belge', 'Camerounaise', 'Gabonaise',
    'Centrafricaine', 'Tchadienne', 'Angolaise', 'Zambienne', 'Tanzanienne',
    'Ougandaise', 'Rwandaise', 'Burundaise', 'Soudanaise', 'Érythréenne',
    'Éthiopienne', 'Somalienne', 'Malienne', 'Burkinabè', 'Ivoirienne',
    'Ghanéenne', 'Nigériane', 'Sénégalaise', 'Guinéenne', 'Libérienne'
  ];

  constructor(
    private fb: FormBuilder,
    private migrantService: MigrantService
  ) {
    this.migrantForm = this.createForm();
  }

  ngOnInit(): void {
    this.loadData();
    this.loadStats();
    // loadNationalityStats() removed as it's now included in getMigrantsStats()
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private createForm(): FormGroup {
    return this.fb.group({
      nom: ['', [Validators.required, Validators.minLength(2)]],
      prenom: ['', [Validators.required, Validators.minLength(2)]],
      date_naissance: ['', Validators.required],
      lieu_naissance: ['', Validators.required],
      sexe: ['', Validators.required],
      nationalite: ['', Validators.required],
      type_document: ['', Validators.required],
      numero_document: ['', Validators.required],
      date_emission_document: [''],
      date_expiration_document: [''],
      autorite_emission: [''],
      telephone: [''],
      email: ['', Validators.email],
      adresse_actuelle: [''],
      ville_actuelle: [''],
      pays_actuel: [''],
      situation_matrimoniale: [''],
      nombre_enfants: [0, [Validators.min(0)]],
      personne_contact: [''],
      telephone_contact: [''],
      statut_migratoire: ['', Validators.required],
      date_entree: [''],
      point_entree: [''],
      pays_origine: ['', Validators.required],
      pays_destination: [''],
      actif: [true]
      // Note: numero_identifiant is now auto-generated by backend, so it's removed from form
    });
  }

  async loadData(): Promise<void> {
    this.isLoadingData = true;
    this.error = null;

    try {
      // Build filters object
      const filters: any = {};
      if (this.searchTerm) filters.search = this.searchTerm;
      if (this.selectedNationalite) filters.nationalite = this.selectedNationalite;
      if (this.selectedStatutMigratoire) filters.statut_migratoire = this.selectedStatutMigratoire;
      if (this.selectedGenre) filters.genre = this.selectedGenre;
      if (this.selectedActif) filters.actif = this.selectedActif;
      if (this.selectedTypeDocument) filters.type_document = this.selectedTypeDocument;
      if (this.selectedPaysOrigine) filters.pays_origine = this.selectedPaysOrigine;
      if (this.dateCreationDebut) filters.date_creation_debut = this.dateCreationDebut;
      if (this.dateCreationFin) filters.date_creation_fin = this.dateCreationFin;
      if (this.dateNaissanceDebut) filters.date_naissance_debut = this.dateNaissanceDebut;
      if (this.dateNaissanceFin) filters.date_naissance_fin = this.dateNaissanceFin;

      const response = await firstValueFrom(
        this.migrantService.getPaginatedMigrants(this.current_page, this.page_size, filters)
          .pipe(takeUntil(this.destroy$))
      );

      if (response.status === 'success') {
        this.migrants = response.data;
        this.dataList = response.data;
        this.dataSource.data = response.data;
        this.total_records = response.pagination.total_records;
        this.current_page = response.pagination.current_page;
        this.page_size = response.pagination.page_size;
      }
    } catch (error: any) {
      this.error = error.error?.message || 'Erreur lors du chargement des données';
      console.error('Erreur lors du chargement des migrants:', error);
    } finally {
      this.isLoadingData = false;
    }
  }

  async loadStats(): Promise<void> {
    try {
      const response = await firstValueFrom(
        this.migrantService.getMigrantsStats()
          .pipe(takeUntil(this.destroy$))
      );

      if (response.status === 'success') {
        this.migrantStats = response.data;
      }
    } catch (error: any) {
      console.error('Erreur lors du chargement des statistiques:', error);
    }
  }

  // Remove deprecated loadNationalityStats method
  // The backend now provides comprehensive stats through getMigrantsStats

  async onSubmit(): Promise<void> {
    if (this.migrantForm.invalid || this.isSaving) return;

    this.isSaving = true;
    this.error = null;

    try {
      const formData: IMigrantFormData = this.migrantForm.value;

      // Convertir les champs de date
      const migrantData = {
        ...formData,
        date_naissance: formData.date_naissance ? new Date(formData.date_naissance).toISOString() : ''
      };

      let response;
      if (this.editingMigrant) {
        response = await firstValueFrom(
          this.migrantService.updateMigrant(this.editingMigrant.uuid, migrantData)
            .pipe(takeUntil(this.destroy$))
        );
      } else {
        response = await firstValueFrom(
          this.migrantService.createMigrant(migrantData)
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
      console.error('Erreur lors de l\'enregistrement du migrant:', error);
    } finally {
      this.isSaving = false;
    }
  }

  prepareNewMigrant(): void {
    this.editingMigrant = null;
    this.resetForm();
  }

  prepareEditMigrant(migrant: IMigrant): void {
    this.editingMigrant = migrant;
    this.migrantForm.patchValue({
      nom: migrant.nom,
      prenom: migrant.prenom,
      date_naissance: migrant.date_naissance ? migrant.date_naissance.split('T')[0] : '',
      lieu_naissance: migrant.lieu_naissance,
      sexe: migrant.sexe,
      nationalite: migrant.nationalite,
      type_document: migrant.type_document,
      numero_document: migrant.numero_document,
      date_emission_document: migrant.date_emission_document ? migrant.date_emission_document.split('T')[0] : '',
      date_expiration_document: migrant.date_expiration_document ? migrant.date_expiration_document.split('T')[0] : '',
      autorite_emission: migrant.autorite_emission,
      telephone: migrant.telephone,
      email: migrant.email,
      adresse_actuelle: migrant.adresse_actuelle,
      ville_actuelle: migrant.ville_actuelle,
      pays_actuel: migrant.pays_actuel,
      situation_matrimoniale: migrant.situation_matrimoniale,
      nombre_enfants: migrant.nombre_enfants,
      personne_contact: migrant.personne_contact,
      telephone_contact: migrant.telephone_contact,
      statut_migratoire: migrant.statut_migratoire,
      date_entree: migrant.date_entree ? migrant.date_entree.split('T')[0] : '',
      point_entree: migrant.point_entree,
      pays_origine: migrant.pays_origine,
      pays_destination: migrant.pays_destination,
      actif: migrant.actif
    });
  }

  async deleteMigrant(migrant: IMigrant): Promise<void> {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce migrant ?')) return;

    try {
      const response = await firstValueFrom(
        this.migrantService.deleteMigrant(migrant.uuid)
          .pipe(takeUntil(this.destroy$))
      );

      if (response.status === 'success') {
        await this.loadData();
      }
    } catch (error: any) {
      this.error = error.error?.message || 'Erreur lors de la suppression';
      console.error('Erreur lors de la suppression du migrant:', error);
    }
  }

  resetForm(): void {
    this.migrantForm.reset();
    this.migrantForm.patchValue({
      nombre_enfants: 0,
      actif: true
    });
    this.error = null;
  }

  // Search by numero identifiant
  searchByNumero = '';

  async searchMigrantByNumero(): Promise<void> {
    if (!this.searchByNumero.trim()) {
      this.error = 'Veuillez saisir un numéro d\'identifiant';
      return;
    }

    this.isLoadingData = true;
    this.error = null;

    try {
      const response = await firstValueFrom(
        this.migrantService.getMigrantByNumero(this.searchByNumero.trim())
          .pipe(takeUntil(this.destroy$))
      );

      if (response.status === 'success') {
        this.migrants = [response.data];
        this.dataSource.data = this.migrants;
        this.total_records = 1;
      }
    } catch (error: any) {
      this.error = error.error?.message || 'Migrant non trouvé';
      this.migrants = [];
      this.dataSource.data = [];
      this.total_records = 0;
    } finally {
      this.isLoadingData = false;
    }
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

  // Remove deprecated searchWithFilters method since filtering is now integrated in loadData
  
  resetFilters(): void {
    this.searchTerm = '';
    this.selectedNationalite = '';
    this.selectedStatutMigratoire = '';
    this.selectedGenre = '';
    this.selectedActif = '';
    this.selectedTypeDocument = '';
    this.selectedPaysOrigine = '';
    this.dateCreationDebut = '';
    this.dateCreationFin = '';
    this.dateNaissanceDebut = '';
    this.dateNaissanceFin = '';
    this.current_page = 1;
    this.loadData();
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

  // Sorting
  sortData(sort: Sort): void {
    // Implement sorting logic if needed
  }

  // UI helpers
  getInitials(migrant: IMigrant): string {
    return `${migrant.nom.charAt(0)}${migrant.prenom.charAt(0)}`.toUpperCase();
  }

  getStatutBadgeClass(statut: string): string {
    switch (statut) {
      case 'regulier': return 'badge bg-success';
      case 'irregulier': return 'badge bg-warning';
      case 'demandeur_asile': return 'badge bg-info';
      case 'refugie': return 'badge bg-primary';
      default: return 'badge bg-secondary';
    }
  }

  getStatusBadgeClass(actif: boolean): string {
    return actif ? 'badge bg-success' : 'badge bg-danger';
  }

  getStatusLabel(actif: boolean): string {
    return actif ? 'Actif' : 'Inactif';
  }

  getStatutLabel(statut: string): string {
    switch (statut) {
      case 'regulier': return 'Régulier';
      case 'irregulier': return 'Irrégulier';
      case 'demandeur_asile': return 'Demandeur d\'asile';
      case 'refugie': return 'Réfugié';
      default: return statut;
    }
  }

  getSexeLabel(sexe: string): string {
    return sexe === 'M' ? 'Masculin' : 'Féminin';
  }

  formatDate(dateString: string | undefined): string {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('fr-FR');
  }

  // Stats helpers
  getStatValue(statKey: string): number {
    return this.migrantStats ? this.migrantStats[statKey] || 0 : 0;
  }

  // Remove getTopNationalities as it's no longer available from backend
  // Use the comprehensive stats from getMigrantsStats() instead

  // Form validation helpers
  isFieldInvalid(fieldName: string): boolean {
    const field = this.migrantForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.migrantForm.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) return `${fieldName} est requis`;
      if (field.errors['email']) return 'Email invalide';
      if (field.errors['minlength']) return `${fieldName} trop court`;
      if (field.errors['min']) return 'Valeur trop petite';
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

  openViewModal(migrant: IMigrant): void {
    this.viewingMigrant = migrant;
  }

  closeViewModal(): void {
    this.viewingMigrant = null;
  }
}

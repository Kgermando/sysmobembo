import { Component, OnInit, OnDestroy, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { Sort } from '@angular/material/sort';
import { PageEvent } from '@angular/material/paginator';
import { Subject, firstValueFrom, takeUntil, Observable, debounceTime, distinctUntilChanged } from 'rxjs';
import { IMigrant } from '../../shared/models/migrant.model';
import { MigrantService, IMigrantFormData, IBackendPaginationResponse } from '../../core/migration/migrant.service';
import { NATIONALITES, PAYS_ORIGINE_COMMUNS } from '../../shared/utils';
import { IMotifDeplacement } from '../../shared/models/motif-deplacement.model';
import { MotifDeplacementService } from '../../core/migration/motif-deplacement.service';
import { ProvinceList } from '../../utils/province-list';
import { OcrService, OCRProgress, ParsedDocumentData } from '../../core/services/ocr.service';
import { IIdentite } from '../../shared/models/identite.model';
import { IdentiteService } from '../../core/migration/identite.service';

@Component({
  selector: 'app-migrants',
  standalone: false,
  templateUrl: './migrants.component.html',
  styleUrl: './migrants.component.scss'
})
export class MigrantsComponent implements OnInit, OnDestroy, AfterViewInit {
  private destroy$ = new Subject<void>();

  // ViewChild pour gérer le scroll horizontal
  @ViewChild('tableScrollWrapper', { static: false }) tableScrollWrapper!: ElementRef;
  @ViewChild('fileInput', { static: false }) fileInput!: ElementRef;

  // Math reference for template
  Math = Math;

  // Bootstrap Modal instance
  private migrantModal: any = null;

  // OCR Properties
  selectedImageFile: File | null = null;
  selectedImagePreview: string | null = null;
  isProcessingOCR = false;
  ocrProgress$!: Observable<OCRProgress>;
  extractedText: string | null = null;
  ocrSuccessMessage: string | null = null;
  ocrErrorMessage: string | null = null;

  // Angular Material Table
  dataSource = new MatTableDataSource<IMigrant>();
  displayedColumns: string[] = [
    'nom', 'sexe', 'nationalite', 'numero_identifiant', 
    'statut_migratoire', 'pays_origine', 'date_naissance', 'actif', 'actions'
  ];

  // Data
  migrants: IMigrant[] = [];
  dataList: IMigrant[] = [];
  migrantStats: any = null;

  // Motifs de déplacement data
  motifsByMigrant: { [migrantUuid: string]: IMotifDeplacement[] } = {};
  selectedMigrantForMotifs: IMigrant | null = null;
  viewingMotifs: IMotifDeplacement[] = [];
  
  // Pagination pour les motifs
  motifsPagination = {
    total_records: 0,
    page_size: 5,
    current_page: 1
  };

  // Form
  migrantForm: FormGroup;
  editingMigrant: IMigrant | null = null;
  viewingMigrant: IMigrant | null = null;
  
  // Identités
  identites: IIdentite[] = [];
  filteredIdentites: IIdentite[] = [];
  identiteSearchTerm = '';
  isLoadingIdentites = false;

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

  // Filters - Updated to match backend (backend filters on Migrant fields + Identite via JOIN)
  searchTerm = ''; // Recherche globale (backend recherche sur nom, prenom, numero_identifiant, nationalite, numero_document)
  selectedNationalite = '';
  selectedStatutMigratoire = '';
  selectedGenre = '';
  selectedActif = '';
  selectedPaysOrigine = '';
  selectedTypeDocument = '';
  dateCreationDebut = '';
  dateCreationFin = '';
  dateNaissanceDebut = '';
  dateNaissanceFin = '';

  // Filter expand state
  filtersExpanded = false;

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

  // Getter pour les nationalités (utilise l'utilitaire)
  get nationaliteOptions(): string[] {
    return NATIONALITES;
  }

  // Getter pour les provinces de la RDC
  get provincesRdcOptions(): string[] {
    return ProvinceList;
  }

  constructor(
    private fb: FormBuilder,
    private migrantService: MigrantService,
    private motifDeplacementService: MotifDeplacementService,
    private ocrService: OcrService,
    private identiteService: IdentiteService
  ) {
    this.migrantForm = this.createForm();
    this.ocrProgress$ = this.ocrService.progress$;
  }

  ngOnInit(): void {
    this.loadData();
    this.loadStats();
    this.loadIdentites();
    // loadNationalityStats() removed as it's now included in getMigrantsStats()
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    // Terminate OCR worker
    this.ocrService.terminateWorker();
    // Clean up modal if still open
    if (this.migrantModal) {
      this.migrantModal.dispose();
    }
    // Remove any remaining backdrops
    const backdrops = document.querySelectorAll('.modal-backdrop');
    backdrops.forEach(backdrop => backdrop.remove());
    document.body.classList.remove('modal-open');
    document.body.style.removeProperty('overflow');
    document.body.style.removeProperty('padding-right');
  }

  ngAfterViewInit(): void {
    // Configuration du scroll horizontal après que la vue soit initialisée
    setTimeout(() => {
      this.setupHorizontalScroll();
    }, 100);
  }

  private setupHorizontalScroll(): void {
    if (this.tableScrollWrapper?.nativeElement) {
      const scrollElement = this.tableScrollWrapper.nativeElement;
      const tableContainer = scrollElement.closest('.table-container');
      
      // Gérer les événements de scroll
      scrollElement.addEventListener('scroll', () => {
        this.updateScrollIndicators(scrollElement, tableContainer);
      });
      
      // Initialiser les indicateurs
      this.updateScrollIndicators(scrollElement, tableContainer);
      
      // Ajouter des boutons de navigation (optionnel)
      this.addScrollButtons(tableContainer, scrollElement);
    }
  }

  private updateScrollIndicators(scrollElement: HTMLElement, container: HTMLElement): void {
    if (!scrollElement || !container) return;
    
    const { scrollLeft, scrollWidth, clientWidth } = scrollElement;
    const maxScrollLeft = scrollWidth - clientWidth;
    
    // Ajouter/supprimer les classes pour les indicateurs
    if (scrollLeft > 0) {
      container.classList.add('scrolled-left');
    } else {
      container.classList.remove('scrolled-left');
    }
    
    if (scrollLeft >= maxScrollLeft - 1) {
      container.classList.add('scrolled-right');
    } else {
      container.classList.remove('scrolled-right');
    }
  }

  private addScrollButtons(container: HTMLElement, scrollElement: HTMLElement): void {
    // Créer le bouton de scroll gauche
    const leftButton = document.createElement('button');
    leftButton.innerHTML = '<i class="ti ti-chevron-left"></i>';
    leftButton.className = 'btn btn-sm btn-primary scroll-button scroll-left';
    leftButton.style.cssText = `
      position: absolute;
      left: 10px;
      top: 50%;
      transform: translateY(-50%);
      z-index: 30;
      border-radius: 50%;
      width: 36px;
      height: 36px;
      display: none;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    `;
    
    // Créer le bouton de scroll droite
    const rightButton = document.createElement('button');
    rightButton.innerHTML = '<i class="ti ti-chevron-right"></i>';
    rightButton.className = 'btn btn-sm btn-primary scroll-button scroll-right';
    rightButton.style.cssText = `
      position: absolute;
      right: 10px;
      top: 50%;
      transform: translateY(-50%);
      z-index: 30;
      border-radius: 50%;
      width: 36px;
      height: 36px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    `;
    
    // Ajouter les événements de clic
    leftButton.addEventListener('click', () => {
      scrollElement.scrollBy({ left: -200, behavior: 'smooth' });
    });
    
    rightButton.addEventListener('click', () => {
      scrollElement.scrollBy({ left: 200, behavior: 'smooth' });
    });
    
    // Ajouter les boutons au container
    container.style.position = 'relative';
    container.appendChild(leftButton);
    container.appendChild(rightButton);
    
    // Mettre à jour la visibilité des boutons lors du scroll
    const updateButtonVisibility = () => {
      const { scrollLeft, scrollWidth, clientWidth } = scrollElement;
      const maxScrollLeft = scrollWidth - clientWidth;
      
      leftButton.style.display = scrollLeft > 0 ? 'flex' : 'none';
      rightButton.style.display = scrollLeft < maxScrollLeft - 1 ? 'flex' : 'none';
    };
    
    scrollElement.addEventListener('scroll', updateButtonVisibility);
    updateButtonVisibility();
  }

  private createForm(): FormGroup {
    return this.fb.group({
      // Relation avec Identite (doit être créée/sélectionnée séparément)
      identite_uuid: ['', Validators.required],
      
      // Informations de contact
      telephone: [''],
      email: ['', Validators.email],
      adresse_actuelle: [''],
      ville_actuelle: [''],
      pays_actuel: [''],
      
      // Informations familiales
      situation_matrimoniale: [''],
      nombre_enfants: [0, [Validators.min(0)]],
      personne_contact: [''],
      telephone_contact: [''],
      
      // Statut migration
      statut_migratoire: ['', Validators.required],
      date_entree: [''],
      point_entree: [''],
      pays_destination: [''],
      
      // Métadonnées
      actif: [true]
      // Note: numero_identifiant is auto-generated by backend
      // Note: Les champs nom, prenom, date_naissance, etc. sont maintenant dans Identite
    });
  }

  async loadData(): Promise<void> {
    this.isLoadingData = true;
    this.error = null;

    try {
      // Build filters object - aligned with backend support
      const filters: any = {};
      if (this.searchTerm) filters.search = this.searchTerm;
      if (this.selectedNationalite) filters.nationalite = this.selectedNationalite;
      if (this.selectedStatutMigratoire) filters.statut_migratoire = this.selectedStatutMigratoire;
      if (this.selectedGenre) filters.sexe = this.selectedGenre;
      if (this.selectedActif) filters.actif = this.selectedActif;
      if (this.selectedPaysOrigine) filters.pays_origine = this.selectedPaysOrigine;
      if (this.selectedTypeDocument) filters.type_document = this.selectedTypeDocument;
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
        
        // Reconfigurer le scroll horizontal après le chargement des données
        setTimeout(() => {
          this.setupHorizontalScroll();
        }, 100);
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
      const formData: any = this.migrantForm.value;

      // Convertir tous les champs de date de string (input HTML) vers string (format API)
      const migrantData: IMigrantFormData = {
        identite_uuid: formData.identite_uuid,
        telephone: formData.telephone || undefined,
        email: formData.email || undefined,
        adresse_actuelle: formData.adresse_actuelle || undefined,
        ville_actuelle: formData.ville_actuelle || undefined,
        pays_actuel: formData.pays_actuel || undefined,
        situation_matrimoniale: formData.situation_matrimoniale || undefined,
        nombre_enfants: formData.nombre_enfants || undefined,
        personne_contact: formData.personne_contact || undefined,
        telephone_contact: formData.telephone_contact || undefined,
        statut_migratoire: formData.statut_migratoire,
        date_entree: formData.date_entree ? new Date(formData.date_entree).toISOString() : undefined,
        point_entree: formData.point_entree || undefined,
        pays_destination: formData.pays_destination || undefined,
        actif: formData.actif !== undefined ? formData.actif : true
      };

      console.log('Données du formulaire à envoyer:', migrantData);

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
      // Gestion détaillée des erreurs HTTP
      if (error.error) {
        // Erreur structurée du backend
        this.error = error.error.message || error.error.error || 'Erreur lors de l\'enregistrement';
      } else if (error.message) {
        // Erreur HTTP générique
        this.error = error.message;
      } else {
        // Erreur inconnue
        this.error = 'Erreur lors de l\'enregistrement';
      }
      
      console.error('Erreur lors de l\'enregistrement du migrant:', error);
      console.error('Détails de l\'erreur:', {
        status: error.status,
        statusText: error.statusText,
        errorBody: error.error,
        url: error.url
      });
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
      // Relation avec Identite
      identite_uuid: migrant.identite_uuid,
      
      // Informations de contact
      telephone: migrant.telephone,
      email: migrant.email,
      adresse_actuelle: migrant.adresse_actuelle,
      ville_actuelle: migrant.ville_actuelle,
      pays_actuel: migrant.pays_actuel,
      
      // Informations familiales
      situation_matrimoniale: migrant.situation_matrimoniale,
      nombre_enfants: migrant.nombre_enfants,
      personne_contact: migrant.personne_contact,
      telephone_contact: migrant.telephone_contact,
      
      // Statut migration
      statut_migratoire: migrant.statut_migratoire,
      date_entree: migrant.date_entree ? this.formatDateForInput(migrant.date_entree) : '',
      point_entree: migrant.point_entree,
      pays_destination: migrant.pays_destination,
      
      // Métadonnées
      actif: migrant.actif
    });
    
    // Note: Les informations d'identité (nom, prenom, etc.) sont maintenant affichées
    // en lecture seule depuis migrant.identite et ne peuvent être modifiées ici
  }

  // Méthode utilitaire pour formater les dates pour les inputs HTML (format YYYY-MM-DD)
  private formatDateForInput(date: Date | string): string {
    if (!date) return '';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toISOString().split('T')[0];
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

  // Search functionality - uses general search parameter
  // The backend search filters across multiple fields: nom, prenom, numero_identifiant, nationalite, numero_document

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
    this.selectedPaysOrigine = '';
    this.selectedTypeDocument = '';
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

  toggleFilters(): void {
    this.filtersExpanded = !this.filtersExpanded;
    
    // Update button text and icon
    setTimeout(() => {
      const button = document.querySelector('[data-bs-target="#filtersCollapse"]');
      const icon = button?.querySelector('i');
      const text = button?.querySelector('.filter-toggle-text');
      
      if (this.filtersExpanded) {
        icon?.classList.remove('ti-chevron-down');
        icon?.classList.add('ti-chevron-up');
        if (text) text.textContent = 'Masquer les filtres';
      } else {
        icon?.classList.remove('ti-chevron-up');
        icon?.classList.add('ti-chevron-down');
        if (text) text.textContent = 'Afficher les filtres';
      }
    }, 10);
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
    const nom = migrant.identite?.nom || 'M';
    const prenom = migrant.identite?.prenom || 'M';
    return `${nom.charAt(0)}${prenom.charAt(0)}`.toUpperCase();
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
    const modalElement = document.getElementById('migrantModal');
    if (modalElement) {
      this.migrantModal = new (window as any).bootstrap.Modal(modalElement);
      this.migrantModal.show();
    }
  }

  openEditOffcanvas(): void {
    const modalElement = document.getElementById('migrantModal');
    if (modalElement) {
      this.migrantModal = new (window as any).bootstrap.Modal(modalElement);
      this.migrantModal.show();
    }
  }

  closeOffcanvas(): void {
    if (this.migrantModal) {
      this.migrantModal.hide();
      this.migrantModal = null;
    }
    // Supprimer manuellement les backdrops restants
    const backdrops = document.querySelectorAll('.modal-backdrop');
    backdrops.forEach(backdrop => backdrop.remove());
    // Retirer la classe modal-open du body
    document.body.classList.remove('modal-open');
    document.body.style.removeProperty('overflow');
    document.body.style.removeProperty('padding-right');
  }

  openViewModal(migrant: IMigrant): void {
    this.viewingMigrant = migrant;
  }

  closeViewModal(): void {
    this.viewingMigrant = null;
  }

  // ============================
  // MOTIFS DE DÉPLACEMENT METHODS
  // ============================

  async openMotifsModal(migrant: IMigrant): Promise<void> {
    this.selectedMigrantForMotifs = migrant;
    this.motifsPagination.current_page = 1;
    await this.loadMotifsByMigrant(migrant.uuid);
  }

  closeMotifsModal(): void {
    this.selectedMigrantForMotifs = null;
    this.viewingMotifs = [];
    this.motifsPagination = {
      total_records: 0,
      page_size: 5,
      current_page: 1
    };
  }

  async loadMotifsByMigrant(migrantUuid: string, search?: string): Promise<void> {
    try {
      const response = await firstValueFrom(
        this.motifDeplacementService.getMotifsByMigrant(
          migrantUuid,
          this.motifsPagination.current_page,
          this.motifsPagination.page_size,
          search
        ).pipe(takeUntil(this.destroy$))
      );

      if (response.status === 'success') {
        this.viewingMotifs = response.data;
        this.motifsPagination.total_records = response.pagination.total_records;
        
        // Cache the data for the migrant
        this.motifsByMigrant[migrantUuid] = response.data;
      }
    } catch (error: any) {
      console.error('Erreur lors du chargement des motifs:', error);
      this.viewingMotifs = [];
    }
  }

  onMotifsPageChange(event: PageEvent): void {
    this.motifsPagination.current_page = event.pageIndex + 1;
    this.motifsPagination.page_size = event.pageSize;
    
    if (this.selectedMigrantForMotifs) {
      this.loadMotifsByMigrant(this.selectedMigrantForMotifs.uuid);
    }
  }

  // UI Helpers for Motifs
  getTypeMotifLabel(typeMotif: string): string {
    const typeMotifOptions = [
      { value: 'economique', label: 'Économique' },
      { value: 'politique', label: 'Politique' },
      { value: 'persecution', label: 'Persécution' },
      { value: 'naturelle', label: 'Catastrophe naturelle' },
      { value: 'familial', label: 'Familial' },
      { value: 'education', label: 'Éducation' },
      { value: 'sanitaire', label: 'Sanitaire' }
    ];
    
    const option = typeMotifOptions.find(opt => opt.value === typeMotif);
    return option ? option.label : typeMotif;
  }

  getUrgenceLabel(urgence: string): string {
    const urgenceOptions = [
      { value: 'faible', label: 'Faible' },
      { value: 'moyenne', label: 'Moyenne' },
      { value: 'elevee', label: 'Élevée' },
      { value: 'critique', label: 'Critique' }
    ];
    
    const option = urgenceOptions.find(opt => opt.value === urgence);
    return option ? option.label : urgence;
  }

  getUrgenceBadgeClass(urgence: string): string {
    switch (urgence) {
      case 'critique': return 'badge-danger';
      case 'elevee': return 'badge-warning';
      case 'moyenne': return 'badge-info';
      case 'faible': return 'badge-secondary';
      default: return 'badge-light';
    }
  }

  getCaractereVolontaireLabel(volontaire: boolean): string {
    return volontaire ? 'Volontaire' : 'Involontaire';
  }

  getCaractereBadgeClass(volontaire: boolean): string {
    return volontaire ? 'badge-success' : 'badge-danger';
  }

  getFacteursExternes(motif: IMotifDeplacement): string[] {
    const facteurs: string[] = [];
    if (motif.conflit_arme) facteurs.push('Conflit armé');
    if (motif.catastrophe_naturelle) facteurs.push('Catastrophe naturelle');
    if (motif.persecution) facteurs.push('Persécution');
    if (motif.violence_generalisee) facteurs.push('Violence généralisée');
    return facteurs;
  }

  getMotifsCount(migrantUuid: string): number {
    return this.motifsByMigrant[migrantUuid]?.length || 0;
  }

  async preloadMotifsForMigrant(migrantUuid: string): Promise<void> {
    if (!this.motifsByMigrant[migrantUuid]) {
      try {
        const response = await firstValueFrom(
          this.motifDeplacementService.getMotifsByMigrant(migrantUuid, 1, 5)
            .pipe(takeUntil(this.destroy$))
        );

        if (response.status === 'success') {
          this.motifsByMigrant[migrantUuid] = response.data;
        }
      } catch (error) {
        console.error('Erreur lors du préchargement des motifs:', error);
      }
    }
  }

  // ============================
  // EXPORT FUNCTIONALITY
  // ============================

  // Export to Excel
  exportToExcel(): void {
    this.isLoading = true;
    this.error = null;

    // Préparer les filtres pour l'export (alignés avec le backend)
    const exportFilters: {
      nom?: string;
      prenom?: string;
      nationalite?: string;
      statut_migratoire?: string;
      pays_origine?: string;
      sexe?: string;
      actif?: string;
    } = {};
    
    // Le backend applique les filtres via JOIN sur Identite
    if (this.searchTerm) {
      exportFilters.nom = this.searchTerm;
      exportFilters.prenom = this.searchTerm;
    }
    if (this.selectedNationalite) exportFilters.nationalite = this.selectedNationalite;
    if (this.selectedStatutMigratoire) exportFilters.statut_migratoire = this.selectedStatutMigratoire;
    if (this.selectedPaysOrigine) exportFilters.pays_origine = this.selectedPaysOrigine;
    if (this.selectedGenre) exportFilters.sexe = this.selectedGenre;
    if (this.selectedActif) exportFilters.actif = this.selectedActif;

    // Afficher un message d'information pendant l'export
    console.log('Début de l\'export Excel des migrants...');

    this.migrantService.exportMigrantsToExcel(exportFilters).subscribe({
      next: (blob: Blob) => {
        try {
          // Créer un lien de téléchargement pour le fichier Excel
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          
          // Générer un nom de fichier avec timestamp
          const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
          link.download = `migrants-export-${timestamp}.xlsx`;
          
          // Déclencher le téléchargement
          document.body.appendChild(link);
          link.click();
          
          // Nettoyer
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
          
          this.isLoading = false;
          console.log('Export Excel terminé avec succès');
          
        } catch (downloadError) {
          console.error('Erreur lors du téléchargement:', downloadError);
          this.error = 'Erreur lors du téléchargement du fichier Excel';
          this.isLoading = false;
        }
      },
      error: (error) => {
        console.error('Erreur lors de l\'export Excel:', error);
        let errorMessage = 'Erreur lors de l\'export Excel. Veuillez réessayer.';
        
        if (error.status === 404) {
          errorMessage = 'Service d\'export non disponible. Contactez l\'administrateur.';
        } else if (error.status === 500) {
          errorMessage = 'Erreur serveur lors de l\'export. Veuillez réessayer plus tard.';
        } else if (error.status === 0) {
          errorMessage = 'Erreur de connexion. Vérifiez votre connexion internet.';
        }
        
        this.error = errorMessage;
        this.isLoading = false;
      }
    });
  }

  // TrackBy function for performance optimization
  trackByMotifUuid(index: number, motif: IMotifDeplacement): string {
    return motif.uuid;
  }

  // ============================
  // OCR METHODS
  // ============================

  /**
   * Gère la sélection du fichier image
   */
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      
      // Vérifier le type de fichier
      if (!file.type.startsWith('image/')) {
        this.ocrErrorMessage = 'Veuillez sélectionner un fichier image valide.';
        return;
      }

      this.selectedImageFile = file;
      
      // Créer un aperçu de l'image
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        this.selectedImagePreview = e.target?.result as string;
      };
      reader.readAsDataURL(file);

      // Lancer automatiquement l'OCR
      this.processOCR();
    }
  }

  /**
   * Traite l'image avec OCR
   */
  async processOCR(): Promise<void> {
    if (!this.selectedImageFile) {
      this.ocrErrorMessage = 'Aucune image sélectionnée.';
      return;
    }

    this.isProcessingOCR = true;
    this.ocrErrorMessage = null;
    this.ocrSuccessMessage = null;
    this.extractedText = null;
    this.ocrService.resetProgress();

    try {
      // Extraire le texte de l'image
      const result = await this.ocrService.extractTextFromImage(this.selectedImageFile);
      
      this.extractedText = result.text;

      // Parser le texte pour extraire les données structurées
      const parsedData: ParsedDocumentData = this.ocrService.parseDocumentText(result.text);

      // Remplir le formulaire avec les données extraites
      this.autoFillForm(parsedData);

      this.ocrSuccessMessage = `Document scanné avec succès! Confiance: ${Math.round(result.confidence)}%`;
      
      // Afficher un résumé des champs remplis
      const filledFields = Object.keys(parsedData).length;
      if (filledFields > 0) {
        this.ocrSuccessMessage += ` - ${filledFields} champ(s) détecté(s) et rempli(s) automatiquement.`;
      } else {
        this.ocrSuccessMessage += ' Aucun champ n\'a pu être rempli automatiquement. Vérifiez la qualité de l\'image.';
      }

    } catch (error) {
      console.error('Erreur OCR:', error);
      this.ocrErrorMessage = 'Erreur lors de l\'analyse de l\'image. Veuillez réessayer avec une image de meilleure qualité.';
    } finally {
      this.isProcessingOCR = false;
    }
  }

  /**
   * Remplit automatiquement le formulaire avec les données extraites
   */
  autoFillForm(data: ParsedDocumentData): void {
    const fieldsToUpdate: any = {};

    // Remplir uniquement les champs vides ou si la valeur extraite est plus complète
    if (data.nom && !this.migrantForm.get('nom')?.value) {
      fieldsToUpdate.nom = data.nom;
    }

    if (data.prenom && !this.migrantForm.get('prenom')?.value) {
      fieldsToUpdate.prenom = data.prenom;
    }

    if (data.date_naissance && !this.migrantForm.get('date_naissance')?.value) {
      fieldsToUpdate.date_naissance = data.date_naissance;
    }

    if (data.lieu_naissance && !this.migrantForm.get('lieu_naissance')?.value) {
      // Vérifier si c'est une province valide
      const provinceMatch = this.provincesRdcOptions.find(
        p => p.toLowerCase() === data.lieu_naissance?.toLowerCase()
      );
      if (provinceMatch) {
        fieldsToUpdate.lieu_naissance = provinceMatch;
      } else {
        fieldsToUpdate.lieu_naissance = data.lieu_naissance;
      }
    }

    if (data.sexe && !this.migrantForm.get('sexe')?.value) {
      fieldsToUpdate.sexe = data.sexe;
    }

    if (data.nationalite && !this.migrantForm.get('nationalite')?.value) {
      // Vérifier si c'est une nationalité valide
      const nationaliteMatch = this.nationaliteOptions.find(
        n => n.toLowerCase().includes(data.nationalite!.toLowerCase())
      );
      if (nationaliteMatch) {
        fieldsToUpdate.nationalite = nationaliteMatch;
      } else {
        fieldsToUpdate.nationalite = data.nationalite;
      }
    }

    if (data.type_document && !this.migrantForm.get('type_document')?.value) {
      fieldsToUpdate.type_document = data.type_document;
    }

    if (data.numero_document && !this.migrantForm.get('numero_document')?.value) {
      fieldsToUpdate.numero_document = data.numero_document;
    }

    if (data.date_emission_document && !this.migrantForm.get('date_emission_document')?.value) {
      fieldsToUpdate.date_emission_document = data.date_emission_document;
    }

    if (data.date_expiration_document && !this.migrantForm.get('date_expiration_document')?.value) {
      fieldsToUpdate.date_expiration_document = data.date_expiration_document;
    }

    if (data.telephone && !this.migrantForm.get('telephone')?.value) {
      fieldsToUpdate.telephone = data.telephone;
    }

    if (data.email && !this.migrantForm.get('email')?.value) {
      fieldsToUpdate.email = data.email;
    }

    if (data.adresse_actuelle && !this.migrantForm.get('adresse_actuelle')?.value) {
      fieldsToUpdate.adresse_actuelle = data.adresse_actuelle;
    }

    // Appliquer les mises à jour au formulaire
    if (Object.keys(fieldsToUpdate).length > 0) {
      this.migrantForm.patchValue(fieldsToUpdate);
      
      // Marquer les champs comme "touched" pour afficher les validations
      Object.keys(fieldsToUpdate).forEach(key => {
        this.migrantForm.get(key)?.markAsTouched();
      });
    }
  }

  /**
   * Efface l'image sélectionnée
   */
  clearImage(): void {
    this.selectedImageFile = null;
    this.selectedImagePreview = null;
    this.extractedText = null;
    this.ocrSuccessMessage = null;
    this.ocrErrorMessage = null;
    this.ocrService.resetProgress();
    
    // Réinitialiser l'input file
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }

  // ===== GESTION DES IDENTITÉS =====
  
  /**
   * Charge la liste des identités disponibles
   */
  async loadIdentites(): Promise<void> {
    this.isLoadingIdentites = true;
    try {
      const response = await firstValueFrom(
        this.identiteService.getPaginatedIdentites(1, 100)
          .pipe(takeUntil(this.destroy$))
      );
      
      if (response.status === 'success') {
        this.identites = response.data.identites;
        this.filteredIdentites = this.identites;
      }
    } catch (error: any) {
      console.error('Erreur lors du chargement des identités:', error);
    } finally {
      this.isLoadingIdentites = false;
    }
  }

  /**
   * Filtre les identités selon le terme de recherche
   */
  filterIdentites(searchTerm: string): void {
    if (!searchTerm) {
      this.filteredIdentites = this.identites;
      return;
    }

    const term = searchTerm.toLowerCase();
    this.filteredIdentites = this.identites.filter(identite =>
      identite.nom.toLowerCase().includes(term) ||
      identite.prenom.toLowerCase().includes(term) ||
      identite.numero_passeport.toLowerCase().includes(term) ||
      identite.nationalite.toLowerCase().includes(term)
    );
  }

  /**
   * Obtient le libellé d'affichage pour une identité
   */
  getIdentiteDisplayName(identite: IIdentite): string {
    return `${identite.nom} ${identite.prenom} - ${identite.numero_passeport} (${identite.nationalite})`;
  }
}

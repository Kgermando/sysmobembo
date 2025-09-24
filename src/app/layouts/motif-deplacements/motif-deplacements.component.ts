import { Component, OnInit, OnDestroy, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { Sort } from '@angular/material/sort';
import { PageEvent } from '@angular/material/paginator';
import { Subject, firstValueFrom, takeUntil } from 'rxjs';
import { IMotifDeplacement, IMotifDeplacementFormData, IMotifDeplacementStats } from '../../shared/models/motif-deplacement.model';
import { MotifDeplacementService } from '../../core/migration/motif-deplacement.service';
import { MigrantService } from '../../core/migration/migrant.service';
import { IMigrant } from '../../shared/models/migrant.model';
import { DateUtils } from '../../shared/utils/date.utils';

@Component({
  selector: 'app-motif-deplacements',
  standalone: false,
  templateUrl: './motif-deplacements.component.html',
  styleUrl: './motif-deplacements.component.scss'
})
export class MotifDeplacementsComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('searchInput') searchInputRef!: ElementRef;

  // Table configuration
  displayedColumns: string[] = [
    'migrant',
    'type_motif',
    'motif_principal',
    'caractere_volontaire',
    'urgence',
    'date_declenchement',
    'facteurs_externes',
    'actions'
  ];

  dataSource = new MatTableDataSource<IMotifDeplacement>([]);
  destroy$ = new Subject<void>();

  // Forms
  motifForm!: FormGroup;
  filterForm!: FormGroup;
  editingMotif: IMotifDeplacement | null = null;
  viewingMotif: IMotifDeplacement | null = null;

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
  searchTerm = '';
  selectedMigrant = '';

  // Options
  typeMotifOptions = [
    { value: 'economique', label: 'Économique' },
    { value: 'politique', label: 'Politique' },
    { value: 'persecution', label: 'Persécution' },
    { value: 'naturelle', label: 'Catastrophe naturelle' },
    { value: 'familial', label: 'Familial' },
    { value: 'education', label: 'Éducation' },
    { value: 'sanitaire', label: 'Sanitaire' }
  ];

  urgenceOptions = [
    { value: 'faible', label: 'Faible' },
    { value: 'moyenne', label: 'Moyenne' },
    { value: 'elevee', label: 'Élevée' },
    { value: 'critique', label: 'Critique' }
  ];

  // Data
  motifs: IMotifDeplacement[] = [];
  migrants: IMigrant[] = [];
  motifStats: IMotifDeplacementStats | null = null;

  constructor(
    private fb: FormBuilder,
    private motifDeplacementService: MotifDeplacementService,
    private migrantService: MigrantService
  ) {
    this.initializeForms();
  }

  ngOnInit(): void {
    this.loadData();
    this.loadMigrants();
    this.loadStats();
  }

  ngAfterViewInit(): void {
    if (this.searchInputRef) {
      this.searchInputRef.nativeElement.focus();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  initializeForms(): void {
    this.motifForm = this.fb.group({
      migrant_uuid: ['', [Validators.required]],
      type_motif: ['', [Validators.required]],
      motif_principal: ['', [Validators.required, Validators.minLength(3)]],
      motif_secondaire: [''],
      description: [''],
      caractere_volontaire: [true],
      urgence: [''],
      date_declenchement: ['', [Validators.required]],
      duree_estimee: [null, [Validators.min(1)]],
      conflit_arme: [false],
      catastrophe_naturelle: [false],
      persecution: [false],
      violence_generalisee: [false]
    });

    this.filterForm = this.fb.group({
      search: [''],
      migrant_uuid: ['']
    });
  }

  async loadData(): Promise<void> {
    this.isLoadingData = true;
    this.error = null;

    try {
      const filters = {
        search: this.searchTerm || undefined,
        migrant_uuid: this.selectedMigrant || undefined
      };

      const response = await firstValueFrom(
        this.motifDeplacementService.getPaginatedMotifDeplacements(
          this.current_page,
          this.page_size,
          filters
        ).pipe(takeUntil(this.destroy$))
      );

      if (response.status === 'success') {
        this.motifs = response.data;
        this.dataSource.data = this.motifs;
        this.total_records = response.pagination.total_records;
      }
    } catch (error: any) {
      this.error = error.error?.message || 'Erreur lors du chargement des motifs';
      console.error('Erreur lors du chargement des motifs:', error);
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
        this.migrants = response.data;
      }
    } catch (error: any) {
      console.error('Erreur lors du chargement des migrants:', error);
    }
  }

  async loadStats(): Promise<void> {
    try {
      const response = await firstValueFrom(
        this.motifDeplacementService.getMotifsStats().pipe(takeUntil(this.destroy$))
      );

      if (response.status === 'success') {
        this.motifStats = response.data;
      }
    } catch (error: any) {
      console.error('Erreur lors du chargement des statistiques:', error);
    }
  }

  async onSubmit(): Promise<void> {
    if (this.motifForm.invalid || this.isSaving) return;

    this.isSaving = true;
    this.error = null;

    try {
      const formData = this.motifForm.value;

      // Nettoyer et valider les données avant envoi
      const motifData: IMotifDeplacementFormData = {
        migrant_uuid: formData.migrant_uuid?.trim() || '',
        type_motif: formData.type_motif?.trim() || '',
        motif_principal: formData.motif_principal?.trim() || '',
        motif_secondaire: formData.motif_secondaire?.trim() || undefined,
        description: formData.description?.trim() || undefined,
        caractere_volontaire: Boolean(formData.caractere_volontaire),
        urgence: formData.urgence?.trim() || undefined,
        date_declenchement: this.parseFormDate(formData.date_declenchement),
        duree_estimee: this.parseFormNumber(formData.duree_estimee),
        conflit_arme: Boolean(formData.conflit_arme),
        catastrophe_naturelle: Boolean(formData.catastrophe_naturelle),
        persecution: Boolean(formData.persecution),
        violence_generalisee: Boolean(formData.violence_generalisee)
      };

      // Validation supplémentaire
      if (!motifData.migrant_uuid) {
        this.error = 'Le migrant est requis';
        return;
      }

      if (!motifData.type_motif) {
        this.error = 'Le type de motif est requis';
        return;
      }

      if (!motifData.motif_principal) {
        this.error = 'Le motif principal est requis';
        return;
      }

      // Nettoyer les champs undefined pour éviter les erreurs de sérialisation
      const cleanedData = Object.fromEntries(
        Object.entries(motifData).filter(([_, value]) => value !== undefined)
      ) as IMotifDeplacementFormData;

      let response;
      if (this.editingMotif) {
        response = await firstValueFrom(
          this.motifDeplacementService.updateMotifDeplacement(this.editingMotif.uuid, cleanedData)
            .pipe(takeUntil(this.destroy$))
        );
      } else {
        response = await firstValueFrom(
          this.motifDeplacementService.createMotifDeplacement(cleanedData)
            .pipe(takeUntil(this.destroy$))
        );
      }

      if (response.status === 'success') {
        await this.loadData();
        await this.loadStats();
        this.resetForm();
        this.closeOffcanvas();
      }
    } catch (error: any) {
      const formData = this.motifForm.value;
      this.error = error.error?.message || error.message || 'Erreur lors de l\'enregistrement';
      console.error('Erreur lors de l\'enregistrement du motif:', error);
      console.error('Données du formulaire:', formData);
    } finally {
      this.isSaving = false;
    }
  }

  prepareNewMotif(): void {
    this.editingMotif = null;
    this.resetForm();
  }

  prepareEditMotif(motif: IMotifDeplacement): void {
    this.editingMotif = motif;
    
    // Préparer les données pour le formulaire
    const formData = {
      migrant_uuid: motif.migrant_uuid || '',
      type_motif: motif.type_motif || '',
      motif_principal: motif.motif_principal || '',
      motif_secondaire: motif.motif_secondaire || '',
      description: motif.description || '',
      caractere_volontaire: Boolean(motif.caractere_volontaire),
      urgence: motif.urgence || '',
      date_declenchement: this.formatDateForInput(motif.date_declenchement),
      duree_estimee: motif.duree_estimee || null,
      conflit_arme: Boolean(motif.conflit_arme),
      catastrophe_naturelle: Boolean(motif.catastrophe_naturelle),
      persecution: Boolean(motif.persecution),
      violence_generalisee: Boolean(motif.violence_generalisee)
    };

    this.motifForm.patchValue(formData);
  }

  private formatDateForInput(date: Date | string | undefined): string {
    if (!date) {
      return '';
    }
    
    try {
      return DateUtils.toInputFormat(date);
    } catch (error) {
      console.error('Erreur lors du formatage de la date:', error);
      return '';
    }
  }

  async deleteMotif(motif: IMotifDeplacement): Promise<void> {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce motif de déplacement ?')) {
      return;
    }

    try {
      const response = await firstValueFrom(
        this.motifDeplacementService.deleteMotifDeplacement(motif.uuid)
          .pipe(takeUntil(this.destroy$))
      );

      if (response.status === 'success') {
        await this.loadData();
        await this.loadStats();
      }
    } catch (error: any) {
      this.error = error.error?.message || 'Erreur lors de la suppression';
      console.error('Erreur lors de la suppression du motif:', error);
    }
  }

  resetForm(): void {
    this.motifForm.reset({
      migrant_uuid: '',
      type_motif: '',
      motif_principal: '',
      motif_secondaire: '',
      description: '',
      caractere_volontaire: true,
      urgence: '',
      date_declenchement: '',
      duree_estimee: null,
      conflit_arme: false,
      catastrophe_naturelle: false,
      persecution: false,
      violence_generalisee: false
    });
    this.editingMotif = null;
    this.error = null;
  }

  // Search and filters
  onSearchChange(searchTerm: string): void {
    this.searchTerm = searchTerm;
    this.current_page = 1;
    this.loadData();
  }

  applyFilters(): void {
    const formValue = this.filterForm.value;
    this.searchTerm = formValue.search || '';
    this.selectedMigrant = formValue.migrant_uuid || '';
    this.current_page = 1;
    this.loadData();
  }

  resetFilters(): void {
    this.filterForm.reset();
    this.searchTerm = '';
    this.selectedMigrant = '';
    this.current_page = 1;
    this.loadData();
  }

  // Pagination
  onPageChange(event: PageEvent): void {
    this.current_page = event.pageIndex + 1;
    this.page_size = event.pageSize;
    this.loadData();
  }
 
  // UI helpers
  getMigrantName(migrantUuid: string): string {
    const migrant = this.migrants.find(m => m.uuid === migrantUuid);
    return migrant ? `${migrant.nom} ${migrant.prenom}` : 'Inconnu';
  }

  getMigrantInitials(migrantUuid: string): string {
    const migrant = this.migrants.find(m => m.uuid === migrantUuid);
    if (!migrant) return 'IN';
    return `${migrant.nom.charAt(0)}${migrant.prenom.charAt(0)}`.toUpperCase();
  }

  getTypeMotifLabel(typeMotif: string): string {
    const option = this.typeMotifOptions.find(opt => opt.value === typeMotif);
    return option ? option.label : typeMotif;
  }

  getUrgenceLabel(urgence: string): string {
    const option = this.urgenceOptions.find(opt => opt.value === urgence);
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

  formatDate(date: Date | string | undefined): string {
    if (!date) return '-';
    return DateUtils.toDisplayFormat(date);
  }

  getFacteursExternes(motif: IMotifDeplacement): string[] {
    const facteurs: string[] = [];
    if (motif.conflit_arme) facteurs.push('Conflit armé');
    if (motif.catastrophe_naturelle) facteurs.push('Catastrophe naturelle');
    if (motif.persecution) facteurs.push('Persécution');
    if (motif.violence_generalisee) facteurs.push('Violence généralisée');
    return facteurs;
  }

  // Stats helpers
  getStatValue(statKey: string): number {
    return this.motifStats ? (this.motifStats as any)[statKey] || 0 : 0;
  }

  getFacteurExterneCount(facteur: string): number {
    return this.motifStats?.facteurs_externes ? (this.motifStats.facteurs_externes as any)[facteur] || 0 : 0;
  }

  // Form validation helpers
  isFieldInvalid(fieldName: string): boolean {
    const field = this.motifForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.motifForm.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) {
        switch(fieldName) {
          case 'migrant_uuid': return 'Le migrant est requis';
          case 'type_motif': return 'Le type de motif est requis';
          case 'motif_principal': return 'Le motif principal est requis';
          case 'date_declenchement': return 'La date de déclenchement est requise';
          default: return `${fieldName} est requis`;
        }
      }
      if (field.errors['min']) return 'La valeur doit être supérieure à 0';
      if (field.errors['minlength']) return 'Le motif doit contenir au moins 3 caractères';
    }
    return '';
  }

  // Data transformation helpers
  private parseFormDate(dateValue: any): Date {
    if (!dateValue) {
      return new Date(); // Date par défaut si vide
    }

    // Si c'est déjà une Date
    if (dateValue instanceof Date) {
      return dateValue;
    }

    // Si c'est une string au format YYYY-MM-DD (input date)
    if (typeof dateValue === 'string') {
      // Pour les inputs de type date, on obtient une string YYYY-MM-DD
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
        const date = new Date(dateValue + 'T00:00:00.000Z');
        return isNaN(date.getTime()) ? new Date() : date;
      }
      
      // Sinon, essayer de parser normalement
      const parsed = DateUtils.toDate(dateValue);
      return parsed || new Date();
    }

    return new Date();
  }

  private parseFormNumber(value: any): number | undefined {
    if (value === null || value === undefined || value === '') {
      return undefined;
    }

    const num = Number(value);
    if (isNaN(num) || num <= 0) {
      return undefined;
    }

    return Math.round(num); // S'assurer que c'est un entier
  }

  // Modal/Offcanvas controls
  openAddOffcanvas(): void {
    this.prepareNewMotif();
    const offcanvasElement = document.getElementById('motifOffcanvas');
    if (offcanvasElement) {
      const bsOffcanvas = new (window as any).bootstrap.Offcanvas(offcanvasElement);
      bsOffcanvas.show();
    }
  }

  openEditOffcanvas(motif: IMotifDeplacement): void {
    this.prepareEditMotif(motif);
    const offcanvasElement = document.getElementById('motifOffcanvas');
    if (offcanvasElement) {
      const bsOffcanvas = new (window as any).bootstrap.Offcanvas(offcanvasElement);
      bsOffcanvas.show();
    }
  }

  closeOffcanvas(): void {
    const offcanvasElement = document.getElementById('motifOffcanvas');
    if (offcanvasElement) {
      const bsOffcanvas = (window as any).bootstrap.Offcanvas.getInstance(offcanvasElement);
      if (bsOffcanvas) {
        bsOffcanvas.hide();
      }
    }
    this.resetForm();
  }

  openViewModal(motif: IMotifDeplacement): void {
    this.viewingMotif = motif;
  }

  closeViewModal(): void {
    this.viewingMotif = null;
  }
}

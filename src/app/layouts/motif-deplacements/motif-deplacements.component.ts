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
      migrant_uuid: ['', Validators.required],
      type_motif: ['', Validators.required],
      motif_principal: ['', Validators.required],
      motif_secondaire: [''],
      description: [''],
      caractere_volontaire: [true],
      urgence: [''],
      date_declenchement: ['', Validators.required],
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
      const formData: IMotifDeplacementFormData = this.motifForm.value;

      // Convertir les champs de date
      const motifData = {
        ...formData,
        date_declenchement: formData.date_declenchement ? new Date(formData.date_declenchement).toISOString() : ''
      };

      let response;
      if (this.editingMotif) {
        response = await firstValueFrom(
          this.motifDeplacementService.updateMotifDeplacement(this.editingMotif.uuid, motifData)
            .pipe(takeUntil(this.destroy$))
        );
      } else {
        response = await firstValueFrom(
          this.motifDeplacementService.createMotifDeplacement(motifData)
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
      this.error = error.error?.message || 'Erreur lors de l\'enregistrement';
      console.error('Erreur lors de l\'enregistrement du motif:', error);
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
    this.motifForm.patchValue({
      migrant_uuid: motif.migrant_uuid,
      type_motif: motif.type_motif,
      motif_principal: motif.motif_principal,
      motif_secondaire: motif.motif_secondaire,
      description: motif.description,
      caractere_volontaire: motif.caractere_volontaire,
      urgence: motif.urgence,
      date_declenchement: motif.date_declenchement ? motif.date_declenchement.split('T')[0] : '',
      duree_estimee: motif.duree_estimee,
      conflit_arme: motif.conflit_arme,
      catastrophe_naturelle: motif.catastrophe_naturelle,
      persecution: motif.persecution,
      violence_generalisee: motif.violence_generalisee
    });
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
      caractere_volontaire: true,
      conflit_arme: false,
      catastrophe_naturelle: false,
      persecution: false,
      violence_generalisee: false
    });
    this.editingMotif = null;
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

  // Sorting
  sortData(sort: Sort): void {
    // Implement sorting logic if needed
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

  formatDate(dateString: string | undefined): string {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('fr-FR');
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
      if (field.errors['required']) return `${fieldName} est requis`;
      if (field.errors['min']) return 'Valeur trop petite';
    }
    return '';
  }

  // Modal/Offcanvas controls
  openAddOffcanvas(): void {
    this.prepareNewMotif();
    // Implement offcanvas open logic
  }

  openEditOffcanvas(motif: IMotifDeplacement): void {
    this.prepareEditMotif(motif);
    // Implement offcanvas open logic
  }

  closeOffcanvas(): void {
    // Implement offcanvas close logic
  }

  openViewModal(motif: IMotifDeplacement): void {
    this.viewingMotif = motif;
  }

  closeViewModal(): void {
    this.viewingMotif = null;
  }
}

import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { Sort } from '@angular/material/sort';
import { PageEvent } from '@angular/material/paginator';
import { Subject, firstValueFrom, takeUntil } from 'rxjs';
import { IAlert, IMigrant, DateUtils } from '../../shared/models/migrant.model';
import { AlertService, IAlertFormData, IAlertFilters, IAlertStats } from '../../core/migration/alert.service';
import { MigrantService } from '../../core/migration/migrant.service';

@Component({
  selector: 'app-alerts',
  standalone: false,
  templateUrl: './alerts.component.html',
  styleUrls: ['./alerts.component.scss']
})
export class AlertsComponent implements OnInit, OnDestroy, AfterViewInit {
  private destroy$ = new Subject<void>();

  // Math reference for template
  Math = Math;

  // Angular Material Table
  dataSource = new MatTableDataSource<IAlert>();
  displayedColumns: string[] = [
    'migrant', 'type_alerte', 'niveau_gravite', 'titre', 
    'statut', 'date_expiration', 'personne_responsable', 'actions'
  ];

  // Data
  alerts: IAlert[] = [];
  migrants: IMigrant[] = [];
  alertStats: IAlertStats | null = null;

  // Form
  alertForm: FormGroup;
  editingAlert: IAlert | null = null;
  viewingAlert: IAlert | null = null;

  // States
  isLoading = false;
  isLoadingData = false;
  isSaving = false;
  error: string | null = null;

  // Pagination
  total_records = 0;
  page_size = 15;
  current_page = 1;

  // Filters and search
  searchTerm = '';
  selectedMigrant = '';
  selectedTypeAlerte = '';
  selectedNiveauGravite = '';
  selectedStatut = '';

  // Options
  typeAlerteOptions = [
    { value: 'securite', label: 'Sécurité', icon: 'ti-shield', color: 'danger' },
    { value: 'sante', label: 'Santé', icon: 'ti-heart', color: 'warning' },
    { value: 'juridique', label: 'Juridique', icon: 'ti-scale', color: 'info' },
    { value: 'administrative', label: 'Administrative', icon: 'ti-file-text', color: 'primary' },
    { value: 'humanitaire', label: 'Humanitaire', icon: 'ti-users', color: 'success' }
  ];

  niveauGraviteOptions = [
    { value: 'info', label: 'Information', color: 'info' },
    { value: 'warning', label: 'Attention', color: 'warning' },
    { value: 'danger', label: 'Danger', color: 'danger' },
    { value: 'critical', label: 'Critique', color: 'dark' }
  ];

  statutOptions = [
    { value: 'active', label: 'Active', color: 'success' },
    { value: 'resolved', label: 'Résolue', color: 'primary' },
    { value: 'dismissed', label: 'Ignorée', color: 'secondary' },
    { value: 'expired', label: 'Expirée', color: 'danger' }
  ];

  constructor(
    private fb: FormBuilder,
    private alertService: AlertService,
    private migrantService: MigrantService
  ) {
    this.alertForm = this.createForm();
  }

  ngOnInit(): void {
    this.loadData();
    this.loadMigrants();
    this.loadStats();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngAfterViewInit(): void {
    // Setup any additional UI interactions
  }

  private createForm(): FormGroup {
    return this.fb.group({
      migrant_uuid: ['', Validators.required],
      type_alerte: ['', Validators.required],
      niveau_gravite: ['', Validators.required],
      titre: ['', [Validators.required, Validators.minLength(5)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      date_expiration: [''],
      action_requise: [''],
      personne_responsable: ['']
    });
  }

  async loadData(): Promise<void> {
    this.isLoadingData = true;
    this.error = null;

    try {
      // Build filters object
      const filters: IAlertFilters = {};
      if (this.searchTerm) filters.search = this.searchTerm;
      if (this.selectedMigrant) filters.migrant_uuid = this.selectedMigrant;
      if (this.selectedStatut) filters.statut = this.selectedStatut;
      if (this.selectedNiveauGravite) filters.gravite = this.selectedNiveauGravite;

      const response = await firstValueFrom(
        this.alertService.getPaginatedAlerts(this.current_page, this.page_size, filters)
          .pipe(takeUntil(this.destroy$))
      );

      if (response.status === 'success') {
        this.alerts = response.data;
        this.dataSource.data = response.data;
        this.total_records = response.pagination.total_records;
      }
    } catch (error: any) {
      this.error = error.error?.message || 'Erreur lors du chargement des alertes';
      console.error('Erreur lors du chargement:', error);
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
        this.alertService.getAlertsStats().pipe(takeUntil(this.destroy$))
      );

      if (response.status === 'success') {
        this.alertStats = response.data;
      }
    } catch (error: any) {
      console.error('Erreur lors du chargement des statistiques:', error);
    }
  }

  async onSubmit(): Promise<void> {
    if (this.alertForm.invalid || this.isSaving) return;

    this.isSaving = true;
    this.error = null;

    try {
      const formData: IAlertFormData = this.alertForm.value;

      let response;
      if (this.editingAlert) {
        response = await firstValueFrom(
          this.alertService.updateAlert(this.editingAlert.uuid, formData)
            .pipe(takeUntil(this.destroy$))
        );
      } else {
        response = await firstValueFrom(
          this.alertService.createAlert(formData)
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
      console.error('Erreur lors de l\'enregistrement de l\'alerte:', error);
    } finally {
      this.isSaving = false;
    }
  }

  prepareNewAlert(): void {
    this.editingAlert = null;
    this.resetForm();
  }

  prepareEditAlert(alert: IAlert): void {
    this.editingAlert = alert;
    this.alertForm.patchValue({
      migrant_uuid: alert.migrant_uuid,
      type_alerte: alert.type_alerte,
      niveau_gravite: alert.niveau_gravite,
      titre: alert.titre,
      description: alert.description,
      date_expiration: DateUtils.toInputDate(alert.date_expiration),
      action_requise: alert.action_requise,
      personne_responsable: alert.personne_responsable
    });
  }

  async deleteAlert(alert: IAlert): Promise<void> {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette alerte ?')) return;

    try {
      const response = await firstValueFrom(
        this.alertService.deleteAlert(alert.uuid)
          .pipe(takeUntil(this.destroy$))
      );

      if (response.status === 'success') {
        await this.loadData();
        await this.loadStats();
      }
    } catch (error: any) {
      this.error = error.error?.message || 'Erreur lors de la suppression';
      console.error('Erreur lors de la suppression de l\'alerte:', error);
    }
  }

  async resolveAlert(alert: IAlert): Promise<void> {
    const commentaire = prompt('Commentaire de résolution:');
    if (commentaire === null) return;

    try {
      const response = await firstValueFrom(
        this.alertService.resolveAlert(alert.uuid, {
          commentaire_resolution: commentaire
        }).pipe(takeUntil(this.destroy$))
      );

      if (response.status === 'success') {
        await this.loadData();
        await this.loadStats();
      }
    } catch (error: any) {
      this.error = error.error?.message || 'Erreur lors de la résolution';
      console.error('Erreur lors de la résolution:', error);
    }
  }

  resetForm(): void {
    this.alertForm.reset();
    this.error = null;
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
    this.selectedMigrant = '';
    this.selectedTypeAlerte = '';
    this.selectedNiveauGravite = '';
    this.selectedStatut = '';
    this.searchTerm = '';
    this.current_page = 1;
    this.loadData();
  }

  // Pagination
  onPageChange(event: PageEvent): void {
    this.current_page = event.pageIndex + 1;
    this.page_size = event.pageSize;
    this.loadData();
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.getTotalPages()) {
      this.current_page = page;
      this.loadData();
    }
  }

  getTotalPages(): number {
    return Math.ceil(this.total_records / this.page_size);
  }

  getVisiblePages(): number[] {
    const totalPages = this.getTotalPages();
    const current = this.current_page;
    const delta = 2;
    const range = [];
    
    const rangeWithDots = [];
    let l;

    for (let i = Math.max(2, current - delta); 
         i <= Math.min(totalPages - 1, current + delta); 
         i++) {
      range.push(i);
    }

    if (current - delta > 2) {
      rangeWithDots.push(1, '...' as any);
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (current + delta < totalPages - 1) {
      rangeWithDots.push('...' as any, totalPages);
    } else {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots.filter((item, index, arr) => arr.indexOf(item) === index && item !== '...');
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

  getTypeAlerteInfo(type: string): any {
    return this.typeAlerteOptions.find(o => o.value === type) || { label: type, icon: 'ti-alert-circle', color: 'secondary' };
  }

  getNiveauGraviteInfo(niveau: string): any {
    return this.niveauGraviteOptions.find(o => o.value === niveau) || { label: niveau, color: 'secondary' };
  }

  getStatutInfo(statut: string): any {
    return this.statutOptions.find(o => o.value === statut) || { label: statut, color: 'secondary' };
  }

  getAlertBadgeClass(niveau: string): string {
    const info = this.getNiveauGraviteInfo(niveau);
    return `badge bg-${info.color}`;
  }

  getStatutBadgeClass(statut: string): string {
    const info = this.getStatutInfo(statut);
    return `badge bg-${info.color}`;
  }

  getTypeAlerteBadgeClass(type: string): string {
    const info = this.getTypeAlerteInfo(type);
    return `badge bg-${info.color}`;
  }

  isAlertExpired(alert: IAlert): boolean {
    if (!alert.date_expiration) return false;
    return new Date(alert.date_expiration) < new Date();
  }

  isAlertCritical(alert: IAlert): boolean {
    return alert.niveau_gravite === 'critical' || alert.niveau_gravite === 'danger';
  }

  formatDate(date: Date | string | undefined): string {
    return DateUtils.formatDate(date);
  }

  formatDateTime(date: Date | string | undefined): string {
    return DateUtils.formatDateTime(date);
  }

  // Form validation helpers
  isFieldInvalid(fieldName: string): boolean {
    const field = this.alertForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.alertForm.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) return `${fieldName} est requis`;
      if (field.errors['minlength']) return `${fieldName} trop court`;
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

  openViewModal(alert: IAlert): void {
    this.viewingAlert = alert;
  }

  closeViewModal(): void {
    this.viewingAlert = null;
  }

  // Stats helpers
  getStatValue(statKey: string): number {
    return this.alertStats ? (this.alertStats as any)[statKey] || 0 : 0;
  }

  // Quick filter buttons
  showActiveAlerts(): void {
    this.selectedStatut = 'active';
    this.current_page = 1;
    this.loadData();
  }

  showCriticalAlerts(): void {
    this.selectedNiveauGravite = 'critical';
    this.selectedStatut = 'active';
    this.current_page = 1;
    this.loadData();
  }

  showAllAlerts(): void {
    this.resetFilters();
  }

  // TrackBy function for performance optimization
  trackByAlertUuid(index: number, alert: IAlert): string {
    return alert.uuid;
  }
}

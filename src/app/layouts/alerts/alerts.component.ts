import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { Sort } from '@angular/material/sort';
import { PageEvent } from '@angular/material/paginator';
import { Subject, firstValueFrom, takeUntil } from 'rxjs';
import { IAlert } from '../models/alert.model';
import { IMigrant } from '../models/migrant.model';
import { DateUtils } from '../../shared/utils/date.utils';
import { AlertService, IAlertFormData, IAlertFilters, IAlertStats } from '../../core/migration/alert.service';
import { MigrantService } from '../../core/migration/migrant.service';
import { ToastrService } from 'ngx-toastr';

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
  startDate = '';
  endDate = '';

  // Export dialog state
  isExportDialogOpen = false;

  // Options with proper typing to match IAlert interface
  typeAlerteOptions: Array<{
    value: 'securite' | 'sante' | 'juridique' | 'administrative' | 'humanitaire';
    label: string;
    icon: string;
    color: string;
  }> = [
    { value: 'securite', label: 'Sécurité', icon: 'ti-shield', color: 'danger' },
    { value: 'sante', label: 'Santé', icon: 'ti-heart', color: 'warning' },
    { value: 'juridique', label: 'Juridique', icon: 'ti-scale', color: 'info' },
    { value: 'administrative', label: 'Administrative', icon: 'ti-file-text', color: 'primary' },
    { value: 'humanitaire', label: 'Humanitaire', icon: 'ti-users', color: 'success' }
  ];

  niveauGraviteOptions: Array<{
    value: 'info' | 'warning' | 'danger' | 'critical';
    label: string;
    color: string;
  }> = [
    { value: 'info', label: 'Information', color: 'info' },
    { value: 'warning', label: 'Attention', color: 'warning' },
    { value: 'danger', label: 'Danger', color: 'danger' },
    { value: 'critical', label: 'Critique', color: 'dark' }
  ];

  statutOptions: Array<{
    value: 'active' | 'resolved' | 'dismissed' | 'expired';
    label: string;
    color: string;
  }> = [
    { value: 'active', label: 'Active', color: 'success' },
    { value: 'resolved', label: 'Résolue', color: 'primary' },
    { value: 'dismissed', label: 'Ignorée', color: 'secondary' },
    { value: 'expired', label: 'Expirée', color: 'danger' }
  ];

  constructor(
    private fb: FormBuilder,
    private alertService: AlertService,
    private migrantService: MigrantService,
    private toastr: ToastrService
  ) {
    this.alertForm = this.createForm();
  }

  ngOnInit(): void {
    this.initializeDefaultDates();
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

  private initializeDefaultDates(): void {
    const today = new Date();
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(today.getMonth() - 1);
    
    this.endDate = today.toISOString().split('T')[0];
    this.startDate = oneMonthAgo.toISOString().split('T')[0];
  }

  // Custom validators for enum types
  private typeAlerteValidator(control: AbstractControl): ValidationErrors | null {
    const validTypes = ['securite', 'sante', 'juridique', 'administrative', 'humanitaire'];
    if (control.value && !validTypes.includes(control.value)) {
      return { invalidTypeAlerte: true };
    }
    return null;
  }

  private niveauGraviteValidator(control: AbstractControl): ValidationErrors | null {
    const validNiveaux = ['info', 'warning', 'danger', 'critical'];
    if (control.value && !validNiveaux.includes(control.value)) {
      return { invalidNiveauGravite: true };
    }
    return null;
  }

  private createForm(): FormGroup {
    return this.fb.group({
      migrant_uuid: ['', [Validators.required]],
      type_alerte: ['', [Validators.required, this.typeAlerteValidator]],
      niveau_gravite: ['', [Validators.required, this.niveauGraviteValidator]],
      titre: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(255)]],
      description: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(1000)]],
      date_expiration: [''],
      action_requise: ['', [Validators.maxLength(500)]],
      personne_responsable: ['', [Validators.maxLength(100)]]
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
      // Note: type_alerte filtering will be handled on the client side if needed

      const response = await firstValueFrom(
        this.alertService.getPaginatedAlerts(this.current_page, this.page_size, filters)
          .pipe(takeUntil(this.destroy$))
      );

      if (response.status === 'success') {
        let filteredData = response.data;
        
        // Apply client-side filtering for type_alerte if selected
        if (this.selectedTypeAlerte) {
          filteredData = filteredData.filter(alert => alert.type_alerte === this.selectedTypeAlerte);
        }
        
        this.alerts = filteredData;
        this.dataSource.data = filteredData;
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
      // Ensure form data matches IAlertFormData interface exactly
      const formValue = this.alertForm.value;
      const formData: IAlertFormData = {
        migrant_uuid: formValue.migrant_uuid,
        type_alerte: formValue.type_alerte as 'securite' | 'sante' | 'juridique' | 'administrative' | 'humanitaire',
        niveau_gravite: formValue.niveau_gravite as 'info' | 'warning' | 'danger' | 'critical',
        titre: formValue.titre,
        description: formValue.description,
        date_expiration: formValue.date_expiration || null,
        action_requise: formValue.action_requise || null,
        personne_responsable: formValue.personne_responsable || null
      };

      let response;
      if (this.editingAlert) {
        response = await firstValueFrom(
          this.alertService.updateAlert(this.editingAlert.uuid, formData)
            .pipe(takeUntil(this.destroy$))
        );
        this.toastr.success('Alerte modifiée avec succès', 'Succès');
      } else {
        response = await firstValueFrom(
          this.alertService.createAlert(formData)
            .pipe(takeUntil(this.destroy$))
        );
        this.toastr.success('Alerte créée avec succès', 'Succès');
      }

      if (response.status === 'success') {
        await this.loadData();
        await this.loadStats();
        this.resetForm();
        this.closeOffcanvas();
      }
    } catch (error: any) {
      this.error = error.error?.message || 'Erreur lors de l\'enregistrement';
      this.toastr.error(this.error || undefined, 'Erreur');
      console.error('Erreur lors de l\'enregistrement de l\'alerte:', error);
    } finally {
      this.isSaving = false;
    }
  }

  // Form preparation methods
  prepareNewAlert(): void {
    this.editingAlert = null;
    this.alertForm.reset();
    this.error = null;
  }

  prepareEditAlert(alert: IAlert): void {
    this.editingAlert = alert;
    this.alertForm.patchValue({
      migrant_uuid: alert.migrant_uuid,
      type_alerte: alert.type_alerte,
      niveau_gravite: alert.niveau_gravite,
      titre: alert.titre,
      description: alert.description,
      date_expiration: DateUtils.toInputFormat(alert.date_expiration),
      action_requise: alert.action_requise,
      personne_responsable: alert.personne_responsable
    });
    this.error = null;
  }

  async deleteAlert(alert: IAlert): Promise<void> {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette alerte ?')) return;

    try {
      const response = await firstValueFrom(
        this.alertService.deleteAlert(alert.uuid)
          .pipe(takeUntil(this.destroy$))
      );

      if (response.status === 'success') {
        this.toastr.success('Alerte supprimée avec succès', 'Succès');
        await this.loadData();
        await this.loadStats();
      }
    } catch (error: any) {
      this.error = error.error?.message || 'Erreur lors de la suppression';
      this.toastr.error(this.error || undefined, 'Erreur');
      console.error('Erreur lors de la suppression de l\'alerte:', error);
    }
  }

  async resolveAlert(alert: IAlert): Promise<void> {
    const commentaire = prompt('Commentaire de résolution:');
    if (commentaire === null) return;

    try {
      const response = await firstValueFrom(
        this.alertService.resolveAlert(alert.uuid, {
          comment_resolution: commentaire
        }).pipe(takeUntil(this.destroy$))
      );

      if (response.status === 'success') {
        this.toastr.success('Alerte résolue avec succès', 'Succès');
        await this.loadData();
        await this.loadStats();
      }
    } catch (error: any) {
      this.error = error.error?.message || 'Erreur lors de la résolution';
      this.toastr.error(this.error || undefined, 'Erreur');
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
    this.startDate = '';
    this.endDate = '';
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
    return migrant ? `${migrant.identite?.nom || ''} ${migrant.identite?.prenom || ''}`.trim() || 'Migrant inconnu' : 'Migrant inconnu';
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
    return DateUtils.toDisplayFormat(date);
  }

  formatDateTime(date: Date | string | undefined): string {
    return DateUtils.toDisplayFormat(date, { includeTime: true });
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
      if (field.errors['minlength']) return `${fieldName} doit contenir au moins ${field.errors['minlength'].requiredLength} caractères`;
      if (field.errors['maxlength']) return `${fieldName} doit contenir au maximum ${field.errors['maxlength'].requiredLength} caractères`;
      if (field.errors['invalidTypeAlerte']) return 'Type d\'alerte invalide';
      if (field.errors['invalidNiveauGravite']) return 'Niveau de gravité invalide';
    }
    return '';
  }

  // Modal/Offcanvas controls
  openAddOffcanvas(): void {
    const offcanvasElement = document.getElementById('offcanvas_alert');
    if (offcanvasElement) {
      const bsOffcanvas = new (window as any).bootstrap.Offcanvas(offcanvasElement);
      bsOffcanvas.show();
    }
  }

  openEditOffcanvas(): void {
    const offcanvasElement = document.getElementById('offcanvas_alert');
    if (offcanvasElement) {
      const bsOffcanvas = new (window as any).bootstrap.Offcanvas(offcanvasElement);
      bsOffcanvas.show();
    }
  }

  closeOffcanvas(): void {
    const offcanvasElement = document.getElementById('offcanvas_alert');
    if (offcanvasElement) {
      const bsOffcanvas = (window as any).bootstrap.Offcanvas.getInstance(offcanvasElement);
      if (bsOffcanvas) {
        bsOffcanvas.hide();
      }
    }
    this.resetForm();
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

  // Open export dialog
  openExportDialog(): void {
    this.initializeDefaultDates();
    this.isExportDialogOpen = true;
  }

  // Close export dialog
  closeExportDialog(): void {
    this.isExportDialogOpen = false;
  }

  // Export to Excel with date confirmation
  confirmExportToExcel(): void {
    this.isExportDialogOpen = false;
    this.exportToExcel();
  }

  // Export to Excel
  exportToExcel(): void {
    this.isLoading = true;
    this.error = null;

    // Préparer les filtres pour l'export (dates uniquement)
    const exportFilters: IAlertFilters = {};
    
    if (this.startDate) exportFilters.start_date = this.startDate;
    if (this.endDate) exportFilters.end_date = this.endDate;

    console.log('Début de l\'export Excel des alertes...');

    this.alertService.exportAlertsToExcel(exportFilters).subscribe({
      next: (blob: Blob) => {
        try {
          // Créer un lien de téléchargement pour le fichier Excel
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          
          // Générer un nom de fichier avec timestamp
          const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
          link.download = `alertes_export_${timestamp}.xlsx`;
          
          // Déclencher le téléchargement
          document.body.appendChild(link);
          link.click();
          
          // Nettoyer
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
          
          this.isLoading = false;
          
          // Afficher un message de succès
          console.log('✅ Export Excel des alertes terminé avec succès');
          this.showSuccessMessage('Export Excel terminé avec succès');
          
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
          errorMessage = 'Problème de connexion réseau. Vérifiez votre connexion internet.';
        }
        
        this.error = errorMessage;
        this.showMessage(errorMessage, 'error');
        this.isLoading = false;
      }
    });
  }

  // Méthode utilitaire pour afficher un message de succès
  private showSuccessMessage(message: string): void {
    this.toastr.success(message, 'Succès');
  }

  // Méthode utilitaire pour afficher un message
  private showMessage(message: string, type: 'success' | 'error' | 'info' | 'warning'): void {
    switch (type) {
      case 'success':
        this.toastr.success(message, 'Succès');
        break;
      case 'error':
        this.toastr.error(message, 'Erreur');
        break;
      case 'info':
        this.toastr.info(message, 'Information');
        break;
      case 'warning':
        this.toastr.warning(message, 'Attention');
        break;
    }
  }
}

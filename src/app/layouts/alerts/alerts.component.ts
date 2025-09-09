import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { Sort } from '@angular/material/sort';
import { PageEvent } from '@angular/material/paginator';
import { Subject, firstValueFrom, takeUntil } from 'rxjs';
import { IAlert, IMigrant } from '../../shared/models/migrant.model';
import { AlertService, IAlertFormData } from '../../core/migration/alert.service';
import { MigrantService } from '../../core/migration/migrant.service';

@Component({
  selector: 'app-alerts',
  standalone: false,
  templateUrl: './alerts.component.html',
  styleUrl: './alerts.component.scss'
})
export class AlertsComponent implements OnInit, OnDestroy {
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

  // Filters
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
    { value: 'humanitaire', label: 'Humanitaire', icon: 'ti-heart-handshake', color: 'success' }
  ];

  niveauGraviteOptions = [
    { value: 'info', label: 'Information', color: 'info' },
    { value: 'warning', label: 'Avertissement', color: 'warning' },
    { value: 'danger', label: 'Danger', color: 'danger' },
    { value: 'critical', label: 'Critique', color: 'dark' }
  ];

  statutOptions = [
    { value: 'active', label: 'Active', color: 'warning' },
    { value: 'resolved', label: 'Résolue', color: 'success' },
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
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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
      personne_responsable: [''],
      notifier_autorites: [false],
      latitude: [''],
      longitude: [''],
      adresse: ['']
    });
  }

  async loadData(): Promise<void> {
    this.isLoadingData = true;
    this.error = null;

    try {
      const response = await firstValueFrom(
        this.alertService.getPaginatedAlerts(
          this.current_page, 
          this.page_size,
          this.selectedMigrant,
          this.selectedTypeAlerte,
          this.selectedNiveauGravite,
          this.selectedStatut
        ).pipe(takeUntil(this.destroy$))
      );

      if (response.success) {
        this.alerts = response.data;
        this.dataSource.data = response.data;
        this.total_records = response.total;
        this.current_page = response.page;
        this.page_size = response.limit;
      }
    } catch (error: any) {
      this.error = error.error?.message || 'Erreur lors du chargement des données';
      console.error('Erreur lors du chargement des alertes:', error);
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
    if (this.alertForm.invalid || this.isSaving) return;

    this.isSaving = true;
    this.error = null;

    try {
      const formData: IAlertFormData = this.alertForm.value;

      // Convertir les champs de date en format ISO string
      const alertData = {
        ...formData,
        date_expiration: formData.date_expiration ? new Date(formData.date_expiration).toISOString() : ''
      };

      let response;
      if (this.editingAlert) {
        response = await firstValueFrom(
          this.alertService.updateAlert(this.editingAlert.uuid, alertData)
            .pipe(takeUntil(this.destroy$))
        );
      } else {
        response = await firstValueFrom(
          this.alertService.createAlert(alertData)
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
      date_expiration: alert.date_expiration ? alert.date_expiration.split('T')[0] : '',
      action_requise: alert.action_requise,
      personne_responsable: alert.personne_responsable,
      notifier_autorites: alert.notifier_autorites,
      latitude: alert.latitude,
      longitude: alert.longitude,
      adresse: alert.adresse
    });
  }

  async deleteAlert(alert: IAlert): Promise<void> {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette alerte ?')) return;

    try {
      const response = await firstValueFrom(
        this.alertService.deleteAlert(alert.uuid)
          .pipe(takeUntil(this.destroy$))
      );

      if (response.success) {
        await this.loadData();
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

      if (response.success) {
        await this.loadData();
      }
    } catch (error: any) {
      this.error = error.error?.message || 'Erreur lors de la résolution';
      console.error('Erreur lors de la résolution:', error);
    }
  }

  resetForm(): void {
    this.alertForm.reset();
    this.alertForm.patchValue({
      notifier_autorites: false
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
    this.selectedTypeAlerte = '';
    this.selectedNiveauGravite = '';
    this.selectedStatut = '';
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

  formatDate(dateString: string): string {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('fr-FR');
  }

  formatDateTime(dateString: string): string {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('fr-FR');
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

  // Get current location for alert
  getCurrentLocation(): void {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.alertForm.patchValue({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
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

  // Dashboard helpers
  getActiveAlertsCount(): number {
    return this.alerts.filter(a => a.statut === 'active').length;
  }

  getCriticalAlertsCount(): number {
    return this.alerts.filter(a => a.niveau_gravite === 'critical' && a.statut === 'active').length;
  }

  getExpiredAlertsCount(): number {
    return this.alerts.filter(a => this.isAlertExpired(a) && a.statut === 'active').length;
  }
}

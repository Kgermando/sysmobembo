import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize } from 'rxjs/operators';
import { Subject } from 'rxjs';

import { 
  BiometricService, 
  IBiometricFormData, 
  IBiometricVerificationData,
  IBiometricStats,
  IBiometricFilters
} from '../../core/migration/biometric.service';
import { MigrantService } from '../../core/migration/migrant.service';
import { IBiometrie, IMigrant } from '../../shared/models/migrant.model';

@Component({
  selector: 'app-biometrics',
  standalone: false,
  templateUrl: './biometrics.component.html',
  styleUrls: ['./biometrics.component.scss']
})
export class BiometricsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  // Math for template
  Math = Math;

  displayedColumns: string[] = [
    'migrant_nom',
    'type_biometrie',
    'index_doigt',
    'qualite_donnee',
    'date_capture',
    'dispositif_capture',
    'verifie',
    'score_confiance',
    'chiffre',
    'actions'
  ];

  dataSource = new MatTableDataSource<IBiometrie>();
  biometricForm!: FormGroup;
  verificationForm!: FormGroup;
  
  // States
  isLoading = false;
  isLoadingData = false;
  isSaving = false;
  isModalOpen = false;
  isVerificationModalOpen = false;
  error: string | null = null;
  
  // Data
  biometrics: IBiometrie[] = [];
  editingBiometric: IBiometrie | null = null;
  verifyingBiometric: IBiometrie | null = null;
  migrants: IMigrant[] = [];
  
  // Statistics
  stats: IBiometricStats = {
    total_biometrics: 0,
    verified_biometrics: 0,
    encrypted_biometrics: 0,
    biometric_types: [],
    quality_distribution: [],
    avg_confidence_score: 0,
    capture_devices: []
  };

  // Filter options based on backend validation
  biometricTypes = [
    { value: 'empreinte_digitale', label: 'Empreinte digitale' },
    { value: 'reconnaissance_faciale', label: 'Reconnaissance faciale' },
    { value: 'iris', label: 'Iris' },
    { value: 'scan_retine', label: 'Scan rétine' },
    { value: 'signature_numerique', label: 'Signature numérique' }
  ];

  qualityLevels = [
    { value: 'excellente', label: 'Excellente' },
    { value: 'bonne', label: 'Bonne' },
    { value: 'moyenne', label: 'Moyenne' },
    { value: 'faible', label: 'Faible' }
  ];

  encodingAlgorithms = [
    { value: 'SHA256', label: 'SHA256' },
    { value: 'MD5', label: 'MD5' },
    { value: 'WSQ', label: 'WSQ' },
    { value: 'JPEG2000', label: 'JPEG2000' },
    { value: 'PNG', label: 'PNG' }
  ];

  // Finger index options for fingerprints
  fingerIndexes = [
    { value: 1, label: 'Pouce droit' },
    { value: 2, label: 'Index droit' },
    { value: 3, label: 'Majeur droit' },
    { value: 4, label: 'Annulaire droit' },
    { value: 5, label: 'Auriculaire droit' },
    { value: 6, label: 'Pouce gauche' },
    { value: 7, label: 'Index gauche' },
    { value: 8, label: 'Majeur gauche' },
    { value: 9, label: 'Annulaire gauche' },
    { value: 10, label: 'Auriculaire gauche' }
  ];

  // Pagination
  currentPage = 1;
  pageSize = 15;
  totalItems = 0;
  totalPages = 0;

  // Backend supported filters (based on API endpoints)
  migrantUuidFilter = '';
  typeBiometrieFilter = '';
  verifieFilter = '';
  qualiteDonneeFilter = '';
  chiffreFilter = '';
  dispositifCaptureFilter = '';

  constructor(
    private fb: FormBuilder,
    private biometricService: BiometricService,
    private migrantService: MigrantService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    this.initializeForms();
  }

  private initializeForms(): void {
    this.biometricForm = this.fb.group({
      migrant_uuid: ['', Validators.required],
      type_biometrie: ['', Validators.required],
      index_doigt: [''], // Required only for fingerprints
      qualite_donnee: [''], // Optional, will be auto-assessed
      donnees_biometriques: ['', Validators.required],
      algorithme_encodage: ['', Validators.required],
      date_capture: [new Date().toISOString().split('T')[0], Validators.required],
      dispositif_capture: [''],
      resolution_capture: [''],
      operateur_capture: ['']
    });

    this.verificationForm = this.fb.group({
      score_confiance: ['', [Validators.required, Validators.min(0), Validators.max(100)]],
      operateur_verification: ['', Validators.required]
    });

    // Watch type_biometrie changes to handle finger index requirement
    this.biometricForm.get('type_biometrie')?.valueChanges.subscribe(type => {
      const indexDoigtControl = this.biometricForm.get('index_doigt');
      if (type === 'empreinte_digitale') {
        indexDoigtControl?.setValidators([Validators.required]);
      } else {
        indexDoigtControl?.clearValidators();
        indexDoigtControl?.setValue('');
      }
      indexDoigtControl?.updateValueAndValidity();
    });
  }

  ngOnInit(): void {
    this.loadBiometrics();
    this.loadMigrants();
    this.loadStats();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadBiometrics(): void {
    this.isLoading = true;
    
    // Use backend supported filters directly
    this.biometricService.getPaginatedBiometrics(
      this.currentPage, 
      this.pageSize,
      this.migrantUuidFilter || undefined,
      this.typeBiometrieFilter || undefined,
      this.verifieFilter || undefined
    )
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (response) => {
          if (response.status === 'success') {
            this.biometrics = response.data;
            this.dataSource.data = response.data;
            this.totalItems = response.pagination.total_records;
            this.totalPages = response.pagination.total_pages;
            this.dataSource.paginator = this.paginator;
          }
        },
        error: (error) => {
          console.error('Error loading biometrics:', error);
          this.showMessage('Erreur lors du chargement', 'error');
        }
      });
  }

  loadMigrants(): void {
    this.migrantService.getAllMigrants().subscribe({
      next: (response) => {
        if (response.status === 'success') {
          this.migrants = response.data;
        }
      },
      error: (error) => {
        console.error('Error loading migrants:', error);
      }
    });
  }

  loadStats(): void {
    this.biometricService.getBiometricsStats().subscribe({
      next: (response) => {
        if (response.status === 'success') {
          this.stats = response.data;
        }
      },
      error: (error) => {
        console.error('Error loading stats:', error);
      }
    });
  }

  onPageChange(event: any): void {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.loadBiometrics();
  }

  applyFilters(): void {
    this.currentPage = 1;
    this.loadBiometrics();
  }

  clearFilters(): void {
    this.migrantUuidFilter = '';
    this.typeBiometrieFilter = '';
    this.verifieFilter = '';
    this.qualiteDonneeFilter = '';
    this.chiffreFilter = '';
    this.dispositifCaptureFilter = '';
    this.currentPage = 1;
    this.loadBiometrics();
  }

  // Modal Operations
  prepareNewBiometric(): void {
    this.editingBiometric = null;
    this.biometricForm.reset();
    this.biometricForm.patchValue({
      date_capture: new Date().toISOString().split('T')[0]
    });
  }

  openCreateModal(): void {
    this.prepareNewBiometric();
    this.isModalOpen = true;
  }

  openEditModal(biometric: IBiometrie): void {
    this.editingBiometric = biometric;
    this.biometricForm.patchValue({
      migrant_uuid: biometric.migrant_uuid,
      type_biometrie: biometric.type_biometrie,
      index_doigt: biometric.index_doigt,
      qualite_donnee: biometric.qualite_donnee,
      algorithme_encodage: biometric.algorithme_encodage,
      date_capture: biometric.date_capture,
      dispositif_capture: biometric.dispositif_capture,
      resolution_capture: biometric.resolution_capture,
      operateur_capture: biometric.operateur_capture
    });
    this.isModalOpen = true;
  }

  openVerificationModal(biometric: IBiometrie): void {
    this.verifyingBiometric = biometric;
    this.verificationForm.reset();
    this.isVerificationModalOpen = true;
  }

  // File Operations
  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        this.showMessage('Le fichier ne doit pas dépasser 10MB', 'error');
        return;
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/bmp', 'application/octet-stream'];
      if (!allowedTypes.includes(file.type) && !file.name.match(/\.(jpg|jpeg|png|bmp|wsq)$/i)) {
        this.showMessage('Type de fichier non supporté. Utilisez JPG, PNG, BMP ou WSQ', 'error');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e: any) => {
        const base64 = e.target.result.split(',')[1];
        this.biometricForm.patchValue({
          donnees_biometriques: base64
        });
      };
      reader.readAsDataURL(file);
    }
  }

  // CRUD Operations
  saveBiometric(): void {
    if (this.biometricForm.valid) {
      this.isSaving = true;
      const formData: IBiometricFormData = this.biometricForm.value;
      
      // Convert date to ISO string for API
      const biometricData: IBiometricFormData = {
        ...formData,
        date_capture: formData.date_capture ? new Date(formData.date_capture).toISOString() : new Date().toISOString()
      };
      
      if (this.editingBiometric) {
        // Update (metadata only, as per backend design)
        const updateData = {
          qualite_donnee: biometricData.qualite_donnee,
          dispositif_capture: biometricData.dispositif_capture,
          resolution_capture: biometricData.resolution_capture,
          operateur_capture: biometricData.operateur_capture
        };

        this.biometricService.updateBiometric(this.editingBiometric.uuid, updateData)
          .pipe(finalize(() => this.isSaving = false))
          .subscribe({
            next: (response) => {
              if (response.status === 'success') {
                this.showMessage('Données biométriques mises à jour avec succès');
                this.closeModal();
                this.loadBiometrics();
                this.loadStats();
              }
            },
            error: (error) => {
              console.error('Error updating biometric:', error);
              this.showMessage(error.error?.message || 'Erreur lors de la mise à jour', 'error');
            }
          });
      } else {
        // Create new
        this.biometricService.createBiometric(biometricData)
          .pipe(finalize(() => this.isSaving = false))
          .subscribe({
            next: (response) => {
              if (response.status === 'success') {
                this.showMessage('Données biométriques ajoutées avec succès');
                this.closeModal();
                this.loadBiometrics();
                this.loadStats();
              }
            },
            error: (error) => {
              console.error('Error creating biometric:', error);
              this.showMessage(error.error?.message || 'Erreur lors de la création', 'error');
            }
          });
      }
    } else {
      this.markFormGroupTouched(this.biometricForm);
    }
  }

  verifyBiometric(): void {
    if (this.verificationForm.valid && this.verifyingBiometric) {
      this.isSaving = true;
      const verificationData: IBiometricVerificationData = {
        score_confiance: this.verificationForm.value.score_confiance / 100, // Convert percentage to decimal
        operateur_verification: this.verificationForm.value.operateur_verification
      };
      
      this.biometricService.verifyBiometric(this.verifyingBiometric.uuid, verificationData)
        .pipe(finalize(() => this.isSaving = false))
        .subscribe({
          next: (response) => {
            if (response.status === 'success') {
              this.showMessage('Données biométriques vérifiées avec succès');
              this.closeVerificationModal();
              this.loadBiometrics();
              this.loadStats();
            }
          },
          error: (error) => {
            console.error('Error verifying biometric:', error);
            this.showMessage(error.error?.message || 'Erreur lors de la vérification', 'error');
          }
        });
    } else {
      this.markFormGroupTouched(this.verificationForm);
    }
  }

  deleteBiometric(biometric: IBiometrie): void {
    if (confirm(`Êtes-vous sûr de vouloir supprimer les données biométriques de type "${biometric.type_biometrie}" ?`)) {
      this.biometricService.deleteBiometric(biometric.uuid)
        .subscribe({
          next: (response) => {
            if (response.status === 'success') {
              this.showMessage('Données biométriques supprimées avec succès');
              this.loadBiometrics();
              this.loadStats();
            }
          },
          error: (error) => {
            console.error('Error deleting biometric:', error);
            this.showMessage(error.error?.message || 'Erreur lors de la suppression', 'error');
          }
        });
    }
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.editingBiometric = null;
    this.biometricForm.reset();
  }

  closeVerificationModal(): void {
    this.isVerificationModalOpen = false;
    this.verifyingBiometric = null;
    this.verificationForm.reset();
  }

  // Helper Methods
  getMigrantName(migrantUuid: string): string {
    const migrant = this.migrants.find(m => m.uuid === migrantUuid);
    return migrant ? `${migrant.nom} ${migrant.prenom}` : 'Inconnu';
  }

  getBiometricTypeLabel(type: string): string {
    const biometricType = this.biometricTypes.find(bt => bt.value === type);
    return biometricType ? biometricType.label : type;
  }

  getQualityLabel(quality: string): string {
    const qualityLevel = this.qualityLevels.find(ql => ql.value === quality);
    return qualityLevel ? qualityLevel.label : quality;
  }

  getFingerIndexLabel(index: number): string {
    const fingerIndex = this.fingerIndexes.find(fi => fi.value === index);
    return fingerIndex ? fingerIndex.label : `Doigt ${index}`;
  }

  getVerificationStatusColor(biometric: IBiometrie): string {
    if (biometric.verifie) {
      return (biometric.score_confiance && biometric.score_confiance >= 80) ? 'success' : 'warn';
    }
    return 'accent';
  }

  getQualityColor(quality: string): string {
    switch (quality) {
      case 'excellente': return 'success';
      case 'bonne': return 'primary';
      case 'moyenne': return 'warn';
      case 'faible': return 'danger';
      default: return 'secondary';
    }
  }

  formatDateTime(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('fr-FR');
  }

  canEditBiometric(): boolean {
    // Add your permission logic here
    return true;
  }

  canDeleteBiometric(): boolean {
    // Add your permission logic here
    return true;
  }

  canVerifyBiometric(): boolean {
    // Add your permission logic here
    return true;
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  private showMessage(message: string, type: string = 'success'): void {
    this.snackBar.open(message, 'Fermer', {
      duration: 5000,
      panelClass: type === 'error' ? 'error-snackbar' : 'success-snackbar'
    });
  }

  // Reset all filters
  resetFilters(): void {
    this.migrantUuidFilter = '';
    this.typeBiometrieFilter = '';
    this.verifieFilter = '';
    this.qualiteDonneeFilter = '';
    this.chiffreFilter = '';
    this.dispositifCaptureFilter = '';
    this.currentPage = 1;
    this.loadBiometrics();
  }

  // Export to Excel
  exportToExcel(): void {
    this.isLoading = true;
    this.error = null;

    // Préparer les filtres pour l'export
    const exportFilters: IBiometricFilters = {};
    
    if (this.migrantUuidFilter) exportFilters.migrant_uuid = this.migrantUuidFilter;
    if (this.typeBiometrieFilter) exportFilters.type_biometrie = this.typeBiometrieFilter;
    if (this.qualiteDonneeFilter) exportFilters.qualite_donnee = this.qualiteDonneeFilter;
    if (this.verifieFilter) exportFilters.verifie = this.verifieFilter;
    if (this.chiffreFilter) exportFilters.chiffre = this.chiffreFilter;
    if (this.dispositifCaptureFilter) exportFilters.dispositif_capture = this.dispositifCaptureFilter;

    // Afficher un message d'information pendant l'export
    console.log('Début de l\'export Excel des biométries...');

    this.biometricService.exportBiometricsToExcel(exportFilters).subscribe({
      next: (blob: Blob) => {
        try {
          // Créer un lien de téléchargement pour le fichier Excel
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          
          // Générer un nom de fichier avec timestamp
          const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
          link.download = `biometries_export_${timestamp}.xlsx`;
          
          // Déclencher le téléchargement
          document.body.appendChild(link);
          link.click();
          
          // Nettoyer
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
          
          this.isLoading = false;
          
          // Afficher un message de succès
          console.log('✅ Export Excel des biométries terminé avec succès');
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
    // Créer un élément de notification temporaire
    const notification = document.createElement('div');
    notification.className = 'alert alert-success position-fixed';
    notification.style.cssText = `
      top: 20px;
      right: 20px;
      z-index: 9999;
      max-width: 300px;
      opacity: 0;
      transition: opacity 0.3s ease;
    `;
    notification.innerHTML = `
      <div class="d-flex align-items-center">
        <i class="ti ti-check-circle me-2"></i>
        <span>${message}</span>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // Animation d'apparition
    setTimeout(() => {
      notification.style.opacity = '1';
    }, 100);
    
    // Suppression automatique après 3 secondes
    setTimeout(() => {
      notification.style.opacity = '0';
      setTimeout(() => {
        if (notification.parentElement) {
          document.body.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }
}

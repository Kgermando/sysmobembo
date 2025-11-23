import { Component, OnInit, OnDestroy, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { PageEvent } from '@angular/material/paginator';
import { Subject, firstValueFrom, takeUntil, Observable } from 'rxjs';
import { IIdentite, IIdentiteFormData, PassportOCRData } from '../../shared/models/identite.model';
import { IdentiteService, IBackendPaginationResponse } from '../../core/migration/identite.service';
import { NATIONALITES } from '../../shared/utils';
import { OcrService, OCRProgress } from '../../core/services/ocr.service';
import { PassportOcrService } from '../../core/services/passport-ocr.service';

@Component({
  selector: 'app-identites',
  standalone: false,
  templateUrl: './identites.component.html',
  styleUrl: './identites.component.scss'
})
export class IdentitesComponent implements OnInit, OnDestroy, AfterViewInit {
  private destroy$ = new Subject<void>();

  @ViewChild('fileInput', { static: false }) fileInput!: ElementRef;
  @ViewChild('tableScrollWrapper', { static: false }) tableScrollWrapper!: ElementRef;

  // Math reference for template
  Math = Math;

  // OCR Properties
  selectedImageFile: File | null = null;
  selectedImagePreview: string | null = null;
  isProcessingOCR = false;
  ocrProgress$!: Observable<OCRProgress>;
  extractedText: string | null = null;
  parsedPassportData: PassportOCRData | null = null;
  ocrSuccessMessage: string | null = null;
  ocrErrorMessage: string | null = null;
  showOcrResults = false;

  // Angular Material Table
  dataSource = new MatTableDataSource<IIdentite>();
  displayedColumns: string[] = [
    'nom', 'postnom', 'prenom', 'sexe', 'nationalite', 
    'numero_passeport', 'date_naissance', 'lieu_naissance', 'pays_emetteur', 'actions'
  ];

  // Data
  identites: IIdentite[] = [];
  dataList: IIdentite[] = [];
  identiteStats: any = null;

  // Form
  identiteForm: FormGroup;
  editingIdentite: IIdentite | null = null;
  viewingIdentite: IIdentite | null = null;

  // States
  isLoading = false;
  isLoadingData = false;
  isSaving = false;
  error: string | null = null;

  // Pagination
  total_records = 0;
  page_size = 15;
  current_page = 1;

  // Search
  searchTerm = '';

  // Export dialog state
  isExportDialogOpen = false;
  startDate = '';
  endDate = '';

  // Getter pour les nationalités
  get nationaliteOptions(): string[] {
    return NATIONALITES;
  }

  constructor(
    private fb: FormBuilder,
    private identiteService: IdentiteService,
    private ocrService: OcrService,
    private passportOcrService: PassportOcrService
  ) {
    this.identiteForm = this.createForm();
    this.ocrProgress$ = this.ocrService.progress$;
  }

  ngOnInit(): void {
    this.loadData();
    this.loadStats();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.ocrService.terminateWorker();
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
      nom: ['', [Validators.required, Validators.minLength(2)]],
      postnom: [''],
      prenom: ['', [Validators.required, Validators.minLength(2)]],
      date_naissance: ['', Validators.required],
      lieu_naissance: ['', Validators.required],
      sexe: ['', Validators.required],
      nationalite: ['', Validators.required],
      adresse: [''],
      profession: [''],
      pays_emetteur: ['', Validators.required],
      autorite_emetteur: ['', Validators.required],
      numero_passeport: ['', Validators.required]
    });
  }

  async loadData(): Promise<void> {
    this.isLoadingData = true;
    this.error = null;

    try {
      const filters: any = {};
      if (this.searchTerm) filters.search = this.searchTerm;

      const response = await firstValueFrom(
        this.identiteService.getPaginatedIdentites(this.current_page, this.page_size, filters)
          .pipe(takeUntil(this.destroy$))
      );

      if (response.status === 'success') {
        this.identites = response.data || [];
        this.dataList = response.data || [];
        this.dataSource.data = response.data || [];
        this.total_records = response.pagination?.total_records || 0;
        this.current_page = response.pagination?.current_page || 1;
        this.page_size = response.pagination?.page_size || 15;
      }
    } catch (error: any) {
      this.error = error.error?.message || 'Erreur lors du chargement des données';
      console.error('Erreur lors du chargement des identités:', error);
    } finally {
      this.isLoadingData = false;
    }
  }

  async loadStats(): Promise<void> {
    try {
      const response = await firstValueFrom(
        this.identiteService.getIdentitesStats()
          .pipe(takeUntil(this.destroy$))
      );

      if (response.status === 'success') {
        this.identiteStats = response.data;
      }
    } catch (error: any) {
      console.error('Erreur lors du chargement des statistiques:', error);
    }
  }

  async onSubmit(): Promise<void> {
    if (this.identiteForm.invalid || this.isSaving) return;

    this.isSaving = true;
    this.error = null;

    try {
      const formData: IIdentiteFormData = this.identiteForm.value;

      // Convertir la date de naissance
      const identiteData = {
        ...formData,
        date_naissance: formData.date_naissance ? new Date(formData.date_naissance).toISOString() : ''
      };

      let response;
      if (this.editingIdentite) {
        response = await firstValueFrom(
          this.identiteService.updateIdentite(this.editingIdentite.uuid, identiteData)
            .pipe(takeUntil(this.destroy$))
        );
      } else {
        response = await firstValueFrom(
          this.identiteService.createIdentite(identiteData)
            .pipe(takeUntil(this.destroy$))
        );
      }

      if (response.status === 'success') {
        await this.loadData();
        await this.loadStats();
        this.closeAddOffcanvas();
        this.resetForm();
      }
    } catch (error: any) {
      this.error = error.error?.message || 'Erreur lors de la sauvegarde';
      console.error('Erreur lors de la sauvegarde:', error);
    } finally {
      this.isSaving = false;
    }
  }

  prepareNewIdentite(): void {
    this.editingIdentite = null;
    this.resetForm();
  }

  prepareEditIdentite(identite: IIdentite): void {
    this.editingIdentite = identite;
    this.patchFormWithIdentite(identite);
  }

  openViewModal(identite: IIdentite): void {
    this.viewingIdentite = identite;
    this.openModal('viewIdentiteModal');
  }

  // Offcanvas methods
  openAddOffcanvas(): void {
    const offcanvasElement = document.getElementById('offcanvas_add');
    if (offcanvasElement) {
      const offcanvas = new (window as any).bootstrap.Offcanvas(offcanvasElement);
      offcanvas.show();
    }
  }

  closeAddOffcanvas(): void {
    const offcanvasElement = document.getElementById('offcanvas_add');
    if (offcanvasElement) {
      const offcanvas = (window as any).bootstrap.Offcanvas.getInstance(offcanvasElement);
      if (offcanvas) {
        offcanvas.hide();
      }
    }
    this.cancelOCR();
  }

  openEditOffcanvas(): void {
    this.openAddOffcanvas(); // Utilise le même offcanvas pour édition
  }

  private patchFormWithIdentite(identite: IIdentite): void {
    const dateNaissance = identite.date_naissance ? 
      new Date(identite.date_naissance).toISOString().split('T')[0] : '';

    this.identiteForm.patchValue({
      nom: identite.nom,
      postnom: identite.postnom,
      prenom: identite.prenom,
      date_naissance: dateNaissance,
      lieu_naissance: identite.lieu_naissance,
      sexe: identite.sexe,
      nationalite: identite.nationalite,
      adresse: identite.adresse,
      profession: identite.profession,
      pays_emetteur: identite.pays_emetteur,
      autorite_emetteur: identite.autorite_emetteur,
      numero_passeport: identite.numero_passeport
    });
  }

  async confirmDelete(identite: IIdentite): Promise<void> {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer l'identité de ${identite.prenom} ${identite.nom} ?`)) {
      return;
    }

    try {
      const response = await firstValueFrom(
        this.identiteService.deleteIdentite(identite.uuid)
          .pipe(takeUntil(this.destroy$))
      );

      if (response.status === 'success') {
        await this.loadData();
        await this.loadStats();
      }
    } catch (error: any) {
      this.error = error.error?.message || 'Erreur lors de la suppression';
      console.error('Erreur lors de la suppression:', error);
      alert(this.error);
    }
  }

  onPageChange(event: PageEvent): void {
    this.current_page = event.pageIndex + 1;
    this.page_size = event.pageSize;
    this.loadData();
  }

  onSearch(): void {
    this.current_page = 1;
    this.loadData();
  }

  // ==================== EXPORT FUNCTIONS ====================

  /**
   * Ouvre le dialogue d'export
   */
  openExportDialog(): void {
    // Set default dates (1 month range)
    const today = new Date();
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(today.getMonth() - 1);

    this.endDate = today.toISOString().split('T')[0];
    this.startDate = oneMonthAgo.toISOString().split('T')[0];
    this.isExportDialogOpen = true;
  }

  /**
   * Ferme le dialogue d'export
   */
  closeExportDialog(): void {
    this.isExportDialogOpen = false;
  }

  /**
   * Confirme et lance l'export Excel
   */
  confirmExportToExcel(): void {
    this.isExportDialogOpen = false;
    this.exportToExcel();
  }

  /**
   * Exporte les données vers Excel avec filtres de date
   */
  async exportToExcel(): Promise<void> {
    this.isLoading = true;
    this.error = null;

    try {
      // Préparer les filtres pour l'export (dates uniquement)
      const filters: any = {};
      if (this.startDate) filters.start_date = this.startDate;
      if (this.endDate) filters.end_date = this.endDate;

      console.log('Début de l\'export Excel des identités...');

      const blob = await firstValueFrom(
        this.identiteService.exportIdentitesToExcel(filters)
          .pipe(takeUntil(this.destroy$))
      );

      // Créer un lien de téléchargement pour le fichier Excel
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Générer un nom de fichier avec timestamp
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      link.download = `identites_export_${timestamp}.xlsx`;
      
      // Déclencher le téléchargement
      document.body.appendChild(link);
      link.click();
      
      // Nettoyer
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      console.log('✅ Export Excel des identités terminé avec succès');
      
    } catch (error: any) {
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
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Réinitialise les filtres d'export
   */
  resetExportFilters(): void {
    const today = new Date();
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(today.getMonth() - 1);

    this.endDate = today.toISOString().split('T')[0];
    this.startDate = oneMonthAgo.toISOString().split('T')[0];
  }

  // ==================== OCR FUNCTIONS ====================

  /**
   * Ouvre le sélecteur de fichiers
   */
  openFileSelector(): void {
    this.fileInput.nativeElement.click();
  }

  /**
   * Gère la sélection d'une image de passeport
   */
  onPassportImageSelected(event: any): void {
    const file = event.target.files[0];
    if (!file) return;

    // Vérifier le type de fichier
    if (!file.type.startsWith('image/')) {
      this.ocrErrorMessage = 'Veuillez sélectionner une image valide';
      return;
    }

    this.selectedImageFile = file;
    this.ocrErrorMessage = null;
    this.ocrSuccessMessage = null;
    this.extractedText = null;
    this.parsedPassportData = null;
    this.showOcrResults = false;

    // Créer un aperçu de l'image
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.selectedImagePreview = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  /**
   * Lance le processus OCR pour extraire les données du passeport
   */
  async processPassportOCR(): Promise<void> {
    if (!this.selectedImageFile) {
      this.ocrErrorMessage = 'Veuillez sélectionner une image de passeport';
      return;
    }

    this.isProcessingOCR = true;
    this.ocrErrorMessage = null;
    this.ocrSuccessMessage = null;
    this.extractedText = null;
    this.parsedPassportData = null;
    this.showOcrResults = false;

    try {
      // Extraire le texte avec Tesseract
      const result = await this.ocrService.extractTextFromImage(this.selectedImageFile);
      
      if (result && result.text) {
        this.extractedText = result.text;
        
        // Parser le texte extrait pour obtenir les données du passeport
        this.parsedPassportData = this.passportOcrService.parsePassportText(result.text);
        
        // Pré-remplir le formulaire avec les données extraites
        this.fillFormWithOCRData(this.parsedPassportData);
        
        this.ocrSuccessMessage = 'Données du passeport extraites avec succès! Veuillez vérifier et compléter les informations.';
        this.showOcrResults = true;
      } else {
        this.ocrErrorMessage = 'Aucun texte détecté dans l\'image';
      }
    } catch (error: any) {
      this.ocrErrorMessage = error.message || 'Erreur lors de l\'extraction des données';
      console.error('Erreur OCR:', error);
    } finally {
      this.isProcessingOCR = false;
    }
  }

  /**
   * Fills the form with OCR extracted data
   */
  private fillFormWithOCRData(data: PassportOCRData): void {
    const formData: any = {};

    if (data.nom) formData.nom = data.nom;
    if (data.postnom) formData.postnom = data.postnom;
    if (data.prenom) formData.prenom = data.prenom;
    if (data.date_naissance) formData.date_naissance = data.date_naissance;
    if (data.lieu_naissance) formData.lieu_naissance = data.lieu_naissance;
    if (data.sexe) formData.sexe = data.sexe;
    if (data.nationalite) formData.nationalite = data.nationalite;
    if (data.adresse) formData.adresse = data.adresse;
    if (data.profession) formData.profession = data.profession;
    if (data.numero_passeport) formData.numero_passeport = data.numero_passeport;
    if (data.pays_emetteur) formData.pays_emetteur = data.pays_emetteur;
    if (data.autorite_emetteur) formData.autorite_emetteur = data.autorite_emetteur;

    this.identiteForm.patchValue(formData);
  }

  /**
   * Ferme l'interface OCR et réinitialise
   */
  cancelOCR(): void {
    this.selectedImageFile = null;
    this.selectedImagePreview = null;
    this.extractedText = null;
    this.parsedPassportData = null;
    this.ocrErrorMessage = null;
    this.ocrSuccessMessage = null;
    this.showOcrResults = false;
    this.isProcessingOCR = false;
    
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }

  /**
   * Utilise les données OCR et ferme l'interface
   */
  useOCRData(): void {
    this.cancelOCR();
  }

  // ==================== HELPER FUNCTIONS ====================

  private resetForm(): void {
    this.identiteForm.reset({
      sexe: '',
      nationalite: '',
      pays_emetteur: ''
    });
    this.error = null;
    this.cancelOCR();
  }

  private openModal(modalId: string): void {
    const modalElement = document.getElementById(modalId);
    if (modalElement) {
      const modal = new (window as any).bootstrap.Modal(modalElement);
      modal.show();
    }
  }

  formatDate(date: Date | string | undefined): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('fr-FR');
  }

  getStatValue(stat: any, field: string): number {
    if (!stat || !stat[field]) return 0;
    return stat[field];
  }

  getSexeCount(sexe: 'M' | 'F'): number {
    if (!this.identiteStats || !this.identiteStats.par_sexe) return 0;
    const stat = this.identiteStats.par_sexe.find((s: any) => s.sexe === sexe);
    return stat ? stat.count : 0;
  }
}

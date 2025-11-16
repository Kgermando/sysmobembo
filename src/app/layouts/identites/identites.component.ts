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
    'nom', 'prenom', 'sexe', 'nationalite', 
    'numero_passeport', 'date_naissance', 'pays_emetteur', 'actions'
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

  // Filters
  searchTerm = '';
  selectedNationalite = '';
  selectedSexe = '';
  selectedNom = '';
  selectedPrenom = '';

  // Filter expand state
  filtersExpanded = false;

  // Options pour les filtres
  sexeOptions = [
    { value: 'M', label: 'Masculin' },
    { value: 'F', label: 'Féminin' }
  ];

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
      if (this.selectedNom) filters.nom = this.selectedNom;
      if (this.selectedPrenom) filters.prenom = this.selectedPrenom;
      if (this.selectedNationalite) filters.nationalite = this.selectedNationalite;
      if (this.selectedSexe) filters.sexe = this.selectedSexe;

      const response = await firstValueFrom(
        this.identiteService.getPaginatedIdentites(this.current_page, this.page_size, filters)
          .pipe(takeUntil(this.destroy$))
      );

      if (response.status === 'success') {
        this.identites = response.data.identites;
        this.dataList = response.data.identites;
        this.dataSource.data = response.data.identites;
        this.total_records = response.data.total;
        this.current_page = response.data.page;
        this.page_size = response.data.limit;
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
        this.closeModal('identiteModal');
        this.resetForm();
      }
    } catch (error: any) {
      this.error = error.error?.message || 'Erreur lors de la sauvegarde';
      console.error('Erreur lors de la sauvegarde:', error);
    } finally {
      this.isSaving = false;
    }
  }

  openCreateModal(): void {
    this.editingIdentite = null;
    this.resetForm();
    this.openModal('identiteModal');
  }

  openEditModal(identite: IIdentite): void {
    this.editingIdentite = identite;
    this.patchFormWithIdentite(identite);
    this.openModal('identiteModal');
  }

  openViewModal(identite: IIdentite): void {
    this.viewingIdentite = identite;
    this.openModal('viewIdentiteModal');
  }

  private patchFormWithIdentite(identite: IIdentite): void {
    const dateNaissance = identite.date_naissance ? 
      new Date(identite.date_naissance).toISOString().split('T')[0] : '';

    this.identiteForm.patchValue({
      nom: identite.nom,
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

  applyFilters(): void {
    this.current_page = 1;
    this.loadData();
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.selectedNationalite = '';
    this.selectedSexe = '';
    this.selectedNom = '';
    this.selectedPrenom = '';
    this.current_page = 1;
    this.loadData();
  }

  toggleFilters(): void {
    this.filtersExpanded = !this.filtersExpanded;
  }

  async exportToExcel(): Promise<void> {
    try {
      const filters = {
        nom: this.selectedNom,
        prenom: this.selectedPrenom,
        nationalite: this.selectedNationalite,
        sexe: this.selectedSexe
      };

      const blob = await firstValueFrom(
        this.identiteService.exportIdentitesToExcel(filters)
          .pipe(takeUntil(this.destroy$))
      );

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `identites_${new Date().getTime()}.xlsx`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error('Erreur lors de l\'export:', error);
      alert('Erreur lors de l\'export des données');
    }
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
   * Remplit le formulaire avec les données OCR extraites
   */
  private fillFormWithOCRData(data: PassportOCRData): void {
    const formData: any = {};

    if (data.nom) formData.nom = data.nom;
    if (data.prenom) formData.prenom = data.prenom;
    if (data.date_naissance) formData.date_naissance = data.date_naissance;
    if (data.lieu_naissance) formData.lieu_naissance = data.lieu_naissance;
    if (data.sexe) formData.sexe = data.sexe;
    if (data.nationalite) formData.nationalite = data.nationalite;
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

  private closeModal(modalId: string): void {
    const modalElement = document.getElementById(modalId);
    if (modalElement) {
      const modal = (window as any).bootstrap.Modal.getInstance(modalElement);
      if (modal) {
        modal.hide();
      }
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

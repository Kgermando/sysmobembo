import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize } from 'rxjs/operators';

import { MotifDeplacementService, IMotifDeplacementFormData } from '../../../core/migration/motif-deplacement.service';
import { IMotifDeplacement } from '../../../shared/models/migrant.model';

@Component({
  selector: 'app-motifs-deplacement',
  standalone: false,
  templateUrl: './motifs-deplacement.component.html',
  styleUrls: ['./motifs-deplacement.component.scss']
})
export class MotifsDeplacementComponent implements OnInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  displayedColumns: string[] = [
    'code',
    'libelle_fr',
    'libelle_en',
    'categorie',
    'priorite',
    'actif',
    'actions'
  ];

  dataSource = new MatTableDataSource<IMotifDeplacement>();
  motifForm: FormGroup;
  searchForm: FormGroup;
  
  isLoading = false;
  isModalOpen = false;
  editingMotif: IMotifDeplacement | null = null;
  
  // Statistics
  stats = {
    total: 0,
    active: 0,
    inactive: 0,
    by_category: {} as any,
    by_priority: {} as any
  };

  // Categories
  categories: string[] = [];

  // Pagination
  currentPage = 1;
  pageSize = 15;
  totalItems = 0;

  constructor(
    private fb: FormBuilder,
    private motifService: MotifDeplacementService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    this.motifForm = this.fb.group({
      code: ['', [Validators.required, Validators.pattern(/^[A-Z0-9_]+$/)]],
      libelle_fr: ['', Validators.required],
      libelle_en: [''],
      description: [''],
      categorie: ['', Validators.required],
      priorite: [1, [Validators.required, Validators.min(1), Validators.max(10)]],
      actif: [true]
    });

    this.searchForm = this.fb.group({
      search: [''],
      categorie: [''],
      actif: [''],
      priorite_min: [''],
      priorite_max: ['']
    });
  }

  ngOnInit(): void {
    this.loadMotifs();
    this.loadCategories();
    this.loadStats();
  }

  loadMotifs(): void {
    this.isLoading = true;
    
    const searchValue = this.searchForm.get('search')?.value;
    const filters = {
      categorie: this.searchForm.get('categorie')?.value,
      actif: this.searchForm.get('actif')?.value
    };

    if (searchValue) {
      this.motifService.searchMotifs(searchValue)
        .pipe(finalize(() => this.isLoading = false))
        .subscribe({
          next: (response) => {
            if (response.success) {
              this.dataSource.data = response.data;
              this.totalItems = response.data.length;
            }
          },
          error: (error) => {
            console.error('Error searching motifs:', error);
            this.showMessage('Erreur lors de la recherche', 'error');
          }
        });
    } else {
      this.motifService.getPaginatedMotifs(this.currentPage, this.pageSize, filters.categorie, filters.actif)
        .pipe(finalize(() => this.isLoading = false))
        .subscribe({
          next: (response) => {
            this.dataSource.data = response.data;
            this.totalItems = response.total;
            this.dataSource.paginator = this.paginator;
          },
          error: (error) => {
            console.error('Error loading motifs:', error);
            this.showMessage('Erreur lors du chargement', 'error');
          }
        });
    }
  }

  loadCategories(): void {
    this.motifService.getCategories().subscribe({
      next: (response) => {
        if (response.success) {
          this.categories = response.data;
        }
      },
      error: (error) => {
        console.error('Error loading categories:', error);
      }
    });
  }

  loadStats(): void {
    this.motifService.getMotifsStats().subscribe({
      next: (response) => {
        if (response.success) {
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
    this.loadMotifs();
  }

  onSearch(): void {
    this.currentPage = 1;
    this.loadMotifs();
  }

  clearSearch(): void {
    this.searchForm.reset();
    this.loadMotifs();
  }

  openCreateModal(): void {
    this.editingMotif = null;
    this.motifForm.reset();
    this.motifForm.patchValue({
      priorite: 1,
      actif: true
    });
    this.isModalOpen = true;
  }

  openEditModal(motif: IMotifDeplacement): void {
    this.editingMotif = motif;
    this.motifForm.patchValue({
      code: motif.code,
      libelle_fr: motif.libelle_fr,
      libelle_en: motif.libelle_en,
      description: motif.description,
      categorie: motif.categorie,
      priorite: motif.priorite,
      actif: motif.actif
    });
    this.isModalOpen = true;
  }

  async saveMotif(): Promise<void> {
    if (this.motifForm.valid) {
      const formData: IMotifDeplacementFormData = this.motifForm.value;
      
      // Validate code uniqueness for new motifs
      if (!this.editingMotif) {
        try {
          const validation = await this.motifService.validateCode(formData.code).toPromise();
          if (validation && !validation.available) {
            this.showMessage('Ce code existe déjà', 'error');
            return;
          }
        } catch (error) {
          console.error('Error validating code:', error);
        }
      }
      
      if (this.editingMotif) {
        this.motifService.updateMotif(this.editingMotif.uuid, formData)
          .subscribe({
            next: (response) => {
              if (response.success) {
                this.showMessage('Motif mis à jour avec succès');
                this.closeModal();
                this.loadMotifs();
                this.loadStats();
              }
            },
            error: (error) => {
              console.error('Error updating motif:', error);
              this.showMessage('Erreur lors de la mise à jour', 'error');
            }
          });
      } else {
        this.motifService.createMotif(formData)
          .subscribe({
            next: (response) => {
              if (response.success) {
                this.showMessage('Motif créé avec succès');
                this.closeModal();
                this.loadMotifs();
                this.loadStats();
              }
            },
            error: (error) => {
              console.error('Error creating motif:', error);
              this.showMessage('Erreur lors de la création', 'error');
            }
          });
      }
    }
  }

  toggleMotifStatus(motif: IMotifDeplacement): void {
    this.motifService.toggleMotifStatus(motif.uuid, !motif.actif)
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.showMessage(`Motif ${!motif.actif ? 'activé' : 'désactivé'} avec succès`);
            this.loadMotifs();
            this.loadStats();
          }
        },
        error: (error) => {
          console.error('Error toggling motif status:', error);
          this.showMessage('Erreur lors du changement de statut', 'error');
        }
      });
  }

  deleteMotif(motif: IMotifDeplacement): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce motif de déplacement ?')) {
      this.motifService.deleteMotif(motif.uuid)
        .subscribe({
          next: (response) => {
            if (response.success) {
              this.showMessage('Motif supprimé avec succès');
              this.loadMotifs();
              this.loadStats();
            }
          },
          error: (error) => {
            console.error('Error deleting motif:', error);
            this.showMessage('Erreur lors de la suppression', 'error');
          }
        });
    }
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.editingMotif = null;
    this.motifForm.reset();
  }

  getPriorityColor(priority: number): string {
    if (priority >= 8) return 'danger';
    if (priority >= 6) return 'warning';
    if (priority >= 4) return 'primary';
    return 'success';
  }

  getPriorityLabel(priority: number): string {
    if (priority >= 8) return 'Critique';
    if (priority >= 6) return 'Élevée';
    if (priority >= 4) return 'Moyenne';
    return 'Faible';
  }

  getCategoryColor(category: string): string {
    const colors: { [key: string]: string } = {
      'economique': 'primary',
      'politique': 'danger',
      'sociale': 'success',
      'environnementale': 'warning',
      'securitaire': 'accent',
      'familiale': 'info'
    };
    return colors[category.toLowerCase()] || 'secondary';
  }

  private showMessage(message: string, type: string = 'success'): void {
    this.snackBar.open(message, 'Fermer', {
      duration: 3000,
      panelClass: type === 'error' ? 'error-snackbar' : 'success-snackbar'
    });
  }
}

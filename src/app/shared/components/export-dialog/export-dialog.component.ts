import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatRadioModule } from '@angular/material/radio';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';

export interface ExportDialogData {
  totalProducts: number;
  filteredProducts: number;
  currency: string;
}

export interface ExportOptions {
  exportType: 'all' | 'filtered' | 'custom';
  includeImages: boolean;
  includeStats: boolean;
  columns: string[];
  filters: {
    stockFaible: boolean;
    stockEndommage: boolean;
    margeNegative: boolean;
    produitActif: boolean;
  };
  
}

@Component({
  selector: 'app-export-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatRadioModule,
    MatCheckboxModule,
    MatButtonModule
  ],
  template: `
    <div class="export-dialog">
      <h2 mat-dialog-title class="dialog-title">
        <i class="ti ti-file-type-xls text-green me-2"></i>
        Options d'Export Excel
      </h2>
      
      <mat-dialog-content class="dialog-content">
        <form [formGroup]="exportForm" class="export-form">
          
          <!-- Type d'export -->
          <div class="form-section">
            <h4>Type d'export</h4>
            <mat-radio-group formControlName="exportType" class="radio-group">
              <mat-radio-button value="all" class="radio-option">
                <div class="radio-content">
                  <span class="radio-title">Tous les produits</span>
                  <span class="radio-description">{{data.totalProducts}} produits</span>
                </div>
              </mat-radio-button>
              
              <mat-radio-button value="filtered" class="radio-option">
                <div class="radio-content">
                  <span class="radio-title">Résultats de recherche</span>
                  <span class="radio-description">{{data.filteredProducts}} produits</span>
                </div>
              </mat-radio-button>
              
              <mat-radio-button value="custom" class="radio-option">
                <div class="radio-content">
                  <span class="radio-title">Export personnalisé</span>
                  <span class="radio-description">Appliquer des filtres spécifiques</span>
                </div>
              </mat-radio-button>
            </mat-radio-group>
          </div>

          <!-- Filtres personnalisés -->
          <div class="form-section" *ngIf="exportForm.get('exportType')?.value === 'custom'">
            <h4>Filtres spécifiques</h4>
            <div class="filters-grid">
              <mat-checkbox formControlName="stockFaible">
                <span class="checkbox-label">
                  <i class="ti ti-alert-triangle text-warning me-1"></i>
                  Stock faible (&lt; 10)
                </span>
              </mat-checkbox>
              
              <mat-checkbox formControlName="stockEndommage">
                <span class="checkbox-label">
                  <i class="ti ti-shield-x text-danger me-1"></i>
                  Stock endommagé
                </span>
              </mat-checkbox>
              
              <mat-checkbox formControlName="margeNegative">
                <span class="checkbox-label">
                  <i class="ti ti-trending-down text-danger me-1"></i>
                  Marge négative
                </span>
              </mat-checkbox>
              
              <mat-checkbox formControlName="produitActif">
                <span class="checkbox-label">
                  <i class="ti ti-check text-success me-1"></i>
                  Produits actifs uniquement
                </span>
              </mat-checkbox>
            </div>
          </div>

          <!-- Options supplémentaires -->
          <div class="form-section">
            <h4>Options supplémentaires</h4>
            <div class="options-grid">
              <mat-checkbox formControlName="includeStats">
                <span class="checkbox-label">
                  <i class="ti ti-chart-bar text-blue me-1"></i>
                  Inclure les statistiques
                </span>
              </mat-checkbox>
              
              <mat-checkbox formControlName="includeImages" [disabled]="true">
                <span class="checkbox-label">
                  <i class="ti ti-photo text-gray me-1"></i>
                  Inclure les images (bientôt)
                </span>
              </mat-checkbox>
            </div>
          </div>

          <!-- Colonnes à exporter -->
          <div class="form-section">
            <h4>Colonnes à exporter</h4>
            <div class="columns-grid">
              <mat-checkbox 
                *ngFor="let column of availableColumns" 
                [checked]="selectedColumns.includes(column.key)"
                (change)="toggleColumn(column.key)">
                <span class="checkbox-label">{{column.label}}</span>
              </mat-checkbox>
            </div>
          </div>

        </form>
      </mat-dialog-content>
      
      <mat-dialog-actions class="dialog-actions">
        <button mat-button (click)="onCancel()" class="cancel-btn">
          <i class="ti ti-x me-1"></i>
          Annuler
        </button>
        
        <button mat-raised-button color="primary" (click)="onExport()" class="export-btn">
          <i class="ti ti-download me-1"></i>
          Exporter Excel
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .export-dialog {
      width: 500px;
      max-width: 90vw;
    }

    .dialog-title {
      display: flex;
      align-items: center;
      color: #2c5aa0;
      margin-bottom: 0;
    }

    .dialog-content {
      max-height: 70vh;
      overflow-y: auto;
    }

    .export-form {
      padding: 0;
    }

    .form-section {
      margin-bottom: 24px;
      padding: 16px;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      background: #f9f9f9;
    }

    .form-section h4 {
      margin: 0 0 16px 0;
      color: #333;
      font-weight: 600;
      font-size: 14px;
    }

    .radio-group {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .radio-option {
      border: 1px solid #ddd;
      border-radius: 6px;
      padding: 12px;
      background: white;
      transition: all 0.2s ease;
    }

    .radio-option:hover {
      background: #f5f5f5;
      border-color: #2c5aa0;
    }

    .radio-option.mat-radio-checked {
      border-color: #2c5aa0;
      background: #e3f2fd;
    }

    .radio-content {
      display: flex;
      flex-direction: column;
      margin-left: 8px;
    }

    .radio-title {
      font-weight: 500;
      color: #333;
    }

    .radio-description {
      font-size: 12px;
      color: #666;
      margin-top: 2px;
    }

    .filters-grid, .options-grid, .columns-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 12px;
      margin-top: 8px;
    }

    .columns-grid {
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      font-size: 14px;
    }

    .mat-mdc-checkbox {
      margin-bottom: 0;
    }

    .dialog-actions {
      padding: 16px 24px;
      border-top: 1px solid #e0e0e0;
      display: flex;
      gap: 12px;
      justify-content: flex-end;
    }

    .cancel-btn {
      color: #666;
    }

    .export-btn {
      background: #2c5aa0;
      color: white;
    }

    .export-btn:hover {
      background: #1e3f73;
    }

    .text-warning { color: #ff9800 !important; }
    .text-danger { color: #f44336 !important; }
    .text-success { color: #4caf50 !important; }
    .text-blue { color: #2196f3 !important; }
    .text-green { color: #4caf50 !important; }
    .text-gray { color: #9e9e9e !important; }
  `]
})
export class ExportDialogComponent implements OnInit {
  
  exportForm!: FormGroup;
  selectedColumns: string[] = [];
  
  availableColumns = [
    { key: 'reference', label: 'Référence' },
    { key: 'name', label: 'Nom du produit' },
    { key: 'description', label: 'Description' },
    { key: 'unite_vente', label: 'Unité de vente' },
    { key: 'prix_vente', label: 'Prix de vente' },
    { key: 'prix_achat', label: 'Prix d\'achat' },
    { key: 'marge', label: 'Marge bénéficiaire' },
    { key: 'tva', label: 'TVA' },
    { key: 'remise', label: 'Remise' },
    { key: 'stock', label: 'Stock disponible' },
    { key: 'stock_endommage', label: 'Stock endommagé' },
    { key: 'restitution', label: 'Restitution' },
    { key: 'valeur_stock', label: 'Valeur du stock' },
    { key: 'dates', label: 'Dates création/modification' }
  ];

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<ExportDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ExportDialogData
  ) { }

  ngOnInit(): void {
    this.initializeForm();
    this.initializeColumns();
  }

  private initializeForm(): void {
    this.exportForm = this.fb.group({
      exportType: ['all'],
      includeStats: [true],
      includeImages: [false],
      stockFaible: [false],
      stockEndommage: [false],
      margeNegative: [false],
      produitActif: [true]
    });
  }

  private initializeColumns(): void {
    // Sélectionner toutes les colonnes par défaut
    this.selectedColumns = this.availableColumns.map(col => col.key);
  }

  toggleColumn(columnKey: string): void {
    const index = this.selectedColumns.indexOf(columnKey);
    if (index > -1) {
      this.selectedColumns.splice(index, 1);
    } else {
      this.selectedColumns.push(columnKey);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onExport(): void {
    const formValue = this.exportForm.value;
    
    const exportOptions: ExportOptions = {
      exportType: formValue.exportType,
      includeImages: formValue.includeImages,
      includeStats: formValue.includeStats,
      columns: this.selectedColumns,
      filters: {
        stockFaible: formValue.stockFaible,
        stockEndommage: formValue.stockEndommage,
        margeNegative: formValue.margeNegative,
        produitActif: formValue.produitActif
      }
    };

    this.dialogRef.close(exportOptions);
  }
}

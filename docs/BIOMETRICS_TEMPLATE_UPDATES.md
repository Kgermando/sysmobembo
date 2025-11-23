# Guide de mise à jour du template biometrics.component.html

## Modifications nécessaires pour aligner avec le backend Go

---

## 1. Section des filtres

### ❌ À SUPPRIMER
```html
<!-- Anciens filtres multiples -->
<div class="filter-section">
  <mat-form-field>
    <mat-label>UUID Migrant</mat-label>
    <input matInput [(ngModel)]="migrantUuidFilter" placeholder="UUID du migrant">
  </mat-form-field>

  <mat-form-field>
    <mat-label>Type de biométrie</mat-label>
    <mat-select [(ngModel)]="typeBiometrieFilter">
      <mat-option value="">Tous</mat-option>
      <mat-option *ngFor="let type of biometricTypes" [value]="type.value">
        {{ type.label }}
      </mat-option>
    </mat-select>
  </mat-form-field>

  <mat-form-field>
    <mat-label>Vérifié</mat-label>
    <mat-select [(ngModel)]="verifieFilter">
      <mat-option value="">Tous</mat-option>
      <mat-option value="true">Oui</mat-option>
      <mat-option value="false">Non</mat-option>
    </mat-select>
  </mat-form-field>

  <mat-form-field>
    <mat-label>Qualité</mat-label>
    <mat-select [(ngModel)]="qualiteDonneeFilter">
      <mat-option value="">Toutes</mat-option>
      <mat-option *ngFor="let quality of qualityLevels" [value]="quality.value">
        {{ quality.label }}
      </mat-option>
    </mat-select>
  </mat-form-field>

  <mat-form-field>
    <mat-label>Chiffré</mat-label>
    <mat-select [(ngModel)]="chiffreFilter">
      <mat-option value="">Tous</mat-option>
      <mat-option value="true">Oui</mat-option>
      <mat-option value="false">Non</mat-option>
    </mat-select>
  </mat-form-field>
</div>
```

### ✅ À AJOUTER
```html
<!-- Nouvelle section de recherche simplifiée -->
<div class="filter-section">
  <mat-form-field class="full-width">
    <mat-label>Rechercher</mat-label>
    <input matInput 
           [(ngModel)]="searchTerm" 
           placeholder="Rechercher par type, qualité, dispositif de capture..."
           (keyup.enter)="applyFilters()">
    <mat-icon matSuffix>search</mat-icon>
  </mat-form-field>

  <button mat-raised-button color="primary" (click)="applyFilters()">
    <mat-icon>search</mat-icon>
    Rechercher
  </button>

  <button mat-raised-button (click)="clearFilters()">
    <mat-icon>clear</mat-icon>
    Effacer
  </button>
</div>

<!-- Filtres de date pour l'export Excel -->
<div class="export-filters">
  <h3>Filtres d'export Excel</h3>
  <mat-form-field>
    <mat-label>Date de début</mat-label>
    <input matInput 
           type="date" 
           [(ngModel)]="startDate"
           placeholder="Date de début">
  </mat-form-field>

  <mat-form-field>
    <mat-label>Date de fin</mat-label>
    <input matInput 
           type="date" 
           [(ngModel)]="endDate"
           placeholder="Date de fin">
  </mat-form-field>

  <button mat-raised-button color="accent" (click)="exportToExcel()">
    <mat-icon>download</mat-icon>
    Exporter Excel
  </button>
</div>
```

---

## 2. Tableau des biométries

### ❌ Colonne à MODIFIER
```html
<!-- Ancien: afficher le nom du migrant -->
<ng-container matColumnDef="migrant_nom">
  <th mat-header-cell *matHeaderCellDef>Migrant</th>
  <td mat-cell *matCellDef="let biometric">
    {{ getMigrantName(biometric.migrant_uuid) }}
  </td>
</ng-container>
```

### ✅ Nouvelle colonne
```html
<!-- Nouveau: afficher le numéro d'identification -->
<ng-container matColumnDef="numero_identifiant">
  <th mat-header-cell *matHeaderCellDef>N° Identifiant</th>
  <td mat-cell *matCellDef="let biometric">
    {{ getMigrantNumeroIdentifiant(biometric) }}
  </td>
</ng-container>
```

---

### ❌ Colonne à SUPPRIMER
```html
<!-- Score de confiance - non utilisé sans vérification -->
<ng-container matColumnDef="score_confiance">
  <th mat-header-cell *matHeaderCellDef>Score</th>
  <td mat-cell *matCellDef="let biometric">
    <span *ngIf="biometric.score_confiance">
      {{ (biometric.score_confiance * 100) | number:'1.0-0' }}%
    </span>
    <span *ngIf="!biometric.score_confiance">-</span>
  </td>
</ng-container>
```

---

### ✅ Colonne Index du doigt (conserver)
```html
<ng-container matColumnDef="index_doigt">
  <th mat-header-cell *matHeaderCellDef>Doigt</th>
  <td mat-cell *matCellDef="let biometric">
    <span *ngIf="biometric.index_doigt">
      {{ getFingerIndexLabel(biometric.index_doigt) }}
    </span>
    <span *ngIf="!biometric.index_doigt">-</span>
  </td>
</ng-container>
```

---

### ✅ Colonne Qualité (conserver avec badge coloré)
```html
<ng-container matColumnDef="qualite_donnee">
  <th mat-header-cell *matHeaderCellDef>Qualité</th>
  <td mat-cell *matCellDef="let biometric">
    <span class="badge" [ngClass]="'badge-' + getQualityColor(biometric.qualite_donnee)">
      {{ getQualityLabel(biometric.qualite_donnee) }}
    </span>
  </td>
</ng-container>
```

---

### ✅ Colonne Vérifié (simplifier)
```html
<ng-container matColumnDef="verifie">
  <th mat-header-cell *matHeaderCellDef>Vérifié</th>
  <td mat-cell *matCellDef="let biometric">
    <mat-icon *ngIf="biometric.verifie" color="primary">check_circle</mat-icon>
    <mat-icon *ngIf="!biometric.verifie" color="warn">cancel</mat-icon>
  </td>
</ng-container>
```

---

### ✅ Colonne Chiffré (conserver)
```html
<ng-container matColumnDef="chiffre">
  <th mat-header-cell *matHeaderCellDef>Chiffré</th>
  <td mat-cell *matCellDef="let biometric">
    <mat-icon *ngIf="biometric.chiffre" color="accent">lock</mat-icon>
    <mat-icon *ngIf="!biometric.chiffre" color="warn">lock_open</mat-icon>
  </td>
</ng-container>
```

---

## 3. Actions sur les biométries

### ❌ Bouton à SUPPRIMER
```html
<!-- Bouton de vérification - fonctionnalité non disponible -->
<button mat-icon-button 
        *ngIf="canVerifyBiometric() && !biometric.verifie"
        (click)="openVerificationModal(biometric)"
        matTooltip="Vérifier">
  <mat-icon>verified_user</mat-icon>
</button>
```

### ✅ Actions à CONSERVER
```html
<ng-container matColumnDef="actions">
  <th mat-header-cell *matHeaderCellDef>Actions</th>
  <td mat-cell *matCellDef="let biometric">
    <!-- Voir les détails -->
    <button mat-icon-button 
            (click)="viewBiometric(biometric)"
            matTooltip="Voir les détails">
      <mat-icon>visibility</mat-icon>
    </button>

    <!-- Modifier (métadonnées uniquement) -->
    <button mat-icon-button 
            *ngIf="canEditBiometric()"
            (click)="openEditModal(biometric)"
            matTooltip="Modifier">
      <mat-icon>edit</mat-icon>
    </button>

    <!-- Supprimer -->
    <button mat-icon-button 
            *ngIf="canDeleteBiometric()"
            (click)="deleteBiometric(biometric)"
            matTooltip="Supprimer"
            color="warn">
      <mat-icon>delete</mat-icon>
    </button>
  </td>
</ng-container>
```

---

## 4. Modal de création/édition

### ✅ Formulaire à CONSERVER (avec ajustements)
```html
<div class="modal" *ngIf="isModalOpen">
  <div class="modal-content">
    <h2>{{ editingBiometric ? 'Modifier' : 'Ajouter' }} une biométrie</h2>
    
    <form [formGroup]="biometricForm" (ngSubmit)="saveBiometric()">
      
      <!-- Sélection du migrant -->
      <mat-form-field *ngIf="!editingBiometric">
        <mat-label>Migrant</mat-label>
        <mat-select formControlName="migrant_uuid" required>
          <mat-option *ngFor="let migrant of migrants" [value]="migrant.uuid">
            {{ migrant.numero_identifiant }} - 
            {{ migrant.identite?.nom }} {{ migrant.identite?.prenom }}
          </mat-option>
        </mat-select>
        <mat-error *ngIf="biometricForm.get('migrant_uuid')?.hasError('required')">
          Le migrant est requis
        </mat-error>
      </mat-form-field>

      <!-- Type de biométrie -->
      <mat-form-field *ngIf="!editingBiometric">
        <mat-label>Type de biométrie</mat-label>
        <mat-select formControlName="type_biometrie" required>
          <mat-option *ngFor="let type of biometricTypes" [value]="type.value">
            {{ type.label }}
          </mat-option>
        </mat-select>
      </mat-form-field>

      <!-- Index du doigt (si empreinte) -->
      <mat-form-field *ngIf="biometricForm.get('type_biometrie')?.value === 'empreinte_digitale' && !editingBiometric">
        <mat-label>Index du doigt</mat-label>
        <mat-select formControlName="index_doigt" required>
          <mat-option *ngFor="let finger of fingerIndexes" [value]="finger.value">
            {{ finger.label }}
          </mat-option>
        </mat-select>
      </mat-form-field>

      <!-- Données biométriques (uniquement création) -->
      <div *ngIf="!editingBiometric">
        <input type="file" 
               (change)="onFileSelected($event)"
               accept="image/*,.wsq"
               required>
        <mat-hint>Max 10 MB - Formats: JPG, PNG, BMP, WSQ</mat-hint>
      </div>

      <!-- Algorithme d'encodage (uniquement création) -->
      <mat-form-field *ngIf="!editingBiometric">
        <mat-label>Algorithme d'encodage</mat-label>
        <mat-select formControlName="algorithme_encodage" required>
          <mat-option *ngFor="let algo of encodingAlgorithms" [value]="algo.value">
            {{ algo.label }}
          </mat-option>
        </mat-select>
      </mat-form-field>

      <!-- Métadonnées modifiables -->
      <mat-form-field>
        <mat-label>Qualité des données</mat-label>
        <mat-select formControlName="qualite_donnee">
          <mat-option value="">Auto-évaluation</mat-option>
          <mat-option *ngFor="let quality of qualityLevels" [value]="quality.value">
            {{ quality.label }}
          </mat-option>
        </mat-select>
        <mat-hint>Laissez vide pour évaluation automatique</mat-hint>
      </mat-form-field>

      <mat-form-field>
        <mat-label>Dispositif de capture</mat-label>
        <input matInput formControlName="dispositif_capture" 
               placeholder="Ex: Scanner XYZ-123">
      </mat-form-field>

      <mat-form-field>
        <mat-label>Résolution de capture</mat-label>
        <input matInput formControlName="resolution_capture" 
               placeholder="Ex: 500 DPI">
      </mat-form-field>

      <mat-form-field>
        <mat-label>Opérateur de capture</mat-label>
        <input matInput formControlName="operateur_capture" 
               placeholder="Nom de l'opérateur">
      </mat-form-field>

      <mat-form-field *ngIf="!editingBiometric">
        <mat-label>Date de capture</mat-label>
        <input matInput type="date" formControlName="date_capture" required>
      </mat-form-field>

      <!-- Actions -->
      <div class="modal-actions">
        <button mat-raised-button type="button" (click)="closeModal()">
          Annuler
        </button>
        <button mat-raised-button color="primary" type="submit" [disabled]="isSaving">
          {{ isSaving ? 'Enregistrement...' : (editingBiometric ? 'Mettre à jour' : 'Créer') }}
        </button>
      </div>
    </form>
  </div>
</div>
```

---

## 5. Modal de vérification

### ❌ À SUPPRIMER COMPLÈTEMENT
```html
<!-- Modal de vérification - NON SUPPORTÉ PAR LE BACKEND -->
<div class="modal" *ngIf="isVerificationModalOpen">
  <div class="modal-content">
    <h2>Vérifier la biométrie</h2>
    <!-- ... contenu de vérification ... -->
  </div>
</div>
```

---

## 6. Section des statistiques

### ✅ À CONSERVER (inchangé)
```html
<div class="stats-section">
  <mat-card>
    <mat-card-header>
      <mat-card-title>Statistiques biométriques</mat-card-title>
    </mat-card-header>
    <mat-card-content>
      <div class="stats-grid">
        <!-- Total -->
        <div class="stat-item">
          <div class="stat-value">{{ stats.total_biometrics }}</div>
          <div class="stat-label">Total</div>
        </div>

        <!-- Vérifiés -->
        <div class="stat-item">
          <div class="stat-value">{{ stats.verified_biometrics }}</div>
          <div class="stat-label">Vérifiés</div>
        </div>

        <!-- Chiffrés -->
        <div class="stat-item">
          <div class="stat-value">{{ stats.encrypted_biometrics }}</div>
          <div class="stat-label">Chiffrés</div>
        </div>

        <!-- Score moyen -->
        <div class="stat-item">
          <div class="stat-value">
            {{ (stats.avg_confidence_score * 100) | number:'1.0-0' }}%
          </div>
          <div class="stat-label">Score moyen</div>
        </div>
      </div>

      <!-- Répartition par type -->
      <div class="stat-chart">
        <h4>Répartition par type</h4>
        <div *ngFor="let type of stats.biometric_types" class="chart-item">
          <span>{{ getBiometricTypeLabel(type.type_biometrie) }}</span>
          <span class="count">{{ type.count }}</span>
        </div>
      </div>

      <!-- Répartition par qualité -->
      <div class="stat-chart">
        <h4>Répartition par qualité</h4>
        <div *ngFor="let quality of stats.quality_distribution" class="chart-item">
          <span class="badge" [ngClass]="'badge-' + getQualityColor(quality.qualite_donnee)">
            {{ getQualityLabel(quality.qualite_donnee) }}
          </span>
          <span class="count">{{ quality.count }}</span>
        </div>
      </div>
    </mat-card-content>
  </mat-card>
</div>
```

---

## 7. Styles CSS recommandés

```scss
// Styles pour la section de recherche
.filter-section {
  display: flex;
  gap: 1rem;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;

  .full-width {
    flex: 1;
    min-width: 300px;
  }
}

// Styles pour les filtres d'export
.export-filters {
  background: #f5f5f5;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;

  h3 {
    margin: 0 0 1rem 0;
    font-size: 1rem;
    color: #666;
  }

  display: flex;
  gap: 1rem;
  align-items: center;
  flex-wrap: wrap;
}

// Styles pour les badges de qualité
.badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 500;
  
  &.badge-success {
    background: #4caf50;
    color: white;
  }
  
  &.badge-primary {
    background: #2196f3;
    color: white;
  }
  
  &.badge-warn {
    background: #ff9800;
    color: white;
  }
  
  &.badge-danger {
    background: #f44336;
    color: white;
  }
  
  &.badge-secondary {
    background: #9e9e9e;
    color: white;
  }
}

// Styles pour les statistiques
.stats-section {
  margin-bottom: 2rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-item {
  text-align: center;
  padding: 1rem;
  background: #f5f5f5;
  border-radius: 8px;

  .stat-value {
    font-size: 2rem;
    font-weight: bold;
    color: #2196f3;
  }

  .stat-label {
    color: #666;
    margin-top: 0.5rem;
  }
}

.stat-chart {
  margin-top: 1.5rem;

  h4 {
    margin-bottom: 1rem;
    color: #333;
  }

  .chart-item {
    display: flex;
    justify-content: space-between;
    padding: 0.5rem;
    border-bottom: 1px solid #eee;

    .count {
      font-weight: bold;
      color: #2196f3;
    }
  }
}
```

---

## 8. Messages d'information à ajouter

```html
<!-- Informations sur le chiffrement automatique -->
<mat-card class="info-card" *ngIf="!editingBiometric">
  <mat-icon color="accent">lock</mat-icon>
  <p>
    <strong>Sécurité:</strong> Les données biométriques seront automatiquement 
    chiffrées avec AES-256 lors de la création.
  </p>
</mat-card>

<!-- Informations sur l'évaluation automatique -->
<mat-card class="info-card">
  <mat-icon color="primary">auto_awesome</mat-icon>
  <p>
    <strong>Qualité:</strong> La qualité des données sera automatiquement 
    évaluée en fonction de la taille et du type de biométrie si non spécifiée.
  </p>
</mat-card>

<!-- Note sur la modification -->
<mat-card class="warning-card" *ngIf="editingBiometric">
  <mat-icon color="warn">info</mat-icon>
  <p>
    <strong>Attention:</strong> Seules les métadonnées peuvent être modifiées. 
    Les données biométriques ne peuvent pas être changées après création.
  </p>
</mat-card>
```

---

## Résumé des modifications

✅ **À faire:**
1. Remplacer les filtres multiples par une recherche unique
2. Ajouter les filtres de date pour l'export Excel
3. Changer la colonne `migrant_nom` en `numero_identifiant`
4. Supprimer la colonne `score_confiance`
5. Supprimer le bouton "Vérifier" dans les actions
6. Supprimer complètement le modal de vérification
7. Ajouter des messages informatifs sur le chiffrement et l'évaluation automatique
8. Mettre à jour les styles CSS

✅ **À conserver:**
- Formulaire de création/édition
- Section des statistiques
- Pagination
- Colonnes: type, qualité, doigt, vérifié, chiffré, dispositif, date
- Actions: voir, modifier, supprimer

❌ **À supprimer:**
- Tous les filtres individuels (migrant, type, vérifié, etc.)
- Modal et fonctionnalité de vérification
- Colonne score de confiance
- Méthode `getMigrantName()`

---

## Test checklist

- [ ] La recherche fonctionne correctement
- [ ] Les filtres de date pour l'export sont fonctionnels
- [ ] Le numéro d'identification s'affiche correctement
- [ ] Le formulaire de création envoie les bonnes données
- [ ] Le formulaire d'édition ne modifie que les métadonnées
- [ ] Les badges de qualité s'affichent avec les bonnes couleurs
- [ ] Les icônes de chiffrement/vérification s'affichent
- [ ] L'export Excel fonctionne avec les dates
- [ ] Les statistiques s'affichent correctement
- [ ] La pagination fonctionne
- [ ] Les messages d'information sont visibles

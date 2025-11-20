# Changements Appliqués - Module Migrants

## Date: 20 novembre 2025

## Résumé

Le module Migrants a été mis à jour pour s'aligner avec le nouveau backend Go qui utilise une architecture séparée avec le modèle `Identite`.

---

## 🔄 Changements Architecturaux

### Backend (Go)

**Avant:**
- Modèle `Migrant` contenait tous les champs (identité + migration)

**Après:**
- **Modèle `Identite`:** Gère les informations personnelles et documents
- **Modèle `Migrant`:** Gère uniquement les informations de migration
- **Relation:** `Migrant.IdentiteUUID` → `Identite.UUID`

---

## 📝 Modifications du Frontend

### 1. Modèle de Données (`IMigrant`)

#### Champs SUPPRIMÉS (maintenant dans `IIdentite`)
```typescript
// ❌ SUPPRIMÉS
nom: string
postnom?: string
prenom: string
date_naissance: Date
lieu_naissance: string
sexe: 'M' | 'F'
nationalite: string
type_document: string
numero_document: string
date_emission_document?: Date
date_expiration_document?: Date
pays_origine: string
```

#### Champs AJOUTÉS
```typescript
// ✅ AJOUTÉS
identite_uuid: string           // REQUIS - Référence vers Identite
identite?: IIdentite            // Relation chargée via Preload
```

#### Champs CONSERVÉS
```typescript
// Informations de migration
statut_migratoire: 'regulier' | 'irregulier' | 'demandeur_asile' | 'refugie'
date_entree?: Date
point_entree?: string
pays_destination?: string

// Contact
telephone?: string
email?: string
adresse_actuelle?: string
ville_actuelle?: string
pays_actuel?: string

// Famille
situation_matrimoniale?: 'celibataire' | 'marie' | 'divorce' | 'veuf'
nombre_enfants?: number
personne_contact?: string
telephone_contact?: string

// Métadonnées
numero_identifiant: string      // Auto-généré par backend: MIG-YYYY-XXXXXX
actif: boolean
```

### 2. Formulaire (`migrants.component.ts`)

#### Champs du FormGroup

**SUPPRIMÉS:**
```typescript
// ❌ Ne sont plus dans le formulaire Migrant
nom, postnom, prenom, date_naissance, lieu_naissance, 
sexe, nationalite, type_document, numero_document, 
date_emission_document, date_expiration_document, pays_origine
```

**AJOUTÉS:**
```typescript
// ✅ Nouveau champ REQUIS
identite_uuid: ['', Validators.required]
```

**CONSERVÉS:**
```typescript
// Contact
telephone, email, adresse_actuelle, ville_actuelle, pays_actuel

// Famille
situation_matrimoniale, nombre_enfants, personne_contact, telephone_contact

// Migration
statut_migratoire: ['', Validators.required]
date_entree, point_entree, pays_destination

// Métadonnées
actif: [true]
// Note: numero_identifiant n'est PAS dans le formulaire (auto-généré)
```

#### Nouvelles Méthodes

```typescript
// Gestion des identités
loadIdentites(): Promise<void>
filterIdentites(searchTerm: string): void
getIdentiteDisplayName(identite: IIdentite): string
```

### 3. Template HTML (`migrants.component.html`)

#### Formulaire de Création

**Section Identité (NOUVEAU):**
```html
<!-- Sélection de l'identité -->
<div class="col-12">
  <label class="form-label">Sélectionner une identité *</label>
  
  <!-- Recherche -->
  <input type="text" 
         [(ngModel)]="identiteSearchTerm"
         (ngModelChange)="filterIdentites($event)"
         placeholder="Rechercher par nom, prénom, passeport...">
  
  <!-- Dropdown -->
  <select formControlName="identite_uuid">
    <option value="">-- Sélectionner une identité --</option>
    <option *ngFor="let identite of filteredIdentites" 
            [value]="identite.uuid">
      {{ getIdentiteDisplayName(identite) }}
    </option>
  </select>
</div>
```

**Champs Migration (CONSERVÉS):**
- Statut migratoire (REQUIS)
- Date d'entrée
- Point d'entrée (Province)
- Pays de destination

**Champs Contact (CONSERVÉS):**
- Téléphone, Email, Adresse, Ville, Pays actuel

**Champs Famille (CONSERVÉS):**
- Situation matrimoniale, Nombre enfants, Contacts

#### Formulaire d'Édition

**Identité en Lecture Seule:**
```html
<div class="card bg-light mb-3" *ngIf="editingMigrant && editingMigrant.identite">
  <div class="card-body">
    <h6>Informations d'identité (lecture seule)</h6>
    <p><strong>Nom:</strong> {{ editingMigrant.identite.nom }}</p>
    <p><strong>Prénom:</strong> {{ editingMigrant.identite.prenom }}</p>
    <p><strong>Sexe:</strong> {{ editingMigrant.identite.sexe === 'M' ? 'Masculin' : 'Féminin' }}</p>
    <p><strong>Date naissance:</strong> {{ editingMigrant.identite.date_naissance | date }}</p>
    <p><strong>Nationalité:</strong> {{ editingMigrant.identite.nationalite }}</p>
    <p><strong>N° Passeport:</strong> {{ editingMigrant.identite.numero_passeport }}</p>
    
    <input type="hidden" formControlName="identite_uuid">
  </div>
</div>
```

#### Affichage Liste

**Colonnes MODIFIÉES:**
```html
<!-- Nom Complet -->
<td>
  <strong>{{ element.identite?.prenom }} {{ element.identite?.nom }}</strong>
  <div class="text-muted small">{{ element.numero_identifiant }}</div>
</td>

<!-- Sexe -->
<td>
  <span class="badge">{{ element.identite?.sexe === 'M' ? 'Masculin' : 'Féminin' }}</span>
</td>

<!-- Nationalité -->
<td>{{ element.identite?.nationalite }}</td>

<!-- Date naissance -->
<td>{{ element.identite?.date_naissance | date: 'dd/MM/yyyy' }}</td>

<!-- Pays d'origine (utilise nationalité) -->
<td>{{ element.identite?.nationalite }}</td>
```

#### Modal Détails

**Section Identité:**
```html
<div class="col-md-6">
  <h6>Informations personnelles</h6>
  <p><strong>Nom:</strong> {{ viewingMigrant.identite?.nom || '-' }}</p>
  <p><strong>Prénom:</strong> {{ viewingMigrant.identite?.prenom || '-' }}</p>
  <p><strong>Date naissance:</strong> {{ viewingMigrant.identite?.date_naissance | date }}</p>
  <p><strong>Lieu naissance:</strong> {{ viewingMigrant.identite?.lieu_naissance || '-' }}</p>
  <p><strong>Sexe:</strong> {{ viewingMigrant.identite?.sexe === 'M' ? 'Masculin' : 'Féminin' }}</p>
  <p><strong>Nationalité:</strong> {{ viewingMigrant.identite?.nationalite || '-' }}</p>
</div>

<div class="col-md-6">
  <h6>Documents</h6>
  <p><strong>Type:</strong> Passeport</p>
  <p><strong>N° Passeport:</strong> {{ viewingMigrant.identite?.numero_passeport || '-' }}</p>
  <p><strong>Pays émetteur:</strong> {{ viewingMigrant.identite?.pays_emetteur || '-' }}</p>
  <p><strong>Autorité:</strong> {{ viewingMigrant.identite?.autorite_emetteur || '-' }}</p>
</div>
```

### 4. Filtres

#### Filtres AJOUTÉS
```typescript
selectedPaysOrigine = ''
selectedTypeDocument = ''
```

#### Template Filtres
```html
<!-- Pays d'origine -->
<select [(ngModel)]="selectedPaysOrigine" (change)="applyFilters()">
  <option value="">Tous les pays</option>
  <option *ngFor="let pays of paysOrigineOptions" [value]="pays">{{ pays }}</option>
</select>

<!-- Type de document -->
<select [(ngModel)]="selectedTypeDocument" (change)="applyFilters()">
  <option value="">Tous les types</option>
  <option *ngFor="let type of typeDocumentOptions" [value]="type.value">{{ type.label }}</option>
</select>
```

### 5. Export Excel

**Filtres Simplifiés:**
```typescript
const exportFilters: {
  nom?: string;
  prenom?: string;
  nationalite?: string;
  statut_migratoire?: string;
  pays_origine?: string;
  sexe?: string;
  actif?: string;
} = {};
```

**Note:** Le backend gère maintenant:
- Toutes les colonnes (Identite + Migrant)
- Mise en forme Excel professionnelle
- Feuille de statistiques automatique

---

## 🔧 Fonctionnalités Backend Utilisées

### Routes API

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/migrants/paginate` | Liste paginée avec filtres |
| GET | `/migrants/all` | Tous les migrants |
| GET | `/migrants/get/:uuid` | Un migrant spécifique |
| POST | `/migrants/create` | Créer un migrant |
| PUT | `/migrants/update/:uuid` | Modifier un migrant |
| DELETE | `/migrants/delete/:uuid` | Supprimer un migrant |
| GET | `/migrants/stats` | Statistiques |
| GET | `/migrants/export/excel` | Export Excel |

### Filtres Supportés

**Via Query Params (`/migrants/paginate`):**
- `page` - Numéro de page (défaut: 1)
- `limit` - Taille de page (défaut: 15)
- `search` - Recherche globale sur nom, prenom, numero_identifiant, nationalite, numero_document
- `statut_migratoire` - regulier, irregulier, demandeur_asile, refugie
- `nationalite` - Nationalité (via JOIN sur Identite)
- `pays_origine` - Pays d'origine (utilise nationalite)
- `sexe` - M, F (via JOIN sur Identite)
- `actif` - true, false
- `type_document` - Type de document
- `date_creation_debut` - Format YYYY-MM-DD
- `date_creation_fin` - Format YYYY-MM-DD
- `date_naissance_debut` - Format YYYY-MM-DD (via JOIN sur Identite)
- `date_naissance_fin` - Format YYYY-MM-DD (via JOIN sur Identite)

### Réponse Backend

```json
{
  "status": "success",
  "message": "Migrants retrieved successfully",
  "data": [
    {
      "uuid": "...",
      "numero_identifiant": "MIG-2025-000001",
      "identite_uuid": "...",
      "identite": {
        "uuid": "...",
        "nom": "Doe",
        "prenom": "John",
        "sexe": "M",
        "date_naissance": "1990-01-01T00:00:00Z",
        "nationalite": "Congolaise",
        "numero_passeport": "CD123456"
      },
      "statut_migratoire": "regulier",
      "telephone": "+243...",
      "actif": true
    }
  ],
  "pagination": {
    "total_records": 150,
    "total_pages": 10,
    "current_page": 1,
    "page_size": 15
  },
  "applied_filters": {
    "search": "",
    "statut_migratoire": "regulier"
  }
}
```

---

## ✅ Validation Frontend

### Champs REQUIS
- ✅ `identite_uuid` - Identité du migrant
- ✅ `statut_migratoire` - Statut migratoire

### Champs OPTIONNELS avec Validation
- Email: Format email valide
- Nombre enfants: ≥ 0

### Champs AUTO-GÉNÉRÉS par Backend
- ❌ `numero_identifiant` - NE PAS ENVOYER lors de la création
- ❌ `uuid` - Généré automatiquement
- ❌ `created_at`, `updated_at` - Gérés par le backend

---

## 🎯 Workflow Utilisateur

### Création d'un Migrant

1. **Étape 1:** Sélectionner une identité
   - Rechercher par nom, prénom, ou passeport
   - Sélectionner dans la liste
   - OU créer nouvelle identité (module Identite)

2. **Étape 2:** Remplir informations migratoires
   - Statut migratoire (REQUIS)
   - Date entrée, point entrée, destination (optionnels)

3. **Étape 3:** Ajouter informations contact/famille (optionnels)
   - Téléphone, email, adresse
   - Situation matrimoniale, enfants, contacts

4. **Étape 4:** Soumettre
   - Backend génère `numero_identifiant` automatiquement
   - Format: `MIG-YYYY-XXXXXX`

### Édition d'un Migrant

1. **Identité:** Affichée en lecture seule
   - Pour modifier: Rediriger vers module Identite

2. **Champs éditables:** Uniquement champs Migrant
   - Contact, Famille, Migration, Statut

### Suppression

- Soft delete (avec `deleted_at`)
- Relations CASCADE automatiques

---

## 📊 Statistiques

### Cartes Affichées

```typescript
{
  total_migrants: 150,       // Total de tous les migrants
  active_migrants: 142,      // Migrants actifs uniquement
  regular_migrants: 85,      // Statut: regulier
  irregular_migrants: 45,    // Statut: irregulier
  refugee_migrants: 15,      // Statut: refugie
  asylum_seekers: 5          // Statut: demandeur_asile
}
```

### Affichage

- 6 cartes colorées en haut de page
- Icônes appropriées pour chaque carte
- Actualisation automatique

---

## 🚨 Points d'Attention

### ⚠️ IMPORTANT

1. **Identité Requise**
   - Impossible de créer un migrant sans identité
   - Toujours vérifier que `identite_uuid` est fourni

2. **NumeroIdentifiant Auto-généré**
   - NE JAMAIS envoyer ce champ lors de la création
   - Le backend le génère au format `MIG-YYYY-XXXXXX`

3. **Modification Identité**
   - Les champs d'identité NE PEUVENT PAS être modifiés via le formulaire Migrant
   - Rediriger vers le module Identite pour toute modification

4. **Type Document**
   - Tous les documents sont maintenant des "Passeport"
   - Champ `type_document` supprimé du modèle

5. **Pays d'Origine**
   - Utilise maintenant la `nationalite` de l'Identite
   - Pas de champ séparé `pays_origine` dans Migrant

### 🔒 Sécurité

- Email unique (si fourni)
- Validation côté backend ET frontend
- Soft delete pour garder l'historique

---

## 📚 Documentation Complémentaire

- **Architecture complète:** Voir `MIGRATION_BACKEND_ALIGNMENT.md`
- **Modèles TypeScript:** `src/app/shared/models/migrant.model.ts`
- **Service API:** `src/app/core/migration/migrant.service.ts`
- **Composant:** `src/app/layouts/migrants/migrants.component.ts`

---

## ✨ Prochaines Étapes

### Tests à Effectuer

- [ ] Création avec identité existante
- [ ] Création avec nouvelle identité
- [ ] Édition (vérifier identité en lecture seule)
- [ ] Suppression
- [ ] Filtres (tous les cas)
- [ ] Export Excel
- [ ] Affichage statistiques
- [ ] Pagination
- [ ] Recherche globale

### Améliorations Futures

- [ ] Bouton "Créer nouvelle identité" dans formulaire Migrant
- [ ] Autocomplete pour recherche identité
- [ ] Validation temps réel sur email unique
- [ ] Prévisualisation avant export Excel
- [ ] Graphiques pour statistiques
- [ ] Import Excel en masse

---

**Date:** 20 novembre 2025  
**Version:** 2.0  
**Statut:** ✅ Alignement Backend Complet

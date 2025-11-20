# 🔄 Migration Backend - Module Migrants

## Vue d'ensemble

Le module **Migrants** a été complètement refondu pour s'aligner avec la nouvelle architecture backend Go qui utilise une séparation des responsabilités via le modèle **Identite**.

---

## 📊 Architecture

### Avant (Monolithique)

```
┌─────────────────────────────┐
│       Modèle MIGRANT        │
│                             │
│  • Identité (nom, prénom)   │
│  • Documents (passeport)    │
│  • Migration (statut)       │
│  • Contact                  │
│  • Famille                  │
└─────────────────────────────┘
```

### Après (Séparation des Responsabilités)

```
┌──────────────────┐         ┌──────────────────┐
│  Modèle IDENTITE │◄────────│  Modèle MIGRANT  │
│                  │ 1     N │                  │
│  • Nom, Prénom   │         │  • Statut migr.  │
│  • Date naissance│         │  • Contact       │
│  • Sexe          │         │  • Famille       │
│  • Nationalité   │         │  • Migration     │
│  • Passeport     │         │  • N° auto-gen   │
└──────────────────┘         └──────────────────┘
```

**Avantages:**
- ✅ Réutilisation des identités (un migrant peut avoir plusieurs statuts)
- ✅ Données d'identité normalisées et validées
- ✅ Meilleure séparation des responsabilités
- ✅ Facilite la gestion des documents d'identité

---

## 🎯 Changements Clés

### 1. Formulaire de Création

**AVANT:**
- Tous les champs dans un seul formulaire

**APRÈS:**
```
┌─────────────────────────────────────┐
│  1️⃣  SÉLECTION IDENTITÉ (REQUIS)    │
│  ├── Recherche: Nom, Prénom, Pass.  │
│  ├── Dropdown: Liste identités      │
│  └── Bouton: Créer nouvelle identité│
├─────────────────────────────────────┤
│  2️⃣  INFORMATIONS MIGRATOIRES        │
│  ├── Statut (REQUIS)                │
│  ├── Date entrée                    │
│  ├── Point entrée                   │
│  └── Pays destination               │
├─────────────────────────────────────┤
│  3️⃣  CONTACT (Optionnel)             │
│  ├── Téléphone, Email               │
│  └── Adresse, Ville, Pays           │
├─────────────────────────────────────┤
│  4️⃣  FAMILLE (Optionnel)             │
│  ├── Situation matrimoniale         │
│  ├── Nombre enfants                 │
│  └── Contacts urgence               │
└─────────────────────────────────────┘
```

### 2. Formulaire d'Édition

**Identité = LECTURE SEULE**

```
┌─────────────────────────────────────┐
│  🔒 IDENTITÉ (Lecture seule)        │
│                                     │
│  Nom: John DOE                      │
│  Prénom: John                       │
│  Sexe: Masculin                     │
│  Date naissance: 15/01/1990         │
│  Nationalité: Congolaise            │
│  N° Passeport: CD123456789          │
│                                     │
│  [Modifier identité] → Module Identite
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  ✏️  CHAMPS ÉDITABLES               │
│                                     │
│  • Migration (statut, dates, etc.)  │
│  • Contact (tél, email, adresse)    │
│  • Famille (situation, enfants)     │
│  • Statut actif                     │
└─────────────────────────────────────┘
```

### 3. Affichage Liste

**Colonnes principales:**

| Nom Complet | Sexe | Nationalité | N° Identifiant | Statut | Date Naissance | Actif |
|-------------|------|-------------|----------------|--------|----------------|-------|
| John DOE | M | Congolaise | MIG-2025-000001 | Régulier | 15/01/1990 | ✅ |

**Source des données:**
- `Nom Complet` → `migrant.identite.prenom + migrant.identite.nom`
- `Sexe` → `migrant.identite.sexe`
- `Nationalité` → `migrant.identite.nationalite`
- `Date Naissance` → `migrant.identite.date_naissance`
- `N° Identifiant` → `migrant.numero_identifiant` (auto-généré)
- `Statut` → `migrant.statut_migratoire`
- `Actif` → `migrant.actif`

---

## 🔧 Modifications Techniques

### Modèle TypeScript

**Champs SUPPRIMÉS de `IMigrant`:**
```typescript
❌ nom: string
❌ postnom?: string
❌ prenom: string
❌ date_naissance: Date
❌ lieu_naissance: string
❌ sexe: 'M' | 'F'
❌ nationalite: string
❌ type_document: string
❌ numero_document: string
❌ date_emission_document?: Date
❌ date_expiration_document?: Date
❌ pays_origine: string
```

**Champs AJOUTÉS à `IMigrant`:**
```typescript
✅ identite_uuid: string        // REQUIS - Clé étrangère
✅ identite?: IIdentite         // Relation chargée via Preload
```

**Champs CONSERVÉS dans `IMigrant`:**
```typescript
✅ numero_identifiant: string   // AUTO-GÉNÉRÉ: MIG-YYYY-XXXXXX
✅ statut_migratoire: string    // REQUIS
✅ date_entree?: Date
✅ point_entree?: string
✅ pays_destination?: string
✅ telephone?: string
✅ email?: string
✅ adresse_actuelle?: string
✅ ville_actuelle?: string
✅ pays_actuel?: string
✅ situation_matrimoniale?: string
✅ nombre_enfants?: number
✅ personne_contact?: string
✅ telephone_contact?: string
✅ actif: boolean
```

### FormGroup

**AVANT (30+ contrôles):**
```typescript
this.fb.group({
  nom: ['', Validators.required],
  prenom: ['', Validators.required],
  date_naissance: ['', Validators.required],
  sexe: ['', Validators.required],
  nationalite: ['', Validators.required],
  type_document: [''],
  numero_document: [''],
  // ... 20+ autres champs
})
```

**APRÈS (15 contrôles):**
```typescript
this.fb.group({
  identite_uuid: ['', Validators.required],  // ✅ Nouveau
  statut_migratoire: ['', Validators.required],
  date_entree: [''],
  point_entree: [''],
  pays_destination: [''],
  telephone: [''],
  email: ['', Validators.email],
  adresse_actuelle: [''],
  ville_actuelle: [''],
  pays_actuel: [''],
  situation_matrimoniale: [''],
  nombre_enfants: [0],
  personne_contact: [''],
  telephone_contact: [''],
  actif: [true]
})
```

---

## 📡 API Backend

### Routes Utilisées

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/migrants/paginate` | Liste paginée + filtres |
| GET | `/migrants/all` | Tous les migrants |
| GET | `/migrants/get/:uuid` | Un migrant spécifique |
| POST | `/migrants/create` | Créer un migrant |
| PUT | `/migrants/update/:uuid` | Modifier un migrant |
| DELETE | `/migrants/delete/:uuid` | Supprimer (soft delete) |
| GET | `/migrants/stats` | Statistiques |
| GET | `/migrants/export/excel` | Export Excel |

### Filtres Backend

**Query Parameters supportés:**
```
?page=1
&limit=15
&search=John                    // Recherche globale
&statut_migratoire=regulier
&nationalite=Congolaise         // Via JOIN Identite
&pays_origine=Congo             // Utilise nationalite
&sexe=M                         // Via JOIN Identite
&actif=true
&type_document=passport
&date_creation_debut=2024-01-01
&date_creation_fin=2024-12-31
&date_naissance_debut=1990-01-01  // Via JOIN Identite
&date_naissance_fin=1995-12-31
```

### Réponse Type

```json
{
  "status": "success",
  "message": "Migrants retrieved successfully",
  "data": [
    {
      "uuid": "abc-123",
      "numero_identifiant": "MIG-2025-000001",
      "identite_uuid": "def-456",
      "identite": {
        "uuid": "def-456",
        "nom": "Doe",
        "prenom": "John",
        "sexe": "M",
        "date_naissance": "1990-01-15T00:00:00Z",
        "nationalite": "Congolaise",
        "numero_passeport": "CD123456789"
      },
      "statut_migratoire": "regulier",
      "telephone": "+243 999 123 456",
      "email": "john.doe@example.com",
      "actif": true,
      "created_at": "2025-11-20T10:00:00Z"
    }
  ],
  "pagination": {
    "total_records": 150,
    "total_pages": 10,
    "current_page": 1,
    "page_size": 15
  }
}
```

---

## 📊 Statistiques

### Cartes Affichées

```
┌──────────────┬──────────────┬──────────────┐
│   TOTAL      │    ACTIFS    │   RÉGULIERS  │
│     150      │     142      │      85      │
│   Primary    │   Success    │    Info      │
└──────────────┴──────────────┴──────────────┘

┌──────────────┬──────────────┬──────────────┐
│ IRRÉGULIERS  │  RÉFUGIÉS    │  DEMANDEURS  │
│     45       │      15      │       5      │
│   Warning    │  Secondary   │    Dark      │
└──────────────┴──────────────┴──────────────┘
```

### Endpoint Stats

```
GET /migrants/stats
```

**Réponse:**
```json
{
  "status": "success",
  "data": {
    "total_migrants": 150,
    "active_migrants": 142,
    "regular_migrants": 85,
    "irregular_migrants": 45,
    "refugee_migrants": 15,
    "asylum_seekers": 5
  }
}
```

---

## 📥 Export Excel

### Fonctionnalités

✅ **Feuille "Migrants":**
- En-tête principal avec date/heure
- 29 colonnes (Identite + Migrant)
- Mise en forme professionnelle
- Bordures et couleurs
- Dates formatées DD/MM/YYYY
- Colonnes auto-ajustées

✅ **Feuille "Statistiques":**
- Total enregistrements
- Migrants actifs/inactifs
- Répartition par statut migratoire
- Répartition par sexe
- Top 10 nationalités
- Top 10 pays d'origine

### Filtres Export

```typescript
exportMigrantsToExcel({
  nom: 'Doe',
  prenom: 'John',
  nationalite: 'Congolaise',
  statut_migratoire: 'regulier',
  pays_origine: 'Congo',
  sexe: 'M',
  actif: 'true'
})
```

### Fichier Généré

```
migrants-export-20251120-143052.xlsx

📄 Migrants (150 lignes)
│  N° Identifiant │ Nom │ Prénom │ ... │
│  MIG-2025-000001│ Doe │  John  │ ... │

📊 Statistiques
│  Total: 150
│  Actifs: 142
│  Par statut: ...
```

---

## 🔐 Validation

### Création

**Champs REQUIS:**
- ✅ `identite_uuid` - Identité du migrant
- ✅ `statut_migratoire` - Statut migratoire

**Validation Optionnelle:**
- Email: Format valide si fourni
- Nombre enfants: ≥ 0

**Validation Backend:**
- Identité existe en base
- Email unique (si fourni)
- Statut migratoire valide: `regulier | irregulier | demandeur_asile | refugie`
- Situation matrimoniale valide: `celibataire | marie | divorce | veuf`

### Modification

**Champs NON modifiables:**
- ❌ `numero_identifiant` - Auto-généré, ne change jamais
- ❌ `identite_uuid` - Pas de changement d'identité
- ❌ Tout champ dans `identite.*` - Modifier via module Identite

**Champs modifiables:**
- ✅ Statut migratoire
- ✅ Contact (tél, email, adresse, etc.)
- ✅ Famille
- ✅ Migration (dates, lieux, destination)
- ✅ Statut actif

---

## 🎨 UI/UX

### Workflow Création

```
1. Clic "Ajouter migrant"
   ↓
2. Modal s'ouvre
   ↓
3. Rechercher identité
   ├── Trouve → Sélectionner
   └── Pas trouvé → Créer nouvelle identité
   ↓
4. Remplir champs migration (REQUIS)
   ↓
5. Remplir contact/famille (Optionnel)
   ↓
6. Soumettre
   ↓
7. Backend génère MIG-2025-XXXXXX
   ↓
8. Migrant créé ✅
```

### Workflow Édition

```
1. Clic "Modifier"
   ↓
2. Modal s'ouvre
   ↓
3. Identité affichée (🔒 lecture seule)
   ↓
4. Modifier champs migration/contact/famille
   ↓
5. Soumettre
   ↓
6. Migrant mis à jour ✅
   (Identité inchangée)
```

---

## 📚 Documentation

### Fichiers Créés

1. **`MIGRATION_BACKEND_ALIGNMENT.md`**
   - Architecture détaillée
   - Mapping champs ancien/nouveau
   - Checklist de migration
   - Recommandations UI/UX

2. **`CHANGEMENTS_MIGRANTS_MODULE.md`**
   - Liste exhaustive des changements
   - Modifications code TypeScript
   - Modifications template HTML
   - Exemples de code

3. **`GUIDE_TEST_MIGRANTS.md`**
   - 16 scénarios de test détaillés
   - Résultats attendus
   - Erreurs courantes et solutions
   - Checklist de validation

4. **Ce fichier (README)**
   - Vue d'ensemble rapide
   - Diagrammes architecturaux
   - Référence rapide

---

## ✅ Checklist de Migration

### Code
- [x] Modèle `IMigrant` mis à jour
- [x] Relation `identite?: IIdentite` ajoutée
- [x] FormGroup simplifié (15 contrôles vs 30+)
- [x] Service `IdentiteService` créé
- [x] Méthodes gestion identités ajoutées

### Template
- [x] Formulaire création avec sélection identité
- [x] Formulaire édition avec identité en lecture seule
- [x] Affichage liste utilise `migrant.identite.*`
- [x] Modal détails séparé identité/migration
- [x] Filtres alignés avec backend
- [x] Export Excel fonctionnel

### Fonctionnalités
- [x] Statistiques (6 cartes)
- [x] Pagination
- [x] Filtres multiples
- [x] Recherche globale
- [x] Export Excel avec statistiques
- [x] Motifs de déplacement (modal)
- [x] Soft delete

### Tests
- [ ] Test création avec identité existante
- [ ] Test création avec nouvelle identité
- [ ] Test édition
- [ ] Test suppression
- [ ] Test filtres
- [ ] Test export
- [ ] Test validation
- [ ] Test erreurs

---

## 🚀 Prochaines Étapes

1. **Tester tous les scénarios** → Voir `GUIDE_TEST_MIGRANTS.md`
2. **Ajouter bouton "Créer identité"** dans formulaire migrant
3. **Implémenter autocomplete** pour recherche identité
4. **Ajouter validation temps réel** email unique
5. **Créer graphiques** pour statistiques
6. **Implémenter import Excel** en masse

---

## 🆘 Support

### Documentation
- Architecture: `MIGRATION_BACKEND_ALIGNMENT.md`
- Changements: `CHANGEMENTS_MIGRANTS_MODULE.md`
- Tests: `GUIDE_TEST_MIGRANTS.md`

### Code
- Modèle: `src/app/shared/models/migrant.model.ts`
- Service: `src/app/core/migration/migrant.service.ts`
- Composant: `src/app/layouts/migrants/migrants.component.ts`
- Template: `src/app/layouts/migrants/migrants.component.html`

### Backend (Go)
- Modèle: `models/migrant.go`, `models/identite.go`
- Controller: `controllers/migrants/`
- Routes: `routes/routes.go`

---

**✨ Migration réussie! Le module Migrants est maintenant aligné avec le backend Go.**

---

📅 **Date:** 20 novembre 2025  
🔢 **Version:** 2.0  
👤 **Auteur:** System Migration Team

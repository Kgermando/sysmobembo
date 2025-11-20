# Alignement Frontend Angular avec Backend Go - Module Migrants

## Vue d'ensemble

Ce document décrit les modifications nécessaires pour aligner le frontend Angular avec le nouveau backend Go qui utilise le modèle `Identite` séparé.

## Architecture Backend

### Modèle Migrant (Go)

```go
type Migrant struct {
    UUID      string
    CreatedAt time.Time
    UpdatedAt time.Time
    DeletedAt gorm.DeletedAt

    NumeroIdentifiant string // Auto-généré: MIG-YYYY-XXXXXX

    // Relation avec Identite (IMPORTANT!)
    IdentiteUUID string
    Identite     Identite

    // Informations de contact
    Telephone       string
    Email           string
    AdresseActuelle string
    VilleActuelle   string
    PaysActuel      string

    // Informations familiales
    SituationMatrimoniale string // celibataire, marie, divorce, veuf
    NombreEnfants         int
    PersonneContact       string
    TelephoneContact      string

    // Statut migration
    StatutMigratoire string // regulier, irregulier, demandeur_asile, refugie
    DateEntree       *time.Time
    PointEntree      string
    PaysDestination  string

    // Relations
    MotifDeplacements []MotifDeplacement
    Alertes           []Alert
    Biometries        []Biometrie
    Geolocalisations  []Geolocalisation

    // Métadonnées
    Actif bool
}
```

### Modèle Identite (Go)

```go
type Identite struct {
    UUID      string
    CreatedAt time.Time
    UpdatedAt time.Time
    DeletedAt gorm.DeletedAt

    // Informations personnelles
    Nom            string
    Postnom        string
    Prenom         string
    DateNaissance  time.Time
    LieuNaissance  string
    Sexe           string // M, F
    Nationalite    string
    Adresse        string
    Profession     string

    // Document d'identité (Passeport)
    PaysEmetteur      string
    AutoriteEmetteur  string
    NumeroPasseport   string
}
```

## Changements Clés

### 1. Séparation des Champs

**Avant (Frontend):**
- Tous les champs étaient dans le modèle Migrant

**Après (Backend Go):**
- Champs d'identité → Table `Identite` (séparée)
- Champs de migration → Table `Migrant`

### 2. Champs Migrés vers Identite

Les champs suivants ne sont PLUS dans `Migrant`, mais dans `Identite`:
- `nom`
- `postnom`
- `prenom`
- `date_naissance`
- `lieu_naissance`
- `sexe`
- `nationalite`
- `profession`
- `numero_passeport`
- `pays_emetteur`
- `autorite_emetteur`

**Champs supprimés du modèle Migrant:**
- `type_document` (tous les documents sont des passeports maintenant)
- `numero_document` (remplacé par `numero_passeport` dans Identite)
- `date_emission_document` (non utilisé)
- `date_expiration_document` (non utilisé)
- `pays_origine` (utilise `nationalite` d'Identite)

### 3. Génération Automatique

**NumeroIdentifiant:**
- **Avant:** Géré par le frontend
- **Après:** Auto-généré par le backend au format `MIG-YYYY-XXXXXX`
- **Action Frontend:** Ne PAS envoyer ce champ lors de la création

### 4. Filtres Backend Disponibles

Le backend supporte les filtres suivants via la route `/migrants/paginate`:

**Filtres directs (sur table Migrant):**
- `search` - Recherche globale sur nom, prenom, numero_identifiant, nationalite, numero_document
- `statut_migratoire` - regulier, irregulier, demandeur_asile, refugie
- `actif` - true, false

**Filtres via JOIN (sur table Identite):**
- `nationalite` - Nationalité du migrant
- `pays_origine` - Pays d'origine (utilise nationalite)
- `sexe` - M, F
- `type_document` - Type de document (toujours "Passeport" maintenant)

**Filtres par dates:**
- `date_creation_debut` - Format: YYYY-MM-DD
- `date_creation_fin` - Format: YYYY-MM-DD
- `date_naissance_debut` - Format: YYYY-MM-DD
- `date_naissance_fin` - Format: YYYY-MM-DD

## Modifications Frontend Requises

### 1. Formulaire de Création/Édition

**À FAIRE:**

1. **Ajouter un sélecteur d'Identite:**
   - Charger la liste des identités disponibles
   - Permettre la sélection via dropdown
   - Afficher: `Nom Prenom - N°Passeport (Nationalité)`

2. **En mode création:**
   - Afficher le sélecteur d'identité (REQUIS)
   - Les champs d'identité ne sont PAS éditables ici
   - Suggestion: Ajouter un bouton "Créer nouvelle identité" qui ouvre le formulaire Identite

3. **En mode édition:**
   - Afficher les informations d'identité en **LECTURE SEULE**
   - Ne permettre que la modification des champs du modèle Migrant:
     - Contact (téléphone, email, adresse, ville, pays)
     - Famille (situation matrimoniale, nombre enfants, contacts)
     - Migration (statut, date entrée, point entrée, destination)
     - Métadonnées (actif)

4. **Validation:**
   - `identite_uuid` est REQUIS
   - `statut_migratoire` est REQUIS
   - Validation email (si fourni)
   - `nombre_enfants` ≥ 0

### 2. Affichage dans la Liste

**Colonnes à afficher:**
- Nom Complet: `migrant.identite.prenom + migrant.identite.nom`
- N° Identifiant: `migrant.numero_identifiant` (auto-généré)
- Sexe: `migrant.identite.sexe`
- Nationalité: `migrant.identite.nationalite`
- Date naissance: `migrant.identite.date_naissance`
- Statut migratoire: `migrant.statut_migratoire`
- Pays d'origine: `migrant.identite.nationalite` (même valeur)
- Statut actif: `migrant.actif`

### 3. Export Excel

**Backend gère:**
- Toutes les colonnes (Identite + Migrant)
- Feuille de statistiques automatique
- Mise en forme professionnelle

**Frontend doit:**
- Appeler `/migrants/export/excel` avec filtres
- Recevoir le fichier `.xlsx`
- Déclencher le téléchargement

**Filtres supportés pour export:**
- `nom`, `prenom`, `nationalite`, `statut_migratoire`
- `pays_origine`, `sexe`, `actif`

### 4. Statistiques

**Endpoint:** `GET /migrants/stats`

**Statistiques retournées:**
```json
{
  "total_migrants": 150,
  "active_migrants": 142,
  "regular_migrants": 85,
  "irregular_migrants": 45,
  "refugee_migrants": 15,
  "asylum_seekers": 5
}
```

**Affichage Frontend:**
- Cartes statistiques en haut de page
- Utiliser les badges colorés selon le statut

## Workflow de Création d'un Migrant

### Option 1: Identité Existante

1. Utilisateur ouvre "Ajouter un migrant"
2. Recherche une identité existante (par nom, prénom, passeport)
3. Sélectionne l'identité
4. Remplit les champs spécifiques au migrant:
   - Contact
   - Famille
   - Statut migratoire (REQUIS)
   - Migration
5. Soumet le formulaire
6. Backend génère `numero_identifiant` automatiquement

### Option 2: Nouvelle Identité

1. Utilisateur ouvre "Ajouter un migrant"
2. Clique sur "Créer nouvelle identité"
3. **Redirection ou modal vers formulaire Identite**
4. Crée l'identité
5. **Retour automatique** avec identité pré-sélectionnée
6. Continue avec les champs migrant
7. Soumet le formulaire

## Recommandations UI/UX

### 1. Formulaire d'ajout

```html
<!-- Section Identité (REQUIS) -->
<div class="card mb-3">
  <div class="card-header">
    <h6>1. Sélectionner ou créer une identité</h6>
  </div>
  <div class="card-body">
    <!-- Recherche et sélection -->
    <input type="text" placeholder="Rechercher par nom, prénom, passeport...">
    <select formControlName="identite_uuid">
      <option>Nom Prenom - N°Passeport (Nationalité)</option>
    </select>
    
    <!-- Bouton création -->
    <button type="button" class="btn btn-outline-primary">
      + Créer nouvelle identité
    </button>
  </div>
</div>

<!-- Section Migration (REQUIS) -->
<div class="card mb-3">
  <div class="card-header">
    <h6>2. Informations migratoires</h6>
  </div>
  <div class="card-body">
    <!-- Statut migratoire, date entrée, point entrée, destination -->
  </div>
</div>

<!-- Section Contact (Optionnel) -->
<div class="card mb-3">
  <div class="card-header">
    <h6>3. Contact et famille (optionnel)</h6>
  </div>
  <div class="card-body">
    <!-- Téléphone, email, adresse, etc. -->
  </div>
</div>
```

### 2. Formulaire d'édition

```html
<!-- Identité en lecture seule -->
<div class="card bg-light mb-3">
  <div class="card-header">
    <h6>Identité (lecture seule)</h6>
  </div>
  <div class="card-body">
    <p><strong>Nom:</strong> {{ migrant.identite.nom }}</p>
    <p><strong>Prénom:</strong> {{ migrant.identite.prenom }}</p>
    <p><strong>Sexe:</strong> {{ migrant.identite.sexe }}</p>
    <p><strong>Date naissance:</strong> {{ migrant.identite.date_naissance }}</p>
    <p><strong>Nationalité:</strong> {{ migrant.identite.nationalite }}</p>
    
    <button type="button" class="btn btn-sm btn-outline-primary">
      Modifier l'identité (module Identite)
    </button>
  </div>
</div>

<!-- Champs éditables -->
<div class="card mb-3">
  <div class="card-header">
    <h6>Informations migratoires</h6>
  </div>
  <div class="card-body">
    <!-- Formulaire éditable des champs Migrant uniquement -->
  </div>
</div>
```

### 3. Affichage détails

```html
<div class="modal-body">
  <!-- Section Identité -->
  <div class="row">
    <div class="col-md-6">
      <h6>Informations personnelles</h6>
      <p><strong>Nom complet:</strong> 
         {{ migrant.identite.prenom }} {{ migrant.identite.nom }}
         <span *ngIf="migrant.identite.postnom">({{ migrant.identite.postnom }})</span>
      </p>
      <p><strong>Date naissance:</strong> {{ migrant.identite.date_naissance | date }}</p>
      <p><strong>Lieu naissance:</strong> {{ migrant.identite.lieu_naissance }}</p>
      <p><strong>Sexe:</strong> {{ migrant.identite.sexe === 'M' ? 'Masculin' : 'Féminin' }}</p>
      <p><strong>Nationalité:</strong> {{ migrant.identite.nationalite }}</p>
    </div>
    <div class="col-md-6">
      <h6>Document d'identité</h6>
      <p><strong>Type:</strong> Passeport</p>
      <p><strong>N° Passeport:</strong> {{ migrant.identite.numero_passeport }}</p>
      <p><strong>Pays émetteur:</strong> {{ migrant.identite.pays_emetteur }}</p>
      <p><strong>Autorité:</strong> {{ migrant.identite.autorite_emetteur }}</p>
    </div>
  </div>

  <!-- Section Migration -->
  <div class="row mt-3">
    <div class="col-md-6">
      <h6>Informations migratoires</h6>
      <p><strong>N° Identifiant:</strong> {{ migrant.numero_identifiant }}</p>
      <p><strong>Statut:</strong> {{ migrant.statut_migratoire | titlecase }}</p>
      <p><strong>Date entrée:</strong> {{ migrant.date_entree | date }}</p>
      <p><strong>Point entrée:</strong> {{ migrant.point_entree }}</p>
      <p><strong>Destination:</strong> {{ migrant.pays_destination }}</p>
    </div>
    <div class="col-md-6">
      <h6>Contact</h6>
      <p><strong>Téléphone:</strong> {{ migrant.telephone || '-' }}</p>
      <p><strong>Email:</strong> {{ migrant.email || '-' }}</p>
      <p><strong>Adresse:</strong> {{ migrant.adresse_actuelle || '-' }}</p>
      <p><strong>Ville:</strong> {{ migrant.ville_actuelle || '-' }}</p>
      <p><strong>Pays:</strong> {{ migrant.pays_actuel || '-' }}</p>
    </div>
  </div>
</div>
```

## Gestion des Erreurs

### Erreurs Possibles

1. **Identité non trouvée (400)**
   - Message: "Identité invalide ou inexistante"
   - Action: Vérifier la sélection de l'identité

2. **Email déjà utilisé (400)**
   - Message: "A migrant with this email already exists"
   - Action: Demander à l'utilisateur de changer l'email

3. **Validation échouée (400)**
   - Messages spécifiques par champ
   - Afficher les erreurs sous chaque champ concerné

4. **Migrant non trouvé (404)**
   - Message: "Migrant not found"
   - Action: Rediriger vers la liste

## Checklist de Migration Frontend

- [x] Mettre à jour le modèle `IMigrant` (suppression champs obsolètes)
- [x] Ajouter relation `identite?: IIdentite` dans `IMigrant`
- [x] Créer le service `IdentiteService` pour charger les identités
- [x] Mettre à jour le formulaire pour sélectionner une identité
- [x] Mettre à jour l'affichage liste (utiliser `migrant.identite.*`)
- [x] Mettre à jour les filtres (aligner avec backend)
- [x] Mettre à jour l'export Excel
- [x] Mettre à jour les statistiques
- [ ] Tester création avec identité existante
- [ ] Tester édition (identité en lecture seule)
- [ ] Tester filtres (tous les cas)
- [ ] Tester export Excel avec filtres
- [ ] Tester affichage détails
- [ ] Tester suppression
- [ ] Tester gestion erreurs

## Notes Importantes

1. **NumeroIdentifiant:** Ne JAMAIS envoyer lors de la création, c'est auto-généré
2. **Identite:** TOUJOURS inclure via Preload dans les requêtes backend
3. **Modification Identite:** Doit se faire via le module Identite, pas via Migrant
4. **Filtres:** Le backend fait des JOIN automatiques, pas besoin de logique spéciale frontend
5. **Export:** Le backend gère tout, le frontend déclenche juste le téléchargement
6. **Type Document:** Toujours "Passeport" maintenant, les autres types ne sont plus supportés

## Support et Documentation

- **Backend API:** Documentation Swagger/OpenAPI disponible
- **Modèles Go:** Voir `models/migrant.go` et `models/identite.go`
- **Routes API:** Voir `routes/routes.go`
- **Controllers:** Voir `controllers/migrants/` et `controllers/identites/`

---

**Date de création:** 20 novembre 2025  
**Version Backend:** 2.0 (avec Identite séparée)  
**Version Frontend:** Angular 18+  
**Auteur:** System Migration Team

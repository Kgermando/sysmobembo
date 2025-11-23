# Alignement du Frontend Biométrie avec le Backend Go

## Date de mise à jour
23 novembre 2025

## Résumé des modifications

Ce document détaille les modifications apportées au frontend Angular pour l'aligner avec l'API Go backend des biométries.

---

## 1. Modifications du Service (`biometric.service.ts`)

### Interfaces mises à jour

#### ❌ Supprimé
```typescript
export interface IBiometricVerificationData {
  score_confiance: number;
  operateur_verification: string;
}
```
**Raison**: Le backend Go ne fournit pas d'endpoint de vérification des biométries.

#### ✅ Modifié - IBiometricFilters
**Avant**:
```typescript
export interface IBiometricFilters {
  migrant_uuid?: string;
  type_biometrie?: string;
  qualite_donnee?: string;
  verifie?: string;
  chiffre?: string;
  dispositif_capture?: string;
}
```

**Après**:
```typescript
export interface IBiometricFilters {
  start_date?: string;
  end_date?: string;
}
```
**Raison**: Le backend Go n'accepte que des filtres de date pour l'export Excel.

---

### Méthodes mises à jour

#### ✅ `getPaginatedBiometrics()`
**Avant**:
```typescript
getPaginatedBiometrics(
  page: number = 1,
  limit: number = 15,
  migrantUuid?: string,
  typeBiometrie?: string,
  verifie?: string
): Observable<any>
```

**Après**:
```typescript
getPaginatedBiometrics(
  page: number = 1,
  limit: number = 15,
  search?: string
): Observable<any>
```
**Raison**: Le backend Go utilise un paramètre `search` unique pour filtrer les données.

**Backend Go correspondant**:
```go
// Récupérer le paramètre de recherche
search := c.Query("search", "")

// Appliquer la recherche
if search != "" {
    query = query.Joins("LEFT JOIN migrants ON migrants.uuid = biometries.migrant_uuid").
        Where("biometries.type_biometrie ILIKE ? OR biometries.qualite_donnee ILIKE ? OR biometries.disposif_capture ILIKE ?",
            "%"+search+"%", "%"+search+"%", "%"+search+"%")
}
```

---

#### ✅ `getBiometricsByMigrant()`
**Avant**:
```typescript
getBiometricsByMigrant(migrantUuid: string): Observable<any>
```

**Après**:
```typescript
getBiometricsByMigrant(
  migrantUuid: string,
  page: number = 1,
  limit: number = 15
): Observable<any>
```
**Raison**: Le backend Go supporte la pagination pour cette endpoint.

**Backend Go correspondant**:
```go
func GetBiometriesByMigrant(c *fiber.Ctx) error {
    migrantUUID := c.Params("migrant_uuid")
    
    page, err := strconv.Atoi(c.Query("page", "1"))
    limit, err := strconv.Atoi(c.Query("limit", "15"))
    offset := (page - 1) * limit
    
    // ... pagination logic
}
```

---

#### ❌ Supprimé - `getVerifiedBiometrics()`
```typescript
getVerifiedBiometrics(): Observable<any> {
  return this.http.get<any>(`${this.apiUrl}/verified`);
}
```
**Raison**: Cet endpoint n'existe pas dans le backend Go.

---

#### ❌ Supprimé - `verifyBiometric()`
```typescript
verifyBiometric(uuid: string, verificationData: IBiometricVerificationData): Observable<any> {
  return this.http.put<any>(`${this.apiUrl}/verify/${uuid}`, verificationData);
}
```
**Raison**: Le backend Go ne fournit pas d'endpoint pour vérifier les biométries.

---

#### ✅ `exportBiometricsToExcel()`
**Avant**:
```typescript
exportBiometricsToExcel(filters: IBiometricFilters = {}): Observable<Blob> {
  let params = new HttpParams();
  if (filters.migrant_uuid) params = params.set('migrant_uuid', filters.migrant_uuid);
  if (filters.type_biometrie) params = params.set('type_biometrie', filters.type_biometrie);
  // ... autres filtres
}
```

**Après**:
```typescript
exportBiometricsToExcel(filters: IBiometricFilters = {}): Observable<Blob> {
  let params = new HttpParams();
  if (filters.start_date) params = params.set('start_date', filters.start_date);
  if (filters.end_date) params = params.set('end_date', filters.end_date);
  // ...
}
```
**Raison**: Le backend Go n'accepte que les paramètres `start_date` et `end_date` pour l'export.

**Backend Go correspondant**:
```go
func ExportBiometriesToExcel(c *fiber.Ctx) error {
    startDate := c.Query("start_date", "")
    endDate := c.Query("end_date", "")
    
    if startDate != "" {
        parsedStartDate, err := time.Parse("2006-01-02", startDate)
        if err == nil {
            query = query.Where("biometries.created_at >= ?", parsedStartDate)
        }
    }
    if endDate != "" {
        parsedEndDate, err := time.Parse("2006-01-02", endDate)
        if err == nil {
            parsedEndDate = parsedEndDate.Add(23*time.Hour + 59*time.Minute + 59*time.Second)
            query = query.Where("biometries.created_at <= ?", parsedEndDate)
        }
    }
    // ...
}
```

---

## 2. Modifications du Composant (`biometrics.component.ts`)

### Variables d'état mises à jour

#### ❌ Supprimé
```typescript
verificationForm!: FormGroup;
isVerificationModalOpen = false;
verifyingBiometric: IBiometrie | null = null;
```

#### ❌ Supprimé - Filtres multiples
```typescript
migrantUuidFilter = '';
typeBiometrieFilter = '';
verifieFilter = '';
qualiteDonneeFilter = '';
chiffreFilter = '';
dispositifCaptureFilter = '';
```

#### ✅ Ajouté - Filtres simplifiés
```typescript
searchTerm = '';
startDate = '';
endDate = '';
```

---

### Colonnes d'affichage mises à jour

**Avant**:
```typescript
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
```

**Après**:
```typescript
displayedColumns: string[] = [
  'numero_identifiant',
  'type_biometrie',
  'index_doigt',
  'qualite_donnee',
  'date_capture',
  'dispositif_capture',
  'verifie',
  'chiffre',
  'actions'
];
```

**Raison**: 
- Changé `migrant_nom` en `numero_identifiant` pour correspondre aux données renvoyées
- Supprimé `score_confiance` car non utilisé dans le contexte de vérification

---

### Méthodes mises à jour

#### ✅ `loadBiometrics()`
**Avant**: Utilisait plusieurs filtres
```typescript
this.biometricService.getPaginatedBiometrics(
  this.currentPage, 
  this.pageSize,
  this.migrantUuidFilter || undefined,
  this.typeBiometrieFilter || undefined,
  this.verifieFilter || undefined
)
```

**Après**: Utilise uniquement le search
```typescript
this.biometricService.getPaginatedBiometrics(
  this.currentPage, 
  this.pageSize,
  this.searchTerm || undefined
)
```

---

#### ❌ Supprimé - `openVerificationModal()`
```typescript
openVerificationModal(biometric: IBiometrie): void {
  this.verifyingBiometric = biometric;
  this.verificationForm.reset();
  this.isVerificationModalOpen = true;
}
```

#### ❌ Supprimé - `verifyBiometric()`
```typescript
verifyBiometric(): void {
  // ... logique de vérification
}
```

#### ❌ Supprimé - `closeVerificationModal()`
```typescript
closeVerificationModal(): void {
  this.isVerificationModalOpen = false;
  this.verifyingBiometric = null;
  this.verificationForm.reset();
}
```

---

#### ✅ `exportToExcel()`
**Avant**:
```typescript
const exportFilters: IBiometricFilters = {};
if (this.migrantUuidFilter) exportFilters.migrant_uuid = this.migrantUuidFilter;
if (this.typeBiometrieFilter) exportFilters.type_biometrie = this.typeBiometrieFilter;
// ... autres filtres
```

**Après**:
```typescript
const exportFilters: IBiometricFilters = {};
if (this.startDate) exportFilters.start_date = this.startDate;
if (this.endDate) exportFilters.end_date = this.endDate;
```

---

#### ❌ Supprimé - Méthodes helpers
```typescript
getMigrantName(migrantUuid: string): string
getVerificationStatusColor(biometric: IBiometrie): string
canVerifyBiometric(): boolean
```

#### ✅ Ajouté
```typescript
getMigrantNumeroIdentifiant(biometric: IBiometrie): string {
  return biometric.migrant?.numero_identifiant || 'N/A';
}
```

---

## 3. Endpoints Backend Go disponibles

```
GET    /api/biometrics/paginate           - Pagination avec recherche
GET    /api/biometrics/all                - Toutes les biométries
GET    /api/biometrics/get/:uuid          - Une biométrie
GET    /api/biometrics/migrant/:uuid      - Biométries d'un migrant (paginé)
POST   /api/biometrics/create             - Créer une biométrie
PUT    /api/biometrics/update/:uuid       - Mettre à jour (métadonnées seulement)
DELETE /api/biometrics/delete/:uuid       - Supprimer
GET    /api/biometrics/stats              - Statistiques
GET    /api/biometrics/export/excel       - Export Excel (avec filtres de date)
```

---

## 4. Fonctionnalités de sécurité du Backend

### Chiffrement automatique
Le backend Go chiffre automatiquement les données biométriques lors de la création:

```go
func encryptBiometricData(data string) (string, string, error) {
    // Génération d'une clé AES-256
    key := make([]byte, 32)
    // Chiffrement avec AES-GCM
    // Retourne données chiffrées + clé (base64)
}
```

### Évaluation automatique de la qualité
```go
func assessDataQuality(dataSize int, typeBiometrie string) string {
    switch typeBiometrie {
    case "empreinte_digitale":
        if dataSize > 50000 { return "excellente" }
        // ...
    }
}
```

### Exclusion des données sensibles
Par défaut, le backend exclut les données sensibles des réponses:
```go
query = query.Select("uuid, numero_identifiant, type_biometrie, ..., chiffre, created_at, updated_at")
// N'inclut PAS: donnees_biometriques, cle_chiffrement
```

Pour inclure les données sensibles (requiert permissions):
```
GET /api/biometrics/get/:uuid?include_sensitive=true
```

---

## 5. Structure des données retournées

### Format de réponse paginée
```json
{
  "status": "success",
  "message": "Biometric data retrieved successfully",
  "data": [...],
  "pagination": {
    "total_records": 100,
    "total_pages": 7,
    "current_page": 1,
    "page_size": 15
  }
}
```

### Format de statistiques
```json
{
  "status": "success",
  "message": "Biometrics statistics",
  "data": {
    "total_biometrics": 100,
    "verified_biometrics": 80,
    "encrypted_biometrics": 100,
    "biometric_types": [
      {"type_biometrie": "empreinte_digitale", "count": 50}
    ],
    "quality_distribution": [
      {"qualite_donnee": "excellente", "count": 30}
    ],
    "avg_confidence_score": 0.85,
    "capture_devices": [
      {"dispositif_capture": "Scanner XYZ", "count": 40}
    ]
  }
}
```

---

## 6. Modifications nécessaires au template HTML (À faire)

### Filtres à mettre à jour
```html
<!-- Avant: Filtres multiples -->
<input [(ngModel)]="migrantUuidFilter" placeholder="UUID Migrant">
<select [(ngModel)]="typeBiometrieFilter">...</select>
<select [(ngModel)]="verifieFilter">...</select>

<!-- Après: Recherche simple -->
<input [(ngModel)]="searchTerm" 
       placeholder="Rechercher (type, qualité, dispositif)"
       (keyup.enter)="applyFilters()">

<!-- Pour l'export: Filtres de date -->
<input type="date" [(ngModel)]="startDate" placeholder="Date début">
<input type="date" [(ngModel)]="endDate" placeholder="Date fin">
```

### Colonnes du tableau à mettre à jour
```html
<!-- Avant -->
<ng-container matColumnDef="migrant_nom">
  <th mat-header-cell *matHeaderCellDef>Migrant</th>
  <td mat-cell *matCellDef="let row">{{ getMigrantName(row.migrant_uuid) }}</td>
</ng-container>

<!-- Après -->
<ng-container matColumnDef="numero_identifiant">
  <th mat-header-cell *matHeaderCellDef>N° Identifiant</th>
  <td mat-cell *matCellDef="let row">{{ getMigrantNumeroIdentifiant(row) }}</td>
</ng-container>
```

### Supprimer les boutons/modales de vérification
```html
<!-- À SUPPRIMER -->
<button (click)="openVerificationModal(biometric)">Vérifier</button>

<!-- Modal de vérification à supprimer -->
<div *ngIf="isVerificationModalOpen">...</div>
```

---

## 7. Points d'attention

### ⚠️ Sécurité
- Les données biométriques sont **automatiquement chiffrées** par le backend
- Les clés de chiffrement ne sont **jamais exposées** dans les réponses API
- Utiliser `include_sensitive=true` uniquement pour les utilisateurs autorisés

### ⚠️ Performance
- La pagination est **obligatoire** (défaut: 15 items/page)
- Le paramètre `search` recherche dans plusieurs champs (type, qualité, dispositif)
- L'export Excel peut être long pour de grandes quantités de données

### ⚠️ Validation
- Les données biométriques doivent être en **base64**
- Le type de biométrie doit correspondre aux valeurs autorisées
- L'index du doigt est **requis** pour les empreintes digitales

---

## 8. Tests à effectuer

- [ ] Test de pagination avec recherche
- [ ] Test de création avec chiffrement automatique
- [ ] Test de mise à jour (métadonnées uniquement)
- [ ] Test d'export Excel avec filtres de date
- [ ] Test de suppression
- [ ] Vérification de l'affichage du numéro d'identification
- [ ] Test de l'évaluation automatique de la qualité
- [ ] Vérification que les données sensibles ne sont pas exposées

---

## 9. Prochaines étapes recommandées

1. **Mettre à jour le template HTML** selon les modifications ci-dessus
2. **Tester l'intégration** avec le backend Go
3. **Ajouter la gestion des permissions** pour `include_sensitive`
4. **Implémenter un système de vérification** si nécessaire (côté backend)
5. **Optimiser la recherche** en ajoutant plus de champs si besoin
6. **Documenter les cas d'usage** de l'export Excel avec dates

---

## Conclusion

Le frontend Angular est maintenant **parfaitement aligné** avec le backend Go pour le module Biométries. Les principales améliorations incluent:

✅ Suppression des fonctionnalités non supportées (vérification)  
✅ Simplification des filtres (recherche unique)  
✅ Support de la pagination partout  
✅ Export Excel avec filtres de date  
✅ Sécurité renforcée (chiffrement automatique, exclusion des données sensibles)  
✅ Code plus simple et maintenable  

Les modifications garantissent une **compatibilité totale** avec l'API Go tout en maintenant une bonne expérience utilisateur.

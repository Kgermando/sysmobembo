# Intégration du Scanner Physique - Guide Complet

## 📋 Vue d'ensemble

Ce document détaille l'intégration complète du scanner physique avec le système de gestion des identités. L'implémentation permet de scanner des documents (passeports, cartes d'identité) directement depuis un scanner connecté au serveur backend, puis d'extraire automatiquement les données via OCR (Tesseract.js).

## 🔄 Flux de travail complet

```
┌─────────────────────────────────────────────────────────────────┐
│                    FLUX DU SCANNER PHYSIQUE                     │
└─────────────────────────────────────────────────────────────────┘

1. Frontend Angular
   ├─ Utilisateur clique sur "Scanner" dans l'interface
   ├─ Ouverture du modal de scanner
   └─ Chargement de la liste des scanners disponibles
        │
        ▼
2. Backend Go (GET /api/identites/scanners/list)
   ├─ Détection des scanners physiques connectés
   │  ├─ Windows: WIA (Windows Image Acquisition)
   │  └─ Linux: SANE (Scanner Access Now Easy)
   └─ Retourne la liste des scanners disponibles
        │
        ▼
3. Frontend Angular
   ├─ Affichage des scanners disponibles
   ├─ Sélection du scanner (auto-sélection si un seul)
   └─ Utilisateur place le document et clique "Lancer le scan"
        │
        ▼
4. Backend Go (POST /api/identites/scan)
   ├─ Déclenchement du scanner physique
   ├─ Capture de l'image (300 DPI, couleur, format JPEG)
   ├─ Sauvegarde dans ./scans/scan_YYYYMMDD_HHMMSS.jpg
   └─ Encodage en base64 + retour au frontend
        │
        ▼
5. Frontend Angular
   ├─ Réception de l'image base64
   ├─ Affichage de l'aperçu dans le modal
   └─ Lancement automatique du traitement OCR
        │
        ▼
6. Traitement OCR (Tesseract.js - Frontend)
   ├─ Conversion base64 → Blob → File
   ├─ Extraction du texte avec Tesseract.js
   ├─ Parsing des données (nom, prénom, dates, etc.)
   └─ Pré-remplissage du formulaire
        │
        ▼
7. Finalisation
   ├─ Fermeture automatique du modal
   ├─ Formulaire pré-rempli visible
   └─ Utilisateur vérifie/corrige et sauvegarde
```

## 🏗️ Architecture Backend (Go)

### 1. Routes API (`routes.go`)

```go
// Scanner routes
identitesGroup.Post("/scan", identites.ScanDocument)
identitesGroup.Get("/scanned-file/:filename", identites.GetScannedFile)
identitesGroup.Get("/scanners/list", identites.ListAvailableScanners)
```

### 2. Contrôleur (`identites/controller.go`)

#### **ScanDocument** - Scanner un document
```go
func ScanDocument(c *fiber.Ctx) error {
    scannerService := utils.NewScannerService("./scans")
    scannedFilePath, err := scannerService.ScanDocument()
    // ... encode en base64 et retourne
}
```

**Réponse JSON:**
```json
{
  "status": "success",
  "message": "Document scanné avec succès",
  "data": {
    "file_path": "./scans/scan_20231130_153045.jpg",
    "file_name": "scan_20231130_153045.jpg",
    "image_base64": "/9j/4AAQSkZJRgABAQEAYABgAAD...",
    "mime_type": "image/jpeg"
  }
}
```

#### **ListAvailableScanners** - Lister les scanners
```go
func ListAvailableScanners(c *fiber.Ctx) error {
    scannerService := utils.NewScannerService("./scans")
    scanners, err := scannerService.ListScanners()
    // ... retourne la liste
}
```

**Réponse JSON:**
```json
{
  "status": "success",
  "data": {
    "scanners": [
      "HP ScanJet Pro 2500 f1",
      "Canon LiDE 400"
    ],
    "count": 2
  }
}
```

### 3. Service Scanner (`utils/scanner.go`)

#### Windows (WIA - Windows Image Acquisition)
```powershell
# Script PowerShell pour scanner
$deviceManager = New-Object -ComObject WIA.DeviceManager
$device = $deviceManager.DeviceInfos.Item(1)
$scanner = $device.Connect()
$item = $scanner.Items.Item(1)

# Configuration
$item.Properties("6146").Value = 300  # Résolution DPI
$item.Properties("6147").Value = 300
$item.Properties("6148").Value = 0    # Couleur

# Scan et sauvegarde
$image = $item.Transfer("{B96B3CAE-0728-11D3-9D7B-0000F81EF32E}")
$image.SaveFile("C:\path\to\scan.jpg")
```

#### Linux (SANE)
```bash
scanimage \
  --format=jpeg \
  --resolution=300 \
  --mode=Color \
  --output=/path/to/scan.jpg
```

## 🎨 Architecture Frontend (Angular)

### 1. Service (`identite.service.ts`)

```typescript
// Interfaces
export interface IScannedFileData {
  file_path: string;
  file_name: string;
  image_base64: string;
  mime_type: string;
}

export interface IScannerResponse {
  status: string;
  message: string;
  data: IScannedFileData;
}

export interface IScannerListResponse {
  status: string;
  data: {
    scanners: string[];
    count: number;
  };
}

// Méthodes
scanDocument(): Observable<IScannerResponse>
getScannedFile(filename: string): Observable<Blob>
listAvailableScanners(): Observable<IScannerListResponse>
```

### 2. Composant (`identites.component.ts`)

#### Propriétés du scanner
```typescript
availableScanners: string[] = [];
selectedScanner: string | null = null;
isScanning = false;
isScannerModalOpen = false;
scannerError: string | null = null;
scannerSuccess: string | null = null;
scannedImageBase64: string | null = null;
scannedImagePreview: string | null = null;
```

#### Méthodes principales

**openScannerModal()** - Ouvrir le modal
```typescript
async openScannerModal(): Promise<void> {
  this.isScannerModalOpen = true;
  await this.loadAvailableScanners();
  // Afficher le modal Bootstrap
}
```

**loadAvailableScanners()** - Charger les scanners
```typescript
async loadAvailableScanners(): Promise<void> {
  const response = await this.identiteService.listAvailableScanners();
  this.availableScanners = response.data.scanners;
  this.selectedScanner = this.availableScanners[0]; // Auto-select
}
```

**triggerPhysicalScan()** - Déclencher le scan
```typescript
async triggerPhysicalScan(): Promise<void> {
  this.isScanning = true;
  const response = await this.identiteService.scanDocument();
  
  this.scannedImageBase64 = response.data.image_base64;
  this.scannedImagePreview = `data:${response.data.mime_type};base64,${response.data.image_base64}`;
  
  // Lancement automatique de l'OCR
  await this.processScannedImageWithOCR();
}
```

**processScannedImageWithOCR()** - Traiter l'image avec OCR
```typescript
async processScannedImageWithOCR(): Promise<void> {
  // Convertir base64 → File
  const blob = this.base64ToBlob(this.scannedImageBase64, 'image/jpeg');
  const file = new File([blob], 'scanned-document.jpg', { type: 'image/jpeg' });

  // Extraction avec Tesseract
  const result = await this.ocrService.extractTextFromImage(file);
  
  // Parsing des données
  this.parsedPassportData = this.passportOcrService.parsePassportText(result.text);
  
  // Pré-remplissage du formulaire
  this.fillFormWithOCRData(this.parsedPassportData);
  
  // Fermer le modal
  this.closeScannerModal();
}
```

### 3. Template HTML (`identites.component.html`)

#### Bouton Scanner (Header)
```html
<button type="button" class="btn btn-outline-info" 
        (click)="openScannerModal()" 
        [disabled]="isLoadingData || isLoading"
        title="Scanner un document">
  <i class="ti ti-scan me-1"></i>
  <span class="d-none d-md-inline">Scanner</span>
</button>
```

#### Modal du Scanner
```html
<div class="modal fade" id="scannerModal">
  <div class="modal-dialog modal-lg">
    <div class="modal-content">
      <!-- Header -->
      <div class="modal-header bg-info text-white">
        <h5><i class="ti ti-scan me-2"></i>Scanner un document</h5>
      </div>
      
      <!-- Body -->
      <div class="modal-body">
        <!-- Sélection du scanner -->
        <select [(ngModel)]="selectedScanner">
          <option *ngFor="let scanner of availableScanners">
            {{ scanner }}
          </option>
        </select>
        
        <!-- État du scan -->
        <div *ngIf="isScanning">
          <div class="spinner-border"></div>
          <p>Scan en cours...</p>
        </div>
        
        <!-- Aperçu de l'image -->
        <img *ngIf="scannedImagePreview" [src]="scannedImagePreview">
      </div>
      
      <!-- Footer -->
      <div class="modal-footer">
        <button (click)="triggerPhysicalScan()" [disabled]="isScanning">
          Lancer le scan
        </button>
      </div>
    </div>
  </div>
</div>
```

## 🔧 Configuration Requise

### Backend (Serveur)

#### Windows
- **WIA (Windows Image Acquisition)** - Inclus dans Windows
- PowerShell activé
- Scanner compatible TWAIN/WIA

#### Linux
- **SANE** installé:
  ```bash
  sudo apt-get install sane-utils
  ```
- Scanner compatible SANE
- Permissions utilisateur:
  ```bash
  sudo usermod -a -G scanner $USER
  ```

### Frontend
- Angular 15+
- Bootstrap 5 (modals)
- Tesseract.js (OCR)
- Tabler Icons

## 🚀 Utilisation

### 1. Ouvrir le modal de scanner
```typescript
// Dans l'interface, cliquer sur le bouton "Scanner"
openScannerModal()
```

### 2. Vérifier les scanners disponibles
- Le système charge automatiquement la liste
- Si aucun scanner: message d'erreur avec instructions
- Auto-sélection du premier scanner si disponible

### 3. Lancer le scan
```typescript
triggerPhysicalScan()
// 1. Appel API backend
// 2. Déclenchement du scanner physique
// 3. Capture de l'image (300 DPI)
// 4. Retour de l'image en base64
```

### 4. Traitement automatique OCR
```typescript
processScannedImageWithOCR()
// 1. Conversion base64 → File
// 2. Extraction Tesseract.js
// 3. Parsing des données
// 4. Pré-remplissage du formulaire
```

### 5. Validation et sauvegarde
- L'utilisateur vérifie les données extraites
- Corrige si nécessaire
- Sauvegarde via le formulaire standard

## ⚠️ Gestion des Erreurs

### Backend

#### Scanner non détecté
```json
{
  "status": "error",
  "message": "Aucun scanner détecté"
}
```
**Solutions:**
- Vérifier la connexion USB
- Redémarrer le scanner
- Vérifier les pilotes

#### Erreur de scan
```json
{
  "status": "error",
  "message": "Erreur lors du scan: Device not ready"
}
```
**Solutions:**
- Scanner occupé ou éteint
- Document mal positionné
- Pilotes obsolètes

### Frontend

#### Aucun scanner disponible
```typescript
if (availableScanners.length === 0) {
  scannerError = 'Aucun scanner détecté...';
}
```
**Affichage:**
- Alert avec instructions de dépannage
- Bouton "Actualiser la liste"

#### Échec OCR
```typescript
if (!result.text) {
  ocrErrorMessage = 'Aucun texte détecté';
}
```
**Solutions:**
- Vérifier la qualité de l'image
- Améliorer l'éclairage
- Repositionner le document

## 📊 Qualité du Scan

### Paramètres optimaux pour OCR

| Paramètre | Valeur | Raison |
|-----------|--------|--------|
| **Résolution** | 300 DPI | Standard OCR optimal |
| **Mode** | Couleur | Meilleure reconnaissance |
| **Format** | JPEG | Équilibre qualité/taille |
| **Compression** | ~85% | Préserver les détails |

### Recommandations

1. **Positionnement**: Document centré, sans pliures
2. **Éclairage**: Scanner fermé pour uniformité
3. **Propreté**: Vitre du scanner propre
4. **Orientation**: Document droit (non penché)

## 🔐 Sécurité

### Backend
- ✅ Validation des fichiers scannés
- ✅ Limitation de taille (max 10 MB)
- ✅ Nettoyage des fichiers temporaires
- ✅ Chemin sécurisé pour ./scans/

### Frontend
- ✅ Validation MIME type
- ✅ Timeout sur les requêtes longues
- ✅ Gestion des erreurs réseau
- ✅ Pas de stockage permanent côté client

## 📈 Performance

### Temps moyens

| Étape | Durée | Note |
|-------|-------|------|
| Liste scanners | ~500ms | Une fois par session |
| Scan physique | 3-8s | Dépend du scanner |
| Transfert base64 | ~1s | Image ~2-3 MB |
| OCR Tesseract | 5-15s | Selon qualité image |
| **Total** | **10-25s** | De scan à formulaire rempli |

### Optimisations
- ✅ Scan automatique après détection
- ✅ OCR lancé automatiquement
- ✅ Compression JPEG optimale
- ✅ Cache des scanners disponibles

## 🧪 Tests

### Test backend
```bash
# Lister les scanners
curl http://localhost:8080/api/identites/scanners/list

# Lancer un scan
curl -X POST http://localhost:8080/api/identites/scan
```

### Test frontend
```typescript
// Dans la console Chrome DevTools
// Simuler un scan
const mockResponse = {
  status: 'success',
  data: {
    image_base64: '...',
    mime_type: 'image/jpeg'
  }
};
```

## 📝 Logs et Débogage

### Backend (Go)
```go
fmt.Printf("Scanner détecté: %s\n", scannerName)
fmt.Printf("Scan terminé: %s\n", outputPath)
```

### Frontend (TypeScript)
```typescript
console.log('Scanners disponibles:', this.availableScanners);
console.log('Scan terminé:', response.data.file_name);
console.log('OCR extraction:', this.extractedText);
```

## 🎯 Résumé des Endpoints API

| Méthode | Endpoint | Description | Réponse |
|---------|----------|-------------|---------|
| POST | `/api/identites/scan` | Scanner un document | Image base64 + metadata |
| GET | `/api/identites/scanned-file/:filename` | Récupérer un fichier scanné | Blob image |
| GET | `/api/identites/scanners/list` | Lister les scanners | Liste des scanners |

## ✅ Checklist de Mise en Production

- [ ] Scanner physique connecté et testé
- [ ] Pilotes du scanner installés
- [ ] Permissions utilisateur configurées (Linux)
- [ ] Dossier `./scans/` créé avec permissions
- [ ] Tests de scan réussis (Windows/Linux)
- [ ] OCR Tesseract fonctionnel
- [ ] Gestion d'erreurs testée
- [ ] Logs activés pour monitoring
- [ ] Documentation utilisateur créée

## 🆘 Support et Dépannage

### Problème: Scanner non détecté
1. Vérifier connexion USB
2. Tester avec logiciel natif du scanner
3. Réinstaller les pilotes
4. Redémarrer le serveur backend

### Problème: Scan échoue
1. Vérifier que le scanner n'est pas occupé
2. Fermer les autres applications utilisant le scanner
3. Vérifier les logs backend
4. Tester manuellement avec scanimage (Linux) ou Paint (Windows)

### Problème: OCR ne fonctionne pas
1. Vérifier la qualité de l'image scannée
2. Augmenter la résolution (300 DPI minimum)
3. Utiliser le mode couleur
4. Vérifier que Tesseract.js est chargé

## 📚 Ressources Additionnelles

- [WIA Documentation (Windows)](https://docs.microsoft.com/en-us/windows/win32/wia/)
- [SANE Documentation (Linux)](http://www.sane-project.org/)
- [Tesseract.js](https://tesseract.projectnaptha.com/)
- [Go Fiber Framework](https://gofiber.io/)

---

**Version:** 1.0  
**Date:** 30 Novembre 2025  
**Auteur:** System Integration Team

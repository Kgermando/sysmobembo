# Scanner Physique - Guide Rapide

## 🎯 Résumé en 1 minute

Le scanner physique permet de numériser des documents (passeports, cartes d'identité) directement depuis l'interface web, puis d'extraire automatiquement les données via OCR.

## 🔄 Flux Simple

```
1. Clic "Scanner" → Ouverture modal
2. Sélection scanner → Placement document  
3. Clic "Lancer le scan" → Capture (300 DPI)
4. Backend → Retour image base64
5. OCR automatique → Extraction données
6. Formulaire pré-rempli → Vérification/Sauvegarde
```

## 🏗️ Fichiers Modifiés

### Backend Go
- ✅ `controllers/identites/controller.go` - 3 nouvelles fonctions
- ✅ `utils/scanner.go` - Service de scan (nouveau fichier)
- ✅ `routes/routes.go` - 3 nouveaux endpoints

### Frontend Angular
- ✅ `identite.service.ts` - 3 méthodes + interfaces
- ✅ `identites.component.ts` - 10+ méthodes scanner
- ✅ `identites.component.html` - Modal + bouton

## 📡 Endpoints API

```typescript
POST   /api/identites/scan              // Scanner document
GET    /api/identites/scanned-file/:id  // Récupérer fichier
GET    /api/identites/scanners/list     // Liste scanners
```

## 💻 Méthodes Principales

### Backend (Go)
```go
ScanDocument()           // Déclenche le scanner physique
ListAvailableScanners()  // Liste les scanners disponibles
GetScannedFile()         // Récupère un fichier scanné
```

### Frontend (TypeScript)
```typescript
openScannerModal()           // Ouvrir le modal
loadAvailableScanners()      // Charger les scanners
triggerPhysicalScan()        // Lancer le scan
processScannedImageWithOCR() // OCR automatique
```

## 🔧 Configuration Minimale

### Windows (Serveur Backend)
```bash
# WIA déjà inclus dans Windows
# Juste connecter le scanner USB
```

### Linux (Serveur Backend)
```bash
sudo apt-get install sane-utils
sudo usermod -a -G scanner $USER
```

### Frontend
```bash
# Déjà configuré avec Tesseract.js
# Pas de configuration supplémentaire
```

## 🚀 Utilisation Rapide

### Côté Utilisateur

1. **Ouvrir le scanner**
   - Clic bouton "Scanner" (icône scan)
   - Modal s'ouvre automatiquement

2. **Scanner le document**
   - Placer document sur le scanner
   - Cliquer "Lancer le scan"
   - Attendre 3-8 secondes

3. **Traitement automatique**
   - OCR extrait les données
   - Formulaire se remplit automatiquement
   - Vérifier et corriger si besoin

4. **Sauvegarder**
   - Clic "Enregistrer"
   - Identité créée en base

### Côté Développeur

```typescript
// Dans identites.component.ts

// 1. Ouvrir modal scanner
await this.openScannerModal();

// 2. Déclencher scan
await this.triggerPhysicalScan();

// 3. OCR automatique (appelé automatiquement)
await this.processScannedImageWithOCR();

// 4. Formulaire pré-rempli
this.fillFormWithOCRData(this.parsedPassportData);
```

## ⚡ Performances

| Étape | Temps |
|-------|-------|
| Ouverture modal | < 1s |
| Scan physique | 3-8s |
| OCR extraction | 5-15s |
| **TOTAL** | **10-25s** |

## ❌ Erreurs Courantes

### "Aucun scanner détecté"
```
Solution:
1. Vérifier connexion USB
2. Vérifier scanner allumé
3. Clic "Actualiser"
```

### "Erreur lors du scan"
```
Solution:
1. Fermer autres apps utilisant le scanner
2. Repositionner le document
3. Redémarrer le scanner
```

### "OCR: Aucun texte détecté"
```
Solution:
1. Améliorer qualité du scan
2. Nettoyer la vitre du scanner
3. Utiliser un document original (pas photocopie)
```

## 🎨 Interface Utilisateur

### Bouton Scanner
```html
<!-- Dans le header de la liste -->
<button class="btn btn-outline-info" (click)="openScannerModal()">
  <i class="ti ti-scan"></i> Scanner
</button>
```

### Modal Scanner
- **Header bleu** avec icône scan
- **Liste déroulante** des scanners disponibles
- **Bouton principal** "Lancer le scan"
- **Aperçu** de l'image scannée
- **Barre de progression** OCR

## 📊 Structure des Données

### Réponse Backend (Scan)
```json
{
  "status": "success",
  "message": "Document scanné avec succès",
  "data": {
    "file_path": "./scans/scan_20231130_153045.jpg",
    "file_name": "scan_20231130_153045.jpg",
    "image_base64": "/9j/4AAQSkZJRg...",
    "mime_type": "image/jpeg"
  }
}
```

### Données Extraites (OCR)
```typescript
{
  nom: "DUPONT",
  prenom: "Jean",
  date_naissance: "1990-05-15",
  lieu_naissance: "Paris",
  sexe: "M",
  nationalite: "Française",
  numero_passeport: "12AB34567",
  pays_emetteur: "FRA",
  date_emission: "2020-01-10",
  date_expiration: "2030-01-10"
}
```

## 🔒 Sécurité

- ✅ Fichiers scannés stockés dans `./scans/` (serveur)
- ✅ Validation MIME type (JPEG uniquement)
- ✅ Nettoyage automatique des fichiers temporaires
- ✅ Pas de stockage permanent côté client
- ✅ Transmission sécurisée via HTTPS (production)

## 🧪 Test Rapide

### Backend
```bash
# Vérifier les scanners disponibles
curl http://localhost:8080/api/identites/scanners/list

# Expected:
# { "status": "success", "data": { "scanners": [...], "count": 1 } }
```

### Frontend
```javascript
// Console Chrome DevTools
// Vérifier que le service est chargé
console.log(identiteService.scanDocument);
// Expected: function scanDocument() { ... }
```

## 📝 Checklist Installation

Backend:
- [ ] Go installé et configuré
- [ ] Scanner connecté (USB)
- [ ] Pilotes du scanner installés
- [ ] Dossier `./scans/` créé
- [ ] Backend démarré

Frontend:
- [ ] Angular 15+ installé
- [ ] Bootstrap 5 configuré
- [ ] Tesseract.js chargé
- [ ] API URL configurée

Test:
- [ ] Modal s'ouvre correctement
- [ ] Liste des scanners affichée
- [ ] Scan fonctionne
- [ ] OCR extrait les données
- [ ] Formulaire se remplit

## 🎓 Pour en Savoir Plus

Consultez le guide complet: `docs/SCANNER_INTEGRATION.md`

---

**Temps de mise en œuvre:** ~30 minutes  
**Niveau:** Intermédiaire  
**Prérequis:** Scanner physique compatible WIA (Windows) ou SANE (Linux)

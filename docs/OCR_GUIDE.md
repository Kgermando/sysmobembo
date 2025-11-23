# Guide d'utilisation de l'OCR pour le formulaire Migrant

## Fonctionnalités implémentées

### 1. Service OCR (`ocr.service.ts`)
- **Extraction de texte** : Utilise Tesseract.js pour extraire le texte des documents scannés
- **Support multilingue** : Configuré pour le français ('fra')
- **Progression en temps réel** : Observable pour suivre la progression de l'analyse
- **Parsing intelligent** : Détection automatique des champs du document

### 2. Interface utilisateur
- **Zone de téléchargement** : Upload d'images (photos de documents)
- **Aperçu de l'image** : Prévisualisation avant traitement
- **Barre de progression** : Suivi visuel du traitement OCR
- **Messages de statut** : Retours en temps réel (succès/erreur)
- **Affichage du texte extrait** : Option pour voir le texte brut détecté

### 3. Auto-complétion du formulaire
Les champs suivants sont automatiquement remplis à partir du document scanné :
- Nom et Prénom
- Date de naissance
- Lieu de naissance (Province)
- Sexe
- Nationalité
- Type de document (Passeport/Carte d'identité/Permis de conduire)
- Numéro de document
- Dates d'émission et d'expiration
- Téléphone
- Email
- Adresse actuelle

## Comment utiliser

### 1. Pour l'utilisateur final

1. **Ouvrir le formulaire migrant**
   - Cliquer sur "Ajouter un migrant"

2. **Scanner un document**
   - Dans la section "Scanner un document (OCR)", cliquer sur "Choisir une image"
   - Sélectionner une photo du passeport, carte d'identité ou autre document
   - L'image s'affiche en aperçu

3. **Traitement automatique**
   - L'OCR démarre automatiquement après sélection
   - La barre de progression indique l'avancement
   - Un message de succès apparaît avec le taux de confiance

4. **Vérifier et compléter**
   - Les champs détectés sont remplis automatiquement
   - Vérifier l'exactitude des données
   - Compléter les champs manquants manuellement
   - Soumettre le formulaire

### 2. Pour le développeur

#### Structure du code

**Service OCR** : `src/app/core/services/ocr.service.ts`
```typescript
// Méthodes principales
- extractTextFromImage(file: File): Promise<OCRResult>
- parseDocumentText(text: string): ParsedDocumentData
- detectDocumentType(text: string): string
```

**Component** : `src/app/layouts/migrants/migrants.component.ts`
```typescript
// Méthodes OCR
- onFileSelected(event: Event): void
- processOCR(): Promise<void>
- autoFillForm(data: ParsedDocumentData): void
- clearImage(): void
```

#### Patterns de reconnaissance

Le service utilise des expressions régulières pour détecter :
- Noms/Prénoms : `nom|surname|prénom|firstname`
- Dates : `DD/MM/YYYY`, `DD-MM-YYYY`, `DD.MM.YYYY`
- Sexe : `M|F|Masculin|Féminin|Male|Female`
- Documents : `Passport|Passeport|Carte d'identité`

#### Personnalisation

Pour ajouter de nouveaux patterns de reconnaissance :

```typescript
// Dans ocr.service.ts, méthode parseDocumentText()
const patterns = {
  nouveau_champ: /pattern_regex/i,
  // ...
};
```

## Formats de documents supportés

### Types d'images acceptés
- JPEG/JPG
- PNG
- WEBP
- BMP
- GIF

### Recommandations pour de meilleurs résultats

1. **Qualité de l'image**
   - Résolution minimale : 300 DPI
   - Image bien éclairée
   - Contraste élevé
   - Pas de reflets

2. **Cadrage**
   - Document complet dans le cadre
   - Angles droits (pas de perspective)
   - Texte lisible
   - Fond uni si possible

3. **Types de documents recommandés**
   - Passeport (page d'identité)
   - Carte d'identité nationale
   - Permis de conduire
   - Documents officiels avec texte imprimé

## Langues supportées

Le service est configuré pour le français, mais peut être étendu :

```typescript
// Dans ocr.service.ts
const worker = await createWorker('fra', 1, {
  // Pour ajouter d'autres langues : 'eng', 'spa', 'deu', etc.
});
```

## Dépannage

### L'OCR ne détecte aucun texte
- Vérifier la qualité de l'image
- S'assurer que le texte est net et lisible
- Éviter les images floues ou trop sombres

### Les champs ne se remplissent pas
- Le format du document peut ne pas correspondre aux patterns
- Consulter le "texte extrait" pour voir ce qui a été détecté
- Ajuster les patterns dans `parseDocumentText()`

### Performance lente
- La première initialisation prend ~2-3 secondes
- Les analyses suivantes sont plus rapides
- Réduire la taille de l'image si nécessaire

## Améliorations futures possibles

1. **Support multi-langues** : Détection automatique de la langue
2. **Templates de documents** : Reconnaissance par type de document spécifique
3. **Validation croisée** : Vérification de cohérence des données
4. **OCR côté serveur** : Pour les documents volumineux
5. **Historique de scans** : Garder trace des documents scannés
6. **Export des données** : Sauvegarde du texte extrait

## Dépendances

- **tesseract.js** : ^5.x.x
- **@angular/core** : ^19.x.x
- **rxjs** : ^7.x.x

## Performance

- **Taille du bundle** : ~2 MB (Tesseract.js inclus)
- **Temps de traitement** : 2-5 secondes par image
- **Mémoire** : ~100-200 MB pendant le traitement

## Sécurité

- Le traitement OCR est effectué côté client (navigateur)
- Aucune image n'est envoyée à un serveur externe
- Les données restent dans le navigateur
- Conformité RGPD

---

**Auteur** : Système de gestion des migrants
**Date** : Novembre 2025
**Version** : 1.0.0

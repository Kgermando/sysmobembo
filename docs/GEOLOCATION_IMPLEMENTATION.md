# Implémentation de la Géolocalisation

## Vue d'ensemble

Cette implémentation ajoute la fonctionnalité de géolocalisation complète au système Sysmobembo, permettant de :
1. Créer, modifier et supprimer des géolocalisations liées aux identités
2. Afficher les géolocalisations sur une carte interactive Google Maps
3. Exporter les données de géolocalisation vers Excel

## Architecture

### Backend API Endpoints

L'API backend fournit les endpoints suivants :

```go
geo := api.Group("/geolocations") 
    geo.Get("/coordinates", geolocation.GetCoordinatesList) 
    geo.Post("/create", geolocation.CreateGeolocalisation)
    geo.Put("/update/:uuid", geolocation.UpdateGeolocalisation)
    geo.Delete("/delete/:uuid", geolocation.DeleteGeolocalisation)
    geo.Get("/export/excel", geolocation.ExportGeolocalisationsToExcel)
```

### Modèle de données

#### IGeolocalisation
```typescript
interface IGeolocalisation {
    uuid: string;
    created_at: Date;
    updated_at: Date;
    identite_uuid: string;
    identite?: IIdentite;
    latitude: number;  // -90 to 90
    longitude: number; // -180 to 180
}
```

#### IGeolocationFormData
```typescript
interface IGeolocationFormData {
  identite_uuid: string;
  latitude: number;
  longitude: number;
}
```

#### ICoordinateData
```typescript
interface ICoordinateData {
  latitude: number;
  longitude: number;
  fullname: string;
}
```

## Composants

### 1. MigrantsComponent - Section Géolocalisation

**Fichier:** `src/app/layouts/migrants/migrants.component.ts`

#### Fonctionnalités ajoutées :

- **Formulaire de géolocalisation** : Permet de créer/modifier des géolocalisations
- **Sélection d'identité** : Dropdown pour sélectionner l'identité à géolocaliser
- **Validation des coordonnées** : 
  - Latitude : -90 à 90
  - Longitude : -180 à 180
- **Bouton d'ajout** : Dans l'en-tête de la page pour un accès rapide

#### Méthodes principales :

```typescript
openGeolocationForm(identite: IIdentite): void
prepareEditGeolocation(geolocation: IGeolocalisation): void
onSubmitGeolocation(): Promise<void>
deleteGeolocation(geolocation: IGeolocalisation): Promise<void>
resetGeolocationForm(): void
closeGeolocationModal(): void
openGeolocationModal(): void
```

#### Modal de géolocalisation :

Le modal `#geolocationModal` contient :
- Affichage de l'identité sélectionnée
- Dropdown de sélection d'identité
- Champs de latitude et longitude avec validation
- Messages d'aide et d'erreur

### 2. GeolocationsComponent - Carte Interactive

**Fichier:** `src/app/layouts/geolocations/geolocations.component.ts`

#### Fonctionnalités :

1. **Carte Google Maps** avec marqueurs pour chaque géolocalisation
2. **Info Windows** affichant le nom complet et les coordonnées au clic
3. **Ajustement automatique** du zoom pour afficher tous les marqueurs
4. **Export Excel** avec filtres de date
5. **Liste des coordonnées** sous forme de tableau

#### Configuration de la carte :

```typescript
center: google.maps.LatLngLiteral = { lat: -4.3217, lng: 15.3125 }; // Centre de la RDC
zoom = 6;
mapOptions: google.maps.MapOptions = {
    mapTypeId: 'roadmap',
    zoomControl: true,
    scrollwheel: true,
    disableDoubleClickZoom: false,
    maxZoom: 18,
    minZoom: 3,
};
```

#### Méthodes principales :

```typescript
loadCoordinates(): Promise<void>
createMarkers(): void
adjustMapCenter(): void
openInfoWindow(marker: google.maps.MarkerOptions, index: number): void
exportToExcel(): void
refreshData(): void
resetExportFilters(): void
```

## Service

### GeolocationService

**Fichier:** `src/app/core/migration/geolocation.service.ts`

#### Méthodes :

```typescript
getCoordinatesList(): Observable<IBackendApiResponse<ICoordinateData[]>>
createGeolocation(geoData: IGeolocationFormData): Observable<IBackendApiResponse<IGeolocalisation>>
updateGeolocation(uuid: string, geoData: Partial<IGeolocationFormData>): Observable<IBackendApiResponse<IGeolocalisation>>
deleteGeolocation(uuid: string): Observable<IBackendApiResponse<null>>
exportGeolocationsToExcel(startDate?: string, endDate?: string): Observable<Blob>
```

## Configuration

### 1. Google Maps API

**Important:** Vous devez configurer une clé API Google Maps valide.

#### Étapes :

1. Obtenez une clé API sur [Google Cloud Console](https://console.cloud.google.com/)
2. Activez l'API "Maps JavaScript API" et "Geocoding API"
3. Remplacez `YOUR_API_KEY_HERE` dans `src/index.html` :

```html
<script src="https://maps.googleapis.com/maps/api/js?key=VOTRE_CLE_API_ICI"></script>
```

### 2. Modules Angular

Les modules nécessaires ont été ajoutés :

**shared-advanced.module.ts:**
```typescript
import { GoogleMapsModule } from '@angular/google-maps';

@NgModule({
    exports: [
        // ... autres exports
        GoogleMapsModule,
    ],
    imports: [
        // ... autres imports
        GoogleMapsModule,
    ]
})
```

## Utilisation

### Dans le composant Migrants

1. **Ajouter une géolocalisation :**
   - Cliquez sur "Ajouter une géolocalisation" dans l'en-tête
   - Sélectionnez une identité dans le dropdown
   - Entrez les coordonnées latitude/longitude
   - Cliquez sur "Ajouter"

2. **Modifier une géolocalisation :**
   - Sélectionnez la géolocalisation à modifier
   - Modifiez les coordonnées
   - Cliquez sur "Modifier"

3. **Supprimer une géolocalisation :**
   - Cliquez sur le bouton de suppression
   - Confirmez la suppression

### Dans le composant Géolocalisations

1. **Visualiser la carte :**
   - Accédez à la page Géolocalisations
   - La carte s'affiche automatiquement avec tous les marqueurs

2. **Interagir avec les marqueurs :**
   - Cliquez sur un marqueur pour afficher l'info window
   - Utilisez les contrôles de zoom et de déplacement

3. **Exporter vers Excel :**
   - Optionnel : Définissez des filtres de date
   - Cliquez sur "Exporter Excel"
   - Le fichier sera téléchargé automatiquement

4. **Actualiser les données :**
   - Cliquez sur "Actualiser" pour recharger les données

## Format d'Export Excel

Le fichier Excel exporté contient :

### Feuille "Géolocalisations"
- UUID
- Date de création
- Numéro de passeport
- Latitude
- Longitude

### Feuille "Statistiques"
- Total des enregistrements
- Autres statistiques pertinentes

## Validation des données

### Contraintes de validation :

- **identite_uuid** : Requis, doit être un UUID valide
- **latitude** : Requis, entre -90 et 90
- **longitude** : Requis, entre -180 et 180

### Messages d'erreur :

Le système affiche des messages d'erreur clairs pour :
- Champs requis manquants
- Valeurs hors limites
- Erreurs de connexion au serveur
- Échec de création/modification/suppression

## Performance

### Optimisations :

1. **Chargement lazy** : Les marqueurs sont créés uniquement après le chargement des données
2. **Ajustement automatique** : Le zoom et le centre sont calculés pour afficher tous les marqueurs
3. **Info windows** : Ouverture dynamique au clic pour économiser la mémoire
4. **Destruction propre** : Nettoyage des ressources dans `ngOnDestroy`

## Dépannage

### Problème : La carte ne s'affiche pas

**Solution :**
1. Vérifiez que la clé API Google Maps est valide
2. Vérifiez la console pour les erreurs d'API
3. Assurez-vous que GoogleMapsModule est importé

### Problème : Les marqueurs ne s'affichent pas

**Solution :**
1. Vérifiez que les coordonnées sont valides
2. Vérifiez que l'API retourne des données
3. Ouvrez la console pour voir les erreurs

### Problème : L'export Excel ne fonctionne pas

**Solution :**
1. Vérifiez la connexion au backend
2. Vérifiez les permissions CORS
3. Vérifiez les logs du serveur

## Sécurité

### Bonnes pratiques :

1. **Clé API Google Maps** :
   - Limitez la clé aux domaines autorisés
   - Activez uniquement les APIs nécessaires
   - Surveillez l'utilisation pour éviter les dépassements

2. **Validation côté serveur** :
   - Le backend valide toutes les coordonnées
   - Vérification de l'existence de l'identité
   - Protection contre les injections

3. **Authentification** :
   - Toutes les routes nécessitent une authentification
   - Vérification des permissions utilisateur

## Améliorations futures

1. **Géolocalisation automatique** : Utiliser l'API de géolocalisation du navigateur
2. **Clustering de marqueurs** : Pour améliorer les performances avec beaucoup de points
3. **Filtres avancés** : Filtrer par date, par identité, par zone géographique
4. **Itinéraires** : Afficher les trajets entre plusieurs points
5. **Heatmap** : Visualisation de la densité des géolocalisations
6. **Recherche d'adresse** : Conversion adresse → coordonnées via Geocoding API

## Support

Pour toute question ou problème, veuillez :
1. Vérifier cette documentation
2. Consulter les logs du navigateur et du serveur
3. Contacter l'équipe de développement

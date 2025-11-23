# 🚀 Démarrage Rapide - Géolocalisation

## 📋 Checklist de Configuration

### ✅ Étape 1: Clé API Google Maps (OBLIGATOIRE)

1. **Obtenez une clé API:**
   - Visitez: https://console.cloud.google.com/
   - Créez un projet ou sélectionnez-en un
   - Activez "Maps JavaScript API"
   - Créez une clé API

2. **Configurez la clé dans le projet:**
   - Ouvrez: `src/index.html`
   - Trouvez la ligne:
     ```html
     <script src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY_HERE"></script>
     ```
   - Remplacez `YOUR_API_KEY_HERE` par votre clé

### ✅ Étape 2: Vérifier le Backend

Assurez-vous que ces endpoints sont disponibles:
```
GET  /api/geolocations/coordinates
POST /api/geolocations/create
PUT  /api/geolocations/update/:uuid
DELETE /api/geolocations/delete/:uuid
GET  /api/geolocations/export/excel
```

### ✅ Étape 3: Lancer l'Application

```bash
# Installer les dépendances (si nécessaire)
npm install

# Lancer le serveur de développement
npm start
```

### ✅ Étape 4: Tester les Fonctionnalités

#### Test 1: Créer une Géolocalisation
1. Naviguez vers "Migrants"
2. Cliquez sur "Ajouter une géolocalisation" (bouton vert)
3. Sélectionnez une identité
4. Entrez des coordonnées (ex: Latitude: -4.3217, Longitude: 15.3125)
5. Cliquez sur "Ajouter"

#### Test 2: Visualiser la Carte
1. Naviguez vers "Géolocalisations" dans le menu
2. Vérifiez que la carte s'affiche
3. Vérifiez que les marqueurs sont présents
4. Cliquez sur un marqueur pour voir l'info window

#### Test 3: Exporter vers Excel
1. Dans la page "Géolocalisations"
2. Cliquez sur "Exporter Excel"
3. Vérifiez le téléchargement du fichier

## 🎯 Exemples de Coordonnées

### Villes de la RDC
- **Kinshasa:** Lat: -4.3217, Long: 15.3125
- **Lubumbashi:** Lat: -11.6666, Long: 27.4833
- **Goma:** Lat: -1.6792, Long: 29.2228
- **Bukavu:** Lat: -2.5098, Long: 28.8480
- **Kisangani:** Lat: 0.5167, Long: 25.2000

### Validation des Coordonnées
- **Latitude:** Doit être entre -90 et 90
- **Longitude:** Doit être entre -180 et 180

## ⚠️ Problèmes Courants

### La carte est grise/ne s'affiche pas
**Solution:** Vérifiez que vous avez bien configuré la clé API Google Maps dans `index.html`

### Erreur "This page can't load Google Maps correctly"
**Solutions:**
1. La clé API n'est pas valide
2. L'API "Maps JavaScript API" n'est pas activée
3. Le domaine n'est pas autorisé dans les restrictions

### Les données ne se chargent pas
**Solutions:**
1. Vérifiez que le backend est en cours d'exécution
2. Vérifiez la console pour les erreurs réseau
3. Vérifiez les permissions CORS

## 📞 Support

Pour toute question:
1. Consultez `GEOLOCATION_IMPLEMENTATION.md` pour la documentation complète
2. Consultez `IMPLEMENTATION_SUMMARY.md` pour le résumé
3. Vérifiez la console du navigateur pour les erreurs
4. Vérifiez les logs du serveur backend

## 🎉 Vous êtes prêt!

Une fois la clé API configurée, toutes les fonctionnalités sont opérationnelles!

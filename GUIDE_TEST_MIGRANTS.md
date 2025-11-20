# Guide de Test - Module Migrants Migré

## 🎯 Objectif

Ce guide vous aide à tester le module Migrants après la migration vers l'architecture avec `Identite` séparée.

---

## 📋 Pré-requis

### 1. Backend Go en cours d'exécution

```bash
# Vérifier que le backend tourne
curl http://localhost:8080/api/v1/health

# Devrait retourner
{
  "status": "success",
  "message": "API is running"
}
```

### 2. Base de données

Assurez-vous que les tables suivantes existent:
- `identites` - Table des identités
- `migrants` - Table des migrants
- Relation: `migrants.identite_uuid` → `identites.uuid`

### 3. Données de test

**Créer au moins 2 identités de test:**

```bash
# POST http://localhost:8080/api/v1/identites/create
{
  "nom": "Doe",
  "prenom": "John",
  "date_naissance": "1990-01-15",
  "lieu_naissance": "Kinshasa",
  "sexe": "M",
  "nationalite": "Congolaise",
  "pays_emetteur": "RDC",
  "autorite_emetteur": "DGM Kinshasa",
  "numero_passeport": "CD123456789"
}
```

```bash
# POST http://localhost:8080/api/v1/identites/create
{
  "nom": "Smith",
  "prenom": "Jane",
  "date_naissance": "1992-05-20",
  "lieu_naissance": "Lubumbashi",
  "sexe": "F",
  "nationalite": "Congolaise",
  "pays_emetteur": "RDC",
  "autorite_emetteur": "DGM Lubumbashi",
  "numero_passeport": "CD987654321"
}
```

---

## 🧪 Scénarios de Test

### Test 1: Chargement de la Page

**Étapes:**
1. Ouvrir l'application Angular
2. Naviguer vers `/web/migrants` ou le module migrants
3. Attendre le chargement

**Résultats Attendus:**
- ✅ Cartes statistiques affichées en haut
- ✅ Liste des migrants affichée (peut être vide)
- ✅ Filtres repliés par défaut
- ✅ Bouton "Ajouter un migrant" visible
- ✅ Bouton "Exporter Excel" visible
- ✅ Pagination affichée si > 15 migrants

**Console (F12):**
- ❌ Aucune erreur JavaScript
- ✅ Requêtes API réussies:
  - `GET /migrants/paginate?page=1&limit=15`
  - `GET /migrants/stats`
  - `GET /identites/paginate?page=1&limit=100`

---

### Test 2: Affichage des Statistiques

**Étapes:**
1. Observer les 6 cartes en haut de page

**Résultats Attendus:**
- ✅ **Total Migrants** - Nombre total
- ✅ **Actifs** - Migrants avec `actif = true`
- ✅ **Réguliers** - Statut `regulier`
- ✅ **Irréguliers** - Statut `irregulier`
- ✅ **Réfugiés** - Statut `refugie`
- ✅ **Demandeurs d'asile** - Statut `demandeur_asile`

**Couleurs:**
- Total: Bleu (primary)
- Actifs: Vert (success)
- Réguliers: Cyan (info)
- Irréguliers: Jaune (warning)
- Réfugiés: Gris (secondary)
- Demandeurs: Noir (dark)

---

### Test 3: Création d'un Migrant - Identité Existante

**Étapes:**
1. Cliquer sur "Ajouter un migrant"
2. Modal s'ouvre
3. **Section Identité:**
   - Taper dans recherche: "John" ou "Doe"
   - Sélectionner "Doe John - CD123456789 (Congolaise)"
   - Vérifier que le dropdown est rempli
4. **Section Migration:**
   - Statut migratoire: Sélectionner "Régulier"
   - Date d'entrée: 2024-01-15
   - Point d'entrée: Sélectionner "Kinshasa"
   - Pays destination: Sélectionner "France"
5. **Section Contact:**
   - Téléphone: +243 999 123 456
   - Email: john.doe@example.com
   - Adresse: "123 Avenue Kasa-Vubu"
   - Ville actuelle: Sélectionner "Kinshasa"
   - Pays actuel: "RDC"
6. **Section Famille:**
   - Situation matrimoniale: "Marié(e)"
   - Nombre enfants: 2
   - Personne contact: "Marie Doe"
   - Téléphone contact: +243 999 987 654
7. Cocher "Actif"
8. Cliquer "Ajouter"

**Résultats Attendus:**
- ✅ Spinner pendant la soumission
- ✅ Modal se ferme automatiquement
- ✅ Liste rafraîchie
- ✅ Nouveau migrant apparaît en haut de liste
- ✅ `numero_identifiant` auto-généré visible: `MIG-2025-000001`
- ✅ Informations d'identité affichées correctement (nom, prénom, sexe, nationalité)
- ✅ Message de succès (toast/snackbar si implémenté)

**Console:**
- ✅ `POST /migrants/create` - Status 200
- ✅ Response contient le migrant créé avec `numero_identifiant`
- ❌ Aucune erreur

**Vérifications Backend:**
```bash
# GET http://localhost:8080/api/v1/migrants/all
# Devrait contenir le nouveau migrant avec:
{
  "numero_identifiant": "MIG-2025-000001",
  "identite_uuid": "...",
  "identite": {
    "nom": "Doe",
    "prenom": "John",
    ...
  },
  "statut_migratoire": "regulier",
  "telephone": "+243 999 123 456",
  "email": "john.doe@example.com",
  ...
}
```

---

### Test 4: Validation - Champs Requis

**Étapes:**
1. Cliquer "Ajouter un migrant"
2. **NE PAS remplir** `identite_uuid`
3. **NE PAS remplir** `statut_migratoire`
4. Essayer de soumettre

**Résultats Attendus:**
- ❌ Bouton "Ajouter" désactivé (si validation reactive)
- ❌ Messages d'erreur sous champs requis:
  - "identite_uuid est requis"
  - "statut_migratoire est requis"
- ❌ Formulaire non soumis

---

### Test 5: Validation - Email Unique

**Étapes:**
1. Créer un migrant avec email: `test@example.com`
2. Essayer de créer un autre migrant avec le MÊME email

**Résultats Attendus:**
- ❌ Erreur backend retournée
- ❌ Message affiché: "A migrant with this email already exists"
- ❌ Formulaire reste ouvert
- ✅ Utilisateur peut corriger l'email

---

### Test 6: Édition d'un Migrant

**Étapes:**
1. Cliquer sur menu actions (⋮) d'un migrant
2. Sélectionner "Modifier"
3. Modal s'ouvre

**Résultats Attendus - Section Identité:**
- ✅ **Carte grise** avec informations en **lecture seule**:
  - Nom: John Doe
  - Sexe: Masculin
  - Date naissance: 15/01/1990
  - Nationalité: Congolaise
  - N° Passeport: CD123456789
- ✅ Champ `identite_uuid` en input hidden
- ❌ PAS de dropdown de sélection d'identité
- ❌ IMPOSSIBLE de modifier ces champs ici

**Résultats Attendus - Champs Éditables:**
- ✅ Statut migratoire modifiable
- ✅ Contact modifiable (téléphone, email, adresse, etc.)
- ✅ Famille modifiable
- ✅ Date entrée, point entrée, destination modifiables
- ✅ Statut actif modifiable

**Modification:**
1. Changer téléphone: +243 999 111 222
2. Changer statut: "Irrégulier"
3. Cliquer "Modifier"

**Résultats Attendus:**
- ✅ Modal se ferme
- ✅ Liste rafraîchie
- ✅ Changements visibles dans la liste
- ✅ Identité INCHANGÉE (toujours John Doe, etc.)

**Console:**
- ✅ `PUT /migrants/update/{uuid}` - Status 200
- ✅ Response contient migrant mis à jour
- ❌ `identite` PAS modifiée

---

### Test 7: Affichage Détails

**Étapes:**
1. Cliquer menu actions → "Voir détails"
2. Modal détails s'ouvre

**Résultats Attendus:**

**Section Identité:**
- ✅ Nom complet: John Doe (Postnom si existe)
- ✅ Date naissance: 15/01/1990
- ✅ Lieu naissance: Kinshasa
- ✅ Sexe: Masculin
- ✅ Nationalité: Congolaise

**Section Documents:**
- ✅ Type: Passeport
- ✅ N° Passeport: CD123456789
- ✅ Pays émetteur: RDC
- ✅ Autorité: DGM Kinshasa

**Section Migration:**
- ✅ N° Identifiant: MIG-2025-000001
- ✅ Statut: Régulier (ou autre selon données)
- ✅ Date entrée: 15/01/2024
- ✅ Point entrée: Kinshasa
- ✅ Destination: France

**Section Contact:**
- ✅ Tous les champs de contact affichés
- ✅ "-" pour champs vides

---

### Test 8: Filtres - Recherche Globale

**Étapes:**
1. Cliquer "Afficher les filtres"
2. Dans "Recherche globale", taper: "John"
3. Cliquer "Rechercher"

**Résultats Attendus:**
- ✅ Liste filtrée
- ✅ Affiche tous migrants avec:
  - Nom contenant "John" (via Identite)
  - Prénom contenant "John"
  - Email contenant "john"
  - Numero identifiant contenant "john"
- ✅ Pagination mise à jour
- ✅ Compteur "X entrées" mis à jour

**Console:**
- ✅ `GET /migrants/paginate?page=1&limit=15&search=John`

---

### Test 9: Filtres - Combinaison

**Étapes:**
1. Filtres:
   - Nationalité: "Congolaise"
   - Sexe: "Masculin"
   - Statut migratoire: "Régulier"
   - Statut actif: "Actif"
2. Cliquer "Rechercher"

**Résultats Attendus:**
- ✅ Liste filtrée selon TOUS les critères
- ✅ Affiche uniquement migrants congolais, masculins, réguliers, actifs

**Console:**
```
GET /migrants/paginate?page=1&limit=15
  &nationalite=Congolaise
  &sexe=M
  &statut_migratoire=regulier
  &actif=true
```

---

### Test 10: Filtres - Réinitialisation

**Étapes:**
1. Appliquer plusieurs filtres
2. Cliquer "Réinitialiser"

**Résultats Attendus:**
- ✅ TOUS les filtres vidés
- ✅ Liste complète affichée
- ✅ Retour à la page 1

---

### Test 11: Filtres - Dates

**Étapes:**
1. Période de création:
   - Date début: 2024-01-01
   - Date fin: 2024-12-31
2. Cliquer "Rechercher"

**Résultats Attendus:**
- ✅ Affiche migrants créés en 2024
- ✅ Exclut ceux créés avant/après

**Étapes 2:**
1. Période de naissance:
   - Date début: 1990-01-01
   - Date fin: 1995-12-31
2. Cliquer "Rechercher"

**Résultats Attendus:**
- ✅ Affiche migrants nés entre 1990-1995
- ✅ Filtre sur `identite.date_naissance` via JOIN

---

### Test 12: Pagination

**Pré-requis:** Au moins 20 migrants en base

**Étapes:**
1. Aller à la page 1
2. Vérifier: Affiche migrants 1-15
3. Cliquer page 2
4. Vérifier: Affiche migrants 16-20

**Résultats Attendus:**
- ✅ Navigation fluide
- ✅ Compteur mis à jour
- ✅ URL peut changer (si routing)

**Console:**
```
GET /migrants/paginate?page=1&limit=15
GET /migrants/paginate?page=2&limit=15
```

---

### Test 13: Export Excel - Sans Filtres

**Étapes:**
1. Aucun filtre appliqué
2. Cliquer "Exporter Excel"
3. Attendre le téléchargement

**Résultats Attendus:**
- ✅ Bouton affiche "Export en cours..." avec spinner
- ✅ Fichier `.xlsx` téléchargé
- ✅ Nom: `migrants-export-YYYYMMDD-HHMMSS.xlsx`

**Contenu du Fichier:**

**Feuille "Migrants":**
- ✅ En-tête principal avec date/heure
- ✅ Colonnes:
  - N° Identifiant, Nom, Prénom, Date naissance, Lieu naissance
  - Sexe, Nationalité, N° Passeport
  - Téléphone, Email, Adresse, Ville, Pays
  - Situation matrimoniale, Nombre enfants
  - Contacts urgence
  - Statut migratoire, Date entrée, Point entrée, Destination
  - Statut actif, Dates création/MAJ
- ✅ Données de TOUS les migrants
- ✅ Mise en forme:
  - En-têtes en bleu/blanc
  - Cellules avec bordures
  - Colonnes auto-ajustées
  - Dates formatées DD/MM/YYYY

**Feuille "Statistiques":**
- ✅ Total enregistrements
- ✅ Migrants actifs/inactifs
- ✅ Par statut migratoire
- ✅ Par sexe
- ✅ Top 10 nationalités
- ✅ Top 10 pays d'origine

---

### Test 14: Export Excel - Avec Filtres

**Étapes:**
1. Appliquer filtres:
   - Nationalité: "Congolaise"
   - Statut: "Régulier"
   - Actif: "Actif"
2. Cliquer "Exporter Excel"

**Résultats Attendus:**
- ✅ Fichier contient UNIQUEMENT migrants filtrés
- ✅ Feuille "Statistiques" mise à jour selon filtres

---

### Test 15: Suppression

**Étapes:**
1. Cliquer menu actions → "Supprimer"
2. Confirmer la suppression

**Résultats Attendus:**
- ✅ Boîte de confirmation affichée
- ✅ Après confirmation:
  - Migrant disparaît de la liste
  - Liste rafraîchie
  - Compteur mis à jour
  - Statistiques mises à jour

**Console:**
- ✅ `DELETE /migrants/delete/{uuid}` - Status 200

**Backend:**
- ✅ Soft delete: `deleted_at` rempli
- ✅ Relations CASCADE supprimées:
  - Motifs de déplacement
  - Alertes
  - Biométries
  - Géolocalisations

---

### Test 16: Motifs de Déplacement

**Pré-requis:** Créer 3-5 motifs pour un migrant

**Étapes:**
1. Cliquer menu actions → "Motifs de déplacement"
2. Modal s'ouvre

**Résultats Attendus:**
- ✅ Informations du migrant affichées en haut
- ✅ Recherche disponible
- ✅ Badge avec nombre total de motifs
- ✅ Table avec colonnes:
  - Type motif, Motif principal, Caractère
  - Urgence, Date déclenchement
  - Facteurs externes, Durée estimée
- ✅ Pagination si > 5 motifs
- ✅ Accordéon détails pour chaque motif

**Actions:**
1. Rechercher "économique"
2. Vérifier filtrage
3. Cliquer "Gérer dans module dédié"
4. Vérifier redirection vers module Motifs avec query param `migrant_uuid`

---

## 🐛 Erreurs Courantes et Solutions

### Erreur 1: "identite_uuid is required"

**Cause:** Aucune identité sélectionnée

**Solution:**
- Vérifier que le dropdown identité est bien rempli
- Sélectionner une identité valide

---

### Erreur 2: "Failed to fetch Identites"

**Cause:** Service Identite non disponible

**Solution:**
- Vérifier backend: `GET /identites/paginate`
- Vérifier connexion réseau
- Vérifier CORS si frontend/backend séparés

---

### Erreur 3: Champs d'identité non affichés

**Cause:** Relation `identite` non chargée

**Solution:**
- Backend doit utiliser `.Preload("Identite")`
- Vérifier réponse API contient `identite` object

---

### Erreur 4: "Cannot read property 'nom' of undefined"

**Cause:** `migrant.identite` est `null` ou `undefined`

**Solution:**
- Utiliser safe navigation: `migrant.identite?.nom`
- Vérifier Preload backend
- Vérifier que l'identité existe en base

---

### Erreur 5: Export Excel échoue

**Cause:** Erreur serveur lors génération Excel

**Solution:**
- Vérifier logs backend
- Vérifier package `excelize` installé
- Tester endpoint directement: `GET /migrants/export/excel`

---

## 📊 Checklist de Validation Finale

### Interface Utilisateur
- [ ] Cartes statistiques affichées
- [ ] Liste affiche nom, prénom depuis `identite`
- [ ] Filtres fonctionnent correctement
- [ ] Pagination fonctionne
- [ ] Export Excel fonctionne
- [ ] Responsive design OK

### Formulaire Création
- [ ] Sélection identité fonctionne
- [ ] Recherche identité fonctionne
- [ ] Validation champs requis OK
- [ ] Soumission crée le migrant
- [ ] NumeroIdentifiant auto-généré visible

### Formulaire Édition
- [ ] Identité en lecture seule
- [ ] Champs migrant éditables
- [ ] Modification sauvegardée
- [ ] Identité non modifiée

### Affichage Détails
- [ ] Toutes sections affichées
- [ ] Données identité correctes
- [ ] Données migration correctes
- [ ] Pas d'erreur console

### Filtres
- [ ] Recherche globale OK
- [ ] Filtres par nationalité, sexe, statut OK
- [ ] Filtres par dates OK
- [ ] Combinaison filtres OK
- [ ] Réinitialisation OK

### Export
- [ ] Export sans filtres OK
- [ ] Export avec filtres OK
- [ ] Feuille Migrants OK
- [ ] Feuille Statistiques OK
- [ ] Mise en forme OK

### Suppression
- [ ] Confirmation demandée
- [ ] Soft delete fonctionne
- [ ] Liste mise à jour
- [ ] Relations CASCADE OK

### Performance
- [ ] Chargement rapide (< 2s)
- [ ] Pas de lag lors filtrage
- [ ] Export rapide (< 5s pour 1000 migrants)

---

## 🎉 Conclusion

Si TOUS les tests passent:
- ✅ **Migration réussie!**
- ✅ Frontend aligné avec backend Go
- ✅ Architecture Identite séparée fonctionnelle
- ✅ Prêt pour production

Si certains tests échouent:
- ❌ Identifier les tests en échec
- ❌ Vérifier logs frontend (Console F12)
- ❌ Vérifier logs backend
- ❌ Consulter `MIGRATION_BACKEND_ALIGNMENT.md`
- ❌ Contacter l'équipe si blocage

---

**Bon courage pour les tests! 🚀**

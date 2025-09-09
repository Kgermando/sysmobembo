# Utilitaire Pays (pays.utils.ts)

## Description
Utilitaire pour la gestion des pays dans l'application de gestion des migrants. Fournit des listes de pays organisées et des fonctions de recherche.

## Constantes Exportées

### `PAYS_ORIGINE_COMMUNS`
Liste des pays d'origine les plus communs pour les migrants, principalement en Afrique centrale et de l'Ouest.

**Contenu :**
- 49 pays africains les plus représentés
- Focalisé sur l'Afrique subsaharienne et le Maghreb
- Optimisé pour les besoins de filtrage rapide

### `TOUS_LES_PAYS` 
Liste complète des pays du monde, organisée par continent :
- **Afrique** : 54 pays
- **Europe** : 32 pays  
- **Asie** : 35 pays
- **Amérique du Nord** : 3 pays
- **Amérique centrale et Caraïbes** : 20 pays
- **Amérique du Sud** : 12 pays
- **Océanie** : 14 pays

**Total** : ~170 pays

## Fonctions Exportées

### `searchPays(searchTerm: string, useCompleteList?: boolean): string[]`
Recherche des pays par nom avec correspondance partielle.

**Paramètres :**
- `searchTerm` : Terme de recherche (minimum 2 caractères)
- `useCompleteList` : Utiliser la liste complète (défaut: false)

**Retourne :** Liste des pays correspondants

**Exemple :**
```typescript
import { searchPays } from './utils/pays.utils';

// Recherche dans les pays communs
const result1 = searchPays('congo'); // ['République du Congo', 'République Démocratique du Congo']

// Recherche dans tous les pays
const result2 = searchPays('fran', true); // ['France']
```

### `isValidPays(pays: string, useCompleteList?: boolean): boolean`
Vérifie si un pays existe dans la liste spécifiée.

**Paramètres :**
- `pays` : Nom du pays à vérifier
- `useCompleteList` : Utiliser la liste complète (défaut: true)

**Retourne :** true si le pays existe

**Exemple :**
```typescript
import { isValidPays } from './utils/pays.utils';

console.log(isValidPays('France')); // true
console.log(isValidPays('Pays Inexistant')); // false
```

### `getPaysByRegion(region: RegionType): string[]`
Obtient les pays par région géographique.

**Paramètres :**
- `region` : 'afrique' | 'europe' | 'asie' | 'amerique' | 'oceanie'

**Retourne :** Liste des pays de la région

## Utilisation dans les Composants

### Import
```typescript
import { PAYS_ORIGINE_COMMUNS, TOUS_LES_PAYS, searchPays } from '../../shared/utils';
```

### Dans un composant Angular
```typescript
export class MigrantsComponent {
  // Getter pour utiliser la constante
  get paysOrigineOptions(): string[] {
    return PAYS_ORIGINE_COMMUNS;
  }
  
  // Méthode de recherche
  searchCountries(term: string): string[] {
    return searchPays(term);
  }
}
```

### Dans un template
```html
<select [(ngModel)]="selectedPays">
  <option value="">Sélectionnez un pays</option>
  <option *ngFor="let pays of paysOrigineOptions" [value]="pays">
    {{ pays }}
  </option>
</select>
```

## Bonnes Pratiques

1. **Performance** : Utilisez `PAYS_ORIGINE_COMMUNS` pour les listes déroulantes fréquentes
2. **Recherche** : Utilisez `searchPays()` pour l'autocomplétion
3. **Validation** : Utilisez `isValidPays()` pour valider les saisies utilisateur
4. **Maintenance** : Toutes les listes sont centralisées et facilement modifiables

## Maintenance

### Ajout d'un pays
1. Ajoutez le pays dans la liste appropriée (`PAYS_ORIGINE_COMMUNS` ou `TOUS_LES_PAYS`)
2. Respectez l'ordre alphabétique par continent
3. Utilisez les noms officiels français

### Extension
- Les fonctions peuvent être étendues pour supporter d'autres langues
- Possibilité d'ajouter des codes ISO, capitales, etc.
- Support futur pour les régions personnalisées

---

**Créé le :** Septembre 2025  
**Version :** 1.0.0  
**Compatibilité :** Angular 15+

# Guide Rapide - Module Alertes

## 🎯 Quick Start

### Créer une Alerte

```typescript
const alertData: IAlertFormData = {
  migrant_uuid: "uuid-du-migrant",
  type_alerte: "securite",
  niveau_gravite: "critical",
  titre: "Problème de sécurité urgent",
  description: "Description détaillée du problème...",
  date_expiration: "2024-12-31",        // ISO string ou null
  action_requise: "Contacter les autorités",
  personne_responsable: "Dr. Martin"
};

this.alertService.createAlert(alertData).subscribe({
  next: (response) => {
    if (response.status === 'success') {
      console.log('Alerte créée:', response.data);
    }
  },
  error: (error) => console.error('Erreur:', error)
});
```

### Modifier une Alerte

```typescript
const updateData: Partial<IAlertFormData> = {
  statut: 'resolved',
  titre: "Nouveau titre"
};

this.alertService.updateAlert(alertUuid, updateData).subscribe({
  next: (response) => console.log('Alerte modifiée'),
  error: (error) => console.error('Erreur:', error)
});
```

### Résoudre une Alerte

```typescript
this.alertService.resolveAlert(alertUuid, {
  comment_resolution: "Problème résolu par intervention terrain"
}).subscribe({
  next: (response) => console.log('Alerte résolue'),
  error: (error) => console.error('Erreur:', error)
});
```

---

## 📋 Types d'Alertes

### Type Alerte (type_alerte)
| Valeur | Label | Badge | Icône |
|--------|-------|-------|-------|
| `securite` | Sécurité | `bg-danger` | `ti-shield` |
| `sante` | Santé | `bg-warning` | `ti-heart` |
| `juridique` | Juridique | `bg-info` | `ti-scale` |
| `administrative` | Administrative | `bg-primary` | `ti-file-text` |
| `humanitaire` | Humanitaire | `bg-success` | `ti-users` |

### Niveau de Gravité (niveau_gravite)
| Valeur | Label | Badge |
|--------|-------|-------|
| `info` | Information | `bg-info` |
| `warning` | Attention | `bg-warning` |
| `danger` | Danger | `bg-danger` |
| `critical` | Critique | `bg-dark` |

### Statut (statut)
| Valeur | Label | Badge | Description |
|--------|-------|-------|-------------|
| `active` | Active | `bg-success` | Alerte en cours |
| `resolved` | Résolue | `bg-primary` | Problème résolu |
| `dismissed` | Ignorée | `bg-secondary` | Alerte ignorée |
| `expired` | Expirée | `bg-danger` | Date d'expiration dépassée |

---

## 🔧 Règles Importantes

### ✅ À FAIRE

1. **Toujours utiliser `null` pour les champs optionnels vides**
   ```typescript
   // ✅ CORRECT
   date_expiration: formValue.date_expiration || null

   // ❌ INCORRECT
   date_expiration: formValue.date_expiration || undefined
   date_expiration: formValue.date_expiration || ""
   ```

2. **Parser les dates des réponses API**
   ```typescript
   // ✅ CORRECT
   .pipe(
     map(response => ({
       ...response,
       data: DateUtils.parseApiDates(response.data)
     }))
   )
   ```

3. **Vérifier les valeurs nulles dans le template**
   ```html
   <!-- ✅ CORRECT -->
   <div *ngIf="alert.date_expiration; else noDate">
     {{ alert.date_expiration | date: 'dd/MM/yyyy' }}
   </div>
   <ng-template #noDate>
     <span class="text-muted">Non définie</span>
   </ng-template>

   <!-- ❌ INCORRECT -->
   <div>{{ alert.date_expiration | date: 'dd/MM/yyyy' }}</div>
   ```

4. **Typer explicitement les enums**
   ```typescript
   // ✅ CORRECT
   type_alerte: formValue.type_alerte as 'securite' | 'sante' | 'juridique' | 'administrative' | 'humanitaire'

   // ❌ INCORRECT
   type_alerte: formValue.type_alerte
   ```

### ❌ À ÉVITER

1. ❌ Envoyer des strings vides au backend
2. ❌ Utiliser `undefined` pour les champs optionnels
3. ❌ Oublier de parser les dates des réponses API
4. ❌ Ne pas gérer les valeurs nulles dans les templates
5. ❌ Modifier directement les objets observables

---

## 🔍 Filtres et Recherche

### Paramètres de Pagination

```typescript
this.alertService.getPaginatedAlerts(
  page,      // Numéro de page (1-indexed)
  limit,     // Nombre d'éléments par page
  {
    search: "texte recherché",
    migrant_uuid: "uuid",
    statut: "active",
    gravite: "critical"
  }
).subscribe(...);
```

### Filtres d'Export Excel

```typescript
this.alertService.exportAlertsToExcel({
  start_date: "2024-01-01",  // ISO string
  end_date: "2024-12-31"     // ISO string
}).subscribe({
  next: (blob: Blob) => {
    // Télécharger le fichier
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'alertes_export.xlsx';
    link.click();
  }
});
```

---

## 📊 Statistiques

### Récupérer les Stats

```typescript
this.alertService.getAlertsStats().subscribe({
  next: (response) => {
    const stats = response.data;
    console.log('Total alertes:', stats.total_alerts);
    console.log('Alertes actives:', stats.active_alerts);
    console.log('Alertes critiques:', stats.critical_alerts);
    console.log('Alertes résolues:', stats.resolved_alerts);
    console.log('Alertes expirées:', stats.expired_alerts);
    
    // Distribution par type
    stats.alert_types.forEach(item => {
      console.log(`${item.type_alerte}: ${item.count}`);
    });
    
    // Distribution par gravité
    stats.gravity_distribution.forEach(item => {
      console.log(`${item.niveau_gravite}: ${item.count}`);
    });
  }
});
```

---

## 🎨 Helpers UI

### Récupérer les Informations d'Affichage

```typescript
// Dans le composant
getTypeAlerteInfo(type: string) {
  return this.typeAlerteOptions.find(o => o.value === type);
}

getNiveauGraviteInfo(niveau: string) {
  return this.niveauGraviteOptions.find(o => o.value === niveau);
}

getStatutInfo(statut: string) {
  return this.statutOptions.find(o => o.value === statut);
}

// Classes CSS pour les badges
getAlertBadgeClass(niveau: string): string {
  const info = this.getNiveauGraviteInfo(niveau);
  return `badge bg-${info.color}`;
}
```

### Formatage des Dates

```typescript
import { DateUtils } from '../../shared/utils/date.utils';

// Format pour affichage
formatDate(date: Date | string | undefined): string {
  return DateUtils.toDisplayFormat(date);
}

// Format pour input HTML
formatDateForInput(date: Date | string | undefined): string {
  return DateUtils.toInputFormat(date);
}

// Format avec heure
formatDateTime(date: Date | string | undefined): string {
  return DateUtils.toDisplayFormat(date, { includeTime: true });
}
```

---

## 🔔 Notifications

### Utilisation de Toastr

```typescript
import { ToastrService } from 'ngx-toastr';

constructor(private toastr: ToastrService) {}

// Succès
this.toastr.success('Opération réussie', 'Succès');

// Erreur
this.toastr.error('Une erreur est survenue', 'Erreur');

// Information
this.toastr.info('Information importante', 'Information');

// Avertissement
this.toastr.warning('Attention', 'Avertissement');

// Avec options
this.toastr.success('Message', 'Titre', {
  timeOut: 3000,
  progressBar: true,
  closeButton: true
});
```

---

## 🧪 Exemples de Tests

### Test de Création

```typescript
it('should create alert with valid data', async () => {
  const alertData: IAlertFormData = {
    migrant_uuid: 'test-uuid',
    type_alerte: 'securite',
    niveau_gravite: 'critical',
    titre: 'Test Alert',
    description: 'Test description with minimum length',
    date_expiration: null,
    action_requise: null,
    personne_responsable: null
  };

  const response = await firstValueFrom(
    alertService.createAlert(alertData)
  );

  expect(response.status).toBe('success');
  expect(response.data).toBeDefined();
  expect(response.data.titre).toBe('Test Alert');
});
```

### Test de Validation

```typescript
it('should validate required fields', () => {
  const form = component.alertForm;
  
  expect(form.valid).toBeFalsy();
  
  form.patchValue({
    migrant_uuid: 'uuid',
    type_alerte: 'securite',
    niveau_gravite: 'info',
    titre: 'Valid Title',
    description: 'Valid description with enough length'
  });
  
  expect(form.valid).toBeTruthy();
});
```

---

## 🚨 Gestion des Erreurs

### Erreurs Communes

#### 1. "Invalid format"
**Cause:** Envoi de données dans un format incorrect
**Solution:** Vérifier que les champs optionnels sont `null` et non `undefined` ou `""`

#### 2. "Migrant not found"
**Cause:** UUID de migrant invalide
**Solution:** Vérifier que le migrant existe avant de créer l'alerte

#### 3. "Date pipe error"
**Cause:** Tentative de formater une date nulle
**Solution:** Utiliser `*ngIf` pour vérifier la présence de la date

#### 4. "Validation error"
**Cause:** Données ne respectant pas les contraintes
**Solution:** Vérifier les validateurs côté frontend

### Pattern de Gestion d'Erreur

```typescript
try {
  const response = await firstValueFrom(
    this.alertService.createAlert(formData)
  );
  
  if (response.status === 'success') {
    this.toastr.success('Alerte créée avec succès');
    await this.loadData();
  }
} catch (error: any) {
  // Log pour debug
  console.error('Erreur:', error);
  
  // Message utilisateur
  let errorMessage = 'Erreur lors de la création';
  
  if (error.status === 400) {
    errorMessage = error.error?.message || 'Données invalides';
  } else if (error.status === 404) {
    errorMessage = 'Migrant non trouvé';
  } else if (error.status === 500) {
    errorMessage = 'Erreur serveur. Veuillez réessayer.';
  }
  
  this.toastr.error(errorMessage, 'Erreur');
  this.error = errorMessage;
}
```

---

## 📖 Endpoints API

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/alerts/paginate` | Liste paginée avec filtres |
| GET | `/alerts/all` | Toutes les alertes |
| GET | `/alerts/get/:uuid` | Une alerte spécifique |
| GET | `/alerts/migrant/:uuid` | Alertes d'un migrant |
| POST | `/alerts/create` | Créer une alerte |
| PUT | `/alerts/update/:uuid` | Modifier une alerte |
| PUT | `/alerts/resolve/:uuid` | Résoudre une alerte |
| DELETE | `/alerts/delete/:uuid` | Supprimer une alerte |
| GET | `/alerts/stats` | Statistiques globales |
| GET | `/alerts/export/excel` | Export Excel |

---

## 💡 Best Practices

1. **Toujours valider côté frontend ET backend**
2. **Utiliser des types TypeScript stricts**
3. **Gérer tous les cas de valeurs nulles**
4. **Fournir des messages d'erreur clairs**
5. **Logger les erreurs pour le debugging**
6. **Tester les cas limites**
7. **Optimiser les requêtes API (pagination)**
8. **Utiliser les observables RxJS correctement**

---

## 📞 Support

Pour toute question:
- Consulter la [documentation complète](./ALERTS_BACKEND_ALIGNMENT.md)
- Vérifier les exemples dans le code
- Contacter l'équipe de développement

**Version:** 1.0.0  
**Dernière mise à jour:** 23 novembre 2025

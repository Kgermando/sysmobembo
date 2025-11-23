# 🎯 Overview Component - Quick Reference

## 📁 Files Changed

| File | Changes | Status |
|------|---------|--------|
| `deplacement.interface.ts` | Added `MotifPieChartResponse` | ✅ |
| `deplacement.service.ts` | Added `getMotifsPieChart()` method | ✅ |
| `overview.component.ts` | Updated data loading & simplified logic | ✅ |

## 🔌 API Endpoints

```typescript
// Base URL: /api/dashboard/overview

1. GET /indicateurs?periode=12&province=
   → IndicateursDeplacementResponse

2. GET /alertes?niveaux=danger,critical&province=&jours=7
   → AlertesTempsReelResponse

3. GET /repartition?periode=12
   → RepartitionGeographiqueResponse

4. GET /motifs-pie?periode=12&province=  🆕
   → MotifPieChartResponse
```

## 💻 Service Usage

```typescript
// Inject service
constructor(private deplacementService: DeplacementService) {}

// Call endpoints
this.deplacementService.getIndicateursGeneraux(12, '').subscribe(data => {...});
this.deplacementService.getAlertesTempsReel('danger,critical', '', 7).subscribe(data => {...});
this.deplacementService.getRepartitionGeographique(12).subscribe(data => {...});
this.deplacementService.getMotifsPieChart(12, '').subscribe(data => {...}); // 🆕
```

## 📦 Response Examples

### 1. Motifs Pie Chart (NEW)
```json
{
  "data": [
    { "name": "Économique", "value": 145, "extra": "economique" },
    { "name": "Politique", "value": 89, "extra": "politique" },
    { "name": "Persécution", "value": 67, "extra": "persecution" },
    { "name": "Catastrophe Naturelle", "value": 123, "extra": "naturelle" }
  ],
  "total": 424,
  "date_mise_a_jour": "2025-11-23T10:30:00Z",
  "periode_analyse": "12 derniers mois"
}
```

### 2. Full Indicators
```json
{
  "volume_localisation": {
    "nombre_total_pdi": 15234,
    "nombre_total_migrants": 18456,
    "nombre_deplaces_internes": 12890,
    "personnes_retournees": 3421,
    "repartition_geographique": [...],
    "evolution_mensuelle": [...]
  },
  "causes_deplacements": {
    "pourcentage_conflits_armes": 25.5,
    "pourcentage_catastrophes": 30.2,
    "pourcentage_persecution": 15.3,
    "pourcentage_violence_generalisee": 20.0,
    "pourcentage_autres_causes": 9.0,
    "details_causes": [...]
  },
  "vulnerabilite_besoins": {
    "profil_demographique": {...},
    "acces_services_base": {...},
    "taux_occupation_sites": 78.5,
    "deplaces_hors_sites": 4521
  },
  "dynamiques_alerte": {
    "zones_haut_risque": [...],
    "tendances_retour": [...],
    "alertes_precoces": [...],
    "mouvements_massifs_recent": 1234
  },
  "date_generation": "2025-11-23T10:30:00Z",
  "periode_analyse": "12 derniers mois"
}
```

### 3. Alerts
```json
{
  "alertes_actives": [
    {
      "zone": "Kinshasa",
      "type_alerte": "mouvement_massif",
      "niveau_gravite": "critical",
      "date_detection": "2025-11-20T14:30:00Z",
      "description": "Mouvement massif détecté"
    }
  ],
  "nombre_total": 12,
  "date_mise_a_jour": "2025-11-23T10:30:00Z"
}
```

### 4. Geographic Distribution
```json
{
  "repartition_provinces": [
    {
      "province": "Kinshasa",
      "nombre_pdi": 5234,
      "pourcentage": 34.5
    },
    {
      "province": "Nord-Kivu",
      "nombre_pdi": 4521,
      "pourcentage": 29.8
    }
  ],
  "date_mise_a_jour": "2025-11-23T10:30:00Z",
  "periode_analyse": "12 derniers mois"
}
```

## 🔧 Component Methods

```typescript
// Load all data
chargerDonnees(): void

// Prepare chart data
preparerDonneesGraphiques(): void
preparerKPIs(): void
preparerCausesPieChart(): void        // ✅ Simplified
preparerEvolutionLineChart(): void
preparerRepartitionBarChart(): void
preparerDemographiqueChart(): void
preparerServicesChart(): void
preparerZonesRisqueChart(): void

// Update ApexCharts
updateCausesChart(): void
updateProvincesChart(): void

// User actions
changerPeriode(periode: number): void
changerProvince(province: string): void
actualiser(): void

// Utilities
formaterNombre(nombre: number): string
formaterPourcentage(pourcentage: number): string
getClasseRisque(niveau: string): string
getClasseAlerte(niveau: string): string
```

## 🎨 Key Properties

```typescript
// Loading states
loading: boolean = true;
error: string | null = null;

// Main data
indicateurs: IndicateursDeplacementResponse | null;

// Filters
periodeSelectionnee: number = 12;
provinceSelectionnee: string = '';

// KPIs
totalPDI: number;
totalMigrants: number;
deplacesInternes: number;
personnesRetournees: number;
tauxRetour: number;
tauxDeplacementInterne: number;
mouvementsMassifs: number;

// Chart data
causesPieData: ChartDataPoint[];          // ✅ From backend
evolutionLineData: ChartSeries[];
repartitionBarData: ChartDataPoint[];
demographiqueData: ChartDataPoint[];
servicesData: ChartDataPoint[];
zonesRisqueData: ChartDataPoint[];
alertesRecentes: AlertePrecoceStats[];
topProvinces: RepartitionProvinceStats[];
```

## 🗺️ Backend Database Tables

```sql
-- Main tables queried
migrants              -- Migration records
identites             -- Personal information
motif_deplacements    -- Displacement reasons ✅ NEW USAGE
geolocalisations      -- Geographic tracking
alertes               -- Alerts and warnings

-- Key joins
migrants.identite_uuid = identites.uuid
motif_deplacements.migrant_uuid = migrants.uuid
geolocalisations.migrant_uuid = migrants.uuid
alertes.migrant_uuid = migrants.uuid
```

## 📋 Motif Types (Backend)

```go
// Backend categorizes these motif types
"economique"            → "Économique"
"politique"             → "Politique"
"persecution"           → "Persécution"
"naturelle"             → "Catastrophe Naturelle"
"familial"              → "Familial"
"education"             → "Éducation"
"sanitaire"             → "Sanitaire"
"conflit_arme"          → "Conflit Armé"
"catastrophe_naturelle" → "Catastrophe Naturelle"
"violence_generalisee"  → "Violence Généralisée"
```

## ⚡ Performance Tips

1. Use `combineLatest` for parallel API calls
2. Backend handles all aggregations
3. Cache responses when appropriate
4. Use OnPush change detection if needed
5. Lazy load heavy charts

## 🐛 Error Handling

```typescript
.subscribe({
  next: (data) => {
    // Success handler
  },
  error: (error) => {
    this.error = 'Erreur lors du chargement des données';
    console.error('Erreur API:', error);
  },
  complete: () => {
    this.loading = false;
  }
});
```

## 📚 Documentation Files

- `OVERVIEW_BACKEND_ALIGNMENT.md` - Detailed alignment
- `OVERVIEW_COMPARISON.md` - Before/after comparison
- `OVERVIEW_ALIGNMENT_SUMMARY.md` - Quick summary
- `OVERVIEW_ARCHITECTURE_FLOW.md` - Architecture diagram
- `OVERVIEW_QUICK_REFERENCE.md` - This file

---

**Status:** ✅ Production Ready  
**Version:** 1.0.0  
**Last Updated:** 2025-11-23

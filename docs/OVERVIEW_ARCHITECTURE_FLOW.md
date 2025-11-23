# Overview Component Architecture - Complete Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           ANGULAR FRONTEND                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │                    overview.component.ts                           │    │
│  │                                                                     │    │
│  │  Properties:                                                        │    │
│  │  • indicateurs: IndicateursDeplacementResponse                      │    │
│  │  • causesPieData: ChartDataPoint[]  ✅ FROM BACKEND                 │    │
│  │  • alertesRecentes: AlertePrecoceStats[]                            │    │
│  │  • periodeSelectionnee: number (default: 12)                        │    │
│  │  • provinceSelectionnee: string                                     │    │
│  │                                                                     │    │
│  │  Methods:                                                           │    │
│  │  • chargerDonnees() → Calls 4 endpoints via combineLatest           │    │
│  │  • preparerDonneesGraphiques() → Prepare all charts                │    │
│  │  • preparerCausesPieChart() → ✅ Simplified (no calculation)        │    │
│  │  • changerPeriode() → Reload with new period                       │    │
│  │  • changerProvince() → Reload with new province                    │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                    ↓                                         │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │                    deplacement.service.ts                          │    │
│  │                                                                     │    │
│  │  baseUrl = '/api/dashboard/overview'                               │    │
│  │                                                                     │    │
│  │  ✅ getIndicateursGeneraux(periode, province)                       │    │
│  │     → GET /indicateurs?periode=12&province=                        │    │
│  │                                                                     │    │
│  │  ✅ getAlertesTempsReel(niveaux, province, jours)                   │    │
│  │     → GET /alertes?niveaux=danger,critical&province=&jours=7       │    │
│  │                                                                     │    │
│  │  ✅ getRepartitionGeographique(periode)                             │    │
│  │     → GET /repartition?periode=12                                  │    │
│  │                                                                     │    │
│  │  ✅ getMotifsPieChart(periode, province) 🆕                          │    │
│  │     → GET /motifs-pie?periode=12&province=                         │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                    ↓                                         │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │                 deplacement.interface.ts                           │    │
│  │                                                                     │    │
│  │  • IndicateursDeplacementResponse                                  │    │
│  │  • AlertesTempsReelResponse                                        │    │
│  │  • RepartitionGeographiqueResponse                                 │    │
│  │  • MotifPieChartResponse 🆕                                         │    │
│  │  • VolumeLocalisationIndicateurs                                   │    │
│  │  • CausesDeplacementsIndicateurs                                   │    │
│  │  • VulnerabiliteBesoinsIndicateurs                                 │    │
│  │  • DynamiquesAlerteIndicateurs                                     │    │
│  │  • All supporting stats interfaces                                 │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↕ HTTP
┌─────────────────────────────────────────────────────────────────────────────┐
│                              GO BACKEND API                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │                         main.go Routes                             │    │
│  │                                                                     │    │
│  │  dash := api.Group("/dashboard")                                   │    │
│  │  overviewDash := dash.Group("/overview")                           │    │
│  │                                                                     │    │
│  │  ✅ overviewDash.Get("/indicateurs", GetIndicateursGeneraux)        │    │
│  │  ✅ overviewDash.Get("/alertes", GetAlertesTempsReel)               │    │
│  │  ✅ overviewDash.Get("/repartition", GetRepartitionGeographique)    │    │
│  │  ✅ overviewDash.Get("/motifs-pie", GetMotifsPieChart) 🆕           │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                    ↓                                         │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │                   overview/handlers.go                             │    │
│  │                                                                     │    │
│  │  func GetIndicateursGeneraux(c *fiber.Ctx) error {                 │    │
│  │    periode := c.Query("periode", "12")                             │    │
│  │    province := c.Query("province", "")                             │    │
│  │                                                                     │    │
│  │    volumeLocalisation := getVolumeLocalisationIndicateurs(...)     │    │
│  │    causesDeplacements := getCausesDeplacementsIndicateurs(...)     │    │
│  │    vulnerabiliteBesoins := getVulnerabiliteBesoinsIndicateurs(...) │    │
│  │    dynamiquesAlerte := getDynamiquesAlerteIndicateurs(...)         │    │
│  │                                                                     │    │
│  │    return c.Status(200).JSON(response)                             │    │
│  │  }                                                                  │    │
│  │                                                                     │    │
│  │  func GetAlertesTempsReel(c *fiber.Ctx) error { ... }              │    │
│  │  func GetRepartitionGeographique(c *fiber.Ctx) error { ... }       │    │
│  │  func GetMotifsPieChart(c *fiber.Ctx) error { ... } 🆕             │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                    ↓                                         │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │                     overview/helpers.go                            │    │
│  │                                                                     │    │
│  │  getVolumeLocalisationIndicateurs(periode, province)               │    │
│  │    ├─ getRepartitionGeographique()                                 │    │
│  │    └─ getEvolutionMensuelle()                                      │    │
│  │                                                                     │    │
│  │  getCausesDeplacementsIndicateurs(periode, province)               │    │
│  │                                                                     │    │
│  │  getVulnerabiliteBesoinsIndicateurs(periode, province)             │    │
│  │    └─ getProfilDemographique()                                     │    │
│  │                                                                     │    │
│  │  getDynamiquesAlerteIndicateurs(periode, province)                 │    │
│  │    ├─ getZonesHautRisque()                                         │    │
│  │    ├─ getTendancesRetour()                                         │    │
│  │    └─ getAlertesPrecoces()                                         │    │
│  │                                                                     │    │
│  │  getAlertesRecentes(niveaux, province, jours)                      │    │
│  │                                                                     │    │
│  │  getMotifsPieChartData(periode, province) 🆕                        │    │
│  │    └─ Query motif_deplacements with French labels                 │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                    ↓                                         │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │                      overview/structs.go                           │    │
│  │                                                                     │    │
│  │  type IndicateursDeplacementResponse struct { ... }                │    │
│  │  type AlertesTempsReelResponse struct { ... }                      │    │
│  │  type RepartitionGeographiqueResponse struct { ... }               │    │
│  │  type MotifPieChartResponse struct { ... } 🆕                       │    │
│  │  type VolumeLocalisationIndicateurs struct { ... }                 │    │
│  │  type CausesDeplacementsIndicateurs struct { ... }                 │    │
│  │  type VulnerabiliteBesoinsIndicateurs struct { ... }               │    │
│  │  type DynamiquesAlerteIndicateurs struct { ... }                   │    │
│  │  + All supporting stats structs                                    │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                    ↓                                         │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │                         DATABASE (GORM)                            │    │
│  │                                                                     │    │
│  │  Tables:                                                            │    │
│  │  • migrants (UUIDs, dates, locations)                              │    │
│  │  • identites (personal info, demographics)                         │    │
│  │  • motif_deplacements (displacement reasons) ✅ NEW USAGE           │    │
│  │  • geolocalisations (geographic tracking)                          │    │
│  │  • alertes (alerts and warnings)                                   │    │
│  │                                                                     │    │
│  │  Queries:                                                           │    │
│  │  • COUNT migrations by period/province                             │    │
│  │  • JOIN identites for demographics                                 │    │
│  │  • GROUP BY motif_deplacements.type_motif ✅ FOR PIE CHART          │    │
│  │  • Filter by created_at, ville_actuelle, statut                    │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 🔄 Data Flow for Motifs Pie Chart (NEW)

```
1. USER ACTION
   └─ User selects period/province in UI

2. FRONTEND (Angular)
   └─ overview.component.ts → chargerDonnees()
      └─ deplacementService.getMotifsPieChart(periode, province)
         └─ HTTP GET /api/dashboard/overview/motifs-pie?periode=12&province=

3. BACKEND (Go/Fiber)
   └─ GetMotifsPieChart(c *fiber.Ctx)
      └─ getMotifsPieChartData(periode, province)
         └─ SQL Query:
            SELECT md.type_motif, COUNT(*) as count
            FROM motif_deplacements md
            JOIN migrants m ON md.migrant_uuid = m.uuid
            WHERE md.created_at >= [dateDebut]
            GROUP BY md.type_motif
            ORDER BY count DESC
         
         └─ Transform with French labels:
            {
              "economique" → "Économique",
              "politique" → "Politique",
              "persecution" → "Persécution",
              "naturelle" → "Catastrophe Naturelle",
              "familial" → "Familial",
              ...
            }

4. RESPONSE (JSON)
   {
     "data": [
       { "name": "Économique", "value": 145, "extra": "economique" },
       { "name": "Politique", "value": 89, "extra": "politique" },
       { "name": "Persécution", "value": 67, "extra": "persecution" },
       ...
     ],
     "total": 543,
     "date_mise_a_jour": "2025-11-23T...",
     "periode_analyse": "12 derniers mois"
   }

5. FRONTEND RENDERING
   └─ causesPieData = motifsResponse.data
      └─ updateCausesChart()
         └─ ApexCharts renders pie/bar chart
```

## 📊 Complete API Contract

### Request Parameters
```typescript
// All endpoints support these query params
{
  periode?: number;     // 1, 3, 6, 12 (months)
  province?: string;    // "Kinshasa", "Katanga", etc.
  niveaux?: string;     // "danger,critical,warning" (alertes only)
  jours?: number;       // 7, 14, 30 (alertes only)
}
```

### Response Types
```typescript
// 4 distinct response types, perfectly aligned
1. IndicateursDeplacementResponse  // Full dashboard data
2. AlertesTempsReelResponse        // Real-time alerts
3. RepartitionGeographiqueResponse // Geographic breakdown
4. MotifPieChartResponse 🆕         // Displacement motifs
```

## ✅ Verification Checklist

- [x] All 4 endpoints implemented
- [x] All interfaces match backend structs
- [x] Service methods properly typed
- [x] Component uses all endpoints
- [x] No manual calculations in frontend
- [x] Error handling implemented
- [x] Loading states managed
- [x] No compilation errors
- [x] Documentation complete

---

**Status:** ✅ **FULLY ALIGNED AND PRODUCTION READY**

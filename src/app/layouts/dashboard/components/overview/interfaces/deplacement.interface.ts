export interface IndicateursDeplacementResponse {
  volume_localisation: VolumeLocalisationIndicateurs;
  causes_deplacements: CausesDeplacementsIndicateurs;
  vulnerabilite_besoins: VulnerabiliteBesoinsIndicateurs;
  dynamiques_alerte: DynamiquesAlerteIndicateurs;
  date_generation: string;
  periode_analyse: string;
}

export interface AlertesTempsReelResponse {
  alertes_actives: AlertePrecoceStats[];
  nombre_total: number;
  date_mise_a_jour: string;
}

export interface RepartitionGeographiqueResponse {
  repartition_provinces: RepartitionProvinceStats[];
  date_mise_a_jour: string;
  periode_analyse: string;
}

export interface VolumeLocalisationIndicateurs {
  nombre_total_pdi: number;
  nombre_total_migrants: number;
  nombre_deplaces_internes: number;
  personnes_retournees: number;
  repartition_geographique: RepartitionProvinceStats[];
  evolution_mensuelle: EvolutionTemporelleStats[];
}

export interface CausesDeplacementsIndicateurs {
  pourcentage_conflits_armes: number;
  pourcentage_catastrophes: number;
  pourcentage_persecution: number;
  pourcentage_violence_generalisee: number;
  pourcentage_autres_causes: number;
  details_causes: CauseDetailStats[];
}

export interface VulnerabiliteBesoinsIndicateurs {
  profil_demographique: ProfilDemographiqueStats;
  acces_services_base: AccesServicesStats;
  taux_occupation_sites: number;
  deplaces_hors_sites: number;
}

export interface DynamiquesAlerteIndicateurs {
  zones_haut_risque: ZoneRisqueStats[];
  tendances_retour: TendanceRetourStats[];
  alertes_precoces: AlertePrecoceStats[];
  mouvements_massifs_recent: number;
}

export interface RepartitionProvinceStats {
  province: string;
  nombre_pdi: number;
  pourcentage: number;
}

export interface EvolutionTemporelleStats {
  periode: string;
  nouveaux_deplaces: number;
  retours: number;
  total_cumule: number;
}

export interface CauseDetailStats {
  type_motif: string;
  nombre_cas: number;
  pourcentage: number;
}

export interface ProfilDemographiqueStats {
  pourcentage_femmes: number;
  pourcentage_enfants: number;
  pourcentage_ages: number;
  age_moyen: number;
}

export interface AccesServicesStats {
  acces_eau: number;
  acces_sante: number;
  acces_education: number;
  acces_logement: number;
}

export interface ZoneRisqueStats {
  zone: string;
  niveau_risque: string;
  type_menace: string;
  population_risque: number;
}

export interface TendanceRetourStats {
  zone_origine: string;
  zone_retour: string;
  nombre_retours: number;
  tendance_evolution: string;
}

export interface AlertePrecoceStats {
  zone: string;
  type_alerte: string;
  niveau_gravite: string;
  date_detection: string;
  description: string;
}

export interface ChartDataPoint {
  name: string;
  value: number;
  extra?: any;
}

export interface ChartSeries {
  name: string;
  series: ChartDataPoint[];
}
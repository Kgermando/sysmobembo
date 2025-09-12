// ===============================
// INTERFACES POUR L'ANALYTICS AVANCÉ
// ===============================

export interface GlobalMigrationStats {
  total_migrants: number;
  migrants_actifs: number;
  nouveaux_migrants_30j: number;
  taux_croissance_mensuel: number;
  distribution_genre: { [key: string]: number };
  distribution_age: { [key: string]: number };
  statut_migratoire: { [key: string]: number };
  pays_origine_top10: PaysStatistique[];
  tendance_mensuelle_12m: TendanceMensuelle[];
  motifs_principaux: MotifStatistique[];
  indicateurs_risque: IndicateursRisque;
}

export interface PaysStatistique {
  pays: string;
  nombre: number;
  pourcentage: number;
}

export interface TendanceMensuelle {
  mois: string;
  annee: number;
  nombre: number;
  variation_pourcentage: number;
}

export interface MotifStatistique {
  motif: string;
  nombre: number;
  pourcentage: number;
  urgence_moyenne: string;
}

export interface IndicateursRisque {
  risque_securitaire: number;
  risque_humanitaire: number;
  risque_sante: number;
  score_vulnerabilite: number;
  alertes_actives: number;
}

// ===============================
// ANALYSE PRÉDICTIVE AVANCÉE
// ===============================

export interface PredictiveAnalysis {
  prediction_flux_migratoire: FluxMigratoire;
  modele_predictif: ModelePredictif;
  analyse_comportementale: ComportementAnalysis;
  alertes_predictives: AlertePredictive[];
  scenarios_prevision: ScenarioPrevision[];
  analyse_temporelle: AnalyseTemporelle;
  modeles_statistiques: ModelesStatistiques;
}

export interface FluxMigratoire {
  prochaine_migration: PrevisionMigration[];
  corridors_migratoires: CorridorMigration[];
  saisonnalite_flux: SaisonnaliteAnalysis[];
}

export interface PrevisionMigration {
  periode: string;
  nombre_prevus: number;
  niveau_confiance: number;
  facteurs_determinants: string[];
}

export interface CorridorMigration {
  origine: string;
  destination: string;
  volume: number;
  frequence: number;
  niveau_risque: string;
}

export interface SaisonnaliteAnalysis {
  mois: number;
  nom_mois: string;
  index_saisonnier: number;
  volume_attendu: number;
}

export interface ModelePredictif {
  algorithme: string;
  precision: number;
  derniere_maj: string;
  variables_cles: string[];
  score_accuracy: number;
}

export interface ComportementAnalysis {
  patterns_mobilite: PatternMobilite[];
  segmentation_migrants: SegmentMigrant[];
  analyse_reseau: AnalyseReseau;
}

export interface PatternMobilite {
  type: string;
  frequence: number;
  duree_moyenne: number;
  description: string;
}

export interface SegmentMigrant {
  segment: string;
  taille: number;
  caracteristiques: string[];
  comportement_type: string;
}

export interface AnalyseReseau {
  communautes_detectees: number;
  densite_reseau: number;
  noeuds_influents: NoeudInfluent[];
}

export interface NoeudInfluent {
  localisation: string;
  score_influence: number;
  type_influence: string;
}

// ===============================
// ANALYSE TEMPORELLE
// ===============================

export interface AnalyseTemporelle {
  tendances_long_terme: TendanceLongTerme[];
  cycles_saisonniers: CycleSaisonnier[];
  analyse_frequence: AnalyseFrequence;
  predictions_temporelles: PredictionTemporelle[];
}

export interface TendanceLongTerme {
  periode: string;
  tendance: string;
  coefficient: number;
  confiance: number;
}

export interface CycleSaisonnier {
  saison: string;
  multiplicateur: number;
  variance: number;
  predictibilite: number;
}

export interface AnalyseFrequence {
  frequence_arrivees: { [key: string]: number };
  frequence_departs: { [key: string]: number };
  peaks_detected: Peak[];
  pattern_recurrents: PatternRecurrent[];
}

export interface Peak {
  date: string;
  intensite: number;
  type: string;
  duree_jours: number;
}

export interface PatternRecurrent {
  nom: string;
  frequence_jours: number;
  amplitude: number;
  confiance: number;
}

export interface PredictionTemporelle {
  date_cible: string;
  prediction: number;
  confiance: number;
  intervalle: IntervalleConfiance;
}

export interface IntervalleConfiance {
  min: number;
  max: number;
}

// ===============================
// MODÈLES STATISTIQUES
// ===============================

export interface ModelesStatistiques {
  modeles_regression: ModeleRegression[];
  modeles_classification: ModeleClassification[];
  modeles_time_series: ModeleTimeSeries[];
  metriques_performance: MetriquesPerformance;
}

export interface ModeleRegression {
  nom: string;
  variables: string[];
  r_squared: number;
  mae: number;
  rmse: number;
  last_trained: string;
}

export interface ModeleClassification {
  nom: string;
  classes: string[];
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  last_trained: string;
}

export interface ModeleTimeSeries {
  nom: string;
  type: string;
  horizon_days: number;
  accuracy: number;
  last_trained: string;
}

export interface MetriquesPerformance {
  accuracy_globale: number;
  temps_entrainement_minutes: number;
  temps_prediction_ms: number;
  consommation_memoire_mb: number;
  metriques_profondeur: { [key: string]: number };
}

export interface AlertePredictive {
  id: string;
  type: string;
  priorite: string;
  message: string;
  probabilite: number;
  date_prevue: string;
  zone_impact: string;
}

export interface ScenarioPrevision {
  nom: string;
  probabilite: number;
  impact: string;
  description: string;
  mesures_recommandees: string[];
  horizon_temporel: string;
}

// ===============================
// TENDANCES MIGRATOIRES
// ===============================

export interface MigrationTrend {
  date: string;
  count: number;
  type: string;
  country: string;
}

// ===============================
// ANALYSE DE RISQUES AVANCÉE
// ===============================

export interface AdvancedRiskAnalysis {
  score_global: number;
  niveau_risque: string;
  facteurs_risque: string[];
  recommandations: string[];
  tendance_risque: string;
  metriques_risque: { [key: string]: number };
  evolution_risque: EvolutionRisque[];
}

export interface EvolutionRisque {
  date: string;
  score: number;
  type: string;
}

// ===============================
// PERFORMANCE DES MODÈLES
// ===============================

export interface PredictiveModelsPerformance {
  modeles_actifs: number;
  accuracy_moyenne: number;
  derniere_evaluation: string;
  metriques_detaillees: { [key: string]: any };
  comparaison_modeles: ComparaisonModele[];
  recommandations_ia: string[];
}

export interface ComparaisonModele {
  nom: string;
  accuracy: number;
  temps_entrainement_heures: number;
  evaluation: string;
}

// ===============================
// RESPONSE TYPES
// ===============================

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

export interface IMigrant {
  uuid: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;

  numero_identifiant: string;

  // Informations personnelles
  nom: string;
  prenom: string;
  date_naissance: string;
  lieu_naissance: string;
  sexe: 'M' | 'F';
  nationalite: string;

  // Documents d'identité
  type_document: 'passport' | 'carte_identite' | 'permis_conduire';
  numero_document: string;
  date_emission_document?: string;
  date_expiration_document?: string;
  autorite_emission?: string;

  // Informations de contact
  telephone?: string;
  email?: string;
  adresse_actuelle?: string;
  ville_actuelle?: string;
  pays_actuel?: string;

  // Informations familiales
  situation_matrimoniale?: 'celibataire' | 'marie' | 'divorce' | 'veuf';
  nombre_enfants?: number;
  personne_contact?: string;
  telephone_contact?: string;

  // Statut migration
  statut_migratoire: 'regulier' | 'irregulier' | 'demandeur_asile' | 'refugie';
  date_entree?: string;
  point_entree?: string;
  pays_origine: string;
  pays_destination?: string;

  // Relations
  motif_deplacements?: IMotifDeplacement[];
  alertes?: IAlert[];
  biometries?: IBiometrie[];
  geolocalisations?: IGeolocalisation[];

  // Métadonnées
  actif: boolean;
}

export interface IMotifDeplacement {
  uuid: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;

  // Identification et libellés
  code: string;
  libelle_fr: string;
  libelle_en?: string;
  description?: string;

  // Classification
  categorie: string;
  priorite: number;

  // Statut
  actif: boolean;
}

export interface IBiometrie {
  uuid: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;

  migrant_uuid: string;

  // Types de données biométriques
  type_biometrie: 'empreinte_digitale' | 'reconnaissance_faciale' | 'iris' | 'scan_retine' | 'signature_numerique';
  index_doigt?: number;
  qualite_donnee: 'excellente' | 'bonne' | 'moyenne' | 'faible';

  // Données encodées (exclues pour sécurité)
  algorithme_encodage: string;
  taille_fichier: number;

  // Métadonnées de capture
  date_capture: string;
  dispositif_capture?: string;
  resolution_capture?: string;
  operateur_capture?: string;

  // Validation et vérification
  verifie: boolean;
  date_verification?: string;
  score_confiance?: number;

  // Sécurité
  chiffre: boolean;
  date_expiration?: string;

  // Relation
  migrant?: IMigrant;
}

export interface IGeolocalisation {
  uuid: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;

  migrant_uuid: string;

  // Coordonnées géographiques
  latitude: number;
  longitude: number;
  altitude?: number;
  precision?: number;

  // Informations contextuelles
  type_localisation: 'residence_actuelle' | 'lieu_travail' | 'point_passage' | 'frontiere' | 'centre_accueil' | 'urgence';
  description?: string;
  adresse?: string;
  ville?: string;
  pays: string;
  code_postal?: string;

  // Métadonnées de capture
  date_enregistrement: string;
  methode_capture: 'gps' | 'manuel' | 'automatique';
  dispositif_source?: string;
  fiabilite_source: 'elevee' | 'moyenne' | 'faible';

  // Statut et validité
  actif: boolean;
  date_validation?: string;
  valide_par?: string;
  commentaire?: string;

  // Informations de mouvement
  type_mouvement?: 'arrivee' | 'depart' | 'transit' | 'residence_temporaire' | 'residence_permanente';
  duree_sejour?: number;
  prochaine_destination?: string;

  // Relation
  migrant?: IMigrant;
}

export interface IAlert {
  uuid: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;

  migrant_uuid: string;

  // Informations de l'alerte
  type_alerte: 'securite' | 'sante' | 'juridique' | 'administrative' | 'humanitaire';
  niveau_gravite: 'info' | 'warning' | 'danger' | 'critical';
  titre: string;
  description: string;

  // Statut et traitement
  statut: 'active' | 'resolved' | 'dismissed' | 'expired';
  date_expiration?: string;
  action_requise?: string;
  personne_responsable?: string;

  // Métadonnées de traitement
  date_resolution?: string;
  commentaire_resolution?: string;
  notifier_autorites: boolean;

  // Géolocalisation de l'alerte
  latitude?: number;
  longitude?: number;
  adresse?: string;

  // Relation
  migrant?: IMigrant;
}

// Types pour les formulaires
export interface IMigrantFormData {
  nom: string;
  prenom: string;
  date_naissance: string;
  lieu_naissance: string;
  sexe: string;
  nationalite: string;
  type_document: string;
  numero_document: string;
  date_emission_document?: string;
  date_expiration_document?: string;
  autorite_emission?: string;
  telephone?: string;
  email?: string;
  adresse_actuelle?: string;
  ville_actuelle?: string;
  pays_actuel?: string;
  situation_matrimoniale?: string;
  nombre_enfants?: number;
  personne_contact?: string;
  telephone_contact?: string;
  statut_migratoire: string;
  date_entree?: string;
  point_entree?: string;
  pays_origine: string;
  pays_destination?: string;
  actif: boolean;
}

// Interface pour la pagination backend (utilisée maintenant)
export interface IBackendPaginationResponse<T> {
  status: string;
  message: string;
  data: T[];
  pagination: {
    total_records: number;
    total_pages: number;
    current_page: number;
    page_size: number;
  };
  applied_filters?: {
    search?: string;
    statut_migratoire?: string;
    nationalite?: string;
    pays_origine?: string;
    genre?: string;
    actif?: string;
    type_document?: string;
    date_creation_debut?: string;
    date_creation_fin?: string;
    date_naissance_debut?: string;
    date_naissance_fin?: string;
  };
}

// Interface pour les réponses API backend (utilisée maintenant)
export interface IBackendApiResponse<T> {
  status: string;
  message: string;
  data: T;
  error?: string;
}

// DEPRECATED - À supprimer progressivement
// Interface pour la pagination (ancienne version)
export interface IPaginationResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

// DEPRECATED - À supprimer progressivement  
// Interface pour les réponses API (ancienne version)
export interface IApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  error?: string;
}

// Interface pour les statistiques
export interface IMigrantStats {
  total_migrants: number;
  active_migrants: number;
  regular_migrants: number;
  irregular_migrants: number;
  refugee_migrants: number;
  asylum_seekers: number;
}

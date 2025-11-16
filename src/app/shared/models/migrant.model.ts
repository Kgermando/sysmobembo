import { IIdentite } from './identite.model';

export interface IMigrant {
  uuid: string;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;

  numero_identifiant: string;

  // Relation avec Identite
  identite_uuid: string;
  identite?: IIdentite;

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
  date_entree?: Date;
  point_entree?: string;
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
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;

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
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;

  migrant_uuid: string;

  // Types de données biométriques
  type_biometrie: 'empreinte_digitale' | 'reconnaissance_faciale' | 'iris' | 'scan_retine' | 'signature_numerique';
  index_doigt?: number;
  qualite_donnee: 'excellente' | 'bonne' | 'moyenne' | 'faible';

  // Données encodées (exclues pour sécurité)
  algorithme_encodage: string;
  taille_fichier: number;

  // Métadonnées de capture
  date_capture: Date;
  dispositif_capture?: string;
  resolution_capture?: string;
  operateur_capture?: string;

  // Validation et vérification
  verifie: boolean;
  date_verification?: Date;
  score_confiance?: number;

  // Sécurité
  chiffre: boolean;
  date_expiration?: Date;

  // Relation
  migrant?: IMigrant;
}

export interface IGeolocalisation {
  uuid: string;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;

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
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;

  migrant_uuid: string;

  // Informations de l'alerte
  type_alerte: 'securite' | 'sante' | 'juridique' | 'administrative' | 'humanitaire';
  niveau_gravite: 'info' | 'warning' | 'danger' | 'critical';
  titre: string;
  description: string;

  // Statut et traitement
  statut: 'active' | 'resolved' | 'dismissed' | 'expired';
  date_expiration?: Date;
  action_requise?: string;
  personne_responsable?: string;

  // Métadonnées de traitement
  date_resolution?: Date;
  commentaire_resolution?: string;

  // Relation
  migrant?: IMigrant;
}

// Types pour les formulaires
export interface IMigrantFormData {
  numero_identifiant: string;

  // Relation avec Identite
  identite_uuid: string;

  // Informations de contact
  telephone?: string;
  email?: string;
  adresse_actuelle?: string;
  ville_actuelle?: string;
  pays_actuel?: string;

  // Informations familiales
  situation_matrimoniale?: string;
  nombre_enfants?: number;
  personne_contact?: string;
  telephone_contact?: string;

  // Statut migration
  statut_migratoire: string;
  date_entree?: string; // Gardé en string pour les formulaires HTML
  point_entree?: string;
  pays_destination?: string;

  // Métadonnées
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
    pays_actuel?: string;
    pays_destination?: string;
    situation_matrimoniale?: string;
    actif?: string;
    date_creation_debut?: Date;
    date_creation_fin?: Date;
    date_entree_debut?: Date;
    date_entree_fin?: Date;
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

// Utilitaires pour la conversion de dates
export class DateUtils {
  // Convertit les dates string en Date pour les données reçues de l'API
  static parseApiDates<T extends Record<string, any>>(data: T): T {
    const result = { ...data } as any;
    const dateFields = ['created_at', 'updated_at', 'deleted_at', 'date_naissance',
      'date_emission_document', 'date_expiration_document', 'date_entree',
      'date_capture', 'date_verification', 'date_expiration',
      'date_resolution'];

    dateFields.forEach(field => {
      if (result[field] && typeof result[field] === 'string') {
        result[field] = new Date(result[field]);
      }
    });

    return result;
  }

  // Convertit les dates Date en string pour l'envoi à l'API
  static stringifyDates<T extends Record<string, any>>(data: T): T {
    const result = { ...data } as any;
    const dateFields = ['created_at', 'updated_at', 'deleted_at', 'date_naissance',
      'date_emission_document', 'date_expiration_document', 'date_entree',
      'date_capture', 'date_verification', 'date_expiration',
      'date_resolution'];

    dateFields.forEach(field => {
      if (result[field] && result[field] instanceof Date) {
        result[field] = (result[field] as Date).toISOString();
      }
    });

    return result;
  }

  // Formate une date pour l'affichage
  static formatDate(date: Date | string | undefined, locale: string = 'fr-FR'): string {
    if (!date) return '-';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString(locale);
  }

  // Formate une date et heure pour l'affichage
  static formatDateTime(date: Date | string | undefined, locale: string = 'fr-FR'): string {
    if (!date) return '-';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleString(locale);
  }

  // Convertit une Date en string pour les inputs HTML
  static toInputDate(date: Date | undefined): string {
    if (!date) return '';
    return date.toISOString().split('T')[0];
  }

  // Convertit un string d'input HTML en Date
  static fromInputDate(dateString: string | undefined): Date | undefined {
    if (!dateString) return undefined;
    return new Date(dateString);
  }
}

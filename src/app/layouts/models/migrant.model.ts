import { IIdentite } from "../../shared/models/identite.model";
import { IAlert } from "./alert.model";
import { IBiometrie } from "./biometrie.model";
import { IGeolocalisation } from "./geolocalisation.model";
import { IMotifDeplacement } from "./motifdeplacement.model";

export interface IMigrant {
  uuid: string;
  created_at: Date;
  updated_at: Date;

  // Relation avec Identite
  identite_uuid: string;
  identite?: IIdentite;

  // Informations d'identification du migrant
  numero_identifiant: string;

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
  date_entree?: Date | null;
  point_entree?: string;
  pays_destination?: string;

  // Relations avec autres modèles
  motif_deplacements?: IMotifDeplacement[];
  alertes?: IAlert[];
  biometries?: IBiometrie[];
  geolocalisations?: IGeolocalisation[];
}

// Form data interface for create/update operations
export interface IMigrantFormData {
  identite_uuid: string;
  telephone?: string;
  email?: string;
  adresse_actuelle?: string;
  ville_actuelle?: string;
  pays_actuel?: string;
  situation_matrimoniale?: 'celibataire' | 'marie' | 'divorce' | 'veuf';
  nombre_enfants?: number;
  personne_contact?: string;
  telephone_contact?: string;
  statut_migratoire: 'regulier' | 'irregulier' | 'demandeur_asile' | 'refugie';
  date_entree?: string;
  point_entree?: string;
  pays_destination?: string;
}

// Backend API response interface
export interface IBackendApiResponse<T> {
  status: string;
  message: string;
  data: T;
}

// Backend API pagination response interface
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
}

// Migrant statistics interface
export interface IMigrantStats {
  total_migrants: number;
  regular_migrants: number;
  irregular_migrants: number;
  refugee_migrants: number;
  asylum_seekers: number;
}

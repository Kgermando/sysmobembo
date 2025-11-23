import { IMigrant } from './migrant.model';

// Type pour les différents types de données biométriques
export type TypeBiometrie = 
  | 'empreinte_digitale' 
  | 'reconnaissance_faciale' 
  | 'iris' 
  | 'scan_retine' 
  | 'signature_numerique';

// Type pour la qualité des données
export type QualiteDonnee = 'excellente' | 'bonne' | 'moyenne' | 'faible';

// Biometrie représente les données biométriques du migrant
export interface Biometrie {
  uuid: string;
  created_at: Date | string;
  updated_at: Date | string;
  deleted_at?: Date | string | null;

  migrant_uuid: string;
  migrant?: IMigrant;

  // Types de données biométriques
  type_biometrie: TypeBiometrie;
  index_doigt?: number | null; // Pour les empreintes (1-10)
  qualite_donnee?: QualiteDonnee;

  // Données encodées
  donnees_biometriques: string; // Base64 ou hash
  algorithme_encodage: string;
  taille_fichier?: number; // en bytes

  // Métadonnées de capture
  date_capture: Date | string;
  dispositif_capture?: string;
  resolution_capture?: string;
  operateur_capture?: string;

  // Sécurité et chiffrement
  chiffre?: boolean; // Indique si les données sont chiffrées
  // Note: cle_chiffrement n'est pas incluse (non exposée en JSON)

  // Validation et vérification
  verifie?: boolean;
  date_verification?: Date | string | null;
  score_confiance?: number | null; // 0-1
}

// Alias pour compatibilité si nécessaire
export interface IBiometrie extends Biometrie {}
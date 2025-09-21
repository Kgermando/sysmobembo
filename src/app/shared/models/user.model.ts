/**
 * Interface User basée sur l'entité User du backend Go
 * Représente un utilisateur avec toutes ses informations personnelles et professionnelles
 * Aligné avec la structure Go backend
 */
export interface IUser {
  // Identifiants principaux et audit GORM
  uuid: string;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date;

  // Informations personnelles de base
  nom: string;
  postnom: string;
  prenom: string;
  sexe: string; // M/F
  date_naissance: Date;
  lieu_naissance: string;

  // État civil
  etat_civil?: string; // Célibataire, Marié(e), Divorcé(e), Veuf(ve)
  nombre_enfants?: number;

  // Nationalité et documents d'identité
  nationalite: string;
  numero_cni?: string; // Carte Nationale d'Identité
  date_emission_cni?: Date;
  date_expiration_cni?: Date;
  lieu_emission_cni?: string;

  // Contacts
  email: string;
  telephone: string;
  telephone_urgence?: string;

  // Adresse
  province: string;
  ville: string;
  commune: string;
  quartier: string;
  avenue?: string;
  numero?: string;

  // Informations professionnelles
  matricule: string;
  grade: string;
  fonction: string;
  service: string;
  direction: string;
  ministere: string;
  date_recrutement: Date;
  date_prise_service: Date;
  type_agent: string; // Fonctionnaire, Contractuel, Stagiaire
  statut: string; // Actif, Retraité, Suspendu, Révoqué

  // Formation et éducation
  niveau_etude?: string; // Primaire, Secondaire, Universitaire, Post-universitaire
  diplome_base?: string;
  universite_ecole?: string;
  annee_obtention?: number;
  specialisation?: string;

  // Informations bancaires
  numero_bancaire?: string;
  banque?: string;

  // Informations de sécurité sociale
  numero_cnss?: string; // Institut National de Sécurité Sociale
  numero_onem?: string; // Office National de l'Emploi

  // Documents et photos
  photo_profil?: string; // URL ou chemin vers la photo
  cv_document?: string; // URL ou chemin vers le CV
  
  // Informations système
  password?: string;
  password_confirm?: string;
  role: string; // Agent, Manager, Supervisor, Administrator
  permission: string;
  status: boolean;
  signature?: string;

  // Audit et suivi
  dernier_acces?: Date;
  nombre_connexions?: number;
}

/**
 * Interface pour les options de filtrage
 */
export interface UserFilterOptions {
  roles: Array<{ value: string; label: string }>;
  typeAgents: Array<{ value: string; label: string }>;
  statuts: Array<{ value: string; label: string }>;
  permissions: Array<{ value: string; label: string }>;
  etatsCivils: Array<{ value: string; label: string }>;
  niveauxEtude: Array<{ value: string; label: string }>;
}

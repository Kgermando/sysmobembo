import { IUser } from './user.model';

/**
 * Interface pour les données de connexion
 */
export interface LoginRequest {
  identifier: string; // Email ou téléphone
  password: string;
}

/**
 * Interface pour la réponse de connexion
 */
export interface AuthResponse {
  message: string;
  data: string; // JWT token
}

/**
 * Interface pour l'inscription d'un nouvel utilisateur
 */
export interface RegisterRequest {
  // Informations personnelles de base
  nom: string;
  postnom: string;
  prenom: string;
  sexe: string;
  date_naissance: string;
  lieu_naissance: string;

  // Nationalité
  nationalite: string;

  // Contacts
  email: string;
  telephone: string;

  // Adresse
  province: string;
  ville: string;
  commune: string;
  quartier: string;

  // Informations professionnelles
  matricule: string;
  grade: string;
  fonction: string;
  service: string;
  direction: string;
  ministere: string;
  date_recrutement: string;
  date_prise_service: string;
  type_agent: string;
  statut: string;

  // Authentification
  password: string;
  password_confirm: string;
  role: string; // Agent, Manager, Supervisor, Administrator
  permission: string;
  status?: boolean;
  signature?: string;
}

/**
 * Interface pour l'état d'authentification
 */
export interface AuthState {
  isAuthenticated: boolean;
  user: IUser | null;
  token: string | null;
  isLoading: boolean;
  isOnline: boolean;
  lastActivity: Date | null;
}

/**
 * Interface pour les données de session
 */
export interface SessionData {
  user: IUser;
  token: string;
  loginTime: Date;
  lastActivity: Date;
  expiresAt: Date;
}

/**
 * Interface pour la mise à jour du profil utilisateur
 */
export interface UpdateProfileRequest {
  nom?: string;
  postnom?: string;
  prenom?: string;
  email?: string;
  telephone?: string;
  telephone_urgence?: string;
  province?: string;
  ville?: string;
  commune?: string;
  quartier?: string;
  avenue?: string;
  numero?: string;
  signature?: string;
  photo_profil?: string;
}

/**
 * Interface pour le changement de mot de passe
 */
export interface ChangePasswordRequest {
  old_password: string;
  password: string;
  password_confirm: string;
}

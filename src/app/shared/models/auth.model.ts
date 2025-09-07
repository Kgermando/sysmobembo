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
  fullname: string;
  email: string;
  telephone: string;
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
  fullname?: string;
  email?: string;
  telephone?: string;
  signature?: string;
}

/**
 * Interface pour le changement de mot de passe
 */
export interface ChangePasswordRequest {
  old_password: string;
  password: string;
  password_confirm: string;
}

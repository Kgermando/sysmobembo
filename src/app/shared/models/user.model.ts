/**
 * Interface User basée sur l'entité User du backend
 * Représente un utilisateur connecté avec ses informations
 */
export interface IUser {
  // Identifiants principaux
  uuid: string;
  
  // Informations personnelles
  fullname: string;
  email: string;
  telephone: string;
  
  // Authentification et autorisation
  role: string; // Agent, Manager, Supervisor, Administrator
  permission: string;
  status: boolean;
  
  // Media
  signature?: string;
  
  // Métadonnées
  createdAt?: string;
  updatedAt?: string;
  
  // Propriétés calculées utilitaires 
  initials?: string;
  isOnline?: boolean;
  lastActivity?: string;
}

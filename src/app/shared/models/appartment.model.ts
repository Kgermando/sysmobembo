import { IUser } from './user.model';

/**
 * Interface Appartment basée sur l'entité Appartment du backend
 * Représente un appartement avec ses informations complètes
 */
export interface IAppartment {
  // Identifiants principaux
  uuid: string;
  
  // Informations de base
  name: string;        // Locateur Ex. okapi
  number: string;      // Numero appartement Ex. 1201
  
  // Caractéristiques physiques
  surface: number;     // Surface en m²
  rooms: number;       // Nombre de chambres
  bathrooms: number;   // Nombre de salles de bain
  balcony: boolean;    // Présence d'un balcon
  furnished: boolean;  // Meublé ou non
  
  // Informations financières
  monthly_rent: number;     // Loyer mensuel
  garantie_month: number;   // Nombre de mois de garantie
  garantie_montant: number; // Montant de la garantie
  
  // Date d'échéance
  echeance: string;    // Date de paiement loyer (format ISO)
  
  // Statut et disponibilité
  status: 'available' | 'occupied' | 'maintenance' | 'unavailable';
  
  // Gestionnaire/Agent responsable
  manager_uuid: string;
  manager?: IUser;
  
  // Relations inverses
  caisses?: any[];  // À définir selon le modèle Caisse
  
  // Métadonnées
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Interface pour les données de formulaire (création/modification)
 */
export interface IAppartmentFormData {
  name: string;
  number: string;
  surface: number;
  rooms: number;
  bathrooms: number;
  balcony: boolean;
  furnished: boolean;
  monthly_rent: number;
  garantie_month: number;
  garantie_montant: number;
  echeance: string;
  status: string;
  manager_uuid: string;
}

/**
 * Type pour les statuts d'appartement
 */
export type AppartmentStatus = 'available' | 'occupied' | 'maintenance' | 'unavailable';

/**
 * Constantes pour les statuts
 */
export const APPARTMENT_STATUS = {
  AVAILABLE: 'available' as AppartmentStatus,
  OCCUPIED: 'occupied' as AppartmentStatus,
  MAINTENANCE: 'maintenance' as AppartmentStatus,
  UNAVAILABLE: 'unavailable' as AppartmentStatus
} as const;
 
/**
 * Labels pour les statuts en français
 */
export const APPARTMENT_STATUS_LABELS = {
  available: 'Disponible',
  occupied: 'Occupé',
  maintenance: 'En maintenance',
  unavailable: 'Indisponible'
} as const;

import { IEntreprise } from './entreprise.model';

/**
 * Interface pour les informations de département (basée sur le service RH)
 */
export interface IDepartement {
  uuid: string;
  nom: string;
  code: string;
  description?: string;
  responsableUUID?: string;
  budgetAnnuel?: number;
  objectifs?: string;
  entrepriseUUID: string;
  entreprise?: IEntreprise;
  responsable?: any; // Évite la référence circulaire avec IUser
  createdAt?: string;
  updatedAt?: string;
}

import { IEntreprise } from './entreprise.model';
import { IDepartement } from './departement.model';

/**
 * Interface pour les informations de poste (basée sur le service RH)
 */
export interface IPoste {
  uuid: string;
  nom: string;
  code: string;
  description?: string;
  niveauHierarchique?: number;
  salaireMin?: number;
  salaireMax?: number;
  competencesRequises?: string;
  responsabilites?: string;
  entrepriseUUID: string;
  departementUUID: string;
  entreprise?: IEntreprise;
  departement?: IDepartement;
  createdAt?: string;
  updatedAt?: string;
}

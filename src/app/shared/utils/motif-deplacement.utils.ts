export const TYPE_MOTIF_OPTIONS = [
  { value: 'economique', label: 'Économique' },
  { value: 'politique', label: 'Politique' },
  { value: 'persecution', label: 'Persécution' },
  { value: 'naturelle', label: 'Catastrophe naturelle' },
  { value: 'familial', label: 'Familial' },
  { value: 'education', label: 'Éducation' },
  { value: 'sanitaire', label: 'Sanitaire' },
  { value: 'conflit_arme', label: 'Conflit armé' },
  { value: 'catastrophe_naturelle', label: 'Catastrophe naturelle' },
  { value: 'violence_generalisee', label: 'Violence généralisée' }
];

export const URGENCE_OPTIONS = [
  { value: 'faible', label: 'Faible' },
  { value: 'moyenne', label: 'Moyenne' },
  { value: 'elevee', label: 'Élevée' },
  { value: 'critique', label: 'Critique' }
];

export const CARACTERE_VOLONTAIRE_OPTIONS = [
  { value: true, label: 'Volontaire' },
  { value: false, label: 'Involontaire' }
];

// Fonctions utilitaires
export function getTypeMotifLabel(typeMotif: string): string {
  const option = TYPE_MOTIF_OPTIONS.find(opt => opt.value === typeMotif);
  return option ? option.label : typeMotif;
}

export function getUrgenceLabel(urgence: string): string {
  const option = URGENCE_OPTIONS.find(opt => opt.value === urgence);
  return option ? option.label : urgence;
}

export function getUrgenceBadgeClass(urgence: string): string {
  switch (urgence) {
    case 'critique': return 'badge-danger';
    case 'elevee': return 'badge-warning';
    case 'moyenne': return 'badge-info';
    case 'faible': return 'badge-secondary';
    default: return 'badge-light';
  }
}

export function getCaractereBadgeClass(volontaire: boolean): string {
  return volontaire ? 'badge-success' : 'badge-danger';
}

// Nouvelles fonctions utilitaires pour la transformation des données

import { IMotifDeplacementFormData } from '../models/motif-deplacement.model';
import { DateUtils } from './date.utils';

export class MotifDeplacementDataTransformer {
  
  /**
   * Transforme les données brutes du formulaire en données conformes à l'interface backend
   */
  static transformFormDataToBackend(formData: any): IMotifDeplacementFormData {
    try {
      // Validation et transformation des données
      const transformedData: IMotifDeplacementFormData = {
        migrant_uuid: this.validateAndCleanString(formData.migrant_uuid),
        type_motif: this.validateTypeMotif(formData.type_motif),
        motif_principal: this.validateAndCleanString(formData.motif_principal),
        motif_secondaire: formData.motif_secondaire ? this.validateAndCleanString(formData.motif_secondaire) : undefined,
        description: formData.description ? this.validateAndCleanString(formData.description) : undefined,
        caractere_volontaire: Boolean(formData.caractere_volontaire),
        urgence: formData.urgence ? this.validateUrgence(formData.urgence) : undefined,
        date_declenchement: this.validateAndTransformDate(formData.date_declenchement),
        duree_estimee: formData.duree_estimee ? this.validateNumber(formData.duree_estimee) : undefined
      };

      // Validation finale
      this.validateMotifData(transformedData);
      
      return transformedData;
    } catch (error) {
      console.error('Erreur lors de la transformation des données:', error);
      throw error;
    }
  }

  /**
   * Valide et nettoie une chaîne de caractères
   */
  private static validateAndCleanString(value: any): string {
    if (typeof value !== 'string') {
      throw new Error(`Valeur attendue de type string, reçu: ${typeof value}`);
    }
    return value.trim();
  }

  /**
   * Valide le type de motif
   */
  private static validateTypeMotif(value: any): 'economique' | 'politique' | 'persecution' | 'naturelle' | 'familial' | 'education' | 'sanitaire' | 'conflit_arme' | 'catastrophe_naturelle' | 'violence_generalisee' {
    const validTypes = TYPE_MOTIF_OPTIONS.map(opt => opt.value);
    
    if (!validTypes.includes(value)) {
      throw new Error(`Type de motif invalide: ${value}. Types valides: ${validTypes.join(', ')}`);
    }
    
    return value as 'economique' | 'politique' | 'persecution' | 'naturelle' | 'familial' | 'education' | 'sanitaire' | 'conflit_arme' | 'catastrophe_naturelle' | 'violence_generalisee';
  }

  /**
   * Valide le niveau d'urgence
   */
  private static validateUrgence(value: any): 'faible' | 'moyenne' | 'elevee' | 'critique' {
    const validUrgences = URGENCE_OPTIONS.map(opt => opt.value);
    
    if (!validUrgences.includes(value)) {
      throw new Error(`Niveau d'urgence invalide: ${value}. Niveaux valides: ${validUrgences.join(', ')}`);
    }
    
    return value as 'faible' | 'moyenne' | 'elevee' | 'critique';
  }

  /**
   * Valide et transforme une date
   */
  private static validateAndTransformDate(value: any): Date {
    const date = DateUtils.toDate(value);
    
    if (!date || isNaN(date.getTime())) {
      throw new Error(`Date invalide: ${value}`);
    }
    
    return date;
  }

  /**
   * Valide un nombre
   */
  private static validateNumber(value: any): number {
    const num = Number(value);
    
    if (isNaN(num) || num < 0) {
      throw new Error(`Nombre invalide: ${value}. Doit être un nombre positif.`);
    }
    
    return num;
  }

  /**
   * Valide les données complètes avant envoi
   */
  static validateMotifData(data: IMotifDeplacementFormData): void {
    // Validation des champs obligatoires
    if (!data.migrant_uuid) {
      throw new Error('UUID du migrant requis');
    }
    
    if (!data.type_motif) {
      throw new Error('Type de motif requis');
    }
    
    if (!data.motif_principal) {
      throw new Error('Motif principal requis');
    }
    
    if (!data.date_declenchement) {
      throw new Error('Date de déclenchement requise');
    }

    // Validation de la logique métier
    if (data.duree_estimee !== undefined && data.duree_estimee <= 0) {
      throw new Error('La durée estimée doit être positive');
    }

    // Validation de la date (ne peut pas être dans le futur lointain)
    const now = new Date();
    const maxFutureDate = new Date();
    maxFutureDate.setFullYear(now.getFullYear() + 1);
    
    if (data.date_declenchement > maxFutureDate) {
      throw new Error('La date de déclenchement ne peut pas être dans plus d\'un an');
    }
  }

  /**
   * Prépare les données pour l'édition (transformation inverse)
   */
  static prepareDataForEdit(motif: any): any {
    return {
      migrant_uuid: motif.migrant_uuid || '',
      type_motif: motif.type_motif || '',
      motif_principal: motif.motif_principal || '',
      motif_secondaire: motif.motif_secondaire || '',
      description: motif.description || '',
      caractere_volontaire: Boolean(motif.caractere_volontaire),
      urgence: motif.urgence || '',
      date_declenchement: motif.date_declenchement ? DateUtils.toInputFormat(motif.date_declenchement) : '',
      duree_estimee: motif.duree_estimee || null
    };
  }
}


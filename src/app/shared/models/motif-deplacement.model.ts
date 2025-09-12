export interface IMotifDeplacement {
  uuid: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;

  migrant_uuid: string;

  // Types de motifs
  type_motif: 'economique' | 'politique' | 'persecution' | 'naturelle' | 'familial' | 'education' | 'sanitaire';
  motif_principal: string;
  motif_secondaire?: string;
  description?: string;

  // Contexte du déplacement
  caractere_volontaire: boolean;
  urgence?: 'faible' | 'moyenne' | 'elevee' | 'critique';
  date_declenchement: string;
  duree_estimee?: number; // en jours

  // Facteurs externes
  conflit_arme: boolean;
  catastrophe_naturelle: boolean;
  persecution: boolean;
  violence_generalisee: boolean;

  // Relation avec Migrant
  migrant?: any; // Will be populated from backend
}

export interface IMotifDeplacementFormData {
  migrant_uuid: string;
  type_motif: string;
  motif_principal: string;
  motif_secondaire?: string;
  description?: string;
  caractere_volontaire: boolean;
  urgence?: string;
  date_declenchement: string;
  duree_estimee?: number;
  conflit_arme: boolean;
  catastrophe_naturelle: boolean;
  persecution: boolean;
  violence_generalisee: boolean;
}

export interface IMotifDeplacementStats {
  total_motifs: number;
  motifs_volontaires: number;
  motifs_involontaires: number;
  types_motifs: Array<{
    type_motif: string;
    count: number;
  }>;
  urgence_stats: Array<{
    urgence: string;
    count: number;
  }>;
  facteurs_externes: {
    conflit_arme: number;
    catastrophe_naturelle: number;
    persecution: number;
    violence_generalisee: number;
  };
}

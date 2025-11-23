import { IMigrant } from './migrant.model';

export interface IMotifDeplacement {
    uuid: string;
    created_at: Date;
    updated_at: Date;
    deleted_at?: Date | null;

    migrant_uuid: string;
    migrant?: IMigrant;

    // Types de motifs
    type_motif: 'economique' | 'politique' | 'persecution' | 'naturelle' | 'familial' | 'education' | 'sanitaire' | 'conflit_arme' | 'catastrophe_naturelle' | 'violence_generalisee';
    motif_principal: string;
    motif_secondaire?: string;
    description?: string;

    // Contexte du déplacement
    caractere_volontaire: boolean;
    urgence?: 'faible' | 'moyenne' | 'elevee' | 'critique';
    date_declenchement: Date;
    duree_estimee?: number; // en jours
}

export interface IMotifDeplacementFormData {
    migrant_uuid: string;
    type_motif: string;
    motif_principal: string;
    motif_secondaire?: string;
    description?: string;
    caractere_volontaire: boolean;
    urgence?: string;
    date_declenchement: Date;
    duree_estimee?: number;
}

export interface IMotifDeplacementStats {
    total_motifs: number;
    motifs_volontaires: number;
    motifs_involontaires: number;
    types_motifs: Array<{ type_motif: string; count: number }>;
    urgence_stats: Array<{ urgence: string; count: number }>;
}

export class MotifDeplacement implements IMotifDeplacement {
    uuid: string = '';
    created_at: Date = new Date();
    updated_at: Date = new Date();
    deleted_at?: Date | null = null;

    migrant_uuid: string = '';
    migrant?: IMigrant;

    // Types de motifs
    type_motif: 'economique' | 'politique' | 'persecution' | 'naturelle' | 'familial' | 'education' | 'sanitaire' | 'conflit_arme' | 'catastrophe_naturelle' | 'violence_generalisee' = 'economique';
    motif_principal: string = '';
    motif_secondaire?: string = '';
    description?: string = '';

    // Contexte du déplacement
    caractere_volontaire: boolean = true;
    urgence?: 'faible' | 'moyenne' | 'elevee' | 'critique' = 'faible';
    date_declenchement: Date = new Date();
    duree_estimee?: number = 0; // en jours
}
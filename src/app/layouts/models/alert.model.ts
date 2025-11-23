import { IMigrant } from './migrant.model';

export interface IAlert {
    uuid: string;
    created_at: Date;
    updated_at: Date;

    migrant_uuid: string;
    migrant?: IMigrant;

    // Informations de l'alerte
    type_alerte: 'securite' | 'sante' | 'juridique' | 'administrative' | 'humanitaire';
    niveau_gravite: 'info' | 'warning' | 'danger' | 'critical';
    titre: string;
    description: string;

    // Statut et traitement
    statut: 'active' | 'resolved' | 'dismissed' | 'expired';
    date_expiration?: Date | string | null;
    action_requise?: string;
    personne_responsable?: string;

    // Métadonnées de traitement
    date_resolution?: Date | string | null;
    comment_resolution?: string;
}

export class Alert implements IAlert {
    uuid: string = '';
    created_at: Date = new Date();
    updated_at: Date = new Date();

    migrant_uuid: string = '';
    migrant?: IMigrant;

    // Informations de l'alerte
    type_alerte: 'securite' | 'sante' | 'juridique' | 'administrative' | 'humanitaire' = 'administrative';
    niveau_gravite: 'info' | 'warning' | 'danger' | 'critical' = 'info';
    titre: string = '';
    description: string = '';

    // Statut et traitement
    statut: 'active' | 'resolved' | 'dismissed' | 'expired' = 'active';
    date_expiration?: Date | string | null = null;
    action_requise?: string = '';
    personne_responsable?: string = '';

    // Métadonnées de traitement
    date_resolution?: Date | string | null = null;
    comment_resolution?: string = '';
}
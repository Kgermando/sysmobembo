import { IIdentite } from "../../shared/models/identite.model";

export interface IGeolocalisation {
    uuid: string;
    created_at: Date;
    updated_at: Date;

    // Relation avec Identite
    identite_uuid: string;
    identite?: IIdentite;

    // Coordonnées géographiques
    latitude: number;  // -90 to 90
    longitude: number; // -180 to 180
}
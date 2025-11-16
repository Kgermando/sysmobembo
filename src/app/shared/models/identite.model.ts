export interface IIdentite {
  uuid: string;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;

  // Informations personnelles (comme dans un passeport)
  nom: string;
  postnom?: string;
  prenom: string;
  date_naissance: Date;
  lieu_naissance: string;
  sexe: 'M' | 'F';
  nationalite: string;

  adresse?: string;
  profession?: string;

  pays_emetteur: string;
  autorite_emetteur: string;
  numero_passeport: string;
}
 
export interface IIdentiteFormData {
  nom: string;
  postnom?: string;
  prenom: string;
  date_naissance: string | Date;
  lieu_naissance: string;
  sexe: 'M' | 'F';
  nationalite: string;
  adresse?: string;
  profession?: string;
  pays_emetteur: string;
  autorite_emetteur: string;
  numero_passeport: string;
}

export interface IBackendApiResponse<T> {
  status: string;
  message?: string;
  data: T;
}

export interface IIdentiteStats {
  total: number;
  par_sexe: Array<{ sexe: string; count: number }>;
  par_nationalite: Array<{ nationalite: string; count: number }>;
  avec_passeport: number;
  sans_passeport: number;
}

// Type pour les données extraites d'un passeport par OCR
export interface PassportOCRData {
  nom?: string;
  postnom?: string;
  prenom?: string;
  date_naissance?: string;
  lieu_naissance?: string;
  sexe?: 'M' | 'F';
  nationalite?: string;
  numero_passeport?: string;
  pays_emetteur?: string;
  autorite_emetteur?: string;
  date_emission?: string;
  date_expiration?: string;
}

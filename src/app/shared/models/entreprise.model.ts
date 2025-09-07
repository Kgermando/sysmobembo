/**
 * Interface pour les informations d'entreprise (basée sur le service Entreprise)
 */
export interface IEntreprise {
  uuid: string;
  nom: string;
  adresse: string;
  telephone: string;
  email: string;
  rccm: string;
  nif: string;
  idNat: string;
  manager: string;
  logo?: string;
  description?: string;
  secteurActivite?: string;
  tailleEntreprise?: string;
  dateCreation?: string;
  statutJuridique?: string;
  capitalSocial?: number;
  monnaie?: string;
  numeroCompte?: string;
  banque?: string;
  siteWeb?: string;
  fax?: string;
  pays?: string;
  ville?: string;
  province?: string;
  codePostal?: string;
  createdAt?: string;
  updatedAt?: string;
  sync?: boolean;
}

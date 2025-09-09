import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { IUser } from '../../shared/models/user.model';

/**
 * Interface pour la pagination des utilisateurs
 */
export interface UserPaginationResponse {
  status: string;
  message: string;
  data: IUser[];
  pagination: {
    total_records: number;
    total_pages: number;
    current_page: number;
    page_size: number;
  };
}

/**
 * Interface pour les données de création/modification d'utilisateur
 * Aligné avec le modèle User du backend Go
 */
export interface UserFormData {
  // Informations personnelles de base
  nom: string;
  postnom: string;
  prenom: string;
  sexe: string; // M/F
  date_naissance: string;
  lieu_naissance: string;

  // État civil
  etat_civil?: string;
  nombre_enfants?: number;

  // Nationalité et documents d'identité
  nationalite: string;
  numero_cni?: string;
  date_emission_cni?: string;
  date_expiration_cni?: string;
  lieu_emission_cni?: string;

  // Contacts
  email: string;
  telephone: string;
  telephone_urgence?: string;

  // Adresse
  province: string;
  ville: string;
  commune: string;
  quartier: string;
  avenue?: string;
  numero?: string;

  // Informations professionnelles
  matricule: string;
  grade: string;
  fonction: string;
  service: string;
  direction: string;
  ministere: string;
  date_recrutement: string;
  date_prise_service: string;
  type_agent: string;
  statut: string;

  // Formation et éducation
  niveau_etude?: string;
  diplome_base?: string;
  universite_ecole?: string;
  annee_obtention?: number;
  specialisation?: string;

  // Informations bancaires
  numero_bancaire?: string;
  banque?: string;

  // Informations de sécurité sociale
  numero_cnss?: string; // Le backend utilise numero_cnss dans le modèle User
  numero_onem?: string;

  // Documents et photos
  photo_profil?: string;
  cv_document?: string;

  // QR Code (générés automatiquement côté backend)
  qr_code?: string;
  qr_code_data?: string;

  // Informations système
  role: string;
  permission: string;
  status: boolean;
  signature?: string;
  password?: string;
  password_confirm?: string;
}

/**
 * Interface pour la réponse API standard
 */
export interface ApiResponse {
  status: string;
  message: string;
  data: any;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Récupération paginée de tous les utilisateurs (Manager général)
   */
  getPaginatedUsers(page: number = 1, limit: number = 15, search: string = ''): Observable<UserPaginationResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString())
      .set('search', search);

    return this.http.get<UserPaginationResponse>(`${this.baseUrl}/users/all/paginate`, { params });
  }

  /**
   * Récupération de tous les utilisateurs
   */
  getAllUsers(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.baseUrl}/users/all`);
  }

  /**
   * Récupération d'un utilisateur par UUID
   */
  getUser(uuid: string): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.baseUrl}/users/get/${uuid}`);
  }

  /**
   * Création d'un nouvel utilisateur
   */
  createUser(userData: UserFormData): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.baseUrl}/users/create`, userData);
  }

  /**
   * Mise à jour d'un utilisateur
   */
  updateUser(uuid: string, userData: Partial<UserFormData>): Observable<ApiResponse> {
    return this.http.put<ApiResponse>(`${this.baseUrl}/users/update/${uuid}`, userData);
  }

  /**
   * Suppression d'un utilisateur
   */
  deleteUser(uuid: string): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.baseUrl}/users/delete/${uuid}`);
  }
}

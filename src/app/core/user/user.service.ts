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
 */
export interface UserFormData {
  fullname: string;
  email: string;
  telephone: string;
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
   * Récupération de tous les utilisateurs par UUID d'entreprise
   */
  getAllUsersByUUID(bayerUuid: string): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.baseUrl}/users/all/${bayerUuid}`);
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

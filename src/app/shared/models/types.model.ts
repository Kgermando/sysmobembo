/**
 * Types pour les permissions CRUD
 */
export type Permission = 'C' | 'R' | 'U' | 'D' | 'CR' | 'CU' | 'CD' | 'RU' | 'RD' | 'UD' | 'CRU' | 'CRD' | 'CUD' | 'RUD' | 'CRUD' | 'ALL';

/**
 * Types pour les rôles utilisateur
 */
export type UserRole = 'admin' | 'manager' | 'user' | 'viewer' | 'Manager général';

/**
 * Types pour le statut de l'employé
 */
export type EmployeStatus = 'Actif' | 'Inactif' | 'Suspendu' | 'Licencié';

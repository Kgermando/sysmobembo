import { IUser } from './user.model';
import { UserRole } from './types.model';

/**
 * Classe utilitaire pour manipuler les données utilisateur
 */
export class UserHelper {
  static getFullName(user: IUser): string {
    // Construction du nom complet à partir des champs séparés
    return `${user.nom} ${user.postnom} ${user.prenom}`.trim();
  }

  static getInitials(user: IUser): string {
    const fullName = this.getFullName(user);
    const names = fullName.split(' ');
    if (names.length >= 2) {
      return `${names[0].charAt(0)}${names[names.length - 1].charAt(0)}`.toUpperCase();
    }
    return fullName.charAt(0).toUpperCase();
  }

  static hasPermission(user: IUser, requiredPermission: string): boolean {
    if (!user.permission) return false;
    
    // Permission ALL donne accès à tout
    if (user.permission === 'ALL') return true;
    
    // Vérification des permissions CRUD
    const userPermissions = user.permission.split('');
    return userPermissions.includes(requiredPermission);
  }

  static isAdmin(user: IUser): boolean {
    return user.role === 'Administrator' || user.role === 'Manager général';
  }

  static isManager(user: IUser): boolean {
    return user.role === 'Manager' || user.role === 'Manager général' || UserHelper.isAdmin(user);
  }

  static canAccess(user: IUser, requiredRole: UserRole): boolean {
    const roleHierarchy: { [key: string]: number } = {
      'viewer': 1,
      'user': 2,
      'manager': 3,
      'Manager général': 4,
      'admin': 5
    };

    const userLevel = roleHierarchy[user.role] || 0;
    const requiredLevel = roleHierarchy[requiredRole] || 0;

    return userLevel >= requiredLevel;
  }

  static formatSalary(user: IUser): string {
    // Cette méthode nécessite salaireBase et devisesSalaire qui ne sont pas disponibles
    return 'Salaire non disponible';
  }

  static getAge(user: IUser): number | null {
    if (!user.date_naissance) return null;
    
    const birthDate = new Date(user.date_naissance);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }

  static getAnciennete(user: IUser): number {
    if (!user.date_recrutement) return 0;
    
    const startDate = new Date(user.date_recrutement);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - startDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 365.25)); // années
  }
}

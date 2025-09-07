import { IUser } from './user.model';
import { UserRole } from './types.model';

/**
 * Classe utilitaire pour manipuler les données utilisateur
 */
export class UserHelper {
  static getFullName(user: IUser): string {
    return user.fullname.trim();
  }

  static getInitials(user: IUser): string {
    const names = user.fullname.split(' ');
    if (names.length >= 2) {
      return `${names[0].charAt(0)}${names[names.length - 1].charAt(0)}`.toUpperCase();
    }
    return user.fullname.charAt(0).toUpperCase();
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
    return user.role === 'admin' || user.role === 'Manager général';
  }

  static isManager(user: IUser): boolean {
    return user.role === 'manager' || user.role === 'Manager général' || UserHelper.isAdmin(user);
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
    // Cette méthode nécessite dateNaissance qui n'est pas disponible
    return null;
  }

  static getAnciennete(user: IUser): number {
    // Cette méthode nécessite dateEmbauche qui n'est pas disponible
    return 0;
  }
}

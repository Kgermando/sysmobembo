/**
 * Utilitaires pour la gestion des dates dans l'application
 * Gère les conversions entre Date, string et formats spécifiques
 */

export class DateUtils {
  
  /**
   * Convertit une date en string ISO pour l'API
   * @param date Date ou string à convertir
   * @returns string ISO ou string original si déjà string
   */
  static toISOString(date: Date | string | null | undefined): string | null {
    if (!date) return null;
    
    if (typeof date === 'string') {
      // Si c'est déjà une string, on assume qu'elle est au bon format
      return date;
    }
    
    if (date instanceof Date) {
      return date.toISOString();
    }
    
    return null;
  }

  /**
   * Convertit une string ou Date en objet Date
   * @param date String ISO ou objet Date
   * @returns Objet Date ou null si invalide
   */
  static toDate(date: string | Date | null | undefined): Date | null {
    if (!date) return null;
    
    if (date instanceof Date) {
      return date;
    }
    
    if (typeof date === 'string') {
      const parsed = new Date(date);
      return isNaN(parsed.getTime()) ? null : parsed;
    }
    
    return null;
  }

  /**
   * Formate une date pour un input HTML de type date (YYYY-MM-DD)
   * @param date Date ou string à formater
   * @returns String au format YYYY-MM-DD ou string vide
   */
  static toInputFormat(date: Date | string | null | undefined): string {
    if (!date) return '';
    
    let dateObj: Date;
    
    if (typeof date === 'string') {
      // Si c'est déjà au format YYYY-MM-DD, le retourner tel quel
      if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return date;
      }
      
      // Sinon, si c'est un ISO string, extraire la partie date
      if (date.includes('T')) {
        return date.split('T')[0];
      }
      
      // Tenter de parser la string en Date
      dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) {
        return '';
      }
    } else {
      dateObj = date;
    }
    
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  }

  /**
   * Formate une date pour l'affichage utilisateur français
   * @param date Date ou string à formater
   * @param options Options de formatage
   * @returns String formatée ou string vide
   */
  static toDisplayFormat(
    date: Date | string | null | undefined,
    options: {
      includeTime?: boolean;
      locale?: string;
    } = {}
  ): string {
    if (!date) return '';
    
    const { includeTime = false, locale = 'fr-FR' } = options;
    
    const dateObj = this.toDate(date);
    if (!dateObj) return '';
    
    if (includeTime) {
      return dateObj.toLocaleString(locale, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    
    return dateObj.toLocaleDateString(locale, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  }

  /**
   * Vérifie si une date est valide
   * @param date Date ou string à vérifier
   * @returns true si la date est valide
   */
  static isValidDate(date: Date | string | null | undefined): boolean {
    if (!date) return false;
    
    const dateObj = this.toDate(date);
    return dateObj !== null && !isNaN(dateObj.getTime());
  }

  /**
   * Compare deux dates (ignore l'heure)
   * @param date1 Première date
   * @param date2 Deuxième date
   * @returns -1 si date1 < date2, 0 si égales, 1 si date1 > date2
   */
  static compareDates(
    date1: Date | string | null | undefined,
    date2: Date | string | null | undefined
  ): number {
    const d1 = this.toDate(date1);
    const d2 = this.toDate(date2);
    
    if (!d1 && !d2) return 0;
    if (!d1) return -1;
    if (!d2) return 1;
    
    // Ignorer l'heure pour la comparaison
    const d1NoTime = new Date(d1.getFullYear(), d1.getMonth(), d1.getDate());
    const d2NoTime = new Date(d2.getFullYear(), d2.getMonth(), d2.getDate());
    
    if (d1NoTime < d2NoTime) return -1;
    if (d1NoTime > d2NoTime) return 1;
    return 0;
  }

  /**
   * Calcule la différence en jours entre deux dates
   * @param startDate Date de début
   * @param endDate Date de fin
   * @returns Nombre de jours de différence
   */
  static daysBetween(
    startDate: Date | string | null | undefined,
    endDate: Date | string | null | undefined
  ): number {
    const d1 = this.toDate(startDate);
    const d2 = this.toDate(endDate);
    
    if (!d1 || !d2) return 0;
    
    const diffTime = Math.abs(d2.getTime() - d1.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Ajoute des jours à une date
   * @param date Date de base
   * @param days Nombre de jours à ajouter
   * @returns Nouvelle date ou null si date invalide
   */
  static addDays(
    date: Date | string | null | undefined,
    days: number
  ): Date | null {
    const dateObj = this.toDate(date);
    if (!dateObj) return null;
    
    const result = new Date(dateObj);
    result.setDate(result.getDate() + days);
    return result;
  }

  /**
   * Convertit un objet avec des propriétés de date pour l'API
   * Convertit les propriétés Date en strings ISO
   * @param obj Objet à convertir
   * @param dateFields Noms des champs de date à convertir
   * @returns Objet avec les dates converties en strings
   */
  static convertDatesForApi<T extends Record<string, any>>(
    obj: T,
    dateFields: (keyof T)[]
  ): T {
    const result = { ...obj };
    
    dateFields.forEach(field => {
      if (result[field]) {
        const converted = this.toISOString(result[field] as Date | string);
        if (converted) {
          result[field] = converted as T[keyof T];
        }
      }
    });
    
    return result;
  }

  /**
   * Convertit un objet reçu de l'API avec des strings de date en objets Date
   * @param obj Objet à convertir
   * @param dateFields Noms des champs de date à convertir
   * @returns Objet avec les dates converties en Date
   */
  static convertDatesFromApi<T extends Record<string, any>>(
    obj: T,
    dateFields: (keyof T)[]
  ): T {
    const result = { ...obj };
    
    dateFields.forEach(field => {
      if (result[field]) {
        const converted = this.toDate(result[field] as string | Date);
        if (converted) {
          result[field] = converted as T[keyof T];
        }
      }
    });
    
    return result;
  }

  /**
   * Calcule l'ancienneté en années et mois
   */
  static calculateSeniority(dateRecrutement: Date | string | undefined): string {
    if (!dateRecrutement) return 'N/A';
    
    const recruitDate = this.toDate(dateRecrutement);
    if (!recruitDate) return 'N/A';
    
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - recruitDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const years = Math.floor(diffDays / 365);
    const months = Math.floor((diffDays % 365) / 30);
    
    if (years > 0) {
      return `${years} an${years > 1 ? 's' : ''} ${months > 0 ? `et ${months} mois` : ''}`;
    } else if (months > 0) {
      return `${months} mois`;
    } else {
      return `${diffDays} jour${diffDays > 1 ? 's' : ''}`;
    }
  }

  /**
   * Calcule l'âge en années
   */
  static calculateAge(dateNaissance: Date | string | undefined): number {
    if (!dateNaissance) return 0;
    
    const birthDate = this.toDate(dateNaissance);
    if (!birthDate) return 0;
    
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }

  /**
   * Parse les dates d'un objet reçu de l'API
   * Convertit automatiquement les champs de date courants (created_at, updated_at, date_*, etc.)
   * @param obj Objet à parser
   * @returns Objet avec les dates converties en Date
   */
  static parseApiDates<T extends Record<string, any>>(obj: T): T {
    if (!obj || typeof obj !== 'object') return obj;
    
    const result: any = { ...obj };
    
    // Liste des champs de date courants à parser
    const dateFieldPatterns = [
      'created_at',
      'updated_at',
      'date_entree',
      'date_expiration',
      'date_naissance',
      'date_recrutement',
      'date_debut',
      'date_fin',
      'date_emission',
      'date_capture',
      'timestamp'
    ];
    
    Object.keys(result).forEach(key => {
      // Vérifier si le champ correspond à un pattern de date
      const isDateField = dateFieldPatterns.some(pattern => 
        key === pattern || key.startsWith('date_')
      );
      
      if (isDateField && result[key]) {
        const converted = this.toDate(result[key] as string | Date);
        if (converted) {
          result[key] = converted;
        }
      }
    });
    
    return result as T;
  }
}
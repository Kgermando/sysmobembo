import { Injectable } from '@angular/core';
import { PassportOCRData } from '../../shared/models/identite.model';

@Injectable({
  providedIn: 'root'
})
export class PassportOcrService {

  constructor() { }

  /**
   * Parse le texte extrait d'un passeport et retourne les données structurées
   * @param text Le texte brut extrait par Tesseract
   * @returns Les données du passeport parsées
   */
  parsePassportText(text: string): PassportOCRData {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    const data: PassportOCRData = {};

    // Patterns de recherche pour les différents champs
    const patterns = {
      // Numéro de passeport (différents formats)
      numeroPasseport: [
        /(?:passport\s*(?:no|number|n°|num)[:\s]*)?([A-Z]{1,2}\d{6,9})/i,
        /(?:passeport\s*(?:no|n°|num)[:\s]*)?([A-Z]{1,2}\d{6,9})/i,
        /^([A-Z]{1,2}\d{6,9})$/,
        /P<[A-Z]{3}([A-Z0-9<]+)/
      ],
      
      // Nom et prénom
      nom: [
        /(?:surname|nom|name)[:\s]*([A-ZÀ-Ÿ][A-ZÀ-Ÿ\s-]+)/i,
        /^([A-ZÀ-Ÿ]{2,}(?:\s+[A-ZÀ-Ÿ]{2,})*)$/
      ],
      
      prenom: [
        /(?:given\s*names?|pr[ée]noms?|first\s*name)[:\s]*([A-ZÀ-Ÿ][A-Za-zÀ-ÿ\s-]+)/i
      ],

      // Date de naissance (formats: DD/MM/YYYY, DD MMM YYYY, DDMMMYYYY)
      dateNaissance: [
        /(?:date\s*of\s*birth|birth\s*date|date\s*de\s*naissance|n[ée](?:\(e\))?(?:\s*le)?)[:\s]*(\d{1,2}[-\/\s]\d{1,2}[-\/\s]\d{2,4})/i,
        /(?:date\s*of\s*birth|birth\s*date|date\s*de\s*naissance)[:\s]*(\d{1,2}\s+(?:JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\s+\d{2,4})/i,
        /(\d{2}(?:JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\d{2,4})/i
      ],

      // Lieu de naissance
      lieuNaissance: [
        /(?:place\s*of\s*birth|birth\s*place|lieu\s*de\s*naissance)[:\s]*([A-ZÀ-Ÿ][A-Za-zÀ-ÿ\s,-]+)/i
      ],

      // Sexe
      sexe: [
        /(?:sex|sexe)[:\s]*([MF])/i,
        /\b([MF])(?:\s|$)/
      ],

      // Nationalité
      nationalite: [
        /(?:nationality|nationalit[ée])[:\s]*([A-ZÀ-Ÿ][A-Za-zÀ-ÿ\s-]+)/i,
        /(?:country|pays)[:\s]*([A-ZÀ-Ÿ][A-Za-zÀ-ÿ\s-]+)/i
      ],

      // Pays émetteur
      paysEmetteur: [
        /(?:issuing\s*country|pays\s*[ée]metteur)[:\s]*([A-ZÀ-Ÿ][A-Za-zÀ-ÿ\s-]+)/i,
        /P<([A-Z]{3})/
      ],

      // Autorité émetteur
      autoriteEmetteur: [
        /(?:authority|autorit[ée])[:\s]*([A-ZÀ-Ÿ][A-Za-zÀ-ÿ\s,-]+)/i
      ],

      // Dates d'émission et expiration
      dateEmission: [
        /(?:date\s*of\s*issue|issue\s*date|date\s*d'?[ée]mission)[:\s]*(\d{1,2}[-\/\s]\d{1,2}[-\/\s]\d{2,4})/i
      ],

      dateExpiration: [
        /(?:date\s*of\s*expiry|expiry\s*date|date\s*d'?expiration)[:\s]*(\d{1,2}[-\/\s]\d{1,2}[-\/\s]\d{2,4})/i
      ]
    };

    // Machine Readable Zone (MRZ) - Zone lisible par machine au bas du passeport
    const mrzPattern = /P<([A-Z]{3})([A-Z<]+)<<([A-Z<]+)/;
    const mrzMatch = text.match(mrzPattern);
    
    if (mrzMatch) {
      // Extraire les données de la MRZ
      data.pays_emetteur = this.convertCountryCode(mrzMatch[1]);
      data.nom = mrzMatch[2].replace(/</g, ' ').trim();
      data.prenom = mrzMatch[3].replace(/</g, ' ').trim();
    }

    // Parcourir toutes les lignes pour extraire les informations
    for (const line of lines) {
      // Numéro de passeport
      if (!data.numero_passeport) {
        for (const pattern of patterns.numeroPasseport) {
          const match = line.match(pattern);
          if (match) {
            data.numero_passeport = match[1].replace(/[<\s]/g, '');
            break;
          }
        }
      }

      // Nom
      if (!data.nom) {
        for (const pattern of patterns.nom) {
          const match = line.match(pattern);
          if (match && match[1].length >= 2) {
            data.nom = match[1].toUpperCase().trim();
            break;
          }
        }
      }

      // Prénom
      if (!data.prenom) {
        for (const pattern of patterns.prenom) {
          const match = line.match(pattern);
          if (match) {
            data.prenom = this.capitalizeWords(match[1].trim());
            break;
          }
        }
      }

      // Date de naissance
      if (!data.date_naissance) {
        for (const pattern of patterns.dateNaissance) {
          const match = line.match(pattern);
          if (match) {
            data.date_naissance = this.normalizeDate(match[1]);
            break;
          }
        }
      }

      // Lieu de naissance
      if (!data.lieu_naissance) {
        for (const pattern of patterns.lieuNaissance) {
          const match = line.match(pattern);
          if (match) {
            data.lieu_naissance = this.capitalizeWords(match[1].trim());
            break;
          }
        }
      }

      // Sexe
      if (!data.sexe) {
        for (const pattern of patterns.sexe) {
          const match = line.match(pattern);
          if (match) {
            data.sexe = match[1].toUpperCase() as 'M' | 'F';
            break;
          }
        }
      }

      // Nationalité
      if (!data.nationalite) {
        for (const pattern of patterns.nationalite) {
          const match = line.match(pattern);
          if (match) {
            data.nationalite = this.capitalizeWords(match[1].trim());
            break;
          }
        }
      }

      // Pays émetteur
      if (!data.pays_emetteur) {
        for (const pattern of patterns.paysEmetteur) {
          const match = line.match(pattern);
          if (match) {
            data.pays_emetteur = match[1].length === 3 ? 
              this.convertCountryCode(match[1]) : 
              this.capitalizeWords(match[1].trim());
            break;
          }
        }
      }

      // Autorité émetteur
      if (!data.autorite_emetteur) {
        for (const pattern of patterns.autoriteEmetteur) {
          const match = line.match(pattern);
          if (match) {
            data.autorite_emetteur = this.capitalizeWords(match[1].trim());
            break;
          }
        }
      }

      // Date d'émission
      if (!data.date_emission) {
        for (const pattern of patterns.dateEmission) {
          const match = line.match(pattern);
          if (match) {
            data.date_emission = this.normalizeDate(match[1]);
            break;
          }
        }
      }

      // Date d'expiration
      if (!data.date_expiration) {
        for (const pattern of patterns.dateExpiration) {
          const match = line.match(pattern);
          if (match) {
            data.date_expiration = this.normalizeDate(match[1]);
            break;
          }
        }
      }
    }

    return data;
  }

  /**
   * Convertit un code pays ISO 3 lettres en nom de pays
   */
  private convertCountryCode(code: string): string {
    const countryCodes: { [key: string]: string } = {
      'COD': 'République Démocratique du Congo',
      'COG': 'République du Congo',
      'FRA': 'France',
      'BEL': 'Belgique',
      'USA': 'États-Unis',
      'GBR': 'Royaume-Uni',
      'CAN': 'Canada',
      'DEU': 'Allemagne',
      'ESP': 'Espagne',
      'ITA': 'Italie',
      'PRT': 'Portugal',
      'CHE': 'Suisse',
      'NLD': 'Pays-Bas',
      'SWE': 'Suède',
      'NOR': 'Norvège',
      'DNK': 'Danemark',
      'FIN': 'Finlande',
      'POL': 'Pologne',
      'AUT': 'Autriche',
      'GRC': 'Grèce',
      'TUR': 'Turquie',
      'RUS': 'Russie',
      'CHN': 'Chine',
      'JPN': 'Japon',
      'KOR': 'Corée du Sud',
      'IND': 'Inde',
      'BRA': 'Brésil',
      'ARG': 'Argentine',
      'MEX': 'Mexique',
      'ZAF': 'Afrique du Sud',
      'EGY': 'Égypte',
      'NGA': 'Nigéria',
      'KEN': 'Kenya',
      'MAR': 'Maroc',
      'DZA': 'Algérie',
      'TUN': 'Tunisie',
      'SEN': 'Sénégal',
      'CIV': 'Côte d\'Ivoire',
      'CMR': 'Cameroun',
      'AGO': 'Angola',
      'ZMB': 'Zambie',
      'ZWE': 'Zimbabwe',
      'TZA': 'Tanzanie',
      'UGA': 'Ouganda',
      'RWA': 'Rwanda',
      'BDI': 'Burundi',
    };

    return countryCodes[code] || code;
  }

  /**
   * Normalise une date en format YYYY-MM-DD
   */
  private normalizeDate(dateStr: string): string {
    // Supprimer les espaces multiples
    dateStr = dateStr.trim().replace(/\s+/g, ' ');

    // Format DD/MM/YYYY ou DD-MM-YYYY
    const ddmmyyyyMatch = dateStr.match(/(\d{1,2})[-\/](\d{1,2})[-\/](\d{2,4})/);
    if (ddmmyyyyMatch) {
      let [, day, month, year] = ddmmyyyyMatch;
      if (year.length === 2) {
        year = parseInt(year) > 50 ? `19${year}` : `20${year}`;
      }
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }

    // Format DD MMM YYYY (ex: 15 JAN 1990)
    const monthNames: { [key: string]: string } = {
      'JAN': '01', 'FEB': '02', 'MAR': '03', 'APR': '04',
      'MAY': '05', 'JUN': '06', 'JUL': '07', 'AUG': '08',
      'SEP': '09', 'OCT': '10', 'NOV': '11', 'DEC': '12'
    };

    const ddmmmyyyyMatch = dateStr.match(/(\d{1,2})\s+([A-Z]{3})\s+(\d{2,4})/i);
    if (ddmmmyyyyMatch) {
      let [, day, month, year] = ddmmmyyyyMatch;
      const monthNum = monthNames[month.toUpperCase()];
      if (monthNum) {
        if (year.length === 2) {
          year = parseInt(year) > 50 ? `19${year}` : `20${year}`;
        }
        return `${year}-${monthNum}-${day.padStart(2, '0')}`;
      }
    }

    // Format DDMMMYYYY (ex: 15JAN1990)
    const ddmmmyyyyNoSpaceMatch = dateStr.match(/(\d{2})([A-Z]{3})(\d{2,4})/i);
    if (ddmmmyyyyNoSpaceMatch) {
      let [, day, month, year] = ddmmmyyyyNoSpaceMatch;
      const monthNum = monthNames[month.toUpperCase()];
      if (monthNum) {
        if (year.length === 2) {
          year = parseInt(year) > 50 ? `19${year}` : `20${year}`;
        }
        return `${year}-${monthNum}-${day}`;
      }
    }

    return dateStr;
  }

  /**
   * Met en majuscule la première lettre de chaque mot
   */
  private capitalizeWords(str: string): string {
    return str.toLowerCase().replace(/\b\w/g, char => char.toUpperCase());
  }
}

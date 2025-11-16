import { Injectable } from '@angular/core';
import { PassportOCRData } from '../../shared/models/identite.model';

@Injectable({
  providedIn: 'root'
})
export class PassportOcrService {

  constructor() { }

  /**
   * Parse text extracted from a passport and return structured data
   * @param text Raw text extracted by Tesseract
   * @returns Parsed passport data
   */
  parsePassportText(text: string): PassportOCRData {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    const data: PassportOCRData = {};

    // Search patterns for different fields (with English aliases)
    const patterns = {
      // Passport number (different formats)
      // Aliases: passportNumber, numeroPasseport
      passportNumber: [
        /(?:passport\s*(?:no|number|n°|num|#)[:\s]*)?([A-Z]{1,2}\d{6,9})/i,
        /(?:passeport\s*(?:no|n°|num|#)[:\s]*)?([A-Z]{1,2}\d{6,9})/i,
        /(?:passport|passeport)[:\s]*([A-Z]{1,2}\d{6,9})/i,
        /^([A-Z]{1,2}\d{6,9})$/,
        /P<[A-Z]{3}([A-Z0-9<]+)/,
        /(?:document\s*(?:no|number|n°|num)[:\s]*)?([A-Z]{1,2}\d{6,9})/i
      ],
      
      // Last name, middle name, and first name (improved patterns for DRC)
      // Aliases: lastName, nom
      lastName: [
        /(?:surname|nom(?:\s*de\s*famille)?|family\s*name|last\s*name)[:\s]*([A-ZÀ-Ÿ][A-ZÀ-Ÿ\s-]+?)(?=\s*(?:postnom|pr[ée]nom|given|middle|first|$))/i,
        /^(?:nom|lastname|surname)[:\s]*([A-ZÀ-Ÿ][A-ZÀ-Ÿ\s-]+)/i,
        /(?:name|nom)[:\s]*([A-ZÀ-Ÿ][A-ZÀ-Ÿ\s-]+?)(?=\s*(?:postnom|pr[ée]nom|given|$))/i
      ],
      
      // Aliases: middleName, postnom
      middleName: [
        /(?:postnom|post-nom|middle\s*name)[:\s]*([A-ZÀ-Ÿ][A-ZÀ-Ÿ\s-]+?)(?=\s*(?:pr[ée]nom|given|first|$))/i,
        /^(?:postnom|middlename)[:\s]*([A-ZÀ-Ÿ][A-ZÀ-Ÿ\s-]+)/i,
        /(?:second\s*name)[:\s]*([A-ZÀ-Ÿ][A-ZÀ-Ÿ\s-]+)/i
      ],
      
      // Aliases: firstName, prenom
      firstName: [
        /(?:given\s*names?|pr[ée]noms?|first\s*name)[:\s]*([A-ZÀ-Ÿ][A-Za-zÀ-ÿ\s-]+)/i,
        /^(?:pr[ée]nom|firstname|givenname)[:\s]*([A-ZÀ-Ÿ][A-Za-zÀ-ÿ\s-]+)/i,
        /(?:forename)[:\s]*([A-ZÀ-Ÿ][A-Za-zÀ-ÿ\s-]+)/i
      ],

      // Date of birth (formats: DD/MM/YYYY, DD MMM YYYY, DDMMMYYYY)
      // Aliases: dateBirth, birthDate, dateNaissance
      dateBirth: [
        /(?:date\s*of\s*birth|birth\s*date|date\s*de\s*naissance|datebirth|birthdate|d\.?o\.?b\.?|n[ée](?:\(e\))?(?:\s*le)?)[:\s]*(\d{1,2}[-\/\s]\d{1,2}[-\/\s]\d{2,4})/i,
        /(?:date\s*of\s*birth|birth\s*date|date\s*de\s*naissance|datebirth|d\.?o\.?b\.?)[:\s]*(\d{1,2}\s+(?:JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC|JANV|F[ÉE]VR|MARS|AVR|MAI|JUIN|JUIL|AO[ÛU]T|SEPT|OCT|NOV|D[ÉE]C)\s+\d{2,4})/i,
        /(\d{2}(?:JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\d{2,4})/i,
        /(?:born)[:\s]*(\d{1,2}[-\/\s]\d{1,2}[-\/\s]\d{2,4})/i
      ],

      // Place of birth
      // Aliases: birthPlace, placeOfBirth, lieuNaissance
      birthPlace: [
        /(?:place\s*of\s*birth|birth\s*place|lieu\s*de\s*naissance|birthplace|placeofbirth|p\.?o\.?b\.?|born\s*(?:in|at))[:\s]*([A-ZÀ-Ÿ][A-Za-zÀ-ÿ\s,'-]+?)(?=\s*(?:sexe|sex|gender|nationalit|country|profession|occupation|address|$))/i,
        /(?:lieu)[:\s]*([A-ZÀ-Ÿ][A-Za-zÀ-ÿ\s,'-]+)/i
      ],

      // Gender/Sex
      // Aliases: gender, sex, sexe
      gender: [
        /(?:sex|sexe|gender)[:\s]*([MF])/i,
        /\b(?:sex|sexe|gender)[:\s]*([MF])\b/i,
        /\b([MF])(?:\s|\/|\||$)/,
        /(?:male|female|masculin|f[ée]minin)[:\s]*([MF])/i
      ],

      // Nationality
      // Aliases: nationality, nationalite
      nationality: [
        /(?:nationality|nationalit[ée]|citizen(?:ship)?)[:\s]*([A-ZÀ-Ÿ][A-Za-zÀ-ÿ\s'-]+?)(?=\s*(?:address|profession|occupation|passport|document|$))/i,
        /(?:country|pays)[:\s]*([A-ZÀ-Ÿ][A-Za-zÀ-ÿ\s'-]+?)(?=\s*(?:address|profession|$))/i,
        /(?:nat\.?)[:\s]*([A-ZÀ-Ÿ][A-Za-zÀ-ÿ\s'-]+)/i
      ],

      // Address
      // Aliases: address, adresse
      address: [
        /(?:address|adresse|residence|domicile|residential\s*address)[:\s]*([A-ZÀ-Ÿ0-9][A-Za-zÀ-ÿ0-9\s,.'°\/-]+?)(?=\s*(?:profession|occupation|passport|document|issuing|authority|$))/i,
        /(?:addr\.?)[:\s]*([A-ZÀ-Ÿ0-9][A-Za-zÀ-ÿ0-9\s,.'°\/-]+)/i,
        /(?:street|rue|avenue|av\.?|boulevard|blvd\.?)[:\s]*([A-ZÀ-Ÿ0-9][A-Za-zÀ-ÿ0-9\s,.'°\/-]+)/i
      ],

      // Profession/Occupation
      // Aliases: profession, occupation
      profession: [
        /(?:profession|occupation|job|emploi|m[ée]tier)[:\s]*([A-ZÀ-Ÿ][A-Za-zÀ-ÿ\s'-]+?)(?=\s*(?:address|passport|document|issuing|authority|$))/i,
        /(?:prof\.?|occup\.?)[:\s]*([A-ZÀ-Ÿ][A-Za-zÀ-ÿ\s'-]+)/i,
        /(?:title|titre)[:\s]*([A-ZÀ-Ÿ][A-Za-zÀ-ÿ\s'-]+)/i
      ],

      // Issuing country
      // Aliases: issuingCountry, paysEmetteur
      issuingCountry: [
        /(?:issuing\s*country|pays\s*[ée]metteur|country\s*of\s*issue|issued\s*by\s*country|issuingcountry)[:\s]*([A-ZÀ-Ÿ][A-Za-zÀ-ÿ\s'-]+)/i,
        /(?:issuing\s*state|[ée]tat\s*[ée]metteur|issuingstate)[:\s]*([A-ZÀ-Ÿ][A-Za-zÀ-ÿ\s'-]+)/i,
        /P<([A-Z]{3})/,
        /(?:code\s*pays|countrycode)[:\s]*([A-Z]{3})/i
      ],

      // Issuing authority
      // Aliases: issuingAuthority, autoriteEmetteur
      issuingAuthority: [
        /(?:authority|autorit[ée]|issuing\s*authority|autorit[ée]\s*d'?[ée]mission|issuingauthority)[:\s]*([A-ZÀ-Ÿ][A-Za-zÀ-ÿ\s,.'°-]+?)(?=\s*(?:date|passport|document|$))/i,
        /(?:issued\s*by|[ée]mis\s*par|delivered\s*by|d[ée]livr[ée]\s*par|issuedby)[:\s]*([A-ZÀ-Ÿ][A-Za-zÀ-ÿ\s,.'°-]+)/i,
        /(?:auth\.?)[:\s]*([A-ZÀ-Ÿ][A-Za-zÀ-ÿ\s,.'°-]+)/i
      ],

      // Issue and expiration dates
      // Aliases: issueDate, dateEmission
      issueDate: [
        /(?:date\s*of\s*issue|issue\s*date|date\s*d'?[ée]mission|issued|[ée]mis|issuedate|dateissue|d\.?o\.?i\.?)[:\s]*(\d{1,2}[-\/\s]\d{1,2}[-\/\s]\d{2,4})/i,
        /(?:date\s*of\s*issue|issuedate)[:\s]*(\d{1,2}\s+(?:JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\s+\d{2,4})/i
      ],

      // Aliases: expirationDate, expiryDate, dateExpiration
      expirationDate: [
        /(?:date\s*of\s*expiry|expiry\s*date|date\s*d'?expiration|expires|expire|expiration\s*date|expirationdate|expirydate|valid\s*until|valable\s*jusqu'?[àa]|d\.?o\.?e\.?)[:\s]*(\d{1,2}[-\/\s]\d{1,2}[-\/\s]\d{2,4})/i,
        /(?:date\s*of\s*expiry|expirydate|expirationdate)[:\s]*(\d{1,2}\s+(?:JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\s+\d{2,4})/i
      ]
    };

    // Machine Readable Zone (MRZ) - Machine-readable zone at the bottom of passport
    const mrzPattern = /P<([A-Z]{3})([A-Z<]+)<<([A-Z<]+)/;
    const mrzMatch = text.match(mrzPattern);
    
    if (mrzMatch) {
      // Extract data from MRZ
      data.pays_emetteur = this.convertCountryCode(mrzMatch[1]);
      
      // Surname (family name) in MRZ
      const surname = mrzMatch[2].replace(/</g, ' ').trim();
      
      // Given names in MRZ (may include middle name/postnom)
      const givenNames = mrzMatch[3].replace(/</g, ' ').trim();
      
      // Intelligently separate last name, middle name, and first name
      const namesParsed = this.parseCongoleseName(surname, givenNames);
      if (namesParsed.nom) data.nom = namesParsed.nom;
      if (namesParsed.postnom) data.postnom = namesParsed.postnom;
      if (namesParsed.prenom) data.prenom = namesParsed.prenom;
    }

    // Loop through all lines to extract information
    for (const line of lines) {
      // Passport number
      if (!data.numero_passeport) {
        for (const pattern of patterns.passportNumber) {
          const match = line.match(pattern);
          if (match) {
            data.numero_passeport = match[1].replace(/[<\s]/g, '');
            break;
          }
        }
      }

      // Last name
      if (!data.nom) {
        for (const pattern of patterns.lastName) {
          const match = line.match(pattern);
          if (match && match[1].length >= 2) {
            data.nom = match[1].toUpperCase().trim();
            break;
          }
        }
      }

      // Middle name/Postnom (specific to DRC)
      if (!data.postnom) {
        for (const pattern of patterns.middleName) {
          const match = line.match(pattern);
          if (match && match[1].length >= 2) {
            data.postnom = match[1].toUpperCase().trim();
            break;
          }
        }
      }

      // First name
      if (!data.prenom) {
        for (const pattern of patterns.firstName) {
          const match = line.match(pattern);
          if (match) {
            // If multiple first names are detected, separate them intelligently
            const prenomText = match[1].trim();
            const prenomsParsed = this.parseGivenNames(prenomText);
            data.prenom = prenomsParsed.prenom;
            // If no middle name yet and one was detected in first names
            if (!data.postnom && prenomsParsed.postnom) {
              data.postnom = prenomsParsed.postnom;
            }
            break;
          }
        }
      }

      // Date of birth
      if (!data.date_naissance) {
        for (const pattern of patterns.dateBirth) {
          const match = line.match(pattern);
          if (match) {
            data.date_naissance = this.normalizeDate(match[1]);
            break;
          }
        }
      }

      // Place of birth
      if (!data.lieu_naissance) {
        for (const pattern of patterns.birthPlace) {
          const match = line.match(pattern);
          if (match) {
            data.lieu_naissance = this.capitalizeWords(match[1].trim());
            break;
          }
        }
      }

      // Gender/Sex
      if (!data.sexe) {
        for (const pattern of patterns.gender) {
          const match = line.match(pattern);
          if (match) {
            data.sexe = match[1].toUpperCase() as 'M' | 'F';
            break;
          }
        }
      }

      // Nationality
      if (!data.nationalite) {
        for (const pattern of patterns.nationality) {
          const match = line.match(pattern);
          if (match) {
            data.nationalite = this.capitalizeWords(match[1].trim());
            break;
          }
        }
      }

      // Address
      if (!data.adresse) {
        for (const pattern of patterns.address) {
          const match = line.match(pattern);
          if (match && match[1].length >= 5) {
            data.adresse = this.capitalizeWords(match[1].trim());
            break;
          }
        }
      }

      // Profession/Occupation
      if (!data.profession) {
        for (const pattern of patterns.profession) {
          const match = line.match(pattern);
          if (match && match[1].length >= 3) {
            data.profession = this.capitalizeWords(match[1].trim());
            break;
          }
        }
      }

      // Issuing country
      if (!data.pays_emetteur) {
        for (const pattern of patterns.issuingCountry) {
          const match = line.match(pattern);
          if (match) {
            data.pays_emetteur = match[1].length === 3 ? 
              this.convertCountryCode(match[1]) : 
              this.capitalizeWords(match[1].trim());
            break;
          }
        }
      }

      // Issuing authority
      if (!data.autorite_emetteur) {
        for (const pattern of patterns.issuingAuthority) {
          const match = line.match(pattern);
          if (match) {
            data.autorite_emetteur = this.capitalizeWords(match[1].trim());
            break;
          }
        }
      }

      // Issue date
      if (!data.date_emission) {
        for (const pattern of patterns.issueDate) {
          const match = line.match(pattern);
          if (match) {
            data.date_emission = this.normalizeDate(match[1]);
            break;
          }
        }
      }

      // Expiration date
      if (!data.date_expiration) {
        for (const pattern of patterns.expirationDate) {
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
   * Convert ISO 3-letter country code to country name
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
   * Normalize a date to YYYY-MM-DD format
   */
  private normalizeDate(dateStr: string): string {
    // Remove multiple spaces
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
   * Capitalize first letter of each word
   */
  private capitalizeWords(str: string): string {
    return str.toLowerCase().replace(/\b\w/g, char => char.toUpperCase());
  }

  /**
   * Parse Congolese names (Last name, Middle name, First name) from MRZ
   * In a Congolese passport: 
   * - The surname part contains the LAST NAME (and sometimes MIDDLE NAME)
   * - The given names part contains the MIDDLE NAME (if not in surname) and FIRST NAME(S)
   */
  private parseCongoleseName(surname: string, givenNames: string): {nom?: string, postnom?: string, prenom?: string} {
    const result: {nom?: string, postnom?: string, prenom?: string} = {};
    
    // Clean multiple spaces
    surname = surname.trim().replace(/\s+/g, ' ');
    givenNames = givenNames.trim().replace(/\s+/g, ' ');
    
    // Split surname parts
    const surnameParts = surname.split(' ').filter(p => p.length > 0);
    
    // Split given names parts
    const givenNameParts = givenNames.split(' ').filter(p => p.length > 0);
    
    // Case 1: Surname contains 2 or more words -> probably LAST NAME + MIDDLE NAME
    if (surnameParts.length >= 2) {
      result.nom = surnameParts[0].toUpperCase();
      result.postnom = surnameParts.slice(1).join(' ').toUpperCase();
      // Given names are first names
      if (givenNameParts.length > 0) {
        result.prenom = this.capitalizeWords(givenNameParts.join(' '));
      }
    }
    // Case 2: Surname contains 1 word and givenNames contains 2+ words
    // -> Surname = LAST NAME, first givenName = MIDDLE NAME, rest = FIRST NAME
    else if (surnameParts.length === 1 && givenNameParts.length >= 2) {
      result.nom = surnameParts[0].toUpperCase();
      result.postnom = givenNameParts[0].toUpperCase();
      result.prenom = this.capitalizeWords(givenNameParts.slice(1).join(' '));
    }
    // Case 3: Surname = 1 word, givenNames = 1 word
    // -> Surname = LAST NAME, givenName = FIRST NAME (no middle name detected)
    else if (surnameParts.length === 1 && givenNameParts.length === 1) {
      result.nom = surnameParts[0].toUpperCase();
      result.prenom = this.capitalizeWords(givenNameParts[0]);
    }
    // Default case
    else {
      if (surnameParts.length > 0) {
        result.nom = surname.toUpperCase();
      }
      if (givenNameParts.length > 0) {
        result.prenom = this.capitalizeWords(givenNames);
      }
    }
    
    return result;
  }

  /**
   * Parse first names to extract middle name if mixed
   * Expected format: "MIDDLE_NAME First_Name(s)" or "First_Name(s)"
   */
  private parseGivenNames(givenNamesText: string): {postnom?: string, prenom?: string} {
    const result: {postnom?: string, prenom?: string} = {};
    
    // Clean text
    givenNamesText = givenNamesText.trim().replace(/\s+/g, ' ');
    
    const parts = givenNamesText.split(' ').filter(p => p.length > 0);
    
    if (parts.length === 0) {
      return result;
    }
    
    // If we have multiple words and first is uppercase -> it's probably the MIDDLE NAME
    if (parts.length >= 2) {
      const firstPart = parts[0];
      const isFirstAllCaps = firstPart === firstPart.toUpperCase() && firstPart.length >= 2;
      
      if (isFirstAllCaps) {
        result.postnom = firstPart.toUpperCase();
        result.prenom = this.capitalizeWords(parts.slice(1).join(' '));
      } else {
        // All words are first names
        result.prenom = this.capitalizeWords(parts.join(' '));
      }
    } else {
      // Single word -> it's a first name
      result.prenom = this.capitalizeWords(parts[0]);
    }
    
    return result;
  }
}

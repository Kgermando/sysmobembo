import { Injectable } from '@angular/core';
import { createWorker, Worker, RecognizeResult } from 'tesseract.js';
import { BehaviorSubject, Observable } from 'rxjs';

export interface OCRProgress {
  status: string;
  progress: number;
  message: string;
}

export interface OCRResult {
  text: string;
  confidence: number;
  lines: string[];
}

export interface ParsedDocumentData {
  nom?: string;
  prenom?: string;
  date_naissance?: string;
  lieu_naissance?: string;
  sexe?: string;
  nationalite?: string;
  numero_document?: string;
  type_document?: string;
  date_emission_document?: string;
  date_expiration_document?: string;
  telephone?: string;
  email?: string;
  adresse_actuelle?: string;
}

@Injectable({
  providedIn: 'root'
})
export class OcrService {
  private worker: Worker | null = null;
  private progressSubject = new BehaviorSubject<OCRProgress>({ status: 'idle', progress: 0, message: '' });
  public progress$: Observable<OCRProgress> = this.progressSubject.asObservable();

  constructor() {}

  /**
   * Initialise le worker Tesseract
   */
  private async initializeWorker(): Promise<Worker> {
    if (this.worker) {
      return this.worker;
    }

    this.progressSubject.next({ status: 'initializing', progress: 0, message: 'Initialisation de l\'OCR...' });

    const worker = await createWorker('fra', 1, {
      logger: (m: any) => {
        if (m.status === 'recognizing text') {
          this.progressSubject.next({
            status: 'processing',
            progress: Math.round(m.progress * 100),
            message: `Reconnaissance en cours... ${Math.round(m.progress * 100)}%`
          });
        }
      }
    });

    this.worker = worker;
    this.progressSubject.next({ status: 'ready', progress: 100, message: 'OCR prêt' });
    return worker;
  }

  /**
   * Extrait le texte d'une image
   */
  async extractTextFromImage(imageFile: File | string): Promise<OCRResult> {
    try {
      this.progressSubject.next({ status: 'starting', progress: 0, message: 'Démarrage de l\'analyse...' });

      const worker = await this.initializeWorker();
      
      this.progressSubject.next({ status: 'processing', progress: 20, message: 'Lecture de l\'image...' });

      const result: RecognizeResult = await worker.recognize(imageFile);

      this.progressSubject.next({ status: 'completed', progress: 100, message: 'Analyse terminée!' });

      // Extraire les lignes de texte
      const lines = result.data.text.split('\n').filter((line: string) => line.trim().length > 0);

      return {
        text: result.data.text,
        confidence: result.data.confidence,
        lines: lines
      };
    } catch (error) {
      this.progressSubject.next({ status: 'error', progress: 0, message: 'Erreur lors de l\'analyse' });
      console.error('Erreur OCR:', error);
      throw error;
    }
  }

  /**
   * Parse le texte extrait pour identifier les informations du document
   */
  parseDocumentText(text: string): ParsedDocumentData {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    const parsedData: ParsedDocumentData = {};

    // Patterns de reconnaissance
    const patterns = {
      // Nom et Prénom
      nom: /(?:nom|surname|lastname|family name)[:\s]*([A-ZÀ-Ÿ][A-ZÀ-Ÿ\s\-']+)/i,
      prenom: /(?:pr[ée]nom|given name|firstname|forename)[:\s]*([A-ZÀ-Ÿ][A-Za-zÀ-ÿ\s\-']+)/i,
      
      // Date de naissance (formats: DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY)
      date_naissance: /(?:n[ée](?:e?\(e\))?|birth|dob|date of birth)[:\s]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i,
      
      // Lieu de naissance
      lieu_naissance: /(?:lieu de naissance|place of birth|born in)[:\s]*([A-Za-zÀ-ÿ\s\-',]+)/i,
      
      // Sexe
      sexe: /(?:sexe|sex|gender)[:\s]*(M|F|H|MALE|FEMALE|MASCULIN|F[EÉ]MININ)/i,
      
      // Nationalité
      nationalite: /(?:nationalit[ée]|nationality)[:\s]*([A-Za-zÀ-ÿ\s]+)/i,
      
      // Numéro de document (passeport, carte d'identité)
      numero_passport: /(?:passport|passeport)[:\s]*(?:no|n°|number)?[:\s]*([A-Z0-9]{6,12})/i,
      numero_carte_identite: /(?:carte d'identit[ée]|identity card|id)[:\s]*(?:no|n°|number)?[:\s]*([A-Z0-9]{6,20})/i,
      numero_general: /(?:no|n°|number|num[ée]ro)[:\s]*([A-Z0-9]{6,20})/i,
      
      // Dates d'émission et expiration
      date_emission: /(?:date (?:d')?[ée]mission|issue date|issued)[:\s]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i,
      date_expiration: /(?:date d'expiration|expiry date|expires|valid until)[:\s]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i,
      
      // Téléphone
      telephone: /(?:t[ée]l|phone|tel|mobile)[:\s]*(\+?[\d\s\-\.()]{8,20})/i,
      
      // Email
      email: /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/,
      
      // Adresse
      adresse: /(?:adresse|address|residence)[:\s]*([A-Za-z0-9À-ÿ\s,\.\-']+)/i
    };

    // Extraction des données
    const fullText = text;

    // Nom
    const nomMatch = fullText.match(patterns.nom);
    if (nomMatch) {
      parsedData.nom = this.cleanText(nomMatch[1]);
    }

    // Prénom
    const prenomMatch = fullText.match(patterns.prenom);
    if (prenomMatch) {
      parsedData.prenom = this.cleanText(prenomMatch[1]);
    }

    // Si pas de match avec les patterns, essayer de détecter depuis les premières lignes
    if (!parsedData.nom && !parsedData.prenom && lines.length >= 2) {
      // Souvent sur les documents, le nom et prénom sont dans les premières lignes
      const potentialName = lines[0].match(/^([A-ZÀ-Ÿ\s\-']+)$/);
      const potentialFirstName = lines[1].match(/^([A-Za-zÀ-ÿ\s\-']+)$/);
      
      if (potentialName && potentialName[1].length > 2) {
        parsedData.nom = this.cleanText(potentialName[1]);
      }
      if (potentialFirstName && potentialFirstName[1].length > 2) {
        parsedData.prenom = this.cleanText(potentialFirstName[1]);
      }
    }

    // Date de naissance
    const dateNaissanceMatch = fullText.match(patterns.date_naissance);
    if (dateNaissanceMatch) {
      parsedData.date_naissance = this.formatDate(dateNaissanceMatch[1]);
    }

    // Lieu de naissance
    const lieuNaissanceMatch = fullText.match(patterns.lieu_naissance);
    if (lieuNaissanceMatch) {
      parsedData.lieu_naissance = this.cleanText(lieuNaissanceMatch[1]);
    }

    // Sexe
    const sexeMatch = fullText.match(patterns.sexe);
    if (sexeMatch) {
      const sexeValue = sexeMatch[1].toUpperCase();
      if (sexeValue === 'M' || sexeValue === 'H' || sexeValue.includes('MALE') || sexeValue.includes('MASCULIN')) {
        parsedData.sexe = 'M';
      } else if (sexeValue === 'F' || sexeValue.includes('FEMALE') || sexeValue.includes('FÉMININ') || sexeValue.includes('FEMININ')) {
        parsedData.sexe = 'F';
      }
    }

    // Nationalité
    const nationaliteMatch = fullText.match(patterns.nationalite);
    if (nationaliteMatch) {
      parsedData.nationalite = this.cleanText(nationaliteMatch[1]);
    }

    // Numéro de document
    const passportMatch = fullText.match(patterns.numero_passport);
    const carteIdentiteMatch = fullText.match(patterns.numero_carte_identite);
    const numeroGeneralMatch = fullText.match(patterns.numero_general);

    if (passportMatch) {
      parsedData.numero_document = passportMatch[1];
      parsedData.type_document = 'passport';
    } else if (carteIdentiteMatch) {
      parsedData.numero_document = carteIdentiteMatch[1];
      parsedData.type_document = 'carte_identite';
    } else if (numeroGeneralMatch) {
      parsedData.numero_document = numeroGeneralMatch[1];
    }

    // Date d'émission
    const dateEmissionMatch = fullText.match(patterns.date_emission);
    if (dateEmissionMatch) {
      parsedData.date_emission_document = this.formatDate(dateEmissionMatch[1]);
    }

    // Date d'expiration
    const dateExpirationMatch = fullText.match(patterns.date_expiration);
    if (dateExpirationMatch) {
      parsedData.date_expiration_document = this.formatDate(dateExpirationMatch[1]);
    }

    // Téléphone
    const telephoneMatch = fullText.match(patterns.telephone);
    if (telephoneMatch) {
      parsedData.telephone = this.cleanPhoneNumber(telephoneMatch[1]);
    }

    // Email
    const emailMatch = fullText.match(patterns.email);
    if (emailMatch) {
      parsedData.email = emailMatch[1].toLowerCase();
    }

    // Adresse
    const adresseMatch = fullText.match(patterns.adresse);
    if (adresseMatch) {
      parsedData.adresse_actuelle = this.cleanText(adresseMatch[1]);
    }

    return parsedData;
  }

  /**
   * Nettoie le texte extrait (supprime les espaces multiples, caractères spéciaux, etc.)
   */
  private cleanText(text: string): string {
    return text
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/[^\w\sÀ-ÿ\-']/gi, '');
  }

  /**
   * Formate une date au format ISO (YYYY-MM-DD)
   */
  private formatDate(dateString: string): string {
    // Supporte les formats: DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY
    const datePattern = /(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/;
    const match = dateString.match(datePattern);
    
    if (match) {
      let day = match[1].padStart(2, '0');
      let month = match[2].padStart(2, '0');
      let year = match[3];
      
      // Conversion année à 2 chiffres en 4 chiffres
      if (year.length === 2) {
        const currentYear = new Date().getFullYear();
        const currentCentury = Math.floor(currentYear / 100);
        const yearNum = parseInt(year);
        
        if (yearNum > currentYear % 100) {
          year = `${currentCentury - 1}${year}`;
        } else {
          year = `${currentCentury}${year}`;
        }
      }
      
      return `${year}-${month}-${day}`;
    }
    
    return dateString;
  }

  /**
   * Nettoie un numéro de téléphone
   */
  private cleanPhoneNumber(phone: string): string {
    return phone.replace(/[^\d+]/g, '');
  }

  /**
   * Détecte le type de document depuis le texte
   */
  detectDocumentType(text: string): string {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('passport') || lowerText.includes('passeport')) {
      return 'passport';
    } else if (lowerText.includes('carte d\'identité') || lowerText.includes('identity card') || lowerText.includes('carte nationale')) {
      return 'carte_identite';
    } else if (lowerText.includes('permis de conduire') || lowerText.includes('driving license') || lowerText.includes('driver\'s license')) {
      return 'permis_conduire';
    }
    
    return 'unknown';
  }

  /**
   * Termine le worker
   */
  async terminateWorker(): Promise<void> {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
      this.progressSubject.next({ status: 'terminated', progress: 0, message: 'OCR terminé' });
    }
  }

  /**
   * Réinitialise les progrès
   */
  resetProgress(): void {
    this.progressSubject.next({ status: 'idle', progress: 0, message: '' });
  }
}

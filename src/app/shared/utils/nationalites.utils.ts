/**
 * Utilitaire pour les nationalités
 * Liste des nationalités avec "Congolaise (RDC)" en première position
 */

export interface INationalite {
  code: string;
  label: string;
  continent?: string;
}

/**
 * Liste des nationalités triée avec RDC en premier
 */
export const NATIONALITES: string[] = [
  'Congolaise (RDC)',
  'Française',
  'Belge',
  'Camerounaise',
  'Gabonaise',
  'Centrafricaine',
  'Tchadienne',
  'Angolaise',
  'Zambienne',
  'Tanzanienne',
  'Ougandaise',
  'Rwandaise',
  'Burundaise',
  'Soudanaise',
  'Érythréenne',
  'Éthiopienne',
  'Somalienne',
  'Malienne',
  'Burkinabè',
  'Ivoirienne',
  'Ghanéenne',
  'Nigériane',
  'Sénégalaise',
  'Guinéenne',
  'Libérienne',
  'Sierra-léonaise',
  'Bissau-guinéenne',
  'Cap-verdienne',
  'Gambienne',
  'Mauritanienne',
  'Marocaine',
  'Algérienne',
  'Tunisienne',
  'Libyenne',
  'Égyptienne',
  'Sud-africaine',
  'Namibienne',
  'Botswanaise',
  'Zimbabwéenne',
  'Mozambicaine',
  'Malgache',
  'Mauricienne',
  'Seychelloise',
  'Comorienne',
  'Djiboutienne',
  'Kényane',
  'Togolaise',
  'Béninoise',
  'Nigérienne',
  'Malawite',
  'Lesothane',
  'Swatie',
  'Équato-guinéenne',
  'São-toméenne',
  'Allemande',
  'Britannique',
  'Italienne',
  'Espagnole',
  'Portugaise',
  'Néerlandaise',
  'Suisse',
  'Autrichienne',
  'Suédoise',
  'Norvégienne',
  'Danoise',
  'Finlandaise',
  'Polonaise',
  'Tchèque',
  'Slovaque',
  'Hongroise',
  'Roumaine',
  'Bulgare',
  'Grecque',
  'Croate',
  'Serbe',
  'Bosniaque',
  'Monténégrine',
  'Albanaise',
  'Macédonienne',
  'Slovène',
  'Lituanienne',
  'Lettone',
  'Estonienne',
  'Russe',
  'Ukrainienne',
  'Biélorusse',
  'Moldave',
  'Américaine',
  'Canadienne',
  'Mexicaine',
  'Brésilienne',
  'Argentine',
  'Chilienne',
  'Péruvienne',
  'Colombienne',
  'Vénézuélienne',
  'Équatorienne',
  'Bolivienne',
  'Paraguayenne',
  'Uruguayenne',
  'Guyanaise',
  'Surinamaise',
  'Chinoise',
  'Japonaise',
  'Coréenne',
  'Indienne',
  'Pakistanaise',
  'Bangladaise',
  'Sri-lankaise',
  'Thaïlandaise',
  'Vietnamienne',
  'Philippine',
  'Indonésienne',
  'Malaisienne',
  'Singapourienne',
  'Australienne',
  'Néo-zélandaise'
];

/**
 * Liste détaillée des nationalités avec codes et continents
 */
export const NATIONALITES_DETAILLEES: INationalite[] = [
  { code: 'CD', label: 'Congolaise (RDC)', continent: 'Afrique' },
  { code: 'FR', label: 'Française', continent: 'Europe' },
  { code: 'BE', label: 'Belge', continent: 'Europe' },
  { code: 'CM', label: 'Camerounaise', continent: 'Afrique' },
  { code: 'GA', label: 'Gabonaise', continent: 'Afrique' },
  { code: 'CF', label: 'Centrafricaine', continent: 'Afrique' },
  { code: 'TD', label: 'Tchadienne', continent: 'Afrique' },
  { code: 'AO', label: 'Angolaise', continent: 'Afrique' },
  { code: 'ZM', label: 'Zambienne', continent: 'Afrique' },
  { code: 'TZ', label: 'Tanzanienne', continent: 'Afrique' },
  { code: 'UG', label: 'Ougandaise', continent: 'Afrique' },
  { code: 'RW', label: 'Rwandaise', continent: 'Afrique' },
  { code: 'BI', label: 'Burundaise', continent: 'Afrique' },
  { code: 'SD', label: 'Soudanaise', continent: 'Afrique' },
  { code: 'ER', label: 'Érythréenne', continent: 'Afrique' },
  { code: 'ET', label: 'Éthiopienne', continent: 'Afrique' },
  { code: 'SO', label: 'Somalienne', continent: 'Afrique' },
  { code: 'ML', label: 'Malienne', continent: 'Afrique' },
  { code: 'BF', label: 'Burkinabè', continent: 'Afrique' },
  { code: 'CI', label: 'Ivoirienne', continent: 'Afrique' },
  { code: 'GH', label: 'Ghanéenne', continent: 'Afrique' },
  { code: 'NG', label: 'Nigériane', continent: 'Afrique' },
  { code: 'SN', label: 'Sénégalaise', continent: 'Afrique' },
  { code: 'GN', label: 'Guinéenne', continent: 'Afrique' },
  { code: 'LR', label: 'Libérienne', continent: 'Afrique' },
  { code: 'SL', label: 'Sierra-léonaise', continent: 'Afrique' },
  { code: 'GW', label: 'Bissau-guinéenne', continent: 'Afrique' },
  { code: 'CV', label: 'Cap-verdienne', continent: 'Afrique' },
  { code: 'GM', label: 'Gambienne', continent: 'Afrique' },
  { code: 'MR', label: 'Mauritanienne', continent: 'Afrique' },
  { code: 'MA', label: 'Marocaine', continent: 'Afrique' },
  { code: 'DZ', label: 'Algérienne', continent: 'Afrique' },
  { code: 'TN', label: 'Tunisienne', continent: 'Afrique' },
  { code: 'LY', label: 'Libyenne', continent: 'Afrique' },
  { code: 'EG', label: 'Égyptienne', continent: 'Afrique' },
  { code: 'ZA', label: 'Sud-africaine', continent: 'Afrique' },
  { code: 'NA', label: 'Namibienne', continent: 'Afrique' },
  { code: 'BW', label: 'Botswanaise', continent: 'Afrique' },
  { code: 'ZW', label: 'Zimbabwéenne', continent: 'Afrique' },
  { code: 'MZ', label: 'Mozambicaine', continent: 'Afrique' },
  { code: 'MG', label: 'Malgache', continent: 'Afrique' },
  { code: 'MU', label: 'Mauricienne', continent: 'Afrique' },
  { code: 'SC', label: 'Seychelloise', continent: 'Afrique' },
  { code: 'KM', label: 'Comorienne', continent: 'Afrique' },
  { code: 'DJ', label: 'Djiboutienne', continent: 'Afrique' },
  { code: 'KE', label: 'Kényane', continent: 'Afrique' },
  { code: 'TG', label: 'Togolaise', continent: 'Afrique' },
  { code: 'BJ', label: 'Béninoise', continent: 'Afrique' },
  { code: 'NE', label: 'Nigérienne', continent: 'Afrique' },
  { code: 'MW', label: 'Malawite', continent: 'Afrique' },
  { code: 'LS', label: 'Lesothane', continent: 'Afrique' },
  { code: 'SZ', label: 'Swatie', continent: 'Afrique' },
  { code: 'GQ', label: 'Équato-guinéenne', continent: 'Afrique' },
  { code: 'ST', label: 'São-toméenne', continent: 'Afrique' },
  { code: 'DE', label: 'Allemande', continent: 'Europe' },
  { code: 'GB', label: 'Britannique', continent: 'Europe' },
  { code: 'IT', label: 'Italienne', continent: 'Europe' },
  { code: 'ES', label: 'Espagnole', continent: 'Europe' },
  { code: 'PT', label: 'Portugaise', continent: 'Europe' },
  { code: 'NL', label: 'Néerlandaise', continent: 'Europe' },
  { code: 'CH', label: 'Suisse', continent: 'Europe' },
  { code: 'AT', label: 'Autrichienne', continent: 'Europe' },
  { code: 'SE', label: 'Suédoise', continent: 'Europe' },
  { code: 'NO', label: 'Norvégienne', continent: 'Europe' },
  { code: 'DK', label: 'Danoise', continent: 'Europe' },
  { code: 'FI', label: 'Finlandaise', continent: 'Europe' },
  { code: 'PL', label: 'Polonaise', continent: 'Europe' },
  { code: 'CZ', label: 'Tchèque', continent: 'Europe' },
  { code: 'SK', label: 'Slovaque', continent: 'Europe' },
  { code: 'HU', label: 'Hongroise', continent: 'Europe' },
  { code: 'RO', label: 'Roumaine', continent: 'Europe' },
  { code: 'BG', label: 'Bulgare', continent: 'Europe' },
  { code: 'GR', label: 'Grecque', continent: 'Europe' },
  { code: 'HR', label: 'Croate', continent: 'Europe' },
  { code: 'RS', label: 'Serbe', continent: 'Europe' },
  { code: 'BA', label: 'Bosniaque', continent: 'Europe' },
  { code: 'ME', label: 'Monténégrine', continent: 'Europe' },
  { code: 'AL', label: 'Albanaise', continent: 'Europe' },
  { code: 'MK', label: 'Macédonienne', continent: 'Europe' },
  { code: 'SI', label: 'Slovène', continent: 'Europe' },
  { code: 'LT', label: 'Lituanienne', continent: 'Europe' },
  { code: 'LV', label: 'Lettone', continent: 'Europe' },
  { code: 'EE', label: 'Estonienne', continent: 'Europe' },
  { code: 'RU', label: 'Russe', continent: 'Europe' },
  { code: 'UA', label: 'Ukrainienne', continent: 'Europe' },
  { code: 'BY', label: 'Biélorusse', continent: 'Europe' },
  { code: 'MD', label: 'Moldave', continent: 'Europe' },
  { code: 'US', label: 'Américaine', continent: 'Amérique du Nord' },
  { code: 'CA', label: 'Canadienne', continent: 'Amérique du Nord' },
  { code: 'MX', label: 'Mexicaine', continent: 'Amérique du Nord' },
  { code: 'BR', label: 'Brésilienne', continent: 'Amérique du Sud' },
  { code: 'AR', label: 'Argentine', continent: 'Amérique du Sud' },
  { code: 'CL', label: 'Chilienne', continent: 'Amérique du Sud' },
  { code: 'PE', label: 'Péruvienne', continent: 'Amérique du Sud' },
  { code: 'CO', label: 'Colombienne', continent: 'Amérique du Sud' },
  { code: 'VE', label: 'Vénézuélienne', continent: 'Amérique du Sud' },
  { code: 'EC', label: 'Équatorienne', continent: 'Amérique du Sud' },
  { code: 'BO', label: 'Bolivienne', continent: 'Amérique du Sud' },
  { code: 'PY', label: 'Paraguayenne', continent: 'Amérique du Sud' },
  { code: 'UY', label: 'Uruguayenne', continent: 'Amérique du Sud' },
  { code: 'GY', label: 'Guyanaise', continent: 'Amérique du Sud' },
  { code: 'SR', label: 'Surinamaise', continent: 'Amérique du Sud' },
  { code: 'CN', label: 'Chinoise', continent: 'Asie' },
  { code: 'JP', label: 'Japonaise', continent: 'Asie' },
  { code: 'KR', label: 'Coréenne', continent: 'Asie' },
  { code: 'IN', label: 'Indienne', continent: 'Asie' },
  { code: 'PK', label: 'Pakistanaise', continent: 'Asie' },
  { code: 'BD', label: 'Bangladaise', continent: 'Asie' },
  { code: 'LK', label: 'Sri-lankaise', continent: 'Asie' },
  { code: 'TH', label: 'Thaïlandaise', continent: 'Asie' },
  { code: 'VN', label: 'Vietnamienne', continent: 'Asie' },
  { code: 'PH', label: 'Philippine', continent: 'Asie' },
  { code: 'ID', label: 'Indonésienne', continent: 'Asie' },
  { code: 'MY', label: 'Malaisienne', continent: 'Asie' },
  { code: 'SG', label: 'Singapourienne', continent: 'Asie' },
  { code: 'AU', label: 'Australienne', continent: 'Océanie' },
  { code: 'NZ', label: 'Néo-zélandaise', continent: 'Océanie' }
];

/**
 * Obtient les nationalités filtrées par continent
 */
export function getNationalitesByContinent(continent: string): INationalite[] {
  return NATIONALITES_DETAILLEES.filter(nat => nat.continent === continent);
}

/**
 * Recherche une nationalité par son code
 */
export function getNationaliteByCode(code: string): INationalite | undefined {
  return NATIONALITES_DETAILLEES.find(nat => nat.code === code);
}

/**
 * Recherche une nationalité par son label
 */
export function getNationaliteByLabel(label: string): INationalite | undefined {
  return NATIONALITES_DETAILLEES.find(nat => nat.label.toLowerCase() === label.toLowerCase());
}

/**
 * Obtient la liste des continents disponibles
 */
export function getContinents(): string[] {
  const continents = new Set(
    NATIONALITES_DETAILLEES
      .map(nat => nat.continent)
      .filter((continent): continent is string => continent !== undefined)
  );
  return Array.from(continents).sort();
}

/**
 * Filtre les nationalités par terme de recherche
 */
export function searchNationalites(searchTerm: string): string[] {
  if (!searchTerm) return NATIONALITES;
  
  const term = searchTerm.toLowerCase();
  return NATIONALITES.filter(nat => 
    nat.toLowerCase().includes(term)
  );
}

/**
 * Utilitaires pour la gestion des pays
 * Contient les listes des pays utilisées dans l'application
 */

// Liste des pays d'origine les plus communs pour les migrants
export const PAYS_ORIGINE_COMMUNS = [
  'République Démocratique du Congo',
  'République du Congo',
  'Cameroun',
  'Gabon',
  'République Centrafricaine',
  'Tchad',
  'Angola',
  'Zambie',
  'Tanzanie',
  'Ouganda',
  'Rwanda',
  'Burundi',
  'Soudan',
  'Érythrée',
  'Éthiopie',
  'Somalie',
  'Mali',
  'Burkina Faso',
  'Côte d\'Ivoire',
  'Ghana',
  'Nigeria',
  'Sénégal',
  'Guinée',
  'Libéria',
  'Sierra Leone',
  'Togo',
  'Bénin',
  'Niger',
  'Mauritanie',
  'Gambie',
  'Guinée-Bissau',
  'Cap-Vert',
  'Égypte',
  'Libye',
  'Tunisie',
  'Algérie',
  'Maroc',
  'Mozambique',
  'Zimbabwe',
  'Botswana',
  'Namibie',
  'Afrique du Sud',
  'Lesotho',
  'Swaziland',
  'Madagascar',
  'Maurice',
  'Comores',
  'Seychelles',
  'Djibouti'
];

// Liste complète des pays du monde (version simplifiée)
export const TOUS_LES_PAYS = [
  // Afrique
  'Afrique du Sud',
  'Algérie',
  'Angola',
  'Bénin',
  'Botswana',
  'Burkina Faso',
  'Burundi',
  'Cameroun',
  'Cap-Vert',
  'Comores',
  'République du Congo',
  'République Démocratique du Congo',
  'Côte d\'Ivoire',
  'Djibouti',
  'Égypte',
  'Érythrée',
  'Éthiopie',
  'Gabon',
  'Gambie',
  'Ghana',
  'Guinée',
  'Guinée-Bissau',
  'Guinée équatoriale',
  'Kenya',
  'Lesotho',
  'Libéria',
  'Libye',
  'Madagascar',
  'Malawi',
  'Mali',
  'Maroc',
  'Maurice',
  'Mauritanie',
  'Mozambique',
  'Namibie',
  'Niger',
  'Nigeria',
  'Ouganda',
  'République Centrafricaine',
  'Rwanda',
  'Sao Tomé-et-Principe',
  'Sénégal',
  'Seychelles',
  'Sierra Leone',
  'Somalie',
  'Soudan',
  'Soudan du Sud',
  'Swaziland',
  'Tanzanie',
  'Tchad',
  'Togo',
  'Tunisie',
  'Zambie',
  'Zimbabwe',

  // Europe
  'Allemagne',
  'Autriche',
  'Belgique',
  'Bulgarie',
  'Chypre',
  'Croatie',
  'Danemark',
  'Espagne',
  'Estonie',
  'Finlande',
  'France',
  'Grèce',
  'Hongrie',
  'Irlande',
  'Islande',
  'Italie',
  'Lettonie',
  'Lituanie',
  'Luxembourg',
  'Malte',
  'Norvège',
  'Pays-Bas',
  'Pologne',
  'Portugal',
  'République tchèque',
  'Roumanie',
  'Royaume-Uni',
  'Russie',
  'Slovaquie',
  'Slovénie',
  'Suède',
  'Suisse',
  'Ukraine',

  // Asie
  'Afghanistan',
  'Arabie saoudite',
  'Bahreïn',
  'Bangladesh',
  'Bhoutan',
  'Birmanie',
  'Brunei',
  'Cambodge',
  'Chine',
  'Corée du Nord',
  'Corée du Sud',
  'Émirats arabes unis',
  'Inde',
  'Indonésie',
  'Irak',
  'Iran',
  'Israël',
  'Japon',
  'Jordanie',
  'Kazakhstan',
  'Kirghizistan',
  'Koweït',
  'Laos',
  'Liban',
  'Malaisie',
  'Maldives',
  'Mongolie',
  'Népal',
  'Oman',
  'Ouzbékistan',
  'Pakistan',
  'Palestine',
  'Philippines',
  'Qatar',
  'Singapour',
  'Sri Lanka',
  'Syrie',
  'Tadjikistan',
  'Thaïlande',
  'Turkménistan',
  'Turquie',
  'Viêt Nam',
  'Yémen',

  // Amérique du Nord
  'Canada',
  'États-Unis',
  'Mexique',

  // Amérique centrale et Caraïbes
  'Antigua-et-Barbuda',
  'Bahamas',
  'Barbade',
  'Belize',
  'Costa Rica',
  'Cuba',
  'Dominique',
  'République dominicaine',
  'El Salvador',
  'Grenade',
  'Guatemala',
  'Haïti',
  'Honduras',
  'Jamaïque',
  'Nicaragua',
  'Panama',
  'Saint-Christophe-et-Niévès',
  'Sainte-Lucie',
  'Saint-Vincent-et-les-Grenadines',
  'Trinité-et-Tobago',

  // Amérique du Sud
  'Argentine',
  'Bolivie',
  'Brésil',
  'Chili',
  'Colombie',
  'Équateur',
  'Guyana',
  'Paraguay',
  'Pérou',
  'Suriname',
  'Uruguay',
  'Venezuela',

  // Océanie
  'Australie',
  'Fidji',
  'Îles Marshall',
  'Îles Salomon',
  'Kiribati',
  'Micronésie',
  'Nauru',
  'Nouvelle-Zélande',
  'Palaos',
  'Papouasie-Nouvelle-Guinée',
  'Samoa',
  'Tonga',
  'Tuvalu',
  'Vanuatu'
];

/**
 * Recherche des pays par nom
 * @param searchTerm Terme de recherche
 * @param useCompleteList Utiliser la liste complète ou seulement les pays communs
 * @returns Liste des pays correspondants
 */
export function searchPays(searchTerm: string, useCompleteList: boolean = false): string[] {
  if (!searchTerm || searchTerm.length < 2) {
    return useCompleteList ? TOUS_LES_PAYS : PAYS_ORIGINE_COMMUNS;
  }

  const normalizedSearch = searchTerm.toLowerCase().trim();
  const paysList = useCompleteList ? TOUS_LES_PAYS : PAYS_ORIGINE_COMMUNS;
  
  return paysList.filter(pays => 
    pays.toLowerCase().includes(normalizedSearch)
  );
}

/**
 * Vérifie si un pays existe dans la liste
 * @param pays Nom du pays à vérifier
 * @param useCompleteList Utiliser la liste complète ou seulement les pays communs
 * @returns true si le pays existe
 */
export function isValidPays(pays: string, useCompleteList: boolean = true): boolean {
  if (!pays) return false;
  
  const paysList = useCompleteList ? TOUS_LES_PAYS : PAYS_ORIGINE_COMMUNS;
  return paysList.includes(pays);
}

/**
 * Obtient les pays par région (pour l'Afrique principalement)
 * @param region Région demandée
 * @returns Liste des pays de la région
 */
export function getPaysByRegion(region: 'afrique' | 'europe' | 'asie' | 'amerique' | 'oceanie'): string[] {
  // Cette fonction peut être étendue selon les besoins
  // Pour l'instant, retourne les pays d'origine communs (principalement africains)
  switch (region) {
    case 'afrique':
      return PAYS_ORIGINE_COMMUNS;
    default:
      return TOUS_LES_PAYS.filter(pays => {
        // Logique de filtrage par région peut être ajoutée ici
        return true;
      });
  }
}

import { IAppartment } from './appartment.model';

/**
 * Interface Caisse basée sur l'entité Caisse du backend
 * Représente une transaction financière (entrée/sortie) pour un appartement
 */
export interface ICaisse {
  // Identifiants principaux
  uuid: string;
  
  // Relations
  appartment_uuid: string;
  appartment?: IAppartment;
  
  // Type de transaction
  type: 'Income' | 'Expense';
  
  // Montants dans les deux devises
  device_cdf: number;    // Montant en Francs Congolais
  device_usd: number;    // Montant en Dollars Américains
  
  // Signature de l'utilisateur qui a effectué la transaction
  signature: string;
  
  // Métadonnées
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string;
}

/**
 * Interface pour les données de formulaire (création/modification)
 */
export interface ICaisseFormData {
  appartment_uuid: string;
  type: 'Income' | 'Expense';
  device_cdf: number;
  device_usd: number;
  signature: string;
}

/**
 * Interface pour la balance d'un appartement
 */
export interface IAppartmentBalance {
  appartment_uuid: string;
  total_income_cdf: number;
  total_expense_cdf: number;
  balance_cdf: number;
  total_income_usd: number;
  total_expense_usd: number;
  balance_usd: number;
  conversions: {
    income_cdf_in_usd: number;
    expense_cdf_in_usd: number;
    income_usd_in_cdf: number;
    expense_usd_in_cdf: number;
  };
  exchange_rates: {
    usd_to_cdf: number;
    cdf_to_usd: number;
  };
}

/**
 * Interface pour les totaux globaux
 */
export interface IGlobalTotals {
  total_income_cdf: number;
  total_expense_cdf: number;
  balance_cdf: number;
  total_income_usd: number;
  total_expense_usd: number;
  balance_usd: number;
  conversions: {
    income_cdf_in_usd: number;
    expense_cdf_in_usd: number;
    income_usd_in_cdf: number;
    expense_usd_in_cdf: number;
  };
  exchange_rates: {
    usd_to_cdf: number;
    cdf_to_usd: number;
  };
}

/**
 * Interface pour les totaux par manager
 */
export interface IManagerTotals {
  manager_uuid: string;
  income_totals: {
    cdf_total: number;
    usd_total: number;
    cdf_in_usd: number;
    usd_in_cdf: number;
    grand_total_cdf: number;
    grand_total_usd: number;
  };
  expense_totals: {
    cdf_total: number;
    usd_total: number;
    cdf_in_usd: number;
    usd_in_cdf: number;
    grand_total_cdf: number;
    grand_total_usd: number;
  };
  net_balances: {
    net_balance_cdf: number;
    net_balance_usd: number;
    grand_net_balance_cdf: number;
    grand_net_balance_usd: number;
  };
  exchange_rates: {
    usd_to_cdf: number;
    cdf_to_usd: number;
  };
}

/**
 * Interface pour la conversion de devises
 */
export interface ICurrencyConversion {
  amount: number;
  from_currency: 'USD' | 'CDF';
  to_currency: 'USD' | 'CDF';
  rate?: number;
}

/**
 * Interface pour le résultat de conversion
 */
export interface ICurrencyConversionResult {
  original_amount: number;
  from_currency: string;
  to_currency: string;
  converted_amount: number;
  exchange_rate: number;
  conversion_time: string;
}

/**
 * Labels pour les types de transactions
 */
export const CAISSE_TYPE_LABELS = {
  Income: 'Entrée',
  Expense: 'Sortie'
} as const;

/**
 * Options pour les filtres de type
 */
export const CAISSE_TYPE_OPTIONS = [
  { value: 'Income', label: 'Entrée' },
  { value: 'Expense', label: 'Sortie' }
];

/**
 * Options pour les devises
 */
export const CURRENCY_OPTIONS = [
  { value: 'CDF', label: 'CDF (Francs Congolais)' },
  { value: 'USD', label: 'USD (Dollars Américains)' }
];

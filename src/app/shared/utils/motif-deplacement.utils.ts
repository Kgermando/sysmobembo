export const TYPE_MOTIF_OPTIONS = [
  { value: 'economique', label: 'Économique' },
  { value: 'politique', label: 'Politique' },
  { value: 'persecution', label: 'Persécution' },
  { value: 'naturelle', label: 'Catastrophe naturelle' },
  { value: 'familial', label: 'Familial' },
  { value: 'education', label: 'Éducation' },
  { value: 'sanitaire', label: 'Sanitaire' }
];

export const URGENCE_OPTIONS = [
  { value: 'faible', label: 'Faible' },
  { value: 'moyenne', label: 'Moyenne' },
  { value: 'elevee', label: 'Élevée' },
  { value: 'critique', label: 'Critique' }
];

export const CARACTERE_VOLONTAIRE_OPTIONS = [
  { value: true, label: 'Volontaire' },
  { value: false, label: 'Involontaire' }
];

export const FACTEURS_EXTERNES = [
  { key: 'conflit_arme', label: 'Conflit armé' },
  { key: 'catastrophe_naturelle', label: 'Catastrophe naturelle' },
  { key: 'persecution', label: 'Persécution' },
  { key: 'violence_generalisee', label: 'Violence généralisée' }
];

// Fonctions utilitaires
export function getTypeMotifLabel(typeMotif: string): string {
  const option = TYPE_MOTIF_OPTIONS.find(opt => opt.value === typeMotif);
  return option ? option.label : typeMotif;
}

export function getUrgenceLabel(urgence: string): string {
  const option = URGENCE_OPTIONS.find(opt => opt.value === urgence);
  return option ? option.label : urgence;
}

export function getUrgenceBadgeClass(urgence: string): string {
  switch (urgence) {
    case 'critique': return 'badge-danger';
    case 'elevee': return 'badge-warning';
    case 'moyenne': return 'badge-info';
    case 'faible': return 'badge-secondary';
    default: return 'badge-light';
  }
}

export function getCaractereBadgeClass(volontaire: boolean): string {
  return volontaire ? 'badge-success' : 'badge-danger';
}

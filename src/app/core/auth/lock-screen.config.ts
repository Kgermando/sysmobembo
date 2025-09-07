// Configuration des délais pour la redirection vers lock-screen
// Ces valeurs peuvent être ajustées selon les besoins

export const LOCK_SCREEN_CONFIG = {
  // Délais en millisecondes
  APP_EXIT_TIMEOUT: 5 * 60 * 1000,        // 5 minutes après fermeture
  APP_HIDDEN_TIMEOUT: 10 * 60 * 1000,     // 10 minutes après masquage
  APP_BLUR_TIMEOUT: 15 * 60 * 1000,       // 15 minutes après perte de focus
  NETWORK_DISCONNECTION_TIMEOUT: 30 * 60 * 1000, // 30 minutes hors ligne
  USER_INACTIVITY_TIMEOUT: 30 * 60 * 1000,        // 30 minutes d'inactivité
  USER_LONG_INACTIVITY_TIMEOUT: 60 * 60 * 1000,   // 1 heure d'inactivité
  
  // Délais pour les tests (décommentez pour activer)
  // APP_EXIT_TIMEOUT: 30 * 1000,           // 30 secondes pour test
  // APP_HIDDEN_TIMEOUT: 60 * 1000,         // 1 minute pour test
  // APP_BLUR_TIMEOUT: 90 * 1000,           // 1.5 minutes pour test
  // USER_INACTIVITY_TIMEOUT: 2 * 60 * 1000,    // 2 minutes pour test
  // USER_LONG_INACTIVITY_TIMEOUT: 3 * 60 * 1000, // 3 minutes pour test
};

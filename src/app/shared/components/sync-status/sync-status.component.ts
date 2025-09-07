import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { SyncService, SyncStatus } from '../../services/sync.service';

@Component({
  selector: 'app-sync-status',
  standalone: true,
  imports: [CommonModule],  template: `
    <div class="sync-status-container" *ngIf="isVisible && badgeVisible">
      
      <!-- Badge d'état de synchronisation (conditionnellement visible) -->
      <div class="sync-status-badge" 
           [class]="getSyncBadgeClass()"
           [title]="getSyncTooltip()"
           (click)="toggleDetails()">
        <i class="fas" [class]="getSyncIcon()"></i>
        <span class="badge-text">{{ getSyncBadgeText() }}</span>
        <span class="sync-counter" *ngIf="getPendingCount() > 0">{{ getPendingCount() }}</span>
        
        <!-- Bouton de fermeture pour permettre aux utilisateurs de masquer manuellement -->
        <span class="badge-close" (click)="hideBadgeNow(); $event.stopPropagation()" title="Masquer">
          <i class="fas fa-times"></i>
        </span>
      </div>

      <!-- Indicateur détaillé de synchronisation -->
      <div class="sync-status-details" *ngIf="showDetails && (isSyncing || showSuccess || showError)">
        
        <!-- Synchronisation en cours -->
        <div *ngIf="isSyncing" class="sync-status sync-active">
          <div class="sync-header">
            <div class="sync-icon">
              <i class="fas fa-sync-alt fa-spin"></i>
            </div>
            <div class="sync-info">
              <div class="sync-title">Synchronisation en cours...</div>
              <div class="sync-subtitle">{{ entityName }}</div>
            </div>
            <div class="sync-close" (click)="hideDetails()">
              <i class="fas fa-times"></i>
            </div>
          </div>
          
          <div class="sync-details" *ngIf="currentStatus">
            <div class="status-row">
              <span class="status-label">{{ getDirectionText(currentStatus.direction) }}</span>
              <span class="status-value">{{ currentStatus.processed }}/{{ currentStatus.total }}</span>
            </div>
            
            <div class="sync-progress-wrapper">
              <div class="sync-progress">
                <div class="progress-bar" [style.width.%]="currentStatus.progress">
                  <span class="progress-text">{{ currentStatus.progress }}%</span>
                </div>
              </div>
            </div>
            
            <div class="status-row" *ngIf="currentStatus.errors > 0">
              <span class="status-label">Erreurs</span>
              <span class="status-value text-warning">{{ currentStatus.errors }}</span>
            </div>
            
            <div class="status-row">
              <span class="status-label">Durée</span>
              <span class="status-value">{{ getElapsedTime(currentStatus.startTime) }}</span>
            </div>
          </div>
        </div>

        <!-- Synchronisation réussie -->
        <div *ngIf="showSuccess && !isSyncing" class="sync-status sync-success">
          <div class="sync-header">
            <div class="sync-icon">
              <i class="fas fa-check-circle"></i>
            </div>
            <div class="sync-info">
              <div class="sync-title">Synchronisation réussie</div>
              <div class="sync-subtitle">{{ entityName }}</div>
            </div>
            <div class="sync-close" (click)="hideSuccess()">
              <i class="fas fa-times"></i>
            </div>
          </div>
          <div class="sync-message">
            Toutes les données ont été synchronisées avec succès
          </div>
        </div>

        <!-- Erreurs de synchronisation -->
        <div *ngIf="showError && !isSyncing" class="sync-status sync-error">
          <div class="sync-header">
            <div class="sync-icon">
              <i class="fas fa-exclamation-triangle"></i>
            </div>
            <div class="sync-info">
              <div class="sync-title">Erreur de synchronisation</div>
              <div class="sync-subtitle">{{ entityName }}</div>
            </div>
            <div class="sync-close" (click)="hideError()">
              <i class="fas fa-times"></i>
            </div>
          </div>
          <div class="sync-message">
            {{ errorMessage }}
          </div>
        </div>
      </div>

      <!-- Notifications toast améliorées -->
      <div class="sync-toast" 
           *ngIf="showToast"
           [class]="getToastClass()"
           [@slideInOut]>
        <div class="toast-icon">
          <i class="fas" [class]="getToastIcon()"></i>
        </div>
        <div class="toast-content">
          <div class="toast-title">{{ toastTitle }}</div>
          <div class="toast-message">{{ toastMessage }}</div>
        </div>
        <div class="toast-close" (click)="hideToast()">
          <i class="fas fa-times"></i>
        </div>
      </div>
    </div>
  `,  styles: [`
    .sync-status-container {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      max-width: 400px;
    }

    /* Badge d'état toujours visible */
    .sync-status-badge {
      display: flex;
      align-items: center;
      padding: 8px 12px;
      border-radius: 20px;
      color: white;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.3s ease;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
      backdrop-filter: blur(10px);
      margin-bottom: 8px;
      min-width: 120px;
      justify-content: center;
    }

    .sync-badge-idle {
      background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
    }

    .sync-badge-syncing {
      background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
      animation: pulse 2s infinite;
    }

    .sync-badge-error {
      background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
    }

    .sync-badge-pending {
      background: linear-gradient(135deg, #ffc107 0%, #e0a800 100%);
      color: #212529;
    }

    .sync-status-badge:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }    .sync-status-badge i {
      margin-right: 6px;
      font-size: 14px;
    }

    .badge-text {
      margin-right: 6px;
    }

    .badge-close {
      margin-left: 8px;
      cursor: pointer;
      opacity: 0.7;
      transition: opacity 0.2s ease;
      font-size: 12px;
    }

    .badge-close:hover {
      opacity: 1;
      transform: scale(1.1);
    }

    .sync-counter {
      background: rgba(255, 255, 255, 0.3);
      border-radius: 10px;
      padding: 2px 6px;
      font-size: 11px;
      font-weight: bold;
      min-width: 18px;
      text-align: center;
    }

    @keyframes pulse {
      0% { opacity: 1; }
      50% { opacity: 0.7; }
      100% { opacity: 1; }
    }

    /* Détails de synchronisation */
    .sync-status-details {
      animation: slideInRight 0.3s ease-out;
    }

    .sync-status {
      background: rgba(255, 255, 255, 0.95);
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
      margin-bottom: 8px;
      backdrop-filter: blur(15px);
      border: 1px solid rgba(255, 255, 255, 0.2);
      overflow: hidden;
    }

    .sync-header {
      display: flex;
      align-items: center;
      padding: 12px 16px;
      border-bottom: 1px solid rgba(0, 0, 0, 0.1);
    }

    .sync-active .sync-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .sync-success .sync-header {
      background: linear-gradient(135deg, #56ab2f 0%, #a8e6cf 100%);
      color: white;
    }

    .sync-error .sync-header {
      background: linear-gradient(135deg, #ff4757 0%, #ff6b7a 100%);
      color: white;
    }

    .sync-icon {
      margin-right: 12px;
      font-size: 20px;
      display: flex;
      align-items: center;
      min-width: 24px;
    }

    .sync-info {
      flex: 1;
    }

    .sync-title {
      font-weight: 600;
      font-size: 15px;
      margin-bottom: 2px;
    }

    .sync-subtitle {
      font-size: 13px;
      opacity: 0.9;
    }

    .sync-close {
      cursor: pointer;
      padding: 4px;
      border-radius: 4px;
      transition: background-color 0.2s ease;
      opacity: 0.7;
    }

    .sync-close:hover {
      background: rgba(255, 255, 255, 0.2);
      opacity: 1;
    }

    .sync-details {
      padding: 12px 16px;
      color: #495057;
    }

    .status-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .status-row:last-child {
      margin-bottom: 0;
    }

    .status-label {
      font-size: 13px;
      color: #6c757d;
    }

    .status-value {
      font-weight: 500;
      font-size: 13px;
    }

    .sync-progress-wrapper {
      margin: 8px 0;
    }

    .sync-progress {
      width: 100%;
      height: 6px;
      background: #e9ecef;
      border-radius: 3px;
      overflow: hidden;
      position: relative;
    }

    .progress-bar {
      height: 100%;
      background: linear-gradient(90deg, #007bff 0%, #0056b3 100%);
      border-radius: 3px;
      transition: width 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      padding-right: 4px;
      position: relative;
    }

    .progress-text {
      color: white;
      font-size: 10px;
      font-weight: 600;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
      position: absolute;
      right: 4px;
      top: 50%;
      transform: translateY(-50%);
    }

    .sync-message {
      padding: 12px 16px;
      font-size: 14px;
      color: #495057;
    }

    /* Toast notifications */
    .sync-toast {
      display: flex;
      align-items: center;
      padding: 12px 16px;
      border-radius: 8px;
      color: white;
      margin-bottom: 8px;
      position: relative;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      backdrop-filter: blur(10px);
    }

    .toast-success {
      background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
    }

    .toast-error {
      background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
    }

    .toast-warning {
      background: linear-gradient(135deg, #ffc107 0%, #e0a800 100%);
      color: #212529;
    }

    .toast-info {
      background: linear-gradient(135deg, #17a2b8 0%, #007bff 100%);
    }

    .toast-icon {
      margin-right: 12px;
      font-size: 18px;
    }

    .toast-content {
      flex: 1;
    }

    .toast-title {
      font-weight: 600;
      margin-bottom: 2px;
      font-size: 14px;
    }

    .toast-message {
      font-size: 13px;
      opacity: 0.9;
    }

    .toast-close {
      cursor: pointer;
      padding: 4px;
      border-radius: 4px;
      transition: background-color 0.2s ease;
      opacity: 0.7;
      margin-left: 8px;
    }

    .toast-close:hover {
      background: rgba(255, 255, 255, 0.2);
      opacity: 1;
    }

    @keyframes slideInRight {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    /* Responsive */
    @media (max-width: 768px) {
      .sync-status-container {
        top: 10px;
        right: 10px;
        left: 10px;
        max-width: none;
      }
      
      .sync-status {
        margin-bottom: 4px;
      }
      
      .sync-header {
        padding: 10px 12px;
      }
      
      .sync-title {
        font-size: 14px;
      }
      
      .sync-subtitle {
        font-size: 12px;
      }

      .sync-status-badge {
        font-size: 12px;
        padding: 6px 10px;
      }
    }
  `]
})
export class SyncStatusComponent implements OnInit, OnDestroy {
  @Input() tableName!: string;
  @Input() entityName: string = 'Données';
  @Input() isVisible: boolean = true;
  @Input() showBadge: boolean = true;
  @Input() autoHideDetails: boolean = true;
  @Input() autoHideBadge: boolean = true; // Nouveau: auto-masquer le badge après succès
  @Input() autoHideDelay: number = 3000; // Délai avant masquage automatique
  @Input() hideWhenIdle: boolean = true; // Masquer quand tout est synchronisé
  @Input() showOnlyWhenActive: boolean = false; // Afficher uniquement pendant les syncs actives

  isSyncing: boolean = false;
  showSuccess: boolean = false;
  showError: boolean = false;
  showDetails: boolean = false;
  errorMessage: string = '';
  currentStatus: SyncStatus | null = null;
  
  // Nouvel état pour contrôler la visibilité du badge
  badgeVisible: boolean = true;

  // Toast state
  showToast: boolean = false;
  toastTitle: string = '';
  toastMessage: string = '';
  toastType: 'success' | 'error' | 'warning' | 'info' = 'info';

  private subscription?: Subscription;
  private successTimeout?: any;
  private errorTimeout?: any;
  private toastTimeout?: any;
  private badgeHideTimeout?: any; // Nouveau timeout pour masquer le badge

  constructor(private syncService: SyncService) {}  ngOnInit(): void {
    // Initialiser la visibilité du badge selon la configuration
    if (this.showOnlyWhenActive) {
      this.badgeVisible = false;
    }
    
    this.subscription = this.syncService.syncStatus$.subscribe(statusMap => {
      const status = statusMap.get(this.getStatusKey());
      
      if (status) {
        this.currentStatus = status;
        this.isSyncing = status.isActive;
        
        // Montrer le badge quand une synchronisation commence
        if (status.isActive) {
          this.badgeVisible = true;
          this.clearBadgeHideTimeout();
        }
        
        if (status.errors > 0) {
          this.showErrorMessage(`${status.errors} erreur(s) de synchronisation`);
        }
        
        // Auto-show details when syncing starts
        if (status.isActive && !this.showDetails) {
          this.showDetails = true;
        }
      } else {
        // Synchronisation terminée
        if (this.isSyncing) {
          this.showSuccessMessage();
        }
        this.isSyncing = false;
        this.currentStatus = null;
        
        // Auto-hide details after completion
        if (this.autoHideDetails && this.showDetails) {
          setTimeout(() => {
            this.showDetails = false;
          }, 3000);
        }
        
        // Auto-hide badge after successful sync
        this.scheduleAutohideBadge();
      }
    });
  }
  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
    this.clearTimeouts();
  }

  // Nouvelle méthode pour planifier le masquage automatique du badge
  private scheduleAutohideBadge(): void {
    if (this.autoHideBadge && !this.showError && this.getPendingCount() === 0) {
      this.clearBadgeHideTimeout();
      this.badgeHideTimeout = setTimeout(() => {
        if (this.hideWhenIdle && !this.isSyncing && !this.showError) {
          this.badgeVisible = false;
        }
      }, this.autoHideDelay);
    }
  }

  private clearBadgeHideTimeout(): void {
    if (this.badgeHideTimeout) {
      clearTimeout(this.badgeHideTimeout);
      this.badgeHideTimeout = null;
    }
  }
  // Méthode pour forcer l'affichage du badge (utile pour les interactions utilisateur)
  showBadgeNow(): void {
    this.badgeVisible = true;
    this.clearBadgeHideTimeout();
  }

  // Méthode pour masquer immédiatement le badge
  hideBadgeNow(): void {
    this.badgeVisible = false;
    this.clearBadgeHideTimeout();
  }

  getSyncBadgeClass(): string {
    if (this.isSyncing) return 'sync-status-badge sync-badge-syncing';
    if (this.showError) return 'sync-status-badge sync-badge-error';
    if (this.getPendingCount() > 0) return 'sync-status-badge sync-badge-pending';
    return 'sync-status-badge sync-badge-idle';
  }

  getSyncIcon(): string {
    if (this.isSyncing) return 'fa-sync-alt fa-spin';
    if (this.showError) return 'fa-exclamation-triangle';
    if (this.getPendingCount() > 0) return 'fa-clock';
    return 'fa-check-circle';
  }

  getSyncBadgeText(): string {
    if (this.isSyncing) return 'Synchronisation...';
    if (this.showError) return 'Erreur';
    if (this.getPendingCount() > 0) return 'En attente';
    return 'Synchronisé';
  }

  getSyncTooltip(): string {
    if (this.isSyncing && this.currentStatus) {
      return `Synchronisation en cours: ${this.currentStatus.processed}/${this.currentStatus.total} (${this.currentStatus.progress}%)`;
    }
    if (this.showError) return `Erreur: ${this.errorMessage}`;
    if (this.getPendingCount() > 0) return `${this.getPendingCount()} élément(s) en attente de synchronisation`;
    return 'Toutes les données sont synchronisées';
  }
  getPendingCount(): number {
    // Implémentation améliorée pour compter les éléments non synchronisés
    if (!this.tableName) return 0;
    
    // Cette méthode devrait interroger la base de données locale
    // pour compter les éléments avec sync: false
    try {
      // Exemple d'implémentation (à adapter selon votre base de données)
      // return await db[this.tableName].filter(item => item.sync === false).count();
      
      // Pour l'instant, on retourne 0 si pas de synchronisation active
      return this.isSyncing ? 1 : 0;
    } catch (error) {
      console.warn('Erreur lors du comptage des éléments non synchronisés:', error);
      return 0;
    }
  }

  toggleDetails(): void {
    this.showDetails = !this.showDetails;
  }

  hideDetails(): void {
    this.showDetails = false;
  }

  hideSuccess(): void {
    this.showSuccess = false;
  }

  hideError(): void {
    this.showError = false;
  }

  hideToast(): void {
    this.showToast = false;
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
  }

  getElapsedTime(startTime: Date): string {
    const elapsed = Math.floor((Date.now() - startTime.getTime()) / 1000);
    if (elapsed < 60) return `${elapsed}s`;
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    return `${minutes}m ${seconds.toString().padStart(2, '0')}s`;
  }

  getToastClass(): string {
    return `sync-toast toast-${this.toastType}`;
  }

  getToastIcon(): string {
    switch (this.toastType) {
      case 'success': return 'fa-check-circle';
      case 'error': return 'fa-times-circle';
      case 'warning': return 'fa-exclamation-triangle';
      case 'info': return 'fa-info-circle';
      default: return 'fa-info-circle';
    }
  }

  private getStatusKey(): string {
    // Rechercher le statut correspondant à notre table
    return `${this.tableName}_up` || `${this.tableName}_down` || `${this.tableName}_update`;
  }

  private showSuccessMessage(): void {
    this.showSuccess = true;
    this.showToastMessage('Synchronisation réussie', `${this.entityName} synchronisé avec succès`, 'success');
    
    if (this.successTimeout) clearTimeout(this.successTimeout);
    this.successTimeout = setTimeout(() => {
      this.showSuccess = false;
      // Nouveau: masquer le badge automatiquement après succès
      if (this.autoHideBadge && this.badgeVisible) {
        this.hideBadgeNow();
      }
    }, this.autoHideDelay);
  }

  private showErrorMessage(message: string): void {
    this.showError = true;
    this.errorMessage = message;
    this.showToastMessage('Erreur de synchronisation', message, 'error');
    
    if (this.errorTimeout) clearTimeout(this.errorTimeout);
    this.errorTimeout = setTimeout(() => {
      this.showError = false;
    }, 5000);
  }

  private showToastMessage(title: string, message: string, type: 'success' | 'error' | 'warning' | 'info'): void {
    this.toastTitle = title;
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;

    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      this.showToast = false;
    }, type === 'error' ? 5000 : 3000);  }
  
  private clearTimeouts(): void {
    if (this.successTimeout) clearTimeout(this.successTimeout);
    if (this.errorTimeout) clearTimeout(this.errorTimeout);
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    if (this.badgeHideTimeout) clearTimeout(this.badgeHideTimeout);
  }

  getDirectionText(direction: 'up' | 'down' | 'update'): string {
    switch (direction) {
      case 'up':
        return 'Envoi vers le cloud';
      case 'down':
        return 'Réception du cloud';
      case 'update':
        return 'Mise à jour locale';
      default:
        return 'Synchronisation';
    }
  }
}

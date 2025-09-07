import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sync-indicator',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="sync-indicator" 
          [ngClass]="getSyncClass()" 
          [title]="getSyncTooltip()">
      <i class="icon" [ngClass]="getSyncIcon()"></i>
      <span class="sync-text" *ngIf="showText">{{ getSyncText() }}</span>
    </span>
  `,
  styles: [`
    .sync-indicator {
      display: inline-flex;
      align-items: center;
      font-size: 12px;
      padding: 2px 6px;
      border-radius: 12px;
      transition: all 0.2s ease;
    }

    .sync-indicator.synced {
      background: rgba(40, 167, 69, 0.1);
      color: #28a745;
      border: 1px solid rgba(40, 167, 69, 0.2);
    }

    .sync-indicator.not-synced {
      background: rgba(255, 193, 7, 0.1);
      color: #ffc107;
      border: 1px solid rgba(255, 193, 7, 0.2);
      animation: pulse 2s infinite;
    }

    .sync-indicator.syncing {
      background: rgba(0, 123, 255, 0.1);
      color: #007bff;
      border: 1px solid rgba(0, 123, 255, 0.2);
    }

    .sync-indicator.error {
      background: rgba(220, 53, 69, 0.1);
      color: #dc3545;
      border: 1px solid rgba(220, 53, 69, 0.2);
    }

    .icon {
      font-size: 11px;
      margin-right: 4px;
    }

    .sync-text {
      font-weight: 500;
      font-size: 10px;
    }

    @keyframes pulse {
      0% { opacity: 1; }
      50% { opacity: 0.6; }
      100% { opacity: 1; }
    }

    /* Versions compactes pour les tableaux */
    .sync-indicator.compact {
      padding: 1px 4px;
      font-size: 10px;
      min-width: 16px;
      height: 16px;
      justify-content: center;
    }

    .sync-indicator.compact .icon {
      margin-right: 0;
      font-size: 10px;
    }

    .sync-indicator.compact .sync-text {
      display: none;
    }

    /* Mode badge */
    .sync-indicator.badge-mode {
      border-radius: 50%;
      width: 12px;
      height: 12px;
      padding: 0;
      border: 2px solid;
    }

    .sync-indicator.badge-mode .icon,
    .sync-indicator.badge-mode .sync-text {
      display: none;
    }
  `]
})
export class SyncIndicatorComponent {
  @Input() isSynced: boolean = true;
  @Input() isSyncing: boolean = false;
  @Input() hasError: boolean = false;
  @Input() showText: boolean = false;
  @Input() compact: boolean = false;
  @Input() badgeMode: boolean = false;
  @Input() lastSyncDate: Date | null = null;
  @Input() errorMessage: string = '';

  getSyncClass(): string {
    let baseClass = 'sync-indicator';
    
    if (this.compact) baseClass += ' compact';
    if (this.badgeMode) baseClass += ' badge-mode';
    
    if (this.isSyncing) return baseClass + ' syncing';
    if (this.hasError) return baseClass + ' error';
    if (!this.isSynced) return baseClass + ' not-synced';
    return baseClass + ' synced';
  }

  getSyncIcon(): string {
    if (this.isSyncing) return 'ti ti-loader fa-spin';
    if (this.hasError) return 'ti ti-exclamation-triangle';
    if (!this.isSynced) return 'ti ti-clock';
    return 'ti ti-check';
  }

  getSyncText(): string {
    if (this.isSyncing) return 'Sync...';
    if (this.hasError) return 'Erreur';
    if (!this.isSynced) return 'En attente';
    return 'OK';
  }

  getSyncTooltip(): string {
    if (this.isSyncing) return 'Synchronisation en cours...';
    if (this.hasError) return `Erreur de synchronisation: ${this.errorMessage || 'Erreur inconnue'}`;
    if (!this.isSynced) return 'En attente de synchronisation';
    
    if (this.lastSyncDate) {
      return `Synchronisé le ${this.lastSyncDate.toLocaleString()}`;
    }
    return 'Synchronisé avec le cloud';
  }
}

import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { SyncService, SyncStatus } from '../../services/sync.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-sync-progress-indicator',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sync-progress-indicator.component.html',
  styleUrls: ['./sync-progress-indicator.component.scss']
})
export class SyncProgressIndicatorComponent implements OnInit, OnDestroy {
  @Input() tableName: string = '';
  @Input() entityName: string = '';
  @Input() cssClass: string = '';
  @Input() showProgressBar: boolean = true;
  @Input() showToasts: boolean = true;
  @Input() showDetails: boolean = false;

  // État de synchronisation
  isActive: boolean = false;
  currentState: 'uploading' | 'downloading' | 'success' | 'error' | 'idle' = 'idle';
  currentProgress: number = 0;
  currentCount: number = 0;
  totalCount: number = 0;
  estimatedTimeRemaining: number = 0;
  statusText: string = '';
  lastError: string = '';
  lastSyncTime: Date | null = null;
  lastSyncSuccess: boolean = false;

  // Propriétés calculées pour le template
  circumference: number = 2 * Math.PI * 10; // Pour la barre circulaire
  strokeDashoffset: number = this.circumference;

  private subscription: Subscription = new Subscription();

  constructor(
    private syncService: SyncService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.subscribeToSyncStatus();
    this.updateCircularProgress();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
  private subscribeToSyncStatus(): void {
    // Subscribe to the global sync status observable
    const statusSub = this.syncService.syncStatus$.subscribe(
      (statusMap: Map<string, SyncStatus>) => {
        const status = statusMap.get(this.tableName);
        if (status) {
          this.updateFromSyncStatus(status);
        }
      }
    );
    this.subscription.add(statusSub);
  }

  private updateFromSyncStatus(status: SyncStatus): void {
    this.isActive = status.isActive;
    this.currentProgress = status.progress || 0;
    this.currentCount = status.processed || 0;
    this.totalCount = status.total || 0;
    this.lastError = status.errors > 0 ? 'Erreurs de synchronisation détectées' : '';
    this.lastSyncTime = status.startTime || null;
    this.lastSyncSuccess = !status.isActive && status.errors === 0 && status.processed > 0;

    // Déterminer l'état actuel
    if (this.isActive) {
      this.currentState = status.direction === 'up' ? 'uploading' : 'downloading';
      this.statusText = status.direction === 'up' ? 'Envoi des données...' : 'Réception des données...';
    } else if (this.lastError) {
      this.currentState = 'error';
      this.statusText = 'Erreur de synchronisation';
    } else if (this.lastSyncSuccess) {
      this.currentState = 'success';
      this.statusText = 'Synchronisation réussie';
    } else {
      this.currentState = 'idle';
      this.statusText = 'En attente de synchronisation';
    }

    this.updateCircularProgress();
    this.handleToastMessages();
  }

  private updateCircularProgress(): void {
    const progress = this.currentProgress / 100;
    this.strokeDashoffset = this.circumference * (1 - progress);
  }
  private handleToastMessages(): void {
    if (!this.showToasts) return;

    if (this.lastSyncSuccess && !this.isActive) {
      this.toastr.success(
        `${this.entityName} synchronisés avec succès`,
        'Synchronisation réussie'
      );
    } else if (this.lastError && !this.isActive) {
      this.toastr.error(
        this.lastError,
        'Erreur de synchronisation'
      );
    }
  }

  toggleDetails(): void {
    this.showDetails = !this.showDetails;
  }

  get badgeTooltip(): string {
    if (this.isActive) {
      return `Synchronisation en cours: ${this.currentProgress}%`;
    } else if (this.lastError) {
      return `Erreur: ${this.lastError}`;
    } else if (this.lastSyncSuccess) {
      return `Dernière synchronisation: ${this.getLastSyncText()}`;
    }
    return 'Cliquez pour voir les détails';
  }

  getLastSyncText(): string {
    if (!this.lastSyncTime) {
      return 'Jamais synchronisé';
    }
    
    const now = new Date();
    const diff = now.getTime() - this.lastSyncTime.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) {
      return 'À l\'instant';
    } else if (minutes < 60) {
      return `Il y a ${minutes} minute${minutes > 1 ? 's' : ''}`;
    } else {
      const hours = Math.floor(minutes / 60);
      return `Il y a ${hours} heure${hours > 1 ? 's' : ''}`;
    }
  }
}

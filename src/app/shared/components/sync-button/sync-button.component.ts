import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { SyncService, SyncStatus } from '../../services/sync.service';

@Component({
  selector: 'app-sync-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sync-button.component.html',
  styleUrls: ['./sync-button.component.scss']
})
export class SyncButtonComponent implements OnInit, OnDestroy {
  @Input() tableName: string = '';
  @Input() entityName: string = '';
  @Input() buttonText: string = 'Synchroniser';
  @Input() buttonClass: string = 'btn-primary';
  @Input() cssClass: string = '';
  @Input() showProgress: boolean = true;
  @Input() showSpinner: boolean = true;
  @Input() showExternalBadge: boolean = false;
  @Input() showDropdown: boolean = false;
  @Input() isDisabled: boolean = false;
  @Output() syncClick = new EventEmitter<void>();

  // État de synchronisation
  isActive: boolean = false;
  currentState: 'uploading' | 'downloading' | 'success' | 'error' | 'idle' = 'idle';
  currentProgress: number = 0;
  currentCount: number = 0;
  totalCount: number = 0;
  estimatedTimeRemaining: number = 0;
  lastError: string = '';
  lastSyncTime: Date | null = null;
  lastSyncSuccess: boolean = false;

  private subscription: Subscription = new Subscription();

  constructor(private syncService: SyncService) {}

  ngOnInit(): void {
    this.subscribeToSyncStatus();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
  private subscribeToSyncStatus(): void {
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

    if (this.isActive) {
      this.currentState = status.direction === 'up' ? 'uploading' : 'downloading';
    } else if (this.lastError) {
      this.currentState = 'error';
    } else if (this.lastSyncSuccess) {
      this.currentState = 'success';
    } else {
      this.currentState = 'idle';
    }
  }

  onSyncClick(): void {
    if (!this.isActive && !this.isDisabled) {
      this.syncClick.emit();
      // Note: For now, we don't have direct sync methods in the service
      // The actual sync would be triggered by the parent component
    }
  }

  get buttonTooltip(): string {
    if (this.isActive) {
      return `Synchronisation en cours: ${this.currentProgress}%`;
    } else if (this.lastError) {
      return `Erreur: ${this.lastError}`;
    } else if (this.isDisabled) {
      return 'Synchronisation désactivée';
    }
    return `Synchroniser ${this.entityName}`;
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

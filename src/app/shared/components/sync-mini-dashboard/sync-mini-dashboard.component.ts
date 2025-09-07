import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Subscription } from 'rxjs';
import { SyncService, SyncStatus } from '../../services/sync.service';
import { SyncInitializationService } from '../../services/sync-initialization.service';

interface TableStatus {
  tableName: string;
  entityName: string;
  isActive: boolean;
  state: 'uploading' | 'downloading' | 'success' | 'error' | 'idle';
  progress: number;
  lastSyncTime: Date | null;
  lastSyncSuccess: boolean;
  lastError: string;
}

@Component({
  selector: 'app-sync-mini-dashboard',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './sync-mini-dashboard.component.html',
  styleUrls: ['./sync-mini-dashboard.component.scss']
})
export class SyncMiniDashboardComponent implements OnInit, OnDestroy {
  @Input() cssClass: string = '';
  @Input() showOnlyWhenActive: boolean = false;

  // États globaux
  totalTables: number = 0;
  activeSyncs: number = 0;
  successCount: number = 0;
  errorCount: number = 0;
  isExpanded: boolean = false;
  isRefreshing: boolean = false;
  lastUpdate: Date = new Date();

  // Données pour les templates
  activeSyncList: TableStatus[] = [];
  tableStatuses: TableStatus[] = [];

  private subscription: Subscription = new Subscription();

  constructor(
    private syncService: SyncService,
    private syncInitializationService: SyncInitializationService
  ) {}

  ngOnInit(): void {
    this.loadSyncStatuses();
    this.startPeriodicRefresh();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
  private loadSyncStatuses(): void {
    const statusSub = this.syncService.syncStatus$.subscribe(
      (statusMap: Map<string, SyncStatus>) => {
        const statuses = Array.from(statusMap.values());
        this.updateDashboardData(statuses);
      }
    );
    this.subscription.add(statusSub);
  }

  private updateDashboardData(statuses: SyncStatus[]): void {
    this.totalTables = statuses.length;
    this.activeSyncs = statuses.filter(s => s.isActive).length;
    this.successCount = statuses.filter(s => !s.isActive && s.errors === 0 && s.processed > 0).length;
    this.errorCount = statuses.filter(s => !s.isActive && s.errors > 0).length;

    // Convertir les statuses en TableStatus
    this.tableStatuses = statuses.map(status => this.convertToTableStatus(status));
    this.activeSyncList = this.tableStatuses.filter(t => t.isActive);

    this.lastUpdate = new Date();
  }

  private convertToTableStatus(status: SyncStatus): TableStatus {
    return {
      tableName: status.tableName,
      entityName: this.getEntityName(status.tableName),
      isActive: status.isActive,
      state: this.getTableState(status),
      progress: status.progress || 0,
      lastSyncTime: status.startTime,
      lastSyncSuccess: !status.isActive && status.errors === 0 && status.processed > 0,
      lastError: status.errors > 0 ? 'Erreurs de synchronisation détectées' : ''
    };
  }

  private getTableState(status: SyncStatus): 'uploading' | 'downloading' | 'success' | 'error' | 'idle' {
    if (status.isActive) {
      return status.direction === 'up' ? 'uploading' : 'downloading';
    } else if (status.errors > 0) {
      return 'error';
    } else if (status.processed > 0) {
      return 'success';
    }
    return 'idle';
  }

  private getEntityName(tableName: string): string {
    const entityMap: { [key: string]: string } = {
      'products': 'Produits',
      'stocks': 'Stocks', 
      'clients': 'Clients',
      'fournisseurs': 'Fournisseurs',
      'sales': 'Ventes',
      'commandes': 'Commandes'
    };
    
    return entityMap[tableName] || tableName;
  }

  private startPeriodicRefresh(): void {
    // Refresh every 5 seconds
    setInterval(() => {
      if (!this.isRefreshing) {
        this.refreshStatus();
      }
    }, 5000);
  }

  // Template methods
  refreshStatus(): void {
    this.isRefreshing = true;
    this.loadSyncStatuses();
    setTimeout(() => {
      this.isRefreshing = false;
    }, 1000);
  }

  toggleExpanded(): void {
    this.isExpanded = !this.isExpanded;
  }  triggerSync(tableName: string): void {
    try {
      this.syncInitializationService.syncCriticalData();
      console.log(`Synchronisation forcée pour toutes les tables critiques (incluant ${tableName})`);
    } catch (error) {
      console.error('Erreur lors du déclenchement de la synchronisation:', error);
    }
  }

  syncAll(): void {
    try {
      this.syncInitializationService.forceFullSync();
      console.log('Synchronisation complète forcée pour toutes les tables');
    } catch (error) {
      console.error('Erreur lors de la synchronisation complète:', error);
    }
  }

  retryErrors(): void {
    const errorTables = this.tableStatuses
      .filter(t => t.lastError && !t.isActive)
      .map(t => t.tableName);
    
    if (errorTables.length > 0) {
      try {
        this.syncInitializationService.syncCriticalData();
        console.log(`Nouvelle tentative de synchronisation pour ${errorTables.length} tables en erreur`);
      } catch (error) {
        console.error('Erreur lors de la nouvelle tentative de synchronisation:', error);
      }
    }
  }
}

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription, interval } from 'rxjs';
import { AdaptiveSyncService, AdaptiveSyncStatus } from '../../services/adaptive-sync.service';
import { AdvancedConnectivityService, ConnectionStatus } from '../../services/advanced-connectivity.service';
import { SyncQueueService, QueueStatus } from '../../services/sync-queue.service';
import { AdvancedDBService } from '../../services/db';

@Component({
  selector: 'app-sync-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="sync-dashboard">
      <!-- En-tête du tableau de bord -->
      <div class="dashboard-header">
        <h3 class="dashboard-title">
          <i class="fas fa-sync-alt"></i>
          Tableau de Bord de Synchronisation
        </h3>
        <div class="dashboard-actions">
          <button 
            class="btn btn-sm btn-primary"
            (click)="forceRefresh()"
            [disabled]="isRefreshing">
            <i class="fas fa-refresh" [class.fa-spin]="isRefreshing"></i>
            Actualiser
          </button>
          <button 
            class="btn btn-sm btn-outline-secondary"
            (click)="toggleAutoRefresh()">
            <i class="fas" [class.fa-pause]="autoRefreshEnabled" [class.fa-play]="!autoRefreshEnabled"></i>
            {{ autoRefreshEnabled ? 'Pause' : 'Auto' }}
          </button>
        </div>
      </div>

      <!-- Statut de connexion -->
      <div class="status-card connection-status" [class]="'status-' + connectionStatus?.quality">
        <div class="status-header">
          <h4>
            <i class="fas" [class]="getConnectionIcon()"></i>
            Connexion Réseau
          </h4>
          <span class="status-badge" [class]="'badge-' + connectionStatus?.quality">
            {{ getConnectionLabel() }}
          </span>
        </div>
        <div class="status-details" *ngIf="connectionStatus">
          <div class="detail-row">
            <span>Vitesse:</span>
            <strong>{{ connectionStatus.speed }} Mbps</strong>
          </div>
          <div class="detail-row">
            <span>Latence:</span>
            <strong>{{ connectionStatus.latency }}ms</strong>
          </div>
          <div class="detail-row">
            <span>Type:</span>
            <strong>{{ connectionStatus.effectiveType || 'N/A' }}</strong>
          </div>
          <div class="detail-row">
            <span>Dernière vérification:</span>
            <strong>{{ connectionStatus.lastCheck | date:'HH:mm:ss' }}</strong>
          </div>
        </div>
        <div class="connection-advice">
          {{ getConnectionAdvice() }}
        </div>
      </div>

      <!-- Statut de synchronisation adaptative -->
      <div class="status-card sync-status">
        <div class="status-header">
          <h4>
            <i class="fas fa-brain"></i>
            Synchronisation Adaptative
          </h4>
          <span class="status-badge" 
                [class.badge-success]="syncStatus?.isActive"
                [class.badge-secondary]="!syncStatus?.isActive">
            {{ syncStatus?.isActive ? 'Active' : 'Inactive' }}
          </span>
        </div>
        <div class="status-details" *ngIf="syncStatus">
          <div class="detail-row">
            <span>Mode:</span>
            <strong>{{ syncStatus.adaptiveMode }}</strong>
          </div>
          <div class="detail-row">
            <span>Intervalle:</span>
            <strong>{{ formatInterval(syncStatus.currentStrategy.interval) }}</strong>
          </div>
          <div class="detail-row">
            <span>Taille lot:</span>
            <strong>{{ syncStatus.currentStrategy.batchSize }}</strong>
          </div>
          <div class="detail-row" *ngIf="syncStatus.lastSyncTime">
            <span>Dernière sync:</span>
            <strong>{{ syncStatus.lastSyncTime | date:'dd/MM HH:mm' }}</strong>
          </div>
          <div class="detail-row" *ngIf="syncStatus.nextSyncTime">
            <span>Prochaine sync:</span>
            <strong>{{ syncStatus.nextSyncTime | date:'HH:mm:ss' }}</strong>
          </div>
        </div>
      </div>

      <!-- Queue de synchronisation -->
      <div class="status-card queue-status">
        <div class="status-header">
          <h4>
            <i class="fas fa-list"></i>
            Queue de Synchronisation
          </h4>
          <span class="status-badge"
                [class.badge-warning]="queueStatus && queueStatus.pendingItems > 0"
                [class.badge-success]="queueStatus && queueStatus.pendingItems === 0">
            {{ queueStatus?.totalItems || 0 }} items
          </span>
        </div>
        <div class="status-details" *ngIf="queueStatus">
          <div class="detail-row">
            <span>En attente:</span>
            <strong class="text-warning">{{ queueStatus.pendingItems }}</strong>
          </div>
          <div class="detail-row">
            <span>En cours:</span>
            <strong class="text-info">{{ queueStatus.processingItems }}</strong>
          </div>
          <div class="detail-row">
            <span>Échoués:</span>
            <strong class="text-danger">{{ queueStatus.failedItems }}</strong>
          </div>
          <div class="detail-row" *ngIf="queueStatus.lastProcessTime">
            <span>Dernier traitement:</span>
            <strong>{{ queueStatus.lastProcessTime | date:'HH:mm:ss' }}</strong>
          </div>
        </div>
        <div class="queue-actions" *ngIf="queueStatus && queueStatus.pendingItems > 0">
          <button class="btn btn-sm btn-primary" (click)="processQueueNow()">
            <i class="fas fa-play"></i>
            Traiter Maintenant
          </button>
          <button class="btn btn-sm btn-outline-danger" (click)="clearFailedItems()">
            <i class="fas fa-trash"></i>
            Nettoyer Échecs
          </button>
        </div>
      </div>

      <!-- Statistiques de base de données -->
      <div class="status-card db-stats">
        <div class="status-header">
          <h4>
            <i class="fas fa-database"></i>
            Base de Données
          </h4>
          <span class="status-badge badge-info">
            {{ dbStats?.totalRecords || 0 }} enregistrements
          </span>
        </div>
        <div class="status-details" *ngIf="dbStats">
          <div class="detail-row">
            <span>Non synchronisés:</span>
            <strong class="text-warning">{{ dbStats.unsyncedRecords }}</strong>
          </div>
          <div class="detail-row">
            <span>Taille estimée:</span>
            <strong>{{ dbStats.databaseSize }} KB</strong>
          </div>
          <div class="detail-row" *ngIf="dbStats.lastOptimization">
            <span>Dernière optimisation:</span>
            <strong>{{ dbStats.lastOptimization | date:'dd/MM/yyyy' }}</strong>
          </div>
        </div>
        <div class="db-actions">
          <button class="btn btn-sm btn-outline-primary" (click)="optimizeDatabase()">
            <i class="fas fa-compress"></i>
            Optimiser
          </button>
          <button class="btn btn-sm btn-outline-secondary" (click)="createBackup()">
            <i class="fas fa-download"></i>
            Backup
          </button>
          <button class="btn btn-sm btn-outline-danger" (click)="cleanupOldData()">
            <i class="fas fa-broom"></i>
            Nettoyer
          </button>
        </div>
      </div>

      <!-- Détail des tables -->
      <div class="status-card table-details" *ngIf="dbStats?.tableStats">
        <div class="status-header">
          <h4>
            <i class="fas fa-table"></i>
            Détail par Table
          </h4>
        </div>
        <div class="table-responsive">
          <table class="table table-sm">
            <thead>
              <tr>
                <th>Table</th>
                <th>Total</th>
                <th>Non sync.</th>
                <th>Récents</th>
                <th>%</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let entry of getTableStatsArray()">
                <td>{{ entry.name }}</td>
                <td>{{ entry.stats.total }}</td>
                <td>
                  <span [class.text-warning]="entry.stats.unsynced > 0">
                    {{ entry.stats.unsynced }}
                  </span>
                </td>
                <td>
                  <span [class.text-info]="entry.stats.recentlyModified > 0">
                    {{ entry.stats.recentlyModified }}
                  </span>
                </td>
                <td>
                  <div class="progress progress-sm">
                    <div class="progress-bar" 
                         [style.width.%]="getSyncPercentage(entry.stats)"
                         [class.bg-success]="entry.stats.unsynced === 0"
                         [class.bg-warning]="entry.stats.unsynced > 0">
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Messages et notifications -->
      <div class="status-card notifications" *ngIf="notifications.length > 0">
        <div class="status-header">
          <h4>
            <i class="fas fa-bell"></i>
            Notifications
          </h4>
          <button class="btn btn-sm btn-outline-secondary" (click)="clearNotifications()">
            <i class="fas fa-times"></i>
            Effacer
          </button>
        </div>
        <div class="notification-list">
          <div *ngFor="let notification of notifications" 
               class="notification-item"
               [class]="'notification-' + notification.type">
            <div class="notification-icon">
              <i class="fas" [class]="getNotificationIcon(notification.type)"></i>
            </div>
            <div class="notification-content">
              <div class="notification-title">{{ notification.title }}</div>
              <div class="notification-message">{{ notification.message }}</div>
              <div class="notification-time">{{ notification.timestamp | date:'HH:mm:ss' }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .sync-dashboard {
      padding: 20px;
      background: #f8f9fa;
      min-height: 100vh;
    }

    .dashboard-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      padding: 20px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .dashboard-title {
      margin: 0;
      color: #2c3e50;
    }

    .dashboard-title i {
      margin-right: 10px;
      color: #3498db;
    }

    .dashboard-actions {
      display: flex;
      gap: 10px;
    }

    .status-card {
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      margin-bottom: 20px;
      overflow: hidden;
    }

    .status-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 15px 20px;
      border-bottom: 1px solid #ecf0f1;
      background: #f8f9fa;
    }

    .status-header h4 {
      margin: 0;
      color: #2c3e50;
    }

    .status-header h4 i {
      margin-right: 8px;
    }

    .status-badge {
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 0.8em;
      font-weight: bold;
      text-transform: uppercase;
    }

    .badge-excellent { background: #27ae60; color: white; }
    .badge-good { background: #f39c12; color: white; }
    .badge-poor { background: #e74c3c; color: white; }
    .badge-offline { background: #95a5a6; color: white; }
    .badge-success { background: #27ae60; color: white; }
    .badge-warning { background: #f39c12; color: white; }
    .badge-danger { background: #e74c3c; color: white; }
    .badge-secondary { background: #95a5a6; color: white; }
    .badge-info { background: #3498db; color: white; }

    .status-details {
      padding: 15px 20px;
    }

    .detail-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .detail-row:last-child {
      margin-bottom: 0;
    }

    .connection-advice {
      padding: 15px 20px;
      background: #ecf0f1;
      border-top: 1px solid #bdc3c7;
      font-style: italic;
      color: #7f8c8d;
    }

    .connection-status.status-excellent { border-left: 4px solid #27ae60; }
    .connection-status.status-good { border-left: 4px solid #f39c12; }
    .connection-status.status-poor { border-left: 4px solid #e74c3c; }
    .connection-status.status-offline { border-left: 4px solid #95a5a6; }

    .queue-actions, .db-actions {
      padding: 15px 20px;
      border-top: 1px solid #ecf0f1;
      background: #f8f9fa;
      display: flex;
      gap: 10px;
    }

    .table-responsive {
      padding: 0 20px 20px;
    }

    .progress-sm {
      height: 8px;
    }

    .notification-list {
      padding: 15px 20px;
    }

    .notification-item {
      display: flex;
      align-items: flex-start;
      padding: 12px;
      margin-bottom: 10px;
      border-radius: 6px;
      border-left: 4px solid;
    }

    .notification-success { 
      background: #d4edda; 
      border-color: #27ae60; 
      color: #155724;
    }

    .notification-warning { 
      background: #fff3cd; 
      border-color: #f39c12; 
      color: #856404;
    }

    .notification-error { 
      background: #f8d7da; 
      border-color: #e74c3c; 
      color: #721c24;
    }

    .notification-info { 
      background: #d1ecf1; 
      border-color: #3498db; 
      color: #0c5460;
    }

    .notification-icon {
      margin-right: 12px;
      font-size: 18px;
    }

    .notification-content {
      flex: 1;
    }

    .notification-title {
      font-weight: bold;
      margin-bottom: 4px;
    }

    .notification-message {
      margin-bottom: 4px;
    }

    .notification-time {
      font-size: 0.8em;
      opacity: 0.7;
    }

    @media (max-width: 768px) {
      .sync-dashboard {
        padding: 10px;
      }

      .dashboard-header {
        flex-direction: column;
        gap: 15px;
        text-align: center;
      }

      .status-header {
        flex-direction: column;
        gap: 10px;
        text-align: center;
      }

      .detail-row {
        font-size: 0.9em;
      }

      .queue-actions, .db-actions {
        flex-direction: column;
      }
    }
  `]
})
export class SyncDashboardComponent implements OnInit, OnDestroy {
  connectionStatus: ConnectionStatus | null = null;
  syncStatus: AdaptiveSyncStatus | null = null;
  queueStatus: QueueStatus | null = null;
  dbStats: any = null;

  notifications: Array<{
    type: 'success' | 'warning' | 'error' | 'info';
    title: string;
    message: string;
    timestamp: Date;
  }> = [];

  autoRefreshEnabled = true;
  isRefreshing = false;

  private subscriptions: Subscription[] = [];
  private refreshInterval?: Subscription;

  constructor(
    private adaptiveSyncService: AdaptiveSyncService,
    private connectivityService: AdvancedConnectivityService,
    private queueService: SyncQueueService
  ) {}

  ngOnInit(): void {
    this.initializeSubscriptions();
    this.startAutoRefresh();
    this.loadInitialData();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.refreshInterval?.unsubscribe();
  }

  private initializeSubscriptions(): void {
    // Connexion
    this.subscriptions.push(
      this.connectivityService.connectionStatus$.subscribe(status => {
        this.connectionStatus = status;
        this.checkConnectionChanges(status);
      })
    );

    // Synchronisation adaptative
    this.subscriptions.push(
      this.adaptiveSyncService.syncStatus$.subscribe(status => {
        this.syncStatus = status;
      })
    );

    // Queue
    this.subscriptions.push(
      this.queueService.queueStatus$.subscribe(status => {
        this.queueStatus = status;
        this.checkQueueChanges(status);
      })
    );
  }

  private checkConnectionChanges(status: ConnectionStatus): void {
    const previousStatus = this.connectionStatus;
    
    if (previousStatus && previousStatus.quality !== status.quality) {
      this.addNotification({
        type: status.isConnected ? 'info' : 'warning',
        title: 'Changement de Connexion',
        message: `Qualité de connexion: ${status.quality}`,
        timestamp: new Date()
      });
    }
  }

  private checkQueueChanges(status: QueueStatus): void {
    if (status.failedItems > 0) {
      this.addNotification({
        type: 'error',
        title: 'Éléments Échoués',
        message: `${status.failedItems} éléments ont échoué en synchronisation`,
        timestamp: new Date()
      });
    }
  }

  private startAutoRefresh(): void {
    this.refreshInterval = interval(30000).subscribe(() => {
      if (this.autoRefreshEnabled) {
        this.refreshData();
      }
    });
  }

  private async loadInitialData(): Promise<void> {
    await this.refreshData();
  }

  async forceRefresh(): Promise<void> {
    this.isRefreshing = true;
    try {
      await this.connectivityService.checkConnectivity(true);
      await this.refreshData();
    } finally {
      this.isRefreshing = false;
    }
  }

  private async refreshData(): Promise<void> {
    try {
      this.dbStats = await AdvancedDBService.getDatabaseStats();
    } catch (error) {
      console.error('Erreur lors du rafraîchissement:', error);
    }
  }

  toggleAutoRefresh(): void {
    this.autoRefreshEnabled = !this.autoRefreshEnabled;
    
    this.addNotification({
      type: 'info',
      title: 'Actualisation Automatique',
      message: this.autoRefreshEnabled ? 'Activée' : 'Désactivée',
      timestamp: new Date()
    });
  }

  async processQueueNow(): Promise<void> {
    try {
      await this.queueService.processQueueManually();
      this.addNotification({
        type: 'success',
        title: 'Queue Traitée',
        message: 'La queue de synchronisation a été traitée manuellement',
        timestamp: new Date()
      });
    } catch (error: any) {
      this.addNotification({
        type: 'error',
        title: 'Erreur de Traitement',
        message: error.message,
        timestamp: new Date()
      });
    }
  }

  clearFailedItems(): void {
    this.queueService.clearQueue(true);
    this.addNotification({
      type: 'info',
      title: 'Nettoyage Effectué',
      message: 'Les éléments échoués ont été supprimés de la queue',
      timestamp: new Date()
    });
  }

  async optimizeDatabase(): Promise<void> {
    try {
      const result = await AdvancedDBService.optimizeDatabase();
      this.addNotification({
        type: 'success',
        title: 'Optimisation Réussie',
        message: `Base optimisée: ${result.beforeSize}KB → ${result.afterSize}KB`,
        timestamp: new Date()
      });
      await this.refreshData();
    } catch (error: any) {
      this.addNotification({
        type: 'error',
        title: 'Erreur d\'Optimisation',
        message: error.message,
        timestamp: new Date()
      });
    }
  }

  async createBackup(): Promise<void> {
    try {
      const result = await AdvancedDBService.createBackup();
      if (result.success) {
        this.addNotification({
          type: 'success',
          title: 'Backup Créé',
          message: `Backup ${result.backupKey} créé (${result.size} KB)`,
          timestamp: new Date()
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      this.addNotification({
        type: 'error',
        title: 'Erreur de Backup',
        message: error.message,
        timestamp: new Date()
      });
    }
  }

  async cleanupOldData(): Promise<void> {
    try {
      const result = await AdvancedDBService.cleanupOldData();
      const totalDeleted = Object.values(result.deletedCounts).reduce((a, b) => a + b, 0);
      
      this.addNotification({
        type: 'success',
        title: 'Nettoyage Effectué',
        message: `${totalDeleted} anciens enregistrements supprimés`,
        timestamp: new Date()
      });
      
      await this.refreshData();
    } catch (error: any) {
      this.addNotification({
        type: 'error',
        title: 'Erreur de Nettoyage',
        message: error.message,
        timestamp: new Date()
      });
    }
  }

  clearNotifications(): void {
    this.notifications = [];
  }

  private addNotification(notification: any): void {
    this.notifications.unshift(notification);
    // Garder seulement les 10 dernières notifications
    if (this.notifications.length > 10) {
      this.notifications = this.notifications.slice(0, 10);
    }
  }

  // Méthodes d'affichage
  getConnectionIcon(): string {
    if (!this.connectionStatus) return 'fa-question';
    
    switch (this.connectionStatus.quality) {
      case 'excellent': return 'fa-signal text-success';
      case 'good': return 'fa-signal text-warning';
      case 'poor': return 'fa-signal text-danger';
      default: return 'fa-times text-muted';
    }
  }

  getConnectionLabel(): string {
    if (!this.connectionStatus) return 'Inconnu';
    
    const labels = {
      excellent: 'Excellente',
      good: 'Bonne',
      poor: 'Faible',
      offline: 'Hors ligne'
    };
    
    return labels[this.connectionStatus.quality] || 'Inconnu';
  }

  getConnectionAdvice(): string {
    return this.connectivityService.getConnectionAdvice();
  }

  formatInterval(ms: number): string {
    if (ms === 0) return 'Désactivé';
    
    const minutes = Math.floor(ms / 60000);
    if (minutes < 60) return `${minutes}min`;
    
    const hours = Math.floor(minutes / 60);
    return `${hours}h${minutes % 60 > 0 ? ` ${minutes % 60}min` : ''}`;
  }

  getTableStatsArray(): Array<{name: string; stats: any}> {
    if (!this.dbStats?.tableStats) return [];
    
    return Object.entries(this.dbStats.tableStats).map(([name, stats]) => ({
      name,
      stats
    }));
  }

  getSyncPercentage(stats: any): number {
    if (stats.total === 0) return 100;
    return Math.round(((stats.total - stats.unsynced) / stats.total) * 100);
  }

  getNotificationIcon(type: string): string {
    const icons = {
      success: 'fa-check-circle',
      warning: 'fa-exclamation-triangle',
      error: 'fa-times-circle',
      info: 'fa-info-circle'
    };
    return icons[type as keyof typeof icons] || 'fa-info-circle';
  }
}

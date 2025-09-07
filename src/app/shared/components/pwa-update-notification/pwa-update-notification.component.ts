import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { PwaService, PwaUpdateInfo } from '../../../core/services/pwa.service';

@Component({
  selector: 'app-pwa-update-notification',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pwa-update-notification.component.html',
  styleUrls: ['./pwa-update-notification.component.scss']
})
export class PwaUpdateNotificationComponent implements OnInit, OnDestroy {
  updateInfo: PwaUpdateInfo | null = null;
  isUpdating = false;
  private subscription?: Subscription;

  constructor(private pwaService: PwaService) {}

  ngOnInit(): void {
    this.subscription = this.pwaService.updateAvailable$.subscribe(
      (info) => {
        this.updateInfo = info;
      }
    );
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  async installUpdate(): Promise<void> {
    this.isUpdating = true;
    
    try {
      const success = await this.pwaService.activateUpdate();
      if (success) {
        // Petit délai pour montrer le feedback
        setTimeout(() => {
          this.pwaService.reloadApp();
        }, 1000);
      }
    } catch (error) {
      console.error('Erreur lors de l\'installation:', error);
    } finally {
      this.isUpdating = false;
    }
  }

  dismissUpdate(): void {
    this.updateInfo = null;
    // Optionnel: marquer que l'utilisateur a reporté la mise à jour
    localStorage.setItem('pwa_update_dismissed', new Date().toISOString());
  }
}

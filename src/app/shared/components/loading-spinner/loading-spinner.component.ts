import { Component, OnInit, OnDestroy } from '@angular/core';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { LoadingService } from '../../../core/loading.service';
import { Observable, Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="loading-overlay" *ngIf="isLoading$ | async" @fadeInOut>
      <div class="loading-container">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Chargement...</span>
        </div>
        <div class="loading-text mt-3">
          {{ currentStep$ | async }}
        </div>
        <div class="loading-progress">
          <div class="progress-bar"></div>
        </div>
      </div>
    </div>
  `,
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.9)' }),
        animate('300ms ease-in-out', style({ opacity: 1, transform: 'scale(1)' }))
      ]),
      transition(':leave', [
        animate('300ms ease-in-out', style({ opacity: 0, transform: 'scale(0.9)' }))
      ])
    ])
  ],
  styles: [`
    .loading-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(255, 255, 255, 0.9);
      backdrop-filter: blur(4px);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 9999;
    }

    .loading-container {
      text-align: center;
      padding: 2rem;
      background: white;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
      max-width: 300px;
      width: 90%;
    }

    .loading-text {
      color: #6c757d;
      font-size: 0.9rem;
      font-weight: 500;
    }

    .loading-progress {
      width: 100%;
      height: 4px;
      background: #e9ecef;
      border-radius: 2px;
      overflow: hidden;
      margin-top: 1rem;
    }

    .progress-bar {
      height: 100%;
      background: linear-gradient(90deg, #007bff, #0056b3);
      border-radius: 2px;
      animation: progress 2s ease-in-out infinite;
    }

    @keyframes progress {
      0% { width: 0%; }
      50% { width: 100%; }
      100% { width: 0%; }
    }

    .spinner-border {
      width: 3rem;
      height: 3rem;
    }
  `]
})
export class LoadingSpinnerComponent implements OnInit, OnDestroy {
  isLoading$: Observable<boolean>;
  currentStep$: Observable<string>;
  private subscription: Subscription = new Subscription();

  constructor(private loadingService: LoadingService) {
    this.isLoading$ = this.loadingService.loading$;
    this.currentStep$ = this.loadingService.loadingSteps$;
  }

  ngOnInit(): void {
    // Démarrer le chargement initial
    this.loadingService.show('Initialisation de l\'application...');
    
    // Simuler les étapes de chargement
    setTimeout(() => {
      this.loadingService.updateStep('Chargement des modules...');
    }, 500);

    setTimeout(() => {
      this.loadingService.updateStep('Configuration des services...');
    }, 1000);

    setTimeout(() => {
      this.loadingService.hide();
    }, 1500);
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}

import { Component, OnDestroy, OnInit, Renderer2 } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { routes } from '../shared/routes/routes';
import { IUser } from '../shared/models/user.model';
import { CommonService } from '../shared/common/common.service';
import { AuthStateService } from '../core/auth/auth-state.service';

@Component({
  selector: 'app-lock-screen',
  standalone: false,
  templateUrl: './lock-screen.component.html',
  styleUrl: './lock-screen.component.scss'
})
export class LockScreenComponent implements OnInit, OnDestroy {
  public routes = routes;
  public password: boolean[] = [false];

  currentUser!: IUser;
  isLoading = false;
  lockScreenPassword = '';
  errorMessage = '';
  returnUrl = '/web/commandes';
  isOnline = navigator.onLine;
  
  private destroy$ = new Subject<void>();

  public togglePassword(index: any) {
    this.password[index] = !this.password[index]
  }

  base = '';
  page = '';
  last = '';

  constructor(
    private common: CommonService,
    private authStateService: AuthStateService,
    private renderer: Renderer2,
    private router: Router,
    private activatedRoute: ActivatedRoute
  ) {
    this.common.base.subscribe((res: string) => {
      this.base = res;
    });
    this.common.page.subscribe((res: string) => {
      this.page = res;
    });
    this.common.last.subscribe((res: string) => {
      this.last = res;
    });
    if (this.base == 'lock-screen') {
      this.renderer.addClass(document.body, 'account-page');
    }
  }
  ngOnInit(): void {
    // Récupérer l'URL de retour depuis les query params
    this.activatedRoute.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        this.returnUrl = params['returnUrl'] || '/web/commandes';
      });

    // Récupérer les données utilisateur depuis le cache local
    const currentUser = this.authStateService.getCurrentUser();
    if (currentUser) {
      this.currentUser = currentUser;
    } else {
      // Si pas d'utilisateur en cache, rediriger vers login
      this.router.navigate(['/auth/login']);
      return;
    }

    // S'abonner aux changements d'état utilisateur
    this.authStateService.user$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (user: IUser | null) => {
          if (user) {
            this.currentUser = user;
          }
        },
        error: (error: any) => {
          console.error('Erreur lors de la récupération de l\'utilisateur:', error);
        }
      });

    // Surveiller l'état de connexion
    this.authStateService.isOnline$
      .pipe(takeUntil(this.destroy$))
      .subscribe(isOnline => {
        this.isOnline = isOnline;
      });

    // Écouter les événements réseau
    window.addEventListener('online', () => this.isOnline = true);
    window.addEventListener('offline', () => this.isOnline = false);
  }

  /**
   * Déverrouiller avec le mot de passe (local puis serveur si échec)
   */
  async unlock() {
    if (!this.lockScreenPassword.trim()) {
      this.errorMessage = 'Veuillez saisir votre mot de passe';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    try {
      // 1. Tentative de déverrouillage local d'abord
      const localUnlockSuccess = await this.authStateService.unlockLocal(this.lockScreenPassword);
      
      if (localUnlockSuccess) {
        // Déverrouillage local réussi
        console.log('✅ Déverrouillage local réussi');
        this.router.navigate([this.returnUrl]);
        return;
      }

      // 2. Si le déverrouillage local échoue et qu'on est en ligne, essayer le serveur
      if (navigator.onLine) {
        console.log('🌐 Tentative de déverrouillage via serveur...');
        
        const credentials = {
          identifier: this.currentUser.email || this.currentUser.telephone || '',
          password: this.lockScreenPassword
        };

        this.authStateService.login(credentials)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              // Récupérer les données utilisateur après connexion réussie
              this.authStateService.fetchUserData()
                .pipe(takeUntil(this.destroy$))
                .subscribe({
                  next: () => {
                    console.log('✅ Déverrouillage serveur réussi');
                    this.router.navigate([this.returnUrl]);
                  },
                  error: (error: any) => {
                    this.errorMessage = 'Erreur lors de la récupération des données utilisateur';
                    this.isLoading = false;
                  }
                });
            },
            error: (error: any) => {
              this.errorMessage = error.message || 'Mot de passe incorrect';
              this.isLoading = false;
              this.lockScreenPassword = '';
            }
          });
      } else {
        // Hors ligne et déverrouillage local échoué
        this.errorMessage = 'Mot de passe incorrect (mode hors ligne)';
        this.isLoading = false;
        this.lockScreenPassword = '';
      }
    } catch (error) {
      console.error('Erreur lors du déverrouillage:', error);
      this.errorMessage = 'Erreur lors du déverrouillage';
      this.isLoading = false;
      this.lockScreenPassword = '';
    }
  }

  ngOnDestroy(): void {
    this.renderer.removeClass(document.body, 'account-page');
    
    // Nettoyer les event listeners
    window.removeEventListener('online', () => this.isOnline = true);
    window.removeEventListener('offline', () => this.isOnline = false);
    
    this.destroy$.next();
    this.destroy$.complete();
  }

  public navigate() {
    this.router.navigate([this.returnUrl]);
  }

  logout() {
    this.isLoading = true;
    this.authStateService.logout(true) // true = déconnexion manuelle
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          console.log('Déconnexion réussie');
        },
        error: (error: any) => {
          console.error('Erreur lors de la déconnexion:', error);
          this.router.navigate(['/auth/login']);
        },
        complete: () => {
          this.isLoading = false;
        }
      });
  }
}


import { Component, OnInit, OnDestroy } from '@angular/core';
import { Location } from '@angular/common';
import { SidebarService } from '../../../shared/sidebar/sidebar.service';
import { CommonService } from '../../../shared/common/common.service';
import { routes } from '../../../shared/routes/routes';
import { SettingsService } from '../../../shared/settings/settings.service'; 
import { AuthStateService } from '../../../core/auth/auth-state.service';
import { Router } from '@angular/router';
import { IUser } from '../../../shared/models/user.model';
import { Subject, takeUntil } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { UserProfileDialogComponent } from '../../../shared/components/user-profile-dialog/user-profile-dialog.component';

@Component({
  selector: 'app-header',
  standalone: false,
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnInit, OnDestroy {
  base = '';
  page = '';
  last = '';
  themeMode = 'light_mode';
  public miniSidebar = false;
  public routes = routes;

  currentUser!: IUser;
  isLoading = false;

  onLine = navigator.onLine;
  
  private destroy$ = new Subject<void>();
  constructor(
    private common: CommonService,
    private router: Router,
    private sidebar: SidebarService,
    private settings: SettingsService,
    private authStateService: AuthStateService, 
    private location: Location,
    private dialog: MatDialog,
  ) {
    this.common.base.subscribe((base: string) => {
      this.base = base;
    });
    this.common.page.subscribe((page: string) => {
      this.page = page;
    });
    this.common.last.subscribe((last: string) => {
      this.last = last;
    });
    this.sidebar.sideBarPosition.subscribe((res: string) => {
      if (res == 'true') {
        this.miniSidebar = true;
      } else {
        this.miniSidebar = false;
      }
    });
    this.settings.themeMode.subscribe((res: string) => {
      this.themeMode = res;
    });
  }  ngOnInit(): void {
    this.authStateService.user$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (user: IUser | null) => {
          if (user) {
            this.currentUser = user;
          }
        },
        error: (error: any) => { 
          this.router.navigate(['/auth/login']);
          console.log(error);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  logout() {
    this.isLoading = true;
    this.authStateService.logout()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          // La navigation est déjà gérée dans le service AuthState
          console.log('Déconnexion réussie');
        },
        error: (error: any) => {
          console.error('Erreur lors de la déconnexion:', error);
          // En cas d'erreur, rediriger quand même vers login
          this.router.navigate(['/auth/login']);
        },
        complete: () => {
          this.isLoading = false;
        }
      });
  }


  public toggleSidebar(): void {
    this.sidebar.switchSideMenuPosition();
  }

  public togglesMobileSideBar(): void {
    this.sidebar.switchMobileSideBarPosition();
  }

  public miniSideBarMouseHover(position: string): void {
    if (position == 'over') {
      this.sidebar.expandSideBar.next(true);
    } else {
      this.sidebar.expandSideBar.next(false);
    }
  }
  public changeThemeMode(theme: string): void {
    this.settings.themeMode.next(theme);
    localStorage.setItem('themeMode', theme);
  }

  goBack() {
    this.location.back();
  }

  openProfileDialog(): void {
    if (!this.currentUser) {
      console.warn('Aucun utilisateur connecté');
      return;
    }

    const dialogRef = this.dialog.open(UserProfileDialogComponent, {
      width: '700px',
      maxWidth: '90vw',
      maxHeight: '90vh',
      disableClose: false,
      data: { user: this.currentUser }
    });

    dialogRef.afterClosed().subscribe(result => {
      // Optionnel : traitement après fermeture du dialog
      console.log('Dialog profil fermé');
    });
  }

}

/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component } from '@angular/core';
import { routes } from '../../../shared/routes/routes';
import { MenuItem, SubMenu, url } from '../../../shared/model/sidebar.model';
import { NavigationStart, Router, Event as RouterEvent } from '@angular/router';
import { SidebarService } from '../../../shared/sidebar/sidebar.service';
import { DataService } from '../../../shared/data/data.service';
import { CommonService } from '../../../shared/common/common.service';
import { IUser } from '../../../shared/models/user.model';
import { AuthStateService } from '../../../core/auth/auth-state.service';


@Component({
  selector: 'app-sidebar',
  standalone: false,
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent {
  public routes = routes;
  base = '';
  page = '';
  last = '';

  currentUrl = '';

  currentUser!: IUser;


  public side_bar_data: any[] = [];
  constructor(
    private sidebar: SidebarService,
    private data: DataService,
    private router: Router,
    private common: CommonService,
    private authStateService: AuthStateService,
  ) {
    router.events.subscribe((event: RouterEvent) => {
      if (event instanceof NavigationStart) {
        this.getRoutes(event);
        const splitVal = event.url.split('/');
        this.currentUrl = event.url;
        this.base = splitVal[2];
        this.page = splitVal[3];
      }
    });
    this.getRoutes(this.router);
    // this.side_bar_data = this.data.sidebarData1;
    this.common.base.subscribe((res: string) => {
      this.base = res;
    });
    this.common.page.subscribe((res: string) => {
      this.page = res;
    });
    this.common.page.subscribe((res: string) => {
      this.last = res;
    });
  }
  ngOnInit(): void {
    this.authStateService.user$.subscribe({
      next: (user) => {
        this.currentUser = user;
        this.side_bar_data = this.data.sidebarData;
      },
      error: (error) => {
        this.router.navigate(['/auth/login']);
        console.log(error);
      }
    });
  }

  private getRoutes(route: url): void {
    const splitVal = route.url.split('/');
    this.currentUrl = route.url;
    this.base = splitVal[2];
    this.page = splitVal[3];
  }

  public miniSideBarMouseHover(position: string): void {
    if (position == 'over') {
      this.sidebar.expandSideBar.next(true);
    } else {
      this.sidebar.expandSideBar.next(false);
    }
  }
  currentOpenSecondMenu: MenuItem | null = null;

  expandSubMenus(menu: MenuItem): void {
    sessionStorage.setItem('menuValue', menu.menuValue);
    this.side_bar_data.forEach((mainMenus: MenuItem) => {
      mainMenus.menu.forEach((resMenu: SubMenu) => {
        if (resMenu.menuValue === menu.menuValue) {
          menu.showSubRoute = !menu.showSubRoute;
        } else {
          resMenu.showSubRoute = false;
        }
      });
    });
  }

  openMenuItem: MenuItem | null = null;
  openSubmenuOneItem: SubMenu[] | null = null;
  multiLevel1 = false;
  multiLevel2 = false;
  multiLevel3 = false;

  openMenu(menu: MenuItem): void {
    this.side_bar_data.forEach((mainMenu: any) => {
      if (mainMenu !== menu) {
        mainMenu.menu.forEach((submenu: any) => {
          submenu.showSubRoute = false;
        });
      }
    });
    if (this.openMenuItem === menu) {
      this.openMenuItem = null;
    } else {
      this.openMenuItem = menu;
    }
  }

  openSubmenuOne(subMenus: SubMenu[]): void {
    if (this.openSubmenuOneItem === subMenus) {
      this.openSubmenuOneItem = null;
    } else {
      this.openSubmenuOneItem = subMenus;
    }
  }

  multiLevelOne() {
    this.multiLevel1 = !this.multiLevel1;
  }
  multiLevelTwo() {
    this.multiLevel2 = !this.multiLevel2;
  }
  multiLevelThree() {
    this.multiLevel3 = !this.multiLevel3;
  }

  // Méthode pour vérifier si un menu parent doit être actif
  isMenuActive(menu: any): boolean {
    if (!menu.hasSubRoute || !menu.subMenus) {
      return false;
    }
    
    return menu.subMenus.some((subMenu: any) => 
      this.page === subMenu.page
    );
  }

}

import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { routes } from '../routes/routes';

@Injectable({
  providedIn: 'root',
})
export class DataService {

  private collapseSubject = new BehaviorSubject<boolean>(false);
  collapse$ = this.collapseSubject.asObservable();

  toggleCollapse() {
    this.collapseSubject.next(!this.collapseSubject.value);
  }

  public sidebarData = [
    {
      tittle: 'Main MENU',
      showAsTab: false,
      separateRoute: false,
      hasSubRoute: false,
      showSubRoute: true,
      menu: [
        {
          menuValue: 'Dashboard',
          icon: 'dashboard',
          base: 'dashboard',
          page: 'dashboard',
          route: routes.dashboard,
          hasSubRoute: false,
          showSubRoute: false,
        },
        {
          menuValue: 'Appartements',
          icon: 'home',
          base: 'appartements',
          page: 'appartments',
          route: routes.appartementsList,
          hasSubRoute: false,
          showSubRoute: false,
        },
        {
          menuValue: 'Caisses',
          icon: 'cash',
          base: 'caisses',
          page: 'caisses',
          route: routes.caisseList,
          hasSubRoute: false,
          showSubRoute: false,
        },
        {
          menuValue: 'Users',
          icon: 'users',
          base: 'users',
          page: 'users',
          route: routes.userList,
          hasSubRoute: false,
          showSubRoute: false,
        },
      ],
    },
  ];

}

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
      tittle: 'Menu Principal',
      showAsTab: false,
      separateRoute: false,
      hasSubRoute: false,
      showSubRoute: true,
      menu: [
        {
          menuValue: 'Dashboard',
          hasSubRoute: true,
          showSubRoute: true,
          icon: 'dashboard',
          base: 'dashboard',
          subMenus: [
            {
              menuValue: 'Vue d\'ensemble',
              route: routes.dashboardSummary,
            },
            {
              menuValue: 'Dashboard GIS',
              route: routes.dashboardGis,
            },
            {
              menuValue: 'Temps Réel',
              route: routes.dashboardRealtime,
            },
            {
              menuValue: 'Analyse Prédictive',
              route: routes.dashboardPredictive,
            },
            {
              menuValue: 'Analyse Spatiale',
              route: routes.dashboardSpatial,
            },
            {
              menuValue: 'Analyse Trajectoire',
              route: routes.dashboardTrajectory,
            },
          ]
        },
      ],
    },
    {
      tittle: 'Gestion',
      showAsTab: true,
      separateRoute: false,
      menu: [
        {
          menuValue: 'Utilisateurs',
          icon: 'users',
          base: 'users',
          page: 'user-list',
          route: routes.userList,
          hasSubRoute: false,
          showSubRoute: false,
        },
      ],
    },
    {
      tittle: 'Migration',
      showAsTab: true,
      separateRoute: false,
      menu: [
        {
          menuValue: 'Migrants',
          icon: 'users',
          base: 'migration',
          page: 'migrants',
          route: routes.migrants,
          hasSubRoute: false,
          showSubRoute: false,
        },
      ],
    },
    {
      tittle: 'Géolocalisation',
      showAsTab: true,
      separateRoute: false,
      menu: [
        {
          menuValue: 'Géolocalisations',
          icon: 'map-pin',
          base: 'gis',
          page: 'geolocations',
          route: routes.geolocations,
          hasSubRoute: false,
          showSubRoute: false,
        },
      ],
    },
    {
      tittle: 'Notifications',
      showAsTab: true,
      separateRoute: false,
      menu: [
        {
          menuValue: 'Alertes',
          icon: 'alert-triangle',
          base: 'notifications',
          page: 'alerts',
          route: routes.alerts,
          hasSubRoute: false,
          showSubRoute: false,
        },
      ],
    },
    {
      tittle: 'Biométrie',
      showAsTab: true,
      separateRoute: false,
      menu: [
        {
          menuValue: 'Biométrie',
          icon: 'fingerprint',
          base: 'bio',
          page: 'biometrics',
          route: routes.biometrics,
          hasSubRoute: false,
          showSubRoute: false,
        },
      ],
    },
    {
      tittle: 'Motifs',
      showAsTab: true,
      separateRoute: false,
      menu: [
        {
          menuValue: 'Motifs de Déplacement',
          icon: 'move',
          base: 'motifs',
          page: 'motifs-deplacement',
          route: routes.motifsDeplacementComponent,
          hasSubRoute: false,
          showSubRoute: false,
        },
      ],
    },
  ];

}
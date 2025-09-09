import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LayoutsComponent } from './layouts.component';  
import { UsersComponent } from './users/users.component';
import { MigrantsComponent } from './migrants/migrants.component';
import { GeolocationsComponent } from './geolocations/geolocations.component';
import { AlertsComponent } from './alerts/alerts.component';
import { BiometricsComponent } from './biometrics/biometrics.component';
import { MotifsDeplacementComponent } from '../shared/components/motifs-deplacement/motifs-deplacement.component';

const routes: Routes = [
  {
    path: '',
    component: LayoutsComponent,
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
     
      {
        path: 'users/user-list',
        component: UsersComponent
      },
      {
        path: 'migration/migrants',
        component: MigrantsComponent
      },
      {
        path: 'gis/geolocations',
        component: GeolocationsComponent
      },
      {
        path: 'notifications/alerts',
        component: AlertsComponent
      },
      {
        path: 'bio/biometrics',
        component: BiometricsComponent
      },
      {
        path: 'motifs/motifs-deplacement',
        component: MotifsDeplacementComponent
      },
       {
        path: 'dashboard',
        loadChildren: () =>
          import('./dashboard/dashboard.module').then((m) => m.DashboardModule),
      },
      {
        path: 'pages',
        loadChildren: () =>
          import('./pages/pages.module').then((m) => m.PagesModule),
      }, 
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class LayoutsRoutingModule { }

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './dashboard.component';
import { OverviewComponent } from './components/overview/overview.component';

const routes: Routes = [
  {
    path: '',
    component: DashboardComponent,
    children: [
      {
        path: '',
        redirectTo: 'overview',
        pathMatch: 'full'
      },
      {
        path: 'overview',
        component: OverviewComponent,
        data: { title: 'Dashboard Overview' }
      },
      // {
      //   path: 'gis',
      //   component: GisDashboardComponent,
      //   data: { title: 'GIS Dashboard' }
      // },
      // {
      //   path: 'realtime',
      //   component: RealtimeAlertComponent,
      //   data: { title: 'Real-time Monitoring' }
      // },
      // {
      //   path: 'predictive',
      //   component: PredictiveAnalyticsComponent,
      //   data: { title: 'Predictive Analytics' }
      // }, 
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DashboardRoutingModule { }

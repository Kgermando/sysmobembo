import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './dashboard.component';
import { GisDashboardComponent } from './components/gis-dashboard/gis-dashboard.component';
import { RealtimeDashboardComponent } from './components/realtime-dashboard/realtime-dashboard.component';
import { PredictiveAnalyticsComponent } from './components/predictive-analytics/predictive-analytics.component';
import { SpatialAnalysisComponent } from './components/spatial-analysis/spatial-analysis.component';
import { TrajectoryAnalysisComponent } from './components/trajectory-analysis/trajectory-analysis.component';

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
        component: DashboardComponent,
        data: { title: 'Dashboard Overview' }
      },
      {
        path: 'gis',
        component: GisDashboardComponent,
        data: { title: 'GIS Dashboard' }
      },
      {
        path: 'realtime',
        component: RealtimeDashboardComponent,
        data: { title: 'Real-time Monitoring' }
      },
      {
        path: 'predictive',
        component: PredictiveAnalyticsComponent,
        data: { title: 'Predictive Analytics' }
      },
      {
        path: 'spatial',
        component: SpatialAnalysisComponent,
        data: { title: 'Spatial Analysis' }
      },
      {
        path: 'trajectory',
        component: TrajectoryAnalysisComponent,
        data: { title: 'Trajectory Analysis' }
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DashboardRoutingModule { }

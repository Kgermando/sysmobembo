import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DashboardRoutingModule } from './dashboard-routing.module';
import { DashboardComponent } from './dashboard.component'; 
import { NgScrollbarModule } from 'ngx-scrollbar';
import { SharedCoreModule } from '../../shared/shared-core.module';
import { SharedAdvancedModule } from '../../shared/shared-advanced.module';

// Dashboard Components
import { GisDashboardComponent } from './components/gis-dashboard/gis-dashboard.component';
import { RealtimeDashboardComponent } from './components/realtime-dashboard/realtime-dashboard.component';
import { PredictiveAnalyticsComponent } from './components/predictive-analytics/predictive-analytics.component';
import { SpatialAnalysisComponent } from './components/spatial-analysis/spatial-analysis.component';
import { TrajectoryAnalysisComponent } from './components/trajectory-analysis/trajectory-analysis.component';

// Dashboard Services
import { DashboardBaseService } from './services/dashboard-base.service';
import { GisService } from './services/gis.service';
import { PredictiveAnalysisService } from './services/predictive-analysis.service';
import { RealtimeMonitoringService } from './services/realtime-monitoring.service';
import { SpatialAnalysisService } from './services/spatial-analysis.service';
import { TrajectoryAnalysisService } from './services/trajectory-analysis.service';

@NgModule({
  declarations: [
    DashboardComponent,
    // Dashboard Components - convertis en composants normaux
    GisDashboardComponent,
    RealtimeDashboardComponent,
    PredictiveAnalyticsComponent,
    SpatialAnalysisComponent,
    TrajectoryAnalysisComponent
  ],
  imports: [
    CommonModule,
    DashboardRoutingModule,
    SharedCoreModule, // Module allégé pour les layouts
    SharedAdvancedModule, // Module avancé pour les charts 
    NgScrollbarModule // Pour le sidebar scrollable
  ],
  providers: [
    // Dashboard Services
    DashboardBaseService,
    GisService,
    PredictiveAnalysisService,
    RealtimeMonitoringService,
    SpatialAnalysisService,
    TrajectoryAnalysisService
  ]
})
export class DashboardModule { }

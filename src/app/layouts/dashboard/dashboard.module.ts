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
 
// Dashboard Services
import { DashboardBaseService } from './services/dashboard-base.service';
import { GisService } from './services/gis.service';
import { PredictiveAnalysisService } from './services/predictive-analysis.service';
import { AdvancedAnalyticsService } from './services/advanced-analytics.service';
import { RealtimeMonitoringService } from './services/realtime-monitoring.service'; 
 
@NgModule({
  declarations: [
    DashboardComponent,
    // Dashboard Components - convertis en composants normaux
    GisDashboardComponent,
    RealtimeDashboardComponent,
    PredictiveAnalyticsComponent,  
  ],
  imports: [
    CommonModule,
    DashboardRoutingModule,
    SharedCoreModule, // Module allégé pour les layouts
    SharedAdvancedModule, // Module avancé pour les charts 
    NgScrollbarModule // Pour le sidebar scrollable
  ],
  providers: [ 
    DashboardBaseService,
    GisService,
    PredictiveAnalysisService,
    AdvancedAnalyticsService,
    RealtimeMonitoringService,  
  ]
})
export class DashboardModule { }

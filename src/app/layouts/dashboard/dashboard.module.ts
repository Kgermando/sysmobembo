import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DashboardRoutingModule } from './dashboard-routing.module';
import { DashboardComponent } from './dashboard.component'; 
import { NgScrollbarModule } from 'ngx-scrollbar';
import { SharedCoreModule } from '../../shared/shared-core.module';
import { SharedAdvancedModule } from '../../shared/shared-advanced.module';
 
// Dashboard Services
import { DashboardBaseService } from './services/dashboard-base.service';
import { GisService } from './services/gis.service';
import { PredictiveAnalysisService } from './services/predictive-analysis.service';
import { AdvancedAnalyticsService } from './services/advanced-analytics.service'; 
import { RealtimeAlertsDashboardService } from './services/realtime-alerts-dashboard.service'; 
import { OverviewComponent } from './components/overview/overview.component';
 
@NgModule({
  declarations: [
    DashboardComponent, 
    OverviewComponent,  
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
    RealtimeAlertsDashboardService,
  ]
})
export class DashboardModule { }

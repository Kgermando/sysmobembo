import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DashboardRoutingModule } from './dashboard-routing.module';
import { DashboardComponent } from './dashboard.component'; 
import { NgScrollbarModule } from 'ngx-scrollbar';
import { SharedCoreModule } from '../../shared/shared-core.module';
import { SharedAdvancedModule } from '../../shared/shared-advanced.module';
 
// Dashboard Services
import { OverviewComponent } from './components/overview/overview.component';
import { DeplacementService } from './components/overview/services/deplacement.service';
 
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
    DeplacementService,
  ]
})
export class DashboardModule { }

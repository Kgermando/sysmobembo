import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { LayoutsRoutingModule } from './layouts-routing.module';
import { SharedCoreModule } from '../shared/shared-core.module';
import { SharedAdvancedModule } from '../shared/shared-advanced.module';
import { MigrationComponentsModule } from '../shared/components/migration/migration-components.module';
import { NgScrollbarModule } from 'ngx-scrollbar';
import { LayoutsComponent } from './layouts.component';
import { HeaderComponent } from './common/header/header.component';
import { LayoutCommonComponent } from './common/layout-common/layout-common.component';
import { SidebarComponent } from './common/sidebar/sidebar.component';
import { UsersComponent } from './users/users.component';
import { MigrantsComponent } from './migrants/migrants.component';
import { GeolocationsComponent } from './geolocations/geolocations.component';
import { AlertsComponent } from './alerts/alerts.component';
import { BiometricsComponent } from './biometrics/biometrics.component';


@NgModule({
  declarations: [
    LayoutsComponent,

    HeaderComponent,
    LayoutCommonComponent,
    SidebarComponent, 
    UsersComponent,
    MigrantsComponent,
    GeolocationsComponent,
    AlertsComponent,
    BiometricsComponent,

  ], 
  imports: [
    CommonModule,
    LayoutsRoutingModule,
    SharedCoreModule, // Module allégé pour les layouts
    SharedAdvancedModule, // Module avancé pour les charts
    MigrationComponentsModule, // Module pour les composants de migration
    NgScrollbarModule, // Pour le sidebar scrollable
  ]
})
export class LayoutsModule { }

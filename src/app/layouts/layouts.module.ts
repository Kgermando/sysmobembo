import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { LayoutsRoutingModule } from './layouts-routing.module';
import { SharedCoreModule } from '../shared/shared-core.module';
import { SharedAdvancedModule } from '../shared/shared-advanced.module';
import { NgScrollbarModule } from 'ngx-scrollbar';
import { LayoutsComponent } from './layouts.component';
import { HeaderComponent } from './common/header/header.component';
import { LayoutCommonComponent } from './common/layout-common/layout-common.component';
import { SidebarComponent } from './common/sidebar/sidebar.component';
import { UsersComponent } from './users/users.component';


@NgModule({
  declarations: [
    LayoutsComponent,

    HeaderComponent,
    LayoutCommonComponent,
    SidebarComponent, 
    UsersComponent, 

  ], imports: [
    CommonModule,
    LayoutsRoutingModule,
    SharedCoreModule, // Module allégé pour les layouts
    SharedAdvancedModule, // Module avancé pour les charts
    NgScrollbarModule, // Pour le sidebar scrollable
  ]
})
export class LayoutsModule { }

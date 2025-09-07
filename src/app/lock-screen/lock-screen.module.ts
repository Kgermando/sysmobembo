import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { LockScreenRoutingModule } from './lock-screen-routing.module';
import { LockScreenComponent } from './lock-screen.component';
import { SharedCoreModule } from '../shared/shared-core.module';


@NgModule({
  declarations: [
    LockScreenComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    LockScreenRoutingModule,

    SharedCoreModule // Module allégé pour l'écran de verrouillage
  ]
})
export class LockScreenModule { }

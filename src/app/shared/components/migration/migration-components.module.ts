import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedCoreModule } from '../../shared-core.module';
import { MotifsDeplacementComponent } from '../motifs-deplacement/motifs-deplacement.component';

/**
 * Module for migration-related components
 * Contains MotifsDeplacementComponent
 */
@NgModule({
  declarations: [
    MotifsDeplacementComponent,
  ],
  imports: [
    CommonModule,
    SharedCoreModule,
  ],
  exports: [
    MotifsDeplacementComponent,
  ]
})
export class MigrationComponentsModule { }

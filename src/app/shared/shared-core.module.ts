import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MaterialModule } from './material/material.module';
import { CustomPaginationModule } from './custom-pagination/custom-pagination.module';
import { CollapseHeaderModule } from './common/collapse-header/collapse-header.module';
import { DateRangePickerModule } from './common/date-range-picker/date-range-picker.module';
import { ReloadComponent } from './components/reload/reload.component';
import { ExerciceConfirmDialogComponent } from './components/confirm-dialog/confirm-dialog.component';
import { UserProfileDialogComponent } from './components/user-profile-dialog/user-profile-dialog.component';

/**
 * Module partagé pour les fonctionnalités de base (léger)
 * Utilisé dans tous les modules pour les fonctionnalités essentielles
 */
@NgModule({
    declarations: [
        ReloadComponent,
        ExerciceConfirmDialogComponent, 
        UserProfileDialogComponent,
    ],
    exports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        RouterModule,
        MaterialModule,
        CustomPaginationModule,
        CollapseHeaderModule,
        DateRangePickerModule,
        ReloadComponent,
        ExerciceConfirmDialogComponent, 
        UserProfileDialogComponent,
    ],
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        RouterModule,
        MaterialModule,
        CustomPaginationModule,
        CollapseHeaderModule,
        DateRangePickerModule,
    ]
})
export class SharedCoreModule { }

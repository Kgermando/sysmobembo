import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule } from '@angular/material/sort';
import { ClipboardModule } from '@angular/cdk/clipboard';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { MatStepperModule } from '@angular/material/stepper';
import { CdkStepperModule } from '@angular/cdk/stepper';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { STEPPER_GLOBAL_OPTIONS } from '@angular/cdk/stepper';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSliderModule } from '@angular/material/slider';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatDialogModule } from '@angular/material/dialog';
import { MatRadioModule } from '@angular/material/radio';
import { MatOptionModule } from '@angular/material/core';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTabsModule } from '@angular/material/tabs';
import { MatMenuModule } from '@angular/material/menu';

@NgModule({  imports: [
    MatButtonModule,
    MatSlideToggleModule,
    MatTableModule,
    MatSortModule,
    ClipboardModule,
    DragDropModule,
    ScrollingModule,
    MatStepperModule,
    MatFormFieldModule,
    MatToolbarModule,
    MatIconModule,
    MatCheckboxModule,
    MatInputModule,
    MatProgressBarModule,
    MatChipsModule,
    CdkStepperModule,
    MatSelectModule,
    MatAutocompleteModule,
    MatCardModule,
    MatTooltipModule,
    MatSliderModule,
    MatPaginatorModule,
    MatDialogModule,
    MatRadioModule,
    MatOptionModule,
    MatButtonToggleModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDividerModule,
    MatExpansionModule,
    MatTabsModule,
    MatMenuModule,
  ],  exports: [
    MatButtonModule,
    MatSlideToggleModule,
    MatTableModule,
    MatSortModule,
    ClipboardModule,
    DragDropModule,
    ScrollingModule,
    MatStepperModule,
    MatFormFieldModule,
    MatToolbarModule,
    MatIconModule,
    MatCheckboxModule,
    MatInputModule,
    MatProgressBarModule,
    MatChipsModule,
    CdkStepperModule,
    MatSelectModule,
    MatAutocompleteModule,
    MatCardModule,
    MatTooltipModule,
    MatSliderModule,
    MatPaginatorModule,
    MatDialogModule,
    MatRadioModule,
    MatOptionModule,
    MatButtonToggleModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDividerModule,
    MatExpansionModule,
    MatTabsModule,
    MatMenuModule,
  ],
  providers: [
    {
      provide: STEPPER_GLOBAL_OPTIONS,
      useValue: { showError: true },
    },
  ],
})
export class MaterialModule { }

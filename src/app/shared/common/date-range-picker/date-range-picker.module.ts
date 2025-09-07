import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
 
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  BsDatepickerModule,
 
} from 'ngx-bootstrap/datepicker';
import { DateRangePickerComponent } from './date-range-picker.component';

@NgModule({
  declarations: [
    DateRangePickerComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    BsDatepickerModule,
  ],  exports: [
    DateRangePickerComponent,
    BsDatepickerModule, // Export pour permettre l'utilisation des directives bsDaterangepicker
  ]
})
export class DateRangePickerModule { }

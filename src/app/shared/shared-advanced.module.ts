import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgScrollbarModule } from 'ngx-scrollbar';
import { NgApexchartsModule } from 'ng-apexcharts';
import { BsDatepickerModule } from 'ngx-bootstrap/datepicker';
import { NgxEditorModule } from 'ngx-editor';
import { CarouselModule } from 'ngx-owl-carousel-o';
import { LightgalleryModule } from 'lightgallery/angular';
import { FullCalendarModule } from '@fullcalendar/angular';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { PopoverModule } from 'ngx-bootstrap/popover';
import { NgxDropzoneModule } from 'ngx-dropzone';
import { NgChartsModule } from 'ng2-charts';
import { LightboxModule } from 'ngx-lightbox';
import { TimepickerModule } from 'ngx-bootstrap/timepicker';
import { NgxMatTimepickerModule } from 'ngx-mat-timepicker';

/**
 * Module pour les fonctionnalités avancées (lourd)
 * À importer uniquement dans les modules qui en ont besoin
 */
@NgModule({
    exports: [
        NgScrollbarModule,
        NgApexchartsModule,
        BsDatepickerModule,
        NgxEditorModule,
        CarouselModule,
        LightgalleryModule,
        FullCalendarModule,
        TooltipModule,
        PopoverModule,
        NgxDropzoneModule,
        NgChartsModule,
        LightboxModule,
        TimepickerModule,
        NgxMatTimepickerModule,
    ],
    imports: [
        CommonModule,
        NgScrollbarModule,
        NgApexchartsModule,
        BsDatepickerModule.forRoot(),
        NgxEditorModule,
        CarouselModule,
        LightgalleryModule,
        FullCalendarModule,
        TooltipModule,
        PopoverModule,
        NgxDropzoneModule,
        NgChartsModule.forRoot(),
        LightboxModule,
        TimepickerModule.forRoot(),
        NgxMatTimepickerModule,
    ]
})
export class SharedAdvancedModule { }

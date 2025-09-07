import { NgModule } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { SharedCoreModule } from './shared-core.module';
import { BsDatepickerConfig, BsDaterangepickerConfig } from 'ngx-bootstrap/datepicker';
import { HttpClientModule, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

/**
 * Module partagé optimisé pour le démarrage rapide
 * Version allégée du SharedModule principal
 */
@NgModule({
    exports: [
        SharedCoreModule,
        HttpClientModule,
    ],
    imports: [
        CommonModule,
        SharedCoreModule,
        HttpClientModule,
    ],
    providers: [
        BsDatepickerConfig,
        DatePipe,
        BsDaterangepickerConfig,
        provideHttpClient(withInterceptorsFromDi())
    ]
})
export class SharedOptimizedModule { }

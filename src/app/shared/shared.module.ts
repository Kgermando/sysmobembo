import { NgModule } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { SharedCoreModule } from './shared-core.module';
import { SharedAdvancedModule } from './shared-advanced.module';
import { HttpClientModule, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { BsDatepickerConfig, BsDaterangepickerConfig } from 'ngx-bootstrap/datepicker';

/**
 * Module partagé complet (LEGACY - À éviter pour les nouvelles implémentations)
 * Utilisé uniquement là où toutes les fonctionnalités sont nécessaires
 * Préférer SharedCoreModule + SharedAdvancedModule selon les besoins
 */


@NgModule({
    exports: [
        SharedCoreModule,
        SharedAdvancedModule,
        HttpClientModule,
    ],
    imports: [
        CommonModule,
        SharedCoreModule,
        SharedAdvancedModule,
        HttpClientModule,
    ],
    providers: [
        BsDatepickerConfig,
        DatePipe,
        BsDaterangepickerConfig,
        provideHttpClient(withInterceptorsFromDi())
    ]
})
export class SharedModule { }

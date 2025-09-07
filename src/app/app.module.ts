import { LOCALE_ID, NgModule, isDevMode } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import localeFr from '@angular/common/locales/fr';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { CoreModule } from './core/core.module';
import { SharedOptimizedModule } from './shared/shared-optimized.module';
import { LoadingSpinnerComponent } from './shared/components/loading-spinner/loading-spinner.component';
import { PwaUpdateNotificationComponent } from './shared/components/pwa-update-notification/pwa-update-notification.component';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { CredentialInterceptor } from './auth/interceptors/credential.interceptor';
import { CurrencyPipe, registerLocaleData } from '@angular/common';
import { ServiceWorkerModule } from '@angular/service-worker';

registerLocaleData(localeFr, 'fr-FR');

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    CoreModule,
    SharedOptimizedModule, // Module allégé pour le démarrage rapide
    LoadingSpinnerComponent,
    PwaUpdateNotificationComponent,
    ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: !isDevMode(),
      // Register the ServiceWorker as soon as the application is stable
      // or after 30 seconds (whichever comes first).
      registrationStrategy: 'registerWhenStable:30000'
    }),
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: CredentialInterceptor,
      multi: true
    },
    CurrencyPipe,
    { provide: LOCALE_ID, useValue: 'fr-FR' },
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }

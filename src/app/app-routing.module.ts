import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { guestGuard, lockScreenGuard, modernAuthGuard } from './core/auth/auth-guards.service';
import { SelectivePreloadingStrategy } from './core/selective-preloading-strategy.service';

const routes: Routes = [
  {
    path: '',
    redirectTo: '/web',
    pathMatch: 'full'
  },
  {
    path: 'lock-screen',
    loadChildren: () => import('./lock-screen/lock-screen.module').then(
      m => m.LockScreenModule
    ),
    canActivate: [lockScreenGuard]
  }, 
  {
    path: 'auth',
    loadChildren: () =>
      import('../app/auth/auth.module').then(
        (m) => m.AuthModule,
      ),
    // canActivate: [guestGuard]
  }, 
  {
    path: 'web',
    loadChildren: () =>
      import('../app/layouts/layouts.module').then(
        (m) => m.LayoutsModule
      ),
    canActivate: [modernAuthGuard]
  },
  {
    path: 'error-pages',
    loadChildren: () =>
      import('./error-pages/error-pages.module').then(
        (m) => m.ErrorPagesModule
      ),
  },

  { path: '**', redirectTo: 'auth', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {
    // Stratégie de preloading intelligente
    preloadingStrategy: SelectivePreloadingStrategy,
    // Optimisations pour les performances
    enableTracing: false,
    initialNavigation: 'enabledBlocking',
    // Optimisation pour les gros bundles
    onSameUrlNavigation: 'reload'
  })],
  exports: [RouterModule]
})
export class AppRoutingModule { }

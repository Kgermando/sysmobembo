import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LockScreenComponent } from './lock-screen.component';
import { lockScreenOnlineGuard } from './guard/online.guard';

const routes: Routes = [
  {
    path: '',
    component: LockScreenComponent,
    canActivate: [lockScreenOnlineGuard]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class LockScreenRoutingModule { }

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AuthRoutingModule } from './auth-routing.module';
import { LoginComponent } from './login/login.component';
import { AuthComponent } from './auth.component'; 
import { RegisterComponent } from './register/register.component';
import { SharedCoreModule } from '../shared/shared-core.module';
import { ResetPasswordComponent } from './reset-password/reset-password.component';
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component';


@NgModule({
  declarations: [
    LoginComponent,
    AuthComponent,
    RegisterComponent,
    ResetPasswordComponent,
    ForgotPasswordComponent,
  ],
  imports: [
    CommonModule,
    AuthRoutingModule, 
    SharedCoreModule, // Module allégé pour l'authentification
  ]
})
export class AuthModule { }

import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { routes } from '../../shared/routes/routes';
import { formatDate } from '@angular/common';

@Component({
  selector: 'app-forgot-password',
  standalone: false,
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss'
})
export class ForgotPasswordComponent implements OnInit {
  dateY = "";
  public routes = routes;
  isLoading = false;
  
  formGroup!: FormGroup;
  currentStep: 'email' | 'token' | 'password' = 'email';
  
  constructor(
    private router: Router,
    private _formBuilder: FormBuilder,
    private toastr: ToastrService
  ) {
    this.dateY = formatDate(new Date(), 'yyyy', 'en');
  }

  ngOnInit(): void {
    this.formGroup = this._formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      token: [''],
      newPassword: ['', [Validators.minLength(6)]],
      confirmPassword: ['']
    });
  }

  onSubmit() {
    if (this.currentStep === 'email') {
      this.sendResetEmail();
    } else if (this.currentStep === 'token') {
      this.verifyToken();
    } else if (this.currentStep === 'password') {
      this.resetPassword();
    }
  }

  private sendResetEmail() {
    if (this.formGroup.get('email')?.invalid) {
      this.toastr.error('Veuillez entrer une adresse email valide', 'Erreur');
      return;
    }

    this.isLoading = true;
    
    // Simulation d'envoi d'email
    setTimeout(() => {
      this.toastr.success('Un email de réinitialisation a été envoyé', 'Succès');
      this.currentStep = 'token';
      this.isLoading = false;
    }, 2000);
  }

  private verifyToken() {
    const token = this.formGroup.get('token')?.value;
    if (!token) {
      this.toastr.error('Veuillez saisir le code de vérification', 'Erreur');
      return;
    }

    this.isLoading = true;
    
    // Simulation de vérification
    setTimeout(() => {
      if (token === '123456') {
        this.toastr.success('Code vérifié avec succès', 'Succès');
        this.currentStep = 'password';
        this.formGroup.get('newPassword')?.setValidators([Validators.required, Validators.minLength(6)]);
        this.formGroup.get('confirmPassword')?.setValidators([Validators.required]);
        this.formGroup.get('newPassword')?.updateValueAndValidity();
        this.formGroup.get('confirmPassword')?.updateValueAndValidity();
      } else {
        this.toastr.error('Code de vérification invalide', 'Erreur');
      }
      this.isLoading = false;
    }, 1500);
  }

  private resetPassword() {
    const newPassword = this.formGroup.get('newPassword')?.value;
    const confirmPassword = this.formGroup.get('confirmPassword')?.value;

    if (!newPassword || !confirmPassword) {
      this.toastr.error('Veuillez remplir tous les champs', 'Erreur');
      return;
    }

    if (newPassword !== confirmPassword) {
      this.toastr.error('Les mots de passe ne correspondent pas', 'Erreur');
      return;
    }

    if (newPassword.length < 6) {
      this.toastr.error('Le mot de passe doit contenir au moins 6 caractères', 'Erreur');
      return;
    }

    this.isLoading = true;
    
    // Simulation de réinitialisation
    setTimeout(() => {
      this.toastr.success('Mot de passe réinitialisé avec succès', 'Succès');
      this.router.navigate(['/auth/login']);
    }, 2000);
  }

  goBack() {
    if (this.currentStep === 'token') {
      this.currentStep = 'email';
    } else if (this.currentStep === 'password') {
      this.currentStep = 'token';
    }
  }

  public password: boolean[] = [false, false];

  public togglePassword(index: number) {
    this.password[index] = !this.password[index];
  }
}

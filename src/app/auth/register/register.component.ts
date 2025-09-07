import { Component, OnInit } from '@angular/core';
import { routes } from '../../shared/routes/routes';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { ToastrService } from 'ngx-toastr';
import { formatDate } from '@angular/common';
 
@Component({
  selector: 'app-register',
  standalone: false,
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent implements OnInit {
  dateY = "";
  public routes = routes;
  isLoading = false;

  formGroup!: FormGroup;

  // Propriété pour l'authentification employé
  passwordFieldType = 'password';
  confirmPasswordFieldType = 'password';

  constructor(
    private router: Router,
    private _formBuilder: FormBuilder,
    private authService: AuthService,
    private toastr: ToastrService, 
  ) {
    this.dateY = formatDate(new Date(), 'yyyy', 'en');
  }

  ngOnInit(): void {
    this.formGroup = this._formBuilder.group({
      fullname: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      telephone: ['', [Validators.required, Validators.pattern(/^[0-9+\-\s]+$/)]],
      role: ['', Validators.required],
      permission: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(6)]],
      password_confirm: ['', [Validators.required, Validators.minLength(6)]],
      signature: ['']
    }, { validators: this.passwordMatchValidator });
  }

  /**
   * Validateur personnalisé pour vérifier que les mots de passe correspondent
   */
  passwordMatchValidator(formGroup: FormGroup) {
    const password = formGroup.get('password');
    const confirmPassword = formGroup.get('password_confirm');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    
    if (confirmPassword?.errors?.['passwordMismatch']) {
      delete confirmPassword.errors['passwordMismatch'];
      if (Object.keys(confirmPassword.errors).length === 0) {
        confirmPassword.setErrors(null);
      }
    }
    
    return null;
  }

  /**
   * Méthode pour basculer la visibilité du mot de passe
   */
  togglePasswordVisibility(field: 'password' | 'confirmPassword'): void {
    if (field === 'password') {
      this.passwordFieldType = this.passwordFieldType === 'password' ? 'text' : 'password';
    } else {
      this.confirmPasswordFieldType = this.confirmPasswordFieldType === 'password' ? 'text' : 'password';
    }
  }


  onSubmit() {
    try {
      if (this.formGroup.valid) {
        this.isLoading = true;
        
        // Créer l'objet utilisateur avec les données du formulaire
        const userData = {
          fullname: this.formGroup.value.fullname,
          email: this.formGroup.value.email,
          telephone: this.formGroup.value.telephone,
          role: this.formGroup.value.role,
          password: this.formGroup.value.password,
          password_confirm: this.formGroup.value.password_confirm,
          permission: this.formGroup.value.permission || 'read',
          status: false, // Désactivé par défaut, à activer par l'admin
          signature: this.formGroup.value.signature || ''
        };
        this.authService.register(userData).subscribe({
          next: () => {
            this.isLoading = false;
            this.formGroup.reset();
            this.toastr.success('Votre compte a été créé avec succès. Un administrateur doit l\'activer avant que vous puissiez vous connecter.', 'Inscription réussie!');
            this.router.navigate(['/auth/login']);
          },
          error: (err) => {
            this.isLoading = false;
            this.toastr.error(`${err.error.message}`, 'Erreur!');
            console.log(err);
          }
        });
      } else {
        this.toastr.warning('Veuillez remplir tous les champs requis correctement.', 'Formulaire invalide');
      }
    } catch (error) {
      this.isLoading = false;
      console.log(error);
    }
  }

  public password: boolean[] = [false];

  public togglePassword(index: any) {
    this.password[index] = !this.password[index]
  }

  // Getters pour faciliter l'accès aux contrôles du formulaire
  get nom() { return this.formGroup.get('nom'); }
  // Getters pour accéder facilement aux contrôles du formulaire
  get fullname() { return this.formGroup.get('fullname'); }
  get email() { return this.formGroup.get('email'); }
  get telephone() { return this.formGroup.get('telephone'); }
  get role() { return this.formGroup.get('role'); }
  get permission() { return this.formGroup.get('permission'); }
  get passwordControl() { return this.formGroup.get('password'); }
  get passwordConfirmation() { return this.formGroup.get('password_confirm'); }
  get signature() { return this.formGroup.get('signature'); }

}
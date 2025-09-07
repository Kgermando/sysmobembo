import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { IUser } from '../../models/user.model';
import { AuthStateService } from '../../../core/auth/auth-state.service';
import { ToastrService } from 'ngx-toastr';
import { Subject, takeUntil } from 'rxjs';

export interface UserProfileDialogData {
  user: IUser;
}

@Component({
  selector: 'app-user-profile-dialog',
  standalone: false,
  templateUrl: './user-profile-dialog.component.html',
  styleUrls: ['./user-profile-dialog.component.scss']
})
export class UserProfileDialogComponent implements OnInit, OnDestroy {
  activeTab = 'profile';
  changePasswordForm!: FormGroup;
  isLoading = false;
  passwordFieldTypes = {
    current: 'password',
    new: 'password',
    confirm: 'password'
  };

  private destroy$ = new Subject<void>();

  constructor(
    public dialogRef: MatDialogRef<UserProfileDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: UserProfileDialogData,
    private formBuilder: FormBuilder,
    private authStateService: AuthStateService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.initializePasswordForm();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializePasswordForm(): void {
    this.changePasswordForm = this.formBuilder.group({
      currentPassword: ['', [Validators.required, Validators.minLength(6)]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required, Validators.minLength(6)]]
    }, { validators: this.passwordMatchValidator });
  }

  private passwordMatchValidator(form: FormGroup) {
    const newPassword = form.get('newPassword');
    const confirmPassword = form.get('confirmPassword');
    
    if (newPassword && confirmPassword && newPassword.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    
    return null;
  }

  togglePasswordVisibility(field: keyof typeof this.passwordFieldTypes): void {
    this.passwordFieldTypes[field] = 
      this.passwordFieldTypes[field] === 'password' ? 'text' : 'password';
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
    if (tab === 'password') {
      this.changePasswordForm.reset();
    }
  }

  onChangePassword(): void {
    if (this.changePasswordForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.isLoading = true;
    const formData = this.changePasswordForm.value;

    const passwordData = {
      currentPassword: formData.currentPassword,
      newPassword: formData.newPassword,
      confirmPassword: formData.confirmPassword
    };

    this.authStateService.updatePassword(passwordData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.toastr.success('Mot de passe modifié avec succès', 'Succès');
          this.changePasswordForm.reset();
          this.setActiveTab('profile');
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Erreur lors du changement de mot de passe:', error);
          this.toastr.error(
            error?.message || 'Erreur lors du changement de mot de passe', 
            'Erreur'
          );
          this.isLoading = false;
        }
      });
  }

  private markFormGroupTouched(): void {
    Object.keys(this.changePasswordForm.controls).forEach(key => {
      const control = this.changePasswordForm.get(key);
      control?.markAsTouched();
    });
  }

  onClose(): void {
    this.dialogRef.close();
  }

  getUserInitials(): string {
    if (!this.data.user) return 'U';
    
    // Si initials est déjà défini, l'utiliser
    if (this.data.user.initials) {
      return this.data.user.initials.toUpperCase();
    }
    
    // Sinon, extraire les initiales du fullname
    const fullName = this.data.user.fullname || '';
    const nameParts = fullName.trim().split(' ');
    
    if (nameParts.length >= 2) {
      const firstName = nameParts[0].charAt(0) || '';
      const lastName = nameParts[nameParts.length - 1].charAt(0) || '';
      return (firstName + lastName).toUpperCase() || 'U';
    } else if (nameParts.length === 1) {
      return nameParts[0].charAt(0).toUpperCase() || 'U';
    }
    
    return 'U';
  }

  getFullName(): string {
    if (!this.data.user) return 'Utilisateur';
    
    return this.data.user.fullname?.trim() || 'Utilisateur';
  }

  formatDate(dateString?: string): string {
    if (!dateString) return 'Non défini';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR');
    } catch {
      return 'Date invalide';
    }
  }

  formatCurrency(amount?: number, currency?: string): string {
    if (!amount && amount !== 0) return 'Non défini';
    
    const currencySymbol = currency === 'USD' ? '$' : 'CDF';
    const formattedAmount = amount.toLocaleString('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });
    
    return `${formattedAmount} ${currencySymbol}`;
  }

  // Getters pour faciliter l'accès aux contrôles du formulaire
  get currentPassword() { return this.changePasswordForm.get('currentPassword'); }
  get newPassword() { return this.changePasswordForm.get('newPassword'); }
  get confirmPassword() { return this.changePasswordForm.get('confirmPassword'); }
}

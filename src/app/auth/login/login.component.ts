import { Component, OnInit, OnDestroy } from '@angular/core';
import { routes } from '../../shared/routes/routes';
import { Router, ActivatedRoute } from '@angular/router';
import { formatDate } from '@angular/common'; 
import { AuthStateService } from '../../core/auth/auth-state.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { Subject, takeUntil, finalize } from 'rxjs';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit, OnDestroy {
  dateY = "";
  public routes = routes;
  isLoading = false;
  form!: FormGroup;
  returnUrl: string = '/web/appartments/appartments-list';
  
  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private formBuilder: FormBuilder,
    private authState: AuthStateService,
    private toastr: ToastrService
  ) {
    this.dateY = formatDate(new Date(), 'yyyy', 'en');
  }

  ngOnInit(): void {
    // Récupérer l'URL de retour depuis les query params
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/web/appartments/appartments-list';
    
    this.form = this.formBuilder.group({
      identifier: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(4)]]
    });

    // S'abonner à l'état de chargement
    this.authState.isLoading$
      .pipe(takeUntil(this.destroy$))
      .subscribe(loading => {
        this.isLoading = loading;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSubmit(): void {
    if (this.form.valid) {
      const credentials = {
        identifier: this.form.value.identifier.toLowerCase(),
        password: this.form.value.password
      };

      this.authState.login(credentials)
        .pipe(
          finalize(() => this.isLoading = false),
          takeUntil(this.destroy$)
        )
        .subscribe({
          next: (success) => {
            if (success) {
              // Récupérer les données utilisateur après une connexion réussie
              this.authState.fetchUserData()
                .pipe(takeUntil(this.destroy$))
                .subscribe({
                  next: (user) => {
                    this.toastr.success(`Bienvenue ${user.fullname}! 🎉`, 'Connexion réussie!');
                    this.router.navigate(['/web']); 
                  },
                  error: (error) => {
                    console.error('Erreur lors de la récupération des données utilisateur:', error);
                    this.toastr.error('Erreur lors de la récupération des données utilisateur', 'Erreur!');
                  }
                });
            }
          },
          error: (error) => {
            console.error('Erreur de connexion:', error);
            this.toastr.error(error.message || 'Erreur de connexion', 'Connexion échouée!');
          }
        });
    } else {
      this.markFormGroupTouched();
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.form.controls).forEach(key => {
      const control = this.form.get(key);
      control?.markAsTouched();
    });
  }

  private navigate() {
    this.router.navigate([this.returnUrl]);
  }

  public password: boolean[] = [false];

  public togglePassword(index: any) {
    this.password[index] = !this.password[index];
  }
  // Getters pour les validations du formulaire
  get identifier() { return this.form.get('identifier'); }
  get passwordField() { return this.form.get('password'); }
}

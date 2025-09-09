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

  // Options pour les formulaires déroulants
  roles = [
    { value: 'Agent', label: 'Agent' },
    { value: 'Supervisor', label: 'Superviseur' },
    { value: 'Manager', label: 'Manager' },
    { value: 'Administrator', label: 'Administrateur' }
  ];

  permissions = [
    { value: 'R', label: 'Lecture seule' },
    { value: 'CR', label: 'Créer, Lire' },
    { value: 'CRU', label: 'Créer, Lire, Modifier' },
    { value: 'CRUD', label: 'Créer, Lire, Modifier, Supprimer' },
    { value: 'ALL', label: 'Toutes les permissions' }
  ];

  typeAgents = [
    { value: 'Fonctionnaire', label: 'Fonctionnaire' },
    { value: 'Contractuel', label: 'Contractuel' },
    { value: 'Stagiaire', label: 'Stagiaire' }
  ];

  statuts = [
    { value: 'Actif', label: 'Actif' },
    { value: 'Retraité', label: 'Retraité' },
    { value: 'Suspendu', label: 'Suspendu' },
    { value: 'Révoqué', label: 'Révoqué' }
  ];

  etats_civils = [
    { value: 'Célibataire', label: 'Célibataire' },
    { value: 'Marié(e)', label: 'Marié(e)' },
    { value: 'Divorcé(e)', label: 'Divorcé(e)' },
    { value: 'Veuf(ve)', label: 'Veuf(ve)' }
  ];

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
      // Informations personnelles de base
      nom: ['', [Validators.required, Validators.minLength(2)]],
      postnom: ['', [Validators.required, Validators.minLength(2)]],
      prenom: ['', [Validators.required, Validators.minLength(2)]],
      sexe: [''],
      date_naissance: [''],
      lieu_naissance: [''],
      etat_civil: [''],
      nombre_enfants: [0],

      // Nationalité
      nationalite: [''],
      numero_cni: [''],

      // Contacts
      email: ['', [Validators.required, Validators.email]],
      telephone: ['', [Validators.required, Validators.pattern(/^[0-9+\-\s]+$/)]],
      telephone_urgence: [''],

      // Adresse
      province: [''],
      ville: [''],
      commune: [''],
      quartier: [''],
      avenue: [''],
      numero: [''],

      // Informations professionnelles
      matricule: ['', Validators.required],
      grade: [''],
      fonction: ['', Validators.required],
      service: [''],
      direction: [''],
      ministere: [''],
      date_recrutement: [''],
      date_prise_service: [''],
      type_agent: [''],
      statut: [''],

      // Formation
      niveau_etude: [''],
      diplome_base: [''],
      universite_ecole: [''],
      annee_obtention: [''],
      specialisation: [''],

      // Bancaire
      numero_bancaire: [''],
      banque: [''],

      // Sécurité sociale
      numero_cnss: [''],
      numero_onem: [''],

      // Documents
      photo_profil: [''],
      cv_document: [''],

      // Système
      role: ['', Validators.required],
      permission: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(6)]],
      password_confirm: ['', [Validators.required, Validators.minLength(6)]],

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
        
        // Utiliser directement les données du formulaire
        const formData = this.formGroup.value;
        
        // Convertir les champs de date en format ISO string
        const userData = {
          ...formData,
          date_naissance: formData.date_naissance ? new Date(formData.date_naissance).toISOString() : '',
          date_recrutement: formData.date_recrutement ? new Date(formData.date_recrutement).toISOString() : '',
          date_prise_service: formData.date_prise_service ? new Date(formData.date_prise_service).toISOString() : '',
          status: true, // Désactivé par défaut, à activer par l'admin
          permission: formData.permission || 'R' // Permission par défaut
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
  // Informations personnelles
  get nom() { return this.formGroup.get('nom'); }
  get postnom() { return this.formGroup.get('postnom'); }
  get prenom() { return this.formGroup.get('prenom'); }
  get sexe() { return this.formGroup.get('sexe'); }
  get date_naissance() { return this.formGroup.get('date_naissance'); }
  get lieu_naissance() { return this.formGroup.get('lieu_naissance'); }
  get etat_civil() { return this.formGroup.get('etat_civil'); }
  get nombre_enfants() { return this.formGroup.get('nombre_enfants'); }

  // Nationalité
  get nationalite() { return this.formGroup.get('nationalite'); }
  get numero_cni() { return this.formGroup.get('numero_cni'); }
  
  // Contacts
  get email() { return this.formGroup.get('email'); }
  get telephone() { return this.formGroup.get('telephone'); }
  get telephone_urgence() { return this.formGroup.get('telephone_urgence'); }

  // Adresse
  get province() { return this.formGroup.get('province'); }
  get ville() { return this.formGroup.get('ville'); }
  get commune() { return this.formGroup.get('commune'); }
  get quartier() { return this.formGroup.get('quartier'); }
  get avenue() { return this.formGroup.get('avenue'); }
  get numero() { return this.formGroup.get('numero'); }
  
  // Professionnel
  get matricule() { return this.formGroup.get('matricule'); }
  get grade() { return this.formGroup.get('grade'); }
  get fonction() { return this.formGroup.get('fonction'); }
  get service() { return this.formGroup.get('service'); }
  get direction() { return this.formGroup.get('direction'); }
  get ministere() { return this.formGroup.get('ministere'); }
  get date_recrutement() { return this.formGroup.get('date_recrutement'); }
  get date_prise_service() { return this.formGroup.get('date_prise_service'); }
  get type_agent() { return this.formGroup.get('type_agent'); }
  get statut() { return this.formGroup.get('statut'); }

  // Formation
  get niveau_etude() { return this.formGroup.get('niveau_etude'); }
  get diplome_base() { return this.formGroup.get('diplome_base'); }
  get universite_ecole() { return this.formGroup.get('universite_ecole'); }
  get annee_obtention() { return this.formGroup.get('annee_obtention'); }
  get specialisation() { return this.formGroup.get('specialisation'); }

  // Bancaire
  get numero_bancaire() { return this.formGroup.get('numero_bancaire'); }
  get banque() { return this.formGroup.get('banque'); }

  // Sécurité sociale
  get numero_cnss() { return this.formGroup.get('numero_cnss'); }
  get numero_onem() { return this.formGroup.get('numero_onem'); }

  // Documents
  get photo_profil() { return this.formGroup.get('photo_profil'); }
  get cv_document() { return this.formGroup.get('cv_document'); }
  
  // Système
  get role() { return this.formGroup.get('role'); }
  get permission() { return this.formGroup.get('permission'); }
  get passwordControl() { return this.formGroup.get('password'); }
  get passwordConfirmation() { return this.formGroup.get('password_confirm'); }
  get signature() { return this.formGroup.get('signature'); }

}
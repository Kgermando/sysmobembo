import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { Sort } from '@angular/material/sort';
import { PageEvent } from '@angular/material/paginator';
import { Subject, firstValueFrom, takeUntil } from 'rxjs';
import { IUser } from '../../shared/models/user.model';
import { UserService, UserFormData } from '../../core/user/user.service';
import { AuthStateService } from '../../core/auth/auth-state.service';
import { DateUtils } from '../../shared/utils/date.utils';

@Component({
  selector: 'app-users',
  standalone: false,
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss'
})
export class UsersComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Angular Material Table
  dataSource = new MatTableDataSource<IUser>();
  displayedColumns: string[] = [
    'photo_profil', 'nom', 'postnom', 'prenom', 'email', 'telephone', 
    'matricule', 'grade', 'fonction', 'role', 'permission', 'status', 'actions'
  ];

  // Data
  users: IUser[] = [];
  dataList: IUser[] = [];
  currentUser: IUser | null = null;

  // Form
  userForm: FormGroup;
  editingUser: IUser | null = null;
  viewingUser: IUser | null = null;

  // States
  isLoading = false;
  isLoadingData = false;
  isSaving = false;
  error: string | null = null;

  // Pagination
  total_records = 0;
  page_size = 15;
  current_page = 1;
  currentPage = 1;
  pageSize = 15;

  // Filters
  searchTerm = '';
  selectedRole = '';
  selectedStatus = '';
  selectedPermission = '';

  // Options typées selon l'interface IUser
  roles: Array<{ value: 'Agent' | 'Manager' | 'Supervisor' | 'Administrator'; label: string }> = [
    { value: 'Administrator', label: 'Administrateur' },
    { value: 'Supervisor', label: 'Superviseur' },
    { value: 'Manager', label: 'Manager' },
    { value: 'Agent', label: 'Agent' }
  ];

  // Types d'agents
  typeAgents: Array<{ value: 'Fonctionnaire' | 'Contractuel' | 'Stagiaire'; label: string }> = [
    { value: 'Fonctionnaire', label: 'Fonctionnaire' },
    { value: 'Contractuel', label: 'Contractuel' },
    { value: 'Stagiaire', label: 'Stagiaire' }
  ];

  // Statuts professionnels
  statuts: Array<{ value: 'Actif' | 'Retraité' | 'Suspendu' | 'Révoqué'; label: string }> = [
    { value: 'Actif', label: 'Actif' },
    { value: 'Retraité', label: 'Retraité' },
    { value: 'Suspendu', label: 'Suspendu' },
    { value: 'Révoqué', label: 'Révoqué' }
  ];

  // États civils
  etatsCivils: Array<{ value: 'Célibataire' | 'Marié(e)' | 'Divorcé(e)' | 'Veuf(ve)'; label: string }> = [
    { value: 'Célibataire', label: 'Célibataire' },
    { value: 'Marié(e)', label: 'Marié(e)' },
    { value: 'Divorcé(e)', label: 'Divorcé(e)' },
    { value: 'Veuf(ve)', label: 'Veuf(ve)' }
  ];

  // Niveaux d'étude
  niveauxEtude: Array<{ value: 'Primaire' | 'Secondaire' | 'Universitaire' | 'Post-universitaire'; label: string }> = [
    { value: 'Primaire', label: 'Primaire' },
    { value: 'Secondaire', label: 'Secondaire' },
    { value: 'Universitaire', label: 'Universitaire' },
    { value: 'Post-universitaire', label: 'Post-universitaire' }
  ];

  // Sexes
  sexes: Array<{ value: 'M' | 'F'; label: string }> = [
    { value: 'M', label: 'Masculin' },
    { value: 'F', label: 'Féminin' }
  ];

  // Permissions disponibles (selon le modèle backend)
  permissions: Array<{ value: 'ALL' | 'VAE' | 'VED' | 'VE' | 'VA' | 'V'; label: string }> = [
    { value: 'ALL', label: 'Toutes les permissions (Voir, Ajouter, Modifier, Supprimer)' },
    { value: 'VAE', label: 'Voir, Ajouter, Modifier' },
    { value: 'VED', label: 'Voir, Modifier, Supprimer' },
    { value: 'VE', label: 'Voir, Modifier' },
    { value: 'VA', label: 'Voir, Ajouter' },
    { value: 'V', label: 'Lecture seule' }
  ]; 

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private authStateService: AuthStateService
  ) {
    this.userForm = this.createForm();
  }

  ngOnInit(): void {
    this.authStateService.user$.subscribe({
      next: (user) => {
        this.currentUser = user;
        this.loadUsers();
      },
      error: (error) => {
        console.error('Erreur lors de la récupération de l\'utilisateur:', error);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Méthodes utilitaires pour l'affichage
  getFullName(user: IUser): string {
    return `${user.nom} ${user.postnom} ${user.prenom}`.trim();
  }

  getInitials(user: IUser): string {
    const fullName = this.getFullName(user);
    const names = fullName.split(' ');
    if (names.length >= 2) {
      return `${names[0].charAt(0)}${names[names.length - 1].charAt(0)}`.toUpperCase();
    }
    return fullName.charAt(0).toUpperCase();
  }

  // Calcul de l'âge
  getAge(dateNaissance: Date | string | undefined): number {
    return DateUtils.calculateAge(dateNaissance);
  }

  // Calcul de l'ancienneté de service
  getAnciennete(dateRecrutement: Date | string | undefined): string {
    return DateUtils.calculateSeniority(dateRecrutement);
  }

  // Formater la date pour l'affichage
  formatDate(date: Date | string | undefined): string {
    return DateUtils.toDisplayFormat(date);
  }

  // Vérifier si le CNI expire bientôt (dans 30 jours)
  isCNIExpiringSoon(dateExpiration: Date | string | undefined): boolean {
    if (!dateExpiration) return false;
    const expirationDate = DateUtils.toDate(dateExpiration);
    if (!expirationDate) return false;
    
    const today = new Date();
    const diffTime = expirationDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 30 && diffDays >= 0;
  }

  // Validateurs personnalisés pour l'interface IUser
  private sexeValidator(control: AbstractControl): ValidationErrors | null {
    const validSexes = ['M', 'F'];
    if (control.value && !validSexes.includes(control.value)) {
      return { invalidSexe: true };
    }
    return null;
  }

  private etatCivilValidator(control: AbstractControl): ValidationErrors | null {
    const validEtats = ['Célibataire', 'Marié(e)', 'Divorcé(e)', 'Veuf(ve)'];
    if (control.value && !validEtats.includes(control.value)) {
      return { invalidEtatCivil: true };
    }
    return null;
  }

  private typeAgentValidator(control: AbstractControl): ValidationErrors | null {
    const validTypes = ['Fonctionnaire', 'Contractuel', 'Stagiaire'];
    if (control.value && !validTypes.includes(control.value)) {
      return { invalidTypeAgent: true };
    }
    return null;
  }

  private statutValidator(control: AbstractControl): ValidationErrors | null {
    const validStatuts = ['Actif', 'Retraité', 'Suspendu', 'Révoqué'];
    if (control.value && !validStatuts.includes(control.value)) {
      return { invalidStatut: true };
    }
    return null;
  }

  private roleValidator(control: AbstractControl): ValidationErrors | null {
    const validRoles = ['Agent', 'Manager', 'Supervisor', 'Administrator'];
    if (control.value && !validRoles.includes(control.value)) {
      return { invalidRole: true };
    }
    return null;
  }

  private permissionValidator(control: AbstractControl): ValidationErrors | null {
    const validPermissions = ['ALL', 'VAE', 'VED', 'VE', 'VA', 'V'];
    if (control.value && !validPermissions.includes(control.value)) {
      return { invalidPermission: true };
    }
    return null;
  }

  private niveauEtudeValidator(control: AbstractControl): ValidationErrors | null {
    const validNiveaux = ['Primaire', 'Secondaire', 'Universitaire', 'Post-universitaire'];
    if (control.value && !validNiveaux.includes(control.value)) {
      return { invalidNiveauEtude: true };
    }
    return null;
  }

  private createForm(): FormGroup {
    return this.fb.group({
      // Informations personnelles de base (requis selon IUser)
      nom: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      postnom: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      prenom: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      sexe: ['', [Validators.required, this.sexeValidator]],
      date_naissance: ['', [Validators.required]],
      lieu_naissance: ['', [Validators.required, Validators.maxLength(100)]],

      // État civil (optionnels selon IUser)
      etat_civil: ['', [this.etatCivilValidator]],
      nombre_enfants: [null, [Validators.min(0), Validators.max(20)]],

      // Nationalité et documents d'identité (nationalite requis, autres optionnels)
      nationalite: ['', [Validators.required, Validators.maxLength(50)]],
      numero_cni: ['', [Validators.pattern('^[0-9A-Z]{10,20}$')]],
      date_emission_cni: [''],
      date_expiration_cni: [''],
      lieu_emission_cni: ['', [Validators.maxLength(100)]],

      // Contacts (requis selon IUser)
      email: ['', [Validators.required, Validators.email, Validators.maxLength(100)]],
      telephone: ['', [Validators.required, Validators.pattern('^[+]?[0-9]{8,15}$')]],
      telephone_urgence: ['', [Validators.pattern('^[+]?[0-9]{8,15}$')]],

      // Adresse (requis selon IUser)
      province: ['', [Validators.required, Validators.maxLength(50)]],
      ville: ['', [Validators.required, Validators.maxLength(50)]],
      commune: ['', [Validators.required, Validators.maxLength(50)]],
      quartier: ['', [Validators.required, Validators.maxLength(50)]],
      avenue: ['', [Validators.maxLength(100)]],
      numero: ['', [Validators.maxLength(20)]],

      // Informations professionnelles (tous requis selon IUser)
      matricule: ['', [Validators.required, Validators.pattern('^[A-Z0-9]{5,15}$')]],
      grade: ['', [Validators.required, Validators.maxLength(50)]],
      fonction: ['', [Validators.required, Validators.maxLength(100)]],
      service: ['', [Validators.required, Validators.maxLength(100)]],
      direction: ['', [Validators.required, Validators.maxLength(100)]],
      ministere: ['', [Validators.required, Validators.maxLength(100)]],
      date_recrutement: ['', [Validators.required]],
      date_prise_service: ['', [Validators.required]],
      type_agent: ['', [Validators.required, this.typeAgentValidator]],
      statut: ['', [Validators.required, this.statutValidator]],

      // Formation et éducation (tous optionnels selon IUser)
      niveau_etude: ['', [this.niveauEtudeValidator]],
      diplome_base: ['', [Validators.maxLength(100)]],
      universite_ecole: ['', [Validators.maxLength(100)]],
      annee_obtention: [null, [Validators.min(1950), Validators.max(new Date().getFullYear())]],
      specialisation: ['', [Validators.maxLength(100)]],

      // Informations bancaires (optionnels selon IUser)
      numero_bancaire: ['', [Validators.pattern('^[0-9]{10,20}$')]],
      banque: ['', [Validators.maxLength(50)]],

      // Informations de sécurité sociale (optionnels selon IUser)
      numero_cnss: ['', [Validators.pattern('^[0-9]{10,15}$')]],
      numero_onem: ['', [Validators.pattern('^[0-9]{10,15}$')]],

      // Documents et photos (optionnels selon IUser)
      photo_profil: [''],
      cv_document: [''],

      // Informations système (role et permission requis, status par défaut true)
      role: ['Agent', [Validators.required, this.roleValidator]],
      permission: ['V', [Validators.required, this.permissionValidator]],
      status: [true],
      signature: [''],
      password: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(100)]],
      password_confirm: ['', [Validators.required]]
    }, {
      validators: [this.passwordMatchValidator, this.dateValidator]
    });
  }

  // Validator pour vérifier que les mots de passe correspondent
  private passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('password_confirm');

    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    return null;
  }

  // Validator pour vérifier la cohérence des dates
  private dateValidator(form: FormGroup) {
    const dateNaissance = form.get('date_naissance');
    const dateRecrutement = form.get('date_recrutement');
    const datePriseService = form.get('date_prise_service');
    const dateEmissionCNI = form.get('date_emission_cni');
    const dateExpirationCNI = form.get('date_expiration_cni');

    const errors: any = {};
    const today = new Date();

    // Vérifier que la date de naissance n'est pas dans le futur
    if (dateNaissance?.value) {
      const birthDate = DateUtils.toDate(dateNaissance.value);
      if (birthDate && birthDate > today) {
        errors.dateNaissanceFuture = true;
      }
    }

    // Vérifier que la date de recrutement n'est pas avant la majorité (18 ans)
    if (dateNaissance?.value && dateRecrutement?.value) {
      const birthDate = DateUtils.toDate(dateNaissance.value);
      const recruitDate = DateUtils.toDate(dateRecrutement.value);
      if (birthDate && recruitDate) {
        const age = recruitDate.getFullYear() - birthDate.getFullYear();
        if (age < 18) {
          errors.recrutementTropJeune = true;
        }
      }
    }

    // Vérifier que la date de prise de service n'est pas avant le recrutement
    if (dateRecrutement?.value && datePriseService?.value) {
      const recruitDate = DateUtils.toDate(dateRecrutement.value);
      const serviceDate = DateUtils.toDate(datePriseService.value);
      if (recruitDate && serviceDate && serviceDate < recruitDate) {
        errors.priseServiceAvantRecrutement = true;
      }
    }

    // Vérifier que la date d'expiration CNI est après l'émission
    if (dateEmissionCNI?.value && dateExpirationCNI?.value) {
      const emissionDate = DateUtils.toDate(dateEmissionCNI.value);
      const expirationDate = DateUtils.toDate(dateExpirationCNI.value);
      if (emissionDate && expirationDate && expirationDate <= emissionDate) {
        errors.cniExpirationInvalide = true;
      }
    }

    return Object.keys(errors).length > 0 ? errors : null;
  }

  async loadUsers(): Promise<void> {
    try {
      this.isLoading = true;
      this.isLoadingData = true;
      this.error = null;

      let response;

      // Chargement selon le rôle de l'utilisateur
      response = await firstValueFrom(
        this.userService.getPaginatedUsers(
          this.current_page,
          this.page_size,
          this.searchTerm
        )
      );

      this.users = response.data || [];
      this.dataList = this.users;
      this.dataSource.data = this.users;

      if (response.pagination) {
        this.total_records = response.pagination.total_records || 0;
        this.current_page = response.pagination.current_page || 1;
        this.page_size = response.pagination.page_size || 15;
      }

    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
      this.error = 'Erreur lors du chargement des utilisateurs';
    } finally {
      this.isLoading = false;
      this.isLoadingData = false;
    }
  }

  onSearchChange(searchValue: string): void {
    this.searchTerm = searchValue;
    this.current_page = 1;
    this.loadUsers();
  }

  onPageChange(event: PageEvent): void {
    this.page_size = event.pageSize;
    this.current_page = event.pageIndex + 1;
    this.loadUsers();
  }

  sortData(sort: Sort): void {
    // TODO: Implémenter le tri
    console.log('Sort:', sort);
  }

  refresh(): void {
    this.loadUsers();
  }

  search(): void {
    this.current_page = 1;
    this.loadUsers();
  }

  applyFilters(): void {
    this.current_page = 1;
    this.loadUsers();
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.selectedRole = '';
    this.selectedStatus = '';
    this.selectedPermission = '';
    this.current_page = 1;
    this.loadUsers();
  }

  // CSS Classes Methods
  getStatusBadgeClass(status: boolean): string {
    return status ? 'badge bg-success' : 'badge bg-danger';
  }

  getRoleBadgeClass(role: string): string {
    switch (role) {
      case 'Administrator': return 'badge bg-danger';
      case 'Supervisor': return 'badge bg-primary';
      case 'Manager': return 'badge bg-warning';
      case 'Agent': return 'badge bg-info';
      default: return 'badge bg-secondary';
    }
  }

  getStatutBadgeClass(statut: string): string {
    switch (statut) {
      case 'Actif': return 'badge bg-success';
      case 'Retraité': return 'badge bg-secondary';
      case 'Suspendu': return 'badge bg-warning';
      case 'Révoqué': return 'badge bg-danger';
      default: return 'badge bg-light';
    }
  }

  getTypeAgentBadgeClass(typeAgent: string): string {
    switch (typeAgent) {
      case 'Fonctionnaire': return 'badge bg-primary';
      case 'Contractuel': return 'badge bg-info';
      case 'Stagiaire': return 'badge bg-warning';
      default: return 'badge bg-secondary';
    }
  }

  getPermissionBadgeClass(permission: string): string {
    switch (permission) {
      case 'ALL': return 'badge bg-danger';
      case 'CRUD': return 'badge bg-warning';
      case 'CRU': return 'badge bg-info';
      case 'CR': return 'badge bg-primary';
      case 'R': return 'badge bg-secondary';
      default: return 'badge bg-light';
    }
  }

  viewUser(user: IUser): void {
    this.viewingUser = user;
    this.openViewOffcanvas();
  }

  editUser(user: IUser): void {
    this.editingUser = user;
    this.userForm.patchValue({
      // Informations personnelles de base (requis selon IUser)
      nom: user.nom,
      postnom: user.postnom,
      prenom: user.prenom,
      sexe: user.sexe,
      date_naissance: user.date_naissance,
      lieu_naissance: user.lieu_naissance,
      
      // État civil (optionnels selon IUser)
      etat_civil: user.etat_civil,
      nombre_enfants: user.nombre_enfants,
      
      // Nationalité et documents d'identité (nationalite requis, autres optionnels)
      nationalite: user.nationalite,
      numero_cni: user.numero_cni,
      date_emission_cni: user.date_emission_cni,
      date_expiration_cni: user.date_expiration_cni,
      lieu_emission_cni: user.lieu_emission_cni,

      // Contacts (requis selon IUser)
      email: user.email,
      telephone: user.telephone,
      telephone_urgence: user.telephone_urgence,
      
      // Adresse (requis selon IUser)
      province: user.province,
      ville: user.ville,
      commune: user.commune,
      quartier: user.quartier,
      avenue: user.avenue,
      numero: user.numero,

      // Informations professionnelles (tous requis selon IUser)
      matricule: user.matricule,
      grade: user.grade,
      fonction: user.fonction,
      service: user.service,
      direction: user.direction,
      ministere: user.ministere,
      date_recrutement: user.date_recrutement,
      date_prise_service: user.date_prise_service,
      type_agent: user.type_agent,
      statut: user.statut,

      // Formation et éducation (optionnels selon IUser)
      niveau_etude: user.niveau_etude,
      diplome_base: user.diplome_base,
      universite_ecole: user.universite_ecole,
      annee_obtention: user.annee_obtention,
      specialisation: user.specialisation,

      // Informations bancaires (optionnels selon IUser)
      numero_bancaire: user.numero_bancaire,
      banque: user.banque,

      // Informations de sécurité sociale (optionnels selon IUser)
      numero_cnss: user.numero_cnss,
      numero_onem: user.numero_onem,

      // Documents et photos (optionnels selon IUser)
      photo_profil: user.photo_profil,
      cv_document: user.cv_document,

      // Informations système (role et permission requis, status par défaut selon IUser)
      role: user.role,
      permission: user.permission,
      status: user.status,
      signature: user.signature || ''
    });

    // Retirer les validateurs de mot de passe pour l'édition
    this.userForm.get('password')?.clearValidators();
    this.userForm.get('password_confirm')?.clearValidators();
    this.userForm.get('password')?.updateValueAndValidity();
    this.userForm.get('password_confirm')?.updateValueAndValidity();
    
    // Ouvrir l'offcanvas d'édition
    this.openEditOffcanvas();
  }

  async deleteUser(user: IUser): Promise<void> {
    if (confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur "${this.getFullName(user)}" ?`)) {
      try {
        this.isLoading = true;
        await firstValueFrom(this.userService.deleteUser(user.uuid));
        await this.loadUsers();
        alert('Utilisateur supprimé avec succès');
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        alert('Erreur lors de la suppression de l\'utilisateur');
      } finally {
        this.isLoading = false;
      }
    }
  }

  async saveUser(): Promise<void> {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    try {
      this.isSaving = true;
      
      // Assurer que les données correspondent exactement à UserFormData et IUser
      const formValue = this.userForm.value;
      const userData: UserFormData = {
        // Informations personnelles de base (requis selon IUser)
        nom: formValue.nom,
        postnom: formValue.postnom,
        prenom: formValue.prenom,
        sexe: formValue.sexe,
        date_naissance: formValue.date_naissance ? DateUtils.toDate(formValue.date_naissance)?.toISOString() || '' : '',
        lieu_naissance: formValue.lieu_naissance,

        // État civil (optionnels selon IUser)
        etat_civil: formValue.etat_civil || undefined,
        nombre_enfants: formValue.nombre_enfants || undefined,

        // Nationalité et documents d'identité (nationalite requis, autres optionnels)
        nationalite: formValue.nationalite,
        numero_cni: formValue.numero_cni || undefined,
        date_emission_cni: formValue.date_emission_cni ? DateUtils.toDate(formValue.date_emission_cni)?.toISOString() || undefined : undefined,
        date_expiration_cni: formValue.date_expiration_cni ? DateUtils.toDate(formValue.date_expiration_cni)?.toISOString() || undefined : undefined,
        lieu_emission_cni: formValue.lieu_emission_cni || undefined,

        // Contacts (requis selon IUser)
        email: formValue.email,
        telephone: formValue.telephone,
        telephone_urgence: formValue.telephone_urgence || undefined,

        // Adresse (requis selon IUser)
        province: formValue.province,
        ville: formValue.ville,
        commune: formValue.commune,
        quartier: formValue.quartier,
        avenue: formValue.avenue || undefined,
        numero: formValue.numero || undefined,

        // Informations professionnelles (tous requis selon IUser)
        matricule: formValue.matricule,
        grade: formValue.grade,
        fonction: formValue.fonction,
        service: formValue.service,
        direction: formValue.direction,
        ministere: formValue.ministere,
        date_recrutement: formValue.date_recrutement ? DateUtils.toDate(formValue.date_recrutement)?.toISOString() || '' : '',
        date_prise_service: formValue.date_prise_service ? DateUtils.toDate(formValue.date_prise_service)?.toISOString() || '' : '',
        type_agent: formValue.type_agent,
        statut: formValue.statut,

        // Formation et éducation (optionnels selon IUser)
        niveau_etude: formValue.niveau_etude || undefined,
        diplome_base: formValue.diplome_base || undefined,
        universite_ecole: formValue.universite_ecole || undefined,
        annee_obtention: formValue.annee_obtention || undefined,
        specialisation: formValue.specialisation || undefined,

        // Informations bancaires (optionnels selon IUser)
        numero_bancaire: formValue.numero_bancaire || undefined,
        banque: formValue.banque || undefined,

        // Informations de sécurité sociale (optionnels selon IUser)
        numero_cnss: formValue.numero_cnss || undefined,
        numero_onem: formValue.numero_onem || undefined,

        // Documents et photos (optionnels selon IUser)
        photo_profil: formValue.photo_profil || undefined,
        cv_document: formValue.cv_document || undefined,

        // Informations système (role et permission requis, status par défaut selon IUser)
        role: formValue.role,
        permission: formValue.permission,
        status: formValue.status !== undefined ? formValue.status : true,
        signature: formValue.signature || this.getFullName(this.currentUser!) || undefined,
        password: formValue.password || undefined,
        password_confirm: formValue.password_confirm || undefined
      };

      if (this.editingUser) {
        // Mise à jour - on retire les champs de mot de passe
        const { password, password_confirm, ...updateData } = userData;
        await firstValueFrom(
          this.userService.updateUser(this.editingUser.uuid, updateData)
        );
        alert('Utilisateur modifié avec succès');
        this.closeEditOffcanvas();
      } else {
        // Création
        await firstValueFrom(
          this.userService.createUser(userData)
        );
        alert('Utilisateur créé avec succès');
        this.closeAddOffcanvas();
      }

      await this.loadUsers();
      this.resetForm();

    } catch (error: any) {
      console.error('Erreur lors de la sauvegarde:', error);
      const errorMessage = error.error?.message || 'Erreur lors de la sauvegarde de l\'utilisateur';
      alert(errorMessage);
    } finally {
      this.isSaving = false;
    }
  }

  // Préparer un nouvel utilisateur
  prepareNewUser(): void {
    this.editingUser = null;
    this.resetForm();
  }

  private resetForm(): void {
    this.userForm.reset({
      // Informations personnelles de base (requis selon IUser)
      nom: '',
      postnom: '',
      prenom: '',
      sexe: '', // Laisser vide pour forcer l'utilisateur à choisir
      date_naissance: '',
      lieu_naissance: '',
      
      // État civil (optionnels selon IUser)
      etat_civil: '',
      nombre_enfants: null,
      
      // Nationalité et documents d'identité (nationalite requis, autres optionnels)
      nationalite: '',
      numero_cni: '',
      date_emission_cni: '',
      date_expiration_cni: '',
      lieu_emission_cni: '',

      // Contacts (requis selon IUser)
      email: '',
      telephone: '',
      telephone_urgence: '',
      
      // Adresse (requis selon IUser)
      province: '',
      ville: '',
      commune: '',
      quartier: '',
      avenue: '',
      numero: '',

      // Informations professionnelles (tous requis selon IUser)
      matricule: '',
      grade: '',
      fonction: '',
      service: '',
      direction: '',
      ministere: '',
      date_recrutement: '',
      date_prise_service: '',
      type_agent: '', // Laisser vide pour forcer l'utilisateur à choisir
      statut: '', // Laisser vide pour forcer l'utilisateur à choisir

      // Formation et éducation (optionnels selon IUser)
      niveau_etude: '',
      diplome_base: '',
      universite_ecole: '',
      annee_obtention: null,
      specialisation: '',

      // Informations bancaires (optionnels selon IUser)
      numero_bancaire: '',
      banque: '',

      // Informations de sécurité sociale (optionnels selon IUser)
      numero_cnss: '',
      numero_onem: '',

      // Documents et photos (optionnels selon IUser)
      photo_profil: '',
      cv_document: '',

      // Informations système (role et permission requis, status par défaut selon IUser)
      role: 'Agent',
      permission: 'V', // Permission lecture seule par défaut
      status: true,
      signature: this.getFullName(this.currentUser!) || '',
      password: '',
      password_confirm: ''
    });

    // Remettre les validateurs de mot de passe
    this.userForm.get('password')?.setValidators([Validators.required, Validators.minLength(6)]);
    this.userForm.get('password_confirm')?.setValidators([Validators.required]);
    this.userForm.get('password')?.updateValueAndValidity();
    this.userForm.get('password_confirm')?.updateValueAndValidity();
  }

  // Vérifier les permissions
  canCreateUser(): boolean {
    return this.currentUser?.role === 'Administrator' || this.currentUser?.role === 'Supervisor' ||
      (this.currentUser?.permission?.includes('C') || this.currentUser?.permission === 'ALL');
  }

  canEditUser(): boolean {
    return this.currentUser?.role === 'Administrator' || this.currentUser?.role === 'Supervisor' ||
      (this.currentUser?.permission?.includes('U') || this.currentUser?.permission === 'ALL');
  }

  canDeleteUser(): boolean {
    return this.currentUser?.role === 'Administrator' || this.currentUser?.role === 'Supervisor' ||
      (this.currentUser?.permission?.includes('D') || this.currentUser?.permission === 'ALL');
  }

  // Méthodes pour gérer les offcanvas
  openAddOffcanvas(): void {
    const offcanvas = document.getElementById('offcanvas_add');
    if (offcanvas) {
      offcanvas.classList.add('show');
      offcanvas.style.visibility = 'visible';
      // Ajouter backdrop
      const backdrop = document.createElement('div');
      backdrop.classList.add('offcanvas-backdrop', 'fade', 'show');
      backdrop.id = 'offcanvas-backdrop-add';
      document.body.appendChild(backdrop);
      document.body.classList.add('offcanvas-open');
    }
  }

  closeAddOffcanvas(): void {
    const offcanvas = document.getElementById('offcanvas_add');
    const backdrop = document.getElementById('offcanvas-backdrop-add');
    if (offcanvas) {
      offcanvas.classList.remove('show');
      offcanvas.style.visibility = 'hidden';
    }
    if (backdrop) {
      backdrop.remove();
    }
    document.body.classList.remove('offcanvas-open');
  }

  openEditOffcanvas(): void {
    const offcanvas = document.getElementById('offcanvas_edit');
    if (offcanvas) {
      offcanvas.classList.add('show');
      offcanvas.style.visibility = 'visible';
      // Ajouter backdrop
      const backdrop = document.createElement('div');
      backdrop.classList.add('offcanvas-backdrop', 'fade', 'show');
      backdrop.id = 'offcanvas-backdrop-edit';
      document.body.appendChild(backdrop);
      document.body.classList.add('offcanvas-open');
    }
  }

  closeEditOffcanvas(): void {
    const offcanvas = document.getElementById('offcanvas_edit');
    const backdrop = document.getElementById('offcanvas-backdrop-edit');
    if (offcanvas) {
      offcanvas.classList.remove('show');
      offcanvas.style.visibility = 'hidden';
    }
    if (backdrop) {
      backdrop.remove();
    }
    document.body.classList.remove('offcanvas-open');
  }

  openViewOffcanvas(): void {
    const offcanvas = document.getElementById('offcanvas_view');
    if (offcanvas) {
      offcanvas.classList.add('show');
      offcanvas.style.visibility = 'visible';
      // Ajouter backdrop
      const backdrop = document.createElement('div');
      backdrop.classList.add('offcanvas-backdrop', 'fade', 'show');
      backdrop.id = 'offcanvas-backdrop-view';
      document.body.appendChild(backdrop);
      document.body.classList.add('offcanvas-open');
    }
  }

  closeViewOffcanvas(): void {
    const offcanvas = document.getElementById('offcanvas_view');
    const backdrop = document.getElementById('offcanvas-backdrop-view');
    if (offcanvas) {
      offcanvas.classList.remove('show');
      offcanvas.style.visibility = 'hidden';
    }
    if (backdrop) {
      backdrop.remove();
    }
    document.body.classList.remove('offcanvas-open');
    this.viewingUser = null;
  }

  // Méthode pour obtenir la description des permissions
  getPermissionDescription(permission: string): string {
    const permissionMap: { [key: string]: string } = {
      'ALL': 'Accès complet à toutes les fonctionnalités',
      'CRUD': 'Peut créer, lire, modifier et supprimer',
      'CRU': 'Peut créer, lire et modifier (sans suppression)',
      'CR': 'Peut créer et lire (sans modification ni suppression)',
      'R': 'Lecture seule, aucune modification possible'
    };
    return permissionMap[permission] || '';
  }

  // Méthode pour obtenir l'avatar de l'utilisateur
  getUserAvatar(user: IUser): string {
    if (user.photo_profil) {
      return user.photo_profil;
    }
    // Retourner une image par défaut basée sur le sexe
    return user.sexe === 'F' 
      ? '/assets/img/profiles/avatar-default-female.png' 
      : '/assets/img/profiles/avatar-default-male.png';
  }

  // Méthode pour vérifier si l'utilisateur a une photo de profil
  hasProfilePhoto(user: IUser): boolean {
    return !!(user.photo_profil && user.photo_profil.trim());
  }

  // Méthode helper pour safely edit user
  safeEditUser(): void {
    if (this.viewingUser) {
      this.editUser(this.viewingUser);
      this.closeViewOffcanvas();
    }
  }

  // Méthode helper pour safely delete user
  safeDeleteUser(): void {
    if (this.viewingUser) {
      this.deleteUser(this.viewingUser);
      this.closeViewOffcanvas();
    }
  }

  // Gestion des erreurs de validation
  isFieldInvalid(fieldName: string): boolean {
    const field = this.userForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.userForm.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) return `${fieldName} est requis`;
      if (field.errors['minlength']) return `${fieldName} doit contenir au moins ${field.errors['minlength'].requiredLength} caractères`;
      if (field.errors['maxlength']) return `${fieldName} doit contenir au maximum ${field.errors['maxlength'].requiredLength} caractères`;
      if (field.errors['email']) return 'Format email invalide';
      if (field.errors['pattern']) return `Format ${fieldName} invalide`;
      if (field.errors['min']) return `Valeur minimum: ${field.errors['min'].min}`;
      if (field.errors['max']) return `Valeur maximum: ${field.errors['max'].max}`;
      if (field.errors['invalidSexe']) return 'Sexe invalide (M ou F)';
      if (field.errors['invalidEtatCivil']) return 'État civil invalide';
      if (field.errors['invalidTypeAgent']) return 'Type d\'agent invalide';
      if (field.errors['invalidStatut']) return 'Statut invalide';
      if (field.errors['invalidRole']) return 'Rôle invalide';
      if (field.errors['invalidPermission']) return 'Permission invalide';
      if (field.errors['invalidNiveauEtude']) return 'Niveau d\'étude invalide';
      if (field.errors['passwordMismatch']) return 'Les mots de passe ne correspondent pas';
      if (field.errors['dateInvalid']) return 'Date invalide';
    }
    return '';
  }

  // Méthode pour générer des statistiques sur les utilisateurs
  getUserStats() {
    const stats = {
      total: this.users.length,
      actifs: this.users.filter(u => u.status).length,
      inactifs: this.users.filter(u => !u.status).length,
      administrators: this.users.filter(u => u.role === 'Administrator').length,
      supervisors: this.users.filter(u => u.role === 'Supervisor').length,
      managers: this.users.filter(u => u.role === 'Manager').length,
      agents: this.users.filter(u => u.role === 'Agent').length,
      fonctionnaires: this.users.filter(u => u.type_agent === 'Fonctionnaire').length,
      contractuels: this.users.filter(u => u.type_agent === 'Contractuel').length,
      stagiaires: this.users.filter(u => u.type_agent === 'Stagiaire').length
    };
    return stats;
  }
}

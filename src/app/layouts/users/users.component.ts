import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { Sort } from '@angular/material/sort';
import { PageEvent } from '@angular/material/paginator';
import { Subject, firstValueFrom, takeUntil } from 'rxjs';
import { IUser } from '../../shared/models/user.model';
import { UserService, UserFormData } from '../../core/user/user.service';
import { AuthStateService } from '../../core/auth/auth-state.service';

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
    'nom', 'postnom', 'prenom', 'email', 'telephone', 'matricule', 
    'role', 'permission', 'status', 'actions'
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

  // Roles disponibles (selon le backend Go)
  roles = [
    { value: 'Admin', label: 'Administrateur' },
    { value: 'Supervisor', label: 'Superviseur' },
    { value: 'Manager', label: 'Manager' },
    { value: 'Agent', label: 'Agent' }
  ];

  // Types d'agents
  typeAgents = [
    { value: 'Fonctionnaire', label: 'Fonctionnaire' },
    { value: 'Contractuel', label: 'Contractuel' },
    { value: 'Stagiaire', label: 'Stagiaire' }
  ];

  // Statuts
  statuts = [
    { value: 'Actif', label: 'Actif' },
    { value: 'Retraité', label: 'Retraité' },
    { value: 'Suspendu', label: 'Suspendu' },
    { value: 'Révoqué', label: 'Révoqué' }
  ];

  // Permissions disponibles
  permissions = [
    { value: 'ALL', label: 'Toutes les permissions' },
    { value: 'CRUD', label: 'Créer, Lire, Modifier, Supprimer' },
    { value: 'CRU', label: 'Créer, Lire, Modifier' },
    { value: 'CR', label: 'Créer, Lire' },
    { value: 'R', label: 'Lecture seule' }
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

  private createForm(): FormGroup {
    return this.fb.group({
      // Informations personnelles de base
      nom: ['', [Validators.required, Validators.minLength(2)]],
      postnom: ['', [Validators.required, Validators.minLength(2)]],
      prenom: ['', [Validators.required, Validators.minLength(2)]],
      sexe: ['M', [Validators.required]],
      date_naissance: ['', [Validators.required]],
      lieu_naissance: ['', [Validators.required]],

      // État civil
      etat_civil: ['Célibataire'],
      nombre_enfants: [0, [Validators.min(0)]],

      // Nationalité
      nationalite: ['Congolaise', [Validators.required]],
      numero_cni: [''],
      date_emission_cni: [''],
      date_expiration_cni: [''],
      lieu_emission_cni: [''],

      // Contacts
      email: ['', [Validators.required, Validators.email]],
      telephone: ['', [Validators.required, Validators.minLength(8)]],
      telephone_urgence: [''],

      // Adresse
      province: ['', [Validators.required]],
      ville: ['', [Validators.required]],
      commune: ['', [Validators.required]],
      quartier: ['', [Validators.required]],
      avenue: [''],
      numero: [''],

      // Informations professionnelles
      matricule: ['', [Validators.required]],
      grade: ['', [Validators.required]],
      fonction: ['', [Validators.required]],
      service: ['', [Validators.required]],
      direction: ['', [Validators.required]],
      ministere: ['', [Validators.required]],
      date_recrutement: ['', [Validators.required]],
      date_prise_service: ['', [Validators.required]],
      type_agent: ['Fonctionnaire', [Validators.required]],
      statut: ['Actif', [Validators.required]],

      // Formation et éducation
      niveau_etude: [''],
      diplome_base: [''],
      universite_ecole: [''],
      annee_obtention: [null, [Validators.min(1950), Validators.max(new Date().getFullYear())]],
      specialisation: [''],

      // Informations bancaires
      numero_bancaire: [''],
      banque: [''],

      // Informations de sécurité sociale
      numero_cnss: [''],
      numero_onem: [''],

      // Documents et photos
      photo_profil: [''],
      cv_document: [''],

      // Informations système
      role: ['Agent', [Validators.required]],
      permission: ['R', [Validators.required]],
      status: [true],
      signature: [''],
      password: ['', [Validators.required, Validators.minLength(6)]],
      password_confirm: ['', [Validators.required]]
    }, {
      validators: this.passwordMatchValidator
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
      // Informations personnelles
      nom: user.nom,
      postnom: user.postnom,
      prenom: user.prenom,
      sexe: user.sexe,
      date_naissance: user.date_naissance,
      lieu_naissance: user.lieu_naissance,
      etat_civil: user.etat_civil,
      nombre_enfants: user.nombre_enfants,
      nationalite: user.nationalite,
      numero_cni: user.numero_cni,
      date_emission_cni: user.date_emission_cni,
      date_expiration_cni: user.date_expiration_cni,
      lieu_emission_cni: user.lieu_emission_cni,

      // Contact
      email: user.email,
      telephone: user.telephone,
      telephone_urgence: user.telephone_urgence,
      province: user.province,
      ville: user.ville,
      commune: user.commune,
      quartier: user.quartier,
      avenue: user.avenue,
      numero: user.numero,

      // Professionnel
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

      // Formation
      niveau_etude: user.niveau_etude,
      diplome_base: user.diplome_base,
      universite_ecole: user.universite_ecole,
      annee_obtention: user.annee_obtention,
      specialisation: user.specialisation,

      // Bancaire
      numero_bancaire: user.numero_bancaire,
      banque: user.banque,

      // Sécurité sociale
      numero_cnss: user.numero_cnss,
      numero_onem: user.numero_onem,

      // Documents
      photo_profil: user.photo_profil,
      cv_document: user.cv_document,

      // Système
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
      const formData: UserFormData = this.userForm.value;

      // Convertir les champs de date en format ISO string
      const userData = {
        ...formData,
        date_naissance: formData.date_naissance ? new Date(formData.date_naissance).toISOString() : '',
        date_emission_cni: formData.date_emission_cni ? new Date(formData.date_emission_cni).toISOString() : '',
        date_expiration_cni: formData.date_expiration_cni ? new Date(formData.date_expiration_cni).toISOString() : '',
        date_recrutement: formData.date_recrutement ? new Date(formData.date_recrutement).toISOString() : '',
        date_prise_service: formData.date_prise_service ? new Date(formData.date_prise_service).toISOString() : ''
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
      // Informations personnelles
      nom: '',
      postnom: '',
      prenom: '',
      sexe: 'M',
      date_naissance: '',
      lieu_naissance: '',
      etat_civil: 'Célibataire',
      nombre_enfants: 0,
      nationalite: 'Congolaise',
      numero_cni: '',
      date_emission_cni: '',
      date_expiration_cni: '',
      lieu_emission_cni: '',

      // Contact
      email: '',
      telephone: '',
      telephone_urgence: '',
      province: '',
      ville: '',
      commune: '',
      quartier: '',
      avenue: '',
      numero: '',

      // Professionnel
      matricule: '',
      grade: '',
      fonction: '',
      service: '',
      direction: '',
      ministere: '',
      date_recrutement: '',
      date_prise_service: '',
      type_agent: 'Fonctionnaire',
      statut: 'Actif',

      // Formation
      niveau_etude: '',
      diplome_base: '',
      universite_ecole: '',
      annee_obtention: null,
      specialisation: '',

      // Bancaire
      numero_bancaire: '',
      banque: '',

      // Sécurité sociale
      numero_cnss: '',
      numero_onem: '',

      // Documents
      photo_profil: '',
      cv_document: '',

      // Système
      role: 'Agent',
      permission: 'R',
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
}

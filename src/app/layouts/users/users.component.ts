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
    'fullname', 'email', 'telephone', 'role',
    'permission', 'status', 'actions'
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

  // Roles disponibles
  roles = [
    { value: 'admin', label: 'Administrateur' },
    { value: 'manager', label: 'Manager' },
    { value: 'user', label: 'Utilisateur' }, 
    { value: 'Manager général', label: 'Manager Général' }
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

  private createForm(): FormGroup {
    return this.fb.group({
      fullname: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      telephone: ['', [Validators.required, Validators.minLength(8)]],
      role: ['user', [Validators.required]],
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
      case 'admin': return 'badge bg-danger';
      case 'Manager général': return 'badge bg-primary';
      case 'manager': return 'badge bg-warning';
      case 'user': return 'badge bg-info';
      case 'viewer': return 'badge bg-secondary';
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
      fullname: user.fullname,
      email: user.email,
      telephone: user.telephone,
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
    if (confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur "${user.fullname}" ?`)) {
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

      if (this.editingUser) {
        // Mise à jour - on retire les champs de mot de passe
        const { password, password_confirm, ...updateData } = formData;
        await firstValueFrom(
          this.userService.updateUser(this.editingUser.uuid, updateData)
        );
        alert('Utilisateur modifié avec succès');
        this.closeEditOffcanvas();
      } else {
        // Création
        await firstValueFrom(
          this.userService.createUser(formData)
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
      fullname: '',
      email: '',
      telephone: '',
      role: 'user',
      permission: 'R',
      status: true,
      signature: this.currentUser?.fullname || '',
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
    return this.currentUser?.role === 'Admin' || this.currentUser?.role === 'Manager général' ||
      (this.currentUser?.permission?.includes('C') || this.currentUser?.permission === 'ALL');
  }

  canEditUser(): boolean {
    return this.currentUser?.role === 'Admin' || this.currentUser?.role === 'Manager général' ||
      (this.currentUser?.permission?.includes('U') || this.currentUser?.permission === 'ALL');
  }

  canDeleteUser(): boolean {
    return this.currentUser?.role === 'Admin' || this.currentUser?.role === 'Manager général' ||
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

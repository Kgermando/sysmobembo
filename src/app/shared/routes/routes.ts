export class routes {
  private static Url = '';

  public static get baseUrl(): string {
    return this.Url;
  }
  public static get core(): string {
    return this.baseUrl;
  }


  // Auth
  public static get auth(): string {
    return this.core + '/auth';
  }
  public static get login(): string {
    return this.auth + '/login';
  }

  public static get forgotPassword(): string {
    return this.auth + '/forgot-password';
  }

  public static get register(): string {
    return this.auth + '/register';
  }
  public static get emailVerification(): string {
    return this.auth + '/email-verification';
  }

  public static get lockScreen(): string {
    return this.auth + '/lock-screen';
  }


  // Layouts

  // Dashboard
  public static get dashboard(): string {
    return this.core + '/web/dashboard';
  }
  public static get dashboardSummary(): string {
    return this.dashboard + '/';
  }

  // Users
  public static get user(): string {
    return this.core + '/web/users';
  }
  public static get userList(): string {
    return this.user + '/user-list';
  }

    // Caisse
  public static get caisse(): string {
    return this.core + '/web/caisses';
  }
  public static get caisseList(): string {
    return this.caisse + '/caisse-list';
  }

    // Appartments
  public static get appartements(): string {
    return this.core + '/web/appartments';
  }
  public static get appartementsList(): string {
    return this.appartements + '/appartment-list';
  }

}

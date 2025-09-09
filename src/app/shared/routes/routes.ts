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
  public static get dashboardGis(): string {
    return this.dashboard + '/gis';
  }
  public static get dashboardRealtime(): string {
    return this.dashboard + '/realtime';
  }
  public static get dashboardPredictive(): string {
    return this.dashboard + '/predictive';
  }
  public static get dashboardSpatial(): string {
    return this.dashboard + '/spatial';
  }
  public static get dashboardTrajectory(): string {
    return this.dashboard + '/trajectory';
  }

  // Users
  public static get user(): string {
    return this.core + '/web/users';
  }
  public static get userList(): string {
    return this.user + '/user-list';
  }

  // Migration
  public static get migration(): string {
    return this.core + '/web/migration';
  }
  public static get migrants(): string {
    return this.migration + '/migrants';
  }

  // GIS
  public static get gis(): string {
    return this.core + '/web/gis';
  }
  public static get geolocations(): string {
    return this.gis + '/geolocations';
  }

  // Notifications
  public static get notifications(): string {
    return this.core + '/web/notifications';
  }
  public static get alerts(): string {
    return this.notifications + '/alerts';
  }

  // Biometrics
  public static get bio(): string {
    return this.core + '/web/bio';
  }
  public static get biometrics(): string {
    return this.bio + '/biometrics';
  }

  // Motifs
  public static get motifs(): string {
    return this.core + '/web/motifs';
  }
  public static get motifsDeplacementComponent(): string {
    return this.motifs + '/motifs-deplacement';
  }

  // Pages
  public static get pages(): string {
    return this.core + '/web/pages';
  }
  public static get blankPage(): string {
    return this.pages + '/blank-page';
  }
  public static get comingSoon(): string {
    return this.pages + '/coming-soon';
  }
  public static get underMaintenance(): string {
    return this.pages + '/under-maintenance';
  }

}

import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface IEmailTemplate {
  subject: string;
  body: string;
  variables: { [key: string]: any };
}

export interface INotificationRequest {
  to: string;
  template: string;
  data: { [key: string]: any };
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  apiService: any;

  constructor(
    private http: HttpClient
  ) { }

  /**
   * Envoie un email de bienvenue après inscription
   */
  sendWelcomeEmail(entrepriseData: {
    name: string;
    email: string;
    manager: string;
    activationToken: string;
  }): Observable<any> {
    const request: INotificationRequest = {
      to: entrepriseData.email,
      template: 'welcome_registration',
      data: {
        entreprise_name: entrepriseData.name,
        manager_name: entrepriseData.manager,
        activation_token: entrepriseData.activationToken,
        support_email: 'support@votre-application.com',
        support_phone: '+243 XXX XXX XXX'
      }
    };
    
    return this.http.post(`${environment.apiUrl}/notifications/send-email`, request);
  }

  /**
   * Envoie un email de confirmation d'activation
   */
  sendActivationConfirmationEmail(entrepriseData: {
    name: string;
    email: string;
    manager: string;
    subscriptionEndDate: string;
    loginUrl: string;
  }): Observable<any> {
    const request: INotificationRequest = {
      to: entrepriseData.email,
      template: 'activation_confirmation',
      data: {
        entreprise_name: entrepriseData.name,
        manager_name: entrepriseData.manager,
        subscription_end_date: entrepriseData.subscriptionEndDate,
        login_url: entrepriseData.loginUrl,
        support_email: 'support@votre-application.com'
      }
    };
    
    return this.http.post(`${environment.apiUrl}/notifications/send-email`, request);
  }

  /**
   * Envoie un email de rejet de demande
   */
  sendRejectionEmail(entrepriseData: {
    name: string;
    email: string;
    manager: string;
    reason: string;
  }): Observable<any> {
    const request: INotificationRequest = {
      to: entrepriseData.email,
      template: 'activation_rejection',
      data: {
        entreprise_name: entrepriseData.name,
        manager_name: entrepriseData.manager,
        rejection_reason: entrepriseData.reason,
        support_email: 'support@votre-application.com',
        contact_url: 'https://votre-application.com/contact'
      }
    };
    
    return this.http.post(`${environment.apiUrl}/notifications/send-email`, request);
  }

  /**
   * Envoie un rappel d'expiration d'abonnement
   */
  sendExpirationReminderEmail(entrepriseData: {
    name: string;
    email: string;
    manager: string;
    expirationDate: string;
    daysUntilExpiration: number;
  }): Observable<any> {
    const request: INotificationRequest = {
      to: entrepriseData.email,
      template: 'expiration_reminder',
      data: {
        entreprise_name: entrepriseData.name,
        manager_name: entrepriseData.manager,
        expiration_date: entrepriseData.expirationDate,
        days_until_expiration: entrepriseData.daysUntilExpiration,
        renewal_url: 'https://votre-application.com/renewal',
        support_email: 'support@votre-application.com'
      }
    };
    
    return this.http.post(`${environment.apiUrl}/notifications/send-email`, request);
  }

  /**
   * Envoie un email de suspension d'abonnement
   */
  sendSuspensionEmail(entrepriseData: {
    name: string;
    email: string;
    manager: string;
    reason: string;
  }): Observable<any> {
    const request: INotificationRequest = {
      to: entrepriseData.email,
      template: 'subscription_suspension',
      data: {
        entreprise_name: entrepriseData.name,
        manager_name: entrepriseData.manager,
        suspension_reason: entrepriseData.reason,
        support_email: 'support@votre-application.com',
        appeal_url: 'https://votre-application.com/appeal'
      }
    };
    
    return this.http.post(`${environment.apiUrl}/notifications/send-email`, request);
  }

  /**
   * Envoie un email de réactivation d'abonnement
   */
  sendReactivationEmail(entrepriseData: {
    name: string;
    email: string;
    manager: string;
    newExpirationDate: string;
  }): Observable<any> {
    const request: INotificationRequest = {
      to: entrepriseData.email,
      template: 'subscription_reactivation',
      data: {
        entreprise_name: entrepriseData.name,
        manager_name: entrepriseData.manager,
        new_expiration_date: entrepriseData.newExpirationDate,
        login_url: 'https://votre-application.com/login',
        support_email: 'support@votre-application.com'
      }
    };
    
    return this.http.post(`${environment.apiUrl}/notifications/send-email`, request);
  }

  /**
   * Envoie une notification interne à l'équipe support
   */
  sendInternalNotification(data: {
    type: 'NEW_REGISTRATION' | 'SUBSCRIPTION_EXPIRED' | 'PAYMENT_FAILED';
    entreprise: string;
    details: { [key: string]: any };
  }): Observable<any> {
    const request = {
      type: data.type,
      entreprise: data.entreprise,
      details: data.details,
      timestamp: new Date().toISOString()
    };
    
    return this.http.post(`${environment.apiUrl}/notifications/internal`, request);
  }

  /**
   * Envoie un email personnalisé
   */
  sendCustomEmail(data: {
    to: string;
    subject: string;
    body: string;
    isHtml?: boolean;
  }): Observable<any> {
    return this.http.post(`${environment.apiUrl}/notifications/send-custom-email`, data);
  }

  /**
   * Récupère les templates d'email disponibles
   */
  getEmailTemplates(): Observable<IEmailTemplate[]> {
    return this.http.get<IEmailTemplate[]>(`${environment.apiUrl}/notifications/templates`);
  }

  /**
   * Met à jour un template d'email
   */
  updateEmailTemplate(templateId: string, template: IEmailTemplate): Observable<any> {
    return this.http.put(`${environment.apiUrl}/notifications/templates/${templateId}`, template);
  }

  /**
   * Récupère l'historique des notifications envoyées
   */
  getNotificationHistory(
    filters?: {
      entrepriseUuid?: string;
      type?: string;
      dateFrom?: string;
      dateTo?: string;
    }
  ): Observable<any[]> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
    }
    
    return this.http.get<any[]>(`${environment.apiUrl}/notifications/history?${params.toString()}`);
  }

  /**
   * Marque une notification comme lue
   */
  markNotificationAsRead(notificationId: string): Observable<any> {
    return this.http.put(`${environment.apiUrl}/notifications/${notificationId}/read`, {});
  }

  /**
   * Programme l'envoi d'un email
   */
  scheduleEmail(data: {
    to: string;
    template: string;
    scheduledFor: string;
    data: { [key: string]: any };
  }): Observable<any> {
    return this.http.post(`${environment.apiUrl}/notifications/schedule`, data);
  }

  /**
   * Annule un email programmé
   */
  cancelScheduledEmail(scheduledEmailId: string): Observable<any> {
    return this.http.delete(`${environment.apiUrl}/notifications/scheduled/${scheduledEmailId}`);
  }
}

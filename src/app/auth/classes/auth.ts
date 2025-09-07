import { Injectable, inject } from "@angular/core";    
import { IUser } from "../../layouts/user/models/user.model";
import { UserStateService } from "../../core/user/user-state.service";

/**
 * @deprecated Classe Auth remplacée par UserStateService
 * Maintenue pour la compatibilité temporaire
 */
export class Auth {
    private static userStateService: UserStateService;

    /**
     * @deprecated Utilisez UserStateService.currentUser$ à la place
     */
    static get userEmitter() {
        if (!this.userStateService) {
            this.userStateService = inject(UserStateService);
        }
        return this.userStateService.currentUser$;
    }

    /**
     * Méthode utilitaire pour obtenir l'utilisateur actuel
     */
    static getCurrentUser(): IUser | null {
        if (!this.userStateService) {
            this.userStateService = inject(UserStateService);
        }
        return this.userStateService.getCurrentUser();
    }

    /**
     * Méthode utilitaire pour vérifier les permissions
     */
    static hasPermission(permission: string): boolean {
        if (!this.userStateService) {
            this.userStateService = inject(UserStateService);
        }
        return this.userStateService.hasPermission(permission);
    }
}
import { Component } from '@angular/core';

@Component({
  selector: 'app-reload',
  standalone: false,
  templateUrl: './reload.component.html',
  styleUrl: './reload.component.scss'
})
export class ReloadComponent {

  constructor() { }

  /**
   * Méthode pour recharger la page
   */
  reload(): void {
    window.location.reload();
  }

}
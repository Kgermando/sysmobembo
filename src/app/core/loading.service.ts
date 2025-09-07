import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

/**
 * Service pour gérer les états de chargement de l'application
 */
@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private loadingSteps = new BehaviorSubject<string>('Initialisation...');
  
  loading$ = this.loadingSubject.asObservable();
  loadingSteps$ = this.loadingSteps.asObservable();

  private loadingQueue: string[] = [];

  show(message: string = 'Chargement...'): void {
    this.loadingQueue.push(message);
    this.loadingSteps.next(message);
    this.loadingSubject.next(true);
  }

  hide(message?: string): void {
    if (message) {
      const index = this.loadingQueue.indexOf(message);
      if (index > -1) {
        this.loadingQueue.splice(index, 1);
      }
    } else {
      this.loadingQueue.pop();
    }

    if (this.loadingQueue.length === 0) {
      this.loadingSubject.next(false);
      this.loadingSteps.next('');
    } else {
      this.loadingSteps.next(this.loadingQueue[this.loadingQueue.length - 1]);
    }
  }

  updateStep(step: string): void {
    this.loadingSteps.next(step);
  }

  get isLoading(): boolean {
    return this.loadingSubject.value;
  }
}

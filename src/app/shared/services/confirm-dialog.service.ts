import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { ExerciceConfirmDialogComponent } from '../components/confirm-dialog/confirm-dialog.component';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ConfirmDialogService {
  constructor(private dialog: MatDialog) {}

  openConfirmDialog(data: ConfirmDialogData): Observable<boolean> {
    const dialogRef = this.dialog.open(ExerciceConfirmDialogComponent, {
      width: '400px',
      data: {
        title: data.title,
        message: data.message,
        confirmText: data.confirmText || 'Confirmer',
        cancelText: data.cancelText || 'Annuler'
      }
    });

    return dialogRef.afterClosed();
  }
}

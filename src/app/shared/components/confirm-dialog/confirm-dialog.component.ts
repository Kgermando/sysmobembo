import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ConfirmDialogData } from '../../services/confirm-dialog.service';

@Component({
  selector: 'app-confirm-dialog',
  standalone: false,
  template: `
    <div class="confirm-dialog">
      <h2 mat-dialog-title>{{ data.title }}</h2>
      <mat-dialog-content>
        <p>{{ data.message }}</p>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button [mat-dialog-close]="false">
          {{ data.cancelText }}
        </button>
        <button mat-raised-button color="warn" [mat-dialog-close]="true">
          {{ data.confirmText }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .confirm-dialog {
      min-width: 300px;
    }
    
    mat-dialog-content {
      padding: 20px 0;
    }
    
    mat-dialog-actions {
      padding: 16px 0;
      margin: 0;
    }
    
    button {
      margin-left: 8px;
    }
  `]
})
export class ExerciceConfirmDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ExerciceConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData
  ) {}
}

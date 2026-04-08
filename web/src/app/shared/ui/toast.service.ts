import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({ providedIn: 'root' })
export class Toast {
  private snack = inject(MatSnackBar);

  ok(msg: string) {
    this.snack.open(msg, 'OK', {
      duration: 3000,
      panelClass: ['snackbar-success']
    });
  }

  err(msg: string) {
    this.snack.open(msg, 'Error', {
      duration: 4000,
      panelClass: ['snackbar-error']
    });
  }

  info(msg: string) {
    this.snack.open(msg, 'Cerrar', {
      duration: 3500,
      panelClass: ['snackbar-info']
    });
  }
}

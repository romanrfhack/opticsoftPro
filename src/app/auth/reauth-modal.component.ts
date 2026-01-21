// reauth-modal.component.ts
import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from './auth.service';
// Make sure FormsModule is imported in your module

@Component({
  selector: 'app-reauth-modal',
  standalone: true,
  imports: [FormsModule, CommonModule],  
  template: `
    <div class="modal-header">
      <h4 class="modal-title">Sesión Expirada</h4>
    </div>
    <div class="modal-body">
      <p>Tu sesión ha expirado. Por favor ingresa tu PIN para continuar.</p>
      
      <form (ngSubmit)="onSubmit()" #reauthForm="ngForm">
        <div class="form-group">
          <label for="pinInput">PIN de 4 dígitos:</label>
          <input 
            type="password" 
            id="pinInput"
            class="form-control"
            [(ngModel)]="pin" 
            name="pin"
            maxlength="4"
            pattern="[0-9]{4}"
            placeholder="****"
            required
            [class.is-invalid]="showError"
            #pinInput="ngModel">          
          <div class="invalid-feedback" *ngIf="showError">
            {{ errorMessage }}
          </div>
        </div>
      </form>
    </div>
    <div class="modal-footer">
      <button type="button" class="btn btn-secondary" (click)="cancel()">Cancelar</button>
      <button type="button" class="btn btn-primary" 
              (click)="onSubmit()" 
              [disabled]="loading || pin.length !== 4">
        <span *ngIf="loading" class="spinner-border spinner-border-sm"></span>
        {{ loading ? 'Validando...' : 'Continuar' }}
      </button>
    </div>
  `,
  styles: [`
    .modal-header { background: #f8f9fa; border-bottom: 1px solid #dee2e6; }
    .form-group { margin-bottom: 0; }
    input { text-align: center; letter-spacing: 8px; font-size: 1.2em; }
  `]
})
export class ReauthModalComponent {
  pin: string = '';
  loading = false;
  showError = false;
  errorMessage = '';

  constructor(
    public activeModal: NgbActiveModal,
    private authService: AuthService
  ) {}

  onSubmit(): void {
    if (this.pin.length !== 4) {
      this.showError = true;
      this.errorMessage = 'El PIN debe tener 4 dígitos';
      return;
    }

    this.loading = true;
    this.showError = false;

    this.authService.validatePin(this.pin).subscribe({
      next: (result) => {
        this.loading = false;
        if (result.success && result.token) {
          this.activeModal.close(result.token);
        } else {
          this.showError = true;
          this.errorMessage = 'PIN incorrecto';
          this.pin = '';
        }
      },
      error: () => {
        this.loading = false;
        this.showError = true;
        this.errorMessage = 'Error al validar el PIN';
        this.pin = '';
      }
    });
  }

  cancel(): void {
    this.activeModal.dismiss();
  }
}
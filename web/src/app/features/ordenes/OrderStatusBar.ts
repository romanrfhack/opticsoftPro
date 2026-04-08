// order-status-bar.component.ts
import { Component, Input } from '@angular/core';

import { CommonModule } from '@angular/common';
import { OrderStatus, STATUS_FLOW } from './ordenes.models';

@Component({
  selector: 'app-order-status-bar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="status-bar-compact">
      <div class="steps-container">
        <div 
          *ngFor="let status of displayedSteps; let i = index"
          class="step"
          [class.active]="i < currentStepIndex"
          [class.current]="i === currentStepIndex"
          [class.pending]="i > currentStepIndex"
          [title]="status">
        </div>
      </div>
      <div class="status-info">
        <span class="current-status">{{currentStatus}}</span>
        <span class="steps-remaining" *ngIf="stepsRemaining > 0">
          ({{stepsRemaining}} pasos restantes)
        </span>
        <span class="steps-remaining" *ngIf="stepsRemaining === 0">
          (Listo para entrega)
        </span>
      </div>
    </div>
  `,
  styles: [`
    .status-bar-compact {
      font-family: Arial, sans-serif;
      font-size: 12px;
    }
    
    .steps-container {
      display: flex;
      gap: 2px;
      margin-bottom: 4px;
    }
    
    .step {
      height: 8px;
      flex: 1;
      border-radius: 2px;
      transition: all 0.3s ease;
    }
    
    .step.active {
      background-color: #4CAF50; /* Verde para completado */
    }
    
    .step.current {
      background-color: #FF9800; /* Naranja para estado actual */
    }
    
    .step.pending {
      background-color: #E0E0E0; /* Gris para pendiente */
    }
    
    .status-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .current-status {
      font-weight: bold;
      color: #333;
    }
    
    .steps-remaining {
      color: #666;
      font-size: 10px;
    }
  `]
})
export class OrderStatusBarComponent {
  @Input() currentStatus!: OrderStatus;
  
  get currentStepIndex(): number {
    return STATUS_FLOW.indexOf(this.currentStatus);
  }
  
  get stepsRemaining(): number {
    const totalSteps = STATUS_FLOW.length;
    const currentIndex = this.currentStepIndex;
    return totalSteps - currentIndex - 1;
  }
  
  get displayedSteps() {
    // Mostramos solo algunos pasos clave para no hacerlo muy largo
    const keySteps = [
      OrderStatus.CREADA,
      OrderStatus.ENVIADA_A_LABORATORIO, 
      OrderStatus.LISTA_EN_LABORATORIO,
      OrderStatus.RECIBIDA_EN_SUCURSAL_ORIGEN,
      OrderStatus.ENTREGADA_AL_CLIENTE
    ];
    
    return keySteps;
  }
}
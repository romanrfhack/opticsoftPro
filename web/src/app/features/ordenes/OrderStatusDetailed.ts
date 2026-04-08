// order-status-detailed.component.ts
import { Component, Input } from '@angular/core';

import { CommonModule } from '@angular/common';
import { OrderStatus, STATUS_FLOW } from './ordenes.models';

@Component({
  selector: 'app-order-status-detailed',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="status-detailed">
      <div 
        *ngFor="let status of STATUS_FLOW; let i = index"
        class="status-step"
        [class.completed]="i < currentStepIndex"
        [class.current]="i === currentStepIndex"
        [class.pending]="i > currentStepIndex">
        
        <div class="step-icon">
          <span *ngIf="i < currentStepIndex">✓</span>
          <span *ngIf="i === currentStepIndex">●</span>
          <span *ngIf="i > currentStepIndex">{{i + 1}}</span>
        </div>
        
        <div class="step-content">
          <div class="step-title">{{status}}</div>
          <div class="step-line"></div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .status-detailed {
      font-family: Arial, sans-serif;
      padding: 20px;
    }
    
    .status-step {
      display: flex;
      align-items: flex-start;
      margin-bottom: 15px;
    }
    
    .step-icon {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 12px;
      font-size: 12px;
      font-weight: bold;
      z-index: 2;
    }
    
    .status-step.completed .step-icon {
      background-color: #4CAF50;
      color: white;
    }
    
    .status-step.current .step-icon {
      background-color: #FF9800;
      color: white;
      animation: pulse 2s infinite;
    }
    
    .status-step.pending .step-icon {
      background-color: #E0E0E0;
      color: #666;
      border: 2px solid #BDBDBD;
    }
    
    .step-content {
      flex: 1;
      position: relative;
    }
    
    .step-title {
      font-weight: 500;
      margin-bottom: 8px;
    }
    
    .status-step.completed .step-title {
      color: #4CAF50;
      font-weight: bold;
    }
    
    .status-step.current .step-title {
      color: #FF9800;
      font-weight: bold;
      font-size: 1.1em;
    }
    
    .status-step.pending .step-title {
      color: #9E9E9E;
    }
    
    .step-line {
      height: 2px;
      background: linear-gradient(90deg, #4CAF50 0%, #E0E0E0 100%);
      position: relative;
    }
    
    .status-step:last-child .step-line {
      display: none;
    }
    
    @keyframes pulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.1); }
      100% { transform: scale(1); }
    }
  `]
})
export class OrderStatusDetailedComponent {
  @Input() currentStatus!: OrderStatus;
  
  readonly STATUS_FLOW = STATUS_FLOW;
  
  get currentStepIndex(): number {
    return STATUS_FLOW.indexOf(this.currentStatus);
  }
}
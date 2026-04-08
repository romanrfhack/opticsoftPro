import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrderStatus, OrderStatusLabels, STATUS_FLOW } from './ordenes.models';

@Component({
  selector: 'app-order-status-timeline',
  standalone: true,
  imports: [CommonModule],
  template: `
  <div class="relative w-full overflow-x-auto py-4">
    <!-- Contenedor principal horizontal -->
    <div class="flex items-center justify-start min-w-max px-4">
      
      <!-- Estados -->
      <ng-container *ngFor="let status of STATUS_FLOW; let i = index; let last = last">
        <div class="relative z-10 flex items-center">
          
          <!-- Ícono y etiqueta -->
          <div class="flex flex-col items-center min-w-[80px] max-w-[100px] mx-1">
            <!-- Ícono circular -->
            <div 
              class="flex items-center justify-center rounded-full border-4 transition-all duration-300 flex-shrink-0"
              [ngClass]="{
                'bg-blue-500 border-blue-600 scale-110 shadow-lg shadow-blue-300': currentStatus === status,
                'bg-gray-200 border-gray-400': currentStatus !== status,
                'bg-green-500 border-green-600': currentStatus > status
              }"
              [style.width]="currentStatus === status ? '3rem' : '2.5rem'"
              [style.height]="currentStatus === status ? '3rem' : '2.5rem'">
              <span class="text-xl"
                [ngClass]="{ 
                  'text-white': currentStatus === status || currentStatus > status, 
                  'text-gray-600': currentStatus < status 
                }">
                {{ getIcon(status) }}
              </span>
            </div>

            <!-- Nombre del estado -->
            <div 
              class="mt-1 text-center font-medium transition-all duration-200 px-1"
              [title]="getLabel(status)"
              [ngClass]="{
                'text-blue-600 font-semibold bg-white rounded px-2 py-0.5 text-xs': currentStatus === status,
                'text-green-600 font-semibold': currentStatus > status,
                'text-gray-500 text-xs': currentStatus < status
              }"
              style="line-height: 1.2; max-width: 90px;">
              <span class="break-words whitespace-normal">
                {{ getLabel(status) }}
              </span>
            </div>
          </div>

          <!-- Conector horizontal (excepto para el último) -->
          <div
            *ngIf="!last"
            class="flex-shrink-0 transition-colors duration-300 mx-1"
            [ngClass]="{
              'bg-blue-400': currentStatus > status,
              'bg-gray-300': currentStatus <= status
            }"
            style="height: 2px; width: 40px;">
          </div>
        </div>
      </ng-container>
    </div>
  </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
    
    /* Scrollbar personalizado para mejor UX */
    .overflow-x-auto::-webkit-scrollbar {
      height: 6px;
    }
    
    .overflow-x-auto::-webkit-scrollbar-track {
      background: #f1f1f1;
      border-radius: 3px;
    }
    
    .overflow-x-auto::-webkit-scrollbar-thumb {
      background: #c1c1c1;
      border-radius: 3px;
    }
    
    .overflow-x-auto::-webkit-scrollbar-thumb:hover {
      background: #a8a8a8;
    }
  `]
})
export class OrderStatusTimelineComponent {
  @Input() currentStatus: OrderStatus = OrderStatus.CREADA;

  STATUS_FLOW = STATUS_FLOW;

  getLabel(status: OrderStatus): string {
    return OrderStatusLabels[status];
  }

  getIcon(status: OrderStatus): string {
    switch (status) {
      case OrderStatus.CREADA: return '🧾';
      case OrderStatus.REGISTRADA: return '📋';
      case OrderStatus.LISTAPARA_ENVIO: return '📦';
      case OrderStatus.EN_TRANSITO_A_SUCURSAL_MATRIZ: return '🚚';
      case OrderStatus.RECIBIDA_EN_SUCURSAL_MATRIZ: return '🏠';
      case OrderStatus.ENVIADA_A_LABORATORIO: return '🏭';
      case OrderStatus.LISTA_EN_LABORATORIO: return '🔬';
      case OrderStatus.EN_TRANSITO_DE_LABORATORIO_A_SUCURSAL_MATRIZ: return '🚛';
      case OrderStatus.RECIBIDA_LISTA_EN_SUCURSAL_MATRIZ: return '🏢';
      case OrderStatus.EN_TRANSITO_A_SUCURSAL_ORIGEN: return '🚐';
      case OrderStatus.RECIBIDA_EN_SUCURSAL_ORIGEN: return '🏘️';
      case OrderStatus.ENTREGADA_AL_CLIENTE: return '🤝';
      default: return '⚪';
    }
  }
}
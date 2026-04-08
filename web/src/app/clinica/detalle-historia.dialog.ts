import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';

@Component({
  standalone: true,
  selector: 'app-detalle-historia-dialog',
  imports: [CommonModule, MatDialogModule],
  template: `
  <h2 class="text-lg font-semibold mb-3">Detalle de la orden</h2>
  <div class="space-y-1 text-sm">
    <div><span class="font-medium">Cliente:</span> {{data?.Paciente}} — {{data?.Telefono}}</div>
    <div><span class="font-medium">Total:</span> {{data?.Total | currency}} — <span class="font-medium">Resta:</span> {{data?.Resta | currency}}</div>
    <div><span class="font-medium">Fecha envío:</span> {{data?.FechaEnvioLaboratorio | date:'short'}}</div>
    <div><span class="font-medium">Estimada entrega:</span> {{data?.FechaEstimadaEntrega | date}}</div>
  </div>
  `
})
export class DetalleHistoriaDialog {
  data = inject(MAT_DIALOG_DATA);
}

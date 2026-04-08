import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HistoriasService } from '../core/historias.service';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { DetalleHistoriaDialog } from './detalle-historia.dialog';

@Component({
  standalone: true,
  selector: 'app-lab-bandeja',
  imports: [CommonModule, MatTableModule, MatButtonModule, MatIconModule, MatDialogModule],
  template: `
    <div class="flex items-center justify-between mb-3">
      <h2 class="text-lg font-semibold">Órdenes en laboratorio</h2>
      <button mat-stroked-button (click)="load()">Refrescar</button>
    </div>

    <table mat-table [dataSource]="rows()" class="mat-elevation-z1 w-full text-sm">
      <ng-container matColumnDef="fecha">
        <th mat-header-cell *matHeaderCellDef>Enviado</th>
        <td mat-cell *matCellDef="let r">{{ r.fechaEnvioLaboratorio | date:'short' }}</td>
      </ng-container>
      <ng-container matColumnDef="cliente">
        <th mat-header-cell *matHeaderCellDef>Cliente</th>
        <td mat-cell *matCellDef="let r">{{ r.paciente }} — {{ r.telefono }}</td>
      </ng-container>
      <ng-container matColumnDef="total">
        <th mat-header-cell *matHeaderCellDef>Total</th>
        <td mat-cell *matCellDef="let r">{{ r.total | currency }}</td>
      </ng-container>
      <ng-container matColumnDef="resta">
        <th mat-header-cell *matHeaderCellDef>Resta</th>
        <td mat-cell *matCellDef="let r">{{ r.resta | currency }}</td>
      </ng-container>
      <ng-container matColumnDef="entrega">
        <th mat-header-cell *matHeaderCellDef>Est. Entrega</th>
        <td mat-cell *matCellDef="let r">{{ r.fechaEstimadaEntrega | date }}</td>
      </ng-container>
      <ng-container matColumnDef="acciones">
        <th mat-header-cell *matHeaderCellDef></th>
        <td mat-cell *matCellDef="let r">
          <button mat-icon-button (click)="ver(r)" title="Ver detalle"><mat-icon>visibility</mat-icon></button>
        </td>
      </ng-container>

      <tr mat-header-row *matHeaderRowDef="cols"></tr>
      <tr mat-row *matRowDef="let row; columns: cols;"></tr>
    </table>
  `
})
export class LabBandejaComponent implements OnInit {
  private api = inject(HistoriasService);
  private dialog = inject(MatDialog);

  rows = signal<any[]>([]);
  cols = ['fecha','cliente','total','resta','entrega','acciones'];

  ngOnInit(){ this.load(); }
  load(){
    this.api.enLaboratorio().subscribe(data => {
      const mapped = data.map((x: any) => ({
        id: x.id,
        fechaEnvioLaboratorio: x.fechaEnvioLaboratorio,
        paciente: x.paciente,
        telefono: x.telefono,
        total: x.total ?? 0,
        resta: x.resta ?? 0,
        fechaEstimadaEntrega: x.fechaEstimadaEntrega,
        observaciones: x.observaciones
      }));
      this.rows.set(mapped);
    });
  }

  ver(r: any){
    this.dialog.open(DetalleHistoriaDialog, { data: {
      Id: r.id,
      Paciente: r.paciente,
      Telefono: r.telefono,
      Total: r.total,
      Resta: r.resta,
      FechaEnvioLaboratorio: r.fechaEnvioLaboratorio,
      FechaEstimadaEntrega: r.fechaEstimadaEntrega
    }, width: '520px' });
  }
}

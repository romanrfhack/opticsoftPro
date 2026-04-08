import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { NgApexchartsModule } from 'ng-apexcharts';
import { DashboardService } from '../../core/dashboard.service';


@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgApexchartsModule],
  templateUrl: './dashboard.html'  
})
export class DashboardComponent {
  private fb = inject(FormBuilder);
  private dashboardService = inject(DashboardService);

  // Signals reactivos
  loading = signal(false);
  kpis = signal<any[]>([]);
  patientsChart = signal<any>(null);
  paymentsChart = signal<any>(null);
  ordersChart = signal<any>(null);
  salesChart = signal<any>(null);
  branches = signal<{ id: string; nombre: string; activa: boolean }[]>([]);

  // Periodos
  periods = [
    { value: 'today', label: 'Hoy' },
    { value: 'week', label: 'Esta semana' },
    { value: 'month', label: 'Este mes' },
    { value: 'custom', label: 'Personalizado' }
  ];

  // Formulario de filtros
  filterForm = this.fb.group({
    period: ['month'],
    startDate: [null],
    endDate: [null],
    branchId: ['all']
  });

  constructor() {
    this.loadBranches();

    // Detecta cambios automáticos en los filtros
    this.filterForm.valueChanges
      .pipe(debounceTime(400), distinctUntilChanged())
      .subscribe(() => this.loadDashboardData());

    // Carga inicial
    this.loadDashboardData();
  }

  private loadBranches() {
    this.dashboardService.getBranches().subscribe({
      next: data => {
        // Garantizamos que 'activa' sea boolean
        const mapped = data.map(b => ({
          ...b,
          activa: !!b.activa
        }));
        this.branches.set([{ id: 'all', nombre: 'Todas', activa: true }, ...mapped]);
      },
      error: () => {
        this.branches.set([{ id: 'all', nombre: 'Todas', activa: true }]);
      }
    });
  }

  loadDashboardData() {
    this.loading.set(true);
    const filters = this.filterForm.value;

    this.dashboardService.getDashboardData(filters as any).subscribe({
      next: (data: any) => {
        this.kpis.set(data.kpis || []);
        this.patientsChart.set(data.patientsChart || null);
        this.paymentsChart.set(data.paymentsChart || null);
        this.ordersChart.set(data.ordersChart || null);
        this.salesChart.set(data.salesChart || null);
      },
      error: (err) => console.error('Error cargando dashboard:', err),
      complete: () => this.loading.set(false)
    });
  }
}

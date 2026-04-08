import { Component, OnInit, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule, DecimalPipe, NgIf } from '@angular/common';
import { environment } from '../../../environments/environment';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { firstValueFrom } from 'rxjs';

import {
  ApexAxisChartSeries,
  ApexChart,
  ApexXAxis,
  ApexStroke,
  ApexTooltip,
  ApexResponsive,
  ApexLegend,
  ApexDataLabels,
  ApexPlotOptions,
  NgApexchartsModule,
} from 'ng-apexcharts';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';

@Component({
  standalone: true,
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.page.html',
  styleUrls: ['./admin-dashboard.page.css'],
  imports: [CommonModule, MatButtonToggleModule, MatFormFieldModule, MatSelectModule, NgApexchartsModule, MatIconModule, DecimalPipe],
})
export class AdminDashboardPage implements OnInit {
  private http = inject(HttpClient);
  private base = environment.apiBaseUrl + '/admin/dashboard';

  loading = signal(true);
  selectedRange = 30;

  // Datos
  kpis: any[] = [];
  tenantsResumen: any[] = [];

  // Gráficas
  chartUsuarios: any;
  chartTenants: any;
  chartDonut: any;
  chartBars: any;

  ngOnInit() {
    this.loadDashboard();
  }

  async loadDashboard() {
    try {
      this.loading.set(true);
      const [resumen, usuarios, tenants, resumenTenants] = await Promise.all([
        firstValueFrom(this.http.get<any>(`${this.base}/resumen?range=${this.selectedRange}`)),
        firstValueFrom(this.http.get<any[]>(`${this.base}/usuarios-activos?range=${this.selectedRange}`)),
        firstValueFrom(this.http.get<any[]>(`${this.base}/tenants-crecimiento?range=${this.selectedRange}`)),
        firstValueFrom(this.http.get<any[]>(`${this.base}/tenants-resumen`)),
      ]);      

      // ===== KPIs con tendencias =====
      this.kpis = [
        {
          title: 'Usuarios Nuevos',
          icon: 'person_add',
          value: resumen.usuariosNuevos ?? 0,
          trend: resumen.crecimientoUsuarios ?? 0,
          iconColor: '#06b6d4',
        },
        {
          title: 'Ópticas Activas',
          icon: 'business',
          value: resumen.tenantsActivos ?? 0,
          trend: resumen.crecimientoTenants ?? 0,
          iconColor: '#22c55e',
        },
        {
          title: 'Usuarios Activos',
          icon: 'groups',
          value: resumen.usuariosActivos ?? 0,
          trend: resumen.crecimientoActivos ?? 0,
          iconColor: '#0ea5e9',
        },
        {
          title: 'Sucursales Totales',
          icon: 'store',
          value: resumen.sucursales ?? 0,
          trend: resumen.crecimientoSucursales ?? 0,
          iconColor: '#eab308',
        },
      ];

      // ===== GRÁFICA DE CRECIMIENTO DE USUARIOS =====
      this.chartUsuarios = {
        series: [
          {
            name: 'Usuarios Activos',
            data: usuarios.map((u) => u.activos),
          },
        ] as ApexAxisChartSeries,
        chart: { type: 'line', height: 320 } as ApexChart,
        xaxis: {
          categories: usuarios.map((u) =>
            new Date(u.fecha).toLocaleDateString()
          ),
          labels: { rotate: -45 },
        } as ApexXAxis,
        colors: ['#06b6d4'],
        stroke: { curve: 'smooth', width: 3 } as ApexStroke,
        tooltip: { theme: 'light' } as ApexTooltip,
        responsive: [
          { breakpoint: 1024, options: { chart: { height: 280 } } },
          { breakpoint: 768, options: { chart: { height: 250 } } },
          { breakpoint: 480, options: { chart: { height: 220 } } },
        ] as ApexResponsive[],
      };

      // ===== GRÁFICA DE CRECIMIENTO DE TENANTS =====
      this.chartTenants = {
        series: [
          {
            name: 'Nuevos Tenants',
            data: tenants.map((t) => t.crecimiento),
          },
        ] as ApexAxisChartSeries,
        chart: { type: 'area', height: 320 } as ApexChart,
        xaxis: {
          categories: tenants.map((t) =>
            new Date(t.fecha).toLocaleDateString()
          ),
          labels: { rotate: -45 },
        } as ApexXAxis,
        colors: ['#22c55e'],
        stroke: { curve: 'smooth', width: 2.5 } as ApexStroke,
        tooltip: { theme: 'light' } as ApexTooltip,
        responsive: [
          { breakpoint: 1024, options: { chart: { height: 280 } } },
          { breakpoint: 768, options: { chart: { height: 250 } } },
          { breakpoint: 480, options: { chart: { height: 220 } } },
        ] as ApexResponsive[],
      };

      // ===== GRÁFICO DONUT DE DISTRIBUCIÓN DE USUARIOS =====
      this.chartDonut = {
        series: resumenTenants.map((t) => t.usuarios),
        labels: resumenTenants.map((t) => t.nombre),
        chart: { type: 'donut', height: 300 } as ApexChart,
        colors: ['#06b6d4', '#0ea5e9', '#22c55e', '#eab308', '#f97316'],
        legend: { position: 'bottom' } as ApexLegend,
        dataLabels: { enabled: true } as ApexDataLabels,
        tooltip: { theme: 'light' } as ApexTooltip,
        responsive: [
          { breakpoint: 1024, options: { chart: { height: 260 } } },
          { breakpoint: 768, options: { chart: { height: 240 } } },
          { breakpoint: 480, options: { chart: { height: 200 } } },
        ] as ApexResponsive[],
      };

      // ===== GRÁFICO DE BARRAS DE SUCURSALES =====
      this.chartBars = {
        series: [
          {
            name: 'Sucursales',
            data: resumenTenants.map((t) => t.sucursales),
          },
        ],
        chart: { type: 'bar', height: 300 } as ApexChart,
        xaxis: {
          categories: resumenTenants.map((t) => t.nombre),
        } as ApexXAxis,
        colors: ['#06b6d4'],
        plotOptions: {
          bar: { borderRadius: 6, columnWidth: '50%' },
        } as ApexPlotOptions,
        dataLabels: { enabled: false } as ApexDataLabels,
        tooltip: { theme: 'light' } as ApexTooltip,
        responsive: [
          { breakpoint: 1024, options: { chart: { height: 260 } } },
          { breakpoint: 768, options: { chart: { height: 240 } } },
          { breakpoint: 480, options: { chart: { height: 200 } } },
        ] as ApexResponsive[],
      };

      // ===== TABLA DE TENANTS =====
      this.tenantsResumen = resumenTenants;
    } catch (err) {
      console.error('Error al cargar dashboard:', err);
    } finally {
      this.loading.set(false);
    }
  }

  changeRange(days: number) {
    this.selectedRange = days;
    this.loadDashboard();
  }
}

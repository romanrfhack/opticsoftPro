import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { forkJoin, Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface KpiData {
  value: number;
  change: number;
}

export interface DashboardKpis {
  patientsAttended: KpiData;
  newPatients: KpiData;
  ordersPaid: KpiData;
  totalIncome: KpiData;
  sentToLab: KpiData;
  deliveredToCustomers: KpiData;
}

export interface PatientAttendance {
  labels: string[];
  totalPatients: number[];
  newPatients: number[];
}

export interface PaymentMethods {
  labels: string[];
  data: number[];
  amounts: number[];
}

export interface OrderStatus {
  labels: string[];
  data: number[];
}

export interface SalesByCategory {
  labels: string[];
  data: number[];
  amounts: number[];
}

export interface MonthlyRevenue {
  labels: string[];
  currentYear: number[];
  previousYear: number[];
}

export interface DashboardFilters {
  period: string;
  startDate?: Date | string;
  endDate?: Date | string;
  branchId: string;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private base = environment.apiBaseUrl;
  private apiUrl = `${this.base}/Dashboard`;

  constructor(private http: HttpClient) {}

  // ✅ Llama todas las secciones del dashboard en paralelo
  getDashboardData(filters: DashboardFilters): Observable<any> {
    const params = this.buildParams(filters);

    return forkJoin({
      kpis: this.http.get<DashboardKpis>(`${this.apiUrl}/kpis`, { params }),
      patientsChart: this.http.get<PatientAttendance>(`${this.apiUrl}/patient-attendance`, { params }),
      paymentsChart: this.http.get<PaymentMethods>(`${this.apiUrl}/payment-methods`, { params }),
      ordersChart: this.http.get<OrderStatus>(`${this.apiUrl}/order-status`, { params }),
      salesChart: this.http.get<SalesByCategory>(`${this.apiUrl}/sales-by-category`, { params }),
      // Si no necesitas monthlyRevenue, puedes quitarlo:
      monthlyRevenue: this.http.get<MonthlyRevenue>(`${this.apiUrl}/monthly-revenue`, { params }),
    }).pipe(
      // El shareReplay evita duplicar llamadas si varios componentes leen este observable
      shareReplay(1),
      map(res => ({
        kpis: this.formatKpis(res.kpis),
        patientsChart: this.formatPatientsChart(res.patientsChart),
        paymentsChart: this.formatPaymentsChart(res.paymentsChart),
        ordersChart: this.formatOrdersChart(res.ordersChart),
        salesChart: this.formatSalesChart(res.salesChart),
        monthlyRevenue: res.monthlyRevenue
      }))
    );
  }

  // 🔹 Ejemplo de formateo de datos para simplificar el componente
  private formatKpis(k: DashboardKpis) {
    return [
      { title: 'Pacientes atendidos', value: k.patientsAttended.value, change: k.patientsAttended.change, icon: 'groups', iconColor: 'blue' },
      { title: 'Nuevos pacientes', value: k.newPatients.value, change: k.newPatients.change, icon: 'person_add', iconColor: 'green' },
      { title: 'Órdenes pagadas', value: k.ordersPaid.value, change: k.ordersPaid.change, icon: 'receipt_long', iconColor: 'cyan' },
      { title: 'Ingresos totales', value: k.totalIncome.value, change: k.totalIncome.change, icon: 'payments', iconColor: 'yellow', isMoney: true },
      { title: 'Enviados a laboratorio', value: k.sentToLab.value, change: k.sentToLab.change, icon: 'science', iconColor: 'red' },
      { title: 'Entregados al cliente', value: k.deliveredToCustomers.value, change: k.deliveredToCustomers.change, icon: 'check_circle', iconColor: 'green' },
    ];
  }

  private formatPatientsChart(data: PatientAttendance) {
    return {
      chart: { type: 'bar', height: 300 },
      series: [
        { name: 'Total', data: data.totalPatients },
        { name: 'Nuevos', data: data.newPatients },
      ],
      xaxis: { categories: data.labels },
      colors: ['#3B82F6', '#06B6D4'],
      plotOptions: { bar: { horizontal: false, columnWidth: '50%' } },
      dataLabels: { enabled: false }
    };
  }

  private formatPaymentsChart(data: PaymentMethods) {
    return {
      chart: { type: 'pie', height: 300 },
      series: data.data,
      labels: data.labels,
      colors: ['#0EA5E9', '#14B8A6', '#F59E0B', '#EF4444', '#8B5CF6'],
      legend: { position: 'bottom' }
    };
  }

  private formatOrdersChart(data: OrderStatus) {
    return {
      chart: { type: 'pie', height: 300 },
      series: data.data,
      labels: data.labels,
      colors: ['#22C55E', '#EAB308', '#3B82F6', '#F97316', '#EF4444'],
      legend: { position: 'bottom' }
    };
  }

  private formatSalesChart(data: SalesByCategory) {
    return {
      chart: { type: 'bar', height: 300 },
      series: [{ name: 'Ventas', data: data.data }],
      xaxis: { categories: data.labels },
      colors: ['#06B6D4'],
      plotOptions: { bar: { horizontal: false, columnWidth: '55%' } },
      dataLabels: { enabled: false }
    };
  }

  private buildParams(filters: DashboardFilters): HttpParams {
    let params = new HttpParams()
      .set('period', filters.period)
      .set('branchId', filters.branchId);

    if (filters.startDate) params = params.set('startDate', new Date(filters.startDate).toISOString());
    if (filters.endDate) params = params.set('endDate', new Date(filters.endDate).toISOString());

    return params;
  }

  // Opcional: si tienes otro endpoint de sucursales
  getBranches(): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/Branches`).pipe(shareReplay(1));
  }
}

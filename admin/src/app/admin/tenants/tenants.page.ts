import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { TenantsService } from './tenants.service';
import { Toast } from '../../shared/ui/toast.service';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { finalize } from 'rxjs/operators';
import { CreateTenantRequest, Tenant } from '../../core/models/tenant.model';

@Component({
  selector: 'app-tenants-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatInputModule,
    MatIconModule,
  ],
  templateUrl: './tenants.page.html',
  styleUrls: ['./tenants.page.css']
})
export class TenantsPage implements OnInit {
  private svc = inject(TenantsService);
  private toast = inject(Toast);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);

  tenants: Tenant[] = [];
  loading = false;
  showForm = false;

  form = this.fb.group({
    nombre: ['', [Validators.required, Validators.maxLength(150)]],
    dominio: ['', [Validators.required, Validators.maxLength(150)]],
    adminNombre: ['', [Validators.required, Validators.maxLength(150)]],
    adminEmail: ['', [Validators.required, Validators.email]],
    adminPassword: ['Admin123!', [Validators.required, Validators.minLength(6)]]
  });

  ngOnInit() {
    this.loadTenants();
  }

  toggleForm() {
    this.showForm = !this.showForm;
    this.cdr.markForCheck();
  }

  loadTenants() {
    this.loading = true;
    this.cdr.markForCheck();

    this.svc.list()
      .pipe(finalize(() => {
        this.loading = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: (data) => {
          this.tenants = data;
        },
        error: (err) => {
          console.error(err);
          this.toast.err('Error al cargar tenants');
        }
      });
  }

  createTenant() {
    if (this.form.invalid) return;

    this.loading = true;
    this.cdr.markForCheck();
    const model = this.form.value as CreateTenantRequest;

    this.svc.create(model)
      .pipe(finalize(() => {
        this.loading = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: (t) => {
          this.tenants = [t, ...this.tenants];
          this.toast.ok(`✅ Tenant "${t.nombre}" creado correctamente`);
          this.form.reset({ adminPassword: 'Admin123!' });
          this.showForm = false;
        },
        error: (err) => {
          this.toast.err(`❌ Error al crear tenant:\n${err.error || 'Error desconocido'}`);
        }
      });
  }

  trackById(_index: number, item: Tenant) {
    return item.id;
  }

  verDetalle(t: Tenant) {
  console.log('👁️ Ver detalle de tenant:', t);
  this.toast.ok(`Detalle de "${t.nombre}" (pendiente de implementar)`);
}

  editarTenant(t: Tenant) {
    console.log('✏️ Editar tenant:', t);
    this.toast.ok(`Modo edición activado para "${t.nombre}"`);
  }

  eliminarTenant(t: Tenant) {
    if (confirm(`¿Seguro que deseas eliminar el tenant "${t.nombre}"?`)) {
      console.log('🗑️ Eliminando tenant:', t);
      this.toast.ok(`"${t.nombre}" eliminado (simulado)`);
      // Aquí puedes agregar el DELETE real más adelante
    }
  }

}

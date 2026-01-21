import { Directive, Input, TemplateRef, ViewContainerRef, inject, effect } from '@angular/core';
import { AuthService } from '../auth/auth.service';

/**
 * *appCan="'Admin'"             -> requiere Admin
 * *appCan="['Admin','Vendedor']"-> requiere alguno
 * 
 * <a routerLink="/admin/usuarios" *appCan="'Admin'">Usuarios</a>
 * <button *appCan="['Admin','Optometrista']">Editar receta</button>
 */
@Directive({ selector: '[appCan]' })
export class CanDirective {
  private tpl = inject(TemplateRef<any>);
  private vcr = inject(ViewContainerRef);
  private auth = inject(AuthService);
  private allowed: string[] = [];

  @Input() set appCan(value: string | string[]) {
    this.allowed = Array.isArray(value) ? value : [value];
    this.update();
  }

  constructor() {
    effect(() => { this.auth.user(); this.update(); });
  }

  private update(){
    const roles = this.auth.user()?.roles ?? [];
    const ok = this.allowed.length === 0 || roles.some(r => this.allowed.includes(r));
    this.vcr.clear();
    if (ok) this.vcr.createEmbeddedView(this.tpl);
  }
}

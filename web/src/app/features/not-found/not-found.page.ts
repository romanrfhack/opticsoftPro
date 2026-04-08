import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-not-found',
  imports: [RouterLink],
  template: `
  <div class="h-[60vh] grid place-items-center">
    <div class="text-center">
      <h1 class="text-4xl font-bold mb-2">404</h1>
      <p class="text-gray-600 mb-6">La página que buscas no existe.</p>
      <a routerLink="/" class="btn btn-primary">Volver al inicio</a>
    </div>
  </div>
  `
})
export class NotFoundPage {}

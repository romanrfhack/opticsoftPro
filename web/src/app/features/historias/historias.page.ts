import { Component } from '@angular/core';
import { NgIf } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-historias',
  imports: [],
  template: `
  <section class="space-y-4">
    <header class="flex items-center justify-between">
      <h1 class="text-2xl font-bold">Historias clínicas</h1>
    </header>
    <div class="card p-6">
      <p class="text-gray-600">Captura de historia clínica y recetas (Rx).</p>
      <p class="mt-2 text-sm text-gray-500">Empieza aquí la funcionalidad de <strong>Historias clínicas</strong>.</p>
    </div>
  </section>
  `
})
export class HistoriasPage { }

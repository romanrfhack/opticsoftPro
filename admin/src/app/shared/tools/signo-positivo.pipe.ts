import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'signoPositivo',
  standalone: true
})
export class SignoPositivoPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    if (value === null || value === undefined) return '';
    
    const formattedValue = this.formatOptometryValue(value);
    
    if (value > 0) {
      return `+${formattedValue}`;
    }
    
    return formattedValue;
  }

  private formatOptometryValue(value: number): string {
    // Para valores optométricos, siempre mostrar 2 decimales
    // Esto maneja casos como 2 -> 2.00, 1.5 -> 1.50, 0.25 -> 0.25
    return value.toFixed(2);
  }
}
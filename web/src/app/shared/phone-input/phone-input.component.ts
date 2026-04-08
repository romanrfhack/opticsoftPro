import { CommonModule } from '@angular/common';
import { Component, forwardRef, Input } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, NG_VALIDATORS, Validator, AbstractControl, ValidationErrors } from '@angular/forms';

@Component({
  selector: 'app-phone-input',
  templateUrl: './phone-input.component.html',
  imports: [CommonModule],  
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => PhoneInputComponent), multi: true },
    { provide: NG_VALIDATORS, useExisting: forwardRef(() => PhoneInputComponent), multi: true },
  ]
})
export class PhoneInputComponent implements ControlValueAccessor, Validator {
  @Input() label = 'Teléfono';
  @Input() placeholder = '55 1234 5678';
  @Input() required = false;
  @Input() showIcon = true;
  @Input() disabled = false;

  value = '';     // valor formateado: "55 1234 5678"
  touched = false;
  onChange = (_: any) => {};
  onTouched = () => {};

  writeValue(raw: string | null): void {
    const clean = (raw ?? '').replace(/\D/g, '').slice(0, 10);
    this.value = this.format(clean);
  }

  registerOnChange(fn: any): void { this.onChange = fn; }
  registerOnTouched(fn: any): void { this.onTouched = fn; }
  setDisabledState(isDisabled: boolean) { this.disabled = isDisabled; }

  // Validación: exactamente 10 dígitos
  validate(_: AbstractControl): ValidationErrors | null {
    const digits = this.value.replace(/\D/g, '');
    if (this.required && digits.length === 0) return { required: true };
    return digits.length === 10 ? null : { phone10: true };
  }

  // Manejo de input
  handleInput(ev: Event) {
    const target = ev.target as HTMLInputElement;
    const digits = target.value.replace(/\D/g, '').slice(0, 10);
    const formatted = this.format(digits);
    this.value = formatted;

    // Emitimos al form el valor sin espacios (solo dígitos) para guardar limpio
    this.onChange(digits);
  }

  handleKeypress(ev: KeyboardEvent) {
    const c = ev.key;
    if (!/[0-9]/.test(c)) ev.preventDefault();
  }

  onBlur() {
    this.markTouched();
  }

  private markTouched() {
    if (!this.touched) {
      this.onTouched();
      this.touched = true;
    }
  }

  private format(d: string): string {
    if (d.length <= 2) return d;
    if (d.length <= 6) return `${d.slice(0,2)} ${d.slice(2)}`;
    return `${d.slice(0,2)} ${d.slice(2,6)} ${d.slice(6)}`;
  }
}

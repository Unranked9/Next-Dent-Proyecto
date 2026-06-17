export type ErroresFormulario<T> = Partial<Record<keyof T, string>>;

export function validarRequerido(valor: string, nombreCampo: string): string | undefined {
  if (!valor || valor.trim() === '') return `${nombreCampo} es obligatorio.`;
  return undefined;
}

export function validarTelefono(valor: string): string | undefined {
  if (!valor) return undefined;
  const soloDigitos = /^\+?[\d\s\-()]{7,15}$/;
  if (!soloDigitos.test(valor)) return 'Teléfono inválido (7-15 dígitos).';
  return undefined;
}

export function validarFecha(valor: string): string | undefined {
  if (!valor) return 'La fecha es obligatoria.';
  const fecha = new Date(valor);
  if (isNaN(fecha.getTime())) return 'Fecha inválida.';
  return undefined;
}

export function validarFechaFutura(valor: string): string | undefined {
  const base = validarFecha(valor);
  if (base) return base;
  const fecha = new Date(valor);
  const ahora = new Date(); // ← sin setHours, conserva la hora actual
  if (fecha < ahora) return 'La fecha y hora no pueden ser en el pasado.';
  return undefined;
}

export function validarFechaNoFutura(valor: string): string | undefined {
  const base = validarFecha(valor);
  if (base) return base;
  const fecha = new Date(valor);
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  if (fecha > hoy) return 'La fecha no puede ser futura.';
  return undefined;
}

export function validarMonto(valor: number | string): string | undefined {
  const num = Number(valor);
  if (isNaN(num) || num <= 0) return 'El monto debe ser mayor a 0.';
  return undefined;
}

export function hayErrores<T>(errores: ErroresFormulario<T>): boolean {
  return Object.values(errores).some(Boolean);
}

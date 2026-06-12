import type { Cita } from '../types/cita';

export function getDiasDeSemana(offset: number): Date[] {
  const hoy = new Date();
  const dayOfWeek = hoy.getDay(); // 0=Dom, 1=Lun … 6=Sáb
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const lunes = new Date(hoy);
  lunes.setDate(hoy.getDate() + diffToMonday + offset * 7);
  lunes.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(lunes);
    d.setDate(lunes.getDate() + i);
    return d;
  });
}

const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

export function formatRangoSemana(dias: Date[]): string {
  const ini = dias[0];
  const fin = dias[6];
  if (ini.getMonth() === fin.getMonth() && ini.getFullYear() === fin.getFullYear()) {
    return `${ini.getDate()} — ${fin.getDate()} ${MESES[fin.getMonth()]} ${fin.getFullYear()}`;
  }
  return `${ini.getDate()} ${MESES[ini.getMonth()]} — ${fin.getDate()} ${MESES[fin.getMonth()]} ${fin.getFullYear()}`;
}

export function citaEnDia(cita: Cita, dia: Date): boolean {
  if (!cita.fecha) return false;
  const [y, m, d] = cita.fecha.split('-').map(Number);
  return dia.getFullYear() === y && dia.getMonth() + 1 === m && dia.getDate() === d;
}

// 08:00 = 0px, cada hora = 60px, duración mínima renderizada = 30px
export function calcularPosicionBloque(
  hora: string,
  duracionMinutos: number,
): { topPx: number; heightPx: number } {
  const [h, m] = hora.split(':').map(Number);
  const topPx = (h - 8) * 60 + m;
  const heightPx = Math.max(duracionMinutos, 30);
  return { topPx, heightPx };
}

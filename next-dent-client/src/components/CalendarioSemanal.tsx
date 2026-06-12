import { useMemo } from 'react';
import type { Cita } from '../types/cita';
import { getDiasDeSemana, citaEnDia, calcularPosicionBloque } from '../utils/fechas';

interface CalendarioSemanalProps {
  citas: Cita[];
  semanaOffset: number;
  onCitaClick: (cita: Cita) => void;
}

const HORAS = Array.from({ length: 13 }, (_, i) => i + 8); // 08 … 20
const DIAS_CORTOS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

const ESTADO_BLOQUE: Record<string, string> = {
  Pendiente:  'bg-amber-100 border-amber-400 text-amber-800',
  Confirmada: 'bg-indigo-100 border-indigo-400 text-indigo-800',
  Completada: 'bg-emerald-100 border-emerald-400 text-emerald-800',
  Cancelada:  'bg-red-100 border-red-300 text-red-500 opacity-60',
};

const GRID_COLS = '60px repeat(7, 1fr)';

function esFueraDeRango(hora: string): boolean {
  return parseInt(hora.split(':')[0], 10) >= 20 || parseInt(hora.split(':')[0], 10) < 8;
}

function getNombrePaciente(cita: Cita): string {
  if (cita.paciente) return `${cita.paciente.nombre} ${cita.paciente.apellido}`;
  return 'Paciente';
}

export default function CalendarioSemanal({ citas, semanaOffset, onCitaClick }: CalendarioSemanalProps) {
  const dias = useMemo(() => getDiasDeSemana(semanaOffset), [semanaOffset]);
  const hoy = new Date();

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      {/* Cabecera días */}
      <div
        className="grid border-b border-slate-200 sticky top-0 bg-white z-30"
        style={{ gridTemplateColumns: GRID_COLS }}
      >
        <div className="border-r border-slate-100 py-3" />
        {dias.map((dia, idx) => {
          const esHoy = dia.toDateString() === hoy.toDateString();
          return (
            <div
              key={idx}
              className={`py-2 text-center border-r border-slate-100 last:border-r-0 ${esHoy ? 'bg-indigo-50' : ''}`}
            >
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                {DIAS_CORTOS[idx]}
              </p>
              <p className={`text-lg font-bold mt-0.5 ${esHoy ? 'text-indigo-600' : 'text-slate-700'}`}>
                {dia.getDate()}
              </p>
            </div>
          );
        })}
      </div>

      {/* Cuerpo scrollable */}
      <div className="overflow-y-auto" style={{ maxHeight: '600px' }}>
        <div className="grid" style={{ gridTemplateColumns: GRID_COLS }}>

          {/* Columna de horas */}
          <div className="border-r border-slate-100">
            {HORAS.map((h) => (
              <div
                key={h}
                className="flex items-start justify-end pr-2 pt-1 border-b border-slate-50"
                style={{ height: '60px' }}
              >
                <span className="text-xs text-slate-400 leading-none">
                  {String(h).padStart(2, '0')}:00
                </span>
              </div>
            ))}
          </div>

          {/* Columnas de días */}
          {dias.map((dia, diaIdx) => {
            const citasDelDia = citas.filter((c) => citaEnDia(c, dia));
            const citasFuera = citasDelDia.filter((c) => c.hora && esFueraDeRango(c.hora));
            const citasDentro = citasDelDia.filter((c) => c.hora && !esFueraDeRango(c.hora));

            return (
              <div
                key={diaIdx}
                className="relative border-r border-slate-100 last:border-r-0"
                style={{ height: `${HORAS.length * 60}px` }}
              >
                {/* Líneas de hora */}
                {HORAS.map((h) => (
                  <div
                    key={h}
                    className="absolute w-full border-b border-slate-50"
                    style={{ top: `${(h - 8) * 60}px`, height: '60px' }}
                  />
                ))}

                {/* Bloques dentro del rango 08:00–20:00 */}
                {citasDentro.map((cita) => {
                  const { topPx, heightPx } = calcularPosicionBloque(cita.hora!, 30);
                  const clases = ESTADO_BLOQUE[cita.estado] ?? 'bg-slate-100 border-slate-300 text-slate-700';
                  return (
                    <button
                      key={cita.idCita}
                      onClick={() => onCitaClick(cita)}
                      title={getNombrePaciente(cita)}
                      className={`absolute left-0.5 right-0.5 border-l-2 rounded text-left px-1 py-0.5 overflow-hidden cursor-pointer hover:brightness-95 transition-all z-10 ${clases}`}
                      style={{ top: `${topPx}px`, height: `${heightPx}px` }}
                    >
                      <p className="text-xs font-semibold truncate leading-tight">
                        {cita.hora!.slice(0, 5)} {getNombrePaciente(cita)}
                      </p>
                      {cita.motivo && (
                        <p className="text-xs leading-tight truncate opacity-75">
                          {cita.motivo.slice(0, 20)}
                        </p>
                      )}
                    </button>
                  );
                })}

                {/* Citas fuera del rango: al inicio del día con ⚠️ */}
                {citasFuera.map((cita, i) => {
                  const clases = ESTADO_BLOQUE[cita.estado] ?? 'bg-slate-100 border-slate-300 text-slate-700';
                  return (
                    <button
                      key={cita.idCita}
                      onClick={() => onCitaClick(cita)}
                      title={`Fuera de horario — ${cita.hora?.slice(0, 5)} ${getNombrePaciente(cita)}`}
                      className={`absolute left-0.5 right-0.5 border-l-2 rounded text-left px-1 py-0.5 overflow-hidden cursor-pointer hover:brightness-95 transition-all z-20 ${clases}`}
                      style={{ top: `${i * 30}px`, height: '28px' }}
                    >
                      <p className="text-xs font-semibold truncate leading-tight">
                        ⚠️ {cita.hora!.slice(0, 5)} {getNombrePaciente(cita)}
                      </p>
                    </button>
                  );
                })}
              </div>
            );
          })}

        </div>
      </div>
    </div>
  );
}

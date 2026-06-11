import { useEffect, useState, useCallback } from 'react';
import type { OdontogramaMultipieza, DienteEstado } from '../types/odontograma';

interface LineaCalculada extends OdontogramaMultipieza {
  x1: number;
  x2: number;
  yApices: number;
  yCoronas: number;
  isTratado: boolean;
}

export default function CapaMultipieza({
  tratamientos,
  dientes = []
}: {
  tratamientos: OdontogramaMultipieza[];
  dientes?: DienteEstado[];
}) {
  const [lineas, setLineas] = useState<LineaCalculada[]>([]);

  const calcularCoordenadas = useCallback(() => {
    const contenedor = document.getElementById('mapa-dientes-container');
    if (!contenedor) return;
    const rectContenedor = contenedor.getBoundingClientRect();

    const nuevasLineas = tratamientos.map((t) => {
      const elInicio = document.getElementById(`diente-${t.piezaInicio}`);
      const elFin    = document.getElementById(`diente-${t.piezaFin}`);
      if (!elInicio || !elFin) return null;

      const rInicio = elInicio.getBoundingClientRect();
      const rFin    = elFin.getBoundingClientRect();

      const x1 = (rInicio.left - rectContenedor.left) + (rInicio.width / 2);
      const x2 = (rFin.left   - rectContenedor.left) + (rFin.width   / 2);

      const isUpper  = [1, 2, 5, 6].includes(Math.floor(t.piezaInicio / 10));
      const yApices  = isUpper
        ? (rInicio.top - rectContenedor.top) - 5
        : (rInicio.top - rectContenedor.top) + rInicio.height + 5;
      const yCoronas = isUpper
        ? (rInicio.top - rectContenedor.top) + (rInicio.height * 0.75)
        : (rInicio.top - rectContenedor.top) + (rInicio.height * 0.25);

      const inicioFdi = Math.min(t.piezaInicio, t.piezaFin);
      const finFdi = Math.max(t.piezaInicio, t.piezaFin);

      const isTratado = dientes.some(d =>
        d.numeroFdi >= inicioFdi && d.numeroFdi <= finFdi &&
        (d.condicionGeneral === 'TRATADO' || d.condicionGeneral === 'REALIZADO' ||
         d.estadoClinico === 'TRATADO' || d.estadoClinico === 'REALIZADO')
      );

      return { ...t, x1: Math.min(x1, x2), x2: Math.max(x1, x2), yApices, yCoronas, isTratado };
    }).filter(Boolean) as LineaCalculada[];

    setLineas(nuevasLineas);
  }, [tratamientos, dientes]);

  useEffect(() => {
    calcularCoordenadas();
    window.addEventListener('resize', calcularCoordenadas);
    return () => window.removeEventListener('resize', calcularCoordenadas);
  }, [calcularCoordenadas]);

  if (lineas.length === 0) return null;

  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none z-20">
      {lineas.map((linea, index) => {
        const color = linea.isTratado ? '#3b82f6' : (linea.color === 'ROJO' ? '#ef4444' : '#3b82f6');

        if (linea.tipoTratamiento === 'PROTESIS_FIJA') {
          return (
            <g key={index}>
              <line x1={linea.x1} y1={linea.yApices}  x2={linea.x2} y2={linea.yApices}  stroke={color} strokeWidth="2.5" strokeLinecap="round" />
              <line x1={linea.x1} y1={linea.yApices}  x2={linea.x1} y2={linea.yCoronas} stroke={color} strokeWidth="2.5" />
              <line x1={linea.x2} y1={linea.yApices}  x2={linea.x2} y2={linea.yCoronas} stroke={color} strokeWidth="2.5" />
            </g>
          );
        }

        if (linea.tipoTratamiento === 'PROTESIS_REMOVIBLE') {
          const offset = 4;
          return (
            <g key={index}>
              <line x1={linea.x1} y1={linea.yApices - offset} x2={linea.x2} y2={linea.yApices - offset} stroke={color} strokeWidth="2" strokeLinecap="round" />
              <line x1={linea.x1} y1={linea.yApices + offset} x2={linea.x2} y2={linea.yApices + offset} stroke={color} strokeWidth="2" strokeLinecap="round" />
            </g>
          );
        }
        return null;
      })}
    </svg>
  );
}

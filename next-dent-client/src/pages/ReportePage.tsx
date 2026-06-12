import { useState } from 'react';
import type { PagoPorDia, PagoReporte } from '../types/reporte';
import { getReporte } from '../services/pagoService';

// ─── helpers ────────────────────────────────────────────────────────────────

function hoy(): string {
  return new Date().toISOString().split('T')[0];
}

function primerDiaMes(): string {
  const d = new Date();
  d.setDate(1);
  return d.toISOString().split('T')[0];
}

function formatFecha(iso: string): string {
  const [y, m, d] = iso.split('-');
  const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  return `${d} ${meses[parseInt(m) - 1]} ${y}`;
}

// ─── Gráfico SVG ─────────────────────────────────────────────────────────────

function GraficoBarras({ datos }: { datos: PagoPorDia[] }) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (datos.length === 0) {
    return (
      <svg viewBox="0 0 600 300" className="w-full h-full">
        <text x="300" y="150" textAnchor="middle" fill="#94a3b8" fontSize="14">
          Sin datos para el período seleccionado
        </text>
      </svg>
    );
  }

  const W = 600;
  const H = 300;
  const paddingLeft = 56;
  const paddingRight = 16;
  const paddingTop = 24;
  const paddingBottom = 48;
  const chartW = W - paddingLeft - paddingRight;
  const chartH = H - paddingTop - paddingBottom;

  const maxMonto = Math.max(...datos.map((d) => d.monto), 1);
  const barCount = datos.length;
  const barGap = Math.max(2, chartW / barCount * 0.2);
  const barWidth = Math.max(4, chartW / barCount - barGap);

  const yLines = 5;
  const yStep = maxMonto / yLines;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full">
      {/* Líneas guía horizontales */}
      {Array.from({ length: yLines + 1 }, (_, i) => {
        const y = paddingTop + chartH - (i / yLines) * chartH;
        const val = yStep * i;
        return (
          <g key={i}>
            <line x1={paddingLeft} x2={W - paddingRight} y1={y} y2={y} stroke="#e2e8f0" strokeWidth="1" />
            <text x={paddingLeft - 6} y={y + 4} textAnchor="end" fill="#94a3b8" fontSize="10">
              {val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val.toFixed(0)}
            </text>
          </g>
        );
      })}

      {/* Barras */}
      {datos.map((dia, i) => {
        const barH = Math.max(2, (dia.monto / maxMonto) * chartH);
        const x = paddingLeft + i * (barWidth + barGap) + barGap / 2;
        const y = paddingTop + chartH - barH;
        const isHovered = hoveredIndex === i;
        const labelDay = dia.fecha.split('-')[2];

        return (
          <g key={dia.fecha}>
            <rect
              x={x}
              y={y}
              width={barWidth}
              height={barH}
              fill={isHovered ? '#4F46E5' : '#6366F1'}
              rx="4"
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
              style={{ cursor: 'default', transition: 'fill 0.1s' }}
            />
            {/* Tooltip */}
            {isHovered && (
              <g>
                <rect
                  x={x + barWidth / 2 - 36}
                  y={y - 28}
                  width={72}
                  height={22}
                  fill="#1e293b"
                  rx="4"
                />
                <text
                  x={x + barWidth / 2}
                  y={y - 13}
                  textAnchor="middle"
                  fill="#f8fafc"
                  fontSize="11"
                  fontWeight="500"
                >
                  S/ {dia.monto.toFixed(2)}
                </text>
              </g>
            )}
            {/* Etiqueta eje X */}
            {barCount <= 31 && (
              <text
                x={x + barWidth / 2}
                y={H - paddingBottom + 14}
                textAnchor="middle"
                fill="#94a3b8"
                fontSize="9"
              >
                {labelDay}
              </text>
            )}
          </g>
        );
      })}

      {/* Línea base */}
      <line
        x1={paddingLeft}
        x2={W - paddingRight}
        y1={paddingTop + chartH}
        y2={paddingTop + chartH}
        stroke="#cbd5e1"
        strokeWidth="1"
      />
    </svg>
  );
}

// ─── Página ───────────────────────────────────────────────────────────────────

export default function ReportePage() {
  const [desde, setDesde] = useState<string>(primerDiaMes);
  const [hasta, setHasta] = useState<string>(hoy);
  const [reporte, setReporte] = useState<PagoReporte | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generarReporte() {
    setCargando(true);
    setError(null);
    try {
      const data = await getReporte(desde, hasta);
      setReporte(data);
    } catch {
      setError('No se pudo cargar el reporte. Verificá que el servidor esté activo.');
    } finally {
      setCargando(false);
    }
  }

  function aplicarAtajo(tipo: 'semana' | 'mes' | 'mesAnterior') {
    const hoyDate = new Date();
    if (tipo === 'semana') {
      const lunes = new Date(hoyDate);
      lunes.setDate(hoyDate.getDate() - ((hoyDate.getDay() + 6) % 7));
      setDesde(lunes.toISOString().split('T')[0]);
      setHasta(hoy());
    } else if (tipo === 'mes') {
      const primero = new Date(hoyDate.getFullYear(), hoyDate.getMonth(), 1);
      setDesde(primero.toISOString().split('T')[0]);
      setHasta(hoy());
    } else {
      const primero = new Date(hoyDate.getFullYear(), hoyDate.getMonth() - 1, 1);
      const ultimo = new Date(hoyDate.getFullYear(), hoyDate.getMonth(), 0);
      setDesde(primero.toISOString().split('T')[0]);
      setHasta(ultimo.toISOString().split('T')[0]);
    }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Reporte de Ingresos</h1>
        <p className="text-sm text-slate-500 mt-0.5">Análisis de recaudación por período</p>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-5">
        {/* Atajos */}
        <div className="flex gap-2 mb-3">
          {[
            { label: 'Esta semana', tipo: 'semana' as const },
            { label: 'Este mes', tipo: 'mes' as const },
            { label: 'Mes anterior', tipo: 'mesAnterior' as const },
          ].map(({ label, tipo }) => (
            <button
              key={tipo}
              onClick={() => aplicarAtajo(tipo)}
              className="px-3 py-1.5 text-xs font-medium rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-colors"
            >
              {label}
            </button>
          ))}
        </div>

        {/* Selectores + botón */}
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Desde</label>
            <input
              type="date"
              value={desde}
              onChange={(e) => setDesde(e.target.value)}
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Hasta</label>
            <input
              type="date"
              value={hasta}
              onChange={(e) => setHasta(e.target.value)}
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          <button
            onClick={generarReporte}
            disabled={cargando}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {cargando ? (
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="32" strokeDashoffset="12" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            )}
            Generar reporte
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Resultados */}
      {reporte && (
        <>
          {/* KPI cards + Gráfico */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
            {/* KPIs */}
            <div className="flex flex-col gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
                  Total recaudado
                </p>
                <p className="text-3xl font-bold text-slate-800">
                  S/ {reporte.totalPeriodo.toFixed(2)}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {formatFecha(desde)} — {formatFecha(hasta)}
                </p>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
                  Pagos registrados
                </p>
                <p className="text-3xl font-bold text-slate-800">{reporte.totalPagos}</p>
                <p className="text-xs text-slate-400 mt-1">
                  {reporte.porDia.length} día{reporte.porDia.length !== 1 ? 's' : ''} con movimiento
                </p>
              </div>
            </div>

            {/* Gráfico */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5">
              <p className="text-sm font-medium text-slate-700 mb-3">Ingresos por día</p>
              <div className="h-[260px]">
                <GraficoBarras datos={reporte.porDia} />
              </div>
            </div>
          </div>

          {/* Tabla */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <p className="text-sm font-medium text-slate-700 mb-4">Detalle por día</p>
            {reporte.porDia.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">
                No hay pagos en el período seleccionado.
              </p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-2 text-slate-500 font-medium">Fecha</th>
                    <th className="text-right py-2 text-slate-500 font-medium">Pagos</th>
                    <th className="text-right py-2 text-slate-500 font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {reporte.porDia.map((dia) => (
                    <tr key={dia.fecha} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-2 text-slate-700">{formatFecha(dia.fecha)}</td>
                      <td className="py-2 text-right text-slate-600">{dia.cantidadPagos}</td>
                      <td className="py-2 text-right font-medium text-slate-800">
                        S/ {dia.monto.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="font-semibold text-slate-800 border-t border-slate-200">
                    <td className="py-3">Total</td>
                    <td className="py-3 text-right">{reporte.totalPagos}</td>
                    <td className="py-3 text-right">S/ {reporte.totalPeriodo.toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            )}
          </div>
        </>
      )}

      {/* Estado vacío inicial */}
      {!reporte && !cargando && !error && (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <svg className="w-12 h-12 mb-3 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p className="text-sm">Seleccioná un período y hacé click en <strong>Generar reporte</strong></p>
        </div>
      )}
    </div>
  );
}

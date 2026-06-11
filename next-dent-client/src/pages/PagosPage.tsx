import { useEffect, useState } from 'react';
import { getPagos, registrarAbono } from '../services/pagoService';
import { getCitas } from '../services/citaService';
import { getTratamientos } from '../services/tratamientoService';
import type { Pago } from '../types/pago';
import type { Cita } from '../types/cita';
import type { Tratamiento } from '../types/tratamiento';

type MedioPago = 'Efectivo' | 'Yape' | 'Plin' | 'Tarjeta';

interface DeudaRow {
  idCita: number;
  paciente: string;
  tratamiento: string;
  total: number;
  pagado: number;
  saldo: number;
  montoAbonar: string;
}

interface ConfirmData {
  items: { tratamiento: string; paciente: string; abonado: number; pendiente: number }[];
  totalAbonado: number;
  medioPago: MedioPago;
}

const MEDIOS: { value: MedioPago; label: string }[] = [
  { value: 'Efectivo', label: 'Efectivo' },
  { value: 'Yape', label: 'Yape' },
  { value: 'Plin', label: 'Plin' },
  { value: 'Tarjeta', label: 'Tarjeta' },
];

const MEDIO_STYLE: Record<MedioPago, string> = {
  Efectivo: 'border-green-500 bg-green-50 text-green-700',
  Yape:     'border-purple-500 bg-purple-50 text-purple-700',
  Plin:     'border-blue-500 bg-blue-50 text-blue-700',
  Tarjeta:  'border-orange-500 bg-orange-50 text-orange-700',
};

const MEDIO_ICON: Record<MedioPago, string> = {
  Efectivo: '💵',
  Yape:     '📱',
  Plin:     '📲',
  Tarjeta:  '💳',
};

const fmt = (n: number) => `S/ ${n.toFixed(2)}`;

const efectivo = (row: DeudaRow) => {
  const v = parseFloat(row.montoAbonar);
  return isNaN(v) || v < 0 ? 0 : Math.min(v, row.saldo);
};

export default function PagosPage() {
  const [pagos, setPagos]               = useState<Pago[]>([]);
  const [citas, setCitas]               = useState<Cita[]>([]);
  const [tratamientos, setTratamientos] = useState<Tratamiento[]>([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);

  const [deudas, setDeudas]           = useState<DeudaRow[]>([]);
  const [busqueda, setBusqueda]       = useState('');
  const [medioPago, setMedioPago]     = useState<MedioPago>('Efectivo');
  const [procesando, setProcesando]   = useState(false);
  const [procesError, setProcesError] = useState<string | null>(null);
  const [confirmData, setConfirmData] = useState<ConfirmData | null>(null);

  const fetchAll = async () => {
    try {
      const [p, c, t] = await Promise.all([getPagos(), getCitas(), getTratamientos()]);
      setPagos(p);
      setCitas(c);
      setTratamientos(t);
    } catch {
      setError('No se pudo conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  useEffect(() => {
    const pagadoPorCita: Record<number, number> = {};
    pagos.forEach((p) => {
      pagadoPorCita[p.idCita] = (pagadoPorCita[p.idCita] ?? 0) + p.monto;
    });

    const rows: DeudaRow[] = citas
      .filter((c) => c.estado === 'Completada' || c.estado === 'Pendiente')
      .flatMap((c) => {
        if (!c.idCita) return [];
        const trat  = tratamientos.find((t) => t.idTrat === c.idTra);
        const total  = trat?.costo ?? 0;
        const pagado = pagadoPorCita[c.idCita] ?? 0;
        const saldo  = Math.max(0, total - pagado);
        if (saldo === 0) return [];
        return [{
          idCita:      c.idCita,
          paciente:    `${c.paciente.nombre} ${c.paciente.apellido}`,
          tratamiento: trat?.descripcion ?? '—',
          total,
          pagado,
          saldo,
          montoAbonar: '',
        }];
      });

    setDeudas(rows);
  }, [pagos, citas, tratamientos]);

  const q = busqueda.trim().toLowerCase();
  const deudasFiltradas = q
    ? deudas.filter((d) => d.paciente.toLowerCase().includes(q) || d.tratamiento.toLowerCase().includes(q))
    : deudas;

  const totalDeuda = deudasFiltradas.reduce((a, r) => a + r.saldo, 0);
  const montoHoy   = deudasFiltradas.reduce((a, r) => a + efectivo(r), 0);
  const nuevoSaldo = totalDeuda - montoHoy;

  const updateMonto = (idCita: number, value: string) =>
    setDeudas((prev) => prev.map((r) => r.idCita === idCita ? { ...r, montoAbonar: value } : r));

  const abonarTodo = (idCita: number) =>
    setDeudas((prev) => prev.map((r) => r.idCita === idCita ? { ...r, montoAbonar: r.saldo.toFixed(2) } : r));

  const handleProcesar = async () => {
    const toProcess = deudasFiltradas
      .map((r) => ({ ...r, mEfectivo: efectivo(r) }))
      .filter((r) => r.mEfectivo > 0);

    if (!toProcess.length) return;

    const totalAbonar = toProcess.reduce((a, r) => a + r.mEfectivo, 0);

    setProcesando(true);
    setProcesError(null);

    try {
      for (const row of toProcess) {
        await registrarAbono(row.idCita, row.mEfectivo, medioPago);
      }

      const [p, c, t] = await Promise.all([getPagos(), getCitas(), getTratamientos()]);
      setPagos(p);
      setCitas(c);
      setTratamientos(t);

      setConfirmData({
        items: toProcess.map((r) => ({
          tratamiento: r.tratamiento,
          paciente:    r.paciente,
          abonado:     r.mEfectivo,
          pendiente:   Math.max(0, r.saldo - r.mEfectivo),
        })),
        totalAbonado: totalAbonar,
        medioPago,
      });
    } catch {
      setProcesError('Error al procesar el pago. Intenta de nuevo.');
    } finally {
      setProcesando(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-500">Cargando...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl max-w-md text-center">
        <p className="font-semibold">Error</p>
        <p className="text-sm mt-1">{error}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Caja / Pagos</h1>
          <p className="text-sm text-gray-500 mt-1">
            {deudasFiltradas.length} deuda{deudasFiltradas.length !== 1 ? 's' : ''} pendiente{deudasFiltradas.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="flex gap-6 items-start">

          {/* ── Panel principal ── */}
          <div className="flex-1 min-w-0 space-y-4">

            {/* Buscador */}
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z" />
              </svg>
              <input
                type="text"
                placeholder="Buscar por paciente o tratamiento..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Tabla de Deudas */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-5 py-3.5 border-b border-gray-100 bg-gray-50/60">
                <h2 className="text-sm font-semibold text-gray-700">Deudas Pendientes</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/30">
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Paciente</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Tratamiento</th>
                      <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Total</th>
                      <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Pagado a la fecha</th>
                      <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Saldo Pendiente</th>
                      <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Monto a Abonar</th>
                      <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deudasFiltradas.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-5 py-14 text-center text-gray-400">
                          {busqueda ? 'Sin resultados para esa búsqueda.' : 'No hay deudas pendientes.'}
                        </td>
                      </tr>
                    ) : (
                      deudasFiltradas.map((row, i) => {
                        const val    = parseFloat(row.montoAbonar);
                        const isOver = !isNaN(val) && val > row.saldo;
                        const active = !isNaN(val) && val > 0;
                        return (
                          <tr
                            key={row.idCita}
                            className={`border-b border-gray-50 transition-colors ${
                              active ? 'bg-blue-50/25' : i % 2 === 0 ? 'bg-white' : 'bg-gray-50/25'
                            }`}
                          >
                            <td className="px-5 py-3.5 font-medium text-gray-900 whitespace-nowrap">{row.paciente}</td>
                            <td className="px-5 py-3.5 text-gray-700">{row.tratamiento}</td>
                            <td className="px-5 py-3.5 text-right font-mono text-gray-700 whitespace-nowrap">{fmt(row.total)}</td>
                            <td className="px-5 py-3.5 text-right font-mono text-gray-500 whitespace-nowrap">{fmt(row.pagado)}</td>
                            <td className="px-5 py-3.5 text-right font-mono whitespace-nowrap">
                              <span className="font-semibold text-red-500">{fmt(row.saldo)}</span>
                            </td>
                            <td className="px-5 py-3.5">
                              <div className="flex flex-col items-center gap-1">
                                <div className="relative">
                                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none select-none">S/</span>
                                  <input
                                    type="number"
                                    min="0"
                                    max={row.saldo}
                                    step="0.01"
                                    value={row.montoAbonar}
                                    onChange={(e) => updateMonto(row.idCita, e.target.value)}
                                    placeholder="0.00"
                                    className={`w-28 pl-8 pr-2 py-1.5 text-sm text-right border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                                      isOver
                                        ? 'border-red-400 bg-red-50 text-red-700 focus:ring-red-300'
                                        : 'border-gray-200 bg-white text-gray-900 focus:ring-blue-400'
                                    }`}
                                  />
                                </div>
                                {isOver && (
                                  <span className="text-xs text-red-500">Supera el saldo</span>
                                )}
                              </div>
                            </td>
                            <td className="px-5 py-3.5 text-center">
                              <button
                                onClick={() => abonarTodo(row.idCita)}
                                className="text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                              >
                                Abonar Todo
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Historial de pagos */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-5 py-3.5 border-b border-gray-100 bg-gray-50/60">
                <h2 className="text-sm font-semibold text-gray-700">Historial de Pagos</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/30">
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">ID</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Cita</th>
                      <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Monto</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Fecha</th>
                      <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagos.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-5 py-8 text-center text-gray-400">No hay pagos registrados.</td>
                      </tr>
                    ) : (
                      pagos.map((p, i) => (
                        <tr key={p.idPago ?? i} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                          <td className="px-5 py-3 text-gray-400 font-mono text-xs">{p.idPago}</td>
                          <td className="px-5 py-3 text-gray-600 font-mono text-xs">#{p.idCita}</td>
                          <td className="px-5 py-3 text-right font-mono font-semibold text-gray-900">{fmt(p.monto)}</td>
                          <td className="px-5 py-3 text-gray-600 text-xs whitespace-nowrap">{p.fechaPago}</td>
                          <td className="px-5 py-3 text-center">
                            <span className="bg-green-100 text-green-700 rounded-full px-2.5 py-0.5 text-xs font-semibold">Pagado</span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          {/* ── Sidebar ── */}
          <div className="w-72 flex-shrink-0 space-y-4 sticky top-6">

            {/* Resumen de Caja */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 bg-gradient-to-br from-blue-600 to-blue-500">
                <h2 className="text-sm font-semibold text-white">Resumen de Caja</h2>
                {busqueda && (
                  <p className="text-xs text-blue-200 mt-0.5 truncate">Filtrando: "{busqueda}"</p>
                )}
              </div>
              <div className="p-5 divide-y divide-gray-100">

                <div className="pb-4">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Deuda del Paciente</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1 font-mono">{fmt(totalDeuda)}</p>
                </div>

                <div className="py-4">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Monto a Pagar Hoy</p>
                  <p className={`text-2xl font-bold mt-1 font-mono transition-colors ${
                    montoHoy > 0 ? 'text-blue-600' : 'text-gray-300'
                  }`}>
                    {fmt(montoHoy)}
                  </p>
                </div>

                <div className="pt-4">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Nuevo Saldo tras el Pago</p>
                  <p className={`text-2xl font-bold mt-1 font-mono transition-colors ${
                    nuevoSaldo === 0 && montoHoy > 0
                      ? 'text-green-500'
                      : montoHoy > 0
                      ? 'text-orange-500'
                      : 'text-gray-300'
                  }`}>
                    {fmt(nuevoSaldo)}
                  </p>
                  {nuevoSaldo === 0 && montoHoy > 0 && (
                    <p className="text-xs text-green-500 font-medium mt-1">Deuda saldada</p>
                  )}
                </div>

              </div>
            </div>

            {/* Medio de Pago */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Medio de Pago</p>
              <div className="grid grid-cols-2 gap-2">
                {MEDIOS.map((m) => (
                  <button
                    key={m.value}
                    onClick={() => setMedioPago(m.value)}
                    className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all cursor-pointer ${
                      medioPago === m.value
                        ? MEDIO_STYLE[m.value]
                        : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <span>{MEDIO_ICON[m.value]}</span>
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {procesError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
                {procesError}
              </div>
            )}

            {/* Botón procesar */}
            <button
              onClick={handleProcesar}
              disabled={montoHoy === 0 || procesando}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold text-sm px-4 py-3.5 rounded-2xl transition-colors shadow-sm cursor-pointer disabled:cursor-not-allowed"
            >
              {procesando ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a5 5 0 00-10 0v2M5 9h14l1 12H4L5 9z" />
                  </svg>
                  {montoHoy > 0 ? `Procesar · ${fmt(montoHoy)}` : 'Procesar Pago'}
                </>
              )}
            </button>

          </div>
        </div>
      </div>

      {/* ── Modal de Confirmación ── */}
      {confirmData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden">

            {/* Header verde */}
            <div className="bg-green-500 px-6 py-5 flex items-center gap-4">
              <div className="w-11 h-11 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Pago Registrado</h2>
                <p className="text-xs text-green-100 mt-0.5">
                  {MEDIO_ICON[confirmData.medioPago]} Vía {confirmData.medioPago}
                </p>
              </div>
            </div>

            {/* Cuerpo */}
            <div className="px-6 py-5 space-y-4">

              {/* Detalle por tratamiento */}
              <div className="space-y-1">
                {confirmData.items.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-start justify-between gap-4 py-2.5 border-b border-gray-100 last:border-0"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{item.tratamiento}</p>
                      <p className="text-xs text-gray-500 truncate">{item.paciente}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-green-600">+{fmt(item.abonado)}</p>
                      {item.pendiente > 0 ? (
                        <p className="text-xs text-orange-500 mt-0.5">Pendiente: {fmt(item.pendiente)}</p>
                      ) : (
                        <p className="text-xs text-green-500 mt-0.5">Saldado</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Total abonado */}
              <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
                <p className="text-sm font-semibold text-gray-700">Total pagado hoy</p>
                <p className="text-lg font-bold text-blue-600 font-mono">{fmt(confirmData.totalAbonado)}</p>
              </div>

              {/* Aviso saldo pendiente para próxima cita */}
              {confirmData.items.some((it) => it.pendiente > 0) && (
                <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3">
                  <p className="text-xs font-semibold text-orange-700">Saldo para la próxima cita</p>
                  <p className="text-sm text-orange-600 mt-0.5">
                    Quedan{' '}
                    <span className="font-bold">
                      {fmt(confirmData.items.reduce((a, it) => a + it.pendiente, 0))}
                    </span>{' '}
                    por cancelar en futuras visitas.
                  </p>
                </div>
              )}

              <button
                onClick={() => setConfirmData(null)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm py-2.5 rounded-xl transition-colors cursor-pointer"
              >
                Cerrar
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

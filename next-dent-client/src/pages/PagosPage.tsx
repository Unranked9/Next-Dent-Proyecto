import { useEffect, useState, useMemo, useRef } from 'react';
import { getPacientes } from '../services/pacienteService';
import { getDeudaPaciente, getHistorialPaciente, registrarPago } from '../services/pagoService';
import { getActivos as getTarifario } from '../services/tarifarioService';
import { usePorCobrar } from '../hooks/usePorCobrar';
import type { Paciente } from '../types/paciente';
import type { Pago } from '../types/pago';
import type { DeudaDetalle } from '../services/pagoService';
import type { Tarifario } from '../types/tarifario';

type MedioPago = 'Efectivo' | 'Yape' | 'Plin' | 'Tarjeta';

const MEDIOS: { value: MedioPago; label: string; color: string }[] = [
  { value: 'Efectivo', label: 'Efectivo', color: 'border-emerald-400 bg-emerald-50 text-emerald-700' },
  { value: 'Yape',     label: 'Yape',     color: 'border-violet-400 bg-violet-50 text-violet-700'   },
  { value: 'Plin',     label: 'Plin',     color: 'border-sky-400 bg-sky-50 text-sky-700'            },
  { value: 'Tarjeta',  label: 'Tarjeta',  color: 'border-amber-400 bg-amber-50 text-amber-700'      },
];

const fmt = (n: number) =>
  `S/ ${Number(n).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fmtFecha = (iso: string) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return isNaN(d.getTime()) ? iso : d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

// ── Íconos ────────────────────────────────────────────────────────────────────
const IconSearch = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);
const IconX = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);
const IconUser = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);
const IconCheck = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

// ── Estado de línea de abono ──────────────────────────────────────────────────
interface LineaAbono {
  detalle: DeudaDetalle;
  nombreTratamiento: string;
  montoInput: string;          // string para el input controlado
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function PagosPage() {
  // Cobros pendientes
  const { porCobrar, total: totalPorCobrar, loading: loadingPorCobrar, refresh: refreshPorCobrar } = usePorCobrar();
  const busquedaRef = useRef<HTMLDivElement>(null);

  // Datos maestros
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [tarifario, setTarifario] = useState<Tarifario[]>([]);
  const [loadingInit, setLoadingInit] = useState(true);
  const [errorInit, setErrorInit] = useState<string | null>(null);

  // Selección de paciente
  const [busqueda, setBusqueda] = useState('');
  const [pacienteActivo, setPacienteActivo] = useState<Paciente | null>(null);

  // Deuda y abonos
  const [lineas, setLineas] = useState<LineaAbono[]>([]);
  const [historial, setHistorial] = useState<Pago[]>([]);
  const [loadingDeuda, setLoadingDeuda] = useState(false);

  // Pago
  const [medioPago, setMedioPago] = useState<MedioPago>('Efectivo');
  const [procesando, setProcesando] = useState(false);
  const [errorPago, setErrorPago] = useState<string | null>(null);
  const [exito, setExito] = useState<{ totalAbonado: number; medioPago: string } | null>(null);

  // ── Carga inicial ─────────────────────────────────────────────────────────
  useEffect(() => {
    Promise.all([getPacientes(), getTarifario()])
      .then(([p, t]) => { setPacientes(p); setTarifario(t); })
      .catch(() => setErrorInit('No se pudo conectar con el servidor.'))
      .finally(() => setLoadingInit(false));
  }, []);

  // ── Filtrar pacientes según búsqueda ──────────────────────────────────────
  const pacientesFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q || pacienteActivo) return [];
    return pacientes
      .filter((p) =>
        `${p.nombre} ${p.apellido} ${p.dni}`.toLowerCase().includes(q)
      )
      .slice(0, 6);
  }, [busqueda, pacientes, pacienteActivo]);

  // ── Seleccionar paciente → cargar deuda e historial ────────────────────────
  const seleccionarPaciente = async (p: Paciente) => {
    setPacienteActivo(p);
    setBusqueda(`${p.nombre} ${p.apellido}`);
    setLineas([]);
    setHistorial([]);
    setErrorPago(null);
    setExito(null);
    setLoadingDeuda(true);

    try {
      const [deuda, hist] = await Promise.all([
        getDeudaPaciente(p.idPac),
        getHistorialPaciente(p.idPac),
      ]);

      // Mapear cada detalle con el nombre del tratamiento desde el tarifario
      // REALIZADO primero (listo para cobrar), luego PENDIENTE/EN_PROGRESO
      const lineasMapeadas: LineaAbono[] = deuda
        .filter((d) => d.estado !== 'PAGADO' && d.estado !== 'ANULADO')
        .sort((a, b) => (a.estado === 'REALIZADO' ? 0 : 1) - (b.estado === 'REALIZADO' ? 0 : 1))
        .map((d) => {
          const tarifa = tarifario.find((t) => t.idTarifa === d.idTarifa);
          return {
            detalle: d,
            nombreTratamiento: tarifa?.nombre ?? `Tratamiento #${d.idTarifa}`,
            montoInput: '',
          };
        });

      setLineas(lineasMapeadas);
      setHistorial(hist);
    } catch {
      setErrorPago('No se pudo cargar la información del paciente.');
    } finally {
      setLoadingDeuda(false);
    }
  };

  const limpiarPaciente = () => {
    setPacienteActivo(null);
    setBusqueda('');
    setLineas([]);
    setHistorial([]);
    setErrorPago(null);
    setExito(null);
  };

  // ── Actualizar monto de una línea ─────────────────────────────────────────
  const updateMonto = (idDetalle: number, valor: string) => {
    setLineas((prev) =>
      prev.map((l) =>
        l.detalle.idDetalle === idDetalle ? { ...l, montoInput: valor } : l
      )
    );
  };

  const abonarTodo = (idDetalle: number) => {
    setLineas((prev) =>
      prev.map((l) =>
        l.detalle.idDetalle === idDetalle
          ? { ...l, montoInput: Number(l.detalle.saldoPendiente).toFixed(2) }
          : l
      )
    );
  };

  // ── Calcular totales ──────────────────────────────────────────────────────
  const totalDeuda = lineas.reduce((s, l) => s + Number(l.detalle.saldoPendiente), 0);

  const montoHoy = lineas.reduce((s, l) => {
    const v = parseFloat(l.montoInput);
    if (isNaN(v) || v <= 0) return s;
    return s + Math.min(v, Number(l.detalle.saldoPendiente));
  }, 0);

  // ── Procesar pago ─────────────────────────────────────────────────────────
  const handleProcesar = async () => {
    if (!pacienteActivo || montoHoy === 0) return;

    const detallesAbonar = lineas
      .map((l) => {
        const v = parseFloat(l.montoInput);
        if (isNaN(v) || v <= 0) return null;
        const montoAbonar = Math.min(v, Number(l.detalle.saldoPendiente));
        return { idPresupuestoDetalle: l.detalle.idDetalle, montoAbonar };
      })
      .filter((x): x is { idPresupuestoDetalle: number; montoAbonar: number } => x !== null);

    if (!detallesAbonar.length) return;

    setProcesando(true);
    setErrorPago(null);

    try {
      await registrarPago({
        idPaciente: pacienteActivo.idPac,
        medioPago,
        detalles: detallesAbonar,
      });

      // Recargar deuda e historial actualizados
      const [deudaActualizada, histActualizado] = await Promise.all([
        getDeudaPaciente(pacienteActivo.idPac),
        getHistorialPaciente(pacienteActivo.idPac),
      ]);

      const lineasActualizadas: LineaAbono[] = deudaActualizada
        .filter((d) => d.estado !== 'PAGADO' && d.estado !== 'ANULADO')
        .sort((a, b) => (a.estado === 'REALIZADO' ? 0 : 1) - (b.estado === 'REALIZADO' ? 0 : 1))
        .map((d) => {
          const tarifa = tarifario.find((t) => t.idTarifa === d.idTarifa);
          return {
            detalle: d,
            nombreTratamiento: tarifa?.nombre ?? `Tratamiento #${d.idTarifa}`,
            montoInput: '',
          };
        });

      setLineas(lineasActualizadas);
      setHistorial(histActualizado);
      setExito({ totalAbonado: montoHoy, medioPago });
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? 'Error al procesar el pago. Intenta de nuevo.';
      setErrorPago(msg);
    } finally {
      setProcesando(false);
    }
  };

  // ── Loading / Error inicial ────────────────────────────────────────────────
  if (loadingInit) return (
    <div className="flex items-center justify-center min-h-screen bg-slate-100">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-[3px] border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-500">Cargando módulo de caja...</p>
      </div>
    </div>
  );

  if (errorInit) return (
    <div className="flex items-center justify-center min-h-screen bg-slate-100">
      <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl max-w-sm text-center">
        <p className="font-semibold text-sm">Error de conexión</p>
        <p className="text-xs mt-1">{errorInit}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="max-w-6xl mx-auto space-y-5">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div>
          <h1 className="text-base font-semibold text-slate-900">Caja</h1>
          <p className="text-xs text-slate-400 mt-0.5">Registra abonos sobre presupuestos de tratamiento</p>
        </div>

        {/* ── Panel Por cobrar ─────────────────────────────────────────────── */}
        {loadingPorCobrar && porCobrar.length === 0 && (
          <div className="bg-white border border-slate-200 rounded-2xl p-4">
            <div className="h-3.5 w-28 bg-slate-200 rounded animate-pulse mb-4" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[0, 1].map((i) => (
                <div key={i} className="h-28 bg-slate-100 rounded-xl animate-pulse" />
              ))}
            </div>
          </div>
        )}

        {porCobrar.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-slate-700">Por cobrar</p>
                <span className="text-[10px] font-semibold bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full">
                  {totalPorCobrar} paciente{totalPorCobrar !== 1 ? 's' : ''}
                </span>
              </div>
              <button
                onClick={refreshPorCobrar}
                title="Refrescar"
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {porCobrar.map((pc) => (
                <button
                  key={pc.paciente.idPac}
                  onClick={() => {
                    seleccionarPaciente(pc.paciente);
                    busquedaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  className="text-left bg-slate-50 border border-slate-200 rounded-xl p-3 hover:border-indigo-300 hover:bg-indigo-50/40 transition-all"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-semibold text-indigo-700 flex-shrink-0">
                      {pc.paciente.nombre.charAt(0)}{pc.paciente.apellido.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-900 truncate">
                        {pc.paciente.nombre} {pc.paciente.apellido}
                      </p>
                      <p className="text-[10px] text-slate-400">DNI: {pc.paciente.dni}</p>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-500 mb-1">
                    {pc.detallesPendientes.length} tratamiento{pc.detallesPendientes.length !== 1 ? 's' : ''} por cobrar
                  </p>
                  <p className="text-sm font-semibold text-indigo-600 font-mono mb-2">
                    {fmt(pc.totalPendiente)}
                  </p>
                  <span className="block text-[10px] font-semibold bg-indigo-600 text-white px-2.5 py-1 rounded-lg text-center">
                    Cobrar ahora
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Buscador de paciente ─────────────────────────────────────────── */}
        <div ref={busquedaRef} className="bg-white border border-slate-200 rounded-2xl p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">Paso 1 — Seleccionar paciente</p>

          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><IconSearch /></span>
            <input
              type="text"
              placeholder="Buscar por nombre, apellido o DNI..."
              value={busqueda}
              onChange={(e) => { setBusqueda(e.target.value); setPacienteActivo(null); }}
              className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-400/50 focus:border-indigo-400 placeholder-slate-400 transition"
            />
            {busqueda && (
              <button
                onClick={limpiarPaciente}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <IconX />
              </button>
            )}
          </div>

          {/* Dropdown de sugerencias */}
          {pacientesFiltrados.length > 0 && (
            <div className="mt-2 border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              {pacientesFiltrados.map((p) => (
                <button
                  key={p.idPac}
                  onClick={() => seleccionarPaciente(p)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-indigo-50 border-b border-slate-100 last:border-0 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-semibold text-indigo-700 flex-shrink-0">
                    {p.nombre.charAt(0)}{p.apellido.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{p.nombre} {p.apellido}</p>
                    <p className="text-xs text-slate-400">DNI: {p.dni}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Paciente seleccionado */}
          {pacienteActivo && (
            <div className="mt-3 flex items-center gap-3 bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-3">
              <div className="w-9 h-9 rounded-full bg-indigo-500 flex items-center justify-center text-xs font-semibold text-white flex-shrink-0">
                {pacienteActivo.nombre.charAt(0)}{pacienteActivo.apellido.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-indigo-900">{pacienteActivo.nombre} {pacienteActivo.apellido}</p>
                <p className="text-xs text-indigo-500">DNI: {pacienteActivo.dni} · {pacienteActivo.telefono}</p>
              </div>
              <button onClick={limpiarPaciente} className="text-indigo-400 hover:text-indigo-600 transition-colors">
                <IconX />
              </button>
            </div>
          )}
        </div>

        {/* ── Contenido principal (visible solo con paciente activo) ─────── */}
        {pacienteActivo && (
          <div className="flex gap-5 items-start">

            {/* ── Panel izquierdo: deuda + historial ─────────────────────── */}
            <div className="flex-1 min-w-0 space-y-4">

              {/* Deuda pendiente */}
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-700">Paso 2 — Deuda pendiente</p>
                    <p className="text-xs text-slate-400 mt-0.5">Ingresa el monto a abonar por cada tratamiento</p>
                  </div>
                  {totalDeuda > 0 && (
                    <span className="text-xs font-semibold text-red-600 bg-red-50 border border-red-200 px-2.5 py-1 rounded-lg">
                      Total deuda: {fmt(totalDeuda)}
                    </span>
                  )}
                </div>

                {loadingDeuda ? (
                  <div className="flex items-center justify-center py-12 gap-2 text-slate-400">
                    <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm">Cargando deuda...</span>
                  </div>
                ) : lineas.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-12 text-center px-4">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                      <IconCheck />
                    </div>
                    <p className="text-sm font-medium text-slate-700">Sin deuda pendiente</p>
                    <p className="text-xs text-slate-400">Este paciente no tiene saldos por saldar.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/40">
                          <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Tratamiento</th>
                          <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">Precio</th>
                          <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">Saldo</th>
                          <th className="px-5 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">Abonar</th>
                          <th className="px-3 py-3"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {lineas.map((l) => {
                          const val = parseFloat(l.montoInput);
                          const excede = !isNaN(val) && val > Number(l.detalle.saldoPendiente);
                          const activa = !isNaN(val) && val > 0 && !excede;
                          return (
                            <tr
                              key={l.detalle.idDetalle}
                              className={`border-b border-slate-50 transition-colors ${activa ? 'bg-indigo-50/30' : ''}`}
                            >
                              <td className="px-5 py-3.5">
                                <p className="font-medium text-slate-900 text-sm">{l.nombreTratamiento}</p>
                                {l.detalle.numeroFdi && (
                                  <p className="text-xs text-slate-400">Pieza FDI: {l.detalle.numeroFdi}</p>
                                )}
                                <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full mt-1 ${
                                  l.detalle.estado === 'REALIZADO'
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : 'bg-amber-100 text-amber-700'
                                }`}>
                                  {l.detalle.estado === 'REALIZADO' ? 'Listo para cobrar' : 'En tratamiento'}
                                </span>
                              </td>
                              <td className="px-5 py-3.5 text-right font-mono text-slate-600 whitespace-nowrap">
                                {fmt(l.detalle.precioUnitario)}
                              </td>
                              <td className="px-5 py-3.5 text-right font-mono font-semibold text-red-500 whitespace-nowrap">
                                {fmt(l.detalle.saldoPendiente)}
                              </td>
                              <td className="px-5 py-3.5">
                                <div className="relative flex justify-center">
                                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">S/</span>
                                  <input
                                    type="number"
                                    min="0"
                                    max={l.detalle.saldoPendiente}
                                    step="0.01"
                                    value={l.montoInput}
                                    onChange={(e) => updateMonto(l.detalle.idDetalle, e.target.value)}
                                    placeholder="0.00"
                                    className={`w-28 pl-8 pr-2 py-1.5 text-sm text-right border rounded-lg focus:outline-none focus:ring-2 transition ${
                                      excede
                                        ? 'border-red-300 bg-red-50 text-red-700 focus:ring-red-300'
                                        : activa
                                        ? 'border-indigo-300 bg-indigo-50 text-indigo-900 focus:ring-indigo-300'
                                        : 'border-slate-200 bg-white text-slate-900 focus:ring-indigo-300'
                                    }`}
                                  />
                                </div>
                                {excede && (
                                  <p className="text-[10px] text-red-500 text-center mt-0.5">Excede el saldo</p>
                                )}
                              </td>
                              <td className="px-3 py-3.5">
                                <button
                                  onClick={() => abonarTodo(l.detalle.idDetalle)}
                                  className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1.5 rounded-lg transition-colors whitespace-nowrap"
                                >
                                  Todo
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Historial */}
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/60">
                  <p className="text-sm font-semibold text-slate-700">Historial de pagos</p>
                </div>
                {historial.length === 0 ? (
                  <p className="px-5 py-8 text-sm text-slate-400 text-center">Sin pagos registrados para este paciente.</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/40">
                        <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">#</th>
                        <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">Monto</th>
                        <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Medio</th>
                        <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Fecha</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historial.map((p, i) => (
                        <tr key={p.idPago ?? i} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                          <td className="px-5 py-3 text-xs text-slate-400 font-mono">{p.idPago}</td>
                          <td className="px-5 py-3 text-right font-mono font-semibold text-slate-900 whitespace-nowrap">
                            {fmt(Number(p.montoTotal))}
                          </td>
                          <td className="px-5 py-3 text-xs text-slate-600">{p.medioPago}</td>
                          <td className="px-5 py-3 text-xs text-slate-500 whitespace-nowrap">{fmtFecha(p.fechaPago)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* ── Sidebar: resumen + acción ─────────────────────────────── */}
            <div className="w-64 flex-shrink-0 space-y-4 sticky top-20">

              {/* Resumen */}
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                <div className="px-4 py-3 bg-[#0F172A]">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Resumen</p>
                </div>
                <div className="p-4 space-y-4">
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">Deuda total</p>
                    <p className="text-xl font-semibold text-slate-900 font-mono">{fmt(totalDeuda)}</p>
                  </div>
                  <div className="h-px bg-slate-100" />
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">A cobrar ahora</p>
                    <p className={`text-xl font-semibold font-mono transition-colors ${montoHoy > 0 ? 'text-indigo-600' : 'text-slate-300'}`}>
                      {fmt(montoHoy)}
                    </p>
                  </div>
                  <div className="h-px bg-slate-100" />
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">Saldo restante</p>
                    <p className={`text-xl font-semibold font-mono transition-colors ${
                      totalDeuda - montoHoy === 0 && montoHoy > 0
                        ? 'text-emerald-500'
                        : montoHoy > 0
                        ? 'text-amber-500'
                        : 'text-slate-300'
                    }`}>
                      {fmt(Math.max(0, totalDeuda - montoHoy))}
                    </p>
                    {totalDeuda - montoHoy === 0 && montoHoy > 0 && (
                      <p className="text-[11px] text-emerald-500 font-medium mt-0.5">Deuda saldada ✓</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Medio de pago */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4">
                <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-3">Paso 3 — Medio de pago</p>
                <div className="grid grid-cols-2 gap-2">
                  {MEDIOS.map((m) => (
                    <button
                      key={m.value}
                      onClick={() => setMedioPago(m.value)}
                      className={`text-xs font-semibold py-2 rounded-xl border-2 transition-all ${
                        medioPago === m.value ? m.color : 'border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Error */}
              {errorPago && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-4 py-3 rounded-xl leading-relaxed">
                  {errorPago}
                </div>
              )}

              {/* Éxito */}
              {exito && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs px-4 py-3 rounded-xl leading-relaxed">
                  <p className="font-semibold">Pago registrado ✓</p>
                  <p className="mt-0.5">{fmt(exito.totalAbonado)} vía {exito.medioPago}</p>
                </div>
              )}

              {/* Botón procesar */}
              <button
                onClick={handleProcesar}
                disabled={montoHoy === 0 || procesando || lineas.length === 0}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold text-sm py-3 rounded-2xl transition-colors disabled:cursor-not-allowed"
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
                    {montoHoy > 0 ? `Cobrar ${fmt(montoHoy)}` : 'Cobrar'}
                  </>
                )}
              </button>

            </div>
          </div>
        )}

        {/* Estado vacío — sin paciente seleccionado */}
        {!pacienteActivo && !busqueda && (
          <div className="bg-white border border-slate-200 rounded-2xl py-20 flex flex-col items-center gap-3 text-center">
            <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
              <IconUser />
            </div>
            <p className="text-sm font-medium text-slate-700">Busca un paciente para comenzar</p>
            <p className="text-xs text-slate-400 max-w-xs">
              Escribe el nombre, apellido o DNI del paciente en el buscador de arriba. Verás sus tratamientos con saldo pendiente y podrás registrar el cobro.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}

import { useEffect, useRef, useState } from 'react';
import Odontograma from './Odontograma';
import * as presupuestoService from '../services/presupuestoService';
import * as tarifarioService from '../services/tarifarioService';
import * as doctorService from '../services/doctorService';
import * as odontogramaService from '../services/odontogramaService';
import { exportarPresupuestoPdf } from '../utils/exportarPresupuestoPdf';
import { useAuth } from '../context/AuthContext';
import type { Presupuesto } from '../types/presupuesto';
import type { Paciente } from '../types/paciente';
import type { Tarifario } from '../types/tarifario';
import type { Doctor } from '../types/doctor';
import type { DienteEstado } from '../types/odontograma';

// ─── Types ──────────────────────────────────────────────────────────────────────

interface TratamientoPlanificado {
  _key: number;
  fdi: number;
  tarifa: Tarifario;
  precio: number;
}

// ─── Constants ──────────────────────────────────────────────────────────────────

const ESTADO_CHIP: Record<string, string> = {
  PENDIENTE: 'bg-amber-50 text-amber-700 border border-amber-200',
  APROBADO:  'bg-emerald-50 text-emerald-700 border border-emerald-200',
  RECHAZADO: 'bg-red-50 text-red-600 border border-red-200',
};

const DETALLE_ESTADO_CHIP: Record<string, string> = {
  PENDIENTE: 'bg-amber-50 text-amber-700 border border-amber-200',
  REALIZADO: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  ANULADO:   'bg-red-50 text-red-700 border border-red-200',
};

// ─── Helpers ────────────────────────────────────────────────────────────────────

const fmt = (n: number) => `S/ ${n.toFixed(2)}`;

// ─── Sub-components ─────────────────────────────────────────────────────────────

function TarifaRow({ tarifa, onAdd }: { tarifa: Tarifario; onAdd: (t: Tarifario) => void }) {
  return (
    <button
      onClick={() => onAdd(tarifa)}
      className="w-full text-left flex items-center justify-between px-3 py-2 rounded-lg hover:bg-blue-50 border border-transparent hover:border-blue-200 transition-all group"
    >
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-slate-700 truncate">{tarifa.nombre}</p>
        <p className="text-[10px] text-slate-400 mt-0.5">{tarifa.codigo}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0 ml-3">
        <span className="text-xs font-semibold text-slate-900 tabular-nums">{fmt(tarifa.precio)}</span>
        <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 border border-blue-200 rounded px-1.5 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          + Añadir
        </span>
      </div>
    </button>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────────

export default function PresupuestosTab({ idPaciente, idCiclo, paciente }: { idPaciente: number; idCiclo: number; paciente: Paciente }) {
  const keyRef = useRef(0);
  const { usuario } = useAuth();

  // ── Data layer ────────────────────────────────────────────────────────────────
  const [lista, setLista] = useState<Presupuesto[]>([]);
  const [loadingLista, setLoadingLista] = useState(true);
  const [tarifas, setTarifas] = useState<Tarifario[]>([]);

  // ── Visual-First model: las tres capas de estado ──────────────────────────────
  const [diagnosticoInicial, setDiagnosticoInicial] = useState<DienteEstado[]>([]);
  const [idOdontogramaInicial, setIdOdontogramaInicial] = useState<number | null>(null);
  const [loadingDiagnostico, setLoadingDiagnostico] = useState(true);
  const [tratamientosPlanificados, setTratamientosPlanificados] = useState<TratamientoPlanificado[]>([]);
  const [piezaActiva, setPiezaActiva] = useState<{ fdi: number } | null>(null);

  // ── UI helpers ────────────────────────────────────────────────────────────────
  const [busqueda, setBusqueda] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [odontogramaKey, setOdontogramaKey] = useState(0);

  // ── Modal de evolución ────────────────────────────────────────────────────────
  const [modalOpen, setModalOpen] = useState(false);
  const [detalleAEvolucionar, setDetalleAEvolucionar] = useState<number | null>(null);
  const [doctores, setDoctores] = useState<Doctor[]>([]);
  const [loadingDoctores, setLoadingDoctores] = useState(false);
  const [doctorSeleccionado, setDoctorSeleccionado] = useState<number | ''>('');
  const [loadingEvolucionar, setLoadingEvolucionar] = useState(false);
  const [doctorActivo, setDoctorActivo] = useState<Doctor | null>(null);

  // ── Effects ───────────────────────────────────────────────────────────────────

  useEffect(() => {
    Promise.all([
      presupuestoService.getPorPaciente(idPaciente).then(setLista).catch(() => setLista([])),
      tarifarioService.getActivos().then(setTarifas).catch(() => {}),
    ]).finally(() => setLoadingLista(false));
  }, [idPaciente]);

  // Carga el diagnóstico INICIAL del ciclo activo → alimenta la capa roja del odontograma.
  useEffect(() => {
    setLoadingDiagnostico(true);
    odontogramaService
      .getPorCiclo(idCiclo, 'INICIAL') // <-- Cambio clave: pedimos por idCiclo
      .then((data) => {
        if (data?.dientes) {
          setDiagnosticoInicial(data.dientes);
        } else {
          setDiagnosticoInicial([]); // Reset si el ciclo es nuevo y está en blanco
        }
        const idExtraido = data?.idOdontograma ?? (data as any)?.odontograma?.idOdontograma ?? (data as any)?.data?.idOdontograma;
        setIdOdontogramaInicial(idExtraido || null);
      })
      .catch(() => {
        setDiagnosticoInicial([]);
        setIdOdontogramaInicial(null);
      })
      .finally(() => {
        setLoadingDiagnostico(false);
        setOdontogramaKey((k) => k + 1);
      });
  }, [idCiclo]); // <-- Cambio clave: dependemos del ciclo, no del paciente

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(id);
  }, [toast]);

  useEffect(() => {
    const idDoctor = usuario?.idDoctor;
    if (!idDoctor) return;
    doctorService.getDoctorById(idDoctor)
      .then(setDoctorActivo)
      .catch(() => setDoctorActivo(null));
  }, [usuario?.idDoctor]);

  // ── Derived ───────────────────────────────────────────────────────────────────

  const subtotal = tratamientosPlanificados.reduce((s, t) => s + t.precio, 0);

  // Set de FDIs con tratamiento planificado → pasa al odontograma para pintar el indicador verde
  const planificadoFdis = new Set(tratamientosPlanificados.map((t) => t.fdi));

  const categorias = [...new Set(tarifas.map((t) => t.categoria))].sort();

  const tarifasFiltradas = busqueda.trim()
    ? tarifas.filter(
        (t) =>
          t.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
          t.codigo.toLowerCase().includes(busqueda.toLowerCase()) ||
          t.categoria.toLowerCase().includes(busqueda.toLowerCase()),
      )
    : tarifas;

  const nombreTratamiento = (idTarifa: number) =>
    tarifas.find((t) => t.idTarifa === idTarifa)?.nombre ?? `Tratamiento #${idTarifa}`;

  // ── Handlers del flujo Visual-First ──────────────────────────────────────────

  // Al hacer clic en un tratamiento del tarifario: inserta en planificados y cierra el panel lateral.
  const handleAgregarTratamiento = (tarifa: Tarifario) => {
    if (!piezaActiva) return;
    setTratamientosPlanificados((prev) => [
      ...prev,
      { _key: keyRef.current++, fdi: piezaActiva.fdi, tarifa, precio: tarifa.precio },
    ]);
    setPiezaActiva(null);
  };

  const eliminarTratamiento = (key: number) =>
    setTratamientosPlanificados((prev) => prev.filter((t) => t._key !== key));

  const actualizarPrecio = (key: number, valor: string) => {
    const n = parseFloat(valor);
    setTratamientosPlanificados((prev) =>
      prev.map((t) =>
        t._key === key ? { ...t, precio: Number.isFinite(n) ? n : t.precio } : t,
      ),
    );
  };

  const handleGuardarPresupuesto = async () => {
    if (tratamientosPlanificados.length === 0) {
      alert('Debes agregar al menos un tratamiento');
      return;
    }

    setSaving(true);
    try {
      // Inteligencia: Buscar el primer presupuesto PENDIENTE
      const presupuestoPendiente = lista.find((p) => p.estado === 'PENDIENTE');
      let idTarget = null;

      if (presupuestoPendiente) {
        const confirmar = window.confirm(`Se ha detectado un presupuesto pendiente (#${presupuestoPendiente.idPresupuesto}).\n\n¿Deseas AGREGAR estos tratamientos a ese presupuesto?\n(Si presionas Cancelar, se creará un presupuesto nuevo).`);
        if (confirmar) {
          idTarget = presupuestoPendiente.idPresupuesto;
        }
      }

      const detallesPayload = tratamientosPlanificados.map((t) => ({
        numeroFdi: t.fdi,
        idTarifa: t.tarifa.idTarifa!,
        precioUnitario: t.precio,
      }));

      if (idTarget) {
        // Añadir al existente
        await presupuestoService.agregarDetalles(idTarget, detallesPayload);
        setToast({ msg: 'Tratamientos agregados al presupuesto existente.', ok: true });
      } else {
        // Crear uno totalmente nuevo
        const payload = {
          idPaciente: Number(idPaciente),
          detalles: detallesPayload,
        };
        await presupuestoService.crear(payload);
        setToast({ msg: 'Presupuesto nuevo generado con éxito.', ok: true });
      }

      // Recargar lista y limpiar planificador
      const nuevaLista = await presupuestoService.getPorPaciente(idPaciente);
      setLista(nuevaLista);
      setTratamientosPlanificados([]);

    } catch (error: unknown) {
      const axiosErr = error as { response?: { data?: unknown } };
      console.error('Error al guardar presupuesto:', axiosErr.response?.data ?? error);
      setToast({ msg: 'Error al procesar el presupuesto. Intenta de nuevo.', ok: false });
    } finally {
      setSaving(false);
    }
  };

  // ── Modal de evolución ────────────────────────────────────────────────────────

  const abrirModal = (idDetalle: number) => {
    setDetalleAEvolucionar(idDetalle);
    setDoctorSeleccionado('');
    setModalOpen(true);
    if (doctores.length === 0) {
      setLoadingDoctores(true);
      doctorService
        .getDoctores()
        .then(setDoctores)
        .catch(() => {})
        .finally(() => setLoadingDoctores(false));
    }
  };

  const handleAnularDetalle = async (idDetalle: number) => {
    const motivo = window.prompt('¿Cuál es el motivo de la anulación? (Ej. Error de tipeo, Cambio de plan)');
    if (motivo === null) return;
    if (motivo.trim() === '') {
      setToast({ msg: 'Debe ingresar un motivo para anular el tratamiento.', ok: false });
      return;
    }

    try {
      await presupuestoService.anularDetalle(idDetalle, motivo.trim());
      const nuevaLista = await presupuestoService.getPorPaciente(idPaciente);
      setLista(nuevaLista);
      setToast({ msg: 'Tratamiento anulado correctamente.', ok: true });
    } catch (error) {
      console.error('Error al anular:', error);
      setToast({ msg: 'Error al anular el tratamiento.', ok: false });
    }
  };

  const handleEvolucionar = async () => {
    if (detalleAEvolucionar === null || doctorSeleccionado === '') return;
    setLoadingEvolucionar(true);
    try {
      await presupuestoService.evolucionar(detalleAEvolucionar, doctorSeleccionado as number, '', true);
      const nuevaLista = await presupuestoService.getPorPaciente(idPaciente);
      setLista(nuevaLista);
      setOdontogramaKey((k) => k + 1);
      setModalOpen(false);
      setToast({ msg: 'Tratamiento marcado como realizado.', ok: true });
    } catch {
      setToast({ msg: 'Error al evolucionar el tratamiento. Intenta de nuevo.', ok: false });
    } finally {
      setLoadingEvolucionar(false);
    }
  };

  const handleExportarPdf = (presupuesto: Presupuesto) => {
    exportarPresupuestoPdf({ presupuesto, paciente, tarifas, doctor: doctorActivo });
  };

  // ── Render ─────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-lg text-sm font-semibold text-white pointer-events-none ${
            toast.ok ? 'bg-green-600' : 'bg-red-600'
          }`}
        >
          {toast.ok ? (
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
          {toast.msg}
        </div>
      )}

      {/* Modal de confirmación de evolución */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-slate-800">Confirmar tratamiento</h2>
                  <p className="text-xs text-slate-500 mt-0.5">¿Confirmas que el tratamiento ha sido realizado?</p>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 space-y-3">
              <label className="block">
                <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                  Doctor que realizó el procedimiento
                </span>
                <select
                  value={doctorSeleccionado}
                  onChange={(e) =>
                    setDoctorSeleccionado(e.target.value === '' ? '' : Number(e.target.value))
                  }
                  disabled={loadingDoctores}
                  className="mt-1.5 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:bg-slate-50 disabled:text-slate-400 transition"
                >
                  <option value="">
                    {loadingDoctores ? 'Cargando doctores...' : 'Selecciona un doctor'}
                  </option>
                  {doctores.map((doc) => (
                    <option key={doc.idDoc} value={doc.idDoc}>
                      Dr. {doc.nombre} {doc.apellido} — {doc.especialidad}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                onClick={() => setModalOpen(false)}
                disabled={loadingEvolucionar}
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleEvolucionar}
                disabled={doctorSeleccionado === '' || loadingEvolucionar}
                className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors shadow-sm"
              >
                {loadingEvolucionar && (
                  <div className="w-3.5 h-3.5 border-2 border-white/60 border-t-white rounded-full animate-spin" />
                )}
                {loadingEvolucionar ? 'Guardando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════════
          Visual-First Workspace — Odontograma como centro interactivo
      ══════════════════════════════════════════════════════════════════════════ */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

        {/* Header con leyenda de capas */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-sm font-semibold text-slate-800">Planificador Visual</h2>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Haz clic en una pieza para asignarle un tratamiento, o inicia un nuevo ciclo.
              </p>
            </div>
          </div>

          {/* Leyenda de capas visuales */}
          <div className="flex items-center gap-4 shrink-0">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-red-500 shrink-0" />
              <span className="text-[10px] font-medium text-slate-500">Diagnóstico inicial</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500 shrink-0 border-2 border-white shadow-sm" />
              <span className="text-[10px] font-medium text-slate-500">Tratamiento planificado</span>
            </div>
          </div>
        </div>

        {/* Body: Odontograma + panel lateral */}
        <div className="p-4">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] xl:grid-cols-[1fr_380px] gap-5 items-start">

            {/* ── Odontograma (centro visual interactivo) ── */}
            <div className="relative">
              {loadingDiagnostico && (
                <div className="absolute inset-0 z-10 bg-white/75 backdrop-blur-[2px] flex items-center justify-center rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs text-slate-500 font-medium">Cargando diagnóstico inicial...</span>
                  </div>
                </div>
              )}
              {/* parentFetchDone=true: PresupuestosTab gestiona el fetch; el Odontograma no hace el suyo. */}
              {/* key=odontogramaKey: remonta el componente al completarse el fetch de diagnóstico o al evolucionar. */}
              <Odontograma
                key={odontogramaKey}
                idPaciente={idPaciente}
                modo="presupuesto"
                initialDientes={diagnosticoInicial}
                initialIdOdontograma={idOdontogramaInicial}
                parentFetchDone={true}
                planificadoFdis={planificadoFdis}
                onDienteClick={(fdi) => setPiezaActiva({ fdi })}
              />
            </div>

            {/* ── Panel lateral: Tarifario (visible cuando hay piezaActiva) ── */}
            {piezaActiva ? (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">

                {/* Cabecera: pieza seleccionada */}
                <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-3 bg-blue-50">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-sm font-bold text-white shrink-0 shadow-sm">
                    {piezaActiva.fdi}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-700 leading-tight">
                      Pieza {piezaActiva.fdi} — Selecciona un procedimiento
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">
                      El tratamiento se añadirá al presupuesto
                    </p>
                  </div>
                  <button
                    onClick={() => setPiezaActiva(null)}
                    className="shrink-0 w-7 h-7 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
                    title="Cerrar panel"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Buscador del tarifario */}
                <div className="px-4 pt-4 pb-3 border-b border-slate-100">
                  <input
                    type="text"
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    placeholder="Buscar por nombre, código o categoría..."
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                </div>

                {/* Lista del tarifario */}
                <div className="overflow-y-auto max-h-[55vh] p-3 space-y-0.5">
                  {tarifas.length === 0 ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : tarifasFiltradas.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-6">
                      Sin resultados para &ldquo;{busqueda}&rdquo;
                    </p>
                  ) : busqueda.trim() ? (
                    tarifasFiltradas.map((t) => (
                      <TarifaRow key={t.idTarifa} tarifa={t} onAdd={handleAgregarTratamiento} />
                    ))
                  ) : (
                    categorias.map((cat) => (
                      <div key={cat}>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-2 py-1.5 sticky top-0 bg-white z-10">
                          {cat}
                        </p>
                        {tarifas
                          .filter((t) => t.categoria === cat)
                          .map((t) => (
                            <TarifaRow key={t.idTarifa} tarifa={t} onAdd={handleAgregarTratamiento} />
                          ))}
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : (
              /* Estado vacío del panel lateral */
              <div className="rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-4 p-10 text-center min-h-[220px]">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
                  <svg className="w-7 h-7 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zm-7.518-.267A8.25 8.25 0 1120.25 10.5M8.288 14.212A5.25 5.25 0 1117.25 10.5" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-500">Ninguna pieza seleccionada</p>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Haz clic en cualquier diente del odontograma para ver el tarifario y agregar tratamientos al presupuesto.
                  </p>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════════
          Tabla de Presupuesto — alimentada exclusivamente de tratamientosPlanificados
      ══════════════════════════════════════════════════════════════════════════ */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M4.5 7.5a3 3 0 013-3h9a3 3 0 013 3v9a3 3 0 01-3 3h-9a3 3 0 01-3-3v-9z" />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-800">Presupuesto en elaboración</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Tratamientos planificados desde el odontograma
              </p>
            </div>
          </div>
          {tratamientosPlanificados.length > 0 && (
            <span className="shrink-0 text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-lg px-2.5 py-1">
              {tratamientosPlanificados.length} ítem{tratamientosPlanificados.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Body */}
        {tratamientosPlanificados.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-slate-500">Sin tratamientos planificados</p>
            <p className="text-xs text-slate-400 mt-1">
              Selecciona una pieza en el odontograma y elige un procedimiento del tarifario.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wide px-4 py-3 w-20">
                      Pieza
                    </th>
                    <th className="text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">
                      Procedimiento
                    </th>
                    <th className="text-right text-[10px] font-semibold text-slate-500 uppercase tracking-wide px-4 py-3 w-32">
                      Precio unitario
                    </th>
                    <th className="w-12" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tratamientosPlanificados.map((t) => (
                    <tr key={t._key} className="hover:bg-slate-50/60 transition-colors">

                      {/* Pieza FDI */}
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-blue-100 text-blue-700 text-xs font-bold tabular-nums">
                          {t.fdi}
                        </span>
                      </td>

                      {/* Procedimiento */}
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-700 leading-tight">{t.tarifa.nombre}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{t.tarifa.codigo} · {t.tarifa.categoria}</p>
                      </td>

                      {/* Precio editable */}
                      <td className="px-4 py-3 text-right">
                        <input
                          type="number"
                          value={t.precio}
                          onChange={(e) => actualizarPrecio(t._key, e.target.value)}
                          min={0}
                          step={0.01}
                          className="w-28 text-right border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                        />
                      </td>

                      {/* Eliminar */}
                      <td className="px-3 py-3">
                        <button
                          onClick={() => eliminarTratamiento(t._key)}
                          title="Eliminar tratamiento"
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer: subtotal + guardar */}
            <div className="px-5 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-4">
              <div className="flex items-baseline gap-2">
                <span className="text-xs text-slate-500 font-medium">Subtotal:</span>
                <span className="text-2xl font-bold text-slate-900 tabular-nums">{fmt(subtotal)}</span>
                <span className="text-[10px] text-slate-400">
                  ({tratamientosPlanificados.length} tratamiento{tratamientosPlanificados.length !== 1 ? 's' : ''})
                </span>
              </div>
              <button
                onClick={handleGuardarPresupuesto}
                disabled={saving}
                className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition-colors shadow-sm"
              >
                {saving ? (
                  <div className="w-4 h-4 border-2 border-white/60 border-t-white rounded-full animate-spin" />
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M4.5 7.5a3 3 0 013-3h9a3 3 0 013 3v9a3 3 0 01-3 3h-9a3 3 0 01-3-3v-9z" />
                  </svg>
                )}
                {saving ? 'Generando...' : 'Generar Presupuesto'}
              </button>
            </div>
          </>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════════
          Historia de presupuestos
      ══════════════════════════════════════════════════════════════════════════ */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-1 h-4 bg-slate-300 rounded-full" />
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
            {lista.length} presupuesto{lista.length !== 1 ? 's' : ''} registrado{lista.length !== 1 ? 's' : ''}
          </h3>
        </div>

        {loadingLista ? (
          <div className="flex justify-center py-10">
            <div className="w-7 h-7 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : lista.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-300 px-6 py-10 text-center">
            <p className="text-slate-400 text-sm font-medium">No hay presupuestos registrados aún.</p>
            <p className="text-slate-400 text-xs mt-1">Planifica los tratamientos desde el odontograma y genera el primero.</p>
          </div>
        ) : (
          lista.map((p) => (
            <div key={p.idPresupuesto} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M4.5 7.5a3 3 0 013-3h9a3 3 0 013 3v9a3 3 0 01-3 3h-9a3 3 0 01-3-3v-9z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Presupuesto #{p.idPresupuesto}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {p.fechaCreacion} · {(p.detalles ?? []).length} tratamiento{(p.detalles ?? []).length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${
                      ESTADO_CHIP[p.estado] ?? 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {p.estado}
                  </span>
                  <span className="text-base font-bold text-slate-900 tabular-nums">{fmt(p.total)}</span>
                  <button
                    onClick={() => handleExportarPdf(p)}
                    title="Descargar presupuesto en PDF"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition-colors"
                  >
                    <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    PDF
                  </button>
                </div>
              </div>

              {(p.detalles ?? []).length > 0 && (
                <div className="border-t border-slate-100 px-5 py-3">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-slate-400 font-medium">
                        <th className="text-left pb-2 w-16">FDI</th>
                        <th className="text-left pb-2">Tratamiento</th>
                        <th className="text-right pb-2 w-28">Precio</th>
                        <th className="text-center pb-2 w-24">Estado</th>
                        <th className="text-center pb-2 w-32">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {(p.detalles ?? []).map((d, i) => {
                        const estadoDetalle = d.estado ?? 'PENDIENTE';
                        const isPendiente = estadoDetalle === 'PENDIENTE';
                        return (
                          <tr key={i} className={`hover:bg-slate-50/60 transition-colors ${estadoDetalle === 'ANULADO' ? 'opacity-60 bg-slate-50' : ''}`}>
                            <td className="py-1.5 font-mono text-slate-600">{d.numeroFdi || '—'}</td>
                            <td className={`py-1.5 text-slate-700 ${estadoDetalle === 'ANULADO' ? 'text-slate-400' : ''}`}>
                              <p className={estadoDetalle === 'ANULADO' ? 'line-through' : 'font-medium'}>
                                {nombreTratamiento(d.idTarifa)}
                              </p>
                              {estadoDetalle === 'ANULADO' && d.motivoAnulacion && (
                                <p className="text-[10px] text-red-500 font-semibold mt-0.5">
                                  Motivo: {d.motivoAnulacion}
                                </p>
                              )}
                            </td>
                            <td className={`py-1.5 text-right font-semibold text-slate-800 tabular-nums ${estadoDetalle === 'ANULADO' ? 'line-through text-slate-400' : ''}`}>
                              {fmt(d.precioUnitario)}
                            </td>
                            <td className="py-1.5 text-center">
                              <span
                                className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                                  DETALLE_ESTADO_CHIP[estadoDetalle] ?? 'bg-slate-100 text-slate-600 border border-slate-200'
                                }`}
                              >
                                {estadoDetalle}
                              </span>
                            </td>
                            <td className="py-1.5 text-center">
                              <div className="flex items-center justify-center gap-2">
                                {isPendiente && d.idDetalle != null && (
                                  <>
                                    <button
                                      onClick={() => abrirModal(d.idDetalle!)}
                                      className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-[10px] font-semibold px-2.5 py-1 rounded-md transition-all shadow-sm"
                                      title="Marcar como realizado"
                                    >
                                      <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                      </svg>
                                      Evolucionar
                                    </button>
                                    <button
                                      onClick={() => handleAnularDetalle(d.idDetalle!)}
                                      className="inline-flex items-center gap-1 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-[10px] font-semibold px-2 py-1 rounded-md transition-colors"
                                      title="Anular tratamiento"
                                    >
                                      Anular
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))
        )}
      </div>

    </div>
  );
}

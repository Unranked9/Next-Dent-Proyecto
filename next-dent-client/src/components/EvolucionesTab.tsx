import { useCallback, useEffect, useState } from 'react';
import Odontograma from './Odontograma';
import * as presupuestoService from '../services/presupuestoService';
import * as evolucionService from '../services/evolucionService';
import * as doctorService from '../services/doctorService';
import * as tarifarioService from '../services/tarifarioService';
import * as odontogramaService from '../services/odontogramaService';
import type { Presupuesto, PresupuestoDetalle } from '../types/presupuesto';
import type { Evolucion } from '../types/hce';
import type { Doctor } from '../types/doctor';
import type { Tarifario } from '../types/tarifario';

interface PendienteItem extends PresupuestoDetalle {
  idPresupuesto: number;
  nombreTratamiento: string;
}

// ── Subcomponent: Toast ───────────────────────────────────────────────────────

function Toast({ msg, ok }: { msg: string; ok: boolean }) {
  return (
    <div
      className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-lg text-sm font-semibold text-white pointer-events-none ${
        ok ? 'bg-green-600' : 'bg-red-600'
      }`}
    >
      {ok ? (
        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      )}
      {msg}
    </div>
  );
}

// ── Subcomponent: Modal de Evolución ─────────────────────────────────────────

interface ModalProps {
  item: PendienteItem;
  doctores: Doctor[];
  loadingDoctores: boolean;
  doctorSel: number | '';
  nota: string;
  saving: boolean;
  finalizado: boolean;
  onDoctorChange: (v: number | '') => void;
  onNotaChange: (v: string) => void;
  onFinalizadoChange: (v: boolean) => void;
  onConfirmar: () => void;
  onCerrar: () => void;
}

function ModalEvolucion({
  item,
  doctores,
  loadingDoctores,
  doctorSel,
  nota,
  saving,
  finalizado,
  onDoctorChange,
  onNotaChange,
  onFinalizadoChange,
  onConfirmar,
  onCerrar,
}: ModalProps) {
  const canSubmit = doctorSel !== '' && nota.trim().length > 0 && !saving;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onCerrar(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Registrar Evolución</h2>
              <p className="text-xs text-emerald-700 font-semibold mt-0.5">
                {item.nombreTratamiento}
                {item.numeroFdi > 0 && (
                  <span className="text-slate-400 font-normal"> — Pieza {item.numeroFdi}</span>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={onCerrar}
            disabled={saving}
            className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer disabled:opacity-40 mt-0.5"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          {/* Doctor */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
              Doctor que realizó el procedimiento
            </label>
            <select
              value={doctorSel}
              onChange={(e) =>
                onDoctorChange(e.target.value === '' ? '' : Number(e.target.value))
              }
              disabled={loadingDoctores || saving}
              className="border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:bg-slate-50 disabled:text-slate-400 transition"
            >
              <option value="">
                {loadingDoctores ? 'Cargando doctores...' : 'Selecciona un doctor'}
              </option>
              {doctores.map((doc) => (
                <option key={doc.idDoc} value={doc.idDoc}>
                  Dr. {doc.nombre} {doc.apellido}
                  {doc.especialidad ? ` — ${doc.especialidad}` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Nota clínica */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
              Nota Clínica / Observaciones
            </label>
            <textarea
              value={nota}
              onChange={(e) => onNotaChange(e.target.value)}
              rows={6}
              disabled={saving}
              placeholder="Describe el procedimiento realizado, estado del diente, materiales utilizados, indicaciones post-operatorias..."
              className="border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition resize-none disabled:bg-slate-50 disabled:text-slate-400"
            />
            <p className="text-xs text-slate-400">
              {nota.trim().length} caracteres
            </p>
          </div>

          {/* Finalizado */}
          <label className="flex items-center gap-2 mt-4 cursor-pointer w-fit">
            <input
              type="checkbox"
              checked={finalizado}
              onChange={(e) => onFinalizadoChange(e.target.checked)}
              disabled={saving}
              className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 disabled:opacity-50"
            />
            <span className="text-sm font-semibold text-slate-700">Marcar tratamiento como finalizado</span>
          </label>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCerrar}
            disabled={saving}
            className="text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 px-4 py-2 rounded-xl transition-colors cursor-pointer disabled:opacity-40"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirmar}
            disabled={!canSubmit}
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors shadow-sm cursor-pointer"
          >
            {saving && (
              <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
            )}
            {saving ? 'Guardando...' : 'Confirmar y Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Subcomponent: Lista de Pendientes ─────────────────────────────────────────

function PanelPendientes({
  pendientes,
  onEvolucionar,
}: {
  pendientes: PendienteItem[];
  onEvolucionar: (item: PendienteItem) => void;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="bg-amber-500 px-5 py-3.5 flex items-center gap-3">
        <svg className="w-4 h-4 text-white shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="text-sm font-bold text-white uppercase tracking-wide flex-1">
          Tratamientos por Realizar
        </h3>
        <span className="bg-white/25 text-white text-xs font-bold px-2.5 py-0.5 rounded-full">
          {pendientes.length}
        </span>
      </div>

      {pendientes.length === 0 ? (
        <div className="px-5 py-10 text-center">
          <svg className="w-8 h-8 text-slate-200 mx-auto mb-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-slate-400 font-medium">Sin tratamientos pendientes</p>
          <p className="text-xs text-slate-300 mt-0.5">Todos los tratamientos han sido realizados.</p>
        </div>
      ) : (
        <ul className="divide-y divide-slate-100">
          {pendientes.map((item) => (
            <li
              key={item.idDetalle}
              className="flex items-center justify-between px-5 py-3.5 gap-3 hover:bg-slate-50 transition-colors"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-800 truncate">
                  {item.nombreTratamiento}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  {item.numeroFdi > 0 && (
                    <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      </svg>
                      Pieza {item.numeroFdi}
                    </span>
                  )}
                  <span className="text-xs font-mono text-slate-400">
                    S/ {item.precioUnitario.toFixed(2)}
                  </span>
                </div>
              </div>
              <button
                onClick={() => onEvolucionar(item)}
                className="shrink-0 inline-flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded-lg transition-colors shadow-sm cursor-pointer"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Evolucionar
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Subcomponent: Historial Timeline ─────────────────────────────────────────

function PanelHistorial({ evoluciones }: { evoluciones: Evolucion[] }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
      <div className="bg-blue-600 px-5 py-3.5 flex items-center gap-3 shrink-0">
        <svg className="w-4 h-4 text-white shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <h3 className="text-sm font-bold text-white uppercase tracking-wide flex-1">
          Historial de Evoluciones
        </h3>
        <span className="bg-white/20 text-white text-xs font-bold px-2.5 py-0.5 rounded-full">
          {evoluciones.length}
        </span>
      </div>

      <div className="overflow-y-auto" style={{ maxHeight: '460px' }}>
        {evoluciones.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <svg className="w-9 h-9 text-slate-200 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
            <p className="text-sm text-slate-400 font-medium">Sin evoluciones registradas</p>
            <p className="text-xs text-slate-300 mt-0.5">
              Las notas aparecerán aquí al evolucionar un tratamiento.
            </p>
          </div>
        ) : (
          <div className="relative px-4 py-4">
            <div className="absolute left-[30px] top-0 bottom-0 w-px bg-blue-100" />
            <div className="space-y-4">
              {evoluciones.map((ev) => (
                <div key={ev.idEvolucion} className="relative flex gap-4 pl-10">
                  <div className="absolute left-[22px] top-5 w-3.5 h-3.5 rounded-full bg-blue-500 border-2 border-white shadow-sm shrink-0" />
                  <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm hover:border-blue-300 hover:shadow-md transition-all duration-150 overflow-hidden">
                    {/* Pieza destacada */}
                    {ev.numeroFdi && ev.numeroFdi > 0 && (
                      <div className="px-4 pt-3.5 pb-0">
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-lg">
                          <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                          </svg>
                          Pieza {ev.numeroFdi}
                        </span>
                      </div>
                    )}
                    {/* Nota clínica */}
                    <div className="px-4 pt-3 pb-3">
                      <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                        {ev.descripcion || 'Sin nota clínica'}
                      </p>
                    </div>
                    {/* Footer */}
                    <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center gap-2">
                      <svg className="w-3 h-3 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <p className="text-xs text-slate-500 truncate">
                        Atendido por:{' '}
                        <span className="font-semibold text-slate-700">
                          Dr. {ev.nombreDoctor || 'No registrado'}
                        </span>
                        {' — '}
                        <span>{ev.fecha}</span>
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function EvolucionesTab({ idPaciente, idCiclo }: { idPaciente: number; idCiclo: number }) {
  const [presupuestos, setPresupuestos] = useState<Presupuesto[]>([]);
  const [tarifas, setTarifas] = useState<Tarifario[]>([]);
  const [evoluciones, setEvoluciones] = useState<Evolucion[]>([]);
  const [doctores, setDoctores] = useState<Doctor[]>([]);
  const [loadingDoctores, setLoadingDoctores] = useState(false);
  const [odontogramaKey, setOdontogramaKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [dientesActual, setDientesActual] = useState<any[]>([]);
  const [idOdontogramaActual, setIdOdontogramaActual] = useState<number | null>(null);

  // Modal
  const [modalItem, setModalItem] = useState<PendienteItem | null>(null);
  const [doctorSel, setDoctorSel] = useState<number | ''>('');
  const [nota, setNota] = useState('');
  const [finalizado, setFinalizado] = useState(true);
  const [saving, setSaving] = useState(false);

  const cargar = useCallback(async () => {
    const [presups, evols, tarifs, odontoData] = await Promise.all([
      presupuestoService.getPorPaciente(idPaciente).catch(() => [] as Presupuesto[]),
      evolucionService.getEvolucionesPorPaciente(idPaciente).catch(() => [] as Evolucion[]),
      tarifarioService.getActivos().catch(() => [] as Tarifario[]),
      // Cambio Clave: Ahora pedimos el odontograma ACTUAL del ciclo seleccionado
      odontogramaService.getPorCiclo(idCiclo, 'ACTUAL').catch(() => null),
    ]);
    setPresupuestos(presups);
    setEvoluciones(evols);
    setTarifas(tarifs);

    if (odontoData) {
      if (odontoData.dientes) setDientesActual(odontoData.dientes);
      const idExtraido = odontoData.idOdontograma ?? (odontoData as any).odontograma?.idOdontograma ?? (odontoData as any).data?.idOdontograma;
      if (idExtraido) setIdOdontogramaActual(idExtraido);
    } else {
      // Reset de seguridad si no hay datos en este ciclo
      setDientesActual([]);
      setIdOdontogramaActual(null);
    }
  }, [idPaciente, idCiclo]);

  useEffect(() => {
    setLoading(true);
    cargar().finally(() => setLoading(false));
  }, [cargar]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const nombreDe = (idTarifa: number) =>
    tarifas.find((t) => t.idTarifa === idTarifa)?.nombre ?? `Tratamiento #${idTarifa}`;

  const pendientes: PendienteItem[] = presupuestos.flatMap((p) =>
    p.detalles
      .filter((d) => d.estado === 'PENDIENTE' || d.estado === 'EN_PROGRESO')
      .map((d) => ({
        ...d,
        idPresupuesto: p.idPresupuesto!,
        nombreTratamiento: nombreDe(d.idTarifa),
      })),
  );

  const abrirModal = (item: PendienteItem) => {
    setModalItem(item);
    setDoctorSel('');
    setNota('');
    setFinalizado(true);
    if (doctores.length === 0) {
      setLoadingDoctores(true);
      doctorService
        .getDoctores()
        .then(setDoctores)
        .catch(() => {})
        .finally(() => setLoadingDoctores(false));
    }
  };

  const cerrarModal = () => {
    if (saving) return;
    setModalItem(null);
  };

  const handleConfirmar = async () => {
    if (!modalItem || doctorSel === '' || !nota.trim()) return;
    setSaving(true);
    try {
      await presupuestoService.evolucionar(
        modalItem.idDetalle!,
        doctorSel as number,
        nota.trim(),
        finalizado,
      );
     if (modalItem.numeroFdi > 0 && idOdontogramaActual) {
        const dienteTarget = dientesActual.find(d => d.numeroFdi === modalItem.numeroFdi);
        if (dienteTarget) {
          await odontogramaService.guardarDiente({
            ...dienteTarget,
            idOdontograma: idOdontogramaActual,
            estadoClinico: 'REALIZADO',
            colorRecuadro: 'AZUL'
          });
        }
      }

      // 3. Recargar listas y el Odontograma actualizado
      const [nuevosPresups, nuevasEvols, odontoData] = await Promise.all([
        presupuestoService.getPorPaciente(idPaciente),
        evolucionService.getEvolucionesPorPaciente(idPaciente),
        odontogramaService.getPorCiclo(idCiclo, 'ACTUAL').catch(() => null),
      ]);

      setPresupuestos(nuevosPresups);
      setEvoluciones(nuevasEvols);

      // 4. Actualizar el estado del Odontograma con los nuevos datos (Aquí ocurre la magia del cambio de color)
      if (odontoData && odontoData.dientes) {
        setDientesActual(odontoData.dientes);
      }

      setOdontogramaKey((k) => k + 1); // Forzar re-render del SVG
      setModalItem(null);
      setToast({ msg: '¡Evolución registrada correctamente!', ok: true });
    } catch {
      setToast({ msg: 'Error al registrar la evolución. Intenta de nuevo.', ok: false });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-3">
          <div className="w-9 h-9 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-400">Cargando dashboard clínico...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {toast && <Toast msg={toast.msg} ok={toast.ok} />}

      {modalItem && (
        <ModalEvolucion
          item={modalItem}
          doctores={doctores}
          loadingDoctores={loadingDoctores}
          doctorSel={doctorSel}
          nota={nota}
          saving={saving}
          finalizado={finalizado}
          onDoctorChange={setDoctorSel}
          onNotaChange={setNota}
          onFinalizadoChange={setFinalizado}
          onConfirmar={handleConfirmar}
          onCerrar={cerrarModal}
        />
      )}

      {/* ── Dashboard: 2 columnas ── */}
      <div className="grid grid-cols-1 xl:grid-cols-[50%_50%] 2xl:grid-cols-[45%_55%] gap-8 w-full items-start">

        {/* Columna izquierda: Odontograma (≈40%) */}
        {/* Columna izquierda: Odontograma */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm min-h-[500px] overflow-x-auto custom-scrollbar">
          <div className="bg-slate-700 px-5 py-3.5 flex items-center gap-2">
            <svg className="w-4 h-4 text-slate-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
            <h3 className="text-sm font-bold text-white uppercase tracking-wide">
              Odontograma del Paciente
            </h3>
          </div>
          <Odontograma
            key={odontogramaKey}
            idPaciente={idPaciente}
            modo="presupuesto"
            tipo="ACTUAL"
            readOnly={true}
            initialDientes={dientesActual}
            initialIdOdontograma={idOdontogramaActual}
            parentFetchDone={true}
          />
        </div>

        {/* Columna derecha: Pendientes + Historial (≈60%) */}
        <div className="flex flex-col gap-4">
          <PanelPendientes pendientes={pendientes} onEvolucionar={abrirModal} />
          <PanelHistorial evoluciones={evoluciones} />
        </div>
      </div>
    </div>
  );
}

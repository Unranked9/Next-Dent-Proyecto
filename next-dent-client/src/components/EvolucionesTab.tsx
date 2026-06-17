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
import { obtenerMapeoMINSA } from '../utils/minsaMapper';

interface PendienteItem extends PresupuestoDetalle {
  idPresupuesto: number;
  nombreTratamiento: string;
}

/**
 * Mapea el nombre de un tratamiento del tarifario a la clave del minsaMapper.
 * Usado al evolucionar para actualizar la sigla del odontograma correctamente.
 */
function inferirClaveOdontograma(nombreTratamiento: string): string {
  const n = nombreTratamiento.toLowerCase();

  // Coronas modernas — orden de especificidad descendente
  if (n.includes('zirconio') && n.includes('porcelana'))  return 'CORONA_ZP';
  if (n.includes('zirconio'))                              return 'CORONA_CZ';
  if (n.includes('disilicato') || n.includes('e.max') || n.includes('emax')) return 'CORONA_ED';
  if (n.includes('pfm') || (n.includes('porcelana') && n.includes('metal'))) return 'CORONA_PFM';
  if (n.includes('peek'))                                  return 'CORONA_PEEK';
  if (n.includes('pmma') || n.includes('provisional') && n.includes('cad')) return 'CORONA_PMMA';
  if (n.includes('híbrida') || n.includes('hibrida') || n.includes('vita enamic') || n.includes('cerasmart')) return 'CORONA_HPC';
  if (n.includes('oro') && (n.includes('corona') || n.includes('colad'))) return 'CORONA_AU';
  if (n.includes('metal') && n.includes('cerámica') || n.includes('ceramica') && n.includes('metal')) return 'CORONA_CMP';
  if (n.includes('corona') && n.includes('metál') || n.includes('corona') && n.includes('metal')) return 'CORONA_CM';
  if (n.includes('corona') && n.includes('porcelana'))    return 'CORONA_CP';

  // Inlays / Onlays / Overlays
  if (n.includes('overlay'))                              return 'OVERLAY_CZ';
  if (n.includes('onlay') && n.includes('zirconio'))      return 'ONLAY_CZ';
  if (n.includes('inlay') && n.includes('zirconio'))      return 'INLAY_CZ';
  if (n.includes('inlay') && n.includes('disilicato'))    return 'INLAY_ED';
  if (n.includes('ceromero') || n.includes('cerómero'))   return 'INLAY_CER';
  if (n.includes('inlay') && n.includes('oro'))           return 'INLAY_AU';

  // Carillas
  if (n.includes('carilla') || n.includes('veneer') || n.includes('chapa')) {
    if (n.includes('disilicato') || n.includes('e.max') || n.includes('emax')) return 'CARILLA_ED';
    if (n.includes('zirconio'))    return 'CARILLA_CZ';
    if (n.includes('porcelana'))   return 'CARILLA_PC';
    return 'CARILLA_COMP';
  }

  // Resinas
  if (n.includes('nanohíbrida') || n.includes('nanohibrida')) return 'RESINA_NHB';
  if (n.includes('bulk') && n.includes('fill'))               return 'RESINA_BLK';
  if (n.includes('nanopartícula') || n.includes('nanoparticula') || n.includes('nanorrelleno')) return 'RESINA_NBF';
  if (n.includes('fluida') || n.includes('flow'))             return 'RESINA_FLOW';
  if (n.includes('resina') || n.includes('restaur'))          return 'RESINA_BUENO';

  // Implantes
  if (n.includes('implante') && n.includes('zirconio'))  return 'IMPLANTE_ZR';
  if (n.includes('implante') && n.includes('mini'))      return 'IMPLANTE_MINI';
  if (n.includes('implante'))                            return 'IMPLANTE_TI';

  // Endodoncia / pulpar
  if (n.includes('retratamiento'))                       return 'RETRATAMIENTO';
  if (n.includes('apicectom') || n.includes('cirugía apical')) return 'CIRUGIA_APICAL';
  if (n.includes('apexif'))                              return 'PULPAR_APEX';
  if (n.includes('pulpotom'))                            return 'PULPAR_PD';
  if (n.includes('pulpectom'))                           return 'PULPAR_PC';
  if (n.includes('conducto') || n.includes('endodon'))   return 'ENDODONCIA';

  // Periodoncia
  if (n.includes('raspado') || n.includes('alisado'))    return 'PERIO_RAR';
  if (n.includes('gingivect'))                           return 'PERIO_GIN';
  if (n.includes('colgajo') || (n.includes('cirugía') && n.includes('periodon'))) return 'PERIO_CIR';

  // Sellante
  if (n.includes('sellante'))                            return 'SELLANTE';

  // Blanqueamiento
  if (n.includes('blanquea') || n.includes('blanqueo'))  return 'BLANQUEAMIENTO';

  // Amalgama / Ionómero
  if (n.includes('amalgama'))                            return 'AMALGAMA_BUENO';
  if (n.includes('ionóm') || n.includes('ionomero') || n.includes('vidrio')) return 'IONOMERO_BUENO';

  // Extracciones
  if (n.includes('extracción') || n.includes('extraccion') || n.includes('exodoncia')) return 'EXTRACCION_INDICADA';

  // Fallback genérico
  return 'CORONA_CMP';
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

// ── Helper: clasificar diente por número FDI ──────────────────────────────────

interface TipoDiente {
  tipo: 'incisivo' | 'canino' | 'premolar' | 'molar';
  arcada: 'superior' | 'inferior';
  label: string;
}

function getTipoDiente(fdi: number): TipoDiente | null {
  if (!fdi || fdi <= 0) return null;

  // Dentición adulta: cuadrantes 1-4 (11-48)
  // Dentición pediátrica: cuadrantes 5-8 (51-85)
  const cuadrante = Math.floor(fdi / 10);
  const posicion = fdi % 10;

  const esSuperior = [1, 2, 5, 6].includes(cuadrante);
  const esInferior = [3, 4, 7, 8].includes(cuadrante);
  if (!esSuperior && !esInferior) return null;

  const arcada: 'superior' | 'inferior' = esSuperior ? 'superior' : 'inferior';

  // Dentición adulta (cuadrantes 1-4)
  if (cuadrante >= 1 && cuadrante <= 4) {
    if (posicion === 1 || posicion === 2) {
      return { tipo: 'incisivo', arcada, label: 'Incisivo' };
    }
    if (posicion === 3) {
      return { tipo: 'canino', arcada, label: 'Canino' };
    }
    if (posicion === 4 || posicion === 5) {
      return { tipo: 'premolar', arcada, label: 'Premolar' };
    }
    if (posicion >= 6 && posicion <= 8) {
      return { tipo: 'molar', arcada, label: 'Molar' };
    }
  }

  // Dentición pediátrica (cuadrantes 5-8)
  if (cuadrante >= 5 && cuadrante <= 8) {
    if (posicion === 1 || posicion === 2) {
      return { tipo: 'incisivo', arcada, label: 'Incisivo deciduo' };
    }
    if (posicion === 3) {
      return { tipo: 'canino', arcada, label: 'Canino deciduo' };
    }
    if (posicion === 4 || posicion === 5) {
      return { tipo: 'molar', arcada, label: 'Molar deciduo' };
    }
  }

  return null;
}

function IconoDiente({ fdi }: { fdi: number }) {
  const info = getTipoDiente(fdi);
  if (!info) return null;

  // Colores según arcada
  const color = info.arcada === 'superior' ? '#6366F1' : '#8B5CF6'; // indigo / violet

  // Formas SVG simplificadas por tipo de diente
  const shapes: Record<TipoDiente['tipo'], JSX.Element> = {
    incisivo: (
      // Diente rectangular con raíz simple — forma de pala
      <svg width="16" height="20" viewBox="0 0 16 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="2" y="1" width="12" height="9" rx="2" fill={color} opacity="0.15" stroke={color} strokeWidth="1.5"/>
        <path d="M6 10 L5 19 M10 10 L11 19" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    canino: (
      // Diente con punta prominente — forma de colmillo
      <svg width="14" height="22" viewBox="0 0 14 22" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M2 2 Q7 1 12 2 Q13 6 7 10 Q1 6 2 2Z" fill={color} opacity="0.15" stroke={color} strokeWidth="1.5"/>
        <path d="M7 10 L6 21" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    premolar: (
      // Diente con dos cúspides — forma de M suavizada
      <svg width="16" height="20" viewBox="0 0 16 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M2 2 Q4 1 6 3 Q8 1 10 3 Q14 1 14 5 Q14 10 8 11 Q2 10 2 5Z" fill={color} opacity="0.15" stroke={color} strokeWidth="1.5"/>
        <path d="M5 11 L4 19 M11 11 L12 19" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    molar: (
      // Diente ancho con múltiples cúspides — forma cuadrada con protuberancias
      <svg width="20" height="18" viewBox="0 0 20 18" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M2 3 Q5 1 8 3 Q10 1 12 3 Q15 1 18 3 Q19 6 18 10 Q15 12 10 12 Q5 12 2 10 Q1 6 2 3Z" fill={color} opacity="0.15" stroke={color} strokeWidth="1.5"/>
        <path d="M5 12 L4 17 M10 12 L10 17 M15 12 L16 17" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  };

  return (
    <span
      title={`${info.label} ${info.arcada}`}
      className="shrink-0 inline-flex items-center justify-center"
    >
      {shapes[info.tipo]}
    </span>
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
                    <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                      <IconoDiente fdi={item.numeroFdi} />
                      <span className="font-medium">
                        Pieza {item.numeroFdi}
                        {getTipoDiente(item.numeroFdi) && (
                          <span className="text-slate-400 font-normal">
                            {' '}· {getTipoDiente(item.numeroFdi)!.label}
                          </span>
                        )}
                      </span>
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

function PanelHistorial({
  evoluciones,
  nombreDe,
}: {
  evoluciones: Evolucion[];
  nombreDe: (idTarifa: number) => string;
}) {
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

      <div className="overflow-y-auto" style={{ maxHeight: '520px' }}>
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
                    {/* Header de la tarjeta: nombre del tratamiento + badge de pieza */}
                    <div className="px-4 pt-3.5 pb-0 flex items-start justify-between gap-2 flex-wrap">
                      <p className="text-xs font-bold text-slate-800 leading-tight">
                        {ev.idTarifa ? nombreDe(ev.idTarifa) : 'Tratamiento no especificado'}
                      </p>
                      {ev.numeroFdi && ev.numeroFdi > 0 && (
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-lg shrink-0">
                          <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                          </svg>
                          Pieza {ev.numeroFdi}
                        </span>
                      )}
                    </div>
                    {/* Nota clínica */}
                    <div className="px-4 pt-2 pb-3">
                      <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
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
          const claveOdontograma = inferirClaveOdontograma(modalItem.nombreTratamiento);
          const mapeoVisual = obtenerMapeoMINSA(claveOdontograma);

          await odontogramaService.guardarDiente({
            ...dienteTarget,
            idOdontograma: idOdontogramaActual,
            estadoClinico: 'REALIZADO',
            condicionGeneral: claveOdontograma,   // ← actualiza la condición para el SVG
            ...mapeoVisual,                        // ← siglaRecuadro, colorRecuadro, trazos
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

      {/* ── Dashboard: Odontograma arriba, paneles abajo ── */}
      <div className="flex flex-col gap-4 w-full">

        {/* Zona 1: Odontograma — ancho completo */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
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

        {/* Zona 2: Pendientes + Historial — 2 columnas */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <PanelPendientes pendientes={pendientes} onEvolucionar={abrirModal} />
          <PanelHistorial evoluciones={evoluciones} nombreDe={nombreDe} />
        </div>
      </div>
    </div>
  );
}

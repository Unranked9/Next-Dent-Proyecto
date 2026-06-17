import { useCallback, useEffect, useState } from 'react';
import Odontograma from './Odontograma';
import * as odontogramaService from '../services/odontogramaService';
import type { DienteEstado, OdontogramaMultipieza } from '../types/odontograma';
import type { Paciente } from '../types/paciente';
import { exportarFichaPdf } from '../utils/exportarFichaPdf';
import * as presupuestoService from '../services/presupuestoService';
import * as evolucionService from '../services/evolucionService';
import * as tarifarioService from '../services/tarifarioService';
import { getAnamnesisPorCiclo } from '../services/anamnesisService';
import { useAuth } from '../context/AuthContext';
import * as doctorService from '../services/doctorService';

// ── Toast ─────────────────────────────────────────────────────────────────────

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

// ── Spinner icon ──────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <svg
      className="w-4 h-4 animate-spin shrink-0"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

// ── Surfaces used to detect modified teeth ────────────────────────────────────

const SUPERFICIES = [
  'supVestibular',
  'supLingual',
  'supMesial',
  'supDistal',
  'supOclusal',
] as const;

// ── Component ─────────────────────────────────────────────────────────────────

interface OdontogramaTabProps {
  idPaciente: number;
  idCiclo: number;
  readOnly?: boolean;
  paciente: Paciente;
  cicloFecha?: string;
}

export default function OdontogramaTab({ idPaciente, idCiclo, readOnly = false, paciente, cicloFecha }: OdontogramaTabProps) {
  const { usuario } = useAuth();
  const [exportando, setExportando] = useState(false);

  // ── Estado del tab (para el botón Guardar y hayHallazgos) ─────────────────
  const [dientes, setDientes] = useState<DienteEstado[]>([]);
  const [idOdontograma, setIdOdontograma] = useState<number | null>(null);
  const [tratamientosMulti, setTratamientosMulti] = useState<OdontogramaMultipieza[]>([]);
  const [guardando, setGuardando] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [observaciones, setObservaciones] = useState<string>('');

  // ── Estado de carga inicial ───────────────────────────────────────────────
  // Arrancamos en "cargando" para no montar <Odontograma /> vacío.
  const [cargandoInicial, setCargandoInicial] = useState(true);
  // Los dientes e ID que vengan del backend los guardamos aquí
  // para pasárselos a <Odontograma /> como estado inicial.
  const [initialDientes, setInitialDientes] = useState<DienteEstado[]>([]);
  const [initialIdOdontograma, setInitialIdOdontograma] = useState<number | null>(null);
  /**
   * parentFetchDone: true indica que OdontogramaTab YA hizo el fetch (con éxito
   * o con "sin datos"), por lo que <Odontograma /> debe omitir su propio GET
   * aunque initialDientes esté vacío (paciente nuevo / todos los dientes SANO).
   * Evita la petición duplicada que antes quedaba en la consola para pacientes sin
   * hallazgos registrados.
   */
  const [parentFetchDone, setParentFetchDone] = useState(false);

  // ── useEffect: Carga inicial al montar (o al cambiar de paciente/ciclo) ─────────
  useEffect(() => {
    let cancelado = false;
    setCargandoInicial(true);

    // Inicializa en blanco para que un cambio de fecha no muestre datos viejos
    setDientes([]);
    setInitialDientes([]);
    setIdOdontograma(null);
    setInitialIdOdontograma(null);
    setObservaciones('');

    const cargar = async () => {
      try {
        const response = await odontogramaService.getPorCiclo(idCiclo, 'INICIAL');
        if (cancelado) return;

        if (!response) return;

        const idExtraido: number | null =
          response.idOdontograma ??
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (response as any).odontograma?.idOdontograma ??
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (response as any).data?.idOdontograma ??
          null;

        const fromDB: DienteEstado[] =
          response.dientes ??
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (response as any).odontograma?.dientes ??
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (response as any).data?.dientes ??
          [];

        if (idExtraido != null) {
          setInitialIdOdontograma(idExtraido);
          setIdOdontograma(idExtraido);
        }

        setObservaciones(response.observaciones || '');

        if (fromDB.length > 0) {
          setInitialDientes(fromDB);
          setDientes(fromDB);
        }
      } catch {
        // Error de red
      } finally {
        if (!cancelado) {
          setCargandoInicial(false);
          setParentFetchDone(true);
        }
      }
    };

    cargar();
    return () => { cancelado = true; };
  }, [idPaciente, idCiclo]);

  // ── Callback que <Odontograma /> llama cada vez que el usuario edita ──────
  // Mantiene sincronizado el estado del tab para que el botón Guardar refleje
  // los cambios que el usuario hace DESPUÉS de la carga inicial.
  const handleChange = useCallback(
    (nuevosDientes: DienteEstado[], nuevoId: number | null, nuevosMulti: OdontogramaMultipieza[] = []) => {
      setDientes(nuevosDientes);
      setIdOdontograma(nuevoId);
      setTratamientosMulti(nuevosMulti);
    },
    [],
  );

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  // "Guardar" se habilita sólo si hay al menos un diente con hallazgo.
  const hayHallazgos =
    dientes.some(
      (d) =>
        d.condicionGeneral !== 'SANO' ||
        SUPERFICIES.some((s) => d[s] !== 'SANO'),
    ) || tratamientosMulti.length > 0;

  const handleGuardarOdontograma = async () => {
    setGuardando(true);
    try {
      const dientesModificados = dientes.filter(
        (d) =>
          d.condicionGeneral !== 'SANO' ||
          SUPERFICIES.some((s) => d[s] !== 'SANO'),
      );

      // Upsert: Modificado para enviar el idCiclo
      const resultado = await odontogramaService.guardarCompleto(
        idPaciente,
        'INICIAL',
        dientesModificados,
        observaciones,
        idCiclo,
      );

      // Sincroniza los IDs
      const finalIdOdontograma = resultado.idOdontograma || idOdontograma;
      if (resultado.idOdontograma) {
        setIdOdontograma(resultado.idOdontograma);
        setInitialIdOdontograma(resultado.idOdontograma);
      }
      if (resultado.dientes?.length > 0) {
        setDientes(resultado.dientes);
        setInitialDientes(resultado.dientes);
      }

      // NUEVO: Enviar la lista de tratamientos multipieza al backend
      if (finalIdOdontograma) {
        const multiAEnviar = tratamientosMulti.map(t => ({ ...t, idOdontograma: finalIdOdontograma }));
        await odontogramaService.guardarTratamientosMulti(finalIdOdontograma, multiAEnviar);
      }

      showToast('Diagnóstico guardado correctamente', true);
    } catch {
      showToast('Error al guardar el diagnóstico. Intente nuevamente.', false);
    } finally {
      setGuardando(false);
    }
  };

  const handleExportarFicha = async () => {
    setExportando(true);
    try {
      const idDoctor = usuario?.idDoctor;

      const [presupuestos, evoluciones, tarifas, anamnesisData, doctor] = await Promise.all([
        presupuestoService.getPorPaciente(idPaciente).catch(() => []),
        evolucionService.getEvolucionesPorPaciente(idPaciente).catch(() => []),
        tarifarioService.getActivos().catch(() => []),
        getAnamnesisPorCiclo(idCiclo).catch(() => null),
        idDoctor
          ? doctorService.getDoctorById(idDoctor).catch(() => null)
          : Promise.resolve(null),
      ]);

      let anamnesis = null;
      if (anamnesisData?.respuestasJson) {
        try {
          const parsed = JSON.parse(anamnesisData.respuestasJson);
          anamnesis = {
            motivoConsulta:      parsed.motivoConsulta || '',
            riesgosDetectados:   parsed.riesgosDetectados || '',
            resumenCuestionario: parsed.resumenCuestionario || '',
          };
        } catch { /* ignorar JSON malformado */ }
      }

      await exportarFichaPdf({
        paciente,
        cicloFecha: cicloFecha ?? 'Sin fecha',
        presupuestos,
        evoluciones,
        tarifas,
        doctor,
        anamnesis,
      });
    } catch (err) {
      console.error('Error al exportar ficha:', err);
      showToast('Error al generar la ficha PDF. Intenta de nuevo.', false);
    } finally {
      setExportando(false);
    }
  };

  return (
    <div className="space-y-4">
      {toast && <Toast msg={toast.msg} ok={toast.ok} />}

      {/* ── Esqueleto de carga mientras resuelve el GET inicial ── */}
      {cargandoInicial ? (
        <div className="flex items-center justify-center gap-3 py-20 rounded-2xl border border-slate-200 bg-white shadow-sm">
          <Spinner />
          <span className="text-sm text-slate-400 font-medium">Cargando odontograma…</span>
        </div>
      ) : (
        /*
         * <Odontograma /> sólo se monta DESPUÉS de que la carga inicial resolvió.
         * Recibe initialDientes e initialIdOdontograma para que pueda pintar el
         * SVG de forma sincrónica (sin flash de dientes en blanco) y para que
         * NO realice su propio fetch duplicado al backend.
         */
        <Odontograma
          idPaciente={idPaciente}
          tipo="INICIAL"
          readOnly={false}             // forzado: siempre interactivo para diagnóstico
          onChange={handleChange}      // sincroniza diagnósticos con el padre
          hideSaveButton
          initialDientes={initialDientes}
          initialIdOdontograma={initialIdOdontograma}
          parentFetchDone={parentFetchDone}   // evita fetch duplicado
        />
      )}

      {/* ── Observaciones (Especificaciones de la Norma) ── */}
      {!cargandoInicial && !readOnly && (
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <h4 className="text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wide">
            Especificaciones / Observaciones
          </h4>
          <textarea
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            placeholder="Anote aquí especificaciones requeridas por la norma (ej. tipo de fractura, material de implante, etc.)"
            className="w-full h-20 p-3 text-sm text-slate-600 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white resize-none transition-all"
          />
        </div>
      )}

      {/* ── Botón Guardar Odontograma ── */}
      {!cargandoInicial && (
        <div className="flex items-center justify-between gap-4 px-1 py-2">
          <p className="text-xs text-slate-400">
            Los cambios no se envían al servidor hasta que presione &quot;Guardar Odontograma&quot;.
          </p>
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleExportarFicha}
              disabled={exportando || cargandoInicial}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-700 text-sm font-semibold hover:bg-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Exportar ficha clínica completa en PDF"
            >
              {exportando ? (
                <Spinner />
              ) : (
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              )}
              {exportando ? 'Generando ficha...' : 'Exportar Ficha PDF'}
            </button>
            <button
              onClick={handleGuardarOdontograma}
              disabled={guardando || !hayHallazgos}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 text-white text-sm font-semibold shadow-sm hover:bg-emerald-700 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              {guardando ? (
                <>
                  <Spinner />
                  Guardando...
                </>
              ) : (
                <>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-4 h-4 shrink-0"
                  >
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                    <polyline points="17 21 17 13 7 13 7 21" />
                    <polyline points="7 3 7 8 15 8" />
                  </svg>
                  Guardar Odontograma
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

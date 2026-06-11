import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPacienteById } from '../services/pacienteService';
import * as presupuestoService from '../services/presupuestoService';
import * as cicloService from '../services/cicloClinicoService';
import type { Paciente } from '../types/paciente';
import OdontogramaTab from '../components/OdontogramaTab';
import PresupuestosTab from '../components/PresupuestosTab';
import EvolucionesTab from '../components/EvolucionesTab';

type Tab = 'info' | 'anamnesis' | 'evoluciones' | 'odontograma' | 'presupuestos';

const TABS: { id: Tab; label: string }[] = [
  { id: 'info',        label: 'Información General' },
  { id: 'anamnesis',   label: 'Anamnesis / Antecedentes' },
  { id: 'odontograma', label: 'Odontograma' },
  { id: 'presupuestos',label: 'Plan de Tratamiento / Presupuesto' },
  { id: 'evoluciones', label: 'Evoluciones Clínicas' },
];

export default function PacientePerfilPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const idPac = Number(id);

  const [tab, setTab] = useState<Tab>('info');
  const [paciente, setPaciente] = useState<Paciente | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [odontogramaReadOnly, setOdontogramaReadOnly] = useState(false);
  const [ciclos, setCiclos] = useState<cicloService.CicloClinico[]>([]);
  const [idCicloSeleccionado, setIdCicloSeleccionado] = useState<number | null>(null);
  const [isCreatingCiclo, setIsCreatingCiclo] = useState(false);
  const [showModalCiclo, setShowModalCiclo] = useState(false);

  const confirmarNuevoCiclo = async () => {
    setIsCreatingCiclo(true);
    try {
      const nuevoCiclo = await cicloService.iniciarNuevoCiclo(idPac);
      const data = await cicloService.getCiclosPorPaciente(idPac);
      setCiclos(data);
      setIdCicloSeleccionado(nuevoCiclo.idCiclo);
      setShowModalCiclo(false);
      setTab('anamnesis');
    } catch (err) {
      console.error(err);
      alert('Error al crear un nuevo ciclo clínico. Intenta de nuevo.');
    } finally {
      setIsCreatingCiclo(false);
    }
  };

  useEffect(() => {
    cicloService.getCiclosPorPaciente(idPac)
      .then((data) => {
        setCiclos(data);
        if (data.length > 0) {
          setIdCicloSeleccionado(data[0].idCiclo);
        }
      })
      .catch(console.error);
  }, [idPac]);

  useEffect(() => {
    getPacienteById(idPac)
      .then(setPaciente)
      .catch(() => setError('No se pudo cargar la información del paciente.'))
      .finally(() => setLoading(false));
  }, [idPac]);

  useEffect(() => {
    presupuestoService.getPorPaciente(idPac).then((lista) => {
      const tieneEvoluciones = lista.some((p) =>
        (p.detalles ?? []).some((d) => d.estado === 'REALIZADO')
      );
      setOdontogramaReadOnly(tieneEvoluciones);
    }).catch(() => {});
  }, [idPac]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Cargando historia clínica...</p>
        </div>
      </div>
    );
  }

  if (error || !paciente) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl max-w-md text-center">
          <p className="font-semibold text-base">Error</p>
          <p className="text-sm mt-1">{error ?? 'Paciente no encontrado.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="w-full px-4 md:px-8 xl:px-12">

        <button
          onClick={() => navigate('/pacientes')}
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-blue-600 mb-5 transition-colors cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Volver a Pacientes
        </button>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-6 py-5 mb-6">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xl shrink-0 select-none">
              {paciente.nombre[0]}{paciente.apellido[0]}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-slate-900 truncate">
                {paciente.nombre} {paciente.apellido}
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">
                DNI: <span className="font-mono">{paciente.dni}</span>
                {' · '}
                Tel: {paciente.telefono}
              </p>
            </div>
            <div className="text-right shrink-0">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Fecha Nac.</span>
              <p className="text-sm font-semibold text-slate-700 mt-0.5">{paciente.fechaNacimiento}</p>
            </div>
          </div>

          {/* Selector de Máquina del Tiempo */}
          <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Historial Clínico:</span>
            </div>

            <div className="flex items-center gap-3">
              {ciclos.length > 0 && (
                <select
                  value={idCicloSeleccionado || ''}
                  onChange={(e) => setIdCicloSeleccionado(Number(e.target.value))}
                  className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block px-4 py-2 font-semibold transition-colors cursor-pointer outline-none"
                >
                  {ciclos.map((c, index) => (
                    <option key={c.idCiclo} value={c.idCiclo}>
                      {index === 0 ? `🟢 CICLO ACTUAL (${c.fechaInicio})` : `⚪ HISTÓRICO (${c.fechaInicio})`}
                    </option>
                  ))}
                </select>
              )}

              <button
                onClick={() => setShowModalCiclo(true)}
                disabled={isCreatingCiclo}
                className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 hover:bg-blue-100 disabled:opacity-50 text-sm font-semibold px-4 py-2 rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed border border-blue-200 shadow-sm"
                title="Iniciar nueva visita clínica"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Nuevo Ciclo
              </button>
            </div>
          </div>
        </div>

        <div className="border-b border-slate-200 mb-6">
          <nav className="flex gap-1">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-5 py-3 text-sm font-medium border-b-2 -mb-px transition-colors cursor-pointer ${
                  tab === t.id
                    ? 'border-blue-600 text-blue-700'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                {t.label}
              </button>
            ))}
          </nav>
        </div>

        {tab === 'info' && <InfoTab paciente={paciente} />}

        {idCicloSeleccionado ? (
          <>
            {tab === 'anamnesis' && <AnamnesisTab idPac={idPac} idCiclo={idCicloSeleccionado} />}
            {tab === 'evoluciones' && <EvolucionesTab idPaciente={idPac} idCiclo={idCicloSeleccionado} />}
            {tab === 'odontograma' && (
              <OdontogramaTab
                idPaciente={idPac}
                idCiclo={idCicloSeleccionado}
                readOnly={odontogramaReadOnly}
              />
            )}
            {tab === 'presupuestos' && <PresupuestosTab idPaciente={idPac} idCiclo={idCicloSeleccionado} />}
          </>
        ) : (
          tab !== 'info' && (
            <div className="py-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-200 mt-4">
              <p>No hay un ciclo clínico activo para mostrar. Inicia un nuevo ciclo.</p>
            </div>
          )
        )}
      </div>

      {showModalCiclo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-bold text-slate-800">Iniciar Nuevo Ciclo Clínico</h3>
              <button onClick={() => setShowModalCiclo(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-6 py-5">
              <p className="text-sm text-slate-600 leading-relaxed">
                ¿Estás seguro de que deseas iniciar un nuevo ciclo clínico para este paciente? Esta acción registrará el estado actual de su salud dental y creará un lienzo financiero en blanco (nuevos presupuestos y evoluciones).
              </p>
            </div>

            <div className="px-6 pb-5 flex justify-end gap-3">
              <button
                onClick={() => setShowModalCiclo(false)}
                className="px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarNuevoCiclo}
                disabled={isCreatingCiclo}
                className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors cursor-pointer inline-flex items-center gap-2"
              >
                {isCreatingCiclo && (
                  <div className="w-3.5 h-3.5 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                )}
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Types ────────────────────────────────────────────────────────────────────

type CampoBooleano = { tiene: boolean; detalle: string };

interface Cuestionario {
  motivoConsulta: string;
  enfermedad: CampoBooleano;
  fiebreReumatica: CampoBooleano;
  diabetes: CampoBooleano;
  alergiaMedicamentos: CampoBooleano;
  embarazo: CampoBooleano;
  reaccionAnestesia: CampoBooleano;
  sangradoEncias: CampoBooleano;
  presionAlta: CampoBooleano;
  trastornoCorazon: CampoBooleano;
  operacionesRecientes: CampoBooleano;
  tomaMedicamentos: CampoBooleano;
  hemorragiaPostExtraccion: CampoBooleano;
  nombreAcompanante: string;
  vecesCepilla: string;
  resumenCuestionario: string;
  riesgosDetectados: string;
  examenGeneral: string;
  examenExtraoral: string;
  examenIntraoral: string;
  examenesEspeciales: string;
}

// ── Constants ────────────────────────────────────────────────────────────────

const PREGUNTAS_BOOL = [
  { key: 'enfermedad',              label: '¿Padece o ha padecido alguna enfermedad?' },
  { key: 'fiebreReumatica',         label: '¿Ha tenido fiebre reumática?' },
  { key: 'diabetes',                label: '¿Padece diabetes?' },
  { key: 'alergiaMedicamentos',     label: '¿Es alérgico/a a algún medicamento?' },
  { key: 'embarazo',                label: '¿Está embarazada o en período de lactancia?' },
  { key: 'reaccionAnestesia',       label: '¿Ha tenido reacción a algún anestésico?' },
  { key: 'sangradoEncias',          label: '¿Sangra con facilidad de las encías?' },
  { key: 'presionAlta',             label: '¿Padece presión arterial alta?' },
  { key: 'trastornoCorazon',        label: '¿Tiene trastornos cardíacos?' },
  { key: 'operacionesRecientes',    label: '¿Ha sido operado/a recientemente?' },
  { key: 'tomaMedicamentos',        label: '¿Toma algún medicamento actualmente?' },
  { key: 'hemorragiaPostExtraccion',label: '¿Ha tenido hemorragia post-extracción?' },
] as const;

type PreguntaBoolKey = typeof PREGUNTAS_BOOL[number]['key'];

const EXAMEN_CLINICO_FIELDS: {
  key: 'examenGeneral' | 'examenExtraoral' | 'examenIntraoral' | 'examenesEspeciales';
  label: string;
  placeholder: string;
}[] = [
  { key: 'examenGeneral',      label: 'Examen clínico general elemental',  placeholder: 'ABEG' },
  { key: 'examenExtraoral',    label: 'Examen clínico extraoral',           placeholder: 'Sin alteraciones aparentes...' },
  { key: 'examenIntraoral',    label: 'Examen clínico intraoral',           placeholder: 'Mucosas en buen estado...' },
  { key: 'examenesEspeciales', label: 'Exámenes especiales',                placeholder: 'Radiografías, modelos de estudio...' },
];

const campo = (): CampoBooleano => ({ tiene: false, detalle: '' });

const CUESTIONARIO_INICIAL: Cuestionario = {
  motivoConsulta:           '',
  enfermedad:               campo(),
  fiebreReumatica:          campo(),
  diabetes:                 campo(),
  alergiaMedicamentos:      campo(),
  embarazo:                 campo(),
  reaccionAnestesia:        campo(),
  sangradoEncias:           campo(),
  presionAlta:              campo(),
  trastornoCorazon:         campo(),
  operacionesRecientes:     campo(),
  tomaMedicamentos:         campo(),
  hemorragiaPostExtraccion: campo(),
  nombreAcompanante:        '',
  vecesCepilla:             '',
  resumenCuestionario:      '',
  riesgosDetectados:        '',
  examenGeneral:            'ABEG',
  examenExtraoral:          '',
  examenIntraoral:          '',
  examenesEspeciales:       '',
};

// ── Sub-components ───────────────────────────────────────────────────────────

function InfoTab({ paciente }: { paciente: Paciente }) {
  const fields = [
    { label: 'Nombre completo', value: `${paciente.nombre} ${paciente.apellido}` },
    { label: 'DNI', value: paciente.dni },
    { label: 'Teléfono', value: paciente.telefono },
    { label: 'Fecha de Nacimiento', value: paciente.fechaNacimiento },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-5">Datos del Paciente</h3>
      <dl className="grid grid-cols-2 gap-x-8 gap-y-5">
        {fields.map(({ label, value }) => (
          <div key={label}>
            <dt className="text-xs text-slate-400 font-medium mb-0.5">{label}</dt>
            <dd className="text-sm font-semibold text-slate-800">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function SectionBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="bg-blue-600 px-5 py-3">
        <h3 className="text-sm font-semibold text-white tracking-wide uppercase">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function Toggle({ value, onChange }: { value: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 cursor-pointer ${
        value ? 'bg-blue-500' : 'bg-slate-300'
      }`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
          value ? 'translate-x-4' : 'translate-x-0.5'
        }`}
      />
    </button>
  );
}

function PreguntaRow({
  label,
  campo: c = { tiene: false, detalle: '' },
  onToggle,
  onDetalle,
}: {
  label: string;
  campo: CampoBooleano;
  onToggle: () => void;
  onDetalle: (v: string) => void;
}) {
  return (
    <div className="bg-white px-4 py-3 flex flex-col gap-2 min-h-[52px]">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-slate-700 leading-snug">{label}</span>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-xs font-semibold transition-colors ${!c.tiene ? 'text-slate-600' : 'text-slate-400'}`}>
            No
          </span>
          <Toggle value={c.tiene} onChange={onToggle} />
          <span className={`text-xs font-semibold transition-colors ${c.tiene ? 'text-blue-600' : 'text-slate-400'}`}>
            Sí
          </span>
        </div>
      </div>
      {c.tiene && (
        <input
          type="text"
          value={c.detalle}
          onChange={(e) => onDetalle(e.target.value)}
          placeholder="Especifique..."
          autoFocus
          className="text-xs border border-blue-200 rounded-lg px-2.5 py-1.5 text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-400 bg-blue-50 w-full transition"
        />
      )}
    </div>
  );
}

function AnamnesisTab({ idPac, idCiclo }: { idPac: number; idCiclo: number }) {
  const [cuestionario, setCuestionario] = useState<Cuestionario>(CUESTIONARIO_INICIAL);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  useEffect(() => {
    import('../services/anamnesisService').then(({ getAnamnesisPorCiclo }) => {
      getAnamnesisPorCiclo(idCiclo).then((data) => {
        if (data?.respuestasJson) {
          try {
            const parsedData = JSON.parse(data.respuestasJson);
            setCuestionario({ ...CUESTIONARIO_INICIAL, ...parsedData })
          } catch {
            // Ignorar JSON malformado
          }
        } else {
          setCuestionario(CUESTIONARIO_INICIAL);
        }
      });
    });
  }, [idCiclo]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const toggleBool = (key: PreguntaBoolKey) => {
    setCuestionario((prev) => ({
      ...prev,
      [key]: {
        tiene: !prev[key].tiene,
        detalle: prev[key].tiene ? '' : prev[key].detalle,
      },
    }));
  };

  const setDetalle = (key: PreguntaBoolKey, detalle: string) => {
    setCuestionario((prev) => ({
      ...prev,
      [key]: { ...prev[key], detalle },
    }));
  };

  const setTextField = (key: keyof Cuestionario, value: string) => {
    setCuestionario((prev) => ({ ...prev, [key]: value }));
  };

  const handleGuardar = async () => {
    setSaving(true);
    try {
      const { saveAnamnesis } = await import('../services/anamnesisService');
      await saveAnamnesis({ idPaciente: idPac, idCiclo, respuestasJson: JSON.stringify(cuestionario) });
      setToast({ msg: 'Historia Clínica guardada con éxito', ok: true });
    } catch {
      setToast({ msg: 'No se pudo guardar. Intenta de nuevo.', ok: false });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">

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

      {/* Bloque 1: Motivo de Consulta */}
      <SectionBlock title="Motivo de Consulta">
        <textarea
          value={cuestionario.motivoConsulta}
          onChange={(e) => setTextField('motivoConsulta', e.target.value)}
          rows={3}
          placeholder="Describa el motivo principal de la consulta del paciente..."
          className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
        />
      </SectionBlock>

      {/* Bloque 2: Cuestionario de Salud */}
      <SectionBlock title="Cuestionario de Salud">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-slate-100 border border-slate-200 rounded-xl overflow-hidden">
          {PREGUNTAS_BOOL.map(({ key, label }) => (
            <PreguntaRow
              key={key}
              label={label}
              campo={cuestionario[key]}
              onToggle={() => toggleBool(key)}
              onDetalle={(v) => setDetalle(key, v)}
            />
          ))}
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-600">Nombre del acompañante</label>
            <input
              type="text"
              value={cuestionario.nombreAcompanante}
              onChange={(e) => setTextField('nombreAcompanante', e.target.value)}
              placeholder="Nombre completo del acompañante..."
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-600">Veces al día que cepilla los dientes</label>
            <input
              type="text"
              value={cuestionario.vecesCepilla}
              onChange={(e) => setTextField('vecesCepilla', e.target.value)}
              placeholder="Ej: 2 veces al día..."
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>
        </div>
      </SectionBlock>

      {/* Bloque 3: Resumen y Análisis de Riesgos */}
      <SectionBlock title="Resumen y Análisis de Riesgos">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-600">Resumen del cuestionario</label>
            <textarea
              value={cuestionario.resumenCuestionario}
              onChange={(e) => setTextField('resumenCuestionario', e.target.value)}
              rows={4}
              placeholder="Resumen clínico general del cuestionario de salud..."
              className="border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-600">Riesgos detectados</label>
            <textarea
              value={cuestionario.riesgosDetectados}
              onChange={(e) => setTextField('riesgosDetectados', e.target.value)}
              rows={4}
              placeholder="Ej: Paciente diabético, riesgo de infección elevado..."
              className="border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
            />
          </div>
        </div>
      </SectionBlock>

      {/* Bloque 4: Examen Clínico */}
      <SectionBlock title="Examen Clínico">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {EXAMEN_CLINICO_FIELDS.map(({ key, label, placeholder }) => (
            <div key={key} className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-600">{label}</label>
              <input
                type="text"
                value={cuestionario[key]}
                onChange={(e) => setTextField(key, e.target.value)}
                placeholder={placeholder}
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>
          ))}
        </div>
      </SectionBlock>

      {/* Botón de Acción */}
      <div className="flex justify-end pb-4">
        <button
          type="button"
          onClick={handleGuardar}
          disabled={saving}
          className="inline-flex items-center gap-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-blue-400 text-white font-semibold px-8 py-3 rounded-xl transition-colors shadow-sm cursor-pointer disabled:cursor-not-allowed text-sm"
        >
          {saving ? (
            <div className="w-4 h-4 border-2 border-white/60 border-t-white rounded-full animate-spin" />
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V7l-4-4z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 17v-6m0 0H9m3 0h3" />
            </svg>
          )}
          {saving ? 'Guardando...' : 'Guardar Historia Clínica'}
        </button>
      </div>
    </div>
  );
}


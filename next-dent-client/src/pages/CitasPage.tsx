import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getCitas, createCita, updateCita, deleteCita } from '../services/citaService';
import axiosInstance from '../config/axiosInstance';
import type { Cita, CitaPayload } from '../types/cita';
import CalendarioSemanal from '../components/CalendarioSemanal';
import { getDiasDeSemana, formatRangoSemana } from '../utils/fechas';
import { CampoConError } from '../components/CampoConError';
import {
  type ErroresFormulario,
  validarFechaFutura,
  hayErrores,
} from '../utils/validaciones';

interface PacienteLista {
  idPac: number;
  nombre: string;
  apellido: string;
  dni?: string;
}

interface DoctorLista {
  idDoc: number;
  nombre: string;
  apellido: string;
  especialidad?: string;
}

function displayFecha(fecha: string | null, hora: string | null): string {
  if (!fecha) return '—';
  const [y, m, d] = fecha.split('-');
  return `${d}/${m}/${y}${hora ? `  ${hora}` : ''}`;
}

function getNombrePaciente(c: Cita): string {
  if (c.paciente) return `${c.paciente.nombre} ${c.paciente.apellido}`;
  return 'Sin paciente';
}

function fechaOrdenable(c: Cita): string {
  return c.fecha ? `${c.fecha}T${c.hora ?? '00:00'}` : '';
}

const ESTADO_BADGE: Record<string, string> = {
  Pendiente:  'bg-amber-100 text-amber-700',
  Confirmada: 'bg-blue-100 text-blue-700',
  Completada: 'bg-emerald-100 text-emerald-700',
  Cancelada:  'bg-red-100 text-red-600',
};

type EstadoFilter = 'Todas' | 'Pendiente' | 'Confirmada' | 'Completada' | 'Cancelada';
type FechaFilter = 'todos' | 'hoy' | 'semana' | 'mes';

type FormData = {
  pacienteId: number | '';
  idDoc: number | '';
  fecha: string;
  hora: string;
  estado: string;
  motivo: string;
  notas: string;
};

const EMPTY_FORM: FormData = {
  pacienteId: '',
  idDoc: '',
  fecha: '',
  hora: '',
  estado: 'Pendiente',
  motivo: '',
  notas: '',
};

// ── Íconos inline ─────────────────────────────────────────────────────────────
const IconSearch = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);
const IconPlus = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
);
const IconPencil = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.536-6.536a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-1.414.586H8v-2.414a2 2 0 01.586-1.414z" />
  </svg>
);
const IconXSm = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);
const IconX = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

// ── Componente principal ───────────────────────────────────────────────────────
export default function CitasPage() {
  const [citas, setCitas] = useState<Cita[]>([]);
  const [pacientes, setPacientes] = useState<PacienteLista[]>([]);
  const [doctores, setDoctores] = useState<DoctorLista[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<EstadoFilter>('Todas');
  const [filtroFecha, setFiltroFecha] = useState<FechaFilter>('todos');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Cita | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [errores, setErrores] = useState<ErroresFormulario<FormData>>({});
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [vistaCalendario, setVistaCalendario] = useState(false);
  const [semanaOffset, setSemanaOffset] = useState(0);
  const [filtroDoctorId, setFiltroDoctorId] = useState<number | 'todos'>('todos');
  const [diaActivoMobile, setDiaActivoMobile] = useState(() => new Date().toISOString().split('T')[0]);

  const diasSemana = useMemo(() => getDiasDeSemana(semanaOffset), [semanaOffset]);
  const rangoSemana = useMemo(() => formatRangoSemana(diasSemana), [diasSemana]);

  const [searchParams] = useSearchParams();
  useEffect(() => {
    if (searchParams.get('nuevo') === 'true') setModalOpen(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Carga inicial ──────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      const [resCitas, resPacientes, resDoctores] = await Promise.allSettled([
        getCitas(),
        axiosInstance.get<PacienteLista[]>('/pacientes'),
        axiosInstance.get<DoctorLista[]>('/doctores'),
      ]);
      if (resCitas.status === 'fulfilled') setCitas(resCitas.value);
      else setError('No se pudieron cargar las citas. Verifica que el servidor esté activo.');
      if (resPacientes.status === 'fulfilled') setPacientes(resPacientes.value.data);
      if (resDoctores.status === 'fulfilled') setDoctores(resDoctores.value.data);
      setLoading(false);
    };
    load();
  }, []);

  // ── Filtros ────────────────────────────────────────────────────────────────
  const citasFiltradas = useMemo(() => {
    const hoy = new Date();
    const isoHoy = hoy.toISOString().slice(0, 10);
    const inicioSemana = new Date(hoy);
    inicioSemana.setDate(hoy.getDate() - hoy.getDay());
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

    return [...citas]
      .filter((c) => {
        if (busqueda && !getNombrePaciente(c).toLowerCase().includes(busqueda.toLowerCase())) return false;
        if (filtroEstado !== 'Todas' && c.estado !== filtroEstado) return false;
        if (filtroFecha !== 'todos' && c.fecha) {
          const fechaCita = new Date(c.fecha + 'T00:00:00');
          if (filtroFecha === 'hoy' && c.fecha !== isoHoy) return false;
          if (filtroFecha === 'semana' && fechaCita < inicioSemana) return false;
          if (filtroFecha === 'mes' && fechaCita < inicioMes) return false;
        }
        return true;
      })
      .sort((a, b) => fechaOrdenable(b).localeCompare(fechaOrdenable(a)));
  }, [citas, busqueda, filtroEstado, filtroFecha]);

  // ── Modal helpers ──────────────────────────────────────────────────────────
  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY_FORM, idDoc: doctores.length === 1 ? doctores[0].idDoc : '' });
    setFormError(null);
    setErrores({});
    setModalOpen(true);
  };

  const openEdit = (c: Cita) => {
    setEditing(c);
    setForm({
      pacienteId: c.paciente?.idPac ?? '',
      idDoc: c.idDoc ?? '',
      fecha: c.fecha ?? '',
      hora: c.hora ?? '',
      estado: c.estado,
      motivo: c.motivo ?? '',
      notas: c.notas ?? '',
    });
    setFormError(null);
    setErrores({});
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false); setEditing(null); setForm(EMPTY_FORM); setFormError(null); setErrores({});
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  // ── Submit ─────────────────────────────────────────────────────────────────
  function validarFormulario(): boolean {
    const e: ErroresFormulario<FormData> = {
      pacienteId: form.pacienteId === '' ? 'Selecciona un paciente.' : undefined,
      idDoc: form.idDoc === '' ? 'Selecciona un doctor.' : undefined,
      fecha: validarFechaFutura(`${form.fecha}T${form.hora}`),
      motivo: !form.motivo.trim()
        ? 'Motivo es obligatorio.'
        : form.motivo.trim().length < 5 ? 'El motivo debe tener al menos 5 caracteres.' : undefined,
    };
    setErrores(e);
    return !hayErrores(e);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validarFormulario()) return;
    const payload: CitaPayload = {
      paciente: { idPac: Number(form.pacienteId) },
      idDoc: Number(form.idDoc),
      fecha: form.fecha,
      hora: form.hora,
      estado: form.estado,
      motivo: form.motivo || undefined,
      notas: form.notas || undefined,
    };
    setSaving(true);
    setFormError(null);
    try {
      if (editing?.idCita !== undefined) {
        const updated = await updateCita(editing.idCita, payload);
        setCitas((prev) => prev.map((c) => (c.idCita === editing.idCita ? updated : c)));
      } else {
        const created = await createCita(payload);
        setCitas((prev) => [...prev, created]);
      }
      closeModal();
    } catch {
      setFormError('Error al guardar. Verifica los datos e intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      await deleteCita(id);
      setCitas((prev) => prev.filter((c) => c.idCita !== id));
    } catch {
      setError('No se pudo eliminar la cita.');
    } finally {
      setDeletingId(null);
    }
  };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-100">
        <div className="flex flex-col items-center gap-3">
          <div className="w-9 h-9 border-[3px] border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500">Cargando citas...</p>
        </div>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="bg-slate-100 min-h-screen p-6">
      <div className="max-w-7xl mx-auto space-y-5">

        {/* ── Cabecera ────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-800">Citas</h1>
            <p className="hidden sm:block text-sm font-medium text-slate-500 mt-0.5">
              Gestión de agenda y citas clínicas
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Toggle Lista / Semana */}
            <div className="flex items-center bg-slate-100 rounded-xl p-1">
              <button
                onClick={() => setVistaCalendario(false)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  !vistaCalendario
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Lista
              </button>
              <button
                onClick={() => setVistaCalendario(true)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  vistaCalendario
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Semana
              </button>
            </div>
            <button
              onClick={openCreate}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-4 py-2 text-sm font-medium transition-colors shadow-sm whitespace-nowrap"
            >
              <IconPlus />
              Nueva cita
            </button>
          </div>
        </div>

        {/* ── Navegación semana (solo en vista calendario) ─────────────── */}
        {vistaCalendario && (
          <div className="flex items-center justify-between bg-white rounded-2xl border border-slate-200 px-4 py-2.5">
            <button
              onClick={() => setSemanaOffset((o) => o - 1)}
              className="flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Anterior
            </button>
            <span className="text-sm font-semibold text-slate-700">{rangoSemana}</span>

            {/* Selector de doctor */}
            <select
              value={filtroDoctorId}
              onChange={(e) => setFiltroDoctorId(e.target.value === 'todos' ? 'todos' : Number(e.target.value))}
              className="border border-slate-200 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white text-slate-700"
            >
              <option value="todos">Todos los doctores</option>
              {doctores.map((d) => (
                <option key={d.idDoc} value={d.idDoc}>
                  Dr. {d.nombre} {d.apellido}
                </option>
              ))}
            </select>

            <button
              onClick={() => setSemanaOffset((o) => o + 1)}
              className="flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors"
            >
              Siguiente
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}

        {/* ── Error global ────────────────────────────────────────────────── */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 ml-4">
              <IconX />
            </button>
          </div>
        )}

        {/* ── Vista Calendario ────────────────────────────────────────────── */}
        {vistaCalendario && (
          <CalendarioSemanal
            citas={citas}
            semanaOffset={semanaOffset}
            onCitaClick={openEdit}
            doctores={doctores}
            filtroDoctorId={filtroDoctorId}
            diaActivoMobile={diaActivoMobile}
            onDiaCambia={setDiaActivoMobile}
          />
        )}

        {/* ── Vista Lista ──────────────────────────────────────────────────── */}
        {!vistaCalendario && (<>
        {/* ── Filtros ─────────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <IconSearch />
              </span>
              <input
                type="text"
                placeholder="Buscar por nombre de paciente..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 placeholder-slate-400 transition"
              />
            </div>
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value as EstadoFilter)}
              className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white text-slate-700"
            >
              <option value="Todas">Todos los estados</option>
              <option value="Pendiente">Pendiente</option>
              <option value="Confirmada">Confirmada</option>
              <option value="Completada">Completada</option>
              <option value="Cancelada">Cancelada</option>
            </select>
            <select
              value={filtroFecha}
              onChange={(e) => setFiltroFecha(e.target.value as FechaFilter)}
              className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white text-slate-700"
            >
              <option value="todos">Todas las fechas</option>
              <option value="hoy">Hoy</option>
              <option value="semana">Esta semana</option>
              <option value="mes">Este mes</option>
            </select>
          </div>
        </div>

        {/* ── Tabla / Cards ───────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          {citasFiltradas.length === 0 ? (
            <div className="py-20 flex flex-col items-center gap-2">
              <svg className="w-10 h-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-slate-500 font-medium text-sm">No hay citas registradas</p>
              <p className="text-slate-400 text-xs">Intenta con otros filtros o crea una nueva cita.</p>
            </div>
          ) : (
            <>
              {/* Tabla — desktop */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">#</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">Paciente</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">Doctor</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">Fecha y hora</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">Motivo</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">Estado</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wide">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {citasFiltradas.map((c, i) => {
                      const doc = doctores.find((d) => d.idDoc === c.idDoc);
                      return (
                        <tr
                          key={c.idCita}
                          className="border-b border-slate-50 hover:bg-slate-50 transition-colors group"
                        >
                          <td className="px-6 py-4 text-sm text-slate-400 font-mono">{i + 1}</td>
                          <td className="px-6 py-4 text-sm font-medium text-slate-700">
                            {getNombrePaciente(c)}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600">
                            {doc
                              ? `Dr. ${doc.nombre} ${doc.apellido}`
                              : c.idDoc ? `Doctor #${c.idDoc}` : '—'}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600 whitespace-nowrap">
                            {displayFecha(c.fecha, c.hora)}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600 max-w-[160px] truncate">
                            {c.motivo || '—'}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ESTADO_BADGE[c.estado] ?? 'bg-slate-100 text-slate-600'}`}>
                              {c.estado}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="inline-flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => openEdit(c)}
                                className="flex items-center gap-1 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1.5 rounded-lg transition-colors"
                              >
                                <IconPencil />
                                Editar
                              </button>
                              <button
                                onClick={() => c.idCita !== undefined && handleDelete(c.idCita)}
                                disabled={deletingId === c.idCita}
                                className="flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                              >
                                {deletingId === c.idCita
                                  ? <div className="w-3.5 h-3.5 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                                  : <IconXSm />}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Cards — móvil */}
              <div className="sm:hidden space-y-2 px-4 py-3">
                {citasFiltradas.map((cita) => (
                  <div key={cita.idCita} className="bg-white rounded-xl border border-slate-200 p-4">
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">
                          {getNombrePaciente(cita)}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {displayFecha(cita.fecha, cita.hora)}
                        </p>
                      </div>
                      <span className={`flex-shrink-0 text-xs px-2 py-1 rounded-full font-medium ${ESTADO_BADGE[cita.estado] ?? ''}`}>
                        {cita.estado}
                      </span>
                    </div>
                    {cita.motivo && (
                      <p className="text-xs text-slate-400 mb-3 truncate">{cita.motivo}</p>
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEdit(cita)}
                        className="flex-1 text-xs py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => cita.idCita !== undefined && handleDelete(cita.idCita)}
                        disabled={deletingId === cita.idCita}
                        className="flex-1 text-xs py-1.5 rounded-lg border border-red-100 text-red-500 hover:bg-red-50 disabled:opacity-50"
                      >
                        {deletingId === cita.idCita
                          ? <span className="flex justify-center"><div className="w-3.5 h-3.5 border-2 border-red-400 border-t-transparent rounded-full animate-spin" /></span>
                          : 'Eliminar'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* ── Contador ────────────────────────────────────────────────────── */}
        <p className="text-xs text-slate-400 text-right">
          {citasFiltradas.length} resultado{citasFiltradas.length !== 1 ? 's' : ''}
        </p>
        </>)}
      </div>

      {/* ── FAB — solo móvil ─────────────────────────────────────────────── */}
      <button
        onClick={openCreate}
        className="fixed bottom-6 right-6 sm:hidden z-20 w-14 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg flex items-center justify-center transition-colors"
        aria-label="Nueva cita"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      </button>

      {/* ── Modal ────────────────────────────────────────────────────────── */}
      {modalOpen && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div className="bg-white rounded-2xl p-4 sm:p-6 w-full sm:max-w-lg shadow-xl mx-4 sm:mx-auto max-h-[90vh] overflow-y-auto">

            {/* Header modal */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h2 className="text-sm font-semibold text-slate-900">
                  {editing ? 'Editar cita' : 'Nueva cita'}
                </h2>
              </div>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 transition-colors">
                <IconX />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2.5 rounded-xl">
                  {formError}
                </div>
              )}

              {/* Paciente */}
              <CampoConError error={errores.pacienteId}>
                <label className="text-xs font-medium text-slate-600">Paciente</label>
                <select
                  name="pacienteId"
                  value={form.pacienteId}
                  onChange={handleChange}
                  className={`border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 bg-white text-slate-700 ${
                    errores.pacienteId ? 'border-red-400 focus:ring-red-400/40' : 'border-slate-200 focus:ring-indigo-300'
                  }`}
                >
                  <option value="">Seleccionar paciente...</option>
                  {pacientes.map((p) => (
                    <option key={p.idPac} value={p.idPac}>
                      {p.nombre} {p.apellido}{p.dni ? ` — DNI ${p.dni}` : ''}
                    </option>
                  ))}
                </select>
              </CampoConError>

              {/* Doctor */}
              <CampoConError error={errores.idDoc}>
                <label className="text-xs font-medium text-slate-600">Doctor</label>
                <select
                  name="idDoc"
                  value={form.idDoc}
                  onChange={handleChange}
                  className={`border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 bg-white text-slate-700 ${
                    errores.idDoc ? 'border-red-400 focus:ring-red-400/40' : 'border-slate-200 focus:ring-indigo-300'
                  }`}
                >
                  <option value="">Seleccionar doctor...</option>
                  {doctores.map((d) => (
                    <option key={d.idDoc} value={d.idDoc}>
                      Dr. {d.nombre} {d.apellido}{d.especialidad ? ` — ${d.especialidad}` : ''}
                    </option>
                  ))}
                </select>
              </CampoConError>

              {/* Fecha + Hora */}
              <div className="grid grid-cols-2 gap-4">
                <CampoConError error={errores.fecha}>
                  <label className="text-xs font-medium text-slate-600">Fecha</label>
                  <input
                    name="fecha"
                    type="date"
                    value={form.fecha}
                    onChange={handleChange}
                    className={`border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                      errores.fecha ? 'border-red-400 focus:ring-red-400/40' : 'border-slate-200 focus:ring-indigo-300'
                    }`}
                  />
                </CampoConError>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-slate-600">Hora</label>
                  <input
                    name="hora"
                    type="time"
                    value={form.hora}
                    onChange={handleChange}
                    required
                    className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  />
                </div>
              </div>

              {/* Motivo */}
              <CampoConError error={errores.motivo}>
                <label className="text-xs font-medium text-slate-600">Motivo de consulta</label>
                <textarea
                  name="motivo"
                  value={form.motivo}
                  onChange={handleChange}
                  placeholder="Ej: Dolor molar, limpieza, revisión..."
                  rows={2}
                  className={`border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 resize-none placeholder-slate-400 ${
                    errores.motivo ? 'border-red-400 focus:ring-red-400/40' : 'border-slate-200 focus:ring-indigo-300'
                  }`}
                />
              </CampoConError>

              {/* Estado */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-600">Estado</label>
                <select
                  name="estado"
                  value={form.estado}
                  onChange={handleChange}
                  className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white text-slate-700"
                >
                  <option value="Pendiente">Pendiente</option>
                  <option value="Confirmada">Confirmada</option>
                  <option value="Completada">Completada</option>
                  <option value="Cancelada">Cancelada</option>
                </select>
              </div>

              {/* Notas */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-600">Notas adicionales</label>
                <textarea
                  name="notas"
                  value={form.notas}
                  onChange={handleChange}
                  placeholder="Observaciones, indicaciones especiales..."
                  rows={2}
                  className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none placeholder-slate-400"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeModal}
                  className="text-sm font-medium text-slate-600 hover:text-slate-900 px-4 py-2 rounded-xl hover:bg-slate-100 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-sm font-medium px-5 py-2 rounded-xl transition-colors disabled:cursor-not-allowed"
                >
                  {saving && <div className="w-4 h-4 border-2 border-white/60 border-t-white rounded-full animate-spin" />}
                  {editing ? 'Guardar cambios' : 'Crear cita'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

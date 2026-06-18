import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getPacientes,
  createPaciente,
  updatePaciente,
  deletePaciente,
} from '../services/pacienteService';
import type { Paciente } from '../types/paciente';
import KpiBar from '../components/KpiBar';
import { CampoConError } from '../components/CampoConError';
import {
  type ErroresFormulario,
  validarTelefono,
  validarFechaNoFutura,
  hayErrores,
} from '../utils/validaciones';

type FormData = Omit<Paciente, 'idPac'>;

const EMPTY_FORM: FormData = {
  nombre: '',
  apellido: '',
  dni: '',
  telefono: '',
  fechaNacimiento: '',
  correo: '',
  sexo: '',
  direccion: '',
};

const calcularEdad = (fecha: string) => {
  if (!fecha) return '—';
  const hoy = new Date();
  const cumple = new Date(fecha);
  let edad = hoy.getFullYear() - cumple.getFullYear();
  const m = hoy.getMonth() - cumple.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < cumple.getDate())) edad--;
  return edad;
};

// Colores de avatar por inicial
const AVATAR_COLORS = [
  'bg-indigo-100 text-indigo-700',
  'bg-violet-100 text-violet-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
  'bg-sky-100 text-sky-700',
  'bg-teal-100 text-teal-700',
  'bg-fuchsia-100 text-fuchsia-700',
];

const avatarColor = (nombre: string) => {
  const code = (nombre.charCodeAt(0) || 0) + (nombre.charCodeAt(1) || 0);
  return AVATAR_COLORS[code % AVATAR_COLORS.length];
};

const initials = (nombre: string, apellido: string) =>
  `${nombre.charAt(0)}${apellido.charAt(0)}`.toUpperCase();

// ── Íconos inline (evita depender de librerías extra) ─────────────────────────
const IconSearch = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);
const IconPhone = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
  </svg>
);
const IconMail = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);
const IconClipboard = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
  </svg>
);
const IconPencil = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.536-6.536a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-1.414.586H8v-2.414a2 2 0 01.586-1.414z" />
  </svg>
);
const IconTrash = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4h6v3M4 7h16" />
  </svg>
);
const IconPlus = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
);
const IconX = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

// ── Componente principal ───────────────────────────────────────────────────────
export default function PacientesPage() {
  const navigate = useNavigate();
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [busqueda, setBusqueda] = useState('');
  const [filtroSexo, setFiltroSexo] = useState<'todos' | 'M' | 'F'>('todos');
  const [paginaActual, setPaginaActual] = useState(1);
  const itemsPorPagina = 12;

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Paciente | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [errores, setErrores] = useState<ErroresFormulario<FormData>>({});
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchPacientes = () =>
    getPacientes()
      .then(setPacientes)
      .catch(() => setError('No se pudo conectar con el servidor.'))
      .finally(() => setLoading(false));

  useEffect(() => { fetchPacientes(); }, []);
  useEffect(() => { setPaginaActual(1); }, [busqueda, filtroSexo]);

  const pacientesFiltrados = useMemo(() => {
    const query = busqueda.toLowerCase().trim();
    return pacientes.filter((p) => {
      const matchQuery = !query || `${p.nombre} ${p.apellido} ${p.dni}`.toLowerCase().includes(query);
      const matchSexo = filtroSexo === 'todos' || p.sexo === filtroSexo;
      return matchQuery && matchSexo;
    });
  }, [pacientes, busqueda, filtroSexo]);

  const totalPaginas = Math.ceil(pacientesFiltrados.length / itemsPorPagina) || 1;
  const pacientesPaginados = pacientesFiltrados.slice(
    (paginaActual - 1) * itemsPorPagina,
    paginaActual * itemsPorPagina,
  );

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setFormError(null); setErrores({}); setModalOpen(true); };
  const openEdit = (p: Paciente) => {
    setEditing(p);
    setForm({ nombre: p.nombre, apellido: p.apellido, dni: p.dni, telefono: p.telefono, fechaNacimiento: p.fechaNacimiento, correo: p.correo || '', sexo: p.sexo || '', direccion: p.direccion || '' });
    setFormError(null); setErrores({}); setModalOpen(true);
  };
  const closeModal = () => { setModalOpen(false); setEditing(null); setForm(EMPTY_FORM); setFormError(null); setErrores({}); };
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  function validarFormulario(): boolean {
    const e: ErroresFormulario<FormData> = {
      nombre: !form.nombre.trim()
        ? 'Nombre es obligatorio.'
        : form.nombre.trim().length < 2 ? 'Nombre debe tener al menos 2 caracteres.' : undefined,
      apellido: !form.apellido.trim()
        ? 'Apellido es obligatorio.'
        : form.apellido.trim().length < 2 ? 'Apellido debe tener al menos 2 caracteres.' : undefined,
      telefono: validarTelefono(form.telefono),
      fechaNacimiento: validarFechaNoFutura(form.fechaNacimiento),
      dni: form.dni.length > 8 ? 'El DNI no puede tener más de 8 dígitos.' : 
     !form.dni.trim() ? 'El DNI es obligatorio.' : undefined,
      
    };
    setErrores(e);
    return !hayErrores(e);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validarFormulario()) return;
    setSaving(true); setFormError(null);
    try {
      if (editing) {
        const updated = await updatePaciente(editing.idPac!, form);
        setPacientes((prev) => prev.map((p) => (p.idPac === editing.idPac ? updated : p)));
      } else {
        const created = await createPaciente(form);
        setPacientes((prev) => [created, ...prev]);
      }
      closeModal();
    } catch { setFormError('Error al guardar. Verifica los datos e intenta de nuevo.'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Estás seguro de eliminar este paciente?')) return;
    setDeletingId(id);
    try { await deletePaciente(id); setPacientes((prev) => prev.filter((p) => p.idPac !== id)); }
    catch { alert('No se pudo eliminar el paciente.'); }
    finally { setDeletingId(null); }
  };

  // ── Estados de carga / error ──────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-100">
        <div className="flex flex-col items-center gap-3">
          <div className="w-9 h-9 border-[3px] border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500">Cargando pacientes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-100">
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl max-w-md text-center">
          <p className="font-semibold">Error de conexión</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  // ── KPI helpers ────────────────────────────────────────────────────────────
  const totalMasc = pacientes.filter((p) => p.sexo === 'M').length;
  const totalFem = pacientes.filter((p) => p.sexo === 'F').length;

  return (
    <div className="min-h-screen bg-slate-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-5">

        {/* ── KPIs ──────────────────────────────────────────────────────────── */}
        <KpiBar />

        {/* ── Barra de búsqueda + filtros + botón ───────────────────────────── */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Búsqueda */}
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <IconSearch />
            </span>
            <input
              type="text"
              placeholder="Buscar por nombre, apellido o DNI..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 placeholder-slate-400 transition"
            />
          </div>

          {/* Chips de filtro sexo */}
          <div className="flex gap-2">
            {(['todos', 'M', 'F'] as const).map((val) => (
              <button
                key={val}
                onClick={() => setFiltroSexo(val)}
                className={`px-4 py-2 rounded-lg text-xs font-medium border transition-all ${
                  filtroSexo === val
                    ? 'bg-indigo-50 text-indigo-600 border-indigo-200'
                    : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                }`}
              >
                {val === 'todos' ? 'Todos' : val === 'M' ? 'Masculino' : 'Femenino'}
              </button>
            ))}
          </div>

          {/* Nuevo paciente */}
          <button
            onClick={openCreate}
            className="hidden sm:flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors shadow-sm whitespace-nowrap"
          >
            <IconPlus />
            Nuevo paciente
          </button>
        </div>

        {/* ── Contador ─────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-400">
            Mostrando <span className="font-medium text-slate-600">{pacientesFiltrados.length}</span> pacientes
            {filtroSexo !== 'todos' && ` · ${filtroSexo === 'M' ? `${totalMasc} masculinos` : `${totalFem} femeninos`}`}
          </p>
          <p className="text-xs text-slate-400">Página {paginaActual} de {totalPaginas}</p>
        </div>

        {/* ── Grid de tarjetas ─────────────────────────────────────────────── */}
        {pacientesPaginados.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 py-20 flex flex-col items-center gap-2">
            <svg className="w-10 h-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0" />
            </svg>
            <p className="text-slate-500 font-medium text-sm">No se encontraron pacientes</p>
            <p className="text-slate-400 text-xs">Intenta con otros términos de búsqueda o cambia el filtro.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {pacientesPaginados.map((p) => {
              const edad = calcularEdad(p.fechaNacimiento);
              const avColor = avatarColor(p.nombre);
              const ini = initials(p.nombre, p.apellido);
              return (
                <div
                  key={p.idPac}
                  className="bg-white rounded-2xl border border-slate-200 hover:border-indigo-200 hover:shadow-sm transition-all p-4 flex gap-3"
                >
                  {/* Avatar */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-semibold flex-shrink-0 ${avColor}`}>
                    {ini}
                  </div>

                  {/* Cuerpo */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 text-sm truncate">{p.nombre} {p.apellido}</p>
                    <p className="text-[11px] text-slate-400 mb-2">DNI: {p.dni} · {edad} años</p>

                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                      <span className="text-slate-400"><IconPhone /></span>
                      {p.telefono || '—'}
                    </div>
                    {p.correo && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 truncate">
                        <span className="text-slate-400"><IconMail /></span>
                        <span className="truncate">{p.correo}</span>
                      </div>
                    )}

                    {/* Footer de la tarjeta */}
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                      {/* Badge sexo */}
                      {p.sexo ? (
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg ${
                          p.sexo === 'M' ? 'bg-indigo-50 text-indigo-600' : 'bg-pink-50 text-pink-600'
                        }`}>
                          {p.sexo === 'M' ? 'Masculino' : p.sexo === 'F' ? 'Femenino' : p.sexo}
                        </span>
                      ) : <span />}

                      {/* Acciones */}
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => navigate(`/pacientes/${p.idPac}`)}
                          className="flex items-center gap-1 text-[11px] font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg transition-colors"
                        >
                          <IconClipboard /> Ficha
                        </button>
                        <button
                          onClick={() => openEdit(p)}
                          className="flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-lg transition-colors"
                        >
                          <IconPencil />
                        </button>
                        <button
                          onClick={() => handleDelete(p.idPac!)}
                          disabled={deletingId === p.idPac}
                          className="flex items-center gap-1 text-[11px] font-medium text-red-500 hover:bg-red-50 px-2 py-1 rounded-lg transition-colors disabled:opacity-40"
                        >
                          {deletingId === p.idPac
                            ? <div className="w-3 h-3 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                            : <IconTrash />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Paginación ────────────────────────────────────────────────────── */}
        {pacientesFiltrados.length > itemsPorPagina && (
          <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl px-4 py-3">
            <span className="text-xs text-slate-500">
              {(paginaActual - 1) * itemsPorPagina + 1}–{Math.min(paginaActual * itemsPorPagina, pacientesFiltrados.length)} de {pacientesFiltrados.length}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPaginaActual((p) => Math.max(1, p - 1))}
                disabled={paginaActual === 1}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                ← Anterior
              </button>
              <span className="text-xs font-semibold text-slate-700 px-1">{paginaActual} / {totalPaginas}</span>
              <button
                onClick={() => setPaginaActual((p) => Math.min(totalPaginas, p + 1))}
                disabled={paginaActual === totalPaginas}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                Siguiente →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── FAB: solo móvil ──────────────────────────────────────────────── */}
      <button
        onClick={openCreate}
        className="fixed bottom-6 right-6 sm:hidden z-20 w-14 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg flex items-center justify-center"
        aria-label="Nuevo paciente"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      </button>

      {/* ── Modal de formulario ───────────────────────────────────────────── */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div className="bg-white rounded-2xl shadow-xl w-full sm:max-w-2xl mx-4 overflow-hidden">
            {/* Header del modal */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h2 className="text-sm font-semibold text-slate-900">
                  {editing ? 'Editar paciente' : 'Nuevo paciente'}
                </h2>
              </div>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 transition-colors">
                <IconX />
              </button>
            </div>

            {/* Formulario */}
            <form onSubmit={handleSubmit} className="px-4 sm:px-6 py-4 sm:py-5 space-y-4">
              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2.5 rounded-xl">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { name: 'nombre', label: 'Nombre', type: 'text', required: true },
                  { name: 'apellido', label: 'Apellido', type: 'text', required: true },
                  { name: 'dni', label: 'DNI', type: 'text', required: true },
                  { name: 'fechaNacimiento', label: 'Fecha de nacimiento', type: 'date', required: true },
                  { name: 'telefono', label: 'Teléfono', type: 'text', required: false },
                  { name: 'correo', label: 'Correo electrónico', type: 'email', placeholder: 'opcional' },
                ].map(({ name, label, type, required, placeholder }) => {
                  const err = errores[name as keyof FormData];
                  return (
                    <CampoConError key={name} error={err}>
                      <label className="text-xs font-medium text-slate-600">{label}</label>
                      <input
                        name={name}
                        type={type}
                        value={(form as Record<string, string>)[name]}
                        onChange={handleChange}
                        required={required}
                        placeholder={placeholder}
                        className={`border rounded-xl px-3 py-2 text-sm text-slate-900 focus:ring-2 outline-none transition placeholder-slate-300 ${
                          err
                            ? 'border-red-400 focus:ring-red-400/40 focus:border-red-400'
                            : 'border-slate-200 focus:ring-indigo-500/40 focus:border-indigo-400'
                        }`}
                      />
                    </CampoConError>
                  );
                })}

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-slate-600">Sexo</label>
                  <select
                    name="sexo"
                    value={form.sexo}
                    onChange={handleChange}
                    className="border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 outline-none bg-white transition"
                  >
                    <option value="">Seleccionar...</option>
                    <option value="M">Masculino</option>
                    <option value="F">Femenino</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-600">Dirección</label>
                <input
                  name="direccion"
                  type="text"
                  value={form.direccion}
                  onChange={handleChange}
                  placeholder="Ej. Av. Principal 123"
                  className="border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 outline-none transition placeholder-slate-300 w-full"
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
                  {editing ? 'Guardar cambios' : 'Crear paciente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

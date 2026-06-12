import { useEffect, useState } from 'react';
import {
  getDoctores,
  createDoctor,
  updateDoctor,
  deleteDoctor,
} from '../services/doctorService';
import type { Doctor } from '../types/doctor';

type FormData = Omit<Doctor, 'idDoc'>;

const EMPTY_FORM: FormData = {
  nombre: '',
  apellido: '',
  especialidad: '',
  cmp: '',
};

const AVATAR_COLORS = [
  'bg-indigo-100 text-indigo-700',
  'bg-violet-100 text-violet-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
  'bg-sky-100 text-sky-700',
  'bg-teal-100 text-teal-700',
];

const avatarColor = (nombre: string) => {
  const code = (nombre.charCodeAt(0) || 0) + (nombre.charCodeAt(1) || 0);
  return AVATAR_COLORS[code % AVATAR_COLORS.length];
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
const IconTrash = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4h6v3M4 7h16" />
  </svg>
);
const IconX = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

// ── Componente principal ───────────────────────────────────────────────────────
export default function DoctoresPage() {
  const [doctores, setDoctores] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Doctor | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchDoctores = () =>
    getDoctores()
      .then(setDoctores)
      .catch(() => setError('No se pudo conectar con el servidor.'))
      .finally(() => setLoading(false));

  useEffect(() => { fetchDoctores(); }, []);

  const doctoresFiltrados = doctores.filter((d) => {
    const q = busqueda.toLowerCase().trim();
    return !q || `${d.nombre} ${d.apellido} ${d.especialidad}`.toLowerCase().includes(q);
  });

  const openCreate = () => {
    setEditing(null); setForm(EMPTY_FORM); setFormError(null); setModalOpen(true);
  };

  const openEdit = (d: Doctor) => {
    setEditing(d);
    setForm({ nombre: d.nombre, apellido: d.apellido, especialidad: d.especialidad, cmp: d.cmp });
    setFormError(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false); setEditing(null); setForm(EMPTY_FORM); setFormError(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      if (editing) {
        const updated = await updateDoctor(editing.idDoc!, form);
        setDoctores((prev) => prev.map((d) => (d.idDoc === editing.idDoc ? updated : d)));
      } else {
        const created = await createDoctor(form);
        setDoctores((prev) => [...prev, created]);
      }
      closeModal();
    } catch {
      setFormError('Error al guardar. Verifica los datos e intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      await deleteDoctor(id);
      setDoctores((prev) => prev.filter((d) => d.idDoc !== id));
    } catch {
      setError('No se pudo eliminar el doctor.');
    } finally {
      setDeletingId(null);
    }
  };

  // ── Estados de carga / error ──────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-100">
        <div className="flex flex-col items-center gap-3">
          <div className="w-9 h-9 border-[3px] border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500">Cargando doctores...</p>
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

  return (
    <div className="bg-slate-100 min-h-screen p-6">
      <div className="max-w-7xl mx-auto space-y-5">

        {/* ── Cabecera ────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-800">Doctores</h1>
            <p className="text-sm font-medium text-slate-500 mt-0.5">
              Gestión del equipo clínico
            </p>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-4 py-2 text-sm font-medium transition-colors shadow-sm whitespace-nowrap"
          >
            <IconPlus />
            Nuevo doctor
          </button>
        </div>

        {/* ── Filtro ──────────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <div className="relative max-w-sm">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <IconSearch />
            </span>
            <input
              type="text"
              placeholder="Buscar por nombre o especialidad..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 placeholder-slate-400 transition"
            />
          </div>
        </div>

        {/* ── Cards ───────────────────────────────────────────────────────── */}
        {doctoresFiltrados.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 py-20 flex flex-col items-center gap-2">
            <svg className="w-10 h-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <p className="text-slate-500 font-medium text-sm">No se encontraron doctores</p>
            <p className="text-slate-400 text-xs">Intenta con otros términos de búsqueda.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {doctoresFiltrados.map((d) => {
              const initials = `${d.nombre.charAt(0)}${d.apellido.charAt(0)}`.toUpperCase();
              const avColor = avatarColor(d.nombre);
              return (
                <div
                  key={d.idDoc}
                  className="bg-white rounded-2xl border border-slate-200 hover:border-indigo-200 hover:shadow-sm transition-all p-5"
                >
                  {/* Avatar + nombre */}
                  <div className="flex items-start gap-3 mb-4">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-sm font-semibold flex-shrink-0 ${avColor}`}>
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 text-sm">
                        Dr. {d.nombre} {d.apellido}
                      </p>
                      <span className="inline-block bg-indigo-50 text-indigo-600 text-xs rounded-full px-2 py-0.5 mt-1">
                        {d.especialidad}
                      </span>
                    </div>
                  </div>

                  {/* CMP */}
                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
                    <svg className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round"
                        d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0" />
                    </svg>
                    CMP: {d.cmp}
                  </div>

                  {/* Acciones */}
                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                    <button
                      onClick={() => openEdit(d)}
                      className="flex items-center gap-1.5 border border-slate-200 text-slate-600 hover:border-indigo-300 rounded-xl px-4 py-2 text-sm transition-colors"
                    >
                      <IconPencil />
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(d.idDoc!)}
                      disabled={deletingId === d.idDoc}
                      className="flex items-center gap-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl px-4 py-2 text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {deletingId === d.idDoc
                        ? <div className="w-3.5 h-3.5 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                        : <IconTrash />}
                      Eliminar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Modal ────────────────────────────────────────────────────────── */}
      {modalOpen && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl mx-4">

            {/* Header modal */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h2 className="text-sm font-semibold text-slate-900">
                  {editing ? 'Editar doctor' : 'Nuevo doctor'}
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

              <div className="grid grid-cols-2 gap-4">
                {([
                  { name: 'nombre',      label: 'Nombre' },
                  { name: 'apellido',    label: 'Apellido' },
                  { name: 'especialidad', label: 'Especialidad' },
                  { name: 'cmp',         label: 'CMP' },
                ] as const).map(({ name, label }) => (
                  <div key={name} className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-slate-600">{label}</label>
                    <input
                      name={name}
                      type="text"
                      value={form[name]}
                      onChange={handleChange}
                      required
                      className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 transition"
                    />
                  </div>
                ))}
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
                  {editing ? 'Guardar cambios' : 'Crear doctor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

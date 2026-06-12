import { useEffect, useState } from 'react';
import {
  getTratamientos,
  createTratamiento,
  updateTratamiento,
  deleteTratamiento,
} from '../services/tratamientoService';
import type { Tratamiento } from '../types/tratamiento';

type FormData = Omit<Tratamiento, 'idTrat'>;

const EMPTY_FORM: FormData = {
  descripcion: '',
  costo: 0,
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
export default function TratamientosPage() {
  const [tratamientos, setTratamientos] = useState<Tratamiento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Tratamiento | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchTratamientos = () =>
    getTratamientos()
      .then(setTratamientos)
      .catch(() => setError('No se pudo conectar con el servidor.'))
      .finally(() => setLoading(false));

  useEffect(() => { fetchTratamientos(); }, []);

  const tratamientosFiltrados = tratamientos.filter((t) => {
    const q = busqueda.toLowerCase().trim();
    return !q || t.descripcion.toLowerCase().includes(q);
  });

  const openCreate = () => {
    setEditing(null); setForm(EMPTY_FORM); setFormError(null); setModalOpen(true);
  };

  const openEdit = (t: Tratamiento) => {
    setEditing(t);
    setForm({ descripcion: t.descripcion, costo: t.costo });
    setFormError(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false); setEditing(null); setForm(EMPTY_FORM); setFormError(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      if (editing) {
        const updated = await updateTratamiento(editing.idTrat!, form);
        setTratamientos((prev) => prev.map((t) => (t.idTrat === editing.idTrat ? updated : t)));
      } else {
        const created = await createTratamiento(form);
        setTratamientos((prev) => [...prev, created]);
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
      await deleteTratamiento(id);
      setTratamientos((prev) => prev.filter((t) => t.idTrat !== id));
    } catch {
      setError('No se pudo eliminar el tratamiento.');
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
          <p className="text-sm text-slate-500">Cargando tratamientos...</p>
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
      <div className="max-w-5xl mx-auto space-y-5">

        {/* ── Cabecera ────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-800">Tratamientos</h1>
            <p className="text-sm font-medium text-slate-500 mt-0.5">
              Catálogo de procedimientos clínicos
            </p>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-4 py-2 text-sm font-medium transition-colors shadow-sm whitespace-nowrap"
          >
            <IconPlus />
            Nuevo tratamiento
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
              placeholder="Buscar tratamiento..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 placeholder-slate-400 transition"
            />
          </div>
        </div>

        {/* ── Tabla ───────────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          {tratamientosFiltrados.length === 0 ? (
            <div className="py-20 flex flex-col items-center gap-2">
              <svg className="w-10 h-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="text-slate-500 font-medium text-sm">
                {busqueda ? `Sin resultados para "${busqueda}"` : 'No hay tratamientos registrados'}
              </p>
              <p className="text-slate-400 text-xs">
                {busqueda ? 'Intenta con otros términos.' : 'Crea el primer tratamiento del catálogo.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">#</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">Tratamiento</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wide">Precio base</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wide">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {tratamientosFiltrados.map((t, i) => (
                    <tr
                      key={t.idTrat}
                      className="border-b border-slate-50 hover:bg-slate-50 transition-colors group"
                    >
                      <td className="px-6 py-4 text-sm text-slate-400 font-mono">{i + 1}</td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-700">{t.descripcion}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-slate-800 text-right tabular-nums">
                        S/ {t.costo.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="inline-flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openEdit(t)}
                            className="flex items-center gap-1 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1.5 rounded-lg transition-colors"
                          >
                            <IconPencil />
                            Editar
                          </button>
                          <button
                            onClick={() => handleDelete(t.idTrat!)}
                            disabled={deletingId === t.idTrat}
                            className="flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {deletingId === t.idTrat
                              ? <div className="w-3.5 h-3.5 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                              : <IconTrash />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Contador */}
        {tratamientosFiltrados.length > 0 && (
          <p className="text-xs text-slate-400 text-right">
            {tratamientosFiltrados.length} tratamiento{tratamientosFiltrados.length !== 1 ? 's' : ''}
          </p>
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
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h2 className="text-sm font-semibold text-slate-900">
                  {editing ? 'Editar tratamiento' : 'Nuevo tratamiento'}
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

              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-600">Descripción del tratamiento</label>
                <input
                  name="descripcion"
                  type="text"
                  value={form.descripcion}
                  onChange={handleChange}
                  required
                  placeholder="Ej: Limpieza dental"
                  className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 placeholder-slate-400 transition"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-600">Precio base (S/)</label>
                <input
                  name="costo"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.costo}
                  onChange={handleChange}
                  required
                  placeholder="0.00"
                  className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 placeholder-slate-400 transition"
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
                  {editing ? 'Guardar cambios' : 'Crear tratamiento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

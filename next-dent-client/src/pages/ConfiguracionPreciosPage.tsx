import { useEffect, useState } from 'react';
import { getActivos, crear, actualizar, eliminar } from '../services/tarifarioService';
import type { Tarifario } from '../types/tarifario';

const CATEGORIAS = [
  'Operatoria',
  'Cirugía',
  'Endodoncia',
  'Rehabilitación',
  'Ortodoncia',
  'Odontopediatría',
];

type FormData = Omit<Tarifario, 'idTarifa' | 'estado'>;

const EMPTY_FORM: FormData = {
  codigo: '',
  nombre: '',
  categoria: CATEGORIAS[0],
  precio: 0,
};

const formatPrecio = (precio: number) =>
  `S/ ${precio.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

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
const IconAlert = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

// ── Componente principal ───────────────────────────────────────────────────────
export default function ConfiguracionPreciosPage() {
  const [tarifas, setTarifas] = useState<Tarifario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Tarifario | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchTarifas = () =>
    getActivos()
      .then(setTarifas)
      .catch(() => setError('No se pudo conectar con el servidor.'))
      .finally(() => setLoading(false));

  useEffect(() => { fetchTarifas(); }, []);

  const tarifasFiltradas = tarifas.filter((t) =>
    t.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  const openCreate = () => {
    setEditing(null); setForm(EMPTY_FORM); setFormError(null); setModalOpen(true);
  };

  const openEdit = (t: Tarifario) => {
    setEditing(t);
    setForm({ codigo: t.codigo, nombre: t.nombre, categoria: t.categoria, precio: t.precio });
    setFormError(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false); setEditing(null); setForm(EMPTY_FORM); setFormError(null);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === 'precio' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!form.codigo.trim()) {
      setFormError('El código es obligatorio.');
      return;
    }
    if (!form.nombre.trim()) {
      setFormError('El nombre del tratamiento es obligatorio.');
      return;
    }
    if (form.precio <= 0) {
      setFormError('El precio debe ser mayor a S/ 0.00.');
      return;
    }

    setSaving(true);
    try {
      if (editing && editing.idTarifa !== undefined) {
        const updated = await actualizar(editing.idTarifa, form);
        setTarifas((prev) =>
          prev.map((t) => (t.idTarifa === editing.idTarifa ? updated : t))
        );
      } else {
        const created = await crear(form);
        setTarifas((prev) => [...prev, created]);
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
      await eliminar(id);
      setTarifas((prev) => prev.filter((t) => t.idTarifa !== id));
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
          <p className="text-sm text-slate-500">Cargando tarifario...</p>
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
      <div className="max-w-6xl mx-auto space-y-5">

        {/* ── Cabecera ────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-800">Configuración de Precios</h1>
            <p className="text-sm font-medium text-slate-500 mt-0.5">
              Tarifario vigente del consultorio
            </p>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-4 py-2 text-sm font-medium transition-colors shadow-sm whitespace-nowrap"
          >
            <IconPlus />
            Nueva tarifa
          </button>
        </div>

        {/* ── Banner alerta (sin tarifas) ──────────────────────────────────── */}
        {tarifas.length === 0 && (
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <span className="text-amber-500 mt-0.5 flex-shrink-0"><IconAlert /></span>
            <div>
              <p className="text-sm font-medium text-amber-800">No hay tarifas activas</p>
              <p className="text-xs text-amber-600 mt-0.5">
                Agrega al menos una tarifa para que los presupuestos puedan calcularse correctamente.
              </p>
            </div>
          </div>
        )}

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
          {tarifasFiltradas.length === 0 ? (
            <div className="py-20 flex flex-col items-center gap-2">
              <svg className="w-10 h-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <p className="text-slate-500 font-medium text-sm">
                {busqueda ? `Sin resultados para "${busqueda}"` : 'No hay tarifas registradas'}
              </p>
              <p className="text-slate-400 text-xs">
                {busqueda ? 'Intenta con otros términos.' : 'Crea la primera tarifa del consultorio.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">#</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">Código</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">Tratamiento</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">Categoría</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wide">Precio (S/)</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">Estado</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wide">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {tarifasFiltradas.map((t, i) => {
                    const isActivo = !t.estado || t.estado === 'Activo';
                    return (
                      <tr
                        key={t.idTarifa}
                        className="border-b border-slate-50 hover:bg-slate-50 transition-colors group"
                      >
                        <td className="px-6 py-4 text-sm text-slate-400 font-mono">{i + 1}</td>
                        <td className="px-6 py-4 text-sm font-mono text-slate-500">{t.codigo}</td>
                        <td className="px-6 py-4 text-sm font-medium text-slate-700">{t.nombre}</td>
                        <td className="px-6 py-4">
                          <span className="inline-block bg-indigo-50 text-indigo-600 text-xs font-medium px-2.5 py-0.5 rounded-full">
                            {t.categoria}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-slate-800 text-right tabular-nums">
                          {formatPrecio(t.precio)}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            isActivo
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-slate-100 text-slate-500'
                          }`}>
                            {isActivo ? 'Activo' : 'Inactivo'}
                          </span>
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
                              onClick={() => t.idTarifa !== undefined && handleDelete(t.idTarifa)}
                              disabled={deletingId === t.idTarifa}
                              className="flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {deletingId === t.idTarifa
                                ? <div className="w-3.5 h-3.5 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                                : <IconTrash />}
                            </button>
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

        {/* Contador */}
        {tarifasFiltradas.length > 0 && (
          <p className="text-xs text-slate-400 text-right">
            {tarifasFiltradas.length} tarifa{tarifasFiltradas.length !== 1 ? 's' : ''} activa{tarifasFiltradas.length !== 1 ? 's' : ''}
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
                      d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <h2 className="text-sm font-semibold text-slate-900">
                  {editing ? 'Editar tarifa' : 'Nueva tarifa'}
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
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-slate-600">Código</label>
                  <input
                    name="codigo"
                    type="text"
                    value={form.codigo}
                    onChange={handleChange}
                    placeholder="Ej: OP-001"
                    required
                    className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 placeholder-slate-400 transition"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-slate-600">Precio (S/)</label>
                  <input
                    name="precio"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={form.precio === 0 ? '' : form.precio}
                    onChange={handleChange}
                    placeholder="0.00"
                    required
                    className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 placeholder-slate-400 transition"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-600">Nombre del tratamiento</label>
                <input
                  name="nombre"
                  type="text"
                  value={form.nombre}
                  onChange={handleChange}
                  placeholder="Ej: Extracción simple"
                  required
                  className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 placeholder-slate-400 transition"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-600">Categoría</label>
                <select
                  name="categoria"
                  value={form.categoria}
                  onChange={handleChange}
                  required
                  className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white text-slate-700"
                >
                  {CATEGORIAS.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
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
                  {editing ? 'Guardar cambios' : 'Crear tarifa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

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
  `S/. ${precio.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

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
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setModalOpen(true);
  };

  const openEdit = (t: Tarifario) => {
    setEditing(t);
    setForm({
      codigo: t.codigo,
      nombre: t.nombre,
      categoria: t.categoria,
      precio: t.precio,
    });
    setFormError(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError(null);
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
    if (form.precio < 0) {
      setFormError('El precio no puede ser negativo.');
      return;
    }
    if (form.precio === 0) {
      setFormError('El precio debe ser mayor a S/. 0.00.');
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Cargando tarifario...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl max-w-md text-center">
          <p className="font-semibold text-base">Error</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Configuración de Precios y Tarifario
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {tarifas.length} tratamiento{tarifas.length !== 1 ? 's' : ''} registrado{tarifas.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors shadow-sm cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Añadir Tratamiento
          </button>
        </div>

        {/* Search */}
        <div className="mb-4">
          <div className="relative max-w-sm">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
            <input
              type="text"
              placeholder="Buscar tratamiento..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-5 py-3 text-left font-semibold text-gray-600 uppercase tracking-wide text-xs">Código</th>
                <th className="px-5 py-3 text-left font-semibold text-gray-600 uppercase tracking-wide text-xs">Categoría</th>
                <th className="px-5 py-3 text-left font-semibold text-gray-600 uppercase tracking-wide text-xs">Tratamiento</th>
                <th className="px-5 py-3 text-right font-semibold text-gray-600 uppercase tracking-wide text-xs">Precio</th>
                <th className="px-5 py-3 text-right font-semibold text-gray-600 uppercase tracking-wide text-xs">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {tarifasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-gray-400">
                    {busqueda
                      ? `No se encontraron tratamientos con "${busqueda}".`
                      : 'No hay tratamientos registrados.'}
                  </td>
                </tr>
              ) : (
                tarifasFiltradas.map((t, i) => (
                  <tr
                    key={t.idTarifa}
                    className={`border-b border-gray-50 hover:bg-blue-50/40 transition-colors ${
                      i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                    }`}
                  >
                    <td className="px-5 py-3.5 font-mono text-gray-500 text-xs">{t.codigo}</td>
                    <td className="px-5 py-3.5">
                      <span className="inline-block bg-blue-50 text-blue-700 text-xs font-medium px-2.5 py-1 rounded-full">
                        {t.categoria}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-900 font-medium">{t.nombre}</td>
                    <td className="px-5 py-3.5 text-right font-semibold text-gray-800 tabular-nums">
                      {formatPrecio(t.precio)}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => openEdit(t)}
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.536-6.536a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-1.414.586H8v-2.414a2 2 0 01.586-1.414z" />
                          </svg>
                          Editar
                        </button>
                        <button
                          onClick={() => t.idTarifa !== undefined && handleDelete(t.idTarifa)}
                          disabled={deletingId === t.idTarifa}
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                        >
                          {deletingId === t.idTarifa ? (
                            <div className="w-3.5 h-3.5 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4h6v3M4 7h16" />
                            </svg>
                          )}
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900">
                {editing ? 'Editar tratamiento' : 'Nuevo tratamiento'}
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2.5 rounded-lg">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-gray-700">Código</label>
                  <input
                    name="codigo"
                    type="text"
                    value={form.codigo}
                    onChange={handleChange}
                    placeholder="Ej: OP-001"
                    required
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-gray-700">Precio (S/.)</label>
                  <input
                    name="precio"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={form.precio === 0 ? '' : form.precio}
                    onChange={handleChange}
                    placeholder="0.00"
                    required
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-700">Nombre del tratamiento</label>
                <input
                  name="nombre"
                  type="text"
                  value={form.nombre}
                  onChange={handleChange}
                  placeholder="Ej: Extracción simple"
                  required
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-700">Categoría</label>
                <select
                  name="categoria"
                  value={form.categoria}
                  onChange={handleChange}
                  required
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white"
                >
                  {CATEGORIAS.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="text-sm font-medium text-gray-600 hover:text-gray-900 px-4 py-2 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium px-5 py-2 rounded-xl transition-colors cursor-pointer disabled:cursor-not-allowed"
                >
                  {saving && (
                    <div className="w-4 h-4 border-2 border-white/60 border-t-white rounded-full animate-spin" />
                  )}
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

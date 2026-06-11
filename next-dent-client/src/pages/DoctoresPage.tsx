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

export default function DoctoresPage() {
  const [doctores, setDoctores] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setModalOpen(true);
  };

  const openEdit = (d: Doctor) => {
    setEditing(d);
    setForm({
      nombre: d.nombre,
      apellido: d.apellido,
      especialidad: d.especialidad,
      cmp: d.cmp,
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Cargando doctores...</p>
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
            <h1 className="text-2xl font-bold text-gray-900">Doctores</h1>
            <p className="text-sm text-gray-500 mt-1">
              {doctores.length} doctor{doctores.length !== 1 ? 'es' : ''} registrado{doctores.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors shadow-sm cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Nuevo Doctor
          </button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-5 py-3 text-left font-semibold text-gray-600 uppercase tracking-wide text-xs">ID</th>
                <th className="px-5 py-3 text-left font-semibold text-gray-600 uppercase tracking-wide text-xs">Nombre</th>
                <th className="px-5 py-3 text-left font-semibold text-gray-600 uppercase tracking-wide text-xs">Apellido</th>
                <th className="px-5 py-3 text-left font-semibold text-gray-600 uppercase tracking-wide text-xs">Especialidad</th>
                <th className="px-5 py-3 text-left font-semibold text-gray-600 uppercase tracking-wide text-xs">CMP</th>
                <th className="px-5 py-3 text-right font-semibold text-gray-600 uppercase tracking-wide text-xs">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {doctores.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-gray-400">
                    No hay doctores registrados.
                  </td>
                </tr>
              ) : (
                doctores.map((d, i) => (
                  <tr
                    key={d.idDoc}
                    className={`border-b border-gray-50 hover:bg-blue-50/40 transition-colors ${
                      i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                    }`}
                  >
                    <td className="px-5 py-3.5 text-gray-400 font-mono">{d.idDoc}</td>
                    <td className="px-5 py-3.5 text-gray-900 font-medium">{d.nombre}</td>
                    <td className="px-5 py-3.5 text-gray-700">{d.apellido}</td>
                    <td className="px-5 py-3.5">
                      <span className="inline-block bg-blue-50 text-blue-700 text-xs font-medium px-2.5 py-1 rounded-full">
                        {d.especialidad}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-700 font-mono">{d.cmp}</td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => openEdit(d)}
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.536-6.536a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-1.414.586H8v-2.414a2 2 0 01.586-1.414z" />
                          </svg>
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(d.idDoc!)}
                          disabled={deletingId === d.idDoc}
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                        >
                          {deletingId === d.idDoc ? (
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
                {editing ? 'Editar doctor' : 'Nuevo doctor'}
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
                {(
                  [
                    { name: 'nombre', label: 'Nombre' },
                    { name: 'apellido', label: 'Apellido' },
                    { name: 'especialidad', label: 'Especialidad' },
                    { name: 'cmp', label: 'CMP' },
                  ] as const
                ).map(({ name, label }) => (
                  <div key={name} className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-gray-700">{label}</label>
                    <input
                      name={name}
                      type="text"
                      value={form[name]}
                      onChange={handleChange}
                      required
                      className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    />
                  </div>
                ))}
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

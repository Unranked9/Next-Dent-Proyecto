import { useEffect, useState } from 'react';
import { getCitas, createCita, updateCita, deleteCita } from '../services/citaService';
import { getPacientes } from '../services/pacienteService';
import type { Cita } from '../types/cita';
import type { Paciente } from '../types/paciente';

type FormData = {
  pacienteId: number | '';
  fecha: string;
  hora: string;
  estado: string;
};

const EMPTY_FORM: FormData = {
  pacienteId: '',
  fecha: '',
  hora: '',
  estado: 'Pendiente',
};

const ESTADO_COLORS: Record<string, string> = {
  Pendiente: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  Confirmada: 'bg-green-50 text-green-700 border-green-200',
  Cancelada: 'bg-red-50 text-red-700 border-red-200',
  Completada: 'bg-blue-50 text-blue-700 border-blue-200',
};

export default function CitasPage() {
  const [citas, setCitas] = useState<Cita[]>([]);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Cita | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([getCitas(), getPacientes()])
      .then(([c, p]) => { setCitas(c); setPacientes(p); })
      .catch((err) => { console.error(err); setError('No se pudo conectar con el servidor.'); })
      .finally(() => setLoading(false));
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setModalOpen(true);
  };

  const openEdit = (c: Cita) => {
    setEditing(c);
    setForm({
      pacienteId: c.paciente.idPac,
      fecha: c.fecha,
      hora: c.hora,
      estado: c.estado,
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const buildPayload = (): Omit<Cita, 'idCita'> | null => {
    const paciente = pacientes.find((p) => p.idPac === Number(form.pacienteId));
    if (!paciente) return null;
    return { paciente, idDoc: 1, idTra: 1, fecha: form.fecha, hora: form.hora, estado: form.estado };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = buildPayload();
    if (!payload) { setFormError('Selecciona un paciente.'); return; }
    setSaving(true);
    setFormError(null);
    try {
      if (editing && editing.idCita !== undefined) {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-57px)] bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Cargando citas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-57px)] bg-gray-50">
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl max-w-md text-center">
          <p className="font-semibold text-base">Error</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-57px)] bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Citas</h1>
            <p className="text-sm text-gray-500 mt-1">
              {citas.length} cita{citas.length !== 1 ? 's' : ''} registrada{citas.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors shadow-sm cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Nueva cita
          </button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-5 py-3 text-left font-semibold text-gray-600 uppercase tracking-wide text-xs">ID</th>
                <th className="px-5 py-3 text-left font-semibold text-gray-600 uppercase tracking-wide text-xs">Paciente</th>
                <th className="px-5 py-3 text-left font-semibold text-gray-600 uppercase tracking-wide text-xs">Fecha</th>
                <th className="px-5 py-3 text-left font-semibold text-gray-600 uppercase tracking-wide text-xs">Hora</th>
                <th className="px-5 py-3 text-left font-semibold text-gray-600 uppercase tracking-wide text-xs">Estado</th>
                <th className="px-5 py-3 text-right font-semibold text-gray-600 uppercase tracking-wide text-xs">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {citas.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-gray-400">
                    No hay citas registradas.
                  </td>
                </tr>
              ) : (
                citas.map((c, i) => (
                  <tr
                    key={c.idCita}
                    className={`border-b border-gray-50 hover:bg-blue-50/40 transition-colors ${
                      i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                    }`}
                  >
                    <td className="px-5 py-3.5 text-gray-400 font-mono">{c.idCita}</td>
                    <td className="px-5 py-3.5 text-gray-900 font-medium">
                      {c.paciente.nombre} {c.paciente.apellido}
                    </td>
                    <td className="px-5 py-3.5 text-gray-700">{c.fecha}</td>
                    <td className="px-5 py-3.5 text-gray-700">{c.hora}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${ESTADO_COLORS[c.estado] ?? 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                        {c.estado}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => openEdit(c)}
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.536-6.536a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-1.414.586H8v-2.414a2 2 0 01.586-1.414z" />
                          </svg>
                          Editar
                        </button>
                        <button
                          onClick={() => c.idCita !== undefined && handleDelete(c.idCita)}
                          disabled={deletingId === c.idCita}
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                        >
                          {deletingId === c.idCita ? (
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
                {editing ? 'Editar cita' : 'Nueva cita'}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">
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

              {/* Paciente select */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-700">Paciente</label>
                <select
                  name="pacienteId"
                  value={form.pacienteId}
                  onChange={handleChange}
                  required
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white"
                >
                  <option value="">Seleccionar paciente...</option>
                  {pacientes.map((p) => (
                    <option key={p.idPac} value={p.idPac}>
                      {p.nombre} {p.apellido} — DNI {p.dni}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-gray-700">Fecha</label>
                  <input
                    name="fecha"
                    type="date"
                    value={form.fecha}
                    onChange={handleChange}
                    required
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-gray-700">Hora</label>
                  <input
                    name="hora"
                    type="time"
                    value={form.hora}
                    onChange={handleChange}
                    required
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-700">Estado</label>
                <select
                  name="estado"
                  value={form.estado}
                  onChange={handleChange}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white"
                >
                  <option value="Pendiente">Pendiente</option>
                  <option value="Confirmada">Confirmada</option>
                  <option value="Completada">Completada</option>
                  <option value="Cancelada">Cancelada</option>
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

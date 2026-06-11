import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getPacientes,
  createPaciente,
  updatePaciente,
  deletePaciente,
} from '../services/pacienteService';
import type { Paciente } from '../types/paciente';

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

// Función helper para calcular edad
const calcularEdad = (fecha: string) => {
  if (!fecha) return '—';
  const hoy = new Date();
  const cumple = new Date(fecha);
  let edad = hoy.getFullYear() - cumple.getFullYear();
  const m = hoy.getMonth() - cumple.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < cumple.getDate())) {
    edad--;
  }
  return `${edad} años`;
};

export default function PacientesPage() {
  const navigate = useNavigate();
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados de UI (Buscador y Paginación)
  const [busqueda, setBusqueda] = useState('');
  const [paginaActual, setPaginaActual] = useState(1);
  const itemsPorPagina = 10;

  // Estados del Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Paciente | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchPacientes = () =>
    getPacientes()
      .then(setPacientes)
      .catch(() => setError('No se pudo conectar con el servidor.'))
      .finally(() => setLoading(false));

  useEffect(() => { fetchPacientes(); }, []);

  // Resetear a la página 1 cada vez que se busca algo
  useEffect(() => {
    setPaginaActual(1);
  }, [busqueda]);

  // Lógica de filtrado y paginación
  const pacientesFiltrados = useMemo(() => {
    const query = busqueda.toLowerCase().trim();
    if (!query) return pacientes;
    return pacientes.filter((p) =>
      `${p.nombre} ${p.apellido} ${p.dni}`.toLowerCase().includes(query)
    );
  }, [pacientes, busqueda]);

  const totalPaginas = Math.ceil(pacientesFiltrados.length / itemsPorPagina) || 1;
  const pacientesPaginados = pacientesFiltrados.slice(
    (paginaActual - 1) * itemsPorPagina,
    paginaActual * itemsPorPagina
  );

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setModalOpen(true);
  };

  const openEdit = (p: Paciente) => {
    setEditing(p);
    setForm({
      nombre: p.nombre,
      apellido: p.apellido,
      dni: p.dni,
      telefono: p.telefono,
      fechaNacimiento: p.fechaNacimiento,
      correo: p.correo || '',
      sexo: p.sexo || '',
      direccion: p.direccion || '',
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      if (editing) {
        const updated = await updatePaciente(editing.idPac!, form);
        setPacientes((prev) => prev.map((p) => (p.idPac === editing.idPac ? updated : p)));
      } else {
        const created = await createPaciente(form);
        setPacientes((prev) => [created, ...prev]); // Añade el nuevo al inicio
      }
      closeModal();
    } catch {
      setFormError('Error al guardar. Verifica los datos e intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Estás seguro de eliminar este paciente?')) return;
    setDeletingId(id);
    try {
      await deletePaciente(id);
      setPacientes((prev) => prev.filter((p) => p.idPac !== id));
    } catch {
      alert('No se pudo eliminar el paciente.');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Cargando pacientes...</p>
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
      <div className="max-w-6xl mx-auto space-y-6">

        {/* ─── Cabecera ────────────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Pacientes</h1>
            <p className="text-sm text-gray-500 mt-1">
              Gestiona el historial de tus pacientes
            </p>
          </div>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors shadow-sm cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Nuevo paciente
          </button>
        </div>

        {/* ─── Buscador ────────────────────────────────────────────── */}
        <div className="bg-white p-2 rounded-2xl shadow-sm border border-gray-200 flex items-center">
          <div className="pl-3 pr-2 text-gray-400">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Buscar por nombre, apellido o DNI..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full bg-transparent border-none py-2 text-sm text-gray-900 focus:outline-none focus:ring-0 placeholder-gray-400"
          />
        </div>

        {/* ─── Tabla Principal (Data Stacking) ─────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left">
                  <th className="px-5 py-3 font-semibold text-gray-500 uppercase tracking-wide text-[10px]">Paciente</th>
                  <th className="px-5 py-3 font-semibold text-gray-500 uppercase tracking-wide text-[10px]">Contacto</th>
                  <th className="px-5 py-3 font-semibold text-gray-500 uppercase tracking-wide text-[10px]">Perfil</th>
                  <th className="px-5 py-3 font-semibold text-gray-500 uppercase tracking-wide text-[10px] text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {pacientesPaginados.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-16 text-center">
                      <div className="flex flex-col items-center">
                        <svg className="w-10 h-10 text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <p className="text-gray-500 font-medium">No se encontraron pacientes</p>
                        <p className="text-gray-400 text-xs mt-1">Intenta con otros términos de búsqueda.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  pacientesPaginados.map((p) => (
                    <tr key={p.idPac} className="hover:bg-blue-50/40 transition-colors bg-white">
                      {/* Columna 1: Paciente */}
                      <td className="px-5 py-3 align-middle">
                        <p className="font-semibold text-gray-900">{p.nombre} {p.apellido}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" /></svg>
                          <span className="text-xs text-gray-500 font-mono">DNI: {p.dni}</span>
                        </div>
                      </td>

                      {/* Columna 2: Contacto */}
                      <td className="px-5 py-3 align-middle">
                        <div className="flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                          <span className="text-sm text-gray-700">{p.telefono || '—'}</span>
                        </div>
                        {p.correo && (
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                            <span className="text-xs text-gray-500">{p.correo}</span>
                          </div>
                        )}
                      </td>

                      {/* Columna 3: Perfil */}
                      <td className="px-5 py-3 align-middle">
                        <div className="flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.701 2.701 0 00-1.5-.454M9 6v2m3-2v2m3-2v2M9 3h.01M12 3h.01M15 3h.01M21 21v-7a2 2 0 00-2-2H5a2 2 0 00-2 2v7h18zm-3-9v-2a2 2 0 00-2-2H8a2 2 0 00-2 2v2h12z" /></svg>
                          <span className="text-sm text-gray-700">{calcularEdad(p.fechaNacimiento)}</span>
                        </div>
                        {p.sexo && (
                          <div className="mt-1">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${
                              p.sexo === 'M' ? 'bg-blue-50 text-blue-700' : 'bg-pink-50 text-pink-700'
                            }`}>
                              {p.sexo === 'M' ? 'Masculino' : p.sexo === 'F' ? 'Femenino' : p.sexo}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Columna 4: Acciones */}
                      <td className="px-5 py-3 align-middle text-right">
                        <div className="inline-flex flex-wrap justify-end gap-2">
                          <button
                            onClick={() => navigate(`/pacientes/${p.idPac}`)}
                            className="inline-flex items-center gap-1.5 text-xs font-medium text-teal-600 hover:text-teal-800 bg-teal-50 hover:bg-teal-100 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-3-3v6M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            Ficha
                          </button>
                          <button
                            onClick={() => openEdit(p)}
                            className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.536-6.536a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-1.414.586H8v-2.414a2 2 0 01.586-1.414z" /></svg>
                            Editar
                          </button>
                          <button
                            onClick={() => handleDelete(p.idPac!)}
                            disabled={deletingId === p.idPac}
                            className="inline-flex items-center gap-1.5 text-xs font-medium text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                          >
                            {deletingId === p.idPac ? (
                              <div className="w-3.5 h-3.5 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4h6v3M4 7h16" /></svg>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* ─── Paginación ────────────────────────────────────────────── */}
          {pacientesFiltrados.length > 0 && (
            <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
              <span className="text-xs text-gray-500">
                Mostrando {(paginaActual - 1) * itemsPorPagina + 1} a {Math.min(paginaActual * itemsPorPagina, pacientesFiltrados.length)} de {pacientesFiltrados.length} resultados
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPaginaActual(p => Math.max(1, p - 1))}
                  disabled={paginaActual === 1}
                  className="px-3 py-1 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Anterior
                </button>
                <span className="text-xs font-semibold text-gray-700">
                  {paginaActual} / {totalPaginas}
                </span>
                <button
                  onClick={() => setPaginaActual(p => Math.min(totalPaginas, p + 1))}
                  disabled={paginaActual === totalPaginas}
                  className="px-3 py-1 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── Modal de Formulario ─────────────────────────────────── */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-4 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900">
                {editing ? 'Editar paciente' : 'Nuevo paciente'}
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-gray-700">Nombre</label>
                  <input name="nombre" type="text" value={form.nombre} onChange={handleChange} required className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 transition" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-gray-700">Apellido</label>
                  <input name="apellido" type="text" value={form.apellido} onChange={handleChange} required className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 transition" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-gray-700">DNI</label>
                  <input name="dni" type="text" value={form.dni} onChange={handleChange} required className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 transition" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-gray-700">Fecha de Nacimiento</label>
                  <input name="fechaNacimiento" type="date" value={form.fechaNacimiento} onChange={handleChange} required className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 transition" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-gray-700">Teléfono</label>
                  <input name="telefono" type="text" value={form.telefono} onChange={handleChange} required className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 transition" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-gray-700">Correo Electrónico</label>
                  <input name="correo" type="email" value={form.correo} onChange={handleChange} className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 transition" placeholder="opcional" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-gray-700">Sexo</label>
                  <select name="sexo" value={form.sexo} onChange={handleChange} className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 transition bg-white">
                    <option value="">Seleccionar...</option>
                    <option value="M">Masculino</option>
                    <option value="F">Femenino</option>
                  </select>
                </div>
              </div>
              
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-700">Dirección</label>
                <input name="direccion" type="text" value={form.direccion} onChange={handleChange} className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 transition w-full" placeholder="Ej. Av. Principal 123" />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
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
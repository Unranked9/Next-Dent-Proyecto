import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../config/axiosInstance';
import { getUsuarios, createUsuario, updateUsuario, deleteUsuario } from '../services/usuarioService';
import type { Usuario, UsuarioRequest } from '../types/usuario';

// ── Íconos inline ──────────────────────────────────────────────────────────────
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

// ── Badges ─────────────────────────────────────────────────────────────────────
const ROL_BADGE: Record<string, string> = {
  ADMIN: 'bg-indigo-100 text-indigo-700',
  DOCTOR: 'bg-emerald-100 text-emerald-700',
  RECEPCIONISTA: 'bg-amber-100 text-amber-700',
};

const ROL_LABEL: Record<string, string> = {
  ADMIN: 'Admin',
  DOCTOR: 'Doctor',
  RECEPCIONISTA: 'Recepcionista',
};

// ── Componente principal ───────────────────────────────────────────────────────
export default function UsuariosPage() {
  const { usuario } = useAuth();

  if (usuario?.rol !== 'ADMIN') {
    return <Navigate to="/" replace />;
  }

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState<Usuario | null>(null);
  const [form, setForm] = useState<UsuarioRequest>({ email: '', password: '', rol: 'DOCTOR', activo: true, idDoctor: null });
  const [doctores, setDoctores] = useState<{ idDoc: number; nombre: string; apellido: string }[]>([]);
  const [errorForm, setErrorForm] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [eliminandoId, setEliminandoId] = useState<number | null>(null);

  const cargarUsuarios = () => {
    setLoading(true);
    getUsuarios()
      .then(setUsuarios)
      .finally(() => setLoading(false));
  };

  useEffect(() => { cargarUsuarios(); }, []);

  const abrirCrear = () => {
    setUsuarioEditando(null);
    setForm({ email: '', password: '', rol: 'DOCTOR', activo: true, idDoctor: null });
    setErrorForm(null);
    setModalAbierto(true);
    axiosInstance.get('/doctores').then(r => setDoctores(r.data));
  };

  const abrirEditar = (u: Usuario) => {
    setUsuarioEditando(u);
    setForm({ email: u.email, password: '', rol: u.rol, activo: u.activo, idDoctor: u.idDoctor });
    setErrorForm(null);
    setModalAbierto(true);
    if (doctores.length === 0) {
      axiosInstance.get('/doctores').then(r => setDoctores(r.data));
    }
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setUsuarioEditando(null);
    setErrorForm(null);
  };

  const handleGuardar = async () => {
    if (!form.email.trim()) { setErrorForm('El email es obligatorio'); return; }
    if (!usuarioEditando && !form.password?.trim()) { setErrorForm('La contraseña es obligatoria al crear'); return; }
    if (!form.rol) { setErrorForm('Selecciona un rol'); return; }

    setGuardando(true);
    setErrorForm(null);
    try {
      const payload: UsuarioRequest = { ...form };
      if (usuarioEditando && !payload.password?.trim()) {
        delete payload.password;
      }
      if (usuarioEditando) {
        await updateUsuario(usuarioEditando.idUsuario, payload);
      } else {
        await createUsuario(payload);
      }
      cerrarModal();
      cargarUsuarios();
    } catch (err: any) {
      if (err.response?.status === 409) {
        setErrorForm('Ese email ya está registrado');
      } else {
        setErrorForm('Error al guardar. Intenta de nuevo.');
      }
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = async (u: Usuario) => {
    if (!window.confirm(`¿Eliminar al usuario ${u.email}?`)) return;
    setEliminandoId(u.idUsuario);
    try {
      await deleteUsuario(u.idUsuario);
      setUsuarios(prev => prev.filter(x => x.idUsuario !== u.idUsuario));
    } finally {
      setEliminandoId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-100">
        <div className="flex flex-col items-center gap-3">
          <div className="w-9 h-9 border-[3px] border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500">Cargando usuarios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-100 min-h-screen p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-5">

        {/* ── Cabecera ────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-800">Usuarios</h1>
            <p className="text-sm font-medium text-slate-500 mt-0.5">
              Gestión de accesos y roles del sistema
            </p>
          </div>
          <button
            onClick={abrirCrear}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-4 py-2 text-sm font-medium transition-colors shadow-sm whitespace-nowrap"
          >
            <IconPlus />
            Nuevo usuario
          </button>
        </div>

        {/* ── Tabla ───────────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          {usuarios.length === 0 ? (
            <div className="py-20 flex flex-col items-center gap-2">
              <svg className="w-10 h-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
              </svg>
              <p className="text-slate-500 font-medium text-sm">No hay usuarios registrados</p>
            </div>
          ) : (
            <>
              {/* Tabla — desktop */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Email</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Rol</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Estado</th>
                      <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {usuarios.map(u => (
                      <tr key={u.idUsuario} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-3.5 text-slate-800 font-medium">{u.email}</td>
                        <td className="px-6 py-3.5">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${ROL_BADGE[u.rol] ?? 'bg-slate-100 text-slate-600'}`}>
                            {ROL_LABEL[u.rol] ?? u.rol}
                          </span>
                        </td>
                        <td className="px-6 py-3.5">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${u.activo ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                            {u.activo ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="px-6 py-3.5">
                          <div className="flex items-center justify-end gap-4">
                            <button
                              onClick={() => abrirEditar(u)}
                              className="text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
                            >
                              <span className="flex items-center gap-1">
                                <IconPencil />
                                Editar
                              </span>
                            </button>
                            <button
                              onClick={() => handleEliminar(u)}
                              disabled={eliminandoId === u.idUsuario}
                              className="text-red-500 hover:text-red-700 font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              <span className="flex items-center gap-1">
                                {eliminandoId === u.idUsuario
                                  ? <div className="w-3.5 h-3.5 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                                  : <IconTrash />}
                                Eliminar
                              </span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Cards — móvil */}
              <div className="sm:hidden space-y-2 p-3">
                {usuarios.map(u => (
                  <div key={u.idUsuario} className="bg-white rounded-xl border border-slate-200 p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">{u.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROL_BADGE[u.rol] ?? 'bg-slate-100 text-slate-600'}`}>
                            {ROL_LABEL[u.rol] ?? u.rol}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${u.activo ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                            {u.activo ? 'Activo' : 'Inactivo'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => abrirEditar(u)}
                        className="flex-1 text-xs py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleEliminar(u)}
                        disabled={eliminandoId === u.idUsuario}
                        className="flex-1 text-xs py-1.5 rounded-lg border border-red-100 text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {eliminandoId === u.idUsuario
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
      </div>

      {/* ── Modal ────────────────────────────────────────────────────────── */}
      {modalAbierto && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          onClick={e => { if (e.target === e.currentTarget) cerrarModal(); }}
        >
          <div className="bg-white rounded-2xl p-4 sm:p-6 w-full sm:max-w-lg shadow-xl mx-4 sm:mx-auto">

            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h2 className="text-sm font-semibold text-slate-900">
                  {usuarioEditando ? 'Editar usuario' : 'Nuevo usuario'}
                </h2>
              </div>
              <button onClick={cerrarModal} className="text-slate-400 hover:text-slate-600 transition-colors">
                <IconX />
              </button>
            </div>

            <div className="space-y-4">
              {errorForm && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2.5 rounded-xl">
                  {errorForm}
                </div>
              )}

              {/* Email */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-600">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))}
                  className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 transition"
                  placeholder="usuario@ejemplo.com"
                />
              </div>

              {/* Contraseña */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-600">
                  Contraseña {usuarioEditando && <span className="text-slate-400 font-normal">(dejar vacío para no cambiar)</span>}
                </label>
                <input
                  type="password"
                  value={form.password ?? ''}
                  onChange={e => setForm(prev => ({ ...prev, password: e.target.value }))}
                  className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 transition"
                  placeholder={usuarioEditando ? '••••••••' : 'Contraseña'}
                />
              </div>

              {/* Rol */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-600">Rol</label>
                <select
                  value={form.rol}
                  onChange={e => setForm(prev => ({ ...prev, rol: e.target.value as UsuarioRequest['rol'], idDoctor: null }))}
                  className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 transition bg-white"
                >
                  <option value="ADMIN">Admin</option>
                  <option value="DOCTOR">Doctor</option>
                  <option value="RECEPCIONISTA">Recepcionista</option>
                </select>
              </div>

              {/* Doctor vinculado — solo si rol === DOCTOR */}
              {form.rol === 'DOCTOR' && (
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-slate-600">Doctor vinculado</label>
                  <select
                    value={form.idDoctor ?? ''}
                    onChange={e => setForm(prev => ({ ...prev, idDoctor: e.target.value ? Number(e.target.value) : null }))}
                    className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 transition bg-white"
                  >
                    <option value="">Sin vincular</option>
                    {doctores.map(d => (
                      <option key={d.idDoc} value={d.idDoc}>
                        {d.nombre} {d.apellido}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Activo */}
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.activo}
                  onChange={e => setForm(prev => ({ ...prev, activo: e.target.checked }))}
                  className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-300"
                />
                <span className="text-sm text-slate-700">Usuario activo</span>
              </label>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 pt-5 mt-5 border-t border-slate-100">
              <button
                onClick={cerrarModal}
                className="text-sm font-medium text-slate-600 hover:text-slate-900 px-4 py-2 rounded-xl hover:bg-slate-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleGuardar}
                disabled={guardando}
                className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-sm font-medium px-5 py-2 rounded-xl transition-colors disabled:cursor-not-allowed"
              >
                {guardando && <div className="w-4 h-4 border-2 border-white/60 border-t-white rounded-full animate-spin" />}
                {usuarioEditando ? 'Guardar cambios' : 'Crear usuario'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

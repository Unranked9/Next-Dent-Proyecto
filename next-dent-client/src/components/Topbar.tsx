import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDoctorActivo, getIniciales, getNombreCompleto } from '../hooks/useDoctorActivo';
import { useNotificaciones } from '../hooks/useNotificaciones';
import type { Notificacion } from '../hooks/useNotificaciones';

// ── Íconos ────────────────────────────────────────────────────────────────────
const IconBell = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
);
const IconChevron = ({ open }: { open: boolean }) => (
  <svg
    className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
);
const IconCalendar = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);
const IconUser = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);
const IconLogout = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);
const IconCheck = () => (
  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

// ── Íconos por tipo de notificación ──────────────────────────────────────────
const NotifIcon = ({ tipo }: { tipo: Notificacion['tipo'] }) => {
  if (tipo === 'cita_pendiente') {
    return (
      <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
        <svg className="w-3.5 h-3.5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
    );
  }
  if (tipo === 'cobro_pendiente') {
    return (
      <div className="w-7 h-7 rounded-full bg-sky-100 flex items-center justify-center flex-shrink-0">
        <svg className="w-3.5 h-3.5 text-sky-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      </div>
    );
  }
  return (
    <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
      <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </div>
  );
};

// ── Hook: cerrar al hacer click fuera ─────────────────────────────────────────
function useClickOutside(ref: React.RefObject<HTMLElement | null>, onClose: () => void) {
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [ref, onClose]);
}

// ── Panel de notificaciones ───────────────────────────────────────────────────
function PanelNotificaciones({
  notificaciones,
  noLeidas,
  onMarcarLeida,
  onMarcarTodas,
  onIrACitas,
}: {
  notificaciones: Notificacion[];
  noLeidas: number;
  onMarcarLeida: (id: string) => void;
  onMarcarTodas: () => void;
  onIrACitas: () => void;
}) {
  return (
    <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-slate-200 rounded-2xl shadow-lg z-50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-900">Notificaciones</span>
          {noLeidas > 0 && (
            <span className="text-[10px] font-semibold bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded-full">
              {noLeidas} nueva{noLeidas !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        {noLeidas > 0 && (
          <button
            onClick={onMarcarTodas}
            className="text-[11px] text-indigo-500 hover:text-indigo-700 font-medium transition-colors"
          >
            Marcar todas
          </button>
        )}
      </div>

      {/* Lista */}
      <div className="max-h-72 overflow-y-auto">
        {notificaciones.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 px-4 text-center">
            <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center">
              <IconBell />
            </div>
            <p className="text-sm font-medium text-slate-700">Sin notificaciones hoy</p>
            <p className="text-xs text-slate-400">Las citas pendientes del día aparecerán aquí.</p>
          </div>
        ) : (
          notificaciones.map((n) => (
            <div
              key={n.id}
              className={`flex items-start gap-3 px-4 py-3 border-b border-slate-50 last:border-0 transition-colors ${
                n.leida ? 'opacity-60' : 'bg-indigo-50/30'
              }`}
            >
              <NotifIcon tipo={n.tipo} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-800">{n.titulo}</p>
                <p className="text-xs text-slate-500 truncate mt-0.5">{n.descripcion}</p>
              </div>
              {!n.leida && (
                <button
                  onClick={() => onMarcarLeida(n.id)}
                  title="Marcar como leída"
                  className="mt-0.5 w-5 h-5 rounded-full bg-indigo-100 hover:bg-indigo-200 flex items-center justify-center flex-shrink-0 text-indigo-500 transition-colors"
                >
                  <IconCheck />
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2.5 border-t border-slate-100">
        <button
          onClick={onIrACitas}
          className="w-full flex items-center justify-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-800 py-1 transition-colors"
        >
          <IconCalendar />
          Ver todas las citas de hoy
        </button>
      </div>
    </div>
  );
}

// ── Dropdown perfil ───────────────────────────────────────────────────────────
function DropdownPerfil({
  iniciales,
  nombreCompleto,
  especialidad,
  cmp,
  onVerPerfil,
}: {
  iniciales: string;
  nombreCompleto: string;
  especialidad: string;
  cmp: string;
  onVerPerfil: () => void;
}) {
  return (
    <div className="absolute right-0 top-full mt-2 w-60 bg-white border border-slate-200 rounded-2xl shadow-lg z-50 overflow-hidden">
      {/* Info del doctor */}
      <div className="px-4 py-4 border-b border-slate-100 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-indigo-500 flex items-center justify-center text-xs font-semibold text-white flex-shrink-0">
          {iniciales}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900 truncate">{nombreCompleto}</p>
          <p className="text-[11px] text-slate-400 truncate">{especialidad}</p>
          <p className="text-[10px] text-slate-400">CMP: {cmp}</p>
        </div>
      </div>

      {/* Opciones */}
      <div className="py-1.5">
        <button
          onClick={onVerPerfil}
          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors text-left"
        >
          <span className="text-slate-400"><IconUser /></span>
          Ver perfil
        </button>

        {/* Cerrar sesión deshabilitado hasta Fase 3 */}
        <button
          disabled
          title="Disponible cuando se implemente autenticación (Fase 3)"
          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-300 cursor-not-allowed text-left"
        >
          <span className="text-slate-300"><IconLogout /></span>
          Cerrar sesión
          <span className="ml-auto text-[10px] bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded-full">Pronto</span>
        </button>
      </div>
    </div>
  );
}

// ── Componente principal Topbar ───────────────────────────────────────────────
interface TopbarProps {
  titulo?: string;
}

export default function Topbar({ titulo = '' }: TopbarProps) {
  const navigate = useNavigate();

  // Estado real desde BD
  const { doctor, loading: loadingDoctor } = useDoctorActivo();
  const { notificaciones, noLeidas, loading: loadingNotif, marcarLeida, marcarTodasLeidas } = useNotificaciones();

  // Estado UI
  const [bellOpen, setBellOpen] = useState(false);
  const [perfilOpen, setPerfilOpen] = useState(false);

  const bellRef = useRef<HTMLDivElement>(null);
  const perfilRef = useRef<HTMLDivElement>(null);

  useClickOutside(bellRef, () => setBellOpen(false));
  useClickOutside(perfilRef, () => setPerfilOpen(false));

  const iniciales = getIniciales(doctor);
  const nombreCompleto = getNombreCompleto(doctor);

  const handleBellClick = () => {
    setPerfilOpen(false);
    setBellOpen((prev) => !prev);
  };

  const handlePerfilClick = () => {
    setBellOpen(false);
    setPerfilOpen((prev) => !prev);
  };

  return (
    <header className="bg-white border-b border-slate-200 px-6 h-14 flex items-center justify-between sticky top-0 z-30">
      {/* Título de la página actual */}
      <h1 className="text-base font-semibold text-slate-900">
        {titulo || '\u00A0'}
      </h1>

      <div className="flex items-center gap-1">

        {/* ── Campana ─────────────────────────────────────────────────── */}
        <div ref={bellRef} className="relative">
          <button
            onClick={handleBellClick}
            className={`relative p-2 rounded-xl transition-colors ${
              bellOpen ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
            }`}
            aria-label="Notificaciones"
          >
            <IconBell />
            {/* Punto rojo real — solo si hay notificaciones no leídas */}
            {!loadingNotif && noLeidas > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
            )}
          </button>

          {bellOpen && (
            <PanelNotificaciones
              notificaciones={notificaciones}
              noLeidas={noLeidas}
              onMarcarLeida={marcarLeida}
              onMarcarTodas={marcarTodasLeidas}
              onIrACitas={() => { navigate('/citas'); setBellOpen(false); }}
            />
          )}
        </div>

        {/* Divisor */}
        <div className="w-px h-5 bg-slate-200 mx-2" />

        {/* ── Perfil del doctor ────────────────────────────────────────── */}
        <div ref={perfilRef} className="relative">
          <button
            onClick={handlePerfilClick}
            className={`flex items-center gap-2 px-2 py-1.5 rounded-xl transition-colors ${
              perfilOpen ? 'bg-indigo-50' : 'hover:bg-slate-100'
            }`}
            aria-label="Menú de perfil"
          >
            {/* Avatar */}
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-semibold transition-colors ${
              loadingDoctor
                ? 'bg-slate-200 text-slate-400 animate-pulse'
                : 'bg-indigo-100 text-indigo-700'
            }`}>
              {loadingDoctor ? '?' : iniciales}
            </div>

            {/* Nombre */}
            <span className={`text-sm font-medium transition-colors ${
              loadingDoctor ? 'text-slate-300' : perfilOpen ? 'text-indigo-600' : 'text-slate-700'
            }`}>
              {loadingDoctor ? 'Cargando...' : nombreCompleto}
            </span>

            <IconChevron open={perfilOpen} />
          </button>

          {perfilOpen && doctor && (
            <DropdownPerfil
              iniciales={iniciales}
              nombreCompleto={nombreCompleto}
              especialidad={doctor.especialidad}
              cmp={doctor.cmp}
              onVerPerfil={() => { navigate('/doctores'); setPerfilOpen(false); }}
            />
          )}
        </div>
      </div>
    </header>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCitas } from '../services/citaService';
import { useAuth } from '../context/AuthContext';
import { usePorCobrar } from '../hooks/usePorCobrar';
import KpiBar from '../components/KpiBar';
import type { Cita } from '../types/cita';

// ── Helpers ───────────────────────────────────────────────────────────────────

function getSaludo(): string {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return 'Buenos días';
  if (h >= 12 && h < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

function getFechaLarga(): string {
  return new Date().toLocaleDateString('es-PE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function esHoy(fecha: string | null): boolean {
  if (!fecha) return false;
  return fecha.slice(0, 10) === new Date().toISOString().slice(0, 10);
}

// ── Colores por estado ────────────────────────────────────────────────────────

const ESTADO_BADGE: Record<string, string> = {
  Pendiente:  'bg-amber-100 text-amber-700',
  Confirmada: 'bg-indigo-100 text-indigo-700',
  Completada: 'bg-emerald-100 text-emerald-700',
  Cancelada:  'bg-red-100 text-red-500',
};

const ESTADO_DOT: Record<string, string> = {
  Pendiente:  'bg-amber-400',
  Confirmada: 'bg-indigo-400',
  Completada: 'bg-emerald-400',
  Cancelada:  'bg-red-400',
};

// ── Íconos ───────────────────────────────────────────────────────────────────

const IconCalendarPlus = () => (
  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 13v4m-2-2h4" />
  </svg>
);

const IconUserPlus = () => (
  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
  </svg>
);

const IconCash = () => (
  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

const IconHistory = () => (
  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
  </svg>
);

// ── Accesos rápidos config ────────────────────────────────────────────────────

const ACCESOS = [
  {
    icon: <IconCalendarPlus />,
    label: 'Nueva cita',
    to: '/citas?nuevo=true',
    color: 'text-indigo-600',
    bg: 'bg-indigo-50 hover:bg-indigo-100 hover:border-indigo-200',
  },
  {
    icon: <IconUserPlus />,
    label: 'Nuevo paciente',
    to: '/pacientes',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50 hover:bg-emerald-100 hover:border-emerald-200',
  },
  {
    icon: <IconCash />,
    label: 'Ir a caja',
    to: '/pagos',
    color: 'text-sky-600',
    bg: 'bg-sky-50 hover:bg-sky-100 hover:border-sky-200',
  },
  {
    icon: <IconHistory />,
    label: 'Ver historial',
    to: '/pacientes',
    color: 'text-violet-600',
    bg: 'bg-violet-50 hover:bg-violet-100 hover:border-violet-200',
  },
];

// ── Skeleton ──────────────────────────────────────────────────────────────────

const SkeletonRow = () => (
  <div className="h-11 bg-slate-100 rounded-xl animate-pulse" />
);

// ── Componente principal ──────────────────────────────────────────────────────

export default function DashboardPage() {
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const { porCobrar, loading: loadingCobros } = usePorCobrar();
  const nombreSaludo = usuario?.email ?? 'Doctor';

  const [citasHoy, setCitasHoy] = useState<Cita[]>([]);
  const [loadingCitas, setLoadingCitas] = useState(true);

  useEffect(() => {
    getCitas()
      .then((citas) => {
        const deHoy = citas
          .filter((c) => esHoy(c.fecha))
          .sort((a, b) => (a.hora ?? '').localeCompare(b.hora ?? ''));
        setCitasHoy(deHoy);
      })
      .finally(() => setLoadingCitas(false));
  }, []);

  const citasVisibles = citasHoy.slice(0, 6);
  const cobrosVisibles = porCobrar.slice(0, 4);

  return (
    <div className="bg-slate-100 min-h-screen p-6">
      <div className="max-w-7xl mx-auto space-y-5">

        {/* ── Header bienvenida ─────────────────────────────────────────── */}
        <div>
          <h1 className="text-xl font-bold text-slate-800">
            {getSaludo()}, {nombreSaludo}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5 capitalize">{getFechaLarga()}</p>
        </div>

        {/* ── KPIs ──────────────────────────────────────────────────────── */}
        <KpiBar />

        {/* ── Dos columnas: citas + cobros ──────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* Citas de hoy */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-slate-800">Agenda de hoy</h2>
              {citasHoy.length > 6 && (
                <button
                  onClick={() => navigate('/citas')}
                  className="text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
                >
                  Ver todas →
                </button>
              )}
            </div>

            {loadingCitas ? (
              <div className="space-y-2">
                <SkeletonRow /><SkeletonRow /><SkeletonRow />
              </div>
            ) : citasHoy.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-10">
                <svg className="w-12 h-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-sm text-slate-500 font-medium">Sin citas para hoy</p>
              </div>
            ) : (
              <div className="space-y-1">
                {citasVisibles.map((c) => (
                  <div
                    key={c.idCita}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors"
                  >
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${ESTADO_DOT[c.estado] ?? 'bg-slate-300'}`} />
                    <span className="text-sm font-mono text-slate-500 w-11 flex-shrink-0">
                      {c.hora?.slice(0, 5) ?? '—'}
                    </span>
                    <span className="text-sm font-medium text-slate-700 flex-1 min-w-0 truncate">
                      {c.paciente ? `${c.paciente.nombre} ${c.paciente.apellido}` : 'Sin paciente'}
                    </span>
                    {c.motivo && (
                      <span className="text-xs text-slate-400 truncate max-w-[100px] hidden sm:block">
                        {c.motivo}
                      </span>
                    )}
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium flex-shrink-0 ${ESTADO_BADGE[c.estado] ?? 'bg-slate-100 text-slate-600'}`}>
                      {c.estado}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cobros pendientes */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-slate-800">Cobros pendientes</h2>
              {porCobrar.length > 4 && (
                <button
                  onClick={() => navigate('/pagos')}
                  className="text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
                >
                  Ver todos →
                </button>
              )}
            </div>

            {loadingCobros ? (
              <div className="space-y-2">
                <SkeletonRow /><SkeletonRow /><SkeletonRow />
              </div>
            ) : porCobrar.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-10">
                <p className="text-sm text-slate-500">Sin cobros urgentes 🎉</p>
              </div>
            ) : (
              <div className="space-y-1">
                {cobrosVisibles.map(({ paciente, totalPendiente }) => {
                  const iniciales = `${paciente.nombre.charAt(0)}${paciente.apellido.charAt(0)}`.toUpperCase();
                  return (
                    <div key={paciente.idPac} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-semibold flex-shrink-0">
                        {iniciales}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-700 truncate">
                          {paciente.nombre} {paciente.apellido}
                        </p>
                        <p className="text-xs text-amber-600 font-medium">
                          S/ {totalPendiente.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} pendiente
                        </p>
                      </div>
                      <button
                        onClick={() => navigate(`/pagos?pacienteId=${paciente.idPac}`)}
                        className="text-xs font-medium text-indigo-600 hover:text-indigo-700 whitespace-nowrap flex-shrink-0 transition-colors"
                      >
                        Ir a caja →
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Accesos rápidos ───────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {ACCESOS.map(({ icon, label, to, color, bg }) => (
            <button
              key={label}
              onClick={() => navigate(to)}
              className={`${bg} rounded-2xl border border-slate-200 p-5 flex flex-col items-center gap-3 transition-all`}
            >
              <span className={color}>{icon}</span>
              <span className="text-sm font-medium text-slate-700">{label}</span>
            </button>
          ))}
        </div>

      </div>
    </div>
  );
}

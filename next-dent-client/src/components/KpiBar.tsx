import { useKpis } from '../hooks/useKpis';

const IconUsers = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0" />
  </svg>
);
const IconCalendar = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);
const IconClock = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const IconCash = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);
const IconRefresh = ({ spinning }: { spinning: boolean }) => (
  <svg className={`w-3.5 h-3.5 ${spinning ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const formatTime = (date: Date | null) =>
  date ? date.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }) : '—';

const SkeletonKpi = () => (
  <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 animate-pulse">
    <div className="h-3 w-20 bg-slate-200 rounded mb-3" />
    <div className="h-7 w-12 bg-slate-200 rounded mb-2" />
    <div className="h-2.5 w-24 bg-slate-100 rounded" />
  </div>
);

interface KpiCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  subColor?: string;
  iconBg?: string;
  iconColor?: string;
  error?: boolean;       // muestra "—" en lugar del valor si el endpoint falló
}

const KpiCard = ({ icon, label, value, sub, subColor = 'text-slate-400', iconBg = 'bg-indigo-100', iconColor = 'text-indigo-600', error = false }: KpiCardProps) => (
  <div className="bg-white border border-slate-200 rounded-xl px-4 py-3">
    <div className="flex items-center gap-1.5 mb-2">
      <span className={`w-5 h-5 rounded-md flex items-center justify-center ${iconBg} ${iconColor}`}>
        {icon}
      </span>
      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">{label}</span>
    </div>
    <p className="text-2xl font-semibold text-slate-900 leading-none">
      {error ? <span className="text-slate-300 text-lg">—</span> : value}
    </p>
    {!error && sub && <p className={`text-[11px] mt-1.5 ${subColor}`}>{sub}</p>}
    {error && <p className="text-[11px] mt-1.5 text-red-400">Sin conexión</p>}
  </div>
);

export default function KpiBar() {
  const {
    totalPacientes, citasHoy, citasPendientesHoy, cobradoHoy,
    errorPacientes, errorCitas, errorPagos,
    loading, lastUpdated, refresh,
  } = useKpis();

  const anyError = errorPacientes || errorCitas || errorPagos;

  return (
    <div className="space-y-2">

      {/* Alerta granular: dice exactamente qué falló */}
      {anyError && (
        <div className="bg-amber-50 border border-amber-200 text-amber-700 text-xs px-3 py-2 rounded-lg flex items-center justify-between">
          <span>
            No se pudo cargar:{' '}
            {[
              errorPacientes && 'pacientes',
              errorCitas     && 'citas',
              errorPagos     && 'pagos',
            ].filter(Boolean).join(', ')}
            . Los demás indicadores están activos.
          </span>
          <button onClick={refresh} className="underline font-medium ml-3 whitespace-nowrap">
            Reintentar
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {loading && !lastUpdated ? (
          <><SkeletonKpi /><SkeletonKpi /><SkeletonKpi /><SkeletonKpi /></>
        ) : (
          <>
            <KpiCard
              icon={<IconUsers />} label="Total pacientes"
              value={totalPacientes} sub="registros activos"
              subColor="text-indigo-500" iconBg="bg-indigo-100" iconColor="text-indigo-600"
              error={errorPacientes}
            />
            <KpiCard
              icon={<IconCalendar />} label="Citas hoy"
              value={citasHoy}
              sub={`${citasPendientesHoy} pendiente${citasPendientesHoy !== 1 ? 's' : ''}`}
              subColor={citasPendientesHoy > 0 ? 'text-amber-500' : 'text-emerald-500'}
              iconBg="bg-emerald-100" iconColor="text-emerald-600"
              error={errorCitas}
            />
            <KpiCard
              icon={<IconClock />} label="Pendientes hoy"
              value={citasPendientesHoy}
              sub={citasPendientesHoy > 0 ? 'Requieren atención' : 'Al día ✓'}
              subColor={citasPendientesHoy > 0 ? 'text-red-500' : 'text-emerald-500'}
              iconBg="bg-amber-100" iconColor="text-amber-600"
              error={errorCitas}
            />
            <KpiCard
              icon={<IconCash />} label="Cobrado hoy"
              value={`S/ ${cobradoHoy.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              sub="pagos registrados hoy"
              subColor="text-slate-400" iconBg="bg-sky-100" iconColor="text-sky-600"
              error={errorPagos}
            />
          </>
        )}
      </div>

      <div className="flex items-center justify-end gap-2">
        {loading && lastUpdated && (
          <span className="text-[10px] text-slate-400 animate-pulse">Actualizando...</span>
        )}
        {lastUpdated && !loading && (
          <span className="text-[10px] text-slate-400">
            Actualizado a las {formatTime(lastUpdated)} · auto 30s
          </span>
        )}
        <button
          onClick={refresh} disabled={loading} title="Actualizar ahora"
          className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-40"
        >
          <IconRefresh spinning={loading} />
        </button>
      </div>
    </div>
  );
}

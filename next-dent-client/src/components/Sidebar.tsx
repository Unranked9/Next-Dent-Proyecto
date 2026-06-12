import { NavLink } from 'react-router-dom';

const navGroups = [
  {
    section: 'Principal',
    links: [
      { to: '/', label: 'Inicio', end: true, icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
      { to: '/pacientes', label: 'Pacientes', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0' },
      { to: '/citas', label: 'Citas', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
    ],
  },
  {
    section: 'Clínica',
    links: [
      { to: '/doctores', label: 'Doctores', icon: 'M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
      { to: '/tratamientos', label: 'Tratamientos', icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z' },
    ],
  },
  {
    section: 'Finanzas',
    links: [
      { to: '/pagos', label: 'Caja', icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z' },
      { to: '/tarifario', label: 'Tarifario', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
      { to: '/reporte', label: 'Reportes', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
    ],
  },
];

export default function Sidebar() {
  return (
    <aside className="fixed top-0 left-0 h-screen w-52 bg-[#0F172A] flex flex-col z-40">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-5 border-b border-white/[0.07]">
        <div className="w-8 h-8 bg-indigo-500 rounded-[9px] flex items-center justify-center flex-shrink-0">
          {/* Ícono diente SVG */}
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 3c-1.5 0-3 1-3 3 0 1.5.5 3 .5 4.5S6 13 6 15s.5 3 1.5 3 1.5-1.5 2-3 .5-2 .5-2 0 .5.5 2 1 3 2 3 1.5-1.5 1.5-3-.5-3-.5-4.5S18 7.5 18 6c0-2-1.5-3-3-3-1 0-2 .5-3 .5S10 3 9 3z" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-100 leading-none">Next Dent</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Gestión odontológica</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-3">
        {navGroups.map(({ section, links }) => (
          <div key={section} className="mb-1">
            <p className="px-3 pt-3 pb-1.5 text-[9px] font-semibold text-slate-600 uppercase tracking-widest">
              {section}
            </p>
            {links.map(({ to, label, icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end ?? false}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-2 rounded-md text-sm mb-0.5 border-l-2 transition-all ${
                    isActive
                      ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500 font-medium'
                      : 'text-slate-500 border-transparent hover:text-slate-300 hover:bg-white/5'
                  }`
                }
              >
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
                </svg>
                {label}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* Doctor info */}
      <div className="border-t border-white/[0.07] px-3 py-3 flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-full bg-indigo-500 flex items-center justify-center text-[10px] font-semibold text-white flex-shrink-0">
          DR
        </div>
        <div className="min-w-0">
          <p className="text-xs text-slate-300 truncate font-medium">Dr. Ramírez</p>
          <p className="text-[10px] text-slate-600">Odontólogo</p>
        </div>
      </div>
    </aside>
  );
}

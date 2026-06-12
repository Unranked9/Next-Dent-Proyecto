import { NavLink } from 'react-router-dom';

const links = [
  { to: '/pacientes', label: 'Pacientes' },
  { to: '/citas', label: 'Citas' },
  { to: '/doctores', label: 'Doctores' },
  { to: '/tratamientos', label: 'Tratamientos' },
  { to: '/pagos', label: 'Caja' },
  { to: '/tarifario', label: 'Tarifario' },
];

export default function Navbar() {
  return (
    <nav className="bg-white border-b border-gray-200 px-8 py-0 flex items-center gap-8">
      <span className="text-base font-bold text-blue-600 py-4 mr-4 tracking-tight">Next Dent</span>
      {links.map(({ to, label }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `text-sm font-medium py-4 border-b-2 transition-colors ${
              isActive
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`
          }
        >
          {label}
        </NavLink>
      ))}
    </nav>
  );
}

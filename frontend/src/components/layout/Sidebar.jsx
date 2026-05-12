import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  HomeIcon, CalendarDaysIcon, BuildingOfficeIcon,
  UsersIcon, ArchiveBoxIcon, UserGroupIcon,
  ArrowRightStartOnRectangleIcon,
} from '@heroicons/react/24/outline';

const navItems = [
  { to: '/',           icon: HomeIcon,               label: 'Dashboard' },
  { to: '/reservas',   icon: CalendarDaysIcon,        label: 'Reservas' },
  { to: '/habitaciones', icon: BuildingOfficeIcon,    label: 'Habitaciones' },
  { to: '/clientes',   icon: UsersIcon,               label: 'Clientes' },
  { to: '/inventario', icon: ArchiveBoxIcon,          label: 'Inventario' },
  { to: '/usuarios',   icon: UserGroupIcon,           label: 'Usuarios', adminOnly: true },
];

export default function Sidebar() {
  const { user, logout, isAdmin } = useAuth();

  return (
    <aside className="w-64 min-h-screen bg-finca-dark flex flex-col">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-finca-mid">
        <h1 className="text-white font-bold text-lg leading-tight">🌿 Finca Hotelera</h1>
        <p className="text-green-300 text-xs mt-0.5">Sistema de Gestión</p>
      </div>

      {/* Navegación */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ to, icon: Icon, label, adminOnly }) => {
          if (adminOnly && !isAdmin) return null;
          return (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-finca-light text-white'
                    : 'text-green-200 hover:bg-finca-mid hover:text-white'
                }`
              }
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {label}
            </NavLink>
          );
        })}
      </nav>

      {/* Usuario + logout */}
      <div className="px-4 py-4 border-t border-finca-mid">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-finca-light flex items-center justify-center text-white text-sm font-bold">
            {user?.nombre?.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-white text-sm font-medium truncate">{user?.nombre}</p>
            <p className="text-green-300 text-xs">{user?.rol}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-green-200 hover:bg-finca-mid hover:text-white transition-colors"
        >
          <ArrowRightStartOnRectangleIcon className="w-4 h-4" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}

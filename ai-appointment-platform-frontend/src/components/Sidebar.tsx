import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  X,
  LayoutDashboard,
  Calendar,
  CheckSquare,
  Smartphone,
  BarChart3,
  Users,
  LogOut,
  MessageCircle,
  Settings,
  Moon,
  Sun,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { ProfileModal } from './ProfileModal';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const location = useLocation();
  const { isAdmin, logout, usuario } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [profileOpen, setProfileOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const linkClass = (path: string) => `
    flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-150
    ${
      isActive(path)
        ? 'bg-surface-elevated text-txt font-medium shadow-sm ring-1 ring-border'
        : 'text-txt-secondary hover:text-txt hover:bg-surface-elevated'
    }
  `;

  return (
    <>
      <aside
        className={`
        fixed top-0 h-[100dvh] left-0 z-sidebar w-60 bg-sidebar text-txt flex flex-col
        transition-transform duration-300 ease-in-out border-r border-border shadow-card
        md:static md:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}
      >
        <div className="md:hidden absolute top-4 right-4 z-20">
          <button
            onClick={onClose}
            aria-label="Cerrar menu"
            className="p-1.5 hover:bg-surface-elevated rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-txt-muted hover:text-txt" />
          </button>
        </div>

        <div className="p-5 mt-4 md:mt-0">
          <button
            onClick={() => setProfileOpen(true)}
            className="flex items-center gap-2.5 w-full text-left group hover:opacity-80 transition-opacity"
          >
            <div className="w-8 h-8 rounded-lg overflow-hidden bg-primary flex-shrink-0 flex items-center justify-center shadow-sm">
              {usuario?.fotoPerfil ? (
                <img
                  src={usuario.fotoPerfil}
                  alt={usuario.nombre}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-xs font-bold text-on-primary">
                  {usuario?.nombre?.charAt(0)?.toUpperCase() ?? ''}
                </span>
              )}
            </div>

            <div className="min-w-0">
              <h2 className="text-sm font-semibold tracking-tight text-txt truncate leading-tight">
                {usuario?.nombre || 'Asistente IA'}
              </h2>
              <p className="text-xs text-txt-muted font-medium mt-0.5 truncate">
                {usuario?.rol === 'ADMIN' ? 'Administrador' : 'Staff'}
              </p>
            </div>
          </button>
        </div>

        <div className="mx-4 h-px bg-border" />

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto mt-1">
          <p className="px-3 py-1.5 text-xs text-txt-muted uppercase tracking-wider font-semibold">
            General
          </p>

          <Link to="/dashboard" onClick={onClose} className={linkClass('/dashboard')}>
            <LayoutDashboard size={16} />
            <span className="text-sm">Inicio</span>
          </Link>

          <Link
            to="/dashboard/calendario"
            onClick={onClose}
            className={linkClass('/dashboard/calendario')}
          >
            <Calendar size={16} />
            <span className="text-sm">Calendario</span>
          </Link>

          <Link to="/dashboard/pagos" onClick={onClose} className={linkClass('/dashboard/pagos')}>
            <CheckSquare size={16} />
            <span className="text-sm">Validar Pagos</span>
          </Link>

          <Link to="/dashboard/chat" onClick={onClose} className={linkClass('/dashboard/chat')}>
            <MessageCircle size={16} />
            <span className="text-sm">Chat WhatsApp</span>
          </Link>

          <Link
            to="/dashboard/vincular"
            onClick={onClose}
            className={linkClass('/dashboard/vincular')}
          >
            <Smartphone size={16} />
            <span className="text-sm">Vincular WhatsApp</span>
          </Link>

          {isAdmin && (
            <>
              <div className="mx-3 my-2 h-px bg-border" />
              <p className="px-3 py-1.5 text-xs text-txt-muted uppercase tracking-wider font-semibold">
                Administracion
              </p>

              <Link
                to="/dashboard/statistics"
                onClick={onClose}
                className={linkClass('/dashboard/statistics')}
              >
                <BarChart3 size={16} />
                <span className="text-sm">Estadisticas</span>
              </Link>

              <Link
                to="/dashboard/users"
                onClick={onClose}
                className={linkClass('/dashboard/users')}
              >
                <Users size={16} />
                <span className="text-sm">Usuarios</span>
              </Link>

              <Link
                to="/dashboard/configuracion-bot"
                onClick={onClose}
                className={linkClass('/dashboard/configuracion-bot')}
              >
                <Settings size={16} />
                <span className="text-sm">Configuracion Bot</span>
              </Link>
            </>
          )}
        </nav>

        <div className="p-3 border-t border-border bg-surface-elevated/50">
          <button
            onClick={toggleTheme}
            className="flex items-center gap-3 px-3 py-2 w-full text-left rounded-lg text-txt-secondary hover:bg-surface-elevated transition-all duration-150 mb-2"
          >
            {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
            <span className="text-sm font-medium">
              {theme === 'light' ? 'Modo Oscuro' : 'Modo Claro'}
            </span>
          </button>
          <button
            onClick={() => {
              logout();
              onClose();
            }}
            className="flex items-center gap-3 px-3 py-2 w-full text-left rounded-lg text-danger hover:bg-danger-light transition-all duration-150"
          >
            <LogOut size={16} />
            <span className="text-sm font-medium">Cerrar Sesion</span>
          </button>
          <p className="text-center text-xs text-txt-muted font-mono mt-2.5 bg-surface-elevated border border-border py-0.5 px-2 rounded-full w-max mx-auto">
            v1.0.0 PRO
          </p>
        </div>
      </aside>

      <ProfileModal isOpen={profileOpen} onClose={() => setProfileOpen(false)} />
    </>
  );
};

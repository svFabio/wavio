import { Link, useLocation } from 'react-router-dom';
import { X, LayoutDashboard, Calendar, CheckSquare, Smartphone, BarChart3, Users, LogOut, MessageCircle, Sparkles, Settings } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const location = useLocation();
  const { isAdmin, logout, negocio } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  const linkClass = (path: string) => `
    flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group relative
    ${isActive(path)
      ? 'bg-primary text-white shadow-lg shadow-primary/20 font-semibold'
      : 'text-sidebar-text hover:bg-sidebar-hover hover:text-white'
    }
  `;

  return (
    <aside className={`
      fixed top-0 h-[100dvh] left-0 z-50 w-64 bg-sidebar text-white flex flex-col shadow-xl 
      transition-transform duration-300 ease-in-out
      md:static md:translate-x-0 
      ${isOpen ? 'translate-x-0' : '-translate-x-full'}
    `}>
      {/* Close button mobile */}
      <div className="md:hidden absolute top-4 right-4">
        <button onClick={onClose} className="p-1.5 hover:bg-sidebar-hover rounded-full transition-colors">
          <X className="w-5 h-5 text-sidebar-text hover:text-white" />
        </button>
      </div>

      {/* Logo Area */}
      <div className="p-6 mt-8 md:mt-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">{negocio?.nombre || 'CitasWA'}</h2>
            <p className="text-[10px] text-sidebar-text uppercase tracking-widest font-medium">Panel de Control</p>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="mx-4 h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent" />

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto mt-2">
        <p className="px-4 py-2 text-[10px] text-sidebar-text uppercase tracking-widest font-semibold">General</p>

        <Link to="/dashboard" onClick={onClose} className={linkClass('/dashboard')}>
          <LayoutDashboard size={18} />
          <span className="text-sm font-medium">Inicio</span>
        </Link>

        <Link to="/dashboard/calendario" onClick={onClose} className={linkClass('/dashboard/calendario')}>
          <Calendar size={18} />
          <span className="text-sm font-medium">Calendario</span>
        </Link>

        <Link to="/dashboard/pagos" onClick={onClose} className={linkClass('/dashboard/pagos')}>
          <CheckSquare size={18} />
          <span className="text-sm font-medium">Validar Pagos</span>
        </Link>

        <Link to="/dashboard/chat" onClick={onClose} className={linkClass('/dashboard/chat')}>
          <MessageCircle size={18} />
          <span className="text-sm font-medium">Chat WhatsApp</span>
        </Link>

        <Link to="/dashboard/vincular" onClick={onClose} className={linkClass('/dashboard/vincular')}>
          <Smartphone size={18} />
          <span className="text-sm font-medium">Vincular WhatsApp</span>
        </Link>

        {/* Admin section */}
        {isAdmin() && (
          <>
            <div className="mx-4 my-3 h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
            <p className="px-4 py-2 text-[10px] text-sidebar-text uppercase tracking-widest font-semibold">Administración</p>

            <Link to="/dashboard/statistics" onClick={onClose} className={linkClass('/dashboard/statistics')}>
              <BarChart3 size={18} />
              <span className="text-sm font-medium">Estadísticas</span>
            </Link>

            <Link to="/dashboard/users" onClick={onClose} className={linkClass('/dashboard/users')}>
              <Users size={18} />
              <span className="text-sm font-medium">Usuarios</span>
            </Link>

            <Link to="/dashboard/configuracion-bot" onClick={onClose} className={linkClass('/dashboard/configuracion-bot')}>
              <Settings size={18} />
              <span className="text-sm font-medium">Configuracion Bot</span>
            </Link>
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-slate-800/50">
        <button
          onClick={() => {
            logout();
            onClose();
          }}
          className="flex items-center gap-3 px-4 py-2.5 w-full text-left rounded-xl text-danger/80 hover:bg-danger/10 hover:text-danger transition-all duration-200"
        >
          <LogOut size={18} />
          <span className="text-sm font-medium">Cerrar Sesión</span>
        </button>
        <p className="text-center text-[10px] text-sidebar-text/50 font-mono mt-3 tracking-wider">v1.0.0 PRO</p>
      </div>
    </aside>
  );
};

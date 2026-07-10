import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Calendar, Clock, CheckCircle2, TrendingUp, ArrowRight, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Link } from 'react-router-dom';

interface CitaResumen {
  id: number;
  clienteNombre: string | null;
  clienteTelefono: string;
  horario: string;
  estado: string;
  servicio?: string;
  rating?: number;
}

interface ResumenData {
  citasHoy: number;
  pendientes: number;
  proximasCitas: CitaResumen[];
  totalFuturas: number;
}

const Dashboard = () => {
  const [data, setData] = useState<ResumenData | null>(null);

  useEffect(() => {
    api.obtenerResumen()
      .then(resumen => {
        if (resumen) setData(resumen);
      })
      .catch(console.error);
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  // Skeleton loading state
  if (!data) return (
    <div className="space-y-6">
      <div className="skeleton h-24 w-full rounded-theme-lg" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="skeleton h-32 rounded-theme-lg" />
        <div className="skeleton h-32 rounded-theme-lg" />
        <div className="skeleton h-32 rounded-theme-lg" />
      </div>
      <div className="skeleton h-64 rounded-theme-lg" />
    </div>
  );

  const statCards = [
    {
      label: 'Citas para Hoy',
      value: data.citasHoy,
      icon: Calendar,
      color: 'primary',
      gradient: 'from-primary to-secondary',
    },
    {
      label: 'Pagos por Validar',
      value: data.pendientes,
      icon: Clock,
      color: 'warning',
      gradient: 'from-amber-500 to-orange-500',
    },
    {
      label: 'Total Citas Futuras',
      value: data.totalFuturas,
      icon: TrendingUp,
      color: 'success',
      gradient: 'from-emerald-500 to-teal-500',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Greeting Header */}
      <div className="card-modern p-5 md:p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-txt flex items-center gap-2">
              {getGreeting()} <span className="text-2xl"></span>
            </h1>
            <p className="text-sm text-txt-muted mt-1">
              {format(new Date(), "EEEE d 'de' MMMM, yyyy", { locale: es })}
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-txt-muted bg-surface-elevated px-3 py-1.5 rounded-full">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            Panel Activo
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((stat, i) => (
          <div key={i} className="stat-card group">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-txt-secondary">{stat.label}</p>
                <p className="text-3xl font-bold text-txt mt-2 animate-count-up">{stat.value}</p>
              </div>
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg`}
                style={{ boxShadow: `0 4px 14px -3px ${stat.color === 'primary' ? 'var(--color-primary-glow)' : stat.color === 'warning' ? 'rgba(245,158,11,0.3)' : 'rgba(16,185,129,0.3)'}` }}
              >
                <stat.icon className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Today's Agenda */}
      <div className="card-modern overflow-hidden">
        <div className="px-5 md:px-6 py-4 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-txt">Agenda de Hoy</h2>
            <p className="text-xs text-txt-muted mt-0.5">Citas programadas para hoy</p>
          </div>
          <Link to="/dashboard/calendario" className="text-xs font-semibold text-primary hover:text-primary-dark transition-colors flex items-center gap-1">
            Ver calendario <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface-elevated/50">
                <th className="px-6 py-3 text-[11px] font-semibold text-txt-muted uppercase tracking-wider">Hora</th>
                <th className="px-6 py-3 text-[11px] font-semibold text-txt-muted uppercase tracking-wider">Servicio</th>
                <th className="px-6 py-3 text-[11px] font-semibold text-txt-muted uppercase tracking-wider">Cliente</th>
                <th className="px-6 py-3 text-[11px] font-semibold text-txt-muted uppercase tracking-wider">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light">
              {data.proximasCitas.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-txt-muted">
                    <CheckCircle2 className="w-10 h-10 mx-auto text-success/40 mb-2" />
                    <p className="font-medium">No hay citas programadas para hoy</p>
                  </td>
                </tr>
              ) : (
                data.proximasCitas.map((cita) => (
                  <tr key={cita.id} className="hover:bg-surface-alt/50 transition-colors">
                    <td className="px-6 py-3.5">
                      <span className="font-mono font-semibold text-txt text-sm">{cita.horario}</span>
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-secondary-light/30 text-secondary border border-secondary/20">
                        {cita.servicio || 'Spa'}
                      </span>
                    </td>
                    <td className="px-6 py-3.5">
                      {cita.clienteNombre ? (
                        <span className="capitalize font-medium text-sm text-txt">{cita.clienteNombre}</span>
                      ) : (
                        <span className="text-txt-muted text-sm font-mono">
                          {cita.clienteTelefono.length > 15
                            ? cita.clienteTelefono.substring(0, 8) + '...'
                            : cita.clienteTelefono}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3.5">
                      <span className={`badge ${cita.estado === 'CONFIRMADA' ? 'badge-success' :
                        cita.estado === 'VALIDACION_PENDIENTE' ? 'badge-warning' :
                          'badge-info'
                        }`}>
                        {cita.estado}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table >
        </div >

        {/* Mobile Cards */}
        < div className="md:hidden divide-y divide-border-light" >
          {
            data.proximasCitas.length === 0 ? (
              <div className="px-4 py-10 text-center text-txt-muted">
                <CheckCircle2 className="w-10 h-10 mx-auto text-success/40 mb-2" />
                <p className="font-medium">No hay citas programadas para hoy</p>
              </div>
            ) : (
              data.proximasCitas.map((cita) => (
                <div key={cita.id} className="p-4 hover:bg-surface-alt/50 transition-colors">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-mono font-semibold text-txt text-sm">{cita.horario}</p>
                      {cita.clienteNombre ? (
                        <p className="text-sm text-txt-secondary capitalize mt-0.5">{cita.clienteNombre}</p>
                      ) : (
                        <p className="text-sm text-txt-muted font-mono mt-0.5">
                          {cita.clienteTelefono.length > 15
                            ? cita.clienteTelefono.substring(0, 8) + '...'
                            : cita.clienteTelefono}
                        </p>
                      )}
                      <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-medium bg-purple-50 text-purple-700 rounded border border-purple-100">
                        {cita.servicio || 'Spa'}
                      </span>
                    </div>
                    <span className={`badge ${cita.estado === 'CONFIRMADA' ? 'badge-success' :
                      cita.estado === 'VALIDACION_PENDIENTE' ? 'badge-warning' :
                        'badge-info'
                      }`}>
                      {cita.estado}
                    </span>
                  </div>
                </div>
              ))
            )
          }
        </div >
      </div >
    </div >
  );
};

export default Dashboard;
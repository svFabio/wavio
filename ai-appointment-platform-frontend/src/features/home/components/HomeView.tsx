import { Calendar, Clock, TrendingUp, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import type { ResumenData } from '../types';
import { AgendaTable } from './AgendaTable';
import { StatCard } from './StatCard';

interface HomeViewProps {
  data: ResumenData | null | undefined;
  loading: boolean;
}

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Buenos dias';
  if (hour < 18) return 'Buenas tardes';
  return 'Buenas noches';
};

export const HomeView = ({ data, loading }: HomeViewProps) => {
  if (loading || !data)
    return (
      <div className="space-y-6">
        <div className="card-modern p-5 md:p-6">
          <div className="space-y-2">
            <div className="skeleton h-7 w-64 rounded" />
            <div className="skeleton h-3 w-48 rounded" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="stat-card">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="skeleton h-3 w-28 rounded" />
                  <div className="skeleton h-7 w-16 rounded" />
                </div>
                <div className="skeleton w-11 h-11 rounded-xl shrink-0" />
              </div>
            </div>
          ))}
        </div>

        <div className="card-modern overflow-hidden">
          <div className="px-5 md:px-6 py-4 border-b border-border flex items-center justify-between">
            <div className="space-y-1">
              <div className="skeleton h-4 w-32 rounded" />
              <div className="skeleton h-2.5 w-40 rounded" />
            </div>
            <div className="skeleton h-3 w-24 rounded" />
          </div>
          <div className="hidden md:block">
            <div className="bg-surface-elevated/50">
              <div className="flex px-6 py-3 gap-6">
                <div className="skeleton h-2.5 w-12 rounded" />
                <div className="skeleton h-2.5 w-16 rounded" />
                <div className="skeleton h-2.5 w-20 rounded" />
                <div className="skeleton h-2.5 w-16 rounded" />
              </div>
            </div>
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="flex items-center px-6 py-3.5 border-t border-border-light gap-6"
              >
                <div className="skeleton h-3.5 w-14 rounded" />
                <div className="skeleton h-5 w-16 rounded-md" />
                <div className="skeleton h-3.5 w-28 rounded" />
                <div className="skeleton h-5 w-20 rounded-full" />
              </div>
            ))}
          </div>
          <div className="md:hidden">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="p-4 border-t border-border-light">
                <div className="flex justify-between items-start">
                  <div className="space-y-1.5">
                    <div className="skeleton h-3.5 w-14 rounded" />
                    <div className="skeleton h-3 w-28 rounded" />
                    <div className="skeleton h-4 w-16 rounded-md" />
                  </div>
                  <div className="skeleton h-5 w-20 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );

  const statCards = [
    {
      label: 'Citas para Hoy',
      value: data.totalHoy,
      icon: Calendar,
      gradient: 'from-primary to-secondary',
      glow: 'var(--color-primary-glow)',
    },
    {
      label: 'Pagos por Validar',
      value: data.pendientes,
      icon: Clock,
      gradient: 'from-gradient-warm-from to-gradient-warm-to',
      glow: 'var(--color-warning-glow)',
    },
    {
      label: 'Total Citas Futuras',
      value: data.completadas,
      icon: TrendingUp,
      gradient: 'from-gradient-cool-from to-gradient-cool-to',
      glow: 'var(--color-success-glow)',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="card-modern p-5 md:p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-txt flex items-center gap-2">
              {getGreeting()} <span className="text-2xl" aria-hidden="true" />
            </h1>
            <p className="text-sm text-txt-muted mt-1">
              {format(new Date(), "EEEE d 'de' MMMM, yyyy", { locale: es })}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((stat) => (
          <StatCard
            key={stat.label}
            label={stat.label}
            value={stat.value}
            icon={stat.icon}
            gradient={stat.gradient}
            glow={`0 4px 14px -3px ${stat.glow}`}
          />
        ))}
      </div>

      <div className="card-modern overflow-hidden">
        <div className="px-5 md:px-6 py-4 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-txt">Agenda de Hoy</h2>
            <p className="text-xs text-txt-muted mt-0.5">Citas programadas para hoy</p>
          </div>
          <Link
            to="/dashboard/calendario"
            className="text-xs font-semibold text-primary hover:text-primary-dark transition-colors flex items-center gap-1"
          >
            Ver calendario <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <AgendaTable citas={[]} />
      </div>
    </div>
  );
};

import React from 'react';
import { Calendar, Clock, TrendingUp, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import type { ResumenData } from '../types';
import type { Cita } from '../../../types';
import { AgendaTable } from './AgendaTable';
import { StatCard } from './StatCard';
import { HomeSkeleton } from '../../../shared/components/skeletons/HomeSkeleton';

interface HomeViewProps {
  data: ResumenData | null | undefined;
  loading: boolean;
  citas: Cita[];
  error?: string | null;
}

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Buenos dias';
  if (hour < 18) return 'Buenas tardes';
  return 'Buenas noches';
};

export const HomeView = ({ data, loading, citas, error }: HomeViewProps): React.JSX.Element => {
  if (loading || !data) return <HomeSkeleton />;

  if (error) {
    return (
      <div className="space-y-6">
        <div className="card-modern p-6 text-center">
          <p className="text-danger font-medium">{error}</p>
          <p className="text-txt-muted text-sm mt-1">Algunos datos pueden no estar disponibles.</p>
        </div>
      </div>
    );
  }

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
            <h1 className="text-2xl md:text-3xl font-bold text-txt">{getGreeting()}</h1>
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
        <AgendaTable citas={citas} />
      </div>
    </div>
  );
};

import { useMemo } from 'react';
import { TrendingUp, Users, Clock, DollarSign } from 'lucide-react';
import { RevenueChart } from './RevenueChart';
import { CitasChart } from './CitasChart';
import { OriginsChart } from './OriginsChart';
import { ClientList } from './ClientList';
import { StatisticsSkeleton } from './StatisticsSkeleton';
import type { Cliente } from '../../../types';

const MONTH_NAMES: Record<string, string> = {
  '01': 'Ene',
  '02': 'Feb',
  '03': 'Mar',
  '04': 'Abr',
  '05': 'May',
  '06': 'Jun',
  '07': 'Jul',
  '08': 'Ago',
  '09': 'Sep',
  '10': 'Oct',
  '11': 'Nov',
  '12': 'Dic',
};

interface OverviewData {
  citasMes: number;
  ingresosMes: number;
  citasVirtuales: number;
  citasPresenciales: number;
  topClientes: Array<{ nombre: string; telefono: string; totalCitas: number }>;
  horariosPopulares: Array<{ horario: string; totalReservas: number }>;
}

interface RevenueData {
  revenue: Array<{ mes: string; total: number }>;
}

interface StatisticsViewProps {
  overview: OverviewData | null;
  revenue: RevenueData | null;
  loading: boolean;
  clientes: Cliente[];
}

export const StatisticsView = ({ overview, revenue, loading, clientes }: StatisticsViewProps) => {
  const revenueFormatted = useMemo(() => {
    return (revenue?.revenue || []).map((item) => ({
      ...item,
      mesLabel: MONTH_NAMES[item.mes.split('-')[1]] || item.mes,
    }));
  }, [revenue]);

  const origenData = useMemo(
    () => [
      { name: 'Virtual', value: overview?.citasVirtuales || 0 },
      { name: 'Presencial', value: overview?.citasPresenciales || 0 },
    ],
    [overview],
  );

  const totalOrigen = origenData.reduce((s, d) => s + d.value, 0);

  const statCards = [
    {
      label: 'Citas Este Mes',
      value: overview?.citasMes || 0,
      icon: TrendingUp,
      gradient: 'from-primary to-secondary',
    },
    {
      label: 'Ingresos del Mes',
      value: `Bs. ${overview?.ingresosMes || 0}`,
      icon: DollarSign,
      gradient: 'from-gradient-cool-from to-gradient-cool-to',
    },
    {
      label: 'Clientes Frecuentes',
      value: overview?.topClientes.length || 0,
      icon: Users,
      gradient: 'from-gradient-purple-from to-gradient-purple-to',
    },
    {
      label: 'Horarios Activos',
      value: overview?.horariosPopulares.length || 0,
      icon: Clock,
      gradient: 'from-gradient-warm-from to-gradient-warm-to',
    },
  ];

  if (loading) {
    return <StatisticsSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div className="card-modern overflow-hidden">
        <div className="p-5 md:p-6 border-b border-border">
          <h2 className="text-lg font-bold text-txt">Estadisticas</h2>
          <p className="text-sm text-txt-muted mt-1">Resumen de actividad de tu negocio</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <div key={stat.label} className="stat-card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-txt-secondary">{stat.label}</p>
                <p className="text-2xl font-bold text-txt mt-2">{stat.value}</p>
              </div>
              <div
                className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg`}
              >
                <stat.icon className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RevenueChart data={revenueFormatted} />
        </div>
        <OriginsChart data={origenData} total={totalOrigen} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CitasChart horarios={overview?.horariosPopulares || []} />
        <ClientList clientes={overview?.topClientes || []} allClientes={clientes} />
      </div>
    </div>
  );
};

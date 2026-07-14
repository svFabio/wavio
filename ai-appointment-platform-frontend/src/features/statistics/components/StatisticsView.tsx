import { useMemo } from 'react';
import { TrendingUp, Users, Clock, DollarSign } from 'lucide-react';
import { RevenueChart } from './RevenueChart';
import { CitasChart } from './CitasChart';
import { OriginsChart } from './OriginsChart';
import { ClientList } from './ClientList';

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
}

export const StatisticsView = ({ overview, revenue, loading }: StatisticsViewProps) => {
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
    return (
      <div className="space-y-6">
        <div className="card-modern overflow-hidden">
          <div className="p-5 md:p-6 border-b border-border">
            <div className="space-y-2">
              <div className="skeleton h-5 w-48 rounded" />
              <div className="skeleton h-3 w-64 rounded" />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={`sc-${i}`} className="stat-card p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="skeleton h-3 w-20 rounded" />
                  <div className="skeleton h-7 w-16 rounded" />
                </div>
                <div className="skeleton w-10 h-10 rounded-xl shrink-0" />
              </div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="card-modern p-5 md:p-6 lg:col-span-2">
            <div className="skeleton h-5 w-40 rounded mb-4" />
            <div className="skeleton h-[280px] w-full rounded-xl" />
          </div>
          <div className="card-modern p-5 md:p-6">
            <div className="skeleton h-5 w-36 rounded mb-2" />
            <div className="skeleton h-3 w-16 rounded mb-4" />
            <div className="skeleton w-[150px] h-[150px] rounded-full mx-auto mb-4" />
            <div className="flex justify-center gap-6">
              <div className="skeleton h-4 w-20 rounded" />
              <div className="skeleton h-4 w-20 rounded" />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card-modern p-5 md:p-6">
            <div className="skeleton h-5 w-44 rounded mb-4" />
            <div className="skeleton h-[260px] w-full rounded-xl" />
          </div>
          <div className="card-modern p-5 md:p-6">
            <div className="skeleton h-5 w-48 rounded mb-4" />
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div
                  key={`cl-${i}`}
                  className="flex items-center gap-3 p-3 rounded-xl bg-surface-elevated/50"
                >
                  <div className="skeleton w-8 h-8 rounded-lg shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="skeleton h-4 w-32 rounded" />
                    <div className="skeleton h-3 w-24 rounded" />
                  </div>
                  <div className="skeleton h-5 w-14 rounded-full shrink-0" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
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
        <ClientList clientes={overview?.topClientes || []} />
      </div>
    </div>
  );
};

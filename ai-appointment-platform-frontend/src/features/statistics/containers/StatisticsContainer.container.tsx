import { useQuery } from '@tanstack/react-query';
import { StatisticsView } from '../components/StatisticsView';
import { statisticsApi } from '../api/statistics.api';
import { clientesApi } from '../api/clientes.api';

export const StatisticsContainer = (): React.JSX.Element => {
  const overviewQuery = useQuery({
    queryKey: ['statistics', 'overview'],
    queryFn: () => statisticsApi.getStatisticsOverview(),
  });

  const revenueQuery = useQuery({
    queryKey: ['statistics', 'revenue'],
    queryFn: () => statisticsApi.getStatisticsRevenue(6),
  });

  const clientesQuery = useQuery({
    queryKey: ['clientes'],
    queryFn: () => clientesApi.getClientes(),
  });

  const loading = overviewQuery.isLoading || revenueQuery.isLoading;
  const overview = overviewQuery.data ?? null;
  const revenue = revenueQuery.data ?? null;
  const clientes = clientesQuery.data ?? [];

  return (
    <StatisticsView overview={overview} revenue={revenue} loading={loading} clientes={clientes} />
  );
};

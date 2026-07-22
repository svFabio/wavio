import { useQuery } from '@tanstack/react-query';
import { api } from '../../../services/api';
import { StatisticsView } from '../components/StatisticsView';

export const StatisticsContainer = () => {
  const overviewQuery = useQuery({
    queryKey: ['statistics', 'overview'],
    queryFn: () => api.getStatisticsOverview(),
  });

  const revenueQuery = useQuery({
    queryKey: ['statistics', 'revenue'],
    queryFn: () => api.getStatisticsRevenue(6),
  });

  const clientesQuery = useQuery({
    queryKey: ['clientes'],
    queryFn: () => api.getClientes(),
  });

  const loading = overviewQuery.isLoading || revenueQuery.isLoading;
  const overview = overviewQuery.data ?? null;
  const revenue = revenueQuery.data ?? null;
  const clientes = clientesQuery.data ?? [];

  return (
    <StatisticsView overview={overview} revenue={revenue} loading={loading} clientes={clientes} />
  );
};

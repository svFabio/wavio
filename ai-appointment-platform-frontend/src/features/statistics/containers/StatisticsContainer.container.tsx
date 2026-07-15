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

  const loading = overviewQuery.isLoading || revenueQuery.isLoading;
  const overview = overviewQuery.data ?? null;
  const revenue = revenueQuery.data ?? null;

  return <StatisticsView overview={overview} revenue={revenue} loading={loading} />;
};

import { useQuery } from '@tanstack/react-query';
import { api } from '../../../services/api';
import { HomeView } from '../components/HomeView';
import type { ResumenData } from '../types';

export const HomeContainer = () => {
  const { data, isLoading: loading } = useQuery<ResumenData | null>({
    queryKey: ['citas', 'resumen'],
    queryFn: () => api.obtenerResumen(),
  });

  const { data: citasData, isLoading: citasLoading } = useQuery({
    queryKey: ['citas', 'hoy'],
    queryFn: () => api.obtenerCitas(new Date().toISOString().split('T')[0]),
  });

  return <HomeView data={data} loading={loading} citas={citasData || []} citasLoading={citasLoading} />;
};

import { useQuery } from '@tanstack/react-query';
import { api } from '../../../services/api';
import { HomeView } from '../components/HomeView';
import { ErrorBoundary } from '../../../shared/components/ErrorBoundary';
import type { ResumenData } from '../types';

export const HomeContainer = () => {
  const {
    data,
    isLoading: loading,
    isError: isErrorResumen,
  } = useQuery<ResumenData | null>({
    queryKey: ['citas', 'resumen'],
    queryFn: () => api.obtenerResumen(),
  });

  const {
    data: citasData,
    isLoading: citasLoading,
    isError: isErrorCitas,
  } = useQuery({
    queryKey: ['citas', 'hoy'],
    queryFn: () => api.obtenerCitas(new Date().toISOString().split('T')[0]),
  });

  const error = isErrorResumen || isErrorCitas ? 'Error cargando el resumen del día' : null;

  return (
    <ErrorBoundary>
      <HomeView data={data} loading={loading} citas={citasData || []} error={error} />
    </ErrorBoundary>
  );
};

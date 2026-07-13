import { useQuery } from '@tanstack/react-query';
import { api } from '../../../services/api';
import { HomeView } from '../components/HomeView';

interface CitaResumen {
  id: number;
  clienteNombre: string | null;
  clienteTelefono: string;
  horario: string;
  estado: string;
  servicio?: string;
  rating?: number;
}

export interface ResumenData {
  citasHoy: number;
  pendientes: number;
  proximasCitas: CitaResumen[];
  totalFuturas: number;
}

export const HomeContainer = () => {
  const { data, isLoading: loading } = useQuery<ResumenData | null>({
    queryKey: ['citas', 'resumen'],
    queryFn: () => api.obtenerResumen(),
  });

  return <HomeView data={data} loading={loading} />;
};

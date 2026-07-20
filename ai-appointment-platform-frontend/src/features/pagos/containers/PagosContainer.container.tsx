import { usePendientesQuery } from '../api/usePendientesQuery';
import { useValidarPagoMutation } from '../api/useValidarPagoMutation';
import { PagosView } from '../components/PagosView';

export const PagosContainer = () => {
  const { data: citas = [], isLoading: loading } = usePendientesQuery();
  const { mutateAsync: validarPago } = useValidarPagoMutation();

  const manejarValidacion = async (id: string, accion: 'APROBAR' | 'RECHAZAR') => {
    const confirmacion = window.confirm(
      `¿Estás seguro de ${accion === 'APROBAR' ? 'APROBAR' : 'RECHAZAR'} este pago?`,
    );
    if (!confirmacion) return;

    await validarPago({ id, accion });
  };

  return <PagosView citas={citas} loading={loading} onValidar={manejarValidacion} />;
};

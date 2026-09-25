import { usePendientesQuery } from '../api/usePendientesQuery';
import { useValidarPagoMutation } from '../api/useValidarPagoMutation';
import { PagosView } from '../components/PagosView';

export const PagosContainer = (): React.JSX.Element => {
  const { data: citas = [], isLoading: loading } = usePendientesQuery();
  const { mutate: validarPago } = useValidarPagoMutation();

  const manejarValidacion = async (id: string, accion: 'APROBAR' | 'RECHAZAR'): Promise<void> => {
    const confirmacion = window.confirm(
      `¿Estás seguro de ${accion === 'APROBAR' ? 'APROBAR' : 'RECHAZAR'} este pago?`,
    );
    if (!confirmacion) return;

    // mutate() en lugar de mutateAsync(): los fallos van al onError de la
    // mutación (toast) y no queda ninguna promesa sin manejar.
    validarPago({ id, accion });
  };

  return <PagosView citas={citas} loading={loading} onValidar={manejarValidacion} />;
};

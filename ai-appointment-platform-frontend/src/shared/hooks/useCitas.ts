import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { toast } from 'sonner';

export const useCitas = (fecha?: string) => {
    return useQuery({
        queryKey: ['citas', fecha],
        queryFn: () => api.obtenerCitas(fecha),
    });
};

export const usePendientes = () => {
    return useQuery({
        queryKey: ['citas', 'pendientes'],
        queryFn: () => api.obtenerPendientes(),
    });
};

export const useValidarPago = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, accion }: { id: string; accion: 'APROBAR' | 'RECHAZAR' }) =>
            api.validarPago(id, accion).then(success => {
                if (!success) throw new Error('Error al realizar la acción');
            }),
        onSuccess: () => {
            toast.success('Acción realizada con éxito');
            queryClient.invalidateQueries({ queryKey: ['citas'] });
        },
        onError: () => {
            toast.error('Error de conexión');
        }
    });
};

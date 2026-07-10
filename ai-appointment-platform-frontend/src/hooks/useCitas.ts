import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
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
            api.validarPago(id, accion),
        onSuccess: (success) => {
            if (success) {
                toast.success('Acción realizada con éxito');
                queryClient.invalidateQueries({ queryKey: ['citas'] });
            } else {
                toast.error('Error al realizar la acción');
            }
        },
        onError: () => {
            toast.error('Error de conexión');
        }
    });
};

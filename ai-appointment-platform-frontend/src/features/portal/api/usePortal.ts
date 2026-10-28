import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { BookAppointmentPayload } from '../types';
import { portalApi } from './portal.api';

export function useValidateMagicLinkQuery(token: string) {
  return useQuery({
    queryKey: ['portal', 'validate', token],
    queryFn: () => portalApi.validateMagicLink(token),
    retry: 1,
    enabled: !!token,
  });
}

export function usePortalAppointmentsQuery(token: string) {
  return useQuery({
    queryKey: ['portal', 'appointments', token],
    queryFn: () => portalApi.getPortalAppointments(token),
    retry: 1,
    enabled: !!token,
  });
}

export function usePortalServicesQuery(token: string) {
  return useQuery({
    queryKey: ['portal', 'services', token],
    queryFn: () => portalApi.getPortalServices(token),
    retry: 1,
    enabled: !!token,
  });
}

export function usePortalAvailableSlotsQuery(token: string, fecha: string, servicioId?: number) {
  return useQuery({
    queryKey: ['portal', 'slots', token, fecha, servicioId],
    queryFn: () => portalApi.getPortalAvailableSlots(token, fecha, servicioId),
    retry: 1,
    enabled: !!token && !!fecha,
  });
}

export function useBookAppointmentMutation(token: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: BookAppointmentPayload) => portalApi.bookPortalAppointment(token, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal', 'appointments', token] });
      queryClient.invalidateQueries({ queryKey: ['portal', 'slots'] });
    },
  });
}

export function useGenerateLinkMutation() {
  return useMutation({
    mutationFn: (clienteId: number) => portalApi.generateMagicLink(clienteId),
  });
}

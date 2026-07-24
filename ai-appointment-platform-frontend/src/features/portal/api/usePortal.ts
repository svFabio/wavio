import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import type { BookAppointmentPayload } from '../types';

export function useValidateMagicLinkQuery(token: string) {
  return useQuery({
    queryKey: ['portal', 'validate', token],
    queryFn: () => api.validateMagicLink(token),
    retry: 1,
    enabled: !!token,
  });
}

export function usePortalAppointmentsQuery(token: string) {
  return useQuery({
    queryKey: ['portal', 'appointments', token],
    queryFn: () => api.getPortalAppointments(token),
    retry: 1,
    enabled: !!token,
  });
}

export function usePortalServicesQuery(token: string) {
  return useQuery({
    queryKey: ['portal', 'services', token],
    queryFn: () => api.getPortalServices(token),
    retry: 1,
    enabled: !!token,
  });
}

export function usePortalAvailableSlotsQuery(token: string, fecha: string, servicioId?: number) {
  return useQuery({
    queryKey: ['portal', 'slots', token, fecha, servicioId],
    queryFn: () => api.getPortalAvailableSlots(token, fecha, servicioId),
    retry: 1,
    enabled: !!token && !!fecha,
  });
}

export function useBookAppointmentMutation(token: string) {
  return useMutation({
    mutationFn: (data: BookAppointmentPayload) => api.bookPortalAppointment(token, data),
  });
}

export function useGenerateLinkMutation() {
  return useMutation({
    mutationFn: (clienteId: number) => api.generateMagicLink(clienteId),
  });
}

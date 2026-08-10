import { useMutation, useQuery, useQueryClient, type UseQueryOptions } from '@tanstack/react-query';
import type { Invitation, InvitationEstado, InvitationFormData } from '../types';
import { invitationsApi } from './invitations.api';

export function useInvitationsQuery(
  estado?: InvitationEstado,
  options?: Omit<
    UseQueryOptions<Invitation[], Error, Invitation[], readonly unknown[]>,
    'queryKey' | 'queryFn'
  >,
): ReturnType<typeof useQuery<Invitation[], Error, Invitation[], readonly unknown[]>> {
  return useQuery({
    queryKey: ['invitations', estado],
    queryFn: () => invitationsApi.getInvitations(estado),
    retry: 1,
    ...options,
  });
}

export function useCreateInvitationMutation(
  onSuccess?: (data: { url: string }) => void,
): ReturnType<typeof useMutation<{ url: string }, unknown, InvitationFormData>> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: InvitationFormData) => invitationsApi.createInvitation(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
      onSuccess?.(data);
    },
  });
}

export function useResendInvitationMutation(
  onSuccess?: (data: { url: string; expiraEn: string }) => void,
): ReturnType<typeof useMutation<{ url: string; expiraEn: string }, unknown, number>> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => invitationsApi.resendInvitation(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
      onSuccess?.(data);
    },
  });
}

export function useCancelInvitationMutation(
  onSuccess?: (data: { id: number; estado: InvitationEstado }) => void,
): ReturnType<typeof useMutation<{ id: number; estado: InvitationEstado }, unknown, number>> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => invitationsApi.cancelInvitation(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
      onSuccess?.(data);
    },
  });
}

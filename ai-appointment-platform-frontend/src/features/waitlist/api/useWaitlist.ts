import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/api';

export function useWaitlistQuery() {
  return useQuery({
    queryKey: ['waitlist'],
    queryFn: api.getWaitlist,
    retry: 1,
  });
}

export function useAddToWaitlistMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.addToWaitlist,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['waitlist'] }),
  });
}

export function useRemoveFromWaitlistMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.removeFromWaitlist(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['waitlist'] }),
  });
}

export function useNotifyWaitlistMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.notifyWaitlist(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['waitlist'] }),
  });
}

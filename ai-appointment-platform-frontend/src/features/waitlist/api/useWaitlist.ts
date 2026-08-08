import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { waitlistApi } from './waitlist.api';

export function useWaitlistQuery() {
  return useQuery({
    queryKey: ['waitlist'],
    queryFn: waitlistApi.getWaitlist,
    retry: 1,
  });
}

export function useAddToWaitlistMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: waitlistApi.addToWaitlist,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['waitlist'] }),
  });
}

export function useRemoveFromWaitlistMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => waitlistApi.removeFromWaitlist(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['waitlist'] }),
  });
}

export function useNotifyWaitlistMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => waitlistApi.notifyWaitlist(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['waitlist'] }),
  });
}

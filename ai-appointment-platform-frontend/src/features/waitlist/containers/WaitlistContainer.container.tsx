import { useState, useCallback } from 'react';
import { ErrorBoundary } from '../../../shared/components/ErrorBoundary';
import {
  useWaitlistQuery,
  useAddToWaitlistMutation,
  useRemoveFromWaitlistMutation,
  useNotifyWaitlistMutation,
} from '../api/useWaitlist';
import { WaitlistView } from '../components/WaitlistView';
import type { AddToWaitlistPayload } from '../types';

export const WaitlistContainer = () => {
  const [isAdding, setIsAdding] = useState(false);
  const [pendingNotifyId, setPendingNotifyId] = useState<number | null>(null);
  const [pendingRemoveId, setPendingRemoveId] = useState<number | null>(null);

  const { data: entries = [], isLoading, isError } = useWaitlistQuery();
  const addMutation = useAddToWaitlistMutation();
  const removeMutation = useRemoveFromWaitlistMutation();
  const notifyMutation = useNotifyWaitlistMutation();

  const handleAdd = useCallback(
    async (data: AddToWaitlistPayload) => {
      await addMutation.mutateAsync(data);
      setIsAdding(false);
    },
    [addMutation],
  );

  const handleNotify = useCallback(
    async (id: number) => {
      setPendingNotifyId(id);
      try {
        await notifyMutation.mutateAsync(id);
      } finally {
        setPendingNotifyId(null);
      }
    },
    [notifyMutation],
  );

  const handleRemove = useCallback(
    async (id: number) => {
      setPendingRemoveId(id);
      try {
        await removeMutation.mutateAsync(id);
      } finally {
        setPendingRemoveId(null);
      }
    },
    [removeMutation],
  );

  return (
    <ErrorBoundary>
      <WaitlistView
        entries={entries}
        loading={isLoading}
        error={isError ? 'Error cargando la lista de espera' : null}
        isAdding={isAdding}
        onToggleForm={() => setIsAdding((v) => !v)}
        onAdd={handleAdd}
        onNotify={handleNotify}
        onRemove={handleRemove}
        pendingNotifyId={pendingNotifyId}
        pendingRemoveId={pendingRemoveId}
      />
    </ErrorBoundary>
  );
};

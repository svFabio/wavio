import { screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { renderWithProviders } from '../../../../test-utils';
import { WaitlistContainer } from '../WaitlistContainer.container';

vi.mock('../../api/useWaitlist', () => ({
  useWaitlistQuery: vi.fn(),
  useAddToWaitlistMutation: vi.fn(),
  useRemoveFromWaitlistMutation: vi.fn(),
  useNotifyWaitlistMutation: vi.fn(),
}));

import {
  useWaitlistQuery,
  useAddToWaitlistMutation,
  useRemoveFromWaitlistMutation,
  useNotifyWaitlistMutation,
} from '../../api/useWaitlist';

describe('WaitlistContainer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useWaitlistQuery).mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useWaitlistQuery>);
    vi.mocked(useAddToWaitlistMutation).mockReturnValue({
      mutateAsync: vi.fn(),
    } as unknown as ReturnType<typeof useAddToWaitlistMutation>);
    vi.mocked(useRemoveFromWaitlistMutation).mockReturnValue({
      mutateAsync: vi.fn(),
    } as unknown as ReturnType<typeof useRemoveFromWaitlistMutation>);
    vi.mocked(useNotifyWaitlistMutation).mockReturnValue({
      mutateAsync: vi.fn(),
    } as unknown as ReturnType<typeof useNotifyWaitlistMutation>);
  });

  it('renders waitlist view', () => {
    renderWithProviders(<WaitlistContainer />);
    expect(screen.getByText('Lista de Espera')).toBeInTheDocument();
  });
});

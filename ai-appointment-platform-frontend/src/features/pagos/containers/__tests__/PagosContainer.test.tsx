import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { renderWithProviders } from '../../../../test-utils';
import { PagosContainer } from '../PagosContainer.container';

vi.mock('../../api/usePendientesQuery', () => ({
  usePendientesQuery: vi.fn(),
}));

vi.mock('../../api/useValidarPagoMutation', () => ({
  useValidarPagoMutation: vi.fn(),
}));

import { usePendientesQuery } from '../../api/usePendientesQuery';
import { useValidarPagoMutation } from '../../api/useValidarPagoMutation';

describe('PagosContainer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(usePendientesQuery).mockReturnValue({
      data: [],
      isLoading: false,
    } as ReturnType<typeof usePendientesQuery>);
    vi.mocked(useValidarPagoMutation).mockReturnValue({
      mutateAsync: vi.fn(),
    } as unknown as ReturnType<typeof useValidarPagoMutation>);
  });

  it('renders pagos view', () => {
    renderWithProviders(<PagosContainer />);
    expect(screen.getByText('Validacion de Comprobantes')).toBeInTheDocument();
  });
});

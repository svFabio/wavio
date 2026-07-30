import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '../../../test-utils';
import { NegocioSelector } from '../NegocioSelector';

const negocios = [
  { id: 1, nombre: 'Negocio Uno', plan: 'PRO' as const },
  { id: 2, nombre: 'Negocio Dos', plan: 'FREE' as const },
];

describe('NegocioSelector', () => {
  it('returns null when negocios length is 0', () => {
    const { container } = renderWithProviders(<NegocioSelector />, {
      auth: { negocios: [] },
    });
    expect(container).toBeEmptyDOMElement();
  });

  it('returns null when negocios length is 1', () => {
    const { container } = renderWithProviders(<NegocioSelector />, {
      auth: { negocios: [negocios[0]] },
    });
    expect(container).toBeEmptyDOMElement();
  });

  it('renders active business name', () => {
    renderWithProviders(<NegocioSelector />, {
      auth: { negocios, activeNegocioId: 1 },
    });
    expect(screen.getByText('Negocio Uno')).toBeInTheDocument();
  });

  it('renders active business plan', () => {
    renderWithProviders(<NegocioSelector />, {
      auth: { negocios, activeNegocioId: 1 },
    });
    expect(screen.getByText('Plan PRO')).toBeInTheDocument();
  });

  it('opens dropdown on click', () => {
    renderWithProviders(<NegocioSelector />, {
      auth: { negocios, activeNegocioId: 1 },
    });
    fireEvent.click(screen.getByText('Negocio Uno'));
    expect(screen.getByText('Negocio Dos')).toBeInTheDocument();
  });

  it('calls switchNegocio when a different business is selected', () => {
    const switchNegocio = vi.fn();
    renderWithProviders(<NegocioSelector />, {
      auth: { negocios, activeNegocioId: 1, switchNegocio },
    });
    fireEvent.click(screen.getByText('Negocio Uno'));
    fireEvent.click(screen.getByText('Negocio Dos'));
    expect(switchNegocio).toHaveBeenCalledWith(2);
  });

  it('closes dropdown after selecting a business', () => {
    const switchNegocio = vi.fn();
    renderWithProviders(<NegocioSelector />, {
      auth: { negocios, activeNegocioId: 1, switchNegocio },
    });
    fireEvent.click(screen.getByText('Negocio Uno'));
    expect(screen.getByText('Negocio Dos')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Negocio Dos'));
    expect(screen.queryByText('Negocio Dos')).not.toBeInTheDocument();
  });

  it('highlights the active business in dropdown', () => {
    renderWithProviders(<NegocioSelector />, {
      auth: { negocios, activeNegocioId: 1 },
    });
    fireEvent.click(screen.getByText('Negocio Uno'));
    const dropdownItems = screen.getAllByText('Negocio Uno');
    expect(dropdownItems).toHaveLength(2);
    const dropdownBtn = dropdownItems[1].closest('button');
    expect(dropdownBtn?.className).toContain('bg-primary/10');
  });

  it('closes dropdown when clicking outside', () => {
    renderWithProviders(<NegocioSelector />, {
      auth: { negocios, activeNegocioId: 1 },
    });
    fireEvent.click(screen.getByText('Negocio Uno'));
    expect(screen.queryByText('Negocio Dos')).toBeInTheDocument();
    fireEvent.mouseDown(document.body);
    expect(screen.queryByText('Negocio Dos')).not.toBeInTheDocument();
  });
});

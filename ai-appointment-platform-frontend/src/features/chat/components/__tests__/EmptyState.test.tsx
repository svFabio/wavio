import { render, screen } from '@testing-library/react';
import { EmptyState } from '../EmptyState';

describe('EmptyState', () => {
  it('renders the empty state message', () => {
    render(<EmptyState />);
    expect(screen.getByText('Selecciona una conversación')).toBeInTheDocument();
    expect(screen.getByText('Los mensajes de WhatsApp aparecerán aquí')).toBeInTheDocument();
  });
});

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { HeaderCard } from '../HeaderCard';

describe('HeaderCard', () => {
  it('renders title and save button', () => {
    render(<HeaderCard isPending={false} isSuccess={false} onSave={vi.fn()} />);
    expect(screen.getByText('Configuracion del Bot')).toBeInTheDocument();
    expect(screen.getByText('Guardar')).toBeInTheDocument();
  });

  it('shows loading spinner when isPending', () => {
    render(<HeaderCard isPending={true} isSuccess={false} onSave={vi.fn()} />);
    expect(screen.getByText('Guardando...')).toBeInTheDocument();
  });

  it('shows success state when isSuccess', () => {
    render(<HeaderCard isPending={false} isSuccess={true} onSave={vi.fn()} />);
    expect(screen.getByText('Guardado')).toBeInTheDocument();
  });

  it('calls onSave when button is clicked', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<HeaderCard isPending={false} isSuccess={false} onSave={onSave} />);
    await user.click(screen.getByText('Guardar'));
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it('disables button when isPending', () => {
    render(<HeaderCard isPending={true} isSuccess={false} onSave={vi.fn()} />);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});

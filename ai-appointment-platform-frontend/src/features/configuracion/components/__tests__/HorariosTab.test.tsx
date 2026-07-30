import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { HorariosTab } from '../HorariosTab';
import type { HorarioNegocio } from '../../types';

describe('HorariosTab', () => {
  it('shows loading state', () => {
    const { container } = render(<HorariosTab horarios={[]} onSave={vi.fn()} isLoading={true} />);
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('renders DayRow for each day', () => {
    render(<HorariosTab horarios={[]} onSave={vi.fn()} isLoading={false} />);
    expect(screen.getByText('Domingo')).toBeInTheDocument();
    expect(screen.getByText('Lunes')).toBeInTheDocument();
    expect(screen.getByText('Martes')).toBeInTheDocument();
    expect(screen.getByText('Miercoles')).toBeInTheDocument();
    expect(screen.getByText('Jueves')).toBeInTheDocument();
    expect(screen.getByText('Viernes')).toBeInTheDocument();
    expect(screen.getByText('Sabado')).toBeInTheDocument();
  });

  it('renders save button', () => {
    render(<HorariosTab horarios={[]} onSave={vi.fn()} isLoading={false} />);
    expect(screen.getByText('Guardar Horarios')).toBeInTheDocument();
  });

  it('calls onSave with payload when save button is clicked', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    const horarios: HorarioNegocio[] = [
      { id: 1, diaSemana: 1, horaInicio: '09:00', horaFin: '13:00', activo: true },
    ];
    render(<HorariosTab horarios={horarios} onSave={onSave} isLoading={false} />);
    await user.click(screen.getByText('Guardar Horarios'));
    expect(onSave).toHaveBeenCalledOnce();
    const payload = onSave.mock.calls[0][0] as Array<{
      diaSemana: number;
      horaInicio: string;
      horaFin: string;
    }>;
    expect(payload).toEqual(expect.arrayContaining([expect.objectContaining({ diaSemana: 1 })]));
  });

  it('shows saving state when isSaving is true', () => {
    render(<HorariosTab horarios={[]} onSave={vi.fn()} isLoading={false} isSaving={true} />);
    expect(screen.getByText('Guardar Horarios')).toBeInTheDocument();
  });

  it('disables save button when isSaving', () => {
    render(<HorariosTab horarios={[]} onSave={vi.fn()} isLoading={false} isSaving={true} />);
    expect(screen.getByText('Guardar Horarios')).toBeDisabled();
  });
});

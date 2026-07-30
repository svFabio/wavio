import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { HorariosEspecialesTab } from '../HorariosEspecialesTab';
import type { HorarioEspecial } from '../../types';

describe('HorariosEspecialesTab', () => {
  it('shows loading state', () => {
    const { container } = render(
      <HorariosEspecialesTab
        horariosEspeciales={[]}
        onCreate={vi.fn()}
        onDelete={vi.fn()}
        isLoading={true}
      />,
    );
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('shows empty state when no horarios', () => {
    render(
      <HorariosEspecialesTab
        horariosEspeciales={[]}
        onCreate={vi.fn()}
        onDelete={vi.fn()}
        isLoading={false}
      />,
    );
    expect(screen.getByText('No hay fechas especiales configuradas')).toBeInTheDocument();
  });

  it('shows add form', () => {
    render(
      <HorariosEspecialesTab
        horariosEspeciales={[]}
        onCreate={vi.fn()}
        onDelete={vi.fn()}
        isLoading={false}
      />,
    );
    expect(screen.getByText('Agregar fecha especial')).toBeInTheDocument();
    expect(screen.getByText('Agregar')).toBeInTheDocument();
  });

  it('calls onCreate with cerrado=true by default', async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn();
    const { container } = render(
      <HorariosEspecialesTab
        horariosEspeciales={[]}
        onCreate={onCreate}
        onDelete={vi.fn()}
        isLoading={false}
      />,
    );
    const dateInput = container.querySelector('input[type="date"]')!;
    await user.clear(dateInput);
    await user.type(dateInput, '2026-12-25');
    await user.click(screen.getByText('Agregar'));
    expect(onCreate).toHaveBeenCalledWith({
      fecha: '2026-12-25',
      cerrado: true,
      horaInicio: null,
      horaFin: null,
    });
  });

  it('toggles cerrado and shows time inputs', async () => {
    const user = userEvent.setup();
    render(
      <HorariosEspecialesTab
        horariosEspeciales={[]}
        onCreate={vi.fn()}
        onDelete={vi.fn()}
        isLoading={false}
      />,
    );
    const checkbox = screen.getByLabelText('Cerrado todo el día');
    await user.click(checkbox);
    expect(screen.getAllByDisplayValue('09:00')).toHaveLength(1);
    expect(screen.getAllByDisplayValue('18:00')).toHaveLength(1);
  });

  it('calls onCreate with custom time when not cerrado', async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn();
    const { container } = render(
      <HorariosEspecialesTab
        horariosEspeciales={[]}
        onCreate={onCreate}
        onDelete={vi.fn()}
        isLoading={false}
      />,
    );
    const dateInput = container.querySelector('input[type="date"]')!;
    await user.clear(dateInput);
    await user.type(dateInput, '2026-12-25');
    const cerradoCheckbox = screen.getByLabelText('Cerrado todo el día');
    await user.click(cerradoCheckbox);
    await user.click(screen.getByText('Agregar'));
    expect(onCreate).toHaveBeenCalledWith({
      fecha: '2026-12-25',
      cerrado: false,
      horaInicio: '09:00',
      horaFin: '18:00',
    });
  });

  it('renders existing horarios especiales', () => {
    const horarios: HorarioEspecial[] = [
      { id: 1, fecha: '2026-12-25', cerrado: true, horaInicio: null, horaFin: null },
      {
        id: 2,
        fecha: '2026-12-31',
        cerrado: false,
        horaInicio: '09:00',
        horaFin: '13:00',
      },
    ];
    render(
      <HorariosEspecialesTab
        horariosEspeciales={horarios}
        onCreate={vi.fn()}
        onDelete={vi.fn()}
        isLoading={false}
      />,
    );
    expect(screen.getByText('Cerrado')).toBeInTheDocument();
  });

  it('calls onDelete when delete button is clicked', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    const horarios: HorarioEspecial[] = [
      { id: 1, fecha: '2026-12-25', cerrado: true, horaInicio: null, horaFin: null },
    ];
    render(
      <HorariosEspecialesTab
        horariosEspeciales={horarios}
        onCreate={vi.fn()}
        onDelete={onDelete}
        isLoading={false}
      />,
    );
    const deleteBtn = screen.getByTitle('Eliminar');
    await user.click(deleteBtn);
    expect(onDelete).toHaveBeenCalledWith(1);
  });
});

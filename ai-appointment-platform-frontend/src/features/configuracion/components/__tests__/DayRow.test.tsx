import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { DayRow } from '../DayRow';

const dia = { value: 1, label: 'Lunes' };
const rangos = [{ activo: true, horaInicio: '09:00', horaFin: '13:00' }];

describe('DayRow', () => {
  it('renders dia label and time inputs', () => {
    render(
      <DayRow
        dia={dia}
        rangos={rangos}
        diaActivo={true}
        handleToggle={vi.fn()}
        handleChange={vi.fn()}
        handleRemoveRange={vi.fn()}
        handleAddRange={vi.fn()}
      />,
    );
    expect(screen.getByText('Lunes')).toBeInTheDocument();
    expect(screen.getByDisplayValue('09:00')).toBeInTheDocument();
    expect(screen.getByDisplayValue('13:00')).toBeInTheDocument();
  });

  it('shows muted text when inactive', () => {
    render(
      <DayRow
        dia={dia}
        rangos={[{ activo: false, horaInicio: '09:00', horaFin: '13:00' }]}
        diaActivo={false}
        handleToggle={vi.fn()}
        handleChange={vi.fn()}
        handleRemoveRange={vi.fn()}
        handleAddRange={vi.fn()}
      />,
    );
    const label = screen.getByText('Lunes');
    expect(label.className).toContain('text-txt-muted');
  });

  it('calls handleToggle when checkbox is clicked', async () => {
    const user = userEvent.setup();
    const handleToggle = vi.fn();
    render(
      <DayRow
        dia={dia}
        rangos={rangos}
        diaActivo={true}
        handleToggle={handleToggle}
        handleChange={vi.fn()}
        handleRemoveRange={vi.fn()}
        handleAddRange={vi.fn()}
      />,
    );
    const checkbox = screen.getByRole('checkbox');
    await user.click(checkbox);
    expect(handleToggle).toHaveBeenCalledWith(1);
  });

  it('calls handleChange when time input changes', async () => {
    const handleChange = vi.fn();
    render(
      <DayRow
        dia={dia}
        rangos={rangos}
        diaActivo={true}
        handleToggle={vi.fn()}
        handleChange={handleChange}
        handleRemoveRange={vi.fn()}
        handleAddRange={vi.fn()}
      />,
    );
    const inputs = screen.getAllByDisplayValue('09:00');
    fireEvent.change(inputs[0], { target: { value: '08:00' } });
    expect(handleChange).toHaveBeenCalledWith(1, 0, 'horaInicio', '08:00');
  });

  it('calls handleAddRange when add range button is clicked', async () => {
    const user = userEvent.setup();
    const handleAddRange = vi.fn();
    render(
      <DayRow
        dia={dia}
        rangos={rangos}
        diaActivo={true}
        handleToggle={vi.fn()}
        handleChange={vi.fn()}
        handleRemoveRange={vi.fn()}
        handleAddRange={handleAddRange}
      />,
    );
    await user.click(screen.getByText('Agregar rango'));
    expect(handleAddRange).toHaveBeenCalledWith(1);
  });

  it('shows remove button only when multiple ranges exist', () => {
    const multiRangos = [
      { activo: true, horaInicio: '09:00', horaFin: '13:00' },
      { activo: true, horaInicio: '14:00', horaFin: '18:00' },
    ];
    render(
      <DayRow
        dia={dia}
        rangos={multiRangos}
        diaActivo={true}
        handleToggle={vi.fn()}
        handleChange={vi.fn()}
        handleRemoveRange={vi.fn()}
        handleAddRange={vi.fn()}
      />,
    );
    const removeBtns = screen.getAllByTitle('Eliminar rango');
    expect(removeBtns).toHaveLength(2);
  });

  it('does not show remove button on single range', () => {
    render(
      <DayRow
        dia={dia}
        rangos={rangos}
        diaActivo={true}
        handleToggle={vi.fn()}
        handleChange={vi.fn()}
        handleRemoveRange={vi.fn()}
        handleAddRange={vi.fn()}
      />,
    );
    expect(screen.queryByTitle('Eliminar rango')).not.toBeInTheDocument();
  });

  it('calls handleRemoveRange when remove button is clicked', async () => {
    const user = userEvent.setup();
    const handleRemoveRange = vi.fn();
    const multiRangos = [
      { activo: true, horaInicio: '09:00', horaFin: '13:00' },
      { activo: true, horaInicio: '14:00', horaFin: '18:00' },
    ];
    render(
      <DayRow
        dia={dia}
        rangos={multiRangos}
        diaActivo={true}
        handleToggle={vi.fn()}
        handleChange={vi.fn()}
        handleRemoveRange={handleRemoveRange}
        handleAddRange={vi.fn()}
      />,
    );
    const removeBtns = screen.getAllByTitle('Eliminar rango');
    await user.click(removeBtns[0]);
    expect(handleRemoveRange).toHaveBeenCalledWith(1, 0);
  });
});

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HorariosGrid } from '../HorariosGrid';

const HORARIOS = ['09:00', '10:00', '11:00', '14:00'];

describe('HorariosGrid', () => {
  it('shows loading spinner when loading is true', () => {
    render(<HorariosGrid horarios={[]} selected="" onSelect={vi.fn()} loading={true} />);
    expect(screen.getByText('Cargando horarios...')).toBeInTheDocument();
  });

  it('shows empty message when no horarios and not loading', () => {
    render(<HorariosGrid horarios={[]} selected="" onSelect={vi.fn()} loading={false} />);
    expect(screen.getByText('No hay horarios disponibles hoy')).toBeInTheDocument();
  });

  it('renders all horarios as buttons', () => {
    render(<HorariosGrid horarios={HORARIOS} selected="" onSelect={vi.fn()} loading={false} />);
    HORARIOS.forEach((h) => {
      expect(screen.getByRole('button', { name: h })).toBeInTheDocument();
    });
  });

  it('calls onSelect with the correct horario when a button is clicked', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<HorariosGrid horarios={HORARIOS} selected="" onSelect={onSelect} loading={false} />);
    await user.click(screen.getByRole('button', { name: '10:00' }));
    expect(onSelect).toHaveBeenCalledWith('10:00');
  });

  it('visually distinguishes the selected horario', () => {
    render(
      <HorariosGrid horarios={HORARIOS} selected="11:00" onSelect={vi.fn()} loading={false} />,
    );
    const selectedBtn = screen.getByRole('button', { name: '11:00' });
    expect(selectedBtn.className).toContain('bg-primary');
  });
});

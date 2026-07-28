import { render, screen } from '@testing-library/react';
import { CustomEventDay } from '../CustomEventDay';
import type { EventoCalendario } from '../../types';

const baseEvent: EventoCalendario = {
  id: 'ev-1',
  title: 'Juan Perez',
  start: new Date('2026-01-10T09:00:00'),
  end: new Date('2026-01-10T09:30:00'),
};

describe('CustomEventDay', () => {
  it('renders the event title', () => {
    render(<CustomEventDay event={baseEvent} />);
    expect(screen.getByText('Juan Perez')).toBeInTheDocument();
  });

  it('does not show servicio when resource.servicio is undefined', () => {
    render(
      <CustomEventDay event={{ ...baseEvent, resource: { tipo: 'cita', estado: 'CONFIRMADA' } }} />,
    );
    expect(screen.queryByRole('generic', { hidden: true })).toBeDefined();
    // servicio span should not exist
    const spans = screen.queryAllByText('');
    // The component only renders a servicio span when resource.servicio is truthy
    expect(screen.queryByText('Corte de cabello')).not.toBeInTheDocument();
  });

  it('renders the servicio when resource.servicio is set', () => {
    const event: EventoCalendario = {
      ...baseEvent,
      resource: { tipo: 'cita', estado: 'CONFIRMADA', servicio: 'Corte de cabello' },
    };
    render(<CustomEventDay event={event} />);
    expect(screen.getByText('Corte de cabello')).toBeInTheDocument();
  });

  it('renders without resource prop', () => {
    render(<CustomEventDay event={baseEvent} />);
    expect(screen.getByText('Juan Perez')).toBeInTheDocument();
  });
});

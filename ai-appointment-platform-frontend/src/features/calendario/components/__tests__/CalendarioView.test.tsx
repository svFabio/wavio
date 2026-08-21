import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Views } from 'react-big-calendar';
import type { View } from 'react-big-calendar';
import { CalendarioView } from '../CalendarioView';
import type { EventoCalendario } from '../../types';

const mockEvent: EventoCalendario = {
  id: '1',
  title: 'Juan Pérez',
  start: new Date('2026-01-10T10:00:00'),
  end: new Date('2026-01-10T11:00:00'),
  resource: { tipo: 'cita', estado: 'CONFIRMADA', citaId: '1' },
};

const defaultProps = {
  eventos: [mockEvent],
  vista: Views.MONTH as View,
  fecha: new Date('2026-01-10'),
  scrollToTime: new Date('2026-01-10T08:00:00'),
  eventStyleGetter: vi.fn(() => ({ style: {} })),
  onNavigateFecha: vi.fn(),
  onNavigateVista: vi.fn(),
  onSelectSlot: vi.fn(),
  onSelectEvent: vi.fn(),
  onNuevaCita: vi.fn(),
};

vi.mock('react-big-calendar', () => ({
  Calendar: vi.fn(function ({ events }: any) {
    return (
      <div data-testid="rbc-calendar" data-events-count={events.length}>
        RBC Calendar
      </div>
    );
  }),
  Views: { MONTH: 'month', WEEK: 'week', DAY: 'day' },
  dateFnsLocalizer: vi.fn(() => ({})),
}));

describe('CalendarioView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the calendar', () => {
    render(<CalendarioView {...defaultProps} />);
    expect(screen.getByTestId('rbc-calendar')).toBeInTheDocument();
  });

  it('passes eventos to calendar', () => {
    render(<CalendarioView {...defaultProps} eventos={[mockEvent]} />);
    const calendar = screen.getByTestId('rbc-calendar');
    expect(calendar.getAttribute('data-events-count')).toBe('1');
  });
});

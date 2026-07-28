import { render, screen } from '@testing-library/react';
import { CustomEventMonth } from '../CustomEventMonth';
import type { EventoCalendario } from '../../types';

const baseEvent: EventoCalendario = {
  id: 'ev-2',
  title: 'Maria Garcia',
  start: new Date('2026-01-10T10:00:00'),
  end: new Date('2026-01-10T10:30:00'),
};

describe('CustomEventMonth', () => {
  it('renders the event title for desktop view', () => {
    render(<CustomEventMonth event={baseEvent} />);
    expect(screen.getByText('Maria Garcia')).toBeInTheDocument();
  });

  it('renders 1 dot when count is absent (default 1)', () => {
    render(<CustomEventMonth event={baseEvent} />);
    // The mobile dots container renders min(count,5) dots
    const dots = document.querySelectorAll('.w-\\[5px\\]');
    expect(dots.length).toBe(1);
  });

  it('renders up to 5 dots when count is 5', () => {
    const event: EventoCalendario = {
      ...baseEvent,
      resource: { tipo: 'resumen', estado: '', count: 5 },
    };
    render(<CustomEventMonth event={event} />);
    const dots = document.querySelectorAll('.w-\\[5px\\]');
    expect(dots.length).toBe(5);
  });

  it('renders exactly 5 dots and a "+" when count exceeds 5', () => {
    const event: EventoCalendario = {
      ...baseEvent,
      resource: { tipo: 'resumen', estado: '', count: 8 },
    };
    render(<CustomEventMonth event={event} />);
    const dots = document.querySelectorAll('.w-\\[5px\\]');
    expect(dots.length).toBe(5);
    expect(screen.getByText('+')).toBeInTheDocument();
  });

  it('does not show "+" when count is exactly 5', () => {
    const event: EventoCalendario = {
      ...baseEvent,
      resource: { tipo: 'resumen', estado: '', count: 5 },
    };
    render(<CustomEventMonth event={event} />);
    expect(screen.queryByText('+')).not.toBeInTheDocument();
  });
});

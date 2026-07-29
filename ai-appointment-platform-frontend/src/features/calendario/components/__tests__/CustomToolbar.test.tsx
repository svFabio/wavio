import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { CustomToolbar } from '../CustomToolbar';

const defaultProps = {
  onNavigate: vi.fn(),
  onView: vi.fn(),
  view: 'month' as const,
  label: 'Enero 2026',
  onNuevaCita: vi.fn(),
};

describe('CustomToolbar', () => {
  it('renders navigation buttons and label', () => {
    render(<CustomToolbar {...defaultProps} />);
    expect(screen.getByText('Hoy')).toBeInTheDocument();
    expect(screen.getByText('Enero 2026')).toBeInTheDocument();
    expect(screen.getByLabelText('Anterior')).toBeInTheDocument();
    expect(screen.getByLabelText('Siguiente')).toBeInTheDocument();
  });

  it('renders view toggle buttons', () => {
    render(<CustomToolbar {...defaultProps} />);
    const monthBtn = screen.getByLabelText('Vista de mes');
    const dayBtn = screen.getByLabelText('Vista de dia');
    expect(monthBtn).toBeInTheDocument();
    expect(dayBtn).toBeInTheDocument();
  });

  it('renders Nueva Cita button', () => {
    render(<CustomToolbar {...defaultProps} />);
    expect(screen.getByText('Nueva Cita')).toBeInTheDocument();
  });

  it('calls onNavigate with PREV when left chevron is clicked', async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    render(<CustomToolbar {...defaultProps} onNavigate={onNavigate} />);
    await user.click(screen.getByLabelText('Anterior'));
    expect(onNavigate).toHaveBeenCalledWith('PREV');
  });

  it('calls onNavigate with NEXT when right chevron is clicked', async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    render(<CustomToolbar {...defaultProps} onNavigate={onNavigate} />);
    await user.click(screen.getByLabelText('Siguiente'));
    expect(onNavigate).toHaveBeenCalledWith('NEXT');
  });

  it('calls onNavigate with TODAY when Hoy is clicked', async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    render(<CustomToolbar {...defaultProps} onNavigate={onNavigate} />);
    await user.click(screen.getByText('Hoy'));
    expect(onNavigate).toHaveBeenCalledWith('TODAY');
  });

  it('calls onView with month when month button is clicked', async () => {
    const user = userEvent.setup();
    const onView = vi.fn();
    render(<CustomToolbar {...defaultProps} onView={onView} />);
    await user.click(screen.getByLabelText('Vista de mes'));
    expect(onView).toHaveBeenCalledWith('month');
  });

  it('calls onView with day when day button is clicked', async () => {
    const user = userEvent.setup();
    const onView = vi.fn();
    render(<CustomToolbar {...defaultProps} onView={onView} />);
    await user.click(screen.getByLabelText('Vista de dia'));
    expect(onView).toHaveBeenCalledWith('day');
  });

  it('calls onNuevaCita when the button is clicked', async () => {
    const user = userEvent.setup();
    const onNuevaCita = vi.fn();
    render(<CustomToolbar {...defaultProps} onNuevaCita={onNuevaCita} />);
    await user.click(screen.getByText('Nueva Cita'));
    expect(onNuevaCita).toHaveBeenCalled();
  });

  it('marks the active view button with aria-pressed', () => {
    render(<CustomToolbar {...defaultProps} view="day" />);
    const dayBtn = screen.getByLabelText('Vista de dia');
    const monthBtn = screen.getByLabelText('Vista de mes');
    expect(dayBtn).toHaveAttribute('aria-pressed', 'true');
    expect(monthBtn).toHaveAttribute('aria-pressed', 'false');
  });
});

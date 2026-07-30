import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { ServiceCard } from '../ServiceCard';
import type { Servicio } from '../../types';

const mockServicio: Servicio = {
  id: 1,
  nombre: 'Masaje Relajante',
  categoria: 'Masajes',
  duracionMinutos: 60,
  bufferMinutos: 10,
  precio: 150,
  activo: true,
};

const formatDuration = (minutos: number) => {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  if (h > 0 && m > 0) return `${h} h ${m} min`;
  if (h > 0) return `${h} h`;
  return `${m} min`;
};

describe('ServiceCard', () => {
  it('renders nombre, duracion, precio', () => {
    render(
      <ServiceCard
        svc={mockServicio}
        formatDuration={formatDuration}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
        isLoading={false}
      />,
    );
    expect(screen.getByText('Masaje Relajante')).toBeInTheDocument();
    expect(screen.getByText('1 h')).toBeInTheDocument();
    expect(screen.getByText('150')).toBeInTheDocument();
    expect(screen.getByText('Buffer: 10 min')).toBeInTheDocument();
  });

  it('shows categoria badge when present', () => {
    render(
      <ServiceCard
        svc={mockServicio}
        formatDuration={formatDuration}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
        isLoading={false}
      />,
    );
    expect(screen.getByText('Masajes')).toBeInTheDocument();
  });

  it('does not show categoria badge when absent', () => {
    render(
      <ServiceCard
        svc={{ ...mockServicio, categoria: undefined }}
        formatDuration={formatDuration}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
        isLoading={false}
      />,
    );
    expect(screen.queryByText('Masajes')).not.toBeInTheDocument();
  });

  it('calls onUpdate when toggle is clicked', async () => {
    const user = userEvent.setup();
    const onUpdate = vi.fn();
    render(
      <ServiceCard
        svc={mockServicio}
        formatDuration={formatDuration}
        onUpdate={onUpdate}
        onDelete={vi.fn()}
        isLoading={false}
      />,
    );
    const checkbox = screen.getByRole('checkbox');
    await user.click(checkbox);
    expect(onUpdate).toHaveBeenCalledWith(1, { activo: false });
  });

  it('calls onDelete when delete button is clicked', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    render(
      <ServiceCard
        svc={mockServicio}
        formatDuration={formatDuration}
        onUpdate={vi.fn()}
        onDelete={onDelete}
        isLoading={false}
      />,
    );
    const buttons = screen.getAllByRole('button');
    const deleteBtn = buttons[buttons.length - 1];
    await user.click(deleteBtn);
    expect(onDelete).toHaveBeenCalledWith(1);
  });

  it('disables inputs when isLoading', () => {
    render(
      <ServiceCard
        svc={mockServicio}
        formatDuration={formatDuration}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
        isLoading={true}
      />,
    );
    expect(screen.getByRole('checkbox')).toBeDisabled();
  });
});

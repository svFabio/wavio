import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { ServiciosTab } from '../ServiciosTab';
import type { Servicio } from '../../types';

const servicios: Servicio[] = [
  {
    id: 1,
    nombre: 'Masaje',
    categoria: 'Masajes',
    duracionMinutos: 60,
    bufferMinutos: 10,
    precio: 150,
    activo: true,
  },
  {
    id: 2,
    nombre: 'Corte',
    categoria: undefined,
    duracionMinutos: 30,
    bufferMinutos: 5,
    precio: 50,
    activo: true,
  },
];

describe('ServiciosTab', () => {
  it('shows empty state when no servicios', () => {
    render(
      <ServiciosTab
        servicios={[]}
        onAdd={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
        isLoading={false}
      />,
    );
    expect(screen.getByText('No hay servicios configurados.')).toBeInTheDocument();
  });

  it('renders servicios grouped by category', () => {
    render(
      <ServiciosTab
        servicios={servicios}
        onAdd={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
        isLoading={false}
      />,
    );
    expect(screen.getAllByText('Masajes')).toHaveLength(2);
    expect(screen.getByText('Sin categoría')).toBeInTheDocument();
    expect(screen.getByText('Masaje')).toBeInTheDocument();
    expect(screen.getByText('Corte')).toBeInTheDocument();
  });

  it('shows add form when Nuevo Servicio is clicked', async () => {
    const user = userEvent.setup();
    render(
      <ServiciosTab
        servicios={servicios}
        onAdd={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
        isLoading={false}
      />,
    );
    await user.click(screen.getByText('Nuevo Servicio'));
    expect(screen.getByText('Agregar nuevo servicio')).toBeInTheDocument();
    expect(screen.getByText('Guardar Servicio')).toBeInTheDocument();
  });

  it('calls onAdd when form is submitted', async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn();
    render(
      <ServiciosTab
        servicios={servicios}
        onAdd={onAdd}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
        isLoading={false}
      />,
    );
    await user.click(screen.getByText('Nuevo Servicio'));
    const nombreInput = screen.getByPlaceholderText('Ej. Masaje Relajante');
    await user.type(nombreInput, 'Test Service');
    await user.click(screen.getByText('Guardar Servicio'));
    expect(onAdd).toHaveBeenCalledOnce();
  });

  it('shows loading spinner when isLoading and no servicios', () => {
    const { container } = render(
      <ServiciosTab
        servicios={[]}
        onAdd={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
        isLoading={true}
      />,
    );
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('hides empty state when isAdding', async () => {
    const user = userEvent.setup();
    render(
      <ServiciosTab
        servicios={[]}
        onAdd={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
        isLoading={false}
      />,
    );
    await user.click(screen.getByText('Nuevo Servicio'));
    expect(screen.queryByText('No hay servicios configurados.')).not.toBeInTheDocument();
  });
});

import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { PortalView } from '../PortalView';
import type { PortalCliente, PortalNegocio, PortalCita, PortalServicio } from '../../types';

const cliente: PortalCliente = {
  id: 1,
  nombre: 'Juan Perez',
  telefono: '59170000000',
  email: null,
};
const negocio: PortalNegocio = { id: 1, nombre: 'Mi Spa' };
const citas: PortalCita[] = [];
const servicios: PortalServicio[] = [];
const slots: string[] = [];

describe('PortalView', () => {
  it('renders welcome message', () => {
    render(
      <PortalView
        cliente={cliente}
        negocio={negocio}
        citas={citas}
        servicios={servicios}
        slots={slots}
        loadingSlots={false}
        selectedDate=""
        onDateChange={vi.fn()}
        selectedServicioId={undefined}
        onServicioChange={vi.fn()}
        onBook={vi.fn()}
        booking={false}
        bookingResult={null}
        bookingError={null}
      />,
    );
    expect(screen.getByText('Mi Spa')).toBeInTheDocument();
    expect(screen.getByText(/Hola Juan Perez/)).toBeInTheDocument();
  });

  it('renders empty appointments message', () => {
    render(
      <PortalView
        cliente={cliente}
        negocio={negocio}
        citas={[]}
        servicios={servicios}
        slots={slots}
        loadingSlots={false}
        selectedDate=""
        onDateChange={vi.fn()}
        selectedServicioId={undefined}
        onServicioChange={vi.fn()}
        onBook={vi.fn()}
        booking={false}
        bookingResult={null}
        bookingError={null}
      />,
    );
    expect(screen.getByText('No tienes citas registradas.')).toBeInTheDocument();
  });

  it('rendes booking result', () => {
    render(
      <PortalView
        cliente={cliente}
        negocio={negocio}
        citas={citas}
        servicios={servicios}
        slots={slots}
        loadingSlots={false}
        selectedDate=""
        onDateChange={vi.fn()}
        selectedServicioId={undefined}
        onServicioChange={vi.fn()}
        onBook={vi.fn()}
        booking={false}
        bookingResult={{ success: true, message: 'Cita agendada con éxito' }}
        bookingError={null}
      />,
    );
    expect(screen.getByText('Cita agendada con éxito')).toBeInTheDocument();
  });

  it('renders booking error', () => {
    render(
      <PortalView
        cliente={cliente}
        negocio={negocio}
        citas={citas}
        servicios={servicios}
        slots={slots}
        loadingSlots={false}
        selectedDate=""
        onDateChange={vi.fn()}
        selectedServicioId={undefined}
        onServicioChange={vi.fn()}
        onBook={vi.fn()}
        booking={false}
        bookingResult={null}
        bookingError="Error al agendar"
      />,
    );
    expect(screen.getByText('Error al agendar')).toBeInTheDocument();
  });

  it('shows loading slots indicator', () => {
    render(
      <PortalView
        cliente={cliente}
        negocio={negocio}
        citas={citas}
        servicios={servicios}
        slots={slots}
        loadingSlots={true}
        selectedDate="2026-02-01"
        onDateChange={vi.fn()}
        selectedServicioId={undefined}
        onServicioChange={vi.fn()}
        onBook={vi.fn()}
        booking={false}
        bookingResult={null}
        bookingError={null}
      />,
    );
    expect(screen.getByText('Cargando horarios...')).toBeInTheDocument();
  });

  it('shows no slots message', () => {
    render(
      <PortalView
        cliente={cliente}
        negocio={negocio}
        citas={citas}
        servicios={servicios}
        slots={[]}
        loadingSlots={false}
        selectedDate="2026-02-01"
        onDateChange={vi.fn()}
        selectedServicioId={undefined}
        onServicioChange={vi.fn()}
        onBook={vi.fn()}
        booking={false}
        bookingResult={null}
        bookingError={null}
      />,
    );
    expect(screen.getByText('No hay horarios disponibles para esta fecha.')).toBeInTheDocument();
  });
});

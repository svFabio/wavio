import { render, screen } from '@testing-library/react';
import { ResumenPrecio } from '../ResumenPrecio';
import type { Servicio } from '../../../../types';
import type { Configuracion } from '../../../configuracion/types/domain';

const servicios: Servicio[] = [
  {
    id: 1,
    nombre: 'Corte de cabello',
    duracionMinutos: 30,
    bufferMinutos: 5,
    precio: 100,
    activo: true,
  },
];

describe('ResumenPrecio', () => {
  it('renders nothing when servicioId is null', () => {
    const { container } = render(
      <ResumenPrecio servicioId={null} servicios={servicios} config={null} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when servicioId is undefined', () => {
    const { container } = render(
      <ResumenPrecio servicioId={undefined} servicios={servicios} config={null} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when servicioId does not match any servicio', () => {
    const { container } = render(
      <ResumenPrecio servicioId={99} servicios={servicios} config={null} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('shows service price when servicioId matches', () => {
    render(<ResumenPrecio servicioId={1} servicios={servicios} config={null} />);
    expect(screen.getByText('Precio del servicio:')).toBeInTheDocument();
    expect(screen.getByText('$100')).toBeInTheDocument();
  });

  it('does not show adelanto section when cobrarAdelanto is false', () => {
    const config: Configuracion = { cobrarAdelanto: false, porcentajeAdelanto: 30 };
    render(<ResumenPrecio servicioId={1} servicios={servicios} config={config} />);
    expect(screen.queryByText(/Adelanto requerido/)).not.toBeInTheDocument();
  });

  it('shows adelanto section when cobrarAdelanto is true', () => {
    const config: Configuracion = { cobrarAdelanto: true, porcentajeAdelanto: 50 };
    render(<ResumenPrecio servicioId={1} servicios={servicios} config={config} />);
    expect(screen.getByText(/Adelanto requerido \(50%\):/)).toBeInTheDocument();
    expect(screen.getByText('$50')).toBeInTheDocument();
  });

  it('calculates adelanto correctly with 0 percentage', () => {
    const config: Configuracion = { cobrarAdelanto: true, porcentajeAdelanto: 0 };
    render(<ResumenPrecio servicioId={1} servicios={servicios} config={config} />);
    expect(screen.getByText('$0')).toBeInTheDocument();
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../../../../test-setup';
import { renderWithProviders } from '../../../../test-utils';
import { ModalNuevaCitaContainer } from '../ModalNuevaCita.container';

const mockOnSubmit = vi.fn();
const mockOnClose = vi.fn();

const defaultProps = {
  isOpen: true,
  onClose: mockOnClose,
  onSubmit: mockOnSubmit,
};

vi.mock('../../components/ModalNuevaCita', () => ({
  ModalNuevaCita: vi.fn(({ children, handleClose, modalRef, handleKeyDown, isLarge }: any) => (
    <div data-testid="modal-nueva-cita" data-is-large={isLarge}>
      <div ref={modalRef} onKeyDown={handleKeyDown} data-testid="modal-inner">
        {children}
        <button onClick={handleClose} data-testid="modal-close-btn">
          Cerrar
        </button>
      </div>
    </div>
  )),
}));

vi.mock('../../components/ModalNuevaCitaForm', () => ({
  ModalNuevaCitaForm: vi.fn(
    ({
      handleSubmit,
      handleClose,
      error,
      loading,
      formData,
      setFormData,
      horariosDisponibles,
    }: any) => (
      <form onSubmit={handleSubmit} data-testid="nueva-cita-form">
        {error && <div data-testid="form-error">{error}</div>}
        <input
          data-testid="nombre-input"
          value={formData.clienteNombre}
          onChange={(e) => setFormData((prev: any) => ({ ...prev, clienteNombre: e.target.value }))}
          placeholder="Nombre"
        />
        <input
          data-testid="telefono-input"
          value={formData.clienteTelefono}
          onChange={(e) =>
            setFormData((prev: any) => ({ ...prev, clienteTelefono: e.target.value }))
          }
          placeholder="Telefono"
        />
        <div data-testid="horarios-list">
          {horariosDisponibles.map((h: string) => (
            <button
              key={h}
              type="button"
              data-testid={`hora-${h}`}
              onClick={() => setFormData((prev: any) => ({ ...prev, horario: h }))}
            >
              {h}
            </button>
          ))}
        </div>
        <span data-testid="selected-horario">{formData.horario}</span>
        <button type="submit" disabled={loading} data-testid="submit-btn">
          {loading ? 'Cargando...' : 'Crear Cita'}
        </button>
        <button type="button" onClick={handleClose} data-testid="cancel-btn">
          Cancelar
        </button>
      </form>
    ),
  ),
}));

const BASE = '*/api/v1';

describe('ModalNuevaCitaContainer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    server.resetHandlers();
    server.use(
      http.get(`${BASE}/servicios`, () =>
        HttpResponse.json([
          {
            id: 1,
            nombre: 'Corte',
            duracionMinutos: 30,
            bufferMinutos: 5,
            precio: 100,
            activo: true,
          },
        ]),
      ),
      http.get(`${BASE}/users`, () => HttpResponse.json({ data: [], pagination: {} })),
      http.get(`${BASE}/configuracion`, () =>
        HttpResponse.json({ cobrarAdelanto: false, porcentajeAdelanto: 0 }),
      ),
      http.get(`${BASE}/citas/horarios-disponibles`, () =>
        HttpResponse.json({ horarios: ['10:00', '11:00', '14:00'] }),
      ),
    );
  });

  it('renders nothing when isOpen is false', () => {
    const { container } = renderWithProviders(
      <ModalNuevaCitaContainer {...defaultProps} isOpen={false} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the modal with form when isOpen is true', async () => {
    renderWithProviders(<ModalNuevaCitaContainer {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByTestId('modal-nueva-cita')).toBeInTheDocument();
    });
    expect(screen.getByTestId('nueva-cita-form')).toBeInTheDocument();
  });

  it('calls onClose when cancel is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ModalNuevaCitaContainer {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByTestId('cancel-btn')).toBeInTheDocument();
    });
    await user.click(screen.getByTestId('cancel-btn'));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('submits the form when valid data is provided', async () => {
    mockOnSubmit.mockResolvedValue({ success: true });
    const user = userEvent.setup();
    renderWithProviders(<ModalNuevaCitaContainer {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByTestId('nueva-cita-form')).toBeInTheDocument();
    });
    const nombreInput = screen.getByTestId('nombre-input');
    const telefonoInput = screen.getByTestId('telefono-input');
    await user.clear(nombreInput);
    await user.type(nombreInput, 'Ana López');
    await user.clear(telefonoInput);
    await user.type(telefonoInput, '59170000000');
    await user.click(screen.getByTestId('hora-10:00'));
    await user.click(screen.getByTestId('submit-btn'));
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalled();
    });
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('shows validation error when nombre is too short', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ModalNuevaCitaContainer {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByTestId('submit-btn')).toBeInTheDocument();
    });
    const nombreInput = screen.getByTestId('nombre-input');
    await user.clear(nombreInput);
    await user.type(nombreInput, 'An');
    await user.click(screen.getByTestId('submit-btn'));
    expect(screen.getByTestId('form-error')).toHaveTextContent('al menos 3 caracteres');
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('shows validation error when telefono is too short', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ModalNuevaCitaContainer {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByTestId('submit-btn')).toBeInTheDocument();
    });
    const nombreInput = screen.getByTestId('nombre-input');
    const telefonoInput = screen.getByTestId('telefono-input');
    await user.clear(nombreInput);
    await user.type(nombreInput, 'Ana López');
    await user.clear(telefonoInput);
    await user.type(telefonoInput, '123');
    await user.click(screen.getByTestId('submit-btn'));
    expect(screen.getByTestId('form-error')).toHaveTextContent('8 digitos');
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('shows validation error when no horario is selected', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ModalNuevaCitaContainer {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByTestId('submit-btn')).toBeInTheDocument();
    });
    const nombreInput = screen.getByTestId('nombre-input');
    const telefonoInput = screen.getByTestId('telefono-input');
    await user.clear(nombreInput);
    await user.type(nombreInput, 'Ana López');
    await user.clear(telefonoInput);
    await user.type(telefonoInput, '59170000000');
    await user.click(screen.getByTestId('submit-btn'));
    expect(screen.getByTestId('form-error')).toHaveTextContent('horario válido');
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('shows error from onSubmit when creation fails', async () => {
    mockOnSubmit.mockResolvedValue({ success: false, error: 'Horario no disponible' });
    const user = userEvent.setup();
    renderWithProviders(<ModalNuevaCitaContainer {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByTestId('submit-btn')).toBeInTheDocument();
    });
    const nombreInput = screen.getByTestId('nombre-input');
    const telefonoInput = screen.getByTestId('telefono-input');
    await user.clear(nombreInput);
    await user.type(nombreInput, 'Ana López');
    await user.clear(telefonoInput);
    await user.type(telefonoInput, '59170000000');
    await user.click(screen.getByTestId('hora-10:00'));
    await user.click(screen.getByTestId('submit-btn'));
    await waitFor(() => {
      expect(screen.getByTestId('form-error')).toHaveTextContent('Horario no disponible');
    });
  });

  it('resets form and closes on successful submit', async () => {
    mockOnSubmit.mockResolvedValue({ success: true });
    const user = userEvent.setup();
    renderWithProviders(<ModalNuevaCitaContainer {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByTestId('nueva-cita-form')).toBeInTheDocument();
    });
    const nombreInput = screen.getByTestId('nombre-input');
    const telefonoInput = screen.getByTestId('telefono-input');
    await user.clear(nombreInput);
    await user.type(nombreInput, 'Ana López');
    await user.clear(telefonoInput);
    await user.type(telefonoInput, '59170000000');
    await user.click(screen.getByTestId('hora-10:00'));
    await user.click(screen.getByTestId('submit-btn'));
    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalled();
    });
  });
});

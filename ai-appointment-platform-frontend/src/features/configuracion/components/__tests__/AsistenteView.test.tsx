import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { AsistenteView } from '../AsistenteView';
import type { ChatFlowStep } from '../../types/domain';

const defaultProps = {
  loading: false,
  error: null,
  trigger: '!cita',
  onTriggerChange: vi.fn(),
  mensajeBienvenida: 'Hola!',
  onMensajeBienvenidaChange: vi.fn(),
  mensajeConfirmacion: 'Gracias',
  onMensajeConfirmacionChange: vi.fn(),
  cobrarAdelanto: true,
  onCobrarAdelantoChange: vi.fn(),
  porcentajeAdelanto: 50,
  onPorcentajeAdelantoChange: vi.fn(),
  onSave: vi.fn(),
  isPending: false,
  isSuccess: false,
  chatFlow: [] as ChatFlowStep[],
  onChangeChatFlow: vi.fn(),
  qrFotoUrl: null,
  onUploadQR: vi.fn(),
  onRemoveQR: vi.fn(),
  isUploadingQR: false,
};

describe('AsistenteView', () => {
  it('renders loading skeleton', () => {
    const { container } = render(<AsistenteView {...defaultProps} loading={true} />);
    expect(container.querySelector('.skeleton')).toBeInTheDocument();
  });

  it('renders title and save button', () => {
    render(<AsistenteView {...defaultProps} />);
    expect(screen.getByText('Asistente')).toBeInTheDocument();
    expect(screen.getByText('Guardar')).toBeInTheDocument();
  });

  it('shows error message', () => {
    render(<AsistenteView {...defaultProps} error="Error occurred" />);
    expect(screen.getByText('Error occurred')).toBeInTheDocument();
  });

  it('renders trigger input', () => {
    render(<AsistenteView {...defaultProps} />);
    const triggerInput = screen.getByLabelText('Trigger');
    expect(triggerInput).toHaveValue('!cita');
  });

  it('calls onTriggerChange when trigger input changes', async () => {
    const user = userEvent.setup();
    const onTriggerChange = vi.fn();
    render(<AsistenteView {...defaultProps} onTriggerChange={onTriggerChange} />);
    const triggerInput = screen.getByLabelText('Trigger');
    await user.type(triggerInput, 'x');
    expect(onTriggerChange).toHaveBeenCalled();
  });

  it('renders activation section', () => {
    render(<AsistenteView {...defaultProps} />);
    expect(screen.getByText('Activacion')).toBeInTheDocument();
  });

  it('renders chat flow editor section', () => {
    render(<AsistenteView {...defaultProps} />);
    expect(screen.getByText('Flujo de Conversacion')).toBeInTheDocument();
  });

  it('renders cobro de adelanto section', () => {
    render(<AsistenteView {...defaultProps} />);
    expect(screen.getByText('Cobro de Adelanto')).toBeInTheDocument();
  });

  it('shows QR and mensaje confirmacion when cobrarAdelanto is true', () => {
    render(<AsistenteView {...defaultProps} cobrarAdelanto={true} />);
    expect(screen.getByText('Foto QR Bancario')).toBeInTheDocument();
    expect(screen.getByLabelText('Mensaje al recibir el comprobante')).toBeInTheDocument();
  });

  it('hides QR and confirmacion when cobrarAdelanto is false', () => {
    render(<AsistenteView {...defaultProps} cobrarAdelanto={false} />);
    expect(screen.queryByText('Foto QR Bancario')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Mensaje al recibir el comprobante')).not.toBeInTheDocument();
  });

  it('calls onSave when save button is clicked', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<AsistenteView {...defaultProps} onSave={onSave} />);
    await user.click(screen.getByText('Guardar'));
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it('shows loading button state when isPending', () => {
    render(<AsistenteView {...defaultProps} isPending={true} />);
    expect(screen.getByText('Guardando...')).toBeInTheDocument();
  });

  it('shows success button state when isSuccess', () => {
    render(<AsistenteView {...defaultProps} isSuccess={true} />);
    expect(screen.getByText('Guardado')).toBeInTheDocument();
  });

  it('shows uploading QR state', () => {
    render(<AsistenteView {...defaultProps} isUploadingQR={true} />);
    expect(screen.getByText('Subiendo imagen...')).toBeInTheDocument();
  });

  it('disables save button when isPending', () => {
    render(<AsistenteView {...defaultProps} isPending={true} />);
    expect(screen.getByRole('button', { name: 'Guardando...' })).toBeDisabled();
  });

  it('renders porcentaje adelanto input when cobrarAdelanto is true', () => {
    render(<AsistenteView {...defaultProps} cobrarAdelanto={true} />);
    expect(screen.getByLabelText('Porcentaje de adelanto')).toBeInTheDocument();
  });

  it('calls onPorcentajeAdelantoChange with clamped value', async () => {
    const user = userEvent.setup();
    const onPorcentajeAdelantoChange = vi.fn();
    render(
      <AsistenteView
        {...defaultProps}
        cobrarAdelanto={true}
        porcentajeAdelanto={50}
        onPorcentajeAdelantoChange={onPorcentajeAdelantoChange}
      />,
    );
    const pctInput = screen.getByLabelText('Porcentaje de adelanto');
    await user.clear(pctInput);
    await user.type(pctInput, '120');
    expect(onPorcentajeAdelantoChange).toHaveBeenLastCalledWith(100);
  });
});

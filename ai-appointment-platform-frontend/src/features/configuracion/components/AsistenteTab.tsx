import { Toggle } from '../../../shared/components/Toggle';

interface AsistenteTabProps {
  trigger: string;
  onTriggerChange: (value: string) => void;
  mensajeBienvenida: string;
  onMensajeBienvenidaChange: (value: string) => void;
  mensajeConfirmacion: string;
  onMensajeConfirmacionChange: (value: string) => void;
  cobrarAdelanto: boolean;
  onCobrarAdelantoChange: (value: boolean) => void;
  porcentajeAdelanto: number;
  onPorcentajeAdelantoChange: (value: number) => void;
}

export const AsistenteTab = ({
  trigger,
  onTriggerChange,
  mensajeBienvenida,
  onMensajeBienvenidaChange,
  mensajeConfirmacion,
  onMensajeConfirmacionChange,
  cobrarAdelanto,
  onCobrarAdelantoChange,
  porcentajeAdelanto,
  onPorcentajeAdelantoChange,
}: AsistenteTabProps) => (
  <div className="bg-surface rounded-2xl border border-border-light shadow-sm p-6 space-y-5">
    <div>
      <label
        htmlFor="config-trigger"
        className="block text-xs font-semibold text-txt-muted uppercase tracking-wide mb-1.5"
      >
        Palabra o frase que activa el bot
      </label>
      <input
        id="config-trigger"
        value={trigger}
        onChange={(e) => onTriggerChange(e.target.value)}
        placeholder="!cita"
        className="w-full border border-border rounded-xl px-4 py-2.5 text-sm text-txt focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-mono"
      />
      <p className="text-xs text-txt-muted mt-1.5">
        El cliente debe escribir esto exactamente para iniciar el proceso.
      </p>
    </div>
    <div>
      <label
        htmlFor="config-bienvenida"
        className="block text-xs font-semibold text-txt-muted uppercase tracking-wide mb-1.5"
      >
        Mensaje de bienvenida
      </label>
      <textarea
        id="config-bienvenida"
        value={mensajeBienvenida}
        onChange={(e) => onMensajeBienvenidaChange(e.target.value)}
        rows={3}
        className="w-full border border-border rounded-xl px-4 py-3 text-sm text-txt focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all resize-none"
      />
      <p className="text-xs text-txt-muted mt-1.5">
        Se envia al activar el bot. Luego pide el nombre del cliente.
      </p>
    </div>
    <div className="border border-border-light rounded-xl p-4 space-y-4">
      <p className="text-xs font-semibold text-txt-muted uppercase tracking-wide">
        Cobro de adelanto
      </p>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-txt-secondary">Requerir adelanto de pago</p>
          <p className="text-xs text-txt-muted mt-0.5">
            {cobrarAdelanto
              ? 'El bot pedira comprobante antes de confirmar la cita'
              : 'La cita se confirma automaticamente sin pago previo'}
          </p>
        </div>
        <Toggle
          id="config-cobrar-adelanto"
          checked={cobrarAdelanto}
          onChange={onCobrarAdelantoChange}
        />
      </div>
      {cobrarAdelanto && (
        <>
          <div>
            <label
              htmlFor="config-porcentaje"
              className="block text-xs font-semibold text-txt-muted uppercase tracking-wide mb-1.5"
            >
              Porcentaje de adelanto
            </label>
            <div className="flex items-center gap-3">
              <input
                id="config-porcentaje"
                type="number"
                min={1}
                max={100}
                value={porcentajeAdelanto}
                onChange={(e) =>
                  onPorcentajeAdelantoChange(Math.min(100, Math.max(1, Number(e.target.value))))
                }
                className="w-24 border border-border rounded-xl px-4 py-2.5 text-sm text-txt focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-center font-mono"
              />
              <span className="text-sm text-txt-muted">% del precio del servicio</span>
            </div>
            <p className="text-xs text-txt-muted mt-1.5">
              Ej: si el servicio cuesta $100 y el adelanto es 30%, el cliente paga $30 primero.
            </p>
          </div>
          <div>
            <label
              htmlFor="config-confirmacion"
              className="block text-xs font-semibold text-txt-muted uppercase tracking-wide mb-1.5"
            >
              Mensaje al recibir el comprobante
            </label>
            <textarea
              id="config-confirmacion"
              value={mensajeConfirmacion}
              onChange={(e) => onMensajeConfirmacionChange(e.target.value)}
              rows={3}
              className="w-full border border-border rounded-xl px-4 py-3 text-sm text-txt focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all resize-none"
            />
            <p className="text-xs text-txt-muted mt-1.5">
              Se envia al cliente cuando sube el comprobante de pago.
            </p>
          </div>
        </>
      )}
    </div>
  </div>
);

import { Toggle } from '../../../shared/components/Toggle';
import { ImageUploader } from '../../../shared/components/ImageUploader';
import { ChatFlowEditor, type ChatFlowStep } from './ChatFlowEditor';
import { Loader2, Check, Save, Zap, MessageCircle, DollarSign } from 'lucide-react';

interface AsistenteViewProps {
  loading: boolean;
  error: string | null;
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
  onSave: () => void;
  isPending: boolean;
  isSuccess: boolean;
  chatFlow: ChatFlowStep[];
  onChangeChatFlow: (flow: ChatFlowStep[]) => void;
  qrFotoUrl: string | null;
  onUploadQR: (base64: string) => void;
  onRemoveQR: () => void;
  isUploadingQR: boolean;
}

const LoadingSkeleton = () => (
  <div className="space-y-6">
    <div className="card-modern overflow-hidden">
      <div className="p-5 md:p-6 border-b border-border">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <div className="space-y-2">
            <div className="skeleton h-5 w-48 rounded" />
            <div className="skeleton h-3 w-64 rounded" />
          </div>
          <div className="skeleton h-10 w-36 rounded-xl" />
        </div>
      </div>
    </div>
    <div className="card-modern p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="skeleton w-10 h-10 rounded-xl" />
        <div className="space-y-1">
          <div className="skeleton h-4 w-32 rounded" />
          <div className="skeleton h-3 w-48 rounded" />
        </div>
      </div>
      <div className="skeleton h-10 rounded-xl" />
    </div>
    <div className="card-modern p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="skeleton w-10 h-10 rounded-xl" />
        <div className="space-y-1">
          <div className="skeleton h-4 w-40 rounded" />
          <div className="skeleton h-3 w-56 rounded" />
        </div>
      </div>
      <div className="skeleton h-32 rounded-xl" />
    </div>
  </div>
);

export const AsistenteView = ({
  loading,
  error,
  trigger,
  onTriggerChange,
  mensajeConfirmacion,
  onMensajeConfirmacionChange,
  cobrarAdelanto,
  onCobrarAdelantoChange,
  porcentajeAdelanto,
  onPorcentajeAdelantoChange,
  onSave,
  isPending,
  isSuccess,
  chatFlow,
  onChangeChatFlow,
  qrFotoUrl,
  onUploadQR,
  onRemoveQR,
  isUploadingQR,
}: AsistenteViewProps) => {
  if (loading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card-modern overflow-hidden">
        <div className="p-5 md:p-6 border-b border-border">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
            <div>
              <h2 className="text-lg font-bold text-txt">Asistente</h2>
              <p className="text-sm text-txt-muted mt-1">
                Configura el comportamiento del asistente de WhatsApp
              </p>
            </div>
            <button
              onClick={onSave}
              disabled={isPending}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-on-primary bg-primary rounded-xl hover:bg-primary-dark disabled:opacity-60 transition-colors shadow-sm"
            >
              {isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isSuccess ? (
                <Check className="w-4 h-4" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {isPending ? 'Guardando...' : isSuccess ? 'Guardado' : 'Guardar'}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-danger-light border border-danger/20 rounded-xl px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      {/* Card: Activacion */}
      <div className="card-modern overflow-hidden">
        <div className="p-5 md:p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-xl">
              <Zap className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-txt">Activacion</h3>
              <p className="text-xs text-txt-muted mt-0.5">Palabra o frase que activa el bot</p>
            </div>
          </div>
        </div>
        <div className="p-5 md:p-6">
          <label
            htmlFor="config-trigger"
            className="block text-xs font-semibold text-txt-muted uppercase tracking-wide mb-1.5"
          >
            Trigger
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
      </div>

      {/* Card: Flujo de Conversacion */}
      <div className="card-modern overflow-hidden">
        <div className="p-5 md:p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-secondary/10 rounded-xl">
              <MessageCircle className="w-5 h-5 text-secondary" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-txt">Flujo de Conversacion</h3>
              <p className="text-xs text-txt-muted mt-0.5">Configura cada paso del chat</p>
            </div>
          </div>
        </div>
        <div className="p-5 md:p-6">
          <ChatFlowEditor chatFlow={chatFlow} onChange={onChangeChatFlow} />
        </div>
      </div>

      {/* Card: Cobro de Adelanto */}
      <div className="card-modern overflow-hidden">
        <div className="p-5 md:p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-success/10 rounded-xl">
              <DollarSign className="w-5 h-5 text-success" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-txt">Cobro de Adelanto</h3>
              <p className="text-xs text-txt-muted mt-0.5">Configura pagos anticipados</p>
            </div>
          </div>
        </div>
        <div className="p-5 md:p-6 space-y-5">
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

              <div className="border border-border-light rounded-xl p-4 space-y-3">
                <p className="text-xs font-semibold text-txt-muted uppercase tracking-wide">
                  Foto QR Bancario
                </p>
                <p className="text-xs text-txt-muted">
                  Sube la imagen del QR de tu cuenta bancaria. Se enviara al cliente cuando solicite
                  el adelanto.
                </p>
                {isUploadingQR ? (
                  <div className="flex items-center gap-2 text-sm text-txt-muted">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Subiendo imagen...
                  </div>
                ) : (
                  <ImageUploader
                    currentImage={qrFotoUrl}
                    onUpload={onUploadQR}
                    onRemove={onRemoveQR}
                    label="Subir QR bancario"
                  />
                )}
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
    </div>
  );
};

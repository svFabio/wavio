import { CheckCircle2, ImageOff, Clock, Phone, XCircle, CheckCircle } from 'lucide-react';

interface PagoCita {
  id: string;
  clienteNombre: string | null;
  clienteTelefono: string;
  horario: string;
  estado: string;
  comprobanteUrl?: string;
}

interface PagosViewProps {
  citas: PagoCita[];
  loading: boolean;
  onValidar: (id: string, accion: 'APROBAR' | 'RECHAZAR') => Promise<void>;
}

export const PagosView = ({ citas, loading, onValidar }: PagosViewProps) => {
  if (loading) return (
    <div className="space-y-4">
      <div className="skeleton h-20 rounded-theme-lg" />
      <div className="skeleton h-36 rounded-theme-lg" />
      <div className="skeleton h-36 rounded-theme-lg" />
    </div>
  );

  return (
    <div className="card-modern overflow-hidden">
      <div className="p-5 md:p-6 border-b border-border">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-txt">Validacion de Comprobantes</h2>
            <p className="text-sm text-txt-muted mt-1">Revisa las fotos enviadas por WhatsApp</p>
          </div>
          <div className="badge badge-warning">
            <span className="w-2 h-2 rounded-full animate-pulse bg-warning" />
            {citas.length} pendientes
          </div>
        </div>
      </div>

      <div className="p-4 md:p-6">
        {citas.length === 0 ? (
          <div className="py-12 text-center">
            <CheckCircle2 className="w-14 h-14 mx-auto text-success/30 mb-3" />
            <p className="text-lg text-txt font-semibold">Todo al dia!</p>
            <p className="text-sm text-txt-muted mt-1">No hay pagos pendientes de revision.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {citas.map(cita => (
              <div key={cita.id} className="bg-surface-alt rounded-xl p-4 md:p-5 hover:bg-surface-elevated/50 transition-all border border-border-light group">
                <div className="flex flex-col md:flex-row gap-4 md:gap-5">
                  <div className="flex-shrink-0">
                    {cita.comprobanteUrl ? (
                      <a href={cita.comprobanteUrl} target="_blank" rel="noreferrer" className="block">
                        <img
                          src={cita.comprobanteUrl}
                          alt="Comprobante"
                          className="w-24 h-24 md:w-28 md:h-28 object-cover rounded-xl border-2 border-warning/30 hover:border-warning transition-all cursor-zoom-in shadow-sm"
                        />
                      </a>
                    ) : (
                      <div className="w-24 h-24 md:w-28 md:h-28 bg-surface-elevated rounded-xl flex items-center justify-center text-txt-muted border border-dashed border-border">
                        <div className="text-center">
                          <ImageOff className="w-6 h-6 mx-auto mb-1 text-txt-muted/50" />
                          <p className="text-[10px] uppercase tracking-wider font-medium">Sin foto</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-3">
                      <p className="font-bold text-lg text-txt truncate">
                        {cita.clienteNombre || (
                          cita.clienteTelefono.length > 15
                            ? `ID: ${cita.clienteTelefono.substring(0, 5)}...`
                            : `Tel: ${cita.clienteTelefono}`
                        )}
                      </p>
                      <span className="badge badge-warning">{cita.estado}</span>
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm text-txt-secondary">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-txt-muted" />
                        <span>{cita.horario}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-txt-muted" />
                        <span className="font-mono text-xs">{cita.clienteTelefono}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 md:flex-col md:items-end md:justify-center md:w-36">
                    <button
                      onClick={() => onValidar(cita.id, 'APROBAR')}
                      disabled={!cita.comprobanteUrl}
                      className={`flex-1 md:w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all ${cita.comprobanteUrl
                        ? 'bg-success text-white hover:opacity-90 shadow-sm active:scale-95'
                        : 'bg-surface-elevated text-txt-muted cursor-not-allowed'
                        }`}
                    >
                      <CheckCircle className="w-4 h-4" /> Aprobar
                    </button>

                    <button
                      onClick={() => onValidar(cita.id, 'RECHAZAR')}
                      className="flex-1 md:w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-danger/20 text-danger hover:bg-danger-light font-semibold text-sm transition-all active:scale-95"
                    >
                      <XCircle className="w-4 h-4" /> Rechazar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

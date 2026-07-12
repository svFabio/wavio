import type { Cita } from '../types';
import { Check, X } from 'lucide-react';

interface Props {
  cita: Cita;
  onAction: (id: string, action: 'APROBAR' | 'RECHAZAR') => void;
}

export const ValidationCard = ({ cita, onAction }: Props) => {
  return (
    <div className="bg-surface rounded-xl shadow-lg border border-border overflow-hidden mb-6 transition-all hover:shadow-xl">
      <div className="bg-surface-elevated p-4 border-b border-border">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
          <div>
            <h3 className="font-bold text-txt text-lg md:text-xl">{cita.clienteNombre}</h3>
            <p className="text-sm text-txt-secondary font-medium mt-1">Telefono: {cita.clienteTelefono}</p>
          </div>
          <span className="badge badge-warning">
            {cita.estado}
          </span>
        </div>
      </div>

      <div className="p-4 sm:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <p className="text-xs font-bold text-txt-muted uppercase tracking-wider mb-2">Fecha Solicitada</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm md:text-base">
                <div className="bg-surface-elevated p-3 rounded-lg">
                  <span className="text-txt-secondary font-medium">Fecha:</span>
                  <span className="ml-2 font-semibold text-txt">{cita.fecha}</span>
                </div>
                <div className="bg-surface-elevated p-3 rounded-lg">
                  <span className="text-txt-secondary font-medium">Hora:</span>
                  <span className="ml-2 font-semibold text-txt">{cita.horario}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => onAction(cita.id, 'RECHAZAR')}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg border-2 border-danger/20 text-danger font-bold hover:bg-danger-light hover:border-danger/40 transition-colors active:scale-95"
              >
                <X size={18} /> Rechazar
              </button>
              <button
                onClick={() => onAction(cita.id, 'APROBAR')}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-success text-white font-bold hover:opacity-90 shadow-lg transition-all active:scale-95"
              >
                <Check size={18} /> Validar
              </button>
            </div>
          </div>

          <div className="bg-surface-elevated rounded-lg flex items-center justify-center min-h-[200px] border-2 border-dashed border-border relative overflow-hidden group">
            {cita.comprobanteUrl ? (
              <a
                href={cita.comprobanteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full h-full block cursor-zoom-in"
                title="Clic para ver en grande"
              >
                <img
                  src={cita.comprobanteUrl}
                  alt="Comprobante de pago"
                  className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  <span className="opacity-0 group-hover:opacity-100 bg-black/60 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-sm transition-opacity font-medium">
                    Ver imagen completa
                  </span>
                </div>
              </a>
            ) : (
              <div className="text-center p-6">
                <p className="text-txt-muted text-sm font-medium">Sin imagen cargada</p>
                <p className="text-txt-muted text-xs mt-1">(El usuario no subio comprobante)</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

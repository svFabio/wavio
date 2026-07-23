import React from 'react';
import type { Servicio } from '../../configuracion/types';
import type { Configuracion } from '../../configuracion/types/domain';

interface ResumenPrecioProps {
  servicioId: number | null | undefined;
  servicios: Servicio[];
  config: Configuracion | null | undefined;
}

export const ResumenPrecio = ({
  servicioId,
  servicios,
  config,
}: ResumenPrecioProps): React.JSX.Element | null => {
  if (!servicioId) return null;

  const servicio = servicios.find((s) => s.id === servicioId);
  if (!servicio) return null;

  const adelanto = config?.cobrarAdelanto
    ? (servicio.precio * (config.porcentajeAdelanto || 0)) / 100
    : 0;

  return (
    <div className="col-span-2 bg-surface-elevated p-3 rounded-xl border border-border-light shadow-sm">
      <div className="flex justify-between text-sm items-center">
        <span className="text-txt-muted">Precio del servicio:</span>
        <span className="font-semibold text-txt">${servicio.precio}</span>
      </div>
      {config?.cobrarAdelanto && (
        <div className="flex justify-between text-sm mt-2 pt-2 border-t border-border-light items-center">
          <span className="text-txt-muted">Adelanto requerido ({config.porcentajeAdelanto}%):</span>
          <span className="font-bold text-primary">${adelanto}</span>
        </div>
      )}
    </div>
  );
};

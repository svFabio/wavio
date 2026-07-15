import { CheckCircle2 } from 'lucide-react';
import type { CitaResumen } from '../types';

interface AgendaTableProps {
  citas: CitaResumen[];
}

const getEstadoBadge = (estado: string) => {
  switch (estado) {
    case 'CONFIRMADA':
      return 'badge-success';
    case 'VALIDACION_PENDIENTE':
      return 'badge-warning';
    default:
      return 'badge-info';
  }
};

export const AgendaTable = ({ citas }: AgendaTableProps) => {
  return (
    <>
      <div className="hidden md:block">
        {citas.length === 0 ? (
          <div className="px-6 py-10 text-center text-txt-muted">
            <CheckCircle2 className="w-10 h-10 mx-auto text-success/40 mb-2" />
            <p className="font-medium">No hay citas programadas para hoy</p>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface-elevated/50">
                <th className="px-6 py-3 text-xs font-semibold text-txt-muted uppercase tracking-wider">
                  Hora
                </th>
                <th className="px-6 py-3 text-xs font-semibold text-txt-muted uppercase tracking-wider">
                  Servicio
                </th>
                <th className="px-6 py-3 text-xs font-semibold text-txt-muted uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-xs font-semibold text-txt-muted uppercase tracking-wider">
                  Estado
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light">
              {citas.map((cita) => (
                <tr key={cita.id} className="hover:bg-surface-alt/50 transition-colors">
                  <td className="px-6 py-3.5">
                    <span className="font-mono font-semibold text-txt text-sm">{cita.horario}</span>
                  </td>
                  <td className="px-6 py-3.5">
                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-secondary-light/30 text-secondary border border-secondary/20">
                      {cita.servicio || 'Spa'}
                    </span>
                  </td>
                  <td className="px-6 py-3.5">
                    {cita.clienteNombre ? (
                      <span className="capitalize font-medium text-sm text-txt">
                        {cita.clienteNombre}
                      </span>
                    ) : (
                      <span className="text-txt-muted text-sm font-mono">
                        {cita.clienteTelefono.length > 15
                          ? cita.clienteTelefono.substring(0, 8) + '...'
                          : cita.clienteTelefono}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-3.5">
                    <span className={`badge ${getEstadoBadge(cita.estado)}`}>{cita.estado}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="md:hidden divide-y divide-border-light">
        {citas.length === 0 ? (
          <div className="px-4 py-10 text-center text-txt-muted">
            <CheckCircle2 className="w-10 h-10 mx-auto text-success/40 mb-2" />
            <p className="font-medium">No hay citas programadas para hoy</p>
          </div>
        ) : (
          citas.map((cita) => (
            <div key={cita.id} className="p-4 hover:bg-surface-alt/50 transition-colors">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-mono font-semibold text-txt text-sm">{cita.horario}</p>
                  {cita.clienteNombre ? (
                    <p className="text-sm text-txt-secondary capitalize mt-0.5">
                      {cita.clienteNombre}
                    </p>
                  ) : (
                    <p className="text-sm text-txt-muted font-mono mt-0.5">
                      {cita.clienteTelefono.length > 15
                        ? cita.clienteTelefono.substring(0, 8) + '...'
                        : cita.clienteTelefono}
                    </p>
                  )}
                  <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium bg-secondary-light/30 text-secondary rounded border border-secondary/20">
                    {cita.servicio || 'Spa'}
                  </span>
                </div>
                <span className={`badge ${getEstadoBadge(cita.estado)}`}>{cita.estado}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
};

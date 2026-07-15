import { useState } from 'react';
import type { HorarioEspecial } from '../types';
import { Loader2, Plus, Trash2, Calendar } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface HorariosEspecialesTabProps {
  horariosEspeciales: HorarioEspecial[];
  onCreate: (data: { fecha: string; cerrado: boolean; horaInicio: string | null; horaFin: string | null }) => void;
  onDelete: (id: number) => void;
  isLoading: boolean;
}

export const HorariosEspecialesTab = ({
  horariosEspeciales,
  onCreate,
  onDelete,
  isLoading,
}: HorariosEspecialesTabProps) => {
  const [fecha, setFecha] = useState('');
  const [cerrado, setCerrado] = useState(true);
  const [horaInicio, setHoraInicio] = useState('09:00');
  const [horaFin, setHoraFin] = useState('18:00');

  const handleCreate = () => {
    if (!fecha) return;
    onCreate({
      fecha,
      cerrado,
      horaInicio: cerrado ? null : horaInicio,
      horaFin: cerrado ? null : horaFin,
    });
    setFecha('');
    setCerrado(true);
    setHoraInicio('09:00');
    setHoraFin('18:00');
  };

  if (isLoading) {
    return (
      <div className="bg-surface rounded-2xl border border-border-light shadow-sm p-12 flex justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-txt-muted" />
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-2xl border border-border-light shadow-sm p-6 space-y-6">
      <div>
        <p className="text-sm text-txt-muted max-w-md">
          Configura fechas específicas donde el negocio estará cerrado o tendrá un horario diferente al habitual.
        </p>
      </div>

      <div className="bg-surface-elevated/30 border border-border p-4 rounded-xl space-y-4">
        <h3 className="text-sm font-semibold text-txt flex items-center gap-2">
          <Calendar className="w-4 h-4" /> Agregar fecha especial
        </h3>
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1 space-y-1.5 w-full">
            <label className="text-xs font-medium text-txt-muted">Fecha</label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-txt focus:outline-none focus:border-primary"
            />
          </div>

          <div className="flex items-center gap-2 mb-2">
            <input
              type="checkbox"
              id="cerrado"
              checked={cerrado}
              onChange={(e) => setCerrado(e.target.checked)}
              className="rounded border-border text-primary focus:ring-primary"
            />
            <label htmlFor="cerrado" className="text-sm text-txt font-medium cursor-pointer">
              Cerrado todo el día
            </label>
          </div>

          {!cerrado && (
            <>
              <div className="w-full sm:w-32 space-y-1.5">
                <label className="text-xs font-medium text-txt-muted">Inicio</label>
                <input
                  type="time"
                  value={horaInicio}
                  onChange={(e) => setHoraInicio(e.target.value)}
                  className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-txt focus:outline-none focus:border-primary"
                />
              </div>
              <div className="w-full sm:w-32 space-y-1.5">
                <label className="text-xs font-medium text-txt-muted">Fin</label>
                <input
                  type="time"
                  value={horaFin}
                  onChange={(e) => setHoraFin(e.target.value)}
                  className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-txt focus:outline-none focus:border-primary"
                />
              </div>
            </>
          )}

          <button
            onClick={handleCreate}
            disabled={!fecha}
            className="w-full sm:w-auto px-4 py-2 bg-primary text-on-primary text-sm font-medium rounded-lg hover:bg-primary-dark transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Plus className="w-4 h-4" /> Agregar
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {horariosEspeciales.length === 0 ? (
          <div className="text-center py-8 text-txt-muted text-sm border border-dashed border-border rounded-xl">
            No hay fechas especiales configuradas
          </div>
        ) : (
          horariosEspeciales.map((h) => {
            const dateStr = h.fecha.includes('T') ? h.fecha : `${h.fecha}T00:00:00`;
            const formattedDate = format(parseISO(dateStr), "EEEE d 'de' MMMM, yyyy", { locale: es });
            
            return (
              <div
                key={h.id}
                className="flex items-center justify-between p-4 rounded-xl border border-border bg-surface-elevated/30"
              >
                <div>
                  <p className="font-semibold text-txt text-sm capitalize">{formattedDate}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {h.cerrado ? (
                      <span className="badge badge-error">Cerrado</span>
                    ) : (
                      <span className="badge badge-info">
                        Horario: {h.horaInicio?.slice(0, 5)} - {h.horaFin?.slice(0, 5)}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => onDelete(h.id)}
                  className="p-2 text-txt-muted hover:text-danger hover:bg-danger-light rounded-lg transition-colors"
                  title="Eliminar"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );

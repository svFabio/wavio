import { useState } from 'react';
import { Calendar, Clock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import type {
  PortalCliente,
  PortalNegocio,
  PortalCita,
  PortalServicio,
  BookAppointmentPayload,
} from '../types';

interface PortalViewProps {
  cliente: PortalCliente;
  negocio: PortalNegocio;
  citas: PortalCita[];
  servicios: PortalServicio[];
  slots: string[];
  loadingSlots: boolean;
  selectedDate: string;
  onDateChange: (date: string) => void;
  selectedServicioId: number | undefined;
  onServicioChange: (id: number | undefined) => void;
  onBook: (data: BookAppointmentPayload) => void;
  booking: boolean;
  bookingResult: { success: boolean; message: string } | null;
  bookingError: string | null;
}

const ESTADO_COLORS: Record<string, string> = {
  PENDIENTE: 'bg-warning/10 text-warning',
  CONFIRMADA: 'bg-success/10 text-success',
  CANCELADA: 'bg-danger/10 text-danger',
  NO_ASISTIO: 'bg-danger/10 text-danger',
  VALIDACION_PENDIENTE: 'bg-primary/10 text-primary',
};

export const PortalView = ({
  cliente,
  negocio,
  citas,
  servicios,
  slots,
  loadingSlots,
  selectedDate,
  onDateChange,
  selectedServicioId,
  onServicioChange,
  onBook,
  booking,
  bookingResult,
  bookingError,
}: PortalViewProps) => {
  const [selectedSlot, setSelectedSlot] = useState('');

  const handleBook = () => {
    if (!selectedDate || !selectedSlot) return;
    onBook({
      fecha: selectedDate,
      horario: selectedSlot,
      servicioId: selectedServicioId,
    });
  };

  const minDate = new Date().toISOString().split('T')[0];

  return (
    <div className="min-h-screen bg-surface-alt">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-surface rounded-xl shadow-card border border-border p-6 mb-6">
          <h1 className="text-xl font-bold text-txt mb-1">{negocio.nombre}</h1>
          <p className="text-sm text-txt-secondary">
            Hola {cliente.nombre}, bienvenido a tu portal de citas.
          </p>
        </div>

        <div className="bg-surface rounded-xl shadow-card border border-border p-6 mb-6">
          <h2 className="text-lg font-semibold text-txt mb-4 flex items-center gap-2">
            <Calendar size={18} />
            Agendar Nueva Cita
          </h2>

          <div className="space-y-4">
            <div>
              <label htmlFor="fecha" className="block text-sm font-medium text-txt-secondary mb-1">
                Fecha
              </label>
              <input
                id="fecha"
                type="date"
                min={minDate}
                value={selectedDate}
                onChange={(e) => {
                  onDateChange(e.target.value);
                  setSelectedSlot('');
                }}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm text-txt bg-surface focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {servicios.length > 0 && (
              <div>
                <label
                  htmlFor="servicio"
                  className="block text-sm font-medium text-txt-secondary mb-1"
                >
                  Servicio
                </label>
                <select
                  id="servicio"
                  value={selectedServicioId ?? ''}
                  onChange={(e) => {
                    onServicioChange(e.target.value ? Number(e.target.value) : undefined);
                    setSelectedSlot('');
                  }}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm text-txt bg-surface focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Sin preferencia</option>
                  {servicios.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nombre} — {s.duracionMinutos}min — Bs. {s.precio}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {selectedDate && (
              <div>
                <label className="block text-sm font-medium text-txt-secondary mb-1">
                  Horario disponible
                </label>
                {loadingSlots ? (
                  <div className="flex items-center gap-2 text-txt-secondary text-sm py-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Cargando horarios...
                  </div>
                ) : slots.length === 0 ? (
                  <p className="text-sm text-txt-muted py-2">
                    No hay horarios disponibles para esta fecha.
                  </p>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {slots.map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setSelectedSlot(slot)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                          selectedSlot === slot
                            ? 'bg-primary text-on-primary border-primary'
                            : 'bg-surface text-txt border-border hover:border-primary/50'
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {selectedDate && selectedSlot && (
              <button
                type="button"
                onClick={handleBook}
                disabled={booking}
                className="w-full bg-primary text-on-primary py-2.5 rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {booking ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Agendando...
                  </>
                ) : (
                  'Confirmar Cita'
                )}
              </button>
            )}

            {bookingResult && (
              <div
                className={`flex items-start gap-2 p-3 rounded-lg text-sm ${
                  bookingResult.success ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
                }`}
              >
                {bookingResult.success ? (
                  <CheckCircle size={16} className="mt-0.5 flex-shrink-0" />
                ) : (
                  <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                )}
                {bookingResult.message}
              </div>
            )}

            {bookingError && (
              <div className="flex items-start gap-2 p-3 rounded-lg text-sm bg-danger/10 text-danger">
                <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                {bookingError}
              </div>
            )}
          </div>
        </div>

        <div className="bg-surface rounded-xl shadow-card border border-border p-6">
          <h2 className="text-lg font-semibold text-txt mb-4 flex items-center gap-2">
            <Clock size={18} />
            Mis Citas
          </h2>

          {citas.length === 0 ? (
            <p className="text-sm text-txt-muted">No tienes citas registradas.</p>
          ) : (
            <div className="space-y-3">
              {citas.map((cita) => (
                <div
                  key={cita.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border bg-surface-alt"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-txt truncate">{cita.servicio}</p>
                    <p className="text-xs text-txt-secondary">
                      {new Date(cita.fecha).toLocaleDateString('es-ES', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}{' '}
                      — {cita.horario}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      ESTADO_COLORS[cita.estado] ?? 'bg-surface-elevated text-txt-secondary'
                    }`}
                  >
                    {cita.estado}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

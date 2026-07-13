import { Calendar, Views } from 'react-big-calendar';
import type { View } from 'react-big-calendar';
import { dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { es } from 'date-fns/locale';
import type { EventoCalendario } from '../types';
import { ModalDetalle } from './ModalDetalle';
import { ModalNuevaCita } from './ModalNuevaCita';
import { ModalReprogramar } from './ModalReprogramar';
import { CustomEventDay } from './CustomEventDay';
import { CustomEventMonth } from './CustomEventMonth';
import { CustomToolbar } from './CustomToolbar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import '../../../index.css';

const locales = { 'es': es };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface DatosNuevaCita {
  clienteNombre: string;
  clienteTelefono: string;
  fecha: string;
  horario: string;
}

interface CalendarioViewProps {
  eventos: EventoCalendario[];
  vista: View;
  fecha: Date;
  scrollToTime: Date;
  eventStyleGetter: (event: EventoCalendario) => { className?: string; style?: React.CSSProperties };
  onNavigateFecha: (date: Date) => void;
  onNavigateVista: (view: View) => void;
  onSelectSlot: (slot: { start: Date }) => void;
  onSelectEvent: (event: EventoCalendario) => void;
  onNuevaCita: () => void;
  citaSeleccionada: EventoCalendario | null;
  onCerrarDetalle: () => void;
  onReprogramarDesdeDetalle: () => void;
  onNoAsistio: () => void;
  onGuardarDescripcion: (citaId: string, descripcion: string) => Promise<{ success: boolean }>;
  modalNuevaCitaAbierto: boolean;
  fechaInicialNuevaCita?: Date;
  onCerrarNuevaCita: () => void;
  onCrearCita: (data: DatosNuevaCita) => Promise<{ success: boolean; error?: string }>;
  modalReprogramarAbierto: boolean;
  citaReprogramar: EventoCalendario;
  onCerrarReprogramar: () => void;
  onReprogramarCita: (citaId: string, fecha: string, horario: string) => Promise<{ success: boolean; error?: string }>;
}

export const CalendarioView = ({
  eventos,
  vista,
  fecha,
  scrollToTime,
  eventStyleGetter,
  onNavigateFecha,
  onNavigateVista,
  onSelectSlot,
  onSelectEvent,
  onNuevaCita,
  citaSeleccionada,
  onCerrarDetalle,
  onReprogramarDesdeDetalle,
  onNoAsistio,
  onGuardarDescripcion,
  modalNuevaCitaAbierto,
  fechaInicialNuevaCita,
  onCerrarNuevaCita,
  onCrearCita,
  modalReprogramarAbierto,
  citaReprogramar,
  onCerrarReprogramar,
  onReprogramarCita,
}: CalendarioViewProps) => {
  return (
    <div className="h-[calc(100vh-100px)] flex flex-col space-y-4 p-4">
      <div className="card-modern h-full p-4 flex flex-col shadow-xl">
        <Calendar
          localizer={localizer}
          events={eventos}
          startAccessor="start"
          endAccessor="end"
          className="h-[calc(100vh-220px)]"
          view={vista}
          onView={onNavigateVista}
          date={fecha}
          onNavigate={onNavigateFecha}
          culture='es'
          min={new Date(new Date().getFullYear(), 0, 1, 8, 0, 0)}
          max={new Date(new Date().getFullYear(), 0, 1, 20, 0, 0)}
          scrollToTime={scrollToTime}
          components={{
            event: vista === Views.MONTH ? CustomEventMonth : CustomEventDay,
            toolbar: (props) => (
              <CustomToolbar
                {...props}
                onNuevaCita={onNuevaCita}
              />
            )
          }}
          onSelectEvent={onSelectEvent}
          onSelectSlot={onSelectSlot}
          eventPropGetter={eventStyleGetter}
          selectable
          messages={{
            next: 'Siguiente',
            previous: 'Anterior',
            today: 'Hoy',
            month: 'Mes',
            week: 'Semana',
            day: 'Dia',
            agenda: 'Agenda',
            date: 'Fecha',
            time: 'Hora',
            event: 'Evento',
            noEventsInRange: 'No hay citas en este rango',
          }}
        />
      </div>

      {modalNuevaCitaAbierto && (
        <ModalNuevaCita
          isOpen={modalNuevaCitaAbierto}
          onClose={onCerrarNuevaCita}
          fechaInicial={fechaInicialNuevaCita}
          onSubmit={onCrearCita}
        />
      )}

      {citaSeleccionada && (
        <ModalDetalle
          event={citaSeleccionada}
          onClose={onCerrarDetalle}
          onReprogramar={onReprogramarDesdeDetalle}
          onNoAsistio={onNoAsistio}
          onGuardarDescripcion={onGuardarDescripcion}
        />
      )}

      {modalReprogramarAbierto && citaReprogramar && (
        <ModalReprogramar
          isOpen={modalReprogramarAbierto}
          onClose={onCerrarReprogramar}
          cita={citaReprogramar}
          onSubmit={onReprogramarCita}
        />
      )}
    </div>
  );
};

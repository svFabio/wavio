import type { EventoCalendario } from '../types';

export const CustomEventDay = ({ event }: { event: EventoCalendario }) => {
  const { title, resource } = event;

  const getDotColor = () => {
    switch (resource?.estado) {
      case 'CONFIRMADA': return 'bg-success';
      case 'VALIDAR': return 'bg-warning';
      case 'PENDIENTE_PAGO': return 'bg-info';
      default: return 'bg-primary';
    }
  };

  return (
    <div className="flex flex-col justify-center h-full px-2 py-1 gap-0.5">
      <div className="flex items-center gap-1.5">
        <span className={`w-2 h-2 rounded-full shrink-0 ${getDotColor()}`} />
        <span className="text-xs font-bold text-txt leading-tight truncate">
          {title}
        </span>
      </div>
      {resource?.servicio && (
        <span className="text-[11px] text-txt-secondary leading-tight pl-3.5 truncate">
          {resource.servicio}
        </span>
      )}
    </div>
  );
};

import type { EventoCalendario } from '../types';

export const CustomEventDay = ({ event }: { event: EventoCalendario }) => {
  const { title, resource } = event;

  return (
    <div className="flex flex-col justify-center h-full px-2 py-1 bg-surface-elevated/50 backdrop-blur-sm rounded-r-md">
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-bold text-txt leading-tight truncate">{title}</span>
      </div>
      {resource?.servicio && (
        <span className="text-[10px] text-txt-muted font-medium leading-tight truncate mt-0.5">
          {resource.servicio}
        </span>
      )}
    </div>
  );
};

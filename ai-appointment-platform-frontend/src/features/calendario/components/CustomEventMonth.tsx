import type { EventoCalendario } from '../types';

export const CustomEventMonth = ({ event }: { event: EventoCalendario }) => {
  const count = event.resource?.count || 1;
  return (
    <>
      <span className="hidden md:flex items-center justify-center gap-1.5 w-full">
        <span className="flex items-center gap-1.5 text-xs font-semibold text-txt-secondary truncate leading-tight">
          <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
          {event.title}
        </span>
      </span>
      <span className="md:hidden flex items-center justify-center gap-[3px] w-full py-0.5">
        {Array.from({ length: Math.min(count, 5) }).map((_, i) => (
          <span key={`dot-${i}`} className="w-[5px] h-[5px] rounded-full bg-primary" />
        ))}
        {count > 5 && (
          <span className="text-[9px] text-primary font-bold leading-none ml-0.5">+</span>
        )}
      </span>
    </>
  );
};

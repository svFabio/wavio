import type { EventoCalendario } from '../types';

export const CustomEventMonth = ({ event }: { event: EventoCalendario }) => {
  const count = event.resource?.count || 1;
  return (
    <>
      <span className="hidden md:inline-flex items-center justify-center gap-1 text-[11px] font-semibold text-txt-secondary w-full">
        <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 inline-block" />
        <span>{event.title}</span>
      </span>
      <span className="md:hidden inline-flex items-center justify-center gap-0.5 w-full">
        {Array.from({ length: Math.min(count, 4) }).map((_, i) => (
          <span key={i} className="w-[6px] h-[6px] rounded-full bg-primary inline-block" />
        ))}
        {count > 4 && <span className="text-[9px] text-primary font-bold leading-none">+</span>}
      </span>
    </>
  );
};

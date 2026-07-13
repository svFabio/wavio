export interface RecursoEvento {
  estado?: string;
  telefono?: string;
  tipo?: 'resumen' | 'cita';
  count?: number;
  servicio?: string;
  origen?: string;
  descripcion?: string;
  citaId?: string;
}

export interface EventoCalendario {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  resource?: RecursoEvento;
}

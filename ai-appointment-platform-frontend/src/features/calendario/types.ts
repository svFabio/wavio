export interface RecursoEvento {
  tipo: 'resumen' | 'cita';
  estado: string;
  estadoPago?: string;
  telefono?: string;
  servicio?: string;
  servicioId?: number;
  origen?: string;
  descripcion?: string;
  count?: number;
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

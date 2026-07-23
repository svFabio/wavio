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

export interface DatosNuevaCita {
  clienteNombre: string;
  clienteTelefono: string;
  fecha: string;
  horario: string;
  servicioId?: number;
  staffId?: number;
  esRecurrente?: boolean;
  recurrence?: 'weekly' | 'biweekly' | 'monthly';
  recurrenceEnd?: string;
}

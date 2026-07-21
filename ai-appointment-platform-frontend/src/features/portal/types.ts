import type { Cita } from '../../types';

export interface PortalCliente {
  id: number;
  nombre: string;
  telefono: string;
  email: string | null;
}

export interface PortalNegocio {
  id: number;
  nombre: string;
}

export interface PortalValidation {
  cliente: PortalCliente;
  negocio: PortalNegocio;
}

export type PortalCita = Cita;

export interface PortalServicio {
  id: number;
  nombre: string;
  duracionMinutos: number;
  precio: number;
}

export interface BookAppointmentPayload {
  fecha: string;
  horario: string;
  servicioId?: number;
}

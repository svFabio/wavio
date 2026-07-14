export interface Servicio {
  id: number;
  nombre: string;
  duracionMinutos: number;
  bufferMinutos: number;
  precio: number;
  activo: boolean;
}

export interface HorarioNegocio {
  id: number;
  diaSemana: number; // 0=domingo, 1=lunes, ..., 6=sabado
  horaInicio: string;
  horaFin: string;
  activo: boolean;
}

export interface HorarioEspecial {
  id: number;
  fecha: string;
  cerrado: boolean;
  horaInicio: string | null;
  horaFin: string | null;
}

export type Tab = 'general' | 'servicios' | 'horarios';

export interface ConfigData {
  id: number;
  trigger: string;
  mensajeBienvenida: string;
  mensajeConfirmacion: string;
  cobrarAdelanto: boolean;
  porcentajeAdelanto: number;
  timezone: string;
}

export const DIAS_SEMANA = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Lunes' },
  { value: 2, label: 'Martes' },
  { value: 3, label: 'Miercoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
  { value: 6, label: 'Sabado' },
] as const;

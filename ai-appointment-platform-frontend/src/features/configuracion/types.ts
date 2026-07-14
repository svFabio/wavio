export interface Servicio {
  _key: number;
  nombre: string;
  precio: number;
}

export type Horarios = Record<string, string[]>;

export type Tab = 'general' | 'servicios' | 'horarios';

export interface ConfigData {
  id: number;
  trigger: string;
  mensajeBienvenida: string;
  mensajeConfirmacion: string;
  servicios: Servicio[];
  horarios: Record<string, string[]>;
  cobrarAdelanto: boolean;
  porcentajeAdelanto: number;
}

export const DIAS = [
  'lunes',
  'martes',
  'miercoles',
  'jueves',
  'viernes',
  'sabado',
  'domingo',
] as const;

export const DIAS_LABEL: Record<string, string> = {
  lunes: 'Lunes',
  martes: 'Martes',
  miercoles: 'Miercoles',
  jueves: 'Jueves',
  viernes: 'Viernes',
  sabado: 'Sabado',
  domingo: 'Domingo',
};

export const makeServicio = (): Servicio => ({
  _key: Date.now() + Math.random(),
  nombre: '',
  precio: 0,
});

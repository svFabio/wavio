export type WaitlistEstado = 'PENDIENTE' | 'NOTIFICADA' | 'CONFIRMADA' | 'CANCELADA';

export interface WaitlistEntry {
  id: number;
  clienteNombre: string;
  clienteTelefono: string;
  servicioId: number | null;
  fechaPreferida: string;
  horarioPreferido: string | null;
  estado: WaitlistEstado;
  creadoEn: string;
  notificadoEn: string | null;
}

export interface AddToWaitlistPayload {
  clienteNombre: string;
  clienteTelefono: string;
  servicioId?: number;
  fechaPreferida: string;
  horarioPreferido?: string;
}

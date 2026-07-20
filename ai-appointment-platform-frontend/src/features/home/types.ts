export interface CitaResumen {
  id: string;
  clienteNombre: string | null;
  clienteTelefono: string;
  horario: string;
  estado: string;
  servicio?: string;
  rating?: number;
}

export interface ResumenData {
  totalHoy: number;
  pendientes: number;
  completadas: number;
  ingresos: number;
}

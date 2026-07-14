export interface CitaResumen {
  id: number;
  clienteNombre: string | null;
  clienteTelefono: string;
  horario: string;
  estado: string;
  servicio?: string;
  rating?: number;
}

export interface ResumenData {
  citasHoy: number;
  pendientes: number;
  proximasCitas: CitaResumen[];
  totalFuturas: number;
}

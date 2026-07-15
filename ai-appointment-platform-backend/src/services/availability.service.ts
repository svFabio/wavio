import { prisma } from '../repositories/prisma';
import { ValidationError } from '../domain/errors';
import pino from 'pino';

const logger = pino({ name: 'availability-service' });

export interface Slot {
  inicio: string;
  fin: string;
  staffId: number | null;
}

interface DisponibilidadParams {
  negocioId: number;
  servicioId: number;
  fecha: string;
  staffId?: number;
  timezone?: string;
}

/**
 * Genera los slots disponibles reales para un negocio, servicio y fecha.
 *
 * Cruza:
 * 1. Servicio (duración + buffer)
 * 2. HorarioEspecial (feriados / días extendidos)
 * 3. HorarioNegocio (rangos regulares por día de semana)
 * 4. HorarioStaff (si se pide staff específico)
 * 5. Citas existentes (resta ocupados)
 * 6. Hora actual (si es hoy, filtra pasados)
 */
export async function getSlotsDisponibles(params: DisponibilidadParams): Promise<Slot[]> {
  const { negocioId, servicioId, fecha, staffId, timezone = 'America/La_Paz' } = params;

  if (!fecha || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    throw new ValidationError('Formato de fecha inválido. Use YYYY-MM-DD');
  }

  const [year, month, day] = fecha.split('-').map(Number);
  const fechaDate = new Date(year, month - 1, day);
  fechaDate.setHours(0, 0, 0, 0);

  const diaSemana = fechaDate.getDay();

  // ── 1. Cargar servicio ────────────────────────────────────────────────
  const servicio = await prisma.servicio.findFirst({
    where: { id: servicioId, negocioId, activo: true },
  });

  if (!servicio) {
    throw new ValidationError('Servicio no encontrado o inactivo');
  }

  const duracionMin = servicio.duracionMinutos;
  const bufferMin = servicio.bufferMinutos;

  // ── 2. Verificar horario especial ─────────────────────────────────────
  const especial = await prisma.horarioEspecial.findFirst({
    where: { negocioId, fecha: fechaDate },
  });

  if (especial?.cerrado) {
    return [];
  }

  // ── 3. Determinar rangos del día ─────────────────────────────────────
  type Rango = { horaInicio: string; horaFin: string };
  let rangos: Rango[] = [];

  if (especial && especial.horaInicio && especial.horaFin) {
    // Día especial con horario propio
    rangos = [{ horaInicio: especial.horaInicio, horaFin: especial.horaFin }];
  } else {
    // Horarios regulares del negocio
    const horariosNegocio = await prisma.horarioNegocio.findMany({
      where: { negocioId, diaSemana, activo: true },
    });

    rangos = horariosNegocio.map((h) => ({
      horaInicio: h.horaInicio,
      horaFin: h.horaFin,
    }));
  }

  if (rangos.length === 0) {
    return [];
  }

  // ── 4. Intersectar con horario de staff (si se especifica) ───────────
  if (staffId) {
    const horarioStaff = await prisma.horarioStaff.findFirst({
      where: { usuarioId: staffId, diaSemana, activo: true },
    });

    if (!horarioStaff) {
      return [];
    }

    // Intersectar: solo quedan los rangos que están dentro del horario del staff
    rangos = rangos.filter(
      (r) => r.horaInicio < horarioStaff.horaFin && r.horaFin > horarioStaff.horaInicio,
    );

    // Recortar a los límites del staff
    rangos = rangos.map((r) => ({
      horaInicio: r.horaInicio < horarioStaff.horaInicio ? horarioStaff.horaInicio : r.horaInicio,
      horaFin: r.horaFin > horarioStaff.horaFin ? horarioStaff.horaFin : r.horaFin,
    }));
  }

  // ── 5. Generar slots desde rangos ────────────────────────────────────
  const slotDuration = duracionMin + bufferMin;
  const todosLosSlots: Slot[] = [];

  for (const rango of rangos) {
    const slotsDelRango = generarSlotsDesdeRango(
      rango.horaInicio,
      rango.horaFin,
      duracionMin,
      slotDuration,
    );

    for (const slot of slotsDelRango) {
      todosLosSlots.push({
        inicio: slot,
        fin: sumarMinutos(slot, duracionMin),
        staffId: staffId ?? null,
      });
    }
  }

  if (todosLosSlots.length === 0) {
    return [];
  }

  // ── 6. Restar citas existentes ──────────────────────────────────────
  const inicioDia = new Date(year, month - 1, day, 0, 0, 0, 0);
  const finDia = new Date(year, month - 1, day, 23, 59, 59, 999);

  const whereCitas: Record<string, unknown> = {
    negocioId,
    fecha: { gte: inicioDia, lte: finDia },
    estado: { notIn: ['CANCELADA'] },
  };

  if (staffId) {
    whereCitas.staffId = staffId;
  }

  const citasExistentes = await prisma.cita.findMany({
    where: whereCitas,
    select: { horario: true, duracionMinutos: true },
  });

  // Construir mapa de minutos ocupados por cada staff (o global)
  const minutosOcupados = new Set<number>();
  for (const cita of citasExistentes) {
    const [h, m] = cita.horario.split(':').map(Number);
    const inicioMin = h * 60 + m;
    const finMin = inicioMin + cita.duracionMinutos;
    for (let min = inicioMin; min < finMin; min++) {
      minutosOcupados.add(min);
    }
  }

  const disponibles = todosLosSlots.filter((slot) => {
    const [h, m] = slot.inicio.split(':').map(Number);
    const slotInicioMin = h * 60 + m;
    const slotFinMin = slotInicioMin + duracionMin;

    // Verificar que ningún minuto del slot está ocupado
    for (let min = slotInicioMin; min < slotFinMin; min++) {
      if (minutosOcupados.has(min)) return false;
    }
    return true;
  });

  // ── 7. Filtrar slots pasados si es hoy ───────────────────────────────
  const ahora = new Date(new Date().toLocaleString('en-US', { timeZone: timezone }));
  const esHoy =
    ahora.getFullYear() === year && ahora.getMonth() === month - 1 && ahora.getDate() === day;

  if (esHoy) {
    const minutoActual = ahora.getHours() * 60 + ahora.getMinutes();
    return disponibles.filter((slot) => {
      const [h, m] = slot.inicio.split(':').map(Number);
      return h * 60 + m > minutoActual;
    });
  }

  return disponibles;
}

/**
 * Genera una lista de horarios de inicio dentro de un rango.
 * Ejemplo: generarSlotsDesdeRango("09:00", "12:00", 60, 70)
 * → ["09:00", "10:10"] (09:00+60=10:00, +10buffer=10:10, 10:10+60=11:10, 11:10+10=11:20, 11:20+60=12:20 > 12:00 → para)
 */
function generarSlotsDesdeRango(
  horaInicio: string,
  horaFin: string,
  duracionMin: number,
  slotDuration: number, // duracionMin + buffer
): string[] {
  const [hInicio, mInicio] = horaInicio.split(':').map(Number);
  const [hFin, mFin] = horaFin.split(':').map(Number);

  const inicioMin = hInicio * 60 + mInicio;
  const finMin = hFin * 60 + mFin;

  const slots: string[] = [];
  let actual = inicioMin;

  while (actual + duracionMin <= finMin) {
    slots.push(minutesToTimeString(actual));
    actual += slotDuration;
  }

  return slots;
}

/**
 * Suma minutos a un horario string y retorna HH:mm.
 */
function sumarMinutos(hora: string, minutos: number): string {
  const [h, m] = hora.split(':').map(Number);
  const total = h * 60 + m + minutos;
  const newH = Math.floor(total / 60) % 24;
  const newM = total % 60;
  return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
}

/**
 * Convierte minutos a string HH:mm.
 */
function minutesToTimeString(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

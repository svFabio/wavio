import { Injectable } from '@nestjs/common';
import { AvailabilityRepository } from './availability.repository';
import { ValidationError } from '../domain/errors';
import type { Slot, DisponibilidadParams } from '../domain/types';

export type { Slot, DisponibilidadParams };

@Injectable()
export class AvailabilityService {
  constructor(private readonly availabilityRepository: AvailabilityRepository) {}

  /**
   * Genera los slots disponibles reales para un negocio, servicio y fecha.
   */
  async getSlotsDisponibles(params: DisponibilidadParams): Promise<Slot[]> {
    const { negocioId, servicioId, fecha, staffId, timezone = 'America/La_Paz' } = params;

    if (!fecha || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      throw new ValidationError('Formato de fecha invalido. Use YYYY-MM-DD');
    }

    const fechaDate = new Date(`${fecha}T00:00:00.000Z`);
    const diaSemana = fechaDate.getUTCDay();

    // -- 1. Cargar servicio ------------------------------------------------
    const servicio = await this.availabilityRepository.findServicio(servicioId, negocioId);

    if (!servicio) {
      throw new ValidationError('Servicio no encontrado o inactivo');
    }

    const duracionMin = servicio.duracionMinutos;
    const bufferMin = servicio.bufferMinutos;

    // -- 2. Verificar horario especial --------------------------------------
    const especial = await this.availabilityRepository.findHorarioEspecial(negocioId, fechaDate);

    if (especial?.cerrado) {
      return [];
    }

    // -- 3. Determinar rangos del dia ---------------------------------------
    type Rango = { horaInicio: string; horaFin: string };
    let rangos: Rango[] = [];

    if (especial && especial.horaInicio && especial.horaFin) {
      rangos = [{ horaInicio: especial.horaInicio, horaFin: especial.horaFin }];
    } else {
      const horariosNegocio = await this.availabilityRepository.findHorariosNegocio(
        negocioId,
        diaSemana,
      );

      rangos = horariosNegocio.map((h) => ({
        horaInicio: h.horaInicio,
        horaFin: h.horaFin,
      }));
    }

    if (rangos.length === 0) {
      return [];
    }

    // -- 4. Intersectar con horario de staff (si se especifica) -------------
    if (staffId) {
      const horarioStaff = await this.availabilityRepository.findHorarioStaff(staffId, diaSemana);

      if (!horarioStaff) {
        return [];
      }

      rangos = rangos.filter(
        (r) => r.horaInicio < horarioStaff.horaFin && r.horaFin > horarioStaff.horaInicio,
      );

      rangos = rangos.map((r) => ({
        horaInicio: r.horaInicio < horarioStaff.horaInicio ? horarioStaff.horaInicio : r.horaInicio,
        horaFin: r.horaFin > horarioStaff.horaFin ? horarioStaff.horaFin : r.horaFin,
      }));
    }

    // -- 5. Generar slots desde rangos --------------------------------------
    const slotDuration = duracionMin + bufferMin;
    const todosLosSlots: Slot[] = [];

    for (const rango of rangos) {
      const slotsDelRango = this.generarSlotsDesdeRango(
        rango.horaInicio,
        rango.horaFin,
        duracionMin,
        slotDuration,
      );

      for (const slot of slotsDelRango) {
        todosLosSlots.push({
          inicio: slot,
          fin: this.sumarMinutos(slot, duracionMin),
          staffId: staffId ?? null,
        });
      }
    }

    if (todosLosSlots.length === 0) {
      return [];
    }

    // -- 6. Restar citas existentes -----------------------------------------
    const inicioDia = new Date(`${fecha}T00:00:00.000Z`);
    const finDia = new Date(`${fecha}T23:59:59.999Z`);

    const citasExistentes = await this.availabilityRepository.findCitasDelDia(
      negocioId,
      inicioDia,
      finDia,
      staffId,
    );

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

      for (let min = slotInicioMin; min < slotFinMin; min++) {
        if (minutosOcupados.has(min)) return false;
      }
      return true;
    });

    // -- 7. Filtrar slots pasados si es hoy ---------------------------------
    const hoyEnNegocio = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
    const esHoy = hoyEnNegocio === fecha;

    if (esHoy) {
      const timeParts = new Intl.DateTimeFormat('en-GB', {
        timeZone: timezone,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }).formatToParts(new Date());
      const hora = Number(timeParts.find((p) => p.type === 'hour')?.value ?? 0);
      const minuto = Number(timeParts.find((p) => p.type === 'minute')?.value ?? 0);
      const minutoActual = hora * 60 + minuto;
      return disponibles.filter((slot) => {
        const [h, m] = slot.inicio.split(':').map(Number);
        return h * 60 + m > minutoActual;
      });
    }

    return disponibles;
  }

  private generarSlotsDesdeRango(
    horaInicio: string,
    horaFin: string,
    duracionMin: number,
    slotDuration: number,
  ): string[] {
    const [hInicio, mInicio] = horaInicio.split(':').map(Number);
    const [hFin, mFin] = horaFin.split(':').map(Number);

    const inicioMin = hInicio * 60 + mInicio;
    const finMin = hFin * 60 + mFin;

    const slots: string[] = [];
    let actual = inicioMin;

    while (actual + duracionMin <= finMin) {
      slots.push(this.minutesToTimeString(actual));
      actual += slotDuration;
    }

    return slots;
  }

  private sumarMinutos(hora: string, minutos: number): string {
    const [h, m] = hora.split(':').map(Number);
    const total = h * 60 + m + minutos;
    const newH = Math.floor(total / 60) % 24;
    const newM = total % 60;
    return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
  }

  private minutesToTimeString(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { CitasRepository } from './citas.repository';
import { AvailabilityRepository } from './availability.repository';
import { NegocioService } from '../negocio/negocio.service';
import { ChatService } from '../chat/chat.service';
import { EventsService } from '../events/events.service';
import { NotFoundError, ConflictError, ValidationError } from '../domain/errors';
import { Cita, Slot, DisponibilidadParams } from '../domain/types';
import { getSlotsDisponibles } from '../scheduling/availability-engine';
import { AGENDA_LOOKBACK_DAYS, AGENDA_LOOKAHEAD_DAYS } from '../config';

@Injectable()
export class CitasService {
  private readonly logger = new Logger(CitasService.name);

  constructor(
    private readonly citasRepository: CitasRepository,
    private readonly availabilityRepository: AvailabilityRepository,
    private readonly negocioService: NegocioService,
    private readonly chatService: ChatService,
    private readonly eventsService: EventsService,
  ) {}

  async getPendientes(
    negocioId: number,
    page: number,
    limit: number,
  ): Promise<{
    data: Cita[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const result = await this.citasRepository.getPendientes(negocioId, page, limit);
    return {
      data: result.data,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / result.limit),
      },
    };
  }

  async validarCita(id: number, negocioId: number, accion: string): Promise<Cita> {
    const ACCIONES_VALIDAS = ['CONFIRMAR', 'APROBAR', 'CANCELAR', 'RECHAZAR'];
    if (!accion || !ACCIONES_VALIDAS.includes(accion)) {
      throw new ValidationError(
        `accion inválida. Valores permitidos: ${ACCIONES_VALIDAS.join(', ')}`,
      );
    }

    const cita = await this.citasRepository.getByIdAndNegocio(id, negocioId);
    if (!cita) throw new NotFoundError('Cita');

    const nuevoEstado = accion === 'CONFIRMAR' || accion === 'APROBAR' ? 'CONFIRMADA' : 'CANCELADA';
    const dataUpdate =
      nuevoEstado === 'CONFIRMADA'
        ? { estado: nuevoEstado }
        : { estado: nuevoEstado, comprobanteUrl: null };

    const citaActualizada = await this.citasRepository.update(id, dataUpdate);

    this.eventsService.emitCambioCitas(negocioId);

    try {
      let mensaje = '';
      if (nuevoEstado === 'CONFIRMADA') {
        const fechaFormateada = new Date(citaActualizada.fecha).toLocaleDateString('es-ES', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
        });
        mensaje =
          `¡Hola ${citaActualizada.clienteNombre || 'Cliente'}! 👋\n\n` +
          `✅ *Tu pago ha sido verificado y tu cita está CONFIRMADA.* 🎉\n\n` +
          `📋 *Detalles de tu cita:*\n` +
          `📅 Fecha: ${fechaFormateada}\n` +
          `⏰ Hora: ${citaActualizada.horario}\n` +
          `💆‍♀️ Servicio: ${citaActualizada.servicio || 'Spa'}\n\n` +
          `✨ ¡Te esperamos! Cualquier consulta, escríbenos.`;
      } else if (nuevoEstado === 'CANCELADA') {
        mensaje = `Hola ${citaActualizada.clienteNombre || 'Cliente'}. 😔\n\n❌ Tu cita ha sido cancelada.\n\nSi crees que es un error o deseas reagendar, por favor contáctanos.`;
      }

      if (mensaje) {
        const ultimoMsg = await this.chatService.getUltimoMensajeEntrantePorTelefono(
          negocioId,
          citaActualizada.clienteTelefono,
        );
        const jid = ultimoMsg?.remoteJid || citaActualizada.clienteTelefono;
        const waCreds = await this.negocioService.findByIdForInternal(negocioId);
        if (waCreds?.waAccessToken && waCreds.waPhoneNumberId) {
          await this.eventsService.sendWhatsAppMessage(
            { waAccessToken: waCreds.waAccessToken, waPhoneNumberId: waCreds.waPhoneNumberId },
            jid,
            mensaje,
          );
        }
      }
    } catch (msgError) {
      this.logger.error({ err: msgError }, '[Validar] Error enviando notificación WhatsApp');
    }

    return citaActualizada;
  }

  async getAgenda(
    negocioId: number,
    queryFecha?: string,
    queryDesde?: string,
    queryHasta?: string,
    page?: number,
    limit?: number,
  ): Promise<{
    data: Cita[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> {
    let desdeStr = queryDesde;
    let hastaStr = queryHasta;

    if (queryFecha && !desdeStr && !hastaStr) {
      desdeStr = `${queryFecha}T00:00:00.000Z`;
      hastaStr = `${queryFecha}T23:59:59.999Z`;
    }

    const fechaDesde = desdeStr
      ? new Date(desdeStr)
      : new Date(Date.now() - AGENDA_LOOKBACK_DAYS * 24 * 60 * 60 * 1000);
    const fechaHasta = hastaStr
      ? new Date(hastaStr)
      : new Date(Date.now() + AGENDA_LOOKAHEAD_DAYS * 24 * 60 * 60 * 1000);
    const p = page || 1;
    const l = limit || 20;
    const result = await this.citasRepository.getAgenda(negocioId, fechaDesde, fechaHasta, p, l);
    return {
      data: result.data,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / result.limit),
      },
    };
  }

  async getResumen(negocioId: number): Promise<{
    totalHoy: number;
    pendientes: number;
    completadas: number;
    ingresos: number;
  }> {
    const inicioHoy = new Date();
    inicioHoy.setHours(0, 0, 0, 0);
    const finHoy = new Date();
    finHoy.setHours(23, 59, 59, 999);

    const [totalHoy, pendientes, completadas, ingresos] = await Promise.all([
      this.citasRepository.getCitasCount(negocioId, {
        fecha: { gte: inicioHoy, lte: finHoy },
        estado: { notIn: ['CANCELADA'] },
      }),
      this.citasRepository.getCitasCount(negocioId, { estado: 'VALIDACION_PENDIENTE' }),
      this.citasRepository.getCitasCount(negocioId, {
        fecha: { gte: inicioHoy, lte: finHoy },
        estado: 'CONFIRMADA',
      }),
      this.citasRepository.getSumaIngresosHoy(negocioId, inicioHoy, finHoy),
    ]);

    return { totalHoy, pendientes, completadas, ingresos };
  }

  /**
   * Obtiene los horarios disponibles usando el availability engine.
   * Retorna un array de strings "HH:mm" para backward compatibility con el frontend.
   */
  async getHorariosDisponibles(
    negocioId: number,
    fechaStr: string,
    servicioId?: number,
    staffId?: number,
  ): Promise<string[]> {
    if (!fechaStr) throw new ValidationError('Fecha requerida');

    let resolvedServicioId = servicioId;
    if (!resolvedServicioId) {
      const primerServicio = await this.availabilityRepository.findPrimerServicioActivo(negocioId);
      if (!primerServicio) {
        throw new ValidationError('No hay servicios configurados para este negocio');
      }
      resolvedServicioId = primerServicio.id;
    }

    const config = await this.negocioService.getConfiguracion(negocioId);
    const slots = await getSlotsDisponibles(this.availabilityRepository, {
      negocioId,
      servicioId: resolvedServicioId,
      fecha: fechaStr,
      staffId,
      timezone: config.timezone,
    });

    return slots.map((s) => s.inicio);
  }

  async crearCitaAdmin(
    negocioId: number,
    data: {
      clienteNombre: string;
      clienteTelefono: string;
      fecha: string;
      horario: string;
      monto?: number;
      servicioId?: number | null;
      staffId?: number | null;
      duracionMinutos?: number;
      estado?: string;
      origen?: string;
      recurrence?: string;
      recurrenceId?: string;
      recurrenceEnd?: Date;
    },
  ): Promise<Cita> {
    const { clienteNombre, clienteTelefono, fecha, horario } = data;
    const monto = data.monto ?? 0;
    const servicioId = data.servicioId ?? null;
    const staffId = data.staffId ?? null;
    const duracionMinutos = data.duracionMinutos ?? 60;

    let montoFinal = monto;
    const estadoPago = 'PENDIENTE';
    if (servicioId && montoFinal === 0) {
      const servicio = await this.availabilityRepository.findServicio(servicioId, negocioId);
      if (servicio) {
        montoFinal = servicio.precio;
      }
    }

    const [year, month, day] = fecha.split('-').map(Number);
    const fechaCita = new Date(year, month - 1, day);

    if (servicioId) {
      const slots = await getSlotsDisponibles(this.availabilityRepository, {
        negocioId,
        servicioId,
        fecha,
        staffId: staffId ?? undefined,
      });

      const slotValido = slots.find((s) => s.inicio === horario);
      if (!slotValido) {
        throw new ValidationError(`Horario ${horario} no está disponible para la fecha ${fecha}`);
      }
    }

    const [horas, minutos] = horario.split(':').map(Number);
    fechaCita.setHours(horas, minutos, 0, 0);

    const nuevaCita = await this.citasRepository.createIfSlotAvailable(
      negocioId,
      fechaCita,
      horario,
      {
        clienteNombre,
        clienteTelefono,
        monto: montoFinal,
        estado: data.estado ?? 'CONFIRMADA',
        estadoPago,
        origen: data.origen ?? 'presencial',
        servicioId: servicioId ?? undefined,
        duracionMinutos,
        staffId: staffId ?? undefined,
        recurrence: data.recurrence ?? undefined,
        recurrenceId: data.recurrenceId ?? undefined,
        recurrenceEnd: data.recurrenceEnd ?? undefined,
      },
    );

    if (!nuevaCita) {
      throw new ConflictError('Este horario ya está ocupado');
    }

    this.eventsService.emitCambioCitas(negocioId);
    this.eventsService.emitNuevaCita(negocioId, {
      id: nuevaCita.id,
      clienteNombre,
      clienteTelefono,
      fecha: fechaCita,
      horario,
    });

    return nuevaCita;
  }

  async reprogramarCita(
    id: number,
    negocioId: number,
    fecha: string,
    horario: string,
  ): Promise<Cita> {
    if (!fecha || !horario) throw new ValidationError('Fecha y horario son requeridos');
    const [year, month, day] = fecha.split('-').map(Number);
    const nuevaFecha = new Date(year, month - 1, day);

    const citaActual = await this.citasRepository.getByIdAndNegocio(id, negocioId);
    if (!citaActual) throw new NotFoundError('Cita');

    if (citaActual.servicioId) {
      const slots = await getSlotsDisponibles(this.availabilityRepository, {
        negocioId,
        servicioId: citaActual.servicioId,
        fecha,
        staffId: citaActual.staffId ?? undefined,
      });

      const slotValido = slots.find((s) => s.inicio === horario);
      if (!slotValido) {
        throw new ValidationError(`Horario ${horario} no está disponible para la fecha ${fecha}`);
      }
    }

    const [horas, minutos] = horario.split(':').map(Number);
    nuevaFecha.setHours(horas, minutos, 0, 0);

    const citaActualizada = await this.citasRepository.reprogramarIfSlotAvailable(
      id,
      negocioId,
      nuevaFecha,
      horario,
    );
    if (!citaActualizada) throw new ConflictError('Ese horario ya está ocupado.');

    this.eventsService.emitCambioCitas(negocioId);

    return citaActualizada;
  }

  async cambiarEstado(id: number, negocioId: number, estado: string): Promise<Cita> {
    const ESTADOS_VALIDOS = ['CONFIRMADA', 'CANCELADA', 'NO_ASISTIO', 'PENDIENTE'];
    if (!ESTADOS_VALIDOS.includes(estado)) {
      throw new ValidationError(
        `Estado inválido. Valores permitidos: ${ESTADOS_VALIDOS.join(', ')}`,
      );
    }

    const cita = await this.citasRepository.getByIdAndNegocio(id, negocioId);
    if (!cita) throw new NotFoundError('Cita');

    if (estado === 'NO_ASISTIO') {
      const ahora = new Date();
      const [year, month, day] = new Date(cita.fecha)
        .toISOString()
        .split('T')[0]
        .split('-')
        .map(Number);
      const fechaExacta = new Date(year, month - 1, day);
      const [horas, minutos] = cita.horario.split(':').map(Number);
      fechaExacta.setHours(horas, minutos, 0, 0);

      if (fechaExacta > ahora)
        throw new ValidationError('Solo se pueden marcar como "No Asistió" citas pasadas.');
    }

    const actualizada = await this.citasRepository.update(id, { estado });
    this.eventsService.emitCambioCitas(negocioId);
    return actualizada;
  }

  async actualizarDescripcion(id: number, negocioId: number, descripcion: string): Promise<Cita> {
    const cita = await this.citasRepository.getByIdAndNegocio(id, negocioId);
    if (!cita) throw new NotFoundError('Cita');
    return this.citasRepository.update(id, { descripcion: descripcion || null });
  }

  async crearCitaRecurente(
    negocioId: number,
    data: {
      clienteNombre: string;
      clienteTelefono: string;
      fecha: string;
      horario: string;
      monto?: number;
      servicioId?: number | null;
      staffId?: number | null;
      duracionMinutos?: number;
      recurrence: 'weekly' | 'biweekly' | 'monthly';
      recurrenceEnd: string;
    },
  ): Promise<{ base: Cita; instancesCreated: number }> {
    const recurrenceId = `rec-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const recurrenceEndDate = new Date(data.recurrenceEnd);

    // Create the base appointment
    const baseCita = await this.crearCitaAdmin(negocioId, {
      ...data,
      recurrence: data.recurrence,
      recurrenceId,
      recurrenceEnd: recurrenceEndDate,
    });

    // Generate future instances
    const instances: Array<{ fecha: string; horario: string }> = [];
    const baseDate = new Date(baseCita.fecha);

    const nextDate = new Date(baseDate);
    const maxInstances = 52; // Max 1 year of weekly appointments

    for (let i = 0; i < maxInstances; i++) {
      // Calculate next date based on recurrence type
      switch (data.recurrence) {
        case 'weekly':
          nextDate.setDate(nextDate.getDate() + 7);
          break;
        case 'biweekly':
          nextDate.setDate(nextDate.getDate() + 14);
          break;
        case 'monthly':
          nextDate.setMonth(nextDate.getMonth() + 1);
          break;
      }

      // Stop if past end date
      if (nextDate > recurrenceEndDate) break;

      const fechaStr = nextDate.toISOString().split('T')[0];

      if (data.servicioId) {
        const slots = await getSlotsDisponibles(this.availabilityRepository, {
          negocioId,
          servicioId: data.servicioId,
          fecha: fechaStr,
          staffId: data.staffId ?? undefined,
        });

        const slotValido = slots.find((s) => s.inicio === data.horario);
        if (!slotValido) {
          this.logger.warn(`Horario ${data.horario} no disponible para la fecha ${fechaStr}, omitiendo instancia recurrente.`);
          continue; // Skip this instance
        }
      }

      instances.push({
        fecha: fechaStr,
        horario: data.horario,
      });
    }

    // Create instances in batch
    if (instances.length > 0) {
      await this.citasRepository.createRecurringInstances(
        instances.map((inst) => ({
          fecha: new Date(inst.fecha),
          horario: inst.horario,
          clienteNombre: data.clienteNombre,
          clienteTelefono: data.clienteTelefono,
          servicioId: data.servicioId ?? null,
          staffId: data.staffId ?? null,
          duracionMinutos: data.duracionMinutos ?? 60,
          monto: data.monto ?? 0,
          estado: 'CONFIRMADA',
          estadoPago: 'PENDIENTE',
          origen: 'recurrente',
          recurrence: data.recurrence,
          recurrenceId,
          recurrenceEnd: recurrenceEndDate,
        })),
        negocioId,
      );
    }

    this.eventsService.emitCambioCitas(negocioId);

    return { base: baseCita, instancesCreated: instances.length };
  }

  async cancelarSerieRecurente(recurrenceId: string, negocioId: number): Promise<number> {
    const count = await this.citasRepository.cancelRecurringSeries(recurrenceId);
    this.eventsService.emitCambioCitas(negocioId);
    return count;
  }

  async getSeriesRecurente(recurrenceId: string): Promise<Cita[]> {
    return this.citasRepository.findRecurringSeries(recurrenceId);
  }

  async getByIdAndNegocio(id: number, negocioId: number): Promise<Cita | null> {
    return this.citasRepository.getByIdAndNegocio(id, negocioId);
  }

  async getSlotDisponibles(params: DisponibilidadParams): Promise<Slot[]> {
    return getSlotsDisponibles(this.availabilityRepository, params);
  }

  async updateLastAppointmentRating(negocioId: number, clienteTelefono: string, rating: number): Promise<boolean> {
    return this.citasRepository.updateLastAppointmentRating(negocioId, clienteTelefono, rating);
  }
}

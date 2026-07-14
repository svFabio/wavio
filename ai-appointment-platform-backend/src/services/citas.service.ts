import { citasRepository } from '../repositories/citas.repository';
import { configuracionRepository } from '../repositories/configuracion.repository';
import { chatRepository } from '../repositories/chat.repository';
import { negocioRepository } from '../repositories/negocio.repository';
import { NotFoundError, ConflictError, ValidationError } from '../domain/errors';
import { Cita } from '../domain/types';
import { enviarMensaje } from '../lib/whatsapp';
import { getSocket } from '../lib/socket';
import pino from 'pino';

const logger = pino();
const HORARIOS_DEFINIDOS = ['13:00', '14:00', '15:00', '16:00', '17:00'];
const DIAS_SEMANA = [
  'domingo',
  'lunes',
  'martes',
  'miercoles',
  'jueves',
  'viernes',
  'sabado',
] as const;

export const citasService = {
  async getPendientes(
    negocioId: number,
    page: number,
    limit: number,
  ): Promise<{
    data: Cita[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const result = await citasRepository.getPendientes(negocioId, page, limit);
    return {
      data: result.data,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / result.limit),
      },
    };
  },

  async validarCita(id: number, negocioId: number, accion: string): Promise<Cita> {
    const ACCIONES_VALIDAS = ['CONFIRMAR', 'APROBAR', 'CANCELAR', 'RECHAZAR'];
    if (!accion || !ACCIONES_VALIDAS.includes(accion)) {
      throw new ValidationError(
        `accion inválida. Valores permitidos: ${ACCIONES_VALIDAS.join(', ')}`,
      );
    }

    const cita = await citasRepository.getByIdAndNegocio(id, negocioId);
    if (!cita) throw new NotFoundError('Cita');

    const nuevoEstado = accion === 'CONFIRMAR' || accion === 'APROBAR' ? 'CONFIRMADA' : 'CANCELADA';
    const dataUpdate =
      nuevoEstado === 'CONFIRMADA'
        ? { estado: nuevoEstado }
        : { estado: nuevoEstado, comprobanteUrl: null };

    const citaActualizada = await citasRepository.update(id, dataUpdate);

    const io = getSocket();

    try {
      io.to(negocioId.toString()).emit('cambio-citas');
    } catch (e) {
      logger.warn('Socket no inicializado o error al emitir cambio-citas');
    }

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
        const ultimoMsg = await chatRepository.getUltimoMensajeEntrantePorTelefono(
          negocioId,
          citaActualizada.clienteTelefono,
        );
        const jid = ultimoMsg?.remoteJid || citaActualizada.clienteTelefono;
        const waCreds = await negocioRepository.findByIdForInternal(negocioId);
        if (waCreds?.waAccessToken && waCreds.waPhoneNumberId) {
          await enviarMensaje(
            { waAccessToken: waCreds.waAccessToken, waPhoneNumberId: waCreds.waPhoneNumberId },
            jid,
            mensaje,
          );
        }
      }
    } catch (msgError) {
      logger.error({ msgError }, '[Validar] Error enviando notificación WhatsApp');
    }

    return citaActualizada;
  },

  async getAgenda(
    negocioId: number,
    queryDesde?: string,
    queryHasta?: string,
    page?: number,
    limit?: number,
  ): Promise<{
    data: Cita[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const fechaDesde = queryDesde
      ? new Date(queryDesde)
      : new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
    const fechaHasta = queryHasta
      ? new Date(queryHasta)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const p = page || 1;
    const l = limit || 20;
    const result = await citasRepository.getAgenda(negocioId, fechaDesde, fechaHasta, p, l);
    return {
      data: result.data,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / result.limit),
      },
    };
  },

  async getResumen(negocioId: number): Promise<{
    citasHoy: number;
    pendientes: number;
    proximasCitas: Cita[];
    totalFuturas: number;
  }> {
    const inicioHoy = new Date();
    inicioHoy.setHours(0, 0, 0, 0);
    const finHoy = new Date();
    finHoy.setHours(23, 59, 59, 999);

    const [citasHoy, pendientes, totalFuturas, proximasCitas] = await Promise.all([
      citasRepository.getCitasCount(negocioId, {
        fecha: { gte: inicioHoy, lte: finHoy },
        estado: 'CONFIRMADA',
      }),
      citasRepository.getCitasCount(negocioId, { estado: 'VALIDACION_PENDIENTE' }),
      citasRepository.getCitasCount(negocioId, {
        fecha: { gte: new Date() },
        estado: { not: 'CANCELADA' },
      }),
      citasRepository.getProximasCitas(negocioId, inicioHoy, finHoy, 5),
    ]);

    return { citasHoy, pendientes, proximasCitas, totalFuturas };
  },

  async getHorariosDisponibles(negocioId: number, fechaStr: string): Promise<string[]> {
    if (!fechaStr) throw new ValidationError('Fecha requerida');

    const [year, month, day] = fechaStr.split('-').map(Number);
    const inicio = new Date(year, month - 1, day);
    inicio.setHours(0, 0, 0, 0);
    const fin = new Date(inicio);
    fin.setHours(23, 59, 59, 999);

    const ocupadas = await citasRepository.getOcupadas(negocioId, inicio, fin);
    const diaNombre = DIAS_SEMANA[inicio.getDay()];

    const config = await configuracionRepository.getOrCreateByNegocioId(negocioId);
    const horariosNegocio = config.horarios as Record<string, string[]> | undefined;
    const horariosPermitidos =
      (horariosNegocio && horariosNegocio[diaNombre]) || HORARIOS_DEFINIDOS;

    const horasOcupadas = ocupadas.map((c) => c.horario);
    let disponibles = horariosPermitidos.filter((h) => !horasOcupadas.includes(h));

    const ahora = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/La_Paz' }));
    const esHoy =
      ahora.getFullYear() === year && ahora.getMonth() === month - 1 && ahora.getDate() === day;

    if (esHoy) {
      const horaActual = ahora.getHours();
      const minutoActual = ahora.getMinutes();
      disponibles = disponibles.filter((horario) => {
        const [hora, minuto] = horario.split(':').map(Number);
        return hora > horaActual || (hora === horaActual && minuto > minutoActual);
      });
    }

    return disponibles;
  },

  async crearCitaAdmin(negocioId: number, data: Record<string, unknown>): Promise<Cita> {
    const clienteNombre = String(data.clienteNombre);
    const clienteTelefono = String(data.clienteTelefono);
    const fecha = String(data.fecha);
    const horario = String(data.horario);
    const monto = typeof data.monto === 'number' ? data.monto : 0;

    const [year, month, day] = fecha.split('-').map(Number);
    const fechaCita = new Date(year, month - 1, day);
    const diaNombre = DIAS_SEMANA[fechaCita.getDay()];

    const config = await configuracionRepository.getOrCreateByNegocioId(negocioId);
    const horariosNegocio = config.horarios as Record<string, string[]> | undefined;
    const horariosPermitidos =
      (horariosNegocio && horariosNegocio[diaNombre]) || HORARIOS_DEFINIDOS;

    if (!horariosPermitidos.includes(horario)) {
      throw new ValidationError(
        `Horario inválido para el día ${diaNombre}. Horarios disponibles: ${horariosPermitidos.join(', ')}`,
      );
    }

    const [horas, minutos] = horario.split(':').map(Number);
    fechaCita.setHours(horas, minutos, 0, 0);

    let nuevaCita;
    try {
      nuevaCita = await citasRepository.createIfSlotAvailable(negocioId, fechaCita, horario, {
        clienteNombre,
        clienteTelefono,
        monto,
        estado: 'CONFIRMADA',
        origen: 'presencial',
      });
    } catch (err) {
      if (err instanceof Error && err.message === 'SLOT_OCCUPIED') {
        throw new ConflictError('Este horario ya está ocupado. Por favor selecciona otro.');
      }
      throw err;
    }

    try {
      const io = getSocket();
      io.to(negocioId.toString()).emit('cambio-citas');
      io.to(negocioId.toString()).emit('nueva-cita', {
        id: nuevaCita.id,
        clienteNombre,
        clienteTelefono,
        fecha: fechaCita,
        horario,
      });
    } catch (e) {
      logger.warn({ err: e }, 'Socket error on create');
    }

    return nuevaCita;
  },

  async reprogramarCita(
    id: number,
    negocioId: number,
    fecha: string,
    horario: string,
  ): Promise<Cita> {
    if (!fecha || !horario) throw new ValidationError('Fecha y horario son requeridos');
    const [year, month, day] = fecha.split('-').map(Number);
    const nuevaFecha = new Date(year, month - 1, day);
    const diaNombre = DIAS_SEMANA[nuevaFecha.getDay()];

    const config = await configuracionRepository.getOrCreateByNegocioId(negocioId);
    const horariosNegocio = config.horarios as Record<string, string[]> | undefined;
    const horariosPermitidos =
      (horariosNegocio && horariosNegocio[diaNombre]) || HORARIOS_DEFINIDOS;

    if (!horariosPermitidos.includes(horario)) {
      throw new ValidationError(
        `Horario inválido para el día ${diaNombre}. Disponibles: ${horariosPermitidos.join(', ')}`,
      );
    }

    const [horas, minutos] = horario.split(':').map(Number);
    nuevaFecha.setHours(horas, minutos, 0, 0);

    const citaActual = await citasRepository.getByIdAndNegocio(id, negocioId);
    if (!citaActual) throw new NotFoundError('Cita');

    // Atomic check+update to prevent double-booking race condition
    const citaActualizada = await citasRepository.reprogramarIfSlotAvailable(
      id,
      negocioId,
      nuevaFecha,
      horario,
    );
    if (!citaActualizada) throw new ConflictError('Ese horario ya está ocupado.');

    try {
      getSocket().emit('cambio-citas');
    } catch (e) {
      logger.warn({ err: e }, 'Socket error on reprogramar');
    }

    return citaActualizada;
  },

  async cambiarEstado(id: number, negocioId: number, estado: string): Promise<Cita> {
    const ESTADOS_VALIDOS = ['CONFIRMADA', 'CANCELADA', 'NO_ASISTIO', 'PENDIENTE'];
    if (!ESTADOS_VALIDOS.includes(estado)) {
      throw new ValidationError(
        `Estado inválido. Valores permitidos: ${ESTADOS_VALIDOS.join(', ')}`,
      );
    }

    const cita = await citasRepository.getByIdAndNegocio(id, negocioId);
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

    const actualizada = await citasRepository.update(id, { estado });
    try {
      getSocket().emit('cambio-citas');
    } catch (e) {
      logger.warn({ err: e }, 'Socket error on cambiarEstado');
    }
    return actualizada;
  },

  async actualizarDescripcion(id: number, negocioId: number, descripcion: string): Promise<Cita> {
    const cita = await citasRepository.getByIdAndNegocio(id, negocioId);
    if (!cita) throw new NotFoundError('Cita');
    return citasRepository.update(id, { descripcion: descripcion || null });
  },
};

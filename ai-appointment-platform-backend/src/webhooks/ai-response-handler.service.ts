import { Injectable } from '@nestjs/common';
import { CitasService } from '../citas/citas.service';
import { ChatService } from '../chat/chat.service';
import type { ContextoConversacion } from '../chat/ai-engine';
import { enviarMensaje, enviarImagen } from '../lib/whatsapp';
import type { Negocio, Configuracion, Servicio } from '../domain/types';
import { createLogger } from '../lib/logger';

const logger = createLogger('ai-response-handler');

interface NegocioCache {
  servicios: Servicio[];
  config: Configuracion;
}

@Injectable()
export class AIResponseHandlerService {
  constructor(
    private readonly citasService: CitasService,
    private readonly chatService: ChatService,
  ) {}

  async handleResponse(
    negocio: Negocio,
    from: string,
    resultadoIA: {
      intencion: string;
      respuestaSugerida?: string;
      entidades?: Record<string, string | undefined>;
    },
    contexto: ContextoConversacion,
    cached: NegocioCache,
  ): Promise<void> {
    const waCreds = {
      waAccessToken: negocio.waAccessToken ?? '',
      waPhoneNumberId: negocio.waPhoneNumberId ?? '',
    };

    if (resultadoIA.intencion === 'AGENDAR' && contexto.estado === 'CONFIRMANDO_FECHA') {
      await this.handleAgendarFlow(negocio, from, contexto, cached, waCreds);
    } else if (resultadoIA.respuestaSugerida) {
      await enviarMensaje(waCreds, from, resultadoIA.respuestaSugerida);
    } else {
      await enviarMensaje(waCreds, from, 'He recibido tu mensaje.');
    }
  }

  private async handleAgendarFlow(
    negocio: Negocio,
    from: string,
    contexto: ContextoConversacion,
    cached: NegocioCache,
    waCreds: { waAccessToken: string; waPhoneNumberId: string },
  ): Promise<void> {
    const fechaRaw = contexto.datos.fecha;
    const fechaStr =
      fechaRaw instanceof Date
        ? fechaRaw.toISOString().split('T')[0]
        : fechaRaw
          ? String(fechaRaw)
          : undefined;
    const horario = contexto.datos.horario;
    const nombre = contexto.datos.nombre;

    if (fechaStr && horario && nombre) {
      await this.createAppointment(negocio, from, contexto, cached, fechaStr, horario, nombre, waCreds);
    } else if (fechaStr && horario) {
      await enviarMensaje(waCreds, from, '¿Cuál es tu nombre para completar la reserva?');
      contexto.estado = 'ESPERANDO_NOMBRE';
    } else if (fechaStr) {
      await this.offerTimeSlots(negocio, from, contexto, cached, fechaStr, waCreds);
    } else {
      await this.offerServices(from, cached, waCreds);
    }
  }

  private async createAppointment(
    negocio: Negocio,
    from: string,
    contexto: ContextoConversacion,
    cached: NegocioCache,
    fechaStr: string,
    horario: string,
    nombre: string,
    waCreds: { waAccessToken: string; waPhoneNumberId: string },
  ): Promise<void> {
    try {
      const nuevaCita = await this.citasService.crearCitaAdmin(negocio.id, {
        clienteNombre: nombre,
        clienteTelefono: from,
        fecha: fechaStr,
        horario,
        servicioId: undefined,
        monto: 0,
        estado: 'VALIDACION_PENDIENTE',
        origen: 'whatsapp',
      });

      const { cobrarAdelanto, porcentajeAdelanto, qrFotoUrl } = cached.config;

      let confirmationMsg =
        `¡Tu cita ha sido creada! 🎉\n\n` +
        `📋 *Detalles:*\n` +
        `📅 Fecha: ${fechaStr}\n` +
        `⏰ Hora: ${horario}\n` +
        `👤 Nombre: ${nombre}\n\n`;

      if (cobrarAdelanto && nuevaCita.monto > 0) {
        const anticipo = Math.round((nuevaCita.monto * porcentajeAdelanto) / 100);
        confirmationMsg +=
          `💰 *Adelanto requerido:* $${anticipo} (${porcentajeAdelanto}% de $${nuevaCita.monto})\n` +
          `Por favor envía tu comprobante de pago para confirmar tu cita.`;
      } else {
        confirmationMsg += `Estado: Pendiente de validación. Te notificaremos cuando sea confirmada.`;
      }

      await enviarMensaje(waCreds, from, confirmationMsg);

      if (cobrarAdelanto && nuevaCita.monto > 0 && qrFotoUrl) {
        const anticipo = Math.round((nuevaCita.monto * porcentajeAdelanto) / 100);
        await enviarImagen(
          waCreds,
          from,
          qrFotoUrl,
          `Escanea este QR para pagar tu adelanto de $${anticipo}`,
        );
      }

      contexto.estado = 'INICIO';
      contexto.datos = {};
    } catch (err) {
      logger.error({ err }, '[Webhook] Error creando cita');
      await enviarMensaje(
        waCreds,
        from,
        'Lo siento, hubo un problema al agendar tu cita. ¿Podrías intentar con otro horario?',
      );
    }
  }

  private async offerTimeSlots(
    negocio: Negocio,
    from: string,
    contexto: ContextoConversacion,
    cached: NegocioCache,
    fechaStr: string,
    waCreds: { waAccessToken: string; waPhoneNumberId: string },
  ): Promise<void> {
    try {
      const fallbackServicioId = cached.servicios[0]?.id;
      if (!fallbackServicioId) {
        await enviarMensaje(waCreds, from, '¿Qué servicio deseas agendar?');
        contexto.estado = 'ESPERANDO_SERVICIO';
        return;
      }

      const slots = await this.citasService.getSlotDisponibles({
        negocioId: negocio.id,
        servicioId: fallbackServicioId,
        fecha: fechaStr,
      });

      if (slots.length === 0) {
        await enviarMensaje(
          waCreds,
          from,
          `Lo siento, no hay horarios disponibles para el ${fechaStr}. ¿Te gustaría probar con otra fecha?`,
        );
      } else {
        const horariosStr = slots
          .slice(0, 5)
          .map((s) => `• ${s.inicio}`)
          .join('\n');
        await enviarMensaje(
          waCreds,
          from,
          `Horarios disponibles para el ${fechaStr}:\n\n${horariosStr}\n\n¿Cuál prefieres?`,
        );
        contexto.estado = 'ESPERANDO_HORA';
      }
    } catch (err) {
      logger.error({ err }, '[Webhook] Error obteniendo slots');
      await enviarMensaje(waCreds, from, '¿Para qué hora te gustaría tu cita?');
    }
  }

  private async offerServices(
    from: string,
    cached: NegocioCache,
    waCreds: { waAccessToken: string; waPhoneNumberId: string },
  ): Promise<void> {
    const listaServicios = cached.servicios
      .map((s) => `• ${s.nombre} ($${s.precio})`)
      .join('\n');
    await enviarMensaje(
      waCreds,
      from,
      `¡Hola! Para agendar tu cita, primero dime qué servicio deseas:\n\n${listaServicios}`,
    );
  }
}

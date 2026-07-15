import { chatRepository } from '../repositories/chat.repository';
import { negocioRepository } from '../repositories/negocio.repository';
import { sesionChatRepository } from '../repositories/sesionChat.repository';
import { configuracionRepository } from '../repositories/configuracion.repository';
import { enviarMensaje, enviarImagen } from '../lib/whatsapp';
import { procesarMensajeConIA, ContextoConversacion } from '../services/ai.service';
import { citasService } from '../services/citas.service';
import { getSlotsDisponibles } from '../services/availability.service';
import { serviciosRepository } from '../repositories/servicios.repository';
import { getSocket } from '../lib/socket';
import pino from 'pino';

const logger = pino({ name: 'webhook-service' });

export const webhookService = {
  async processWebhookPayload(body: Record<string, unknown>): Promise<void> {
    if (body.object !== 'whatsapp_business_account') return;
    if (!Array.isArray(body.entry) || body.entry.length === 0) return;

    for (const entry of body.entry) {
      if (!Array.isArray(entry.changes)) continue;

      for (const change of entry.changes) {
        const value = change.value as Record<string, any>;
        const metadata = value.metadata as Record<string, any> | undefined;
        const phoneNumberId = metadata?.phone_number_id as string | undefined;

        const messages = value.messages as Array<Record<string, any>> | undefined;
        if (messages && messages.length > 0) {
          for (const message of messages) {
            try {
              const from = message.from as string;

              if (message.type !== 'text') continue;
              const textBody = (message.text as Record<string, any>)?.body as string;
              const waMessageId = message.id as string;

              if (!phoneNumberId || !from || !textBody) continue;

              const negocio = await negocioRepository.findByWaPhoneNumberId(phoneNumberId);
              if (!negocio) {
                logger.warn(
                  { phoneNumberId },
                  '[Webhook] Mensaje para phoneNumberId no registrado',
                );
                continue;
              }

              const nuevoMensaje = await chatRepository.createMensaje({
                remoteJid: from,
                contenido: textBody,
                direccion: 'ENTRANTE',
                waMessageId,
                estadoEntrega: 'entregado',
                negocioId: negocio.id,
              });

              try {
                getSocket().to(negocio.id.toString()).emit('nuevo-mensaje', nuevoMensaje);
              } catch (e) {
                logger.warn({ err: e }, 'Socket error emitting nuevo-mensaje');
              }

              logger.info({ negocio: negocio.nombre, from }, '[Webhook] Mensaje recibido');

              const sessionJid = `${from}`;
              const sesion = await sesionChatRepository.findByJid(sessionJid, negocio.id);
              const contexto: ContextoConversacion = sesion
                ? {
                    estado: sesion.estado as ContextoConversacion['estado'],
                    datos: (sesion.datos as Record<string, unknown>) || {},
                    intentosAclaracion: 0,
                  }
                : { estado: 'INICIO', datos: {}, intentosAclaracion: 0 };

              const servicios = await serviciosRepository.findByNegocioId(negocio.id);
              const serviciosDisponibles = servicios.map((s) => `${s.nombre} ($${s.precio})`);

              // Load chatFlow from config
              const config = await configuracionRepository.getOrCreateByNegocioId(negocio.id);
              const chatFlow = config.chatFlow || [];

              let slotsDisponibles: string[] = [];
              if (contexto.datos.fecha) {
                try {
                  const slots = await getSlotsDisponibles({
                    negocioId: negocio.id,
                    servicioId: (contexto.datos as any).servicioId || 1, // Default to 1 if unknown
                    fecha: contexto.datos.fecha as unknown as string,
                  });
                  slotsDisponibles = slots.map((s) => s.inicio);
                } catch (e) {
                  logger.warn({ err: e }, 'Error obteniendo slots para contexto de IA');
                }
              }

              const resultadoIA = await procesarMensajeConIA(
                textBody,
                contexto,
                serviciosDisponibles,
                slotsDisponibles,
                chatFlow,
              );

              await sesionChatRepository.upsert(sessionJid, negocio.id, {
                estado: contexto.estado,
                datos: contexto.datos,
              });

              await manejarRespuestaIA(negocio, from, resultadoIA, contexto);
            } catch (msgErr) {
              logger.error(
                { err: msgErr, message },
                '[Webhook] Error procesando mensaje individual',
              );
            }
          }
        }

        const statuses = value.statuses as Array<Record<string, any>> | undefined;
        if (statuses && statuses.length > 0) {
          for (const status of statuses) {
            await chatRepository.updateEstadoEntrega(status.id as string, status.status as string);
          }
        }
      }
    }
  },
};

async function manejarRespuestaIA(
  negocio: { id: number; waAccessToken: string | null; waPhoneNumberId: string | null },
  from: string,
  resultadoIA: {
    intencion: string;
    respuestaSugerida?: string;
    entidades?: Record<string, string | undefined>;
  },
  contexto: ContextoConversacion,
): Promise<void> {
  const waCreds = {
    waAccessToken: negocio.waAccessToken ?? '',
    waPhoneNumberId: negocio.waPhoneNumberId ?? '',
  };

  if (resultadoIA.intencion === 'AGENDAR' && contexto.estado === 'CONFIRMANDO_FECHA') {
    const { fecha, horario, nombre, servicioId } = contexto.datos as any as {
      fecha?: string;
      horario?: string;
      nombre?: string;
      servicioId?: number;
    };

    if (fecha && horario && nombre) {
      try {
        const nuevaCita = await citasService.crearCitaAdmin(negocio.id, {
          clienteNombre: nombre,
          clienteTelefono: from,
          fecha,
          horario,
          servicioId: servicioId ?? undefined,
          monto: 0,
          estado: 'VALIDACION_PENDIENTE',
          origen: 'whatsapp',
        });

        // Check if advance payment is required
        const config = await configuracionRepository.getOrCreateByNegocioId(negocio.id);
        let confirmationMsg =
          `¡Tu cita ha sido creada! 🎉\n\n` +
          `📋 *Detalles:*\n` +
          `📅 Fecha: ${fecha}\n` +
          `⏰ Hora: ${horario}\n` +
          `👤 Nombre: ${nombre}\n\n`;

        if (config.cobrarAdelanto && nuevaCita.monto > 0) {
          const anticipo = Math.round((nuevaCita.monto * config.porcentajeAdelanto) / 100);
          confirmationMsg +=
            `💰 *Adelanto requerido:* $${anticipo} (${config.porcentajeAdelanto}% de $${nuevaCita.monto})\n` +
            `Por favor envía tu comprobante de pago para confirmar tu cita.`;
        } else {
          confirmationMsg += `Estado: Pendiente de validación. Te notificaremos cuando sea confirmada.`;
        }

        await enviarMensaje(waCreds, from, confirmationMsg);

        if (config.cobrarAdelanto && nuevaCita.monto > 0 && config.qrFotoUrl) {
          const anticipo = Math.round((nuevaCita.monto * config.porcentajeAdelanto) / 100);
          await enviarImagen(
            waCreds,
            from,
            config.qrFotoUrl,
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
    } else if (fecha && horario) {
      await enviarMensaje(waCreds, from, '¿Cuál es tu nombre para completar la reserva?');
      contexto.estado = 'ESPERANDO_NOMBRE';
    } else if (fecha) {
      try {
        const slots = await getSlotsDisponibles({
          negocioId: negocio.id,
          servicioId: servicioId ?? 1,
          fecha,
        });

        if (slots.length === 0) {
          await enviarMensaje(
            waCreds,
            from,
            `Lo siento, no hay horarios disponibles para el ${fecha}. ¿Te gustaría probar con otra fecha?`,
          );
        } else {
          const horariosStr = slots
            .slice(0, 5)
            .map((s) => `• ${s.inicio}`)
            .join('\n');
          await enviarMensaje(
            waCreds,
            from,
            `Horarios disponibles para el ${fecha}:\n\n${horariosStr}\n\n¿Cuál prefieres?`,
          );
          contexto.estado = 'ESPERANDO_HORA';
        }
      } catch (err) {
        logger.error({ err }, '[Webhook] Error obteniendo slots');
        await enviarMensaje(waCreds, from, '¿Para qué hora te gustaría tu cita?');
      }
    } else {
      const servicios = await serviciosRepository.findByNegocioId(negocio.id);
      const listaServicios = servicios.map((s) => `• ${s.nombre} ($${s.precio})`).join('\n');
      await enviarMensaje(
        waCreds,
        from,
        `¡Hola! Para agendar tu cita, primero dime qué servicio deseas:\n\n${listaServicios}`,
      );
      contexto.estado = 'ESPERANDO_SERVICIO';
    }
  } else if (resultadoIA.respuestaSugerida) {
    await enviarMensaje(waCreds, from, resultadoIA.respuestaSugerida);
  } else {
    await enviarMensaje(waCreds, from, 'He recibido tu mensaje.');
  }
}

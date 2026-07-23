import { Injectable } from '@nestjs/common';
import { ChatRepository } from '../chat/chat.repository';
import { NegocioRepository } from '../negocio/negocio.repository';
import { ConfiguracionRepository } from '../negocio/configuracion.repository';
import { ServiciosRepository } from '../servicios/servicios.repository';
import { AvailabilityRepository } from '../citas/availability.repository';
import { SesionChatRepository } from '../chat/sesion-chat.repository';
import { CitasService } from '../citas/citas.service';
import { getSlotsDisponibles } from '../scheduling/availability-engine';
import { procesarMensajeConIA, ContextoConversacion } from '../chat/ai-engine';
import { enviarMensaje, enviarImagen } from '../lib/whatsapp';
import type { Servicio, Negocio, ChatFlowStep } from '../domain/types';
import { createLogger } from '../lib/logger';

const logger = createLogger('webhook-service');

interface NegocioCache {
  servicios: Servicio[];
  config: Record<string, unknown>;
}

@Injectable()
export class WebhookService {
  constructor(
    private readonly chatRepository: ChatRepository,
    private readonly negocioRepository: NegocioRepository,
    private readonly configuracionRepository: ConfiguracionRepository,
    private readonly serviciosRepository: ServiciosRepository,
    private readonly availabilityRepository: AvailabilityRepository,
    private readonly sesionChatRepository: SesionChatRepository,
    private readonly citasService: CitasService,
  ) {}

  async processWhatsAppPayload(body: Record<string, unknown>): Promise<void> {
    if (body.object !== 'whatsapp_business_account') return;
    if (!Array.isArray(body.entry) || body.entry.length === 0) return;

    const negocioCache = new Map<number, NegocioCache>();

    for (const entry of body.entry) {
      if (!Array.isArray(entry.changes)) continue;

      for (const change of entry.changes) {
        const value = change.value as Record<string, unknown>;
        const metadata = value.metadata as Record<string, unknown> | undefined;
        const phoneNumberId = metadata?.phone_number_id as string | undefined;

        const messages = value.messages as Array<Record<string, unknown>> | undefined;
        if (messages && messages.length > 0) {
          for (const message of messages) {
            try {
              const from = message.from as string;

              if (message.type !== 'text') continue;
              const textBody = (message.text as Record<string, unknown>)?.body as string;
              const waMessageId = message.id as string;

              if (!phoneNumberId || !from || !textBody) continue;

              const negocio =
                await this.negocioRepository.findByWaPhoneNumberIdForInternal(phoneNumberId);
              if (!negocio) {
                logger.warn(
                  { phoneNumberId },
                  '[Webhook] Mensaje para phoneNumberId no registrado',
                );
                continue;
              }

              await this.chatRepository.createMensaje({
                remoteJid: from,
                contenido: textBody,
                direccion: 'ENTRANTE',
                waMessageId,
                estadoEntrega: 'entregado',
                negocioId: negocio.id,
              });

              logger.info({ negocio: negocio.nombre, from }, '[Webhook] Mensaje recibido');

              let cached = negocioCache.get(negocio.id);
              if (!cached) {
                const [servicios, config] = await Promise.all([
                  this.serviciosRepository.findByNegocioId(negocio.id),
                  this.configuracionRepository.getOrCreateByNegocioId(negocio.id),
                ]);
                cached = { servicios, config: config as unknown as Record<string, unknown> };
                negocioCache.set(negocio.id, cached);
              }

              const sessionJid = `${from}`;
              const sesion = await this.sesionChatRepository.findByJid(sessionJid, negocio.id);
              const contexto: ContextoConversacion = sesion
                ? {
                    estado: sesion.estado as ContextoConversacion['estado'],
                    datos: (sesion.datos as Record<string, unknown>) || {},
                    intentosAclaracion: 0,
                  }
                : { estado: 'INICIO', datos: {}, intentosAclaracion: 0 };

              const serviciosDisponibles = cached.servicios.map(
                (s) => `${s.nombre} ($${s.precio})`,
              );

              const chatFlow = (cached.config.chatFlow ?? []) as ChatFlowStep[];

              let slotsDisponibles: string[] = [];
              if (contexto.datos.fecha) {
                try {
                  const servicioId = cached.servicios[0]?.id;
                  if (servicioId) {
                    const fechaStr =
                      contexto.datos.fecha instanceof Date
                        ? contexto.datos.fecha.toISOString().split('T')[0]
                        : String(contexto.datos.fecha);
                    const slots = await getSlotsDisponibles(this.availabilityRepository, {
                      negocioId: negocio.id,
                      servicioId,
                      fecha: fechaStr,
                    });
                    slotsDisponibles = slots.map((s) => s.inicio);
                  }
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

              await this.sesionChatRepository.upsert(sessionJid, negocio.id, {
                estado: contexto.estado,
                datos: contexto.datos,
              });

              await this.handleAIResponse(negocio, from, resultadoIA, contexto, cached);
            } catch (msgErr) {
              logger.error(
                { err: msgErr, message },
                '[Webhook] Error procesando mensaje individual',
              );
            }
          }
        }

        const statuses = value.statuses as Array<Record<string, unknown>> | undefined;
        if (statuses && statuses.length > 0) {
          for (const status of statuses) {
            await this.chatRepository.updateEstadoEntrega(
              status.id as string,
              status.status as string,
            );
          }
        }
      }
    }
  }

  async processStripeEvent(body: Record<string, unknown>): Promise<void> {
    // TODO: implement Stripe webhook signature verification and event handling
    const eventType = body.type as string | undefined;
    logger.info({ eventType }, '[Webhook] Stripe event received (stub)');
  }

  private async handleAIResponse(
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

          const config = cached.config;
          const cobrarAdelanto = config.cobrarAdelanto as boolean;
          const porcentajeAdelanto = config.porcentajeAdelanto as number;
          const qrFotoUrl = config.qrFotoUrl as string | null;

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
      } else if (fechaStr && horario) {
        await enviarMensaje(waCreds, from, '¿Cuál es tu nombre para completar la reserva?');
        contexto.estado = 'ESPERANDO_NOMBRE';
      } else if (fechaStr) {
        try {
          const fallbackServicioId = cached.servicios[0]?.id;
          if (!fallbackServicioId) {
            await enviarMensaje(waCreds, from, '¿Qué servicio deseas agendar?');
            contexto.estado = 'ESPERANDO_SERVICIO';
            return;
          }
          const slots = await getSlotsDisponibles(this.availabilityRepository, {
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
      } else {
        const listaServicios = cached.servicios
          .map((s) => `• ${s.nombre} ($${s.precio})`)
          .join('\n');
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
}

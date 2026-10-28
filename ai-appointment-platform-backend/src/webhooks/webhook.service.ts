import { Inject, Injectable } from '@nestjs/common';
import { es as chronoEs } from 'chrono-node';
import { ChatService } from '../chat/chat.service';
import { NegocioService } from '../negocio/negocio.service';
import { ServiciosService } from '../servicios/servicios.service';
import { CitasService } from '../citas/citas.service';
import { procesarMensajeConIA, ContextoConversacion } from '../chat/ai-engine';
import { enviarMensaje, enviarImagen, descargarMediaWhatsApp } from '../lib/whatsapp';
import { uploadBase64Image } from '../lib/cloudinary';
import { RedisService } from '../lib/redis/redis.service';
import { cached } from '../lib/redis/cache-helpers';
import type { Servicio, Negocio, Configuracion } from '../domain/types';
import { createLogger } from '../lib/logger';
import type Stripe from 'stripe';

const logger = createLogger('webhook-service');

export function parsearFechaRelativa(texto: string, timezone = 'America/La_Paz'): Date | null {
  if (!texto || typeof texto !== 'string') return null;
  const normalizado = texto.trim().replace(/\bmanana\b/g, 'mañana');
  try {
    return chronoEs.casual.parseDate(normalizado, { instant: new Date(), timezone });
  } catch {
    return null;
  }
}

export function formatearFechaEnZona(fecha: Date, timezone = 'America/La_Paz'): string {
  const partes = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(fecha);
  const getParte = (tipo: string): string => partes.find((p) => p.type === tipo)?.value ?? '';
  return `${getParte('year')}-${getParte('month')}-${getParte('day')}`;
}

interface NegocioCache {
  servicios: Servicio[];
  config: Configuracion;
}

const CACHE_TTL = {
  NEGOCIO_BY_PHONE: 60,
  SERVICIOS: 60,
  CONFIGURACION: 60,
} as const;

const CACHE_KEYS = {
  servicios: (negocioId: number) => `servicios:${negocioId}`,
} as const;

@Injectable()
export class WebhookService {
  constructor(
    private readonly chatService: ChatService,
    private readonly negocioService: NegocioService,
    private readonly serviciosService: ServiciosService,
    private readonly citasService: CitasService,
    @Inject(RedisService) private readonly redis: RedisService,
  ) {}

  async processWithRetry(body: Record<string, unknown>, maxRetries = 3): Promise<void> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await this.processWhatsAppPayload(body);
        return;
      } catch (error) {
        const delay = Math.min(1000 * 2 ** (attempt - 1), 10000);
        logger.warn({ attempt, maxRetries, delay, error }, '[Webhook] Process failed, retrying');
        if (attempt < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, delay));
        } else {
          logger.error({ error, attempts: maxRetries }, '[Webhook] All retry attempts exhausted');
        }
      }
    }
  }

  async processWhatsAppPayload(body: Record<string, unknown>): Promise<void> {
    if (body.object !== 'whatsapp_business_account') return;
    if (!Array.isArray(body.entry) || body.entry.length === 0) return;

    // In-memory fallback cache (used when Redis unavailable)
    const localNegocioCache = new Map<number, NegocioCache>();

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
              const messageType = message.type as string;

              if (messageType !== 'text' && messageType !== 'image') continue;

              const waMessageId = message.id as string;
              let textBody = '';
              let mediaId: string | undefined;

              if (messageType === 'text') {
                textBody = (message.text as Record<string, unknown>)?.body as string;
              } else if (messageType === 'image') {
                const imgData = message.image as Record<string, unknown> | undefined;
                mediaId = imgData?.id as string | undefined;
                if (!mediaId) continue;
                const caption = (imgData?.caption as string) || '';
                textBody = caption || '[Comprobante de pago]';
              }

              if (!phoneNumberId || !from || !textBody) continue;

              // Negocio lookup — cached via NegocioService (60s)
              const negocio =
                await this.negocioService.findByWaPhoneNumberIdForInternal(phoneNumberId);
              if (!negocio) {
                logger.warn(
                  { phoneNumberId },
                  '[Webhook] Mensaje para phoneNumberId no registrado',
                );
                continue;
              }

              try {
                await this.chatService.createMensaje({
                  remoteJid: from,
                  contenido: textBody,
                  direccion: 'ENTRANTE',
                  waMessageId,
                  estadoEntrega: 'entregado',
                  negocioId: negocio.id,
                });
              } catch (error) {
                if ((error as { code?: string }).code === 'P2002') {
                  logger.warn(
                    { waMessageId },
                    '[Webhook] Mensaje duplicado (waMessageId ya procesado), omitiendo',
                  );
                  continue;
                }
                throw error;
              }

              logger.info(
                { negocio: negocio.nombre, from, messageType },
                '[Webhook] Mensaje recibido',
              );

              if (messageType === 'image' && mediaId) {
                await this.procesarComprobantePago(negocio, from, mediaId);
                continue;
              }

              const rating = this.parsearRespuestaEncuesta(textBody);
              if (rating !== null) {
                const updated = await this.citasService.updateLastAppointmentRating(
                  negocio.id,
                  from,
                  rating,
                );
                if (updated) {
                  await enviarMensaje(
                    {
                      waAccessToken: negocio.waAccessToken ?? '',
                      waPhoneNumberId: negocio.waPhoneNumberId ?? '',
                    },
                    from,
                    '¡Gracias por tu feedback! Lo apreciamos mucho.',
                  );
                  continue;
                }
              }

              // Try Redis cache first, then fall back to local Map
              let cachedData = localNegocioCache.get(negocio.id);
              if (!cachedData) {
                const [servicios, config] = await Promise.all([
                  cached(this.redis, CACHE_KEYS.servicios(negocio.id), CACHE_TTL.SERVICIOS, () =>
                    this.serviciosService.getAll(negocio.id),
                  ),
                  this.negocioService.getConfiguracion(negocio.id),
                ]);
                cachedData = { servicios, config };
                localNegocioCache.set(negocio.id, cachedData);
              }

              const sessionJid = `${from}`;
              const sesion = await this.chatService.findSessionByJid(sessionJid, negocio.id);
              const contexto: ContextoConversacion = sesion
                ? {
                    estado: sesion.estado as ContextoConversacion['estado'],
                    datos: (sesion.datos as Record<string, unknown>) || {},
                    intentosAclaracion: 0,
                  }
                : { estado: 'INICIO', datos: {}, intentosAclaracion: 0 };

              const serviciosDisponibles = cachedData.servicios.map(
                (s) => `${s.nombre} ($${s.precio})`,
              );

              const chatFlow = cachedData.config.chatFlow ?? [];

              let slotsDisponibles: string[] = [];
              if (contexto.datos.fecha) {
                try {
                  const servicioId = cachedData.servicios[0]?.id;
                  if (servicioId) {
                    const fechaStr = this.normalizarFecha(
                      contexto.datos.fecha,
                      cachedData.config.timezone || 'America/La_Paz',
                    );
                    if (fechaStr) {
                      const slots = await this.citasService.getSlotDisponibles({
                        negocioId: negocio.id,
                        servicioId,
                        fecha: fechaStr,
                      });
                      slotsDisponibles = slots.map((s) => s.inicio);
                    }
                  }
                } catch (e) {
                  logger.warn({ err: e }, 'Error obteniendo slots para contexto de IA');
                }
              }

              const ejecutarHerramienta = async (nombre: string, args: Record<string, unknown>) => {
                const serviciosActivos = (cachedData?.servicios ?? []).filter(
                  (s) => s.activo !== false,
                );
                const resolverServicioId = (): number | undefined => {
                  if (typeof args.servicio_id === 'number') {
                    return args.servicio_id;
                  }
                  if (typeof args.servicio_id === 'string' && !isNaN(Number(args.servicio_id))) {
                    return Number(args.servicio_id);
                  }
                  if (contexto.datos.servicio) {
                    const matched = serviciosActivos.find(
                      (s) => s.nombre.toLowerCase() === contexto.datos.servicio!.toLowerCase(),
                    );
                    if (matched) return matched.id;
                  }
                  return serviciosActivos[0]?.id;
                };

                if (nombre === 'consultar_disponibilidad') {
                  const fecha = String(args.fecha ?? '');
                  const servicioId = resolverServicioId();
                  if (!servicioId) return [];
                  const slots = await this.citasService.getSlotDisponibles({
                    negocioId: negocio.id,
                    servicioId,
                    fecha,
                  });
                  return slots.map((s) => s.inicio);
                }
                if (nombre === 'agendar_cita') {
                  const fechaHora = String(args.fecha_hora ?? '');
                  const [fecha, hora] = fechaHora.includes('T')
                    ? fechaHora.split('T')
                    : [fechaHora, ''];
                  const servicioId = resolverServicioId();
                  const matchedServicio = servicioId
                    ? serviciosActivos.find((s) => s.id === servicioId)
                    : undefined;
                  const monto =
                    typeof args.monto === 'number'
                      ? args.monto
                      : typeof args.precio === 'number'
                        ? args.precio
                        : (matchedServicio?.precio ?? 0);
                  const cita = await this.citasService.crearCitaAdmin(negocio.id, {
                    clienteNombre: String(args.cliente_nombre ?? ''),
                    clienteTelefono: String(args.cliente_telefono ?? ''),
                    fecha,
                    horario: hora.slice(0, 5),
                    servicioId,
                    monto,
                    estado: 'VALIDACION_PENDIENTE',
                    origen: 'whatsapp',
                  });
                  return { ok: true, citaId: cita.id };
                }
                throw new Error(`Herramienta no soportada: ${nombre}`);
              };

              const resultadoIA = await procesarMensajeConIA(
                textBody,
                contexto,
                serviciosDisponibles,
                slotsDisponibles,
                chatFlow,
                negocio.geminiApiKey ?? undefined,
                ejecutarHerramienta,
              );

              const timezone = cachedData.config.timezone || 'America/La_Paz';
              const entidades = resultadoIA.entidades;
              if (entidades?.fecha) {
                const fechaParsed = parsearFechaRelativa(entidades.fecha, timezone);
                if (fechaParsed) {
                  contexto.datos.fecha = fechaParsed;
                }
              }
              if (entidades?.hora) {
                contexto.datos.horario = entidades.hora;
              }
              if (entidades?.nombre) {
                contexto.datos.nombre = entidades.nombre;
              }

              if (
                (contexto.estado === 'INICIO' || contexto.estado === 'ESPERANDO_FECHA') &&
                resultadoIA.intencion === 'AGENDAR'
              ) {
                contexto.estado = contexto.datos.fecha ? 'CONFIRMANDO_FECHA' : 'ESPERANDO_FECHA';
              }

              try {
                await this.handleAIResponse(negocio, from, resultadoIA, contexto, cachedData);
              } finally {
                const datosPersistir: Record<string, unknown> = { ...contexto.datos };
                if (datosPersistir.fecha instanceof Date) {
                  datosPersistir.fecha = formatearFechaEnZona(datosPersistir.fecha, timezone);
                }
                await this.chatService.upsertSession(sessionJid, negocio.id, {
                  estado: contexto.estado,
                  datos: datosPersistir,
                });
              }
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
            await this.chatService.updateEstadoEntrega(
              status.id as string,
              status.status as string,
            );
          }
        }
      }
    }
  }

  async processStripeEvent(event: Stripe.Event): Promise<void> {
    logger.info({ eventType: event.type, eventId: event.id }, '[Stripe] Event received');

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const metadata = session.metadata || {};
        const citaId = metadata.citaId ? Number(metadata.citaId) : undefined;
        const negocioId = metadata.negocioId ? Number(metadata.negocioId) : undefined;
        const paymentIntentId =
          typeof session.payment_intent === 'string'
            ? session.payment_intent
            : session.payment_intent?.id;

        logger.info(
          { sessionId: session.id, citaId, negocioId, paymentIntentId },
          '[Stripe] Checkout session completed',
        );

        if (citaId && negocioId) {
          await this.citasService.confirmarPagoStripe(citaId, negocioId, paymentIntentId);
        }
        break;
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const metadata = paymentIntent.metadata || {};
        const citaId = metadata.citaId ? Number(metadata.citaId) : undefined;
        const negocioId = metadata.negocioId ? Number(metadata.negocioId) : undefined;

        logger.info(
          {
            paymentIntentId: paymentIntent.id,
            amount: paymentIntent.amount,
            currency: paymentIntent.currency,
            customerId: paymentIntent.customer,
            metadata: paymentIntent.metadata,
            citaId,
            negocioId,
          },
          '[Stripe] Payment succeeded',
        );

        if (citaId && negocioId) {
          await this.citasService.confirmarPagoStripe(citaId, negocioId, paymentIntent.id);
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        logger.info(
          {
            invoiceId: invoice.id,
            amountPaid: invoice.amount_paid,
            currency: invoice.currency,
            customerId: invoice.customer,
          },
          '[Stripe] Invoice payment succeeded',
        );
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const lastError = paymentIntent.last_payment_error;
        logger.warn(
          {
            paymentIntentId: paymentIntent.id,
            amount: paymentIntent.amount,
            currency: paymentIntent.currency,
            errorCode: lastError?.code,
            errorMessage: lastError?.message,
            customerId: paymentIntent.customer,
          },
          '[Stripe] Payment failed',
        );
        break;
      }

      default:
        logger.debug({ eventType: event.type, eventId: event.id }, '[Stripe] Unhandled event type');
    }
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
      const fechaStr = this.normalizarFecha(
        contexto.datos.fecha,
        cached.config.timezone || 'America/La_Paz',
      );
      const horario = contexto.datos.horario;
      const nombre = contexto.datos.nombre;

      if (fechaStr && horario && nombre) {
        try {
          const matchedServicio = contexto.datos.servicio
            ? cached.servicios.find(
                (s) => s.nombre.toLowerCase() === String(contexto.datos.servicio).toLowerCase(),
              )
            : cached.servicios[0];
          const servicioId = matchedServicio?.id;
          const monto = matchedServicio?.precio ?? 0;

          const nuevaCita = await this.citasService.crearCitaAdmin(negocio.id, {
            clienteNombre: nombre,
            clienteTelefono: from,
            fecha: fechaStr,
            horario,
            servicioId,
            monto,
            estado: 'VALIDACION_PENDIENTE',
            origen: 'whatsapp',
          });

          const config = cached.config;
          const cobrarAdelanto = config.cobrarAdelanto;
          const porcentajeAdelanto = config.porcentajeAdelanto;
          const qrFotoUrl = config.qrFotoUrl;

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

  private normalizarFecha(fecha: unknown, timezone: string): string | undefined {
    if (fecha instanceof Date) {
      return formatearFechaEnZona(fecha, timezone);
    }
    if (typeof fecha === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(fecha.trim())) {
      return fecha.trim();
    }
    if (typeof fecha === 'string' && fecha.trim()) {
      const parsed = parsearFechaRelativa(fecha, timezone);
      if (parsed) {
        return formatearFechaEnZona(parsed, timezone);
      }
      return fecha;
    }
    return undefined;
  }

  async procesarComprobantePago(negocio: Negocio, from: string, mediaId: string): Promise<void> {
    const waCreds = {
      waAccessToken: negocio.waAccessToken ?? '',
      waPhoneNumberId: negocio.waPhoneNumberId ?? '',
    };

    try {
      logger.info(
        { negocioId: negocio.id, from, mediaId },
        '[Webhook] Descargando comprobante de WhatsApp',
      );
      const media = await descargarMediaWhatsApp(waCreds, mediaId);

      logger.info({ negocioId: negocio.id, from }, '[Webhook] Subiendo comprobante a Cloudinary');
      const comprobanteUrl = await uploadBase64Image(
        media.base64,
        `wavio/comprobantes/${negocio.id}`,
      );

      logger.info(
        { negocioId: negocio.id, from, comprobanteUrl },
        '[Webhook] Asociando comprobante a cita pendiente',
      );
      const citaActualizada = await this.citasService.asociarComprobante(
        negocio.id,
        from,
        comprobanteUrl,
      );

      if (citaActualizada) {
        const config = await this.negocioService.getConfiguracion(negocio.id);
        const mensaje =
          config.mensajeConfirmacion ||
          '¡Comprobante recibido! Tu cita está siendo revisada por el equipo. Te confirmaremos a la brevedad.';
        await enviarMensaje(waCreds, from, mensaje);
      } else {
        await enviarMensaje(
          waCreds,
          from,
          'Recibimos tu comprobante, pero no encontramos una cita pendiente asociada a tu número. Por favor contáctanos para asistirte.',
        );
      }
    } catch (err) {
      logger.error({ err, from, mediaId }, '[Webhook] Error procesando comprobante de pago');
      await enviarMensaje(
        waCreds,
        from,
        'Hubo un problema al procesar tu comprobante. Por favor intenta enviarlo nuevamente.',
      );
    }
  }

  parsearRespuestaEncuesta(texto: string): number | null {
    if (!texto || typeof texto !== 'string') return null;
    const trimmed = texto.trim();

    // 1. Estrellas Unicode (ej: ⭐⭐⭐⭐⭐, ⭐) con soporte para modificadores / selector de variación
    const starMatches = trimmed.match(/⭐/gu);
    if (starMatches && trimmed.replace(/⭐|\uFE0F|\s/gu, '') === '') {
      const count = starMatches.length;
      if (count >= 1 && count <= 5) {
        return count;
      }
    }

    // 2. Número 1 a 5 (ej: "5", "5 estrellas", "5 ⭐")
    const numMatch = trimmed.match(/^([1-5])(?:\s*(?:estrellas?|⭐\uFE0F?))?$/i);
    if (numMatch) {
      return parseInt(numMatch[1], 10);
    }

    return null;
  }
}

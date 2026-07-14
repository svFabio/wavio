import { chatRepository } from '../repositories/chat.repository';
import { negocioRepository } from '../repositories/negocio.repository';
import { sesionChatRepository } from '../repositories/sesionChat.repository';
import { enviarMensaje } from '../lib/whatsapp';
import { procesarMensajeConIA, ContextoConversacion } from '../services/ai.service';
import { getSocket } from '../lib/socket';
import pino from 'pino';

const logger = pino();

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

        // 1. Mensaje entrante
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

              // IA Processing — load or create conversation context
              const sessionJid = `${from}`;
              const sesion = await sesionChatRepository.findByJid(sessionJid, negocio.id);
              const contexto: ContextoConversacion = sesion
                ? {
                    estado: sesion.estado as ContextoConversacion['estado'],
                    datos: (sesion.datos as Record<string, unknown>) || {},
                    intentosAclaracion: 0,
                  }
                : { estado: 'INICIO', datos: {}, intentosAclaracion: 0 };

              const resultadoIA = await procesarMensajeConIA(textBody, contexto);

              // Persist updated conversation state
              await sesionChatRepository.upsert(sessionJid, negocio.id, {
                estado: contexto.estado,
                datos: contexto.datos,
              });

              if (resultadoIA.intencion === 'AGENDAR') {
                await enviarMensaje(
                  {
                    waAccessToken: negocio.waAccessToken ?? '',
                    waPhoneNumberId: negocio.waPhoneNumberId ?? '',
                  },
                  from,
                  '¡Perfecto! Vamos a agendar tu cita. ¿Para qué fecha te gustaría?',
                );
              } else if (resultadoIA.respuestaSugerida) {
                await enviarMensaje(
                  {
                    waAccessToken: negocio.waAccessToken ?? '',
                    waPhoneNumberId: negocio.waPhoneNumberId ?? '',
                  },
                  from,
                  resultadoIA.respuestaSugerida,
                );
              } else {
                await enviarMensaje(
                  {
                    waAccessToken: negocio.waAccessToken ?? '',
                    waPhoneNumberId: negocio.waPhoneNumberId ?? '',
                  },
                  from,
                  'He recibido tu mensaje.',
                );
              }
            } catch (msgErr) {
              logger.error(
                { err: msgErr, message },
                '[Webhook] Error procesando mensaje individual',
              );
            }
          }
        }

        // 2. Actualización de estado (sent, delivered, read)
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

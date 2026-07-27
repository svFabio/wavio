import { Injectable } from '@nestjs/common';
import { ChatService } from '../chat/chat.service';
import { NegocioService } from '../negocio/negocio.service';
import { ServiciosService } from '../servicios/servicios.service';
import { CitasService } from '../citas/citas.service';
import type { ContextoConversacion } from '../chat/ai-engine';
import type { Servicio, Negocio, Configuracion, ChatFlowStep } from '../domain/types';
import { createLogger } from '../lib/logger';

const logger = createLogger('message-router');

export interface NegocioCache {
  servicios: Servicio[];
  config: Configuracion;
}

export interface ExtractedMessage {
  from: string;
  textBody: string;
  waMessageId: string;
}

export interface MessageContext {
  negocio: Negocio;
  contexto: ContextoConversacion;
  serviciosDisponibles: string[];
  chatFlow: ChatFlowStep[];
  slotsDisponibles: string[];
  cached: NegocioCache;
}

@Injectable()
export class MessageRouterService {
  constructor(
    private readonly chatService: ChatService,
    private readonly negocioService: NegocioService,
    private readonly serviciosService: ServiciosService,
    private readonly citasService: CitasService,
  ) {}

  extractMessage(message: Record<string, unknown>): ExtractedMessage | null {
    const from = message.from as string;
    const textBody = (message.text as Record<string, unknown>)?.body as string;
    const waMessageId = message.id as string;

    if (message.type !== 'text' || !from || !textBody || !waMessageId) return null;

    return { from, textBody, waMessageId };
  }

  async resolveNegocio(phoneNumberId: string): Promise<Negocio | null> {
    return this.negocioService.findByWaPhoneNumberIdForInternal(phoneNumberId);
  }

  async handleSurveyResponse(negocio: Negocio, from: string, textBody: string): Promise<boolean> {
    if (!/^[1-5]$/.test(textBody.trim())) return false;

    const updated = await this.citasService.updateLastAppointmentRating(
      negocio.id,
      from,
      parseInt(textBody.trim(), 10),
    );

    if (updated) {
      const { enviarMensaje } = await import('../lib/whatsapp');
      await enviarMensaje(
        {
          waAccessToken: negocio.waAccessToken ?? '',
          waPhoneNumberId: negocio.waPhoneNumberId ?? '',
        },
        from,
        '¡Gracias por tu feedback! Lo apreciamos mucho.',
      );
      return true;
    }

    return false;
  }

  async buildMessageContext(
    negocio: Negocio,
    extracted: ExtractedMessage,
    cache: Map<number, NegocioCache>,
  ): Promise<MessageContext> {
    const cached = await this.resolveCachedNegocio(negocio.id, cache);

    const sessionJid = `${extracted.from}`;
    const sesion = await this.chatService.findSessionByJid(sessionJid, negocio.id);
    const contexto: ContextoConversacion = sesion
      ? {
          estado: sesion.estado as ContextoConversacion['estado'],
          datos: (sesion.datos as Record<string, unknown>) || {},
          intentosAclaracion: 0,
        }
      : { estado: 'INICIO', datos: {}, intentosAclaracion: 0 };

    const serviciosDisponibles = cached.servicios.map((s) => `${s.nombre} ($${s.precio})`);
    const chatFlow = cached.config.chatFlow ?? [];

    const slotsDisponibles = await this.resolveSlotsForContext(
      negocio.id,
      contexto,
      cached.servicios,
    );

    return {
      negocio,
      contexto,
      serviciosDisponibles,
      chatFlow,
      slotsDisponibles,
      cached,
    };
  }

  private async resolveCachedNegocio(
    negocioId: number,
    cache: Map<number, NegocioCache>,
  ): Promise<NegocioCache> {
    let cached = cache.get(negocioId);
    if (!cached) {
      const [servicios, config] = await Promise.all([
        this.serviciosService.getAll(negocioId),
        this.negocioService.getConfiguracion(negocioId),
      ]);
      cached = { servicios, config };
      cache.set(negocioId, cached);
    }
    return cached;
  }

  private async resolveSlotsForContext(
    negocioId: number,
    contexto: ContextoConversacion,
    servicios: Servicio[],
  ): Promise<string[]> {
    if (!contexto.datos.fecha) return [];

    try {
      const servicioId = servicios[0]?.id;
      if (!servicioId) return [];

      const fechaStr =
        contexto.datos.fecha instanceof Date
          ? contexto.datos.fecha.toISOString().split('T')[0]
          : String(contexto.datos.fecha);

      const slots = await this.citasService.getSlotDisponibles({
        negocioId,
        servicioId,
        fecha: fechaStr,
      });

      return slots.map((s) => s.inicio);
    } catch (e) {
      logger.warn({ err: e }, 'Error obteniendo slots para contexto de IA');
      return [];
    }
  }
}

import { Injectable } from '@nestjs/common';
import { ChatRepository, ConversacionRaw } from './chat.repository';
import { NegocioRepository } from '../negocio/negocio.repository';
import { EventsService } from '../events/events.service';
import { enviarMensaje, resolverTelefonoReal } from '../lib/whatsapp';
import { ValidationError, AppError } from '../domain/errors';
import { MensajeChat } from '../domain/types';
import { createLogger } from '../lib/logger';

const logger = createLogger('chat-service');

@Injectable()
export class ChatService {
  constructor(
    private readonly chatRepository: ChatRepository,
    private readonly negocioRepository: NegocioRepository,
    private readonly eventsService: EventsService,
  ) {}

  async getConversaciones(
    negocioId: number,
    page: number,
    limit: number,
  ): Promise<{
    data: (ConversacionRaw & { telefonoReal: string })[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const result = await this.chatRepository.getConversaciones(negocioId, page, limit);
    const data = result.data.map((c) => ({
      ...c,
      telefonoReal: resolverTelefonoReal(c.remoteJid),
    }));
    return {
      data,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / result.limit),
      },
    };
  }

  async getMensajes(
    negocioId: number,
    jid: string,
    page: number,
    limit: number,
  ): Promise<{
    data: MensajeChat[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const result = await this.chatRepository.getMensajes(negocioId, jid, page, limit);
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

  async sendMensaje(negocioId: number, jid: string, texto: string): Promise<{ success: boolean }> {
    if (!texto || typeof texto !== 'string' || !texto.trim()) {
      throw new ValidationError('Texto requerido y debe ser texto válido');
    }

    const waCreds = await this.negocioRepository.findByIdForInternal(negocioId);
    if (!waCreds?.waAccessToken || !waCreds.waPhoneNumberId) {
      throw new AppError('WhatsApp no conectado', 502, 'WHATSAPP_ERROR');
    }

    const resultado = await enviarMensaje(
      { waAccessToken: waCreds.waAccessToken, waPhoneNumberId: waCreds.waPhoneNumberId },
      jid,
      texto.trim(),
    );

    await this.chatRepository.createMensaje({
      remoteJid: jid,
      contenido: texto.trim(),
      direccion: 'SALIENTE',
      waMessageId: resultado.waMessageId,
      estadoEntrega: 'enviado',
      negocioId,
    });

    return { success: true };
  }

  async deleteConversacion(
    negocioId: number,
    jid: string,
  ): Promise<{ success: boolean; eliminados: number }> {
    const count = await this.chatRepository.deleteConversacion(negocioId, jid);

    logger.info({ negocioId, jid, count }, '[Chat] Conversacion eliminada');

    try {
      this.eventsService.emitConversacionEliminada(negocioId, { remoteJid: jid });
    } catch (e) {
      logger.warn({ err: e }, 'Socket error on deleteConversacion');
    }

    return { success: true, eliminados: count };
  }
}

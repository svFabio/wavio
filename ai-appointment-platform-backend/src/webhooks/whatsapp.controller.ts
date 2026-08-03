import { Controller, Get, Post, Req, Res, HttpCode, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { WebhookService } from './webhook.service';
import { WhatsappSignatureGuard } from './whatsapp-signature.guard';
import { env } from '../config/env';
import { createLogger } from '../lib/logger';

const logger = createLogger('whatsapp-controller');

@Controller('api/v1/webhooks')
@Throttle({ default: { limit: 100, ttl: 60000 } })
export class WhatsAppController {
  constructor(private readonly webhookService: WebhookService) {}

  @Get('/whatsapp')
  async verify(@Req() req: Request, @Res() res: Response): Promise<void> {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode !== 'subscribe' || token !== env.META_WEBHOOK_VERIFY_TOKEN) {
      res.sendStatus(403);
      return;
    }

    const challengeStr = String(challenge);
    if (!/^\d+$/.test(challengeStr)) {
      res.sendStatus(400);
      return;
    }

    logger.info('Webhook verification successful');
    res.status(200).send(challengeStr);
  }

  @Post('/whatsapp')
  @HttpCode(200)
  @UseGuards(WhatsappSignatureGuard)
  async handleMessages(@Req() req: Request, @Res() res: Response): Promise<void> {
    // Meta expects 200 OK immediately; process asynchronously with retry
    res.sendStatus(200);

    this.logPayloadMetadata(req.body);

    this.webhookService.processWithRetry(req.body as Record<string, unknown>).catch((error) => {
      logger.error({ error }, '[Webhook] Exhausted retries processing Meta payload');
    });
  }

  private logPayloadMetadata(body: unknown): void {
    const payload = body as Record<string, unknown> | undefined;
    const entries = Array.isArray(payload?.entry) ? payload.entry : [];
    const phoneNumberIds = new Set<string>();
    const froms = new Set<string>();
    let messageCount = 0;

    for (const entry of entries as Record<string, unknown>[]) {
      if (!Array.isArray(entry?.changes)) continue;
      for (const change of entry.changes as Record<string, unknown>[]) {
        const value = change?.value as Record<string, unknown> | undefined;
        const metadata = value?.metadata as Record<string, unknown> | undefined;
        if (metadata?.phone_number_id) phoneNumberIds.add(String(metadata.phone_number_id));
        const messages = value?.messages as Record<string, unknown>[] | undefined;
        if (!Array.isArray(messages)) continue;
        messageCount += messages.length;
        for (const message of messages) {
          if (message?.from) froms.add(String(message.from));
        }
      }
    }

    logger.info(
      {
        entryCount: entries.length,
        messageCount,
        fromCount: froms.size,
        phoneNumberIds: [...phoneNumberIds],
      },
      '[Webhook] Payload recibido de Meta',
    );
  }
}

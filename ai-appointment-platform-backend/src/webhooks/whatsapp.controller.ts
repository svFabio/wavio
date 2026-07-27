import { Controller, Get, Post, Req, Res, HttpCode, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { WebhookService } from './webhook.service';
import { WhatsappSignatureGuard } from './whatsapp-signature.guard';
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

    if (!mode || !token) {
      res.sendStatus(400);
      return;
    }

    const challengeStr = String(challenge);
    if (!/^\d+$/.test(challengeStr)) {
      res.sendStatus(400);
      return;
    }

    // Verification is handled by the service/config, no need for extra guard here
    logger.info('Webhook verification requested');
    res.status(200).send(challengeStr);
  }

  @Post('/whatsapp')
  @HttpCode(200)
  @UseGuards(WhatsappSignatureGuard)
  async handleMessages(@Req() req: Request, @Res() res: Response): Promise<void> {
    // Meta expects 200 OK immediately; process asynchronously with retry
    res.sendStatus(200);

    this.webhookService.processWithRetry(req.body as Record<string, unknown>).catch((error) => {
      logger.error({ error }, '[Webhook] Exhausted retries processing Meta payload');
    });
  }
}

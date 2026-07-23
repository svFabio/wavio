import { Controller, Get, Post, Req, Res, HttpCode, Inject } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Request, Response } from 'express';
import crypto from 'crypto';
import { WebhookService } from './webhook.service';
import { ENV_CONFIG } from '../config/config.module';
import type { env as EnvType } from '../config/env';
import { createLogger } from '../lib/logger';

const logger = createLogger('whatsapp-controller');

type RawBodyRequest = Request & { rawBody?: Buffer };

@Controller('api/v1/webhooks')
@Throttle({ default: { limit: 100, ttl: 60000 } })
export class WhatsAppController {
  constructor(
    private readonly webhookService: WebhookService,
    @Inject(ENV_CONFIG) private readonly config: typeof EnvType,
  ) {}

  @Get('/whatsapp')
  async verify(@Req() req: Request, @Res() res: Response): Promise<void> {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (!mode || !token) {
      res.sendStatus(400);
      return;
    }

    const verifyToken = this.config.META_WEBHOOK_VERIFY_TOKEN;
    if (mode === 'subscribe' && token === verifyToken) {
      const challengeStr = String(challenge);
      if (!/^\d+$/.test(challengeStr)) {
        res.sendStatus(400);
        return;
      }
      logger.info('Webhook verified by Meta');
      res.status(200).send(challengeStr);
      return;
    }

    logger.error('Meta webhook verification failed');
    res.sendStatus(403);
  }

  @Post('/whatsapp')
  @HttpCode(200)
  async handleMessages(@Req() req: RawBodyRequest, @Res() res: Response): Promise<void> {
    try {
      if (!this.verifySignature(req)) {
        res.sendStatus(403);
        return;
      }

      // Meta expects 200 OK immediately; process asynchronously
      res.sendStatus(200);

      this.webhookService.processWhatsAppPayload(req.body).catch((error: unknown) => {
        logger.error({ error }, '[Webhook] Error processing Meta payload');
      });
    } catch (error) {
      if (!res.headersSent) {
        res.sendStatus(500);
      } else {
        logger.error({ error }, 'Error in handleMessages after headers sent');
      }
    }
  }

  private verifySignature(req: RawBodyRequest): boolean {
    if (!this.config.META_APP_SECRET) {
      logger.error('META_APP_SECRET not configured — webhook signature cannot be verified');
      return false;
    }

    const signature = req.headers['x-hub-signature-256'] as string | undefined;
    if (!signature) return false;

    const rawBody = req.rawBody;
    if (!rawBody) {
      logger.error('Raw body not available for HMAC verification');
      return false;
    }

    const expectedSig = signature.replace('sha256=', '');
    const computedSig = crypto
      .createHmac('sha256', this.config.META_APP_SECRET)
      .update(rawBody)
      .digest('hex');

    return this.timingSafeEqual(expectedSig, computedSig);
  }

  private timingSafeEqual(a: string, b: string): boolean {
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
  }
}

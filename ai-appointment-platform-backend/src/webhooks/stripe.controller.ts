import { Controller, Post, Req, HttpCode } from '@nestjs/common';
import { Request } from 'express';
import { WebhookService } from './webhook.service';
import pino from 'pino';

const logger = pino({ name: 'stripe-controller' });

type RawBodyRequest = Request & { rawBody?: Buffer };

@Controller('api/v1/webhooks')
export class StripeController {
  constructor(private readonly webhookService: WebhookService) {}

  @Post('/stripe')
  @HttpCode(200)
  async handleEvent(@Req() req: RawBodyRequest): Promise<{ received: boolean }> {
    // TODO: verify Stripe signature using req.rawBody and STRIPE_WEBHOOK_SECRET
    const body = req.body as Record<string, unknown>;
    await this.webhookService.processStripeEvent(body);
    return { received: true };
  }
}

import { Controller, Post, Req, HttpCode, Res, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import Stripe from 'stripe';
import { WebhookService } from './webhook.service';
import { env } from '../config/env';
import { createLogger } from '../lib/logger';

const logger = createLogger('stripe-controller');

type RawBodyRequest = Request & { rawBody?: Buffer };

@Controller('api/v1/webhooks')
export class StripeController {
  constructor(private readonly webhookService: WebhookService) {}

  @Post('/stripe')
  @HttpCode(200)
  async handleEvent(@Req() req: RawBodyRequest, @Res() res: Response): Promise<void> {
    const sig = req.headers['stripe-signature'] as string | undefined;
    const rawBody = req.rawBody;

    if (!sig || !rawBody) {
      logger.warn(
        { hasSig: !!sig, hasRawBody: !!rawBody },
        'Stripe webhook missing signature or body',
      );
      throw new HttpException('Missing signature or raw body', HttpStatus.BAD_REQUEST);
    }

    const webhookSecret = env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      logger.error('STRIPE_WEBHOOK_SECRET not configured');
      throw new HttpException('Webhook secret not configured', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    let event: Stripe.Event;
    try {
      event = Stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
    } catch (err) {
      logger.error({ err }, 'Stripe webhook signature verification failed');
      throw new HttpException('Invalid signature', HttpStatus.BAD_REQUEST);
    }

    try {
      await this.webhookService.processStripeEvent(
        event.data?.object as unknown as Record<string, unknown>,
      );
    } catch (err) {
      logger.error({ err, type: event.type }, 'Stripe webhook processing failed');
    }

    res.status(200).json({ received: true });
  }
}

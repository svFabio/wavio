import { Injectable, CanActivate, ExecutionContext, Inject } from '@nestjs/common';
import type { Request } from 'express';
import crypto from 'crypto';
import { ENV_CONFIG } from '../config/config.module';
import type { env as EnvType } from '../config/env';
import { createLogger } from '../lib/logger';

const logger = createLogger('whatsapp-signature-guard');

type RawBodyRequest = Request & { rawBody?: Buffer };

@Injectable()
export class WhatsappSignatureGuard implements CanActivate {
  constructor(@Inject(ENV_CONFIG) private readonly config: typeof EnvType) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<RawBodyRequest>();

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

    if (expectedSig.length !== computedSig.length) return false;
    return crypto.timingSafeEqual(Buffer.from(expectedSig), Buffer.from(computedSig));
  }
}

import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { env } from '../config/env';
import { webhookService } from '../services/webhook.service';
import pino from 'pino';

const logger = pino();
const WEBHOOK_VERIFY_TOKEN = env.META_WEBHOOK_VERIFY_TOKEN;

const verifyWebhookSignature = (req: Request): boolean => {
  if (!env.META_APP_SECRET) {
    if (env.NODE_ENV === 'production') {
      logger.error('META_APP_SECRET not configured — rejecting webhook in production');
      return false;
    }
    return true;
  }
  const signature = req.headers['x-hub-signature-256'] as string | undefined;
  if (!signature) return false;

  const expectedSig = signature.replace('sha256=', '');
  const rawBody = (req as any).rawBody;
  if (!rawBody) {
    logger.error('Raw body not available for HMAC verification');
    return false;
  }

  const computedSig = crypto
    .createHmac('sha256', env.META_APP_SECRET)
    .update(rawBody)
    .digest('hex');

  try {
    return crypto.timingSafeEqual(Buffer.from(expectedSig, 'hex'), Buffer.from(computedSig, 'hex'));
  } catch {
    return false;
  }
};

const timingSafeEqual = (a: string, b: string): boolean => {
  if (a.length !== b.length) return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return crypto.timingSafeEqual(bufA, bufB);
};

export const verifyWebhook = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode && token) {
      if (mode === 'subscribe' && timingSafeEqual(String(token), WEBHOOK_VERIFY_TOKEN)) {
        logger.info('✅ Webhook verificado por Meta!');
        res.status(200).send(challenge);
        return;
      } else {
        logger.error('❌ Falló la verificación del Webhook de Meta');
        res.sendStatus(403);
        return;
      }
    }
    res.sendStatus(400);
  } catch (error) {
    next(error);
  }
};

export const handleWebhook = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!verifyWebhookSignature(req)) {
      res.sendStatus(403);
      return;
    }

    // Meta expects a 200 OK immediately, we process asynchronously.
    res.sendStatus(200);

    // Process asynchronously, do not await so we don't hold the request
    webhookService.processWebhookPayload(req.body).catch((error) => {
      logger.error({ error }, '[Webhook] Error procesando payload de Meta');
    });
  } catch (error) {
    // If synchronous logic fails before sending 200, pass to next
    if (!res.headersSent) {
      next(error);
    } else {
      logger.error({ error }, 'Error in handleWebhook after headers sent');
    }
  }
};

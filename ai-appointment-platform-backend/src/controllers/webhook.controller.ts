import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { env } from '../config/env';
import { webhookService } from '../services/webhook.service';
import pino from 'pino';

const logger = pino();
const WEBHOOK_VERIFY_TOKEN = env.META_WEBHOOK_VERIFY_TOKEN;

const timingSafeEqual = (a: string, b: string): boolean => {
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
};

const verifyWebhookSignature = (req: Request): boolean => {
  if (!env.META_APP_SECRET) {
    logger.error('META_APP_SECRET not configured — webhook signature cannot be verified');
    return false;
  }
  const signature = req.headers['x-hub-signature-256'] as string | undefined;
  if (!signature) return false;

  const expectedSig = signature.replace('sha256=', '');
  const rawBody = req.rawBody;
  if (!rawBody) {
    logger.error('Raw body not available for HMAC verification');
    return false;
  }

  const computedSig = crypto
    .createHmac('sha256', env.META_APP_SECRET)
    .update(rawBody)
    .digest('hex');

  return timingSafeEqual(expectedSig, computedSig);
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
        const challengeStr = String(challenge);
        if (!/^\d+$/.test(challengeStr)) {
          res.sendStatus(400);
          return;
        }
        logger.info('Webhook verificado por Meta');
        res.status(200).send(challengeStr);
        return;
      } else {
        logger.error('Fallo la verificacion del Webhook de Meta');
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

    webhookService.processWebhookPayload(req.body).catch((error) => {
      logger.error({ error }, '[Webhook] Error procesando payload de Meta');
    });
  } catch (error) {
    if (!res.headersSent) {
      next(error);
    } else {
      logger.error({ error }, 'Error in handleWebhook after headers sent');
    }
  }
};

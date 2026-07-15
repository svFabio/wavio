import { Router } from 'express';
import { verifyWebhook, handleWebhook } from '../controllers/webhook.controller';

const router = Router();

// GET para verificación desde el dashboard de Meta
router.get('/', verifyWebhook);

// POST para recibir mensajes y eventos — capture raw body for HMAC
router.post(
  '/',
  (req, _res, next) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => {
      (req as any).rawBody = Buffer.concat(chunks);
      next();
    });
    req.on('error', next);
  },
  handleWebhook,
);

export default router;

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { env } from './config/env';
import { initSocket } from './lib/socket';
import { bootstrap } from './config/bootstrap';
import { errorHandler } from './middleware/errorHandler';
import pino from 'pino';

const logger = pino();

import authRoutes from './routes/auth.route';
import citasRoutes from './routes/citas.route';
import configuracionRoutes from './routes/configuracion.route';
import whatsappRoutes from './routes/whatsapp.route';
import chatRoutes from './routes/chat.route';
import webhookRoutes from './routes/webhook.route';
import usuariosRoutes from './routes/usuarios.route';
import statisticsRoutes from './routes/statistics.route';
import negocioRoutes from './routes/negocio.route';
import serviciosRoutes from './routes/servicios.route';
import horariosRoutes from './routes/horarios.route';
import clientesRoutes from './routes/clientes.route';
import healthRoutes from './routes/health.route';

const app = express();
app.set('trust proxy', 1);

const httpServer = createServer(app);

// Inicializar Socket.IO singleton
initSocket(httpServer);

const allowedOrigins = env.CORS_ORIGINS ? env.CORS_ORIGINS.split(',').map((s) => s.trim()) : [];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.length === 0) {
        if (env.NODE_ENV === 'production') return callback(new Error('CORS not configured'));
        return callback(null, true);
      }
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'x-negocio-id'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  }),
);

app.use(helmet());
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(
  express.json({
    limit: '10mb',
    verify: (req, _res, buf) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (req as any).rawBody = buf;
    },
  }),
);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 500,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});
app.use(limiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.', code: 'RATE_LIMITED' },
});

// Rutas de salud
app.get('/', (_req, res) => res.send('Backend funcionando 🚀'));
app.get('/ping', (_req, res) => res.send('pong'));
app.use('/health', healthRoutes);

// ─── Rutas Meta Cloud API Webhook (no versioning) ───────────────────────────
app.use('/api/webhooks/whatsapp', authLimiter, webhookRoutes);

// ─── API v1 Routes ─────────────────────────────────────────────────────────
app.use('/api/v1/auth', authLimiter, authRoutes);
app.use('/api/v1/citas', citasRoutes);
app.use('/api/v1/configuracion', configuracionRoutes);
app.use('/api/v1/whatsapp', whatsappRoutes);
app.use('/api/v1/chat', chatRoutes);
app.use('/api/v1/users', usuariosRoutes);
app.use('/api/v1/statistics', statisticsRoutes);
app.use('/api/v1/negocio', negocioRoutes);
app.use('/api/v1/servicios', serviciosRoutes);
app.use('/api/v1/horarios', horariosRoutes);
app.use('/api/v1/clientes', clientesRoutes);

// ─── Legacy /api/* → 404 with migration hint ──────────────────────────────
app.use('/api', (_req, res) => {
  res.status(404).json({
    error: 'API version required. Use /api/v1/ instead of /api/',
    docs: '/api/v1/',
  });
});

// Manejador global de errores
app.use(errorHandler);

httpServer.listen(Number(env.PORT), '0.0.0.0', () => {
  logger.info({ port: env.PORT }, 'Servidor listo');
  bootstrap();
});

export default app;

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
import usersRoutes from './routes/users.route';
import statisticsRoutes from './routes/statistics.route';
import negocioRoutes from './routes/negocio.route';

const app = express();
app.set('trust proxy', 1);

const httpServer = createServer(app);

// Inicializar Socket.IO singleton
initSocket(httpServer);

const allowedOrigins = env.CORS_ORIGINS
    ? env.CORS_ORIGINS.split(',').map(s => s.trim())
    : [];

app.use(cors({
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
    allowedHeaders: ['Content-Type', 'Authorization'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
}));

app.use(helmet());
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 500,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
});
app.use(limiter);

// Rutas de salud
app.get('/', (_req, res) => res.send('Backend funcionando 🚀'));
app.get('/ping', (_req, res) => res.send('pong'));

// ─── Rutas Meta Cloud API Webhook ─────────────────────────────────────────────
app.use('/api/webhooks/whatsapp', webhookRoutes);

// Rutas principales
app.use('/api/auth', authRoutes);
app.use('/api/citas', citasRoutes);
app.use('/api/configuracion', configuracionRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/statistics', statisticsRoutes);
app.use('/api/negocio', negocioRoutes);

// Manejador global de errores
app.use(errorHandler);

httpServer.listen(Number(env.PORT), '0.0.0.0', () => {
    logger.info({ port: env.PORT }, 'Servidor listo');
    bootstrap();
});

export default app;
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server } from 'socket.io';
import authRoutes from './routes/auth.route';
import citasRoutes from './routes/citas.route';
import configuracionRoutes from './routes/configuracion.route';
import whatsappRoutes from './routes/whatsapp.route';
import chatRoutes from './routes/chat.route';
import webhookRoutes from './routes/webhook.route';
import usersRoutes from './routes/users.route';
import statisticsRoutes from './routes/statistics.route';
import negocioRoutes from './routes/negocio.route';
import { iniciarCronJobs } from './services/cleanupService';
import { iniciarRecordatorios } from './services/reminderService';
import { iniciarSurvey } from './services/surveyService';

dotenv.config();

const app = express();
app.set('trust proxy', 1);

const PORT = process.env.PORT || 3000;

const httpServer = createServer(app);
const allowedOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map(s => s.trim())
    : [];

const io = new Server(httpServer, {
    cors: {
        origin: allowedOrigins.length > 0 ? allowedOrigins : false,
        methods: ['GET', 'POST'],
        credentials: true
    }
});

app.use(helmet());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json());

// CORS — en produccion leer origenes desde CORS_ORIGINS (coma-separados)
const allowedOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map(s => s.trim())
    : [];

app.use(cors({
    origin: (origin, callback) => {
        // Permitir requests sin origin (Postman, mobile, server-to-server)
        if (!origin) return callback(null, true);
        // En desarrollo sin CORS_ORIGINS seteado, permitir todo
        if (allowedOrigins.length === 0) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
}));

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 500,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
});
app.use(limiter);

app.use((req, res, next) => {
    req.app.set('io', io);
    next();
});

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

io.on('connection', (socket) => {
    console.log('⚡ Cliente conectado al Socket:', socket.id);
});

httpServer.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`🚀 Servidor listo en puerto ${PORT}`);
    // NO iniciamos WhatsApp global — cada negocio lo inicia desde su panel
    iniciarCronJobs();
    iniciarRecordatorios();
    iniciarSurvey();
});

export default app;
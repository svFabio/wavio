import pino from 'pino';

const logger = pino();

// ============================================================
// ⚠️  DESACTIVADO POR DESARROLLO
// El sistema de encuestas post-cita está comentado para evitar
// enviar mensajes a números reales durante pruebas.
// Para reactivar: implementar con Prisma + enviarMensaje.
// ============================================================

export const iniciarSurvey = () => {
    logger.info('[Cron] Sistema de encuestas DESACTIVADO por desarrollo.');
};

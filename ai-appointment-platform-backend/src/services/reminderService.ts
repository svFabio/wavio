import pino from 'pino';

const logger = pino();

// ============================================================
// ⚠️  DESACTIVADO POR DESARROLLO
// El sistema de recordatorios está comentado para evitar
// enviar mensajes a números reales durante pruebas.
// Para reactivar: implementar con Prisma + enviarMensaje.
// ============================================================

export const iniciarRecordatorios = () => {
    logger.info('[Cron] Sistema de recordatorios DESACTIVADO por desarrollo.');
};

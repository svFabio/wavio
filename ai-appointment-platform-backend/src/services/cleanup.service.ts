import cron from 'node-cron';
import { sesionChatRepository } from '../repositories/sesionChat.repository';
import { citasRepository } from '../repositories/citas.repository';
import pino from 'pino';

const logger = pino();

const EXPIRY_MINUTES = 30;

export const iniciarCronJobs = (): void => {
  logger.info('[Cron] 🕒 Iniciando planificador de tareas...');

  // Limpiar sesiones de chat expiradas
  cron.schedule('*/5 * * * *', async () => {
    logger.info('[Cron] 🧹 Ejecutando limpieza de sesiones expiradas...');
    try {
      const limiteTiempo = new Date(Date.now() - EXPIRY_MINUTES * 60 * 1000);

      const count = await sesionChatRepository.deleteInactiveSessions(limiteTiempo);

      if (count > 0) {
        logger.info({ count }, '[Cron] Sesiones inactivas eliminadas');
      } else {
        logger.info('[Cron] Ninguna sesión expirada encontrada.');
      }
    } catch (error) {
      logger.error({ err: error }, '[Cron] ❌ Error en limpieza de sesiones');
    }
  });

  // Cancelar citas EN_PROCESO expiradas (>30 min sin avanzar)
  cron.schedule('*/5 * * * *', async () => {
    try {
      const limite = new Date(Date.now() - EXPIRY_MINUTES * 60 * 1000);
      const count = await citasRepository.cancelExpiredInProgress(limite);

      if (count > 0) {
        logger.info({ count }, '[Cron] Citas expiradas canceladas (EN_PROCESO > 30 min)');
      }
    } catch (error) {
      logger.error({ err: error }, '[Cron] Error en cancelación de citas expiradas');
    }
  });
};

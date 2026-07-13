import cron from 'node-cron';
import { sesionChatRepository } from '../repositories/sesionChat.repository';
import pino from 'pino';

const logger = pino();

export const iniciarCronJobs = () => {
    logger.info('[Cron] 🕒 Iniciando planificador de tareas...');

    cron.schedule('*/5 * * * *', async () => {
        logger.info('[Cron] 🧹 Ejecutando limpieza de sesiones expiradas...');
        try {
            const limiteTiempo = new Date(Date.now() - 30 * 60 * 1000); 

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
};

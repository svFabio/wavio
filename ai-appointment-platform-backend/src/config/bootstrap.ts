import { iniciarCronJobs } from '../services/cleanup.service';
import { iniciarRecordatorios } from '../services/reminder.service';
import { iniciarSurvey } from '../services/survey.service';
import { prisma } from '../repositories/prisma';
import pino from 'pino';

const logger = pino();

const iniciarJobCancelacionExpirados = () => {
  setInterval(async () => {
    try {
      const limite = new Date(Date.now() - 30 * 60000);
      const { count } = await prisma.cita.updateMany({
        where: {
          estado: 'EN_PROCESO',
          creadoEn: { lt: limite },
        },
        data: { estado: 'CANCELADA' },
      });

      if (count > 0) {
        logger.info(`Se cancelaron ${count} citas expiradas (EN_PROCESO > 30 min)`);
      }
    } catch (error) {
      logger.error({ err: error }, 'Error en iniciarJobCancelacionExpirados');
    }
  }, 5 * 60000); // 5 minutos
};

export const bootstrap = () => {
  // Inicialización de tareas programadas
  iniciarCronJobs();
  iniciarRecordatorios();
  iniciarSurvey();
  iniciarJobCancelacionExpirados();

  logger.info(
    'Servicios en segundo plano inicializados (cron, recordatorios, encuestas, cancelacion)',
  );
};

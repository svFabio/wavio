import { iniciarCronJobs } from '../services/cleanup.service';
import { iniciarRecordatorios } from '../services/reminder.service';
import { iniciarSurvey } from '../services/survey.service';
import pino from 'pino';

const logger = pino();

export const bootstrap = () => {
  // Inicialización de tareas programadas
  iniciarCronJobs();
  iniciarRecordatorios();
  iniciarSurvey();

  logger.info('Servicios en segundo plano inicializados (cron, recordatorios, encuestas)');
};

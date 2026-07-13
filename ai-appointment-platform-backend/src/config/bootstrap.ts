import { iniciarCronJobs } from '../services/cleanupService';
import { iniciarRecordatorios } from '../services/reminderService';
import { iniciarSurvey } from '../services/surveyService';
import pino from 'pino';

const logger = pino();

export const bootstrap = () => {
  // Inicialización de tareas programadas
  iniciarCronJobs();
  iniciarRecordatorios();
  iniciarSurvey();
  
  logger.info('Servicios en segundo plano inicializados (cron, recordatorios, encuestas)');
};

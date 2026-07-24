import pino from 'pino';
import { env } from '../config/env';

const rootLogger = pino({
  level: env.LOG_LEVEL,
});

export function createLogger(name: string): pino.Logger {
  return rootLogger.child({ name });
}

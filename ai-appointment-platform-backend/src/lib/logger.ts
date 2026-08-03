import pino from 'pino';
import { env } from '../config/env';

const rootLogger = env.LOG_FILE
  ? pino({ level: env.LOG_LEVEL }, pino.destination({ dest: env.LOG_FILE }))
  : pino({ level: env.LOG_LEVEL });

export function createLogger(name: string): pino.Logger {
  return rootLogger.child({ name });
}

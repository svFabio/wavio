import { healthRepository } from '../repositories/health.repository';

export const healthService = {
  async check(): Promise<{
    status: 'ok' | 'degraded';
    uptime: number;
    db: { status: 'ok' | 'error'; latencyMs: number };
    timestamp: string;
  }> {
    const dbCheck = await healthRepository.checkDbConnection();
    const status = dbCheck.ok ? 'ok' : 'degraded';

    return {
      status,
      uptime: Math.floor(process.uptime()),
      db: {
        status: dbCheck.ok ? 'ok' : 'error',
        latencyMs: dbCheck.latencyMs,
      },
      timestamp: new Date().toISOString(),
    };
  },
};

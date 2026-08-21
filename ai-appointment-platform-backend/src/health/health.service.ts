import { Injectable } from '@nestjs/common';
import { HealthRepository } from './health.repository';

@Injectable()
export class HealthService {
  constructor(private readonly healthRepository: HealthRepository) {}

  async check(): Promise<{
    status: 'ok' | 'degraded';
    uptime: number;
    db: { status: 'ok' | 'error'; latencyMs: number };
    timestamp: string;
  }> {
    const start = Date.now();
    let dbOk = true;

    try {
      await this.healthRepository.pingDatabase();
    } catch {
      dbOk = false;
    }

    const latencyMs = Date.now() - start;

    return {
      status: dbOk ? 'ok' : 'degraded',
      uptime: Math.floor(process.uptime()),
      db: {
        status: dbOk ? 'ok' : 'error',
        latencyMs,
      },
      timestamp: new Date().toISOString(),
    };
  }
}

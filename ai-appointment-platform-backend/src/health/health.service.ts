import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  async check(): Promise<{
    status: 'ok' | 'degraded';
    uptime: number;
    db: { status: 'ok' | 'error'; latencyMs: number };
    timestamp: string;
  }> {
    const start = Date.now();
    let dbOk = true;

    try {
      await this.prisma.$queryRaw`SELECT 1`;
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

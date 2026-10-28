import { Controller, Get, Res, HttpStatus } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import type { Response } from 'express';
import { HealthService } from './health.service';

@SkipThrottle()
@Controller('api/v1/health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get('/')
  async check(@Res({ passthrough: true }) res: Response): Promise<{
    status: 'ok' | 'degraded';
    uptime: number;
    db: { status: 'ok' | 'error'; latencyMs: number };
    redis: { status: 'ok' | 'unavailable' };
    timestamp: string;
  }> {
    const health = await this.healthService.check();
    if (health.status === 'degraded' || health.db.status === 'error') {
      res.status(HttpStatus.SERVICE_UNAVAILABLE);
    }
    return health;
  }
}

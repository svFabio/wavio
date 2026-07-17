import { Controller, Get } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { HealthService } from './health.service';

@SkipThrottle()
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get('/')
  async check(): Promise<{
    status: 'ok' | 'degraded';
    uptime: number;
    db: { status: 'ok' | 'error'; latencyMs: number };
    timestamp: string;
  }> {
    return this.healthService.check();
  }
}

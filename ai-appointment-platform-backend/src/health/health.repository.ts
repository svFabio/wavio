import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../lib/redis/redis.service';

@Injectable()
export class HealthRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async pingDatabase(): Promise<void> {
    await this.prisma.$queryRaw`SELECT 1`;
  }

  getRedisStatus(): { available: boolean; connected: boolean } {
    return {
      available: this.redis.isAvailable,
      connected: this.redis.getClient()?.status === 'ready',
    };
  }
}

import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import { HealthRepository } from './health.repository';
import { RedisService } from '../lib/redis/redis.service';

@Module({
  controllers: [HealthController],
  providers: [HealthService, HealthRepository, RedisService],
})
export class HealthModule {}

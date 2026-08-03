import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from './prisma.service';
import { env } from '../config/env';
import { createLogger } from '../lib/logger';

const logger = createLogger('prisma-keepalive');

@Injectable()
export class PrismaKeepaliveService {
  constructor(private readonly prisma: PrismaService) {}

  @Cron('0 */3 * * * *')
  async keepAlive(): Promise<void> {
    if (env.NODE_ENV === 'test') return;
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      logger.debug('Prisma keepalive ping OK');
    } catch (error) {
      logger.warn({ error }, 'Prisma keepalive ping failed');
    }
  }
}

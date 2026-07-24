import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PushRepository {
  constructor(private readonly prisma: PrismaService) {}

  async subscribe(
    negocioId: number,
    userId: number | null,
    subscription: { endpoint: string; p256dh: string; auth: string },
  ): Promise<{ id: number }> {
    const result = await this.prisma.pushSubscription.upsert({
      where: { endpoint: subscription.endpoint },
      update: {
        p256dh: subscription.p256dh,
        auth: subscription.auth,
        negocioId,
        userId,
      },
      create: {
        endpoint: subscription.endpoint,
        p256dh: subscription.p256dh,
        auth: subscription.auth,
        negocioId,
        userId,
      },
    });
    return { id: result.id };
  }

  async unsubscribe(endpoint: string): Promise<boolean> {
    const result = await this.prisma.pushSubscription.deleteMany({
      where: { endpoint },
    });
    return result.count > 0;
  }

  async getByNegocioId(
    negocioId: number,
  ): Promise<Array<{ endpoint: string; p256dh: string; auth: string }>> {
    return this.prisma.pushSubscription.findMany({
      where: { negocioId },
      select: { endpoint: true, p256dh: true, auth: true },
    });
  }

  async getByUserId(
    userId: number,
  ): Promise<Array<{ endpoint: string; p256dh: string; auth: string }>> {
    return this.prisma.pushSubscription.findMany({
      where: { userId },
      select: { endpoint: true, p256dh: true, auth: true },
    });
  }
}

import { Injectable, Logger } from '@nestjs/common';
import webPush from 'web-push';
import { PushRepository } from '../repositories/push.repository';
import { env } from '../config/env';

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);
  private readonly vapidConfigured: boolean;

  constructor(private readonly pushRepository: PushRepository) {
    if (env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY && env.VAPID_EMAIL) {
      webPush.setVapidDetails(env.VAPID_EMAIL, env.VAPID_PUBLIC_KEY, env.VAPID_PRIVATE_KEY);
      this.vapidConfigured = true;
    } else {
      this.vapidConfigured = false;
      this.logger.warn('VAPID keys not configured — push notifications disabled');
    }
  }

  getVapidPublicKey(): string | null {
    return this.vapidConfigured ? (env.VAPID_PUBLIC_KEY ?? null) : null;
  }

  async subscribe(
    negocioId: number,
    userId: number | null,
    subscription: { endpoint: string; p256dh: string; auth: string },
  ): Promise<{ id: number }> {
    return this.pushRepository.subscribe(negocioId, userId, subscription);
  }

  async unsubscribe(endpoint: string): Promise<boolean> {
    return this.pushRepository.unsubscribe(endpoint);
  }
}

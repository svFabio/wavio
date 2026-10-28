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

  async sendNotification(
    negocioId: number,
    payload: { title: string; body: string; url?: string },
  ): Promise<void> {
    if (!this.vapidConfigured) {
      this.logger.debug('VAPID not configured, skipping push notification');
      return;
    }

    const subscriptions = await this.pushRepository.findByNegocioId(negocioId);
    if (!subscriptions || subscriptions.length === 0) return;

    const notificationPayload = JSON.stringify(payload);

    await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          await webPush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: {
                p256dh: sub.p256dh,
                auth: sub.auth,
              },
            },
            notificationPayload,
          );
        } catch (error: unknown) {
          const statusCode = (error as { statusCode?: number })?.statusCode;
          if (statusCode === 410 || statusCode === 404) {
            this.logger.log(`Removing expired subscription: ${sub.endpoint}`);
            await this.pushRepository.unsubscribe(sub.endpoint);
          } else {
            this.logger.warn(`Failed to send push notification to ${sub.endpoint}: ${error}`);
          }
        }
      }),
    );
  }
}

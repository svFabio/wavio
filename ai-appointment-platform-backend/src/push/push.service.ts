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

  isVapidConfigured(): boolean {
    return this.vapidConfigured;
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
    payload: { title: string; body: string; icon?: string },
  ): Promise<number> {
    if (!this.vapidConfigured) return 0;

    const subscriptions = await this.pushRepository.getByNegocioId(negocioId);
    return this.sendToSubscriptions(subscriptions, payload);
  }

  async sendToUser(
    userId: number,
    payload: { title: string; body: string; icon?: string },
  ): Promise<number> {
    if (!this.vapidConfigured) return 0;

    const subscriptions = await this.pushRepository.getByUserId(userId);
    return this.sendToSubscriptions(subscriptions, payload);
  }

  private async sendToSubscriptions(
    subscriptions: Array<{ endpoint: string; p256dh: string; auth: string }>,
    payload: { title: string; body: string; icon?: string },
  ): Promise<number> {
    const payloadString = JSON.stringify(payload);
    let sent = 0;

    for (const sub of subscriptions) {
      try {
        await webPush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payloadString,
        );
        sent++;
      } catch (error: unknown) {
        const statusCode = (error as { statusCode?: number }).statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await this.pushRepository.unsubscribe(sub.endpoint);
          this.logger.warn(`Removed stale subscription: ${sub.endpoint.slice(0, 50)}...`);
        } else {
          this.logger.error(`Push notification failed: ${error}`);
        }
      }
    }

    return sent;
  }
}

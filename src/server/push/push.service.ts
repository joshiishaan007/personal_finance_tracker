import webPush from 'web-push';
import { pushRepository as repo } from './push.repository';

interface PushPayload {
  title: string;
  body:  string;
  tag?:  string;
  url?:  string;
}

export const pushService = {
  async sendToUser(userId: string, payload: PushPayload): Promise<void> {
    const publicKey  = process.env.VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    const subject    = process.env.VAPID_EMAIL ?? 'mailto:app@example.com';
    if (!publicKey || !privateKey) return; // VAPID not configured — skip silently

    webPush.setVapidDetails(subject, publicKey, privateKey);

    const subs = await repo.findByUser(userId);
    if (!subs.length) return;

    const notification = JSON.stringify({
      title: payload.title,
      body:  payload.body,
      icon:  '/icon',
      tag:   payload.tag ?? 'budget-alert',
      url:   payload.url ?? '/budgets',
    });

    const results = await Promise.allSettled(
      subs.map((sub) =>
        webPush.sendNotification(
          JSON.parse(sub.subscription) as webPush.PushSubscription,
          notification,
        ),
      ),
    );

    // Remove stale subscriptions (device unsubscribed or endpoint gone).
    for (let i = 0; i < results.length; i++) {
      const r = results[i]!;
      if (r.status === 'rejected') {
        const statusCode = (r.reason as { statusCode?: number }).statusCode;
        if (statusCode === 410 || statusCode === 404) {
          await repo.removeByEndpoint(userId, subs[i]!.endpoint);
        }
      }
    }
  },
};

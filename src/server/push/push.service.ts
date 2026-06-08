import webPush from 'web-push';
import { pushRepository as repo } from './push.repository';

function initVapid() {
  const publicKey  = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject    = process.env.VAPID_EMAIL ?? 'mailto:app@example.com';
  if (!publicKey || !privateKey) return false;
  webPush.setVapidDetails(subject, publicKey, privateKey);
  return true;
}

interface PushPayload {
  title: string;
  body:  string;
  tag?:  string;
  url?:  string;
}

export const pushService = {
  async sendToUser(userId: string, payload: PushPayload): Promise<void> {
    if (!initVapid()) return;

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

  // Called by the daily cron — sends a transaction-logging reminder to every subscribed user.
  async sendDailyReminder(): Promise<{ sent: number; stale: number }> {
    if (!initVapid()) return { sent: 0, stale: 0 };

    const subs = await repo.findAll();
    if (!subs.length) return { sent: 0, stale: 0 };

    const notification = JSON.stringify({
      title: 'xpensr — Daily Reminder',
      body:  "Don't forget to log today's transactions! 📊",
      icon:  '/icon',
      tag:   'daily-reminder',
      url:   '/transactions?new=1',
    });

    const results = await Promise.allSettled(
      subs.map((sub) =>
        webPush.sendNotification(
          JSON.parse(sub.subscription) as webPush.PushSubscription,
          notification,
        ),
      ),
    );

    let sent = 0;
    const staleEndpoints: Array<{ userId: string; endpoint: string }> = [];

    results.forEach((r, i) => {
      if (r.status === 'fulfilled') {
        sent++;
      } else {
        const statusCode = (r.reason as { statusCode?: number }).statusCode;
        if (statusCode === 410 || statusCode === 404) {
          const sub = subs[i]!;
          staleEndpoints.push({ userId: String(sub.userId), endpoint: sub.endpoint });
        }
      }
    });

    // Purge expired subscriptions so they don't pile up.
    await Promise.all(staleEndpoints.map((s) => repo.removeByEndpoint(s.userId, s.endpoint)));

    return { sent, stale: staleEndpoints.length };
  },
};

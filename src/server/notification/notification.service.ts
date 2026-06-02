import { notificationRepository as repo } from './notification.repository';

export const notificationService = {
  async list(userId: string) {
    const [notifications, unread] = await Promise.all([
      repo.listRecent(userId),
      repo.countUnread(userId),
    ]);
    return { notifications, unread };
  },

  async markAllRead(userId: string) {
    await repo.markAllRead(userId);
  },

  async markRead(userId: string, id: string) {
    await repo.markOneRead(userId, id);
  },
};

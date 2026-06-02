import { NotificationModel } from '../models/notification.model';

export const notificationRepository = {
  listRecent: (userId: string) =>
    NotificationModel.find({ userId }).sort({ createdAt: -1 }).limit(50).lean(),

  countUnread: (userId: string) =>
    NotificationModel.countDocuments({ userId, read: false }),

  markAllRead: (userId: string) =>
    NotificationModel.updateMany({ userId, read: false }, { $set: { read: true } }),

  markOneRead: (userId: string, id: string) =>
    NotificationModel.findOneAndUpdate({ _id: id, userId }, { $set: { read: true } }).lean(),
};

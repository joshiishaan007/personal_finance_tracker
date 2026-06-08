import { Types } from 'mongoose';
import { PushSubscriptionModel } from '../models/pushSubscription.model';

export const pushRepository = {
  findByUser: (userId: string) =>
    PushSubscriptionModel.find({ userId: new Types.ObjectId(userId) }).lean().exec(),

  // Upsert so re-subscribing the same device replaces the old key.
  save: (userId: string, endpoint: string, subscription: string) =>
    PushSubscriptionModel.findOneAndUpdate(
      { userId: new Types.ObjectId(userId), endpoint },
      { $set: { subscription } },
      { upsert: true, new: true },
    ).lean().exec(),

  removeByEndpoint: (userId: string, endpoint: string) =>
    PushSubscriptionModel.findOneAndDelete({
      userId: new Types.ObjectId(userId),
      endpoint,
    }).lean().exec(),

  // Used by the cron job — fetch every subscription across all users.
  findAll: () => PushSubscriptionModel.find().lean().exec(),
};

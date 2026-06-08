import { Schema, model, Document, Types, Model, models } from 'mongoose';

export interface IPushSubscription extends Document {
  userId:       Types.ObjectId;
  endpoint:     string;
  subscription: string; // JSON.stringify of browser PushSubscription
  createdAt:    Date;
  updatedAt:    Date;
}

const pushSubscriptionSchema = new Schema<IPushSubscription>(
  {
    userId:       { type: Schema.Types.ObjectId, ref: 'User', required: true },
    endpoint:     { type: String, required: true },
    subscription: { type: String, required: true },
  },
  { timestamps: true },
);

// One subscription per device per user.
pushSubscriptionSchema.index({ userId: 1, endpoint: 1 }, { unique: true });

export const PushSubscriptionModel =
  (models.PushSubscription as Model<IPushSubscription>) ||
  model<IPushSubscription>('PushSubscription', pushSubscriptionSchema);

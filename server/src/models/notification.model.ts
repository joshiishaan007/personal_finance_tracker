import { Schema, model, Document, Types } from 'mongoose';

export interface INotification extends Document {
  userId: Types.ObjectId;
  type: string;
  title: string;
  body: string;
  read: boolean;
  expiresAt: Date;
  metadata?: Record<string, unknown>;
  schemaVersion: number;
  createdAt: Date;
}

const notificationSchema = new Schema<INotification>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, required: true },
  title: { type: String, required: true },
  body: { type: String, required: true },
  read: { type: Boolean, default: false },
  expiresAt: { type: Date, required: true },
  metadata: { type: Schema.Types.Mixed },
  schemaVersion: { type: Number, default: 1 },
}, { timestamps: true });

notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const NotificationModel = model<INotification>('Notification', notificationSchema);

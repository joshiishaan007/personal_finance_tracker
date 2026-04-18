import { Schema, model, Document } from 'mongoose';
import type { Currency } from '@finbuddy/shared';

export interface IUser extends Document {
  googleId: string;
  email: string;
  name: string;
  avatar?: string;
  role: 'user' | 'admin';
  currency: Currency;
  timezone: string;
  preferences: {
    theme: 'light' | 'dark' | 'system';
    dashboardWidgets: string[];
    compactMode: boolean;
    weekStartsOn: number;
  };
  schemaVersion: number;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>({
  googleId: { type: String, required: true, unique: true, index: true },
  email: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  avatar: String,
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  currency: { type: String, default: 'INR' },
  timezone: { type: String, default: 'Asia/Kolkata' },
  preferences: {
    theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
    dashboardWidgets: { type: [String], default: [] },
    compactMode: { type: Boolean, default: false },
    weekStartsOn: { type: Number, default: 1 },
  },
  schemaVersion: { type: Number, default: 1 },
}, { timestamps: true });

export const UserModel = model<IUser>('User', userSchema);

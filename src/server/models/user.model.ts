import { Schema, model, Document, Model, models } from 'mongoose';
import type { Currency } from '@/shared';

export interface IUser extends Document {
  googleId: string;
  email: string;
  name: string;
  avatar?: string;
  role: 'user' | 'admin';
  currency: Currency;
  timezone: string;
  openingBalance: number;
  // Bumped on logout / forced sign-out. Embedded in the JWT as `tv`; requireAuth
  // rejects a token whose tv no longer matches — server-side session revocation.
  tokenVersion: number;
  preferences: {
    theme: 'light' | 'dark' | 'system';
    mode: 'finance' | 'goals';
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
  openingBalance: { type: Number, default: 0 },
  tokenVersion: { type: Number, default: 0 },
  preferences: {
    theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
    mode: { type: String, enum: ['finance', 'goals'], default: 'finance' },
    dashboardWidgets: { type: [String], default: [] },
    compactMode: { type: Boolean, default: false },
    weekStartsOn: { type: Number, default: 1 },
  },
  schemaVersion: { type: Number, default: 1 },
}, { timestamps: true });

export const UserModel = (models.User as Model<IUser>) || model<IUser>('User', userSchema);

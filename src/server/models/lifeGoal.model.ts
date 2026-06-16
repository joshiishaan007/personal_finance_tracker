import { Schema, model, Document, Types, Model, models } from 'mongoose';
import type { LifeGoalArea, LifeGoalStatus } from '@/shared';

export interface ILifeGoal extends Document {
  userId: Types.ObjectId;
  title: string;
  description?: string;
  area: LifeGoalArea;
  icon: string;
  color: string;
  status: LifeGoalStatus;
  targetValue?: number;
  dailyTarget?: number;
  trackDays?: number[];
  unit?: string;
  currentValue: number;
  manualProgress?: number;
  targetDate?: Date;
  milestonesHit: number[];
  schemaVersion: number;
  createdAt: Date;
  updatedAt: Date;
}

const lifeGoalSchema = new Schema<ILifeGoal>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true },
  description: String,
  area: { type: String, enum: ['health', 'career', 'learning', 'finance', 'personal', 'relationships', 'other'], default: 'personal' },
  icon: { type: String, default: '🎯' },
  color: { type: String, default: '#14B8A6' },
  status: { type: String, enum: ['active', 'achieved', 'paused', 'archived'], default: 'active' },
  targetValue: Number,
  dailyTarget: Number,
  trackDays: { type: [Number], default: undefined },
  unit: String,
  currentValue: { type: Number, default: 0 },
  manualProgress: Number,
  targetDate: Date,
  milestonesHit: { type: [Number], default: [] },
  schemaVersion: { type: Number, default: 1 },
}, { timestamps: true });

lifeGoalSchema.index({ userId: 1, status: 1 });

export const LifeGoalModel = (models.LifeGoal as Model<ILifeGoal>) || model<ILifeGoal>('LifeGoal', lifeGoalSchema);

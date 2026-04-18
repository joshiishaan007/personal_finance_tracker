import { Schema, model, Document, Types } from 'mongoose';

export interface IGoal extends Document {
  userId: Types.ObjectId;
  title: string;
  targetAmount: number;
  savedAmount: number;
  deadline?: Date;
  icon: string;
  color: string;
  status: 'active' | 'achieved' | 'paused';
  milestonesHit: number[];
  schemaVersion: number;
  createdAt: Date;
  updatedAt: Date;
}

const goalSchema = new Schema<IGoal>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true },
  targetAmount: { type: Number, required: true },
  savedAmount: { type: Number, default: 0 },
  deadline: Date,
  icon: { type: String, default: '🎯' },
  color: { type: String, default: '#6366F1' },
  status: { type: String, enum: ['active', 'achieved', 'paused'], default: 'active' },
  milestonesHit: { type: [Number], default: [] },
  schemaVersion: { type: Number, default: 1 },
}, { timestamps: true });

export const GoalModel = model<IGoal>('Goal', goalSchema);

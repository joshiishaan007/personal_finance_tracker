import { Schema, model, Document, Types, Model, models } from 'mongoose';
import type { TaskPriority } from '@/shared';

export interface ITask extends Document {
  userId: Types.ObjectId;
  title: string;
  done: boolean;
  doneAt?: Date;
  dueDate?: Date;
  goalId?: Types.ObjectId;
  priority: TaskPriority;
  order?: number;
  schemaVersion: number;
  createdAt: Date;
  updatedAt: Date;
}

const taskSchema = new Schema<ITask>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true },
  done: { type: Boolean, default: false },
  doneAt: Date,
  dueDate: Date,
  goalId: { type: Schema.Types.ObjectId, ref: 'LifeGoal' },
  priority: { type: String, enum: ['low', 'med', 'high'], default: 'med' },
  order: Number,
  schemaVersion: { type: Number, default: 1 },
}, { timestamps: true });

taskSchema.index({ userId: 1, done: 1, dueDate: 1 });
taskSchema.index({ userId: 1, goalId: 1 });

export const TaskModel = (models.Task as Model<ITask>) || model<ITask>('Task', taskSchema);

import { Schema, model, Document, Types, Model, models } from 'mongoose';

export interface IContribution extends Document {
  userId: Types.ObjectId;
  goalId: Types.ObjectId;
  date: Date;
  value: number;
  note?: string;
  schemaVersion: number;
  createdAt: Date;
  updatedAt: Date;
}

const contributionSchema = new Schema<IContribution>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  goalId: { type: Schema.Types.ObjectId, ref: 'LifeGoal', required: true },
  date: { type: Date, required: true },
  value: { type: Number, default: 1 },
  note: String,
  schemaVersion: { type: Number, default: 1 },
}, { timestamps: true });

contributionSchema.index({ userId: 1, goalId: 1, date: -1 });
contributionSchema.index({ userId: 1, date: -1 }); // streak across all goals

export const ContributionModel = (models.Contribution as Model<IContribution>) || model<IContribution>('Contribution', contributionSchema);

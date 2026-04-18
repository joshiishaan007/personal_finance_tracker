import { Schema, model, Document, Types } from 'mongoose';

export interface IAIInsight extends Document {
  userId: Types.ObjectId;
  generatedAt: Date;
  contextHash: string;
  insights: Array<{
    type: string;
    title: string;
    body: string;
    why: string;
    dataPoints: Map<string, number>;
  }>;
  dismissedAt?: Date;
  expiresAt: Date;
  schemaVersion: number;
}

const aiInsightSchema = new Schema<IAIInsight>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  generatedAt: { type: Date, default: Date.now },
  contextHash: { type: String, required: true },
  insights: [{
    type: { type: String, required: true },
    title: { type: String, required: true },
    body: { type: String, required: true },
    why: { type: String, required: true },
    dataPoints: { type: Map, of: Number },
  }],
  dismissedAt: Date,
  expiresAt: { type: Date, required: true },
  schemaVersion: { type: Number, default: 1 },
}, { timestamps: true });

aiInsightSchema.index({ userId: 1, expiresAt: 1 });

export const AIInsightModel = model<IAIInsight>('AIInsight', aiInsightSchema);

import { Schema, model, Document, Types } from 'mongoose';

export interface IAuditLog extends Document {
  userId: Types.ObjectId;
  action: string;
  entityType: string;
  entityId: string;
  diff: Record<string, unknown>;
  timestamp: Date;
}

const auditLogSchema = new Schema<IAuditLog>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, required: true },
  entityType: { type: String, required: true },
  entityId: { type: String, required: true },
  diff: { type: Schema.Types.Mixed, default: {} },
  timestamp: { type: Date, default: Date.now },
}, { timestamps: false });

auditLogSchema.index({ userId: 1, timestamp: -1 });
auditLogSchema.index({ entityType: 1, entityId: 1 });

export const AuditLogModel = model<IAuditLog>('AuditLog', auditLogSchema);

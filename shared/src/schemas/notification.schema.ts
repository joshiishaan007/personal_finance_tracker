import { z } from 'zod';

export const NotificationTypeEnum = z.enum([
  'budget_overspend',
  'upcoming_recurring',
  'goal_milestone',
  'monthly_report',
  'ai_insight',
  'backup_nudge',
]);

export type NotificationType = z.infer<typeof NotificationTypeEnum>;

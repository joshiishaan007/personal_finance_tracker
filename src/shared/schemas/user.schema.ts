import { z } from 'zod';
import { ISO4217Currencies } from '../types/common';

export const UserPreferencesSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).default('system'),
  mode: z.enum(['finance', 'goals']).default('finance'),
  dashboardWidgets: z.array(z.string()).default([]),
  compactMode: z.boolean().default(false),
  weekStartsOn: z.number().min(0).max(6).default(1),
});

export const UpdatePreferencesSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).optional(),
  mode: z.enum(['finance', 'goals']).optional(),
  dashboardWidgets: z.array(z.string()).optional(),
  compactMode: z.boolean().optional(),
  weekStartsOn: z.number().min(0).max(6).optional(),
  timezone: z.string().optional(),
  // Top-level user field (not nested under preferences), handled by userService.
  currency: z.enum(['INR', 'USD']).optional(),
});

export type UserPreferences = z.infer<typeof UserPreferencesSchema>;
export type UpdatePreferences = z.infer<typeof UpdatePreferencesSchema>;

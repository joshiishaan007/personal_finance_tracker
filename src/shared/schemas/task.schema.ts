import { z } from 'zod';

export const TaskPriorityEnum = z.enum(['low', 'med', 'high']);

export const CreateTaskSchema = z.object({
  title: z.string().min(1).max(200),
  done: z.boolean().default(false),
  dueDate: z.string().datetime().optional(),
  goalId: z.string().optional(), // optionally linked to a life goal
  priority: TaskPriorityEnum.default('med'),
  order: z.number().optional(),
});

export const UpdateTaskSchema = CreateTaskSchema.partial();

export const TaskFilterSchema = z.object({
  goalId: z.string().optional(),
  done: z.enum(['true', 'false']).optional(),
  scope: z.enum(['today', 'week', 'overdue', 'all']).optional(),
});

export type CreateTask = z.infer<typeof CreateTaskSchema>;
export type UpdateTask = z.infer<typeof UpdateTaskSchema>;
export type TaskFilter = z.infer<typeof TaskFilterSchema>;
export type TaskPriority = z.infer<typeof TaskPriorityEnum>;

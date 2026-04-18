import type { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

export function validate(schema: ZodSchema, source: 'body' | 'query' | 'params' = 'body') {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const details: Record<string, string[]> = {};
      for (const issue of (result.error as ZodError).issues) {
        const key = issue.path.join('.') || '_root';
        details[key] = [...(details[key] ?? []), issue.message];
      }
      res.status(400).json({ success: false, error: 'Validation failed', details });
      return;
    }
    // Replace with parsed/coerced values
    (req as unknown as Record<string, unknown>)[source] = result.data;
    next();
  };
}

import type { NextRequest } from 'next/server';
import type { ZodTypeAny, infer as zInfer } from 'zod';
import { HttpError } from './errors';

// Validate a parsed JSON body. Returns the schema's OUTPUT type (defaults applied).
export function validateBody<S extends ZodTypeAny>(schema: S, body: unknown): zInfer<S> {
  const result = schema.safeParse(body);
  if (!result.success) throw new HttpError(400, 'Validation failed');
  return result.data;
}

// Validate URL search params. Repeated keys (e.g. ?tags=a&tags=b) become arrays.
export function validateQuery<S extends ZodTypeAny>(schema: S, req: NextRequest): zInfer<S> {
  const params = req.nextUrl.searchParams;
  const obj: Record<string, unknown> = {};
  for (const key of new Set(params.keys())) {
    const all = params.getAll(key);
    obj[key] = all.length > 1 ? all : all[0];
  }
  const result = schema.safeParse(obj);
  if (!result.success) throw new HttpError(400, 'Validation failed');
  return result.data;
}

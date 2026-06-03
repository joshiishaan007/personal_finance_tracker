import { NextResponse } from 'next/server';
import type { Reason } from './result';

const reasonStatus: Record<Reason, number> = {
  not_found: 404,
  duplicate: 409,
  forbidden: 403,
  unauthorized: 401,
  bad_request: 400,
  quota: 429,
};

export function ok<T>(data: T, status = 200): NextResponse {
  return NextResponse.json({ success: true, data }, { status });
}

export function created<T>(data: T): NextResponse {
  return ok(data, 201);
}

export function fail(reason: Reason, error?: string): NextResponse {
  return NextResponse.json({ success: false, error: error ?? reason }, { status: reasonStatus[reason] });
}

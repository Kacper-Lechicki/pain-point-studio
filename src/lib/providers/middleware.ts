/**
 * Provider-agnostic session middleware interface. Handles token refresh
 * on every request in the Next.js middleware layer.
 */
import type { NextRequest, NextResponse } from 'next/server';

import type { AppUser } from './types';

export interface SessionMiddleware {
  updateSession(req: NextRequest): Promise<{ response: NextResponse; user: AppUser | null }>;
}

import { NextRequest, NextResponse } from 'next/server';

import i18nMiddleware from '@/i18n/config';
import { isAuthenticated, isProtectionEnabled } from '@/lib/common/deploy-credentials';
import { updateSession } from '@/lib/supabase/middleware';

export default async function middleware(req: NextRequest) {
  await updateSession(req);

  if (!isProtectionEnabled()) {
    return i18nMiddleware(req);
  }

  if (isAuthenticated(req)) {
    return i18nMiddleware(req);
  }

  return new NextResponse('Auth Required.', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Secure Area"',
    },
  });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};

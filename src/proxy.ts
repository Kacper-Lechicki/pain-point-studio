import { NextRequest, NextResponse } from 'next/server';

import i18nMiddleware from '@/i18n/config';
import { isAuthenticated, isProtectionEnabled } from '@/lib/deploy-credentials';

export default function middleware(req: NextRequest) {
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
  matcher: ['/', '/(en)/:path*'],
};

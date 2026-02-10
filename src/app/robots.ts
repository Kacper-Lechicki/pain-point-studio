import { MetadataRoute } from 'next';

import { env } from '@/lib/common/env';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Dashboard and app routes are private; blocking indexing is intentional.
      disallow: [
        '/api/',
        '/_next/',
        '/static/',
        '/*?*',
        '/*/dashboard',
        '/dashboard',
        '/*/settings',
        '/settings',
        '/*/profile',
        '/profile',
        '/*/sign-in',
        '/*/sign-up',
        '/*/sign-out',
        '/*/forgot-password',
        '/*/update-password',
        '/*/auth/',
      ],
    },
    sitemap: `${env.NEXT_PUBLIC_APP_URL}/sitemap.xml`,
  };
}

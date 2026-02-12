import type { NextConfig } from 'next';

import createNextIntlPlugin from 'next-intl/plugin';

import { env } from './src/lib/common/env';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const supabaseUrl = new URL(env.NEXT_PUBLIC_SUPABASE_URL);

const cspDirectives = [
  `default-src 'self'`,
  `script-src 'self' 'unsafe-inline' 'unsafe-eval'`,
  `style-src 'self' 'unsafe-inline'`,
  `img-src 'self' blob: data: https://lh3.googleusercontent.com https://avatars.githubusercontent.com ${supabaseUrl.origin}`,
  `font-src 'self'`,
  `connect-src 'self' ${supabaseUrl.origin} https://accounts.google.com https://github.com`,
  `frame-src 'self' https://accounts.google.com https://github.com`,
  `object-src 'none'`,
  `base-uri 'self'`,
  `form-action 'self'`,
  `frame-ancestors 'none'`,
].join('; ');

const nextConfig: NextConfig = {
  reactCompiler: true,
  poweredByHeader: false,
  ...(env.STANDALONE === 'true' ? { output: 'standalone' } : {}),
  typescript: {
    ignoreBuildErrors: false,
  },
  typedRoutes: true,
  logging: {
    fetches: { fullUrl: false },
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
      {
        protocol: supabaseUrl.protocol.replace(':', '') as 'http' | 'https',
        hostname: supabaseUrl.hostname,
        port: supabaseUrl.port,
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()',
          },
          {
            key: 'Content-Security-Policy',
            value: cspDirectives,
          },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);

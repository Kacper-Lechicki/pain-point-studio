import type { NextConfig } from 'next';

import withBundleAnalyzer from '@next/bundle-analyzer';
import createNextIntlPlugin from 'next-intl/plugin';

import { env } from './src/lib/common/env';

// next-intl plugin: server-side locale resolution and message loading
const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

// Supabase origin used in CSP and image remotePatterns (auth avatars, storage)
const supabaseUrl = new URL(env.NEXT_PUBLIC_SUPABASE_URL);

const isDev = process.env.NODE_ENV === 'development';

// Content-Security-Policy: allow Supabase, Google/GitHub OAuth; unsafe-eval only in dev (HMR)
const cspDirectives = [
  `default-src 'self'`,
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
  `style-src 'self' 'unsafe-inline'`,
  `img-src 'self' blob: data: https://lh3.googleusercontent.com https://avatars.githubusercontent.com ${supabaseUrl.origin}`,
  `font-src 'self'`,
  `connect-src 'self' ${supabaseUrl.origin} ${supabaseUrl.origin.replace(/^http/, 'ws')} https://accounts.google.com https://github.com`,
  `frame-src 'self' https://accounts.google.com https://github.com`,
  `object-src 'none'`,
  `base-uri 'self'`,
  `form-action 'self'`,
  `frame-ancestors 'none'`,
].join('; ');

const nextConfig: NextConfig = {
  // React Compiler: automatic memoization (no manual useMemo/useCallback for pure logic)
  reactCompiler: true,
  // Remove X-Powered-By header for security (avoid fingerprinting)
  poweredByHeader: false,
  // Standalone output for Docker/slim deployments (env.STANDALONE=true)
  ...(env.STANDALONE === 'true' ? { output: 'standalone' } : {}),
  typescript: {
    // Fail build on type errors (no silent ignores)
    ignoreBuildErrors: false,
  },
  // Type-safe routes from app directory structure
  typedRoutes: true,
  logging: {
    // Hide full URL in fetch logs (privacy, less noise)
    fetches: { fullUrl: false },
  },
  images: {
    // Prefer modern formats; allow Google/GitHub avatars and Supabase storage
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
          // HSTS: 2 years, include subdomains, preload list eligible
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          // Disable sensitive APIs (camera, mic, geolocation, FLoC)
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

// Bundle analyzer when ANALYZE=true (e.g. pnpm build with ANALYZE=true)
const analyzeBundle = withBundleAnalyzer({ enabled: process.env.ANALYZE === 'true' });

export default analyzeBundle(withNextIntl(nextConfig));

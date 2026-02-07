import type { NextConfig } from 'next';

import createNextIntlPlugin from 'next-intl/plugin';

import { env } from './src/lib/common/env';

// Initialize next-intl plugin with the request configuration path
const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

// Build CSP directives - allows Supabase, OAuth avatar domains, and Next.js requirements
const supabaseUrl = new URL(env.NEXT_PUBLIC_SUPABASE_URL);

const cspDirectives = [
  `default-src 'self'`,
  `script-src 'self' 'unsafe-inline' 'unsafe-eval'`,
  `style-src 'self' 'unsafe-inline'`,
  `img-src 'self' blob: data: https://lh3.googleusercontent.com https://avatars.githubusercontent.com`,
  `font-src 'self'`,
  `connect-src 'self' ${supabaseUrl.origin} https://accounts.google.com https://github.com`,
  `frame-src 'self' https://accounts.google.com https://github.com`,
  `object-src 'none'`,
  `base-uri 'self'`,
  `form-action 'self'`,
  `frame-ancestors 'none'`,
].join('; ');

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  // Enables the React Compiler (React Forget) for automatic memoization
  reactCompiler: true,
  // Disables the 'X-Powered-By' header for security
  poweredByHeader: false,
  // Creates a standalone build for Docker/Self-hosting (keeps image size small)
  // Only enabled when STANDALONE env var is set, to allow 'next start' to work locally
  ...(env.STANDALONE === 'true' ? { output: 'standalone' } : {}),
  // TypeScript validation configuration
  typescript: {
    ignoreBuildErrors: false,
  },
  // Enable typed routes (moved from experimental)
  typedRoutes: true,
  // Logging configuration
  logging: {
    fetches: { fullUrl: false },
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' }, // Google Auth
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' }, // GitHub Auth
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Prevent clickjacking attacks
          { key: 'X-Frame-Options', value: 'DENY' },
          // Prevent MIME type sniffing
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // Control referrer information
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // Enable DNS prefetching control
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          // HTTP Strict Transport Security (HSTS) - Enforces HTTPS
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          // Permissions Policy - Locks down sensitive browser features
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()',
          },
          // Content Security Policy - Prevents XSS and data injection attacks
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

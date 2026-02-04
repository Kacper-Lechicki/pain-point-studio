import type { NextConfig } from 'next';

import createNextIntlPlugin from 'next-intl/plugin';

import { env } from './src/lib/env';

// Initialize next-intl plugin with the request configuration path
const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  // -----------------------------------------------------------------------------
  // 1. CORE & REACT CONFIGURATION
  // Enables the React Compiler (React Forget) for automatic memoization
  reactCompiler: true,
  // Disables the 'X-Powered-By' header for security
  poweredByHeader: false,
  // Creates a standalone build for Docker/Self-hosting (keeps image size small)
  // Only enabled when STANDALONE env var is set, to allow 'next start' to work locally
  ...(env.STANDALONE === 'true' ? { output: 'standalone' } : {}),

  // -----------------------------------------------------------------------------
  // 2. BUILD & DEVELOPER EXPERIENCE
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

  // -----------------------------------------------------------------------------
  // 3. ASSET & IMAGE CONFIGURATION
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' }, // Google Auth
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' }, // GitHub Auth
    ],
  },

  // -----------------------------------------------------------------------------
  // 4. EXPERIMENTAL FEATURES
  experimental: {},

  // -----------------------------------------------------------------------------
  // 5. SECURITY HEADERS
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
        ],
      },
    ];
  },
};

// Export the configuration wrapped with the next-intl plugin
export default withNextIntl(nextConfig);

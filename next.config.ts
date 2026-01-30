import type { NextConfig } from 'next';

import createNextIntlPlugin from 'next-intl/plugin';

// Initialize next-intl plugin with the request configuration path
const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  // Enables the experimental React Compiler (React Forget) for automatic memoization
  reactCompiler: true,
};

// Export the configuration wrapped with the next-intl plugin
export default withNextIntl(nextConfig);

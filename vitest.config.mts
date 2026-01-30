import path from 'path';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Enables React plugin to handle JSX/TSX syntax
  plugins: [react()],
  test: {
    // Simulates a browser environment (DOM) required for testing React components
    environment: 'jsdom',
    // Globally enables test functions (describe, it, expect) without importing them
    globals: true,
    // Array of configuration files run before tests start
    setupFiles: [],
    // Defines the pattern for files treated as test files
    include: ['**/*.test.{ts,tsx}'],
    // Explicitly exclude directories to avoid unnecessary scanning
    exclude: ['**/node_modules/**', '**/e2e/**', '**/.next/**'],
    // Configures path aliases, mapping '@' to the 'src' directory (consistent with tsconfig)
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});

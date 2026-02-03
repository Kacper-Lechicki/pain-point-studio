import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import noSecrets from 'eslint-plugin-no-secrets';
import { defineConfig, globalIgnores } from 'eslint/config';

// Define ESLint configuration using the Flat Config format
const eslintConfig = defineConfig([
  // Include Next.js Core Web Vitals rules for performance and best practices
  ...nextVitals,
  // Include Next.js TypeScript-specific linting rules
  ...nextTs,
  // Define global patterns to ignore during linting
  globalIgnores([
    '**/node_modules/**',
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    'coverage/**',
    'reports/**',
    'test-results/**',
    'playwright-report/**',
    'public/**',
  ]),
  // Enforce blank lines before control flow statements
  {
    rules: {
      'padding-line-between-statements': [
        'error',
        // Blank line BEFORE control flow statements
        { blankLine: 'always', prev: '*', next: 'return' },
        { blankLine: 'always', prev: '*', next: 'if' },
        { blankLine: 'always', prev: '*', next: 'for' },
        { blankLine: 'always', prev: '*', next: 'while' },
        { blankLine: 'always', prev: '*', next: 'switch' },
        { blankLine: 'always', prev: '*', next: 'try' },
        { blankLine: 'always', prev: '*', next: 'throw' },
        // Blank line AFTER block-like statements (if, for, while, etc.)
        { blankLine: 'always', prev: 'block-like', next: '*' },
      ],
      // Warn on console.log locally, but lint-staged blocks commit
      'no-console': 'warn',
      // Warn on unused variables
      '@typescript-eslint/no-unused-vars': 'warn',
      // Enforce curly braces for all control statements
      curly: ['error', 'all'],
    },
  },
  // Detect hardcoded secrets (API keys, tokens, etc.)
  {
    plugins: { 'no-secrets': noSecrets },
    rules: {
      'no-secrets/no-secrets': 'error',
    },
  },
]);

// Export the aggregated ESLint configuration
export default eslintConfig;

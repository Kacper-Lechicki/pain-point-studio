import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import noSecrets from 'eslint-plugin-no-secrets';
import { defineConfig, globalIgnores } from 'eslint/config';
import tseslint from 'typescript-eslint';

const eslintConfig = defineConfig([
  // Next.js Core Web Vitals and TypeScript presets
  ...nextVitals,
  ...nextTs,
  // Directories excluded from linting (build output, deps, reports, scripts)
  globalIgnores([
    '**/node_modules/**',
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    'coverage/**',
    'reports/**',
    'test-results/**',
    'scripts/**',
  ]),
  // Global style and quality rules (blank lines, console, unused vars, curly braces)
  {
    rules: {
      'padding-line-between-statements': [
        'error',
        { blankLine: 'always', prev: '*', next: 'return' },
        { blankLine: 'always', prev: '*', next: 'if' },
        { blankLine: 'always', prev: '*', next: 'for' },
        { blankLine: 'always', prev: '*', next: 'while' },
        { blankLine: 'always', prev: '*', next: 'switch' },
        { blankLine: 'always', prev: '*', next: 'try' },
        { blankLine: 'always', prev: '*', next: 'throw' },
        { blankLine: 'always', prev: 'block-like', next: '*' },
      ],
      'no-console': 'warn',
      '@typescript-eslint/no-unused-vars': 'warn',
      curly: ['error', 'all'],
    },
  },
  // TypeScript-aware rules for .ts/.tsx/.mts (type-checked, floating promises)
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.mts'],
    plugins: { '@typescript-eslint': tseslint.plugin },
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    rules: {
      '@typescript-eslint/no-floating-promises': 'error',
    },
  },
  // Enforce @/ alias imports — disallow relative parent imports in non-test, non-barrel files
  {
    files: ['src/**/*.ts', 'src/**/*.tsx'],
    ignores: ['src/**/*.test.ts', 'src/**/*.test.tsx', 'src/**/index.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['../*'],
              message: 'Use @/ alias instead of relative parent imports.',
            },
          ],
        },
      ],
    },
  },
  // Secret patterns: disabled — too many false positives (i18n keys, test names, constant names)
  {
    plugins: { 'no-secrets': noSecrets },
    rules: {
      'no-secrets/no-secrets': 'off',
    },
  },
  // Public static assets (scripts, etc.) — relaxed rules, no TS/secret checks
  {
    files: ['public/**'],
    languageOptions: { parserOptions: { ecmaVersion: 'latest', sourceType: 'script' } },
    rules: {
      'padding-line-between-statements': 'off',
      'no-console': 'off',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      curly: 'off',
      'no-secrets/no-secrets': 'off',
    },
  },
]);

export default eslintConfig;

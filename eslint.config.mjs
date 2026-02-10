import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import noSecrets from 'eslint-plugin-no-secrets';
import tseslint from 'typescript-eslint';
import { defineConfig, globalIgnores } from 'eslint/config';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
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
  {
    plugins: { 'no-secrets': noSecrets },
    rules: {
      'no-secrets/no-secrets': 'error',
    },
  },
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

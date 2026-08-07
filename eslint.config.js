/**
 * eslint.config.
 *
 * @copyright 2026 Joe Huss <detain@interserver.net>
 */

// Minimal flat ESLint config for the TypeScript sources.
import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['dist/**', 'coverage/**', 'node_modules/**'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },
  {
    // Build-time scripts run under Node, not in a bundle. Declared inline
    // rather than pulling in the `globals` package for two names.
    files: ['scripts/**/*.mjs'],
    languageOptions: {
      globals: { console: 'readonly', process: 'readonly' },
    },
  },
);

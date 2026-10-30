/**
 * vite.config.
 *
 * @copyright 2026 Joe Huss <detain@interserver.net>
 */

import { defineConfig } from 'vite';
import { resolve } from 'node:path';

// Framework-agnostic lib build — NO Vue/React plugin, NO runtime externals.
// Emits ES + CJS so the package is consumable from web bundlers (mobile RN
// Metro, windows/tizen Vite) and Node/CJS alike. This package ships only
// types + tiny pure helpers; there are no CSS or asset imports.
export default defineConfig({
  build: {
    assetsInlineLimit: 0,
    // Compatibility target (estate review 2026-10-28, fedev): the committed
    // bundle's syntax ceiling becomes a CONTRACT, not an accident of the
    // current vite default. esbuild LOWERS (optional chaining and friends)
    // to ES2019 so TV-webview consumers that load dist/ directly can parse
    // it. `package.json` engines describes the CONSUMABLE floor; this line
    // is what actually guarantees it.
    target: 'es2019',
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'PhlixContracts',
      formats: ['es', 'cjs'],
      fileName: (format) => `phlix-contracts.${format === 'es' ? 'js' : 'umd.cjs'}`,
    },
    sourcemap: true,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      // 'lcov' is REQUIRED: it is the only reporter here that writes
      // ./coverage/lcov.info, which CI uploads to Codacy. Without it the
      // upload step runs, finds no file, and reports success having sent
      // nothing.
      reporter: ['text-summary', 'text', 'html', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: ['**/*.test.ts', 'src/index.ts'],
    },
  },
});

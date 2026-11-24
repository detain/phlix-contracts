/**
 * vite.config.
 *
 * @copyright 2026 Joe Huss <detain@interserver.net>
 */

import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// ESM-robust config directory (phlix-contracts-023). This package is
// `"type": "module"`, so the CJS globals `__dirname`/`__filename` do not
// exist at config scope natively; relying on the bundling loader's injected
// boilerplate is the fragility. `import.meta.dirname` would be shorter but
// requires Node >= 20.11, while package.json engines allow node >= 18 —
// `fileURLToPath(new URL('.', import.meta.url))` is therefore the deliberate
// pick: valid on every supported runtime.
const configDir = fileURLToPath(new URL('.', import.meta.url));

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
      entry: resolve(configDir, 'src/index.ts'),
      name: 'PhlixContracts',
      formats: ['es', 'cjs'],
      fileName: (format) => `phlix-contracts.${format === 'es' ? 'js' : 'umd.cjs'}`,
    },
    sourcemap: true,
  },
  resolve: {
    alias: {
      '@': resolve(configDir, 'src'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    // Estate venue law: vitest runs serial (CONTRIBUTING.md release ritual —
    // "vitest stays serial: --no-file-parallelism is the estate venue law").
    // Pinning it in config means contributors get serial execution without
    // remembering the flag (phlix-contracts-027).
    fileParallelism: false,
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

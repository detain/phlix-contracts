---
description: Coverage reporter + CI gate invariants for the vitest config and contracts-ci workflow
globs:
  - vite.config.ts
  - .github/workflows/ci.yml
alwaysApply: false
---

# Coverage & CI (`vite.config.ts`, `.github/workflows/ci.yml`)

- CI runs the suite as `npm run test:run -- --coverage`. There is no
  `test:coverage` script in `package.json` — pass the flag through rather than
  adding a parallel script.
- The `coverage.reporter` list in `vite.config.ts` MUST keep `lcov`. It is the
  only reporter that writes `./coverage/lcov.info`, the exact path the Codacy
  step reads. Drop it and the upload step still reports success having sent
  nothing.
- `coverage.include` is `src/**/*.ts`; `coverage.exclude` drops `**/*.test.ts`
  and `src/index.ts` (pure re-export barrel). Keep new helper modules under
  `src/` so they are measured.
- The `codacy/codacy-coverage-reporter-action@v1` step is
  `continue-on-error: true` on purpose — a missing/expired `CODACY_API_TOKEN`
  or a Codacy outage must never turn the gate red. Consequence: the step's
  conclusion is always green, so confirm an upload by reading the step log for
  `Coverage data uploaded`, not by the check status.
- Gate order is `npm run lint` → `npm run typecheck` → `npm run build` →
  tests. `npm run build` re-runs `tsc --noEmit` itself; keep the standalone
  `typecheck` step as the fast-fail.
- Tests live in `test/*.test.ts` (e.g. `test/audio.test.ts`,
  `test/rating.test.ts`) and import from `../src/...`, never from `dist/`.

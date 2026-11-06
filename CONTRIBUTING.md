# Contributing to `@phlix/contracts`

This package is the estate's wire authority: every type here is a promise the
server/hub wire keeps, and every registry row is a value a live handler emits.
The governing law lives in the `src/errors.ts` file header (registry law + the
CO-OWNED/byte-ident/mint-from-source rules) and in each generated file's
provenance block. This document is the operational checklist around them.

## Minting an error code (registry checklist)

A code is minted only from a verified emit site in phlix-server or phlix-hub —
never from a wish. Run the checklist in this order:

1. **Confirm the emit site at source.** Open the hub/server working tree and
   read the exact line that places the literal on the wire. The registry cites
   it `hub|srv Path/File.php:NN` in the entry's docblock; cite grammar is
   pinned in `scripts/check-error-cites.mjs`'s header (prefix required on a
   comment's first cite; bare `:NN` attaches to the last file in the SAME
   comment; no prose `:NN` next to a `.php` name).
2. **Add the row**: the dotted code to its domain object, the bare-snake twin
   where the domain carries twins, the union member, and the `ERROR_CODES`
   list. `src/errors.ts` is the single hand-edited source of the registry.
3. **Regenerate + rotate floors**: `npm run build` emits `dist/error-codes.json`.
   Then run the suite and rotate the floor from the MEASURED RED —
   `test/errors.test.ts` pins the `ERROR_CODES` total (`toHaveLength(205)`)
   and the declaration-order walk over `ERROR_DOMAINS`; bump the floor to the
   count the red reports. Never bless a number you did not see fail.
4. **Bump the package version** (`package.json`) and write the CHANGELOG
   `### Added` entry under `[Unreleased]`.
5. **Type-level break callout (mandatory release law)**: minting is additive
   for wire consumers but BREAKING for exhaustive typed consumers
   (`Record<ErrorCode, …>` switches). The entry carries the repo's own 0.3.12
   precedent wording: “⚠ Numbered as a …, but … **breaking** for any consumer
   that had exhaustively switched on the old … union. The number understates
   it.” Consumers upgrade by adding a row — that red type-check is the gate
   doing its job.
6. **Downstream re-vendor duty**: any release moving `dist/error-codes.json`
   bytes REQUIRES the server/hub `ErrorCodesContractTest` fixture pins to
   rotate in lockstep. Say so in the release notes' consumer-target section.

## Regenerating route tuples

`src/routeManifest.generated.ts` mirrors the server's live router. From a
phlix-server checkout (argv 1 is required, never defaulted):

```sh
node scripts/generate-server-route-manifest.mjs /path/to/phlix-server
```

Commit the regenerated TS **and** the `npm run build` output together —
`dist/server-route-manifest.json` is emitted from it and CI's
`git diff --exit-code -- dist/` freshness step reddens on any drift. The
The tuple-count floor and provenance pins live in
`test/routeManifest.test.ts` (the `toBe(415)` total, the
`SERVER_ROUTE_MANIFEST_PROVENANCE` cross-check, and the artifact-for-artifact
comparison that downstream repos key their md5 currency on); rotate them the
same measured-red way, and treat the trio (`dist/error-codes.json` /
`dist/server-route-manifest.json` / `dist/mcp-scopes.json`) as
moves-TOGETHER-or-not-at-all: a docs-only commit must not move any of them.

Server-verified wire fixtures (`test/fixtures/stream-track-vectors.json`,
`test/fixtures/syncplay-envelope-vectors.json`) regenerate with the two
`scripts/dump-server-*.php` dumpers — see README Development for exact
invocations, the provenance-`serverSha` rule, and the throwaway-MySQL
requirement of the syncplay dumper. Re-run both `*ShapeParity` suites after.

## Release ritual

1. `npm run lint && npm run typecheck && npm run test:run` (vitest stays
   serial: `--no-file-parallelism` is the estate venue law) and
   `npm run verify:cites` at the current hub/server tips — 0 problems before
   a tag moves; re-stamp the `src/errors.ts` COORDINATE CURRENCY paragraph
   with the measured `ok`/`problems` figures when tips change.
2. `npm run build` — commit the regenerated `dist/` in the same change;
   verify the three registry md5s match what the CHANGELOG entry says.
3. Fold the `[Unreleased]` block into a versioned section (`Keep a Changelog`
   format, year-2026 stamps, append-only history).
4. Commit direct to master (explicit paths only), `git ls-remote origin
   master` to confirm you sit atop the tip, ff-only push, then cut the
   annotated tag `vX.Y.Z` and push the tag.
5. **Consumer pin rotation** — the same day, every consumer moves its pin to
   the new tag: phlix-server and phlix-hub (`web-ui`-style JSON dep +
   lockwalk), phlix-tizen / phlix-windows / phlix-mobile / phlix-console /
   phlix-roku (`package.json` `github:` tag pin + surgical lock edit where
   the repo carries one). Tag-form pins only (S181). Each consumer's own
   pin-truth tests (contracts-pin/lockwalk/hoist-era checks) rotate in the
   same commit, from measured reds.
6. Record the cascade's provenance shas in the CHANGELOG release entry's
   consumer-target paragraph — downstream lanes trust disk, not prose, but
   the prose should still point at the right disks.

## House rules

- CHANGELOG is append-only: corrections ship as NEW entries, never rewrites.
- No new wire error codes outside this registry's law (byte-identical error
  envelopes downstream).
- Caliber doc-refresh noise is never reverted; unrelated tree dirt is never
  staged; `.reviews/` is never staged.

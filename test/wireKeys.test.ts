/**
 * wireKeys.test — the LW-040 consolidation pin.
 *
 * `WireKeysExact` is the compile-time tie between a wire interface and its
 * ordered key-list const. Estate review LW-040 retired the earlier
 * "keep it local so the file stays self-contained" rationale and hoisted the
 * helper to its single home, `src/internal/wireKeys.ts`; the first landing
 * migrated only `src/playback.ts`, and this suite exists so a half-migration
 * can never re-land: it pins ONE declaration site, the COMPLETE consumer
 * roster importing it (the roster froze at the first two files while
 * `src/StreamSession.ts` became a third tie consumer — estate review
 * phlix-contracts-026; it is now scan-checked against the tree so a fourth
 * consumer or a silently dropped tie reddens this suite, never passes it
 * unseen), the retired rationale surviving only as the internal header's
 * quotation of history, and the helper staying package-private through the
 * shipped surface (the exports map governs, never intra-src reachability).
 *
 * The dist/ legs read the COMMITTED declaration tree, mirroring the precedent
 * in `test/routeManifest.test.ts`: locally that catches a stale or hand-edited
 * mirror, and CI's `git diff --exit-code -- dist/` freshness gate runs before
 * the suite, so a passing run means these bytes are the shipped bytes.
 *
 * @copyright 2026 Joe Huss <detain@interserver.net>
 * @license MIT
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { SYNC_PLAY_KEY_TIES } from '../src/SyncPlay';

const SRC = resolve(__dirname, '..', 'src');
const DIST = resolve(__dirname, '..', 'dist');

/** Every `.ts` source of the tree, keyed by its repo-relative path. */
function tsTree(rootDir: string): Map<string, string> {
  const files = new Map<string, string>();
  const walk = (dir: string): void => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const abs = join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(abs);
      } else if (entry.name.endsWith('.ts')) {
        files.set(relative(resolve(__dirname, '..'), abs).replace(/\\/g, '/'), readFileSync(abs, 'utf8'));
      }
    }
  };
  walk(rootDir);
  return files;
}

/** Files whose text DECLARES the helper type: the declaration is the only
 *  place `WireKeysExact` directly follows `type`. Import and use lines never
 *  match — a use reads `export type X = WireKeysExact<Y, …>`, where `type`
 *  is followed by the tied alias name, not by the helper. */
function declaringFiles(texts: Map<string, string>): string[] {
  return [...texts.entries()]
    .filter(([, text]) => /type\s+WireKeysExact\s*</.test(text))
    .map(([path]) => path);
}

/** Files that APPLY the helper to tie a wire shape (use without declaring):
 *  scan-based, so the consumer set is observed from the tree rather than
 *  remembered — the phlix-contracts-026 coverage gap was exactly a roster
 *  that froze while the tree grew. */
function consumerFiles(texts: Map<string, string>): string[] {
  return [...texts.entries()]
    .filter(([, text]) => !/type\s+WireKeysExact\s*</.test(text) && /\bWireKeysExact</.test(text))
    .map(([path]) => path)
    .sort();
}

/** The complete src consumer roster — equality-pinned against the scan
 *  below, so a new tie without a roster entry and a silently dropped tie
 *  both redden this suite. */
/** The complete src consumer roster — equality-pinned against the scan
 *  below, so a new tie without a roster entry and a silently dropped tie
 *  both redden this suite. Grown by S-contracts-02 (media wire-parity gate):
 *  the media family and its five satellite shape files joined as tie
 *  consumers; still scan-checked, so drift reddens — never silently passes. */
const SRC_CONSUMERS = [
  'src/playback.ts',
  'src/SyncPlay.ts',
  'src/StreamSession.ts',
  'src/media.ts',
  'src/hub.ts',
  'src/Chapter.ts',
  'src/Marker.ts',
  'src/Collection.ts',
  'src/Recommendation.ts',
  'src/SimilarItem.ts',
];
/** The committed dist mirror of every rostered consumer. */
const DIST_CONSUMERS = SRC_CONSUMERS.map((f) => f.replace(/^src\//, 'dist/').replace(/\.ts$/, '.d.ts'));

// NodeNext-safe relative specifiers (S-contracts-01): the import carries the
// explicit `.js` extension in BOTH trees — src sources are written with it and
// tsc mirrors it verbatim into the emitted .d.ts, so src and dist share one
// literal import line here.
const THE_IMPORT = "import type { WireKeysExact } from './internal/wireKeys.js';";

describe('WireKeysExact — one definition (LW-040)', () => {
  it('is declared by exactly one src file: src/internal/wireKeys.ts', () => {
    expect(declaringFiles(tsTree(SRC))).toEqual(['src/internal/wireKeys.ts']);
  });

  it('is imported — not re-declared — by every wire-shape consumer, and only by rostered ones', () => {
    // Completeness first: the applied-helper scan must find exactly the
    // rostered consumers (phlix-contracts-026 — the old two-file list let
    // src/StreamSession.ts ride unpoliced).
    expect(consumerFiles(tsTree(SRC))).toEqual([...SRC_CONSUMERS].sort());
    // Fidelity per rostered file: shared import, no local re-declaration.
    for (const consumer of SRC_CONSUMERS) {
      const text = readFileSync(resolve(__dirname, '..', consumer), 'utf8');
      expect(text, `${consumer} must import the shared helper`).toContain(THE_IMPORT);
      expect(/type\s+WireKeysExact\s*</.test(text), `${consumer} must not declare it locally`).toBe(false);
    }
  });

  it('leaves the retired self-containment rationale only as the internal header quotation', () => {
    const quoting = [...tsTree(SRC).entries()]
      .filter(([, text]) => text.includes('self-contained'))
      .map(([path]) => path);
    expect(quoting).toEqual(['src/internal/wireKeys.ts']);
  });

  it('stays package-private: the root surface never mentions it', () => {
    for (const surface of ['src/index.ts', 'dist/index.d.ts']) {
      const text = readFileSync(resolve(__dirname, '..', surface), 'utf8');
      expect(text.toLowerCase(), `${surface} must not reach the internal helper`).not.toContain('wirekeys');
    }
  });

  it('dist mirrors the single-declaration shape', () => {
    // The .d.ts tree: declared once (in dist/internal/), imported by every
    // consumer mirror and no others, never re-declared by a consumer.
    expect(declaringFiles(tsTree(DIST))).toEqual(['dist/internal/wireKeys.d.ts']);
    expect(consumerFiles(tsTree(DIST))).toEqual([...DIST_CONSUMERS].sort());
    for (const mirror of DIST_CONSUMERS) {
      expect(readFileSync(resolve(__dirname, '..', mirror), 'utf8'), `${mirror} must carry the import form`).toContain(THE_IMPORT);
    }
  });

  it('keeps every SyncPlay tie true through the shared helper', () => {
    expect(Object.keys(SYNC_PLAY_KEY_TIES)).toHaveLength(10);
    expect(Object.values(SYNC_PLAY_KEY_TIES).every((value) => value === true)).toBe(true);
  });
});

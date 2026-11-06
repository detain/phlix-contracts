/**
 * wireKeys.test — the LW-040 consolidation pin.
 *
 * `WireKeysExact` is the compile-time tie between a wire interface and its
 * ordered key-list const. Estate review LW-040 retired the earlier
 * "keep it local so the file stays self-contained" rationale and hoisted the
 * helper to its single home, `src/internal/wireKeys.ts`; the first landing
 * migrated only `src/playback.ts`, and this suite exists so a half-migration
 * can never re-land: it pins ONE declaration site, BOTH consumers importing
 * it, the retired rationale surviving only as the internal header's quotation
 * of history, and the helper staying package-private through the shipped
 * surface (the exports map governs, never intra-src reachability).
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

/** Files whose text declares the helper — an import never matches: the
 *  declaration is the only place `WireKeysExact` is directly followed by `<`. */
function declaringFiles(texts: Map<string, string>): string[] {
  return [...texts.entries()]
    .filter(([, text]) => /type\s+WireKeysExact\s*</.test(text))
    .map(([path]) => path);
}

const THE_IMPORT = "import type { WireKeysExact } from './internal/wireKeys';";

describe('WireKeysExact — one definition (LW-040)', () => {
  it('is declared by exactly one src file: src/internal/wireKeys.ts', () => {
    expect(declaringFiles(tsTree(SRC))).toEqual(['src/internal/wireKeys.ts']);
  });

  it('is imported — not re-declared — by both wire-shape consumers', () => {
    for (const consumer of ['src/playback.ts', 'src/SyncPlay.ts']) {
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
    // The .d.ts tree: declared once (in dist/internal/), imported by both
    // consumers, never re-declared by a consumer.
    expect(declaringFiles(tsTree(DIST))).toEqual(['dist/internal/wireKeys.d.ts']);
    for (const mirror of ['dist/playback.d.ts', 'dist/SyncPlay.d.ts']) {
      expect(readFileSync(resolve(__dirname, '..', mirror), 'utf8'), `${mirror} must carry the import form`).toContain(THE_IMPORT);
    }
  });

  it('keeps every SyncPlay tie true through the shared helper', () => {
    expect(Object.keys(SYNC_PLAY_KEY_TIES)).toHaveLength(10);
    expect(Object.values(SYNC_PLAY_KEY_TIES).every((value) => value === true)).toBe(true);
  });
});

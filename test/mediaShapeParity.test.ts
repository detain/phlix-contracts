/**
 * mediaShapeParity.test — the media-family wire-parity gate (S-contracts-02).
 *
 * Estate review phlix-contracts-002 [High] measured that the media family —
 * the widest wire surface in the package — carried NO parity gate at all:
 * `MediaItem` was a single flat interface under-declaring TEN keys the server
 * ALWAYS or ALWAYS-conditionally emits (`air_date`, `album`, `artist`,
 * `backdrop_srcset`, `backdrop_url`, `library_id` from the list shape;
 * `tags`, `external_ids`, `theme_audio_url`, `backdrop_url_large` from the
 * detail shape) while mixing detail-only members into the list scope. The fix
 * is this suite plus the `MediaItemSummary` / `MediaItemDetail` scope split
 * and the ordered key-list consts now exported from the media family files.
 *
 * WHAT THIS GATE IS — a live source oracle, NOT a fixture photograph: the
 * playback/syncplay/track gates are frozen captures (their headers say so);
 * this one reads the server's REAL `MediaItemShaper.php` at run time and
 * pins the key sets and the cited file:line anchors against it. A server-side
 * key rename, insertion, or reorder reddens this suite on the next run —
 * the -002 finding asked for exactly that mutation-aware property. The
 * sibling repo is private, so public CI cannot see it: the source legs then
 * report SKIPPED (loudly, by name) — never silently green — and the TS-side
 * legs below still run everywhere. Set `PHLIX_CONTRACTS_SRV_REPO` to point
 * at a non-default checkout (same convention as scripts/check-error-cites.mjs).
 *
 * Authority measured at gate-cut time: phlix-server
 * `262f01d3785f9a674ab18293809f3462c64ea077`. The gate deliberately does NOT
 * hard-pin that SHA (the server moves under its own program); it pins the
 * key SETS exactly and the line anchors within a small drift window.
 *
 * @copyright 2026 Joe Huss <detain@interserver.net>
 * @license MIT
 */

import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  MEDIA_ITEM_SUMMARY_KEYS,
  MEDIA_ITEM_DETAIL_ADDITION_KEYS,
  MEDIA_ITEM_KEYS,
  MEDIA_ITEM_USER_DATA_KEYS,
  MEDIA_STREAM_KEYS,
  MEDIA_PERSON_KEYS,
  PRODUCTION_COMPANY_KEYS,
  MEDIA_FILE_ENTRY_KEYS,
  USER_DATA_KEYS,
  LIBRARY_KEYS,
  LIBRARIES_RESPONSE_KEYS,
  LIBRARY_RESPONSE_KEYS,
  MEDIA_ITEMS_RESPONSE_KEYS,
  MEDIA_ITEM_RESPONSE_KEYS,
  MEDIA_KEY_TIES,
} from '../src/media';
import { HUB_KEY_TIES } from '../src/hub';
import { CHAPTER_KEY_TIES } from '../src/Chapter';
import { MARKER_KEY_TIES, MARKER_TYPES } from '../src/Marker';
import { COLLECTION_KEY_TIES } from '../src/Collection';
import { RECOMMENDATION_KEY_TIES } from '../src/Recommendation';
import { SIMILAR_ITEM_KEY_TIES } from '../src/SimilarItem';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SRV = resolve(repoRoot, process.env.PHLIX_CONTRACTS_SRV_REPO ?? '../phlix-server');
const SHAPER = resolve(SRV, 'src/Media/Library/MediaItemShaper.php');
const CONTROLLER = resolve(SRV, 'src/Server/Http/Controllers/MediaItemController.php');
const ROUTER = resolve(SRV, 'src/Server/WebPortal/WebPortalRouter.php');
const serverVisible = existsSync(SHAPER) && existsSync(CONTROLLER) && existsSync(ROUTER);

/** Ordered first-appearance unique of [key, line] pairs. */
function firstAppearances(pairs: Array<[string, number]>): Array<[string, number]> {
  const seen = new Set<string>();
  const out: Array<[string, number]> = [];
  for (const [key, line] of pairs) {
    if (seen.has(key)) continue;
    seen.add(key);
    out.push([key, line]);
  }
  return out;
}

/** The literal line offset of `re` (first match, 1-based), or -1. */
function lineOf(lines: string[], re: RegExp): number {
  const i = lines.findIndex((l) => re.test(l));
  return i === -1 ? -1 : i + 1;
}

/** shape()'s emitted key list, read from its return-array literal. */
function parseShapeKeys(lines: string[]): Array<[string, number]> {
  const start = lines.findIndex((l) => /public static function shape\(array \$item\): array/.test(l));
  if (start === -1) throw new Error('MediaItemShaper::shape() definition not found');
  const pairs: Array<[string, number]> = [];
  for (let i = start; i < lines.length; i++) {
    const line = lines[i] ?? '';
    const key = line.match(/^ {12}'([a-z0-9_]+)' =>/)?.[1];
    if (key !== undefined) pairs.push([key, i + 1]);
    if (/^ {8}\];/.test(line)) break;
    if (i === lines.length - 1) throw new Error('shape() return array never closed');
  }
  return pairs;
}

/**
 * shapeDetail()'s fresh key additions: every `$merged['key']` assignment,
 * first-appearance order, MINUS keys the list shape already emits (those are
 * per-view OVERWRITES — `path`, `backdrop_url`, `backdrop_srcset` — not new
 * contract members).
 */
function parseDetailAdditions(lines: string[]): Array<[string, number]> {
  const start = lines.findIndex((l) => /public static function shapeDetail\(/.test(l));
  if (start === -1) throw new Error('MediaItemShaper::shapeDetail() definition not found');
  const pairs: Array<[string, number]> = [];
  for (let i = start; i < lines.length; i++) {
    const line = lines[i] ?? '';
    const key = line.match(/^\s+\$merged\['([a-z0-9_]+)'\]\s*(\?\?=|=)/)?.[1];
    if (key !== undefined) pairs.push([key, i + 1]);
    if (/^\s+return \$merged;/.test(line)) break;
    if (i === lines.length - 1) throw new Error('shapeDetail() never returns $merged');
  }
  const listScope = new Set<string>(MEDIA_ITEM_SUMMARY_KEYS);
  return firstAppearances(pairs).filter(([key]) => !listScope.has(key));
}

const shaperLines = serverVisible ? readFileSync(SHAPER, 'utf8').split('\n') : [];
const controllerLines = serverVisible ? readFileSync(CONTROLLER, 'utf8').split('\n') : [];
const routerLines = serverVisible ? readFileSync(ROUTER, 'utf8').split('\n') : [];

/** ±drift window for file:line anchors: the server moves under its own
 *  program; a key RENAMED or MOVED FAR is caught by the exact key-set legs. */
const ANCHOR_DRIFT = 5;
function near(actual: number, cited: number): boolean {
  return actual !== -1 && Math.abs(actual - cited) <= ANCHOR_DRIFT;
}

describe('media wire-parity — TS-side (always runs)', () => {
  it('every exported key tie is true (interface ↔ const completeness)', () => {
    const all: Record<string, Record<string, boolean>> = {
      media: MEDIA_KEY_TIES,
      hub: HUB_KEY_TIES,
      chapter: CHAPTER_KEY_TIES,
      marker: MARKER_KEY_TIES,
      collection: COLLECTION_KEY_TIES,
      recommendation: RECOMMENDATION_KEY_TIES,
      similar: SIMILAR_ITEM_KEY_TIES,
    };
    for (const [family, ties] of Object.entries(all)) {
      for (const [name, value] of Object.entries(ties)) {
        expect(value, `${family}.${name} tie must be true`).toBe(true);
      }
    }
    expect(Object.keys(MEDIA_KEY_TIES)).toHaveLength(15);
  });

  it('the flat MediaItem key const is SUMMARY ∪ DETAIL additions ∪ controller legs, in order', () => {
    expect(MEDIA_ITEM_SUMMARY_KEYS).toHaveLength(27);
    expect(MEDIA_ITEM_DETAIL_ADDITION_KEYS).toHaveLength(13);
    expect(MEDIA_ITEM_KEYS).toHaveLength(43);
    expect([...MEDIA_ITEM_KEYS].slice(0, 27)).toEqual([...MEDIA_ITEM_SUMMARY_KEYS]);
    expect([...MEDIA_ITEM_KEYS].slice(27, 40)).toEqual([...MEDIA_ITEM_DETAIL_ADDITION_KEYS]);
    expect([...MEDIA_ITEM_KEYS].slice(40)).toEqual(['files', 'stream_url', 'user_data']);
  });

  it('the ten keys -002 measured as under-declared are now contract members', () => {
    const keys = new Set<string>(MEDIA_ITEM_KEYS);
    for (const key of [
      'air_date',
      'album',
      'artist',
      'backdrop_srcset',
      'backdrop_url',
      'library_id',
      'tags',
      'external_ids',
      'theme_audio_url',
      'backdrop_url_large',
    ]) {
      expect(keys.has(key), `${key} must be declared`).toBe(true);
    }
  });

  it('the list scope carries NO detail-only fiction (scope-split law)', () => {
    const summary = new Set<string>(MEDIA_ITEM_SUMMARY_KEYS);
    for (const key of [
      'cast',
      'crew',
      'tags',
      'streams',
      'production_companies',
      'studio',
      'external_ids',
      'theme_audio_url',
      'backdrop_url_large',
      'user_data',
      'stream_url',
      'files',
    ]) {
      expect(summary.has(key), `list shape must NOT advertise ${key}`).toBe(false);
    }
  });

  it('no key const has duplicates and every media const is non-empty', () => {
    for (const keys of [
      MEDIA_ITEM_SUMMARY_KEYS,
      MEDIA_ITEM_DETAIL_ADDITION_KEYS,
      MEDIA_ITEM_KEYS,
      MEDIA_ITEM_USER_DATA_KEYS,
      MEDIA_STREAM_KEYS,
      MEDIA_PERSON_KEYS,
      PRODUCTION_COMPANY_KEYS,
      MEDIA_FILE_ENTRY_KEYS,
      USER_DATA_KEYS,
      LIBRARY_KEYS,
      LIBRARIES_RESPONSE_KEYS,
      LIBRARY_RESPONSE_KEYS,
      MEDIA_ITEMS_RESPONSE_KEYS,
      MEDIA_ITEM_RESPONSE_KEYS,
    ]) {
      expect(keys.length).toBeGreaterThan(0);
      expect(new Set(keys).size, `duplicate key in ${JSON.stringify(keys.slice(0, 3))}…`).toBe(keys.length);
    }
  });

  it('the marker vocabulary const stays the closed four-family set', () => {
    expect([...MARKER_TYPES].sort()).toEqual(['ad', 'credits', 'intro', 'outro']);
  });
});

describe('media wire-parity — server source oracle', () => {
  it.skipIf(!serverVisible)(
    'shape() emits EXACTLY the 27 ordered keys MediaItemSummary mirrors',
    () => {
      const emitted = parseShapeKeys(shaperLines);
      expect(emitted.map(([k]) => k)).toEqual([...MEDIA_ITEM_SUMMARY_KEYS]);
    },
  );

  it.skipIf(!serverVisible)(
    'shape() keys sit at their cited file:line anchors (±drift window)',
    () => {
      const cited: Record<string, number> = {
        id: 237,
        name: 238,
        sort_title: 242,
        type: 243,
        path: 254,
        library_id: 261,
        poster_url: 264,
        poster_srcset: 269,
        backdrop_url: 277,
        backdrop_srcset: 283,
        genres: 288,
        year: 289,
        rating: 290,
        runtime: 291,
        duration: 298,
        overview: 304,
        actors: 308,
        director: 309,
        parent_id: 314,
        season_number: 317,
        episode_number: 320,
        episode_title: 323,
        air_date: 326,
        artist: 329,
        album: 330,
        created_at: 331,
        updated_at: 332,
      };
      for (const [key, line] of parseShapeKeys(shaperLines)) {
        const pin = cited[key] ?? -1;
        expect(near(line, pin), `${key} at :${line} vs cited :${pin}`).toBe(true);
      }
    },
  );

  it.skipIf(!serverVisible)(
    'shapeDetail() adds EXACTLY the 13 detail keys + admin-gated files, in order',
    () => {
      expect(parseDetailAdditions(shaperLines).map(([k]) => k)).toEqual([
        ...MEDIA_ITEM_DETAIL_ADDITION_KEYS,
        'files',
      ]);
    },
  );

  it.skipIf(!serverVisible)(
    'the detail scope split: backdrop_url_large / theme_audio_url / external_ids / tags anchors',
    () => {
      expect(near(lineOf(shaperLines, /public static function shape\(array \$item\): array/), 130)).toBe(true);
      expect(near(lineOf(shaperLines, /public static function shapeDetail\(/), 350)).toBe(true);
      const additions = new Map(parseDetailAdditions(shaperLines));
      expect(near(additions.get('tags') ?? -1, 374)).toBe(true);
      expect(near(additions.get('backdrop_url_large') ?? -1, 408)).toBe(true);
      expect(near(additions.get('theme_audio_url') ?? -1, 410)).toBe(true);
      expect(near(additions.get('external_ids') ?? -1, 448)).toBe(true);
    },
  );

  it.skipIf(!serverVisible)(
    'the controller legs: stream_url (both hosts) + user_data (web portal) are shaped onto the detail wire',
    () => {
      expect(near(lineOf(controllerLines, /MediaItemShaper::shapeDetail\(/), 247)).toBe(true);
      expect(near(lineOf(controllerLines, /\$shaped\['stream_url'\]\s*=/), 254)).toBe(true);
      expect(near(lineOf(routerLines, /MediaItemShaper::shapeDetail\(/), 790)).toBe(true);
      expect(near(lineOf(routerLines, /\$shaped\['stream_url'\]\s*=/), 807)).toBe(true);
      expect(near(lineOf(routerLines, /\$shaped\['user_data'\]\s*=/), 819)).toBe(true);
    },
  );

  it.skipIf(!serverVisible)(
    'server-side key-set change (rename/insert/reorder) cannot slip past: ordered equality across both shapes',
    () => {
      // The two shaper passes cover 41 of the 43 members; `stream_url` and
      // `user_data` are controller-side arms asserted by the anchor legs
      // above, and ride at the const's tail.
      const both = [
        ...parseShapeKeys(shaperLines).map(([k]) => k),
        ...parseDetailAdditions(shaperLines).map(([k]) => k),
      ];
      expect(both).toEqual([...MEDIA_ITEM_SUMMARY_KEYS, ...MEDIA_ITEM_DETAIL_ADDITION_KEYS, 'files']);
      expect(MEDIA_ITEM_KEYS.slice(41)).toEqual(['stream_url', 'user_data']);
    },
  );

  // No always-green stand-in leg: when the private sibling is invisible these
  // legs report SKIPPED by name (CS47 precedent), and a skipped case is loud
  // in the run summary — the silent-green failure mode is a MISSING case.
});

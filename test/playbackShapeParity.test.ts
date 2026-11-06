/**
 * playbackShapeParity.test — LW-069 cross-language golden-vector gate.
 *
 * `test/fixtures/playback-info-vectors.json` was captured by
 * `scripts/dump-server-playback-info-vectors.php` driving phlix-server's REAL
 * `MediaItemController::getPlaybackInfo()` (real MarkerService /
 * StreamTrackShaper / GaplessPlaybackManager / AbrLadder wiring, a real MySQL
 * scratch database migrated by the server's own MigrationRunner) — provenance
 * sha recorded inside the fixture.
 *
 * LW-069 (estate review contracts__srphp #1 [Critical]): the pre-cure
 * `PlaybackInfo` declared a shape the endpoint never sent — camelCase
 * `chapters` rows carrying an `index` (from the client-side `ChapterMarker`),
 * a `trickplay` member, an OPTIONAL `quality_ladder`, and it omitted the
 * ALWAYS-emitted `audio_tracks` / `subtitle_tracks` / `crossfade` and the
 * add-only `playback_constraints` block entirely. The fixture is the executed
 * wire; every assertion below ties the TS mirror to what a real Response
 * body carried.
 *
 * WHAT THIS GATE IS — a photograph, not a live wire oracle (estate review
 * LW-010 law, same wording as syncPlayShapeParity.test.ts): the fixture is
 * frozen at the server SHA in its provenance block; a server-side rename
 * reddens nothing here until a human re-runs the dump leg.
 *
 * @copyright 2026 Joe Huss <detain@interserver.net>
 * @license MIT
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  PLAYBACK_INFO_KEYS,
  PLAYBACK_CONSTRAINTS_KEYS,
  PLAYBACK_INFO_CHAPTER_KEYS,
  TIME_MARKER_KEYS,
  SKIP_BUTTON_SPEC_KEYS,
  CROSSFADE_KEYS,
  RENDITION_KEYS,
  SUBTITLE_TRACK_KEYS,
  AUDIO_TRACK_KEYS,
  PLAYBACK_INFO_KEY_TIES,
} from '../src/playback';
import type {
  PlaybackInfo,
  PlaybackInfoChapterKeysTied,
  TimeMarkerKeysTied,
  SkipButtonSpecKeysTied,
  CrossfadeKeysTied,
  RenditionKeysTied,
  PlaybackConstraintsKeysTied,
  PlaybackInfoBaseKeysTied,
} from '../src/playback';

// Compile-time ties: these initializations only typecheck while each key-list
// const contains EXACTLY the keys of its interface (both directions).
export const chapterKeysTied: PlaybackInfoChapterKeysTied = true;
export const timeMarkerKeysTied: TimeMarkerKeysTied = true;
export const skipButtonSpecKeysTied: SkipButtonSpecKeysTied = true;
export const crossfadeKeysTied: CrossfadeKeysTied = true;
export const renditionKeysTied: RenditionKeysTied = true;
export const playbackConstraintsKeysTied: PlaybackConstraintsKeysTied = true;
export const playbackInfoBaseKeysTied: PlaybackInfoBaseKeysTied = true;

interface Rail {
  status: number;
  response: Record<string, unknown>;
}

interface VectorFixture {
  provenance: {
    serverRepo: string;
    serverSha: string;
    generator: string;
    authority: string;
    marker: string;
    signer: string;
  };
  rails: Record<string, Rail>;
}

const here = dirname(fileURLToPath(import.meta.url));
const FIXTURE_PATH = resolve(here, 'fixtures', 'playback-info-vectors.json');
const fixture = JSON.parse(readFileSync(FIXTURE_PATH, 'utf8')) as VectorFixture;

/** The LW-069 authority ruling was verified at this server commit. */
const AUTHORITY_SERVER_SHA = 'a63dc0db72d67beed7e1e9b7824cfec6b5ac80d0';

/**
 * Keys the pre-LW-069 contracts fiction claimed (or that no server-side
 * emission ever carried). Any live appearance means the authority moved
 * without a re-ruling.
 */
const ENVELOPE_FICTION_KEYS = ['trickplay', 'intro_start', 'credits_start', 'has_trickplay', 'media_sources'];

function collectKeys(node: unknown, out: string[] = []): string[] {
  if (Array.isArray(node)) {
    for (const value of node) collectKeys(value, out);
  } else if (node !== null && typeof node === 'object') {
    for (const [key, value] of Object.entries(node)) {
      out.push(key);
      collectKeys(value, out);
    }
  }
  return out;
}

const rich = fixture.rails.rich.response;
const bare = fixture.rails.bare.response;

describe('PlaybackInfoShapeParity (LW-069)', () => {
  describe('fixture integrity (empty-set defences)', () => {
    it('provenance points at the REAL getPlaybackInfo() emission at the ruling commit', () => {
      expect(fixture.provenance.serverRepo).toBe('detain/phlix-server');
      expect(fixture.provenance.serverSha).toBe(AUTHORITY_SERVER_SHA);
      expect(fixture.provenance.generator).toBe('scripts/dump-server-playback-info-vectors.php');
      expect(fixture.provenance.marker).toBe('playback-info-vectors-v1');
      expect(PLAYBACK_INFO_KEY_TIES).toEqual({
        chapter: true,
        timeMarker: true,
        skipButtonSpec: true,
        crossfade: true,
        rendition: true,
        playbackConstraints: true,
        base: true,
      });
    });

    it('carries every rail and never a vacuous witness', () => {
      for (const name of ['rich', 'constraintsBoth', 'constraintsSubset', 'bare', 'notFound']) {
        expect(fixture.rails[name], `rail ${name} missing from the fixture`).toBeDefined();
      }
      expect((rich.chapters as unknown[]).length, 'rich rail has no chapter rows').toBeGreaterThan(0);
      expect((rich.audio_tracks as unknown[]).length, 'rich rail has no audio rows').toBeGreaterThan(0);
      expect((rich.subtitle_tracks as unknown[]).length, 'rich rail has no subtitle rows').toBeGreaterThan(0);
      expect((rich.quality_ladder as unknown[]).length, 'rich rail has no ladder rungs').toBeGreaterThan(0);
    });

    it('no rail emits a fiction key or a camelCase key anywhere', () => {
      for (const [name, rail] of Object.entries(fixture.rails)) {
        const keys = collectKeys(rail.response);
        for (const fiction of ENVELOPE_FICTION_KEYS) {
          expect(keys, `${name} rail emitted '${fiction}' — authority moved without re-ruling`).not.toContain(fiction);
        }
        for (const key of keys) {
          expect(key, `${name} rail emitted camelCase key '${key}'`).not.toMatch(/[A-Z]/);
        }
      }
    });
  });

  describe('envelope — the exact ordered key list getPlaybackInfo() builds', () => {
    it('the base envelope carries the 9 ALWAYS-present keys IN ORDER', () => {
      expect(Object.keys(rich)).toEqual([...PLAYBACK_INFO_KEYS]);
      expect(Object.keys(bare)).toEqual([...PLAYBACK_INFO_KEYS]);
    });

    it('playback_constraints is ADD-ONLY: present (last) when query params supplied, absent otherwise', () => {
      expect(Object.keys(fixture.rails.constraintsBoth.response)).toEqual([...PLAYBACK_INFO_KEYS, 'playback_constraints']);
      expect(Object.keys(fixture.rails.constraintsSubset.response)).toEqual([...PLAYBACK_INFO_KEYS, 'playback_constraints']);
      expect(Object.keys(rich)).not.toContain('playback_constraints');
    });
  });

  describe('markers, chapters, skip spec', () => {
    it('intro/outro markers carry {start_seconds,end_seconds} IN ORDER and the real values', () => {
      for (const key of ['intro_marker', 'outro_marker'] as const) {
        expect(Object.keys(rich[key] as Record<string, unknown>), key).toEqual([...TIME_MARKER_KEYS]);
      }
      expect(rich.intro_marker).toEqual({ start_seconds: 10, end_seconds: 95 });
      expect(rich.outro_marker).toEqual({ start_seconds: 4200, end_seconds: 4300 });
      expect(bare.intro_marker).toBeNull();
      expect(bare.outro_marker).toBeNull();
    });

    it('chapters are ALWAYS emitted, snake_case, and carry NO index', () => {
      expect(Object.keys(rich)).toContain('chapters');
      const chapters = rich.chapters as Record<string, unknown>[];
      for (const row of chapters) {
        expect(Object.keys(row)).toEqual([...PLAYBACK_INFO_CHAPTER_KEYS]);
      }
      expect(chapters[0]).toEqual({ start_seconds: 0, end_seconds: 600, title: 'Cold open' });
      // The LW-069 fiction guard: the wire chapter row never carried the
      // client-side ChapterMarker's `index`/camelCase members.
      expect(chapters[0]).not.toHaveProperty('index');
      expect(chapters[0]).not.toHaveProperty('startSeconds');
      expect(bare.chapters).toEqual([]);
    });

    it('skip_button_spec carries the flat 4-key shape and derives from the markers', () => {
      expect(Object.keys(rich.skip_button_spec as Record<string, unknown>)).toEqual([...SKIP_BUTTON_SPEC_KEYS]);
      expect(rich.skip_button_spec).toEqual({
        skip_intro_start: 10,
        skip_intro_end: 95,
        skip_outro_start: 4200,
        skip_outro_end: 4300,
      });
      // Bare item: ALL FOUR members present as null — the spec key itself is
      // never omitted.
      expect(Object.keys(bare.skip_button_spec as Record<string, unknown>)).toEqual([...SKIP_BUTTON_SPEC_KEYS]);
      expect(bare.skip_button_spec).toEqual({
        skip_intro_start: null,
        skip_intro_end: null,
        skip_outro_start: null,
        skip_outro_end: null,
      });
    });
  });

  describe('quality_ladder — always-present key, null-or-rungs value', () => {
    it('preview rungs carry the exact Rendition keys and url is ALWAYS null pre-job', () => {
      const ladder = rich.quality_ladder as Record<string, unknown>[];
      for (const rung of ladder) {
        expect(Object.keys(rung)).toEqual([...RENDITION_KEYS]);
        expect(rung.url, `rung ${rung.id} minted a url — the preview must not`).toBeNull();
      }
      expect(ladder.filter((rung) => rung.is_original === true)).toHaveLength(1);
      expect(ladder[0].id).toBe('original');
      // The whole field is null for an item with no source metadata — the KEY
      // stays present (the pre-LW-069 optional-key fiction died here).
      expect(Object.keys(bare)).toContain('quality_ladder');
      expect(bare.quality_ladder).toBeNull();
    });
  });

  describe('audio_tracks / subtitle_tracks — ALWAYS emitted (S404 + S507 row truth)', () => {
    it('audio rows carry the exact ordered S404 keys with ordinal/default laws', () => {
      const rows = rich.audio_tracks as Record<string, unknown>[];
      for (const row of rows) {
        expect(Object.keys(row)).toEqual([...AUDIO_TRACK_KEYS]);
      }
      expect(rows.map((row) => row.index)).toEqual([0, 1]);
      expect(rows.map((row) => row.stream_index)).toEqual([1, 2]);
      expect(rows[0].default).toBe(true); // stored disposition promoted
      expect(rows[1].default).toBe(false);
      expect(rows[1].title).toBe('Commentary');
      expect(bare.audio_tracks).toEqual([]);
    });

    it('subtitle rows additionally carry S507 delivery:"external" and the skipped-bitmap/external ordinal laws', () => {
      const rows = rich.subtitle_tracks as Record<string, unknown>[];
      for (const row of rows) {
        expect(Object.keys(row)).toEqual([...SUBTITLE_TRACK_KEYS]);
        expect(row.delivery, 'S507 AD-8: every subtitle delivered over this wire is an external sidecar').toBe('external');
      }
      // Embedded subrip took the first 0:s:N ordinal; the pgs row CONSUMED
      // ordinal 1 without being emitted; the external sidecar reports its
      // persisted stream_index (9) instead of an ffmpeg ordinal.
      expect(rows.map((row) => row.index)).toEqual([0, 9]);
      expect(rows.map((row) => row.source)).toEqual([null, 'opensubtitles']);
      expect(rows.map((row) => row.codec)).toEqual(['subrip', 'webvtt']);
      expect(rows.some((row) => row.codec === 'pgs')).toBe(false);
      // Signed urls were captured PATH-ONLY by the dumper (exp/sig stripped).
      for (const row of rows) {
        expect(row.url as string).not.toContain('sig=');
      }
      expect(rows[0].url).toBe('/api/v1/media/bbbbbbbb-0000-4000-8000-000000000001/subtitles/0');
      expect(bare.subtitle_tracks).toEqual([]);
    });
  });

  describe('crossfade — always emitted, derived from the gapless profile', () => {
    it('carries the exact ordered keys and the anonymous-user defaults', () => {
      expect(Object.keys(rich.crossfade as Record<string, unknown>)).toEqual([...CROSSFADE_KEYS]);
      expect(rich.crossfade).toEqual({ enabled: false, duration: 0, fade_out: 0.3, fade_in: 0.3 });
      expect(bare.crossfade).toEqual({ enabled: false, duration: 0, fade_out: 0.3, fade_in: 0.3 });
    });
  });

  describe('playback_constraints arms', () => {
    it('both params → {force_transcode:true, exclude_hevc:true}; only excludeHevc=0 → present-but-false alone', () => {
      const both = fixture.rails.constraintsBoth.response.playback_constraints as Record<string, unknown>;
      expect(Object.keys(both)).toEqual([...PLAYBACK_CONSTRAINTS_KEYS]);
      expect(both).toEqual({ force_transcode: true, exclude_hevc: true });

      const subset = fixture.rails.constraintsSubset.response.playback_constraints as Record<string, unknown>;
      expect(Object.keys(subset)).toEqual(['exclude_hevc']);
      expect(subset).toEqual({ exclude_hevc: false });
    });
  });

  describe('error arm', () => {
    it('unknown item → 404 { error } — no envelope keys', () => {
      expect(fixture.rails.notFound.status).toBe(404);
      expect(Object.keys(fixture.rails.notFound.response)).toEqual(['error']);
    });
  });

  describe('type-level access conviction (only compiles against the wire-truth interface)', () => {
    it('PlaybackInfo exposes the ALWAYS-emitted members the fiction omitted', () => {
      // These property reads are compile errors on the pre-LW-069 interface
      // (no such members) — the tsc gate convicts the old shape directly.
      const info = rich as unknown as PlaybackInfo;
      expect(info.audio_tracks.length).toBeGreaterThan(0);
      expect(info.subtitle_tracks.length).toBeGreaterThan(0);
      expect(info.crossfade.enabled).toBe(false);
      expect(info.quality_ladder === null || info.quality_ladder.length > 0).toBe(true);
      if (info.chapters.length > 0) {
        expect(info.chapters[0]?.start_seconds).toBeTypeOf('number');
        expect(info.chapters[0]?.end_seconds).toBeTypeOf('number');
        expect(info.chapters[0]?.title).toBeTypeOf('string');
      }
    });
  });
});

/**
 * trackShapeParity.test — S404 cross-language golden-vector gate.
 *
 * `test/fixtures/stream-track-vectors.json` was captured by
 * `scripts/dump-server-track-vectors.php` running phlix-server's REAL
 * `StreamTrackShaper` (provenance sha recorded inside the fixture). This suite
 * asserts every captured vector's key set equals the TS interface's exported
 * ordered key-list const — EXACTLY and IN ORDER — so a field rename on either
 * side (the S404 bug class: server `title`/`label` vs the old contracts
 * `display_title` fiction) reddens one shared gate.
 *
 * The interface↔const tie is compile-time (`tsc`); the const↔fixture tie is
 * runtime here. Together no side may rename alone.
 *
 * @copyright 2026 Joe Huss <detain@interserver.net>
 * @license MIT
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { AUDIO_TRACK_KEYS, SUBTITLE_TRACK_KEYS } from '../src/playback';
import type { AudioTrackKeysTied, SubtitleTrackKeysTied } from '../src/playback';

// Compile-time ties: these initializations only typecheck while each key-list
// const contains EXACTLY the keys of its interface (both directions).
export const audioKeysTied: AudioTrackKeysTied = true;
export const subtitleKeysTied: SubtitleTrackKeysTied = true;

interface DumpCase {
  case: string;
  itemId?: string;
  streams: unknown[];
  tracks: Record<string, unknown>[];
}

interface DumpFixture {
  provenance: {
    serverRepo: string;
    serverSha: string;
    generator: string;
    authority: string;
  };
  audio: DumpCase[];
  subtitle: DumpCase[];
}

const here = dirname(fileURLToPath(import.meta.url));
const FIXTURE_PATH = resolve(here, 'fixtures', 'stream-track-vectors.json');
const fixture = JSON.parse(readFileSync(FIXTURE_PATH, 'utf8')) as DumpFixture;

/** The S404 authority ruling was verified at this server commit. */
const AUTHORITY_SERVER_SHA = '0134063318bf601dcc152c6c175368cdf9168378';

/** Keys that existed ONLY in the pre-S404 contracts fiction — never emitted. */
const FICTION_KEYS = ['display_title', 'is_forced', 'is_default'];

function allTracks(cases: DumpCase[]): Record<string, unknown>[] {
  return cases.flatMap((c) => c.tracks);
}

describe('TrackShapeParity', () => {
  describe('fixture integrity (empty-set defences)', () => {
    it('provenance points at the authority shaper at the ruling commit', () => {
      expect(fixture.provenance.serverRepo).toBe('detain/phlix-server');
      expect(fixture.provenance.serverSha).toBe(AUTHORITY_SERVER_SHA);
      expect(fixture.provenance.generator).toBe('scripts/dump-server-track-vectors.php');
      expect(fixture.provenance.authority).toBe('src/Media/Library/StreamTrackShaper.php');
    });

    it('carries at least one dump case and one track per kind (never vacuous)', () => {
      expect(fixture.audio.length).toBeGreaterThanOrEqual(4);
      expect(fixture.subtitle.length).toBeGreaterThanOrEqual(4);
      for (const c of [...fixture.audio, ...fixture.subtitle]) {
        expect(c.tracks.length, `case ${c.case} dumped zero tracks`).toBeGreaterThan(0);
      }
    });
  });

  describe('audio: every golden vector key set === AUDIO_TRACK_KEYS', () => {
    it('every captured audio track carries the exact ordered wire keys', () => {
      const tracks = allTracks(fixture.audio);
      expect(tracks.length).toBeGreaterThan(0);
      for (const t of tracks) {
        expect(Object.keys(t)).toEqual([...AUDIO_TRACK_KEYS]);
      }
    });

    it('no audio vector maps a key the server never emits (display_title/url/label fiction)', () => {
      for (const t of allTracks(fixture.audio)) {
        const keys = Object.keys(t);
        for (const fiction of FICTION_KEYS) {
          expect(keys, `audio emitted '${fiction}' — authority changed without re-ruling`).not.toContain(fiction);
        }
        expect(keys).not.toContain('url');
        expect(keys).not.toContain('label');
      }
    });

    it('bitrate is ALWAYS present and nullable', () => {
      const bare = fixture.audio.find((c) => c.case === 'bare-row-all-server-fallbacks');
      if (!bare) throw new Error('fixture lost the bare-row audio case');
      expect(bare.tracks[0]).toHaveProperty('bitrate', null);
      const full = fixture.audio.find((c) => c.case === 'stored-default-on-second-nullables-passthrough');
      if (!full) throw new Error('fixture lost the full-pair audio case');
      expect(full.tracks[0]).toHaveProperty('bitrate', 640000);
    });

    it('exactly one default per case: stored disposition wins, else first is promoted', () => {
      for (const c of fixture.audio) {
        const defaults = c.tracks.filter((t) => t.default === true);
        expect(defaults.length, `case ${c.case}`).toBe(1);
      }
      const dispositionCase = fixture.audio.find((c) => c.case === 'stored-default-on-second-nullables-passthrough');
      if (!dispositionCase) throw new Error('fixture lost the stored-disposition audio case');
      expect(dispositionCase.tracks[1]?.title).toBe('Commentary');
    });

    it('server coercion facts hold: numeric strings fold, absent fields fall back', () => {
      const bare = fixture.audio.find((c) => c.case === 'bare-row-all-server-fallbacks');
      if (!bare) throw new Error('fixture lost the bare-row audio case');
      expect(bare.tracks[0]).toMatchObject({
        id: 'as-bare',
        index: 0,
        stream_index: 0,
        codec: '',
        language: 'und',
        channels: 0,
        bitrate: null,
        title: null,
        default: true,
      });
      const coerced = fixture.audio.find((c) => c.case.startsWith('numeric-string-coercions'));
      if (!coerced) throw new Error('fixture lost the coercion audio case');
      expect(coerced.tracks).toHaveLength(1); // the video row is ignored
      expect(coerced.tracks[0]).toMatchObject({ channels: 2, bitrate: 96000, default: true });
    });
  });

  describe('subtitle: every golden vector key set === SUBTITLE_TRACK_KEYS', () => {
    it('every captured subtitle track carries the exact ordered wire keys', () => {
      const tracks = allTracks(fixture.subtitle);
      expect(tracks.length).toBeGreaterThan(0);
      for (const t of tracks) {
        expect(Object.keys(t)).toEqual([...SUBTITLE_TRACK_KEYS]);
      }
    });

    it('no subtitle vector maps a key the server never emits (display_title/title/forced fiction)', () => {
      for (const t of allTracks(fixture.subtitle)) {
        const keys = Object.keys(t);
        for (const fiction of FICTION_KEYS) {
          expect(keys, `subtitle emitted '${fiction}' — authority changed without re-ruling`).not.toContain(fiction);
        }
        expect(keys).not.toContain('title');
        expect(keys).toContain('label');
      }
    });

    it('bitmap rows are skipped but still consume the 0:s:N ordinal', () => {
      const c = fixture.subtitle.find((x) => x.case === 'embedded-text-codecs-bitmap-skipped-but-counted');
      if (!c) throw new Error('fixture lost the bitmap-gap subtitle case');
      expect(c.tracks.map((t) => t.index)).toEqual([0, 2]);
      expect(c.tracks.map((t) => t.codec)).toEqual(['subrip', 'mov_text']);
      expect(c.tracks.map((t) => t.label)).toEqual(['eng', 'Español (Forzada)']);
      expect(c.tracks.map((t) => t.hearing_impaired)).toEqual([true, false]);
      expect(c.tracks.map((t) => t.url)).toEqual([
        '/api/v1/media/11111111-2222-3333-4444-555555555555/subtitles/0',
        '/api/v1/media/11111111-2222-3333-4444-555555555555/subtitles/2',
      ]);
    });

    it('external rows serve /subtitles/external/{rowId}, keep source, and do NOT consume an ordinal', () => {
      const c = fixture.subtitle.find((x) => x.case.startsWith('external-downloaded-row'));
      if (!c) throw new Error('fixture lost the external subtitle case');
      const external = c.tracks.find((t) => t.id === 'ss-ext');
      const embedded = c.tracks.find((t) => t.id === 'ss-1');
      if (!external || !embedded) throw new Error('fixture lost the external/embedded pair');
      expect(external.url).toBe('/api/v1/media/11111111-2222-3333-4444-555555555555/subtitles/external/ss-ext');
      expect(external.source).toBe('opensubtitles');
      expect(external.label).toBe('Subtitle 1'); // language+title absent → ordinal fallback
      expect(external.language).toBe('und');
      expect(embedded.index).toBe(0); // external did not shift the embedded 0:s:N ordinal
    });

    it('url is null on every track when the server has no itemId to mint against', () => {
      const c = fixture.subtitle.find((x) => x.case === 'missing-item-id-every-url-null');
      if (!c) throw new Error('fixture lost the no-itemId subtitle case');
      expect(c.itemId).toBe('');
      for (const t of c.tracks) {
        expect(t.url).toBeNull();
      }
    });

    it('label precedence is title ?? language and embedded rows never carry source', () => {
      const c = fixture.subtitle.find((x) => x.case === 'label-precedence-title-over-language');
      if (!c) throw new Error('fixture lost the label-precedence subtitle case');
      expect(c.tracks[0]).toMatchObject({ label: 'Kommentar', language: 'de', codec: 'ssa', source: null });
    });
  });
});

/**
 * renditions.test.
 *
 * @copyright 2026 Joe Huss <detain@interserver.net>
 */

import { describe, it, expect } from 'vitest';
import {
  AUTO_QUALITY,
  pickDefaultRendition,
} from '../src/playback';
import type {
  Rendition,
  RenditionId,
  QualitySelection,
  TranscodeStartResponse,
  TranscodeStatusResponse,
  PlaybackInfo,
} from '../src/playback';

/**
 * `true` only when `A` and `B` are the SAME type, not merely assignable to one
 * another. Assignability is too weak for an absence pin: `false` is assignable
 * to `boolean`, so a widened result would slip through a subtype check.
 * (Same helper as `test/music.test.ts`.)
 */
type Exact<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;

/**
 * `true` iff `K` is a member of `keyof T`. `keyof` includes OPTIONAL members,
 * so this is RED for `dash_url?: string` just as it is for `dash_url: string` —
 * which a value-level/assignability check would not catch.
 */
type HasKey<T, K extends PropertyKey> = K extends keyof T ? true : false;

/**
 * Compile-time assertion. The type argument must resolve to exactly `true`;
 * anything else is a typecheck error, which fails `npm run typecheck` and
 * `npm run build`. NOTE: vitest transpiles without type-checking, so a broken
 * assertion here still shows GREEN under `vitest run` — `tsc --noEmit` is the
 * executor that kills the mutant.
 */
function assertExact<T extends true>(value: T): T {
  return value;
}

/** Build a minimal Rendition rung for helper tests. */
function rung(id: RenditionId, height: number, url: string | null = null): Rendition {
  return {
    id,
    label: id === 'original' ? `Original (${height}p)` : `${height}p`,
    width: Math.round((height * 16) / 9),
    height,
    bitrate: height * 4000,
    codecs: 'avc1.640029,mp4a.40.2',
    url,
    is_original: id === 'original',
    is_copy: id === 'original',
    video_bitrate: height * 3800,
  };
}

// Highest-first, as the server orders variants[].
const ladder: Rendition[] = [
  rung('1080p', 1080, '/hls/j/media_v1080p.m3u8?sig=a'),
  rung('720p', 720, '/hls/j/media_v720p.m3u8?sig=b'),
  rung('480p', 480, '/hls/j/media_v480p.m3u8?sig=c'),
  rung('240p', 240, '/hls/j/media_v240p.m3u8?sig=d'),
];

describe('pickDefaultRendition', () => {
  it('returns the rung matching a valid preference', () => {
    expect(pickDefaultRendition(ladder, '720p')?.id).toBe('720p');
    expect(pickDefaultRendition(ladder, '1080p')?.id).toBe('1080p');
    expect(pickDefaultRendition(ladder, '240p')?.id).toBe('240p');
  });

  it('falls back to a mid-tier rung when no preference is given', () => {
    // 4 rungs, highest-first → median index floor(4/2) = 2 → '480p'.
    expect(pickDefaultRendition(ladder)?.id).toBe('480p');
    // 3 rungs → index 1 (true middle).
    expect(pickDefaultRendition(ladder.slice(0, 3))?.id).toBe('720p');
  });

  it('picks the lower rung of an even (2-rung) ladder — conservative default', () => {
    // Highest-first [1080p, 720p]; floor(2/2) = 1 → the lower/second rung.
    // Confirms the even-length tie resolves toward the lighter rung, not the top.
    expect(pickDefaultRendition(ladder.slice(0, 2))?.id).toBe('720p');
  });

  it('falls back to mid-tier when the preference is not in the list', () => {
    // A valid RenditionId that is simply absent from these variants.
    expect(pickDefaultRendition(ladder, '2160p')?.id).toBe('480p');
    // 'original' is likewise a real RenditionId but not present here → falls through.
    expect(pickDefaultRendition(ladder, 'original')?.id).toBe('480p');
    // A non-RenditionId string still safely falls through.
    expect(pickDefaultRendition(ladder, 'nonsense')?.id).toBe('480p');
  });

  it('treats the AUTO sentinel as no pin (falls through to mid-tier)', () => {
    // 'auto' is never a RenditionId, so it must not match a rung.
    expect(pickDefaultRendition(ladder, AUTO_QUALITY)?.id).toBe('480p');
  });

  it('returns undefined for an empty ladder', () => {
    expect(pickDefaultRendition([])).toBeUndefined();
    expect(pickDefaultRendition([], '720p')).toBeUndefined();
  });

  it('returns the sole rung regardless of preference presence', () => {
    const one = [rung('1080p', 1080)];
    expect(pickDefaultRendition(one)?.id).toBe('1080p');
    expect(pickDefaultRendition(one, 'nope')?.id).toBe('1080p');
  });

  it('is deterministic and side-effect free (input untouched)', () => {
    const snapshot = ladder.map((r) => r.id);
    pickDefaultRendition(ladder, '720p');
    pickDefaultRendition(ladder);
    expect(ladder.map((r) => r.id)).toEqual(snapshot);
    expect(pickDefaultRendition(ladder)?.id).toBe(pickDefaultRendition(ladder)?.id);
  });
});

// Type-level smoke: these literals must satisfy the exported interfaces at
// compile time (the suite fails to typecheck if a field name/type/casing drifts
// from the FIXED server contract).
describe('rendition wire-shape smoke', () => {
  it('constructs a snake_case Rendition verbatim (with a null preview url)', () => {
    const preview: Rendition = {
      id: 'original',
      label: 'Original (2160p)',
      width: 3840,
      height: 2160,
      bitrate: 20_000_000,
      codecs: 'avc1.640033,mp4a.40.2',
      url: null,
      is_original: true,
      is_copy: true,
      video_bitrate: 18_000_000,
    };
    expect(preview.is_original).toBe(true);
    expect(preview.video_bitrate).toBe(18_000_000);
    expect(preview.url).toBeNull();
  });

  it('accepts every fixed RenditionId and the AUTO sentinel as a QualitySelection', () => {
    const ids: RenditionId[] = ['240p', '360p', '480p', '720p', '1080p', '1440p', '2160p', 'original'];
    const selections: QualitySelection[] = [...ids, AUTO_QUALITY];
    expect(selections).toContain('auto');
    expect(selections).toHaveLength(9);
  });

  it('constructs the transcode start/status responses with variants (null-legacy)', () => {
    const start: TranscodeStartResponse = {
      job_id: 'j1',
      master_url: '/hls/j1/master.m3u8?sig=x',
      hls_url: '/hls/j1/media.m3u8?sig=x',
      // S325: the key is always present — null for a job with no manifest.
      dash_url: '/dash/j1/manifest.mpd?sig=x',
      status: 'completed',
      reused: false,
      subtitles: [{ index: 0, language: 'eng', label: 'English', default: true, url: '/hls/j1/s0.vtt?sig=x' }],
      variants: ladder,
    };
    const legacy: TranscodeStatusResponse = {
      job_id: 'j0',
      status: 'running',
      segments: 3,
      playlist_ready: true,
      progress: 42.5,
      master_url: '/hls/j0/master.m3u8?sig=y',
      // mpegts rollback / pre-S60 job → no manifest → null, never absent.
      dash_url: null,
      subtitles: [],
      variants: null,
    };
    expect(start.variants?.[0].id).toBe('1080p');
    expect(legacy.variants).toBeNull();
    expect(legacy.progress).toBe(42.5);
    expect(start.dash_url).toContain('/dash/j1/manifest.mpd');
    expect(legacy.dash_url).toBeNull();
  });

  it('accepts a sub-240p fallback rung id (`${number}p`, e.g. 144p) as a valid RenditionId', () => {
    // A source shorter than the 240p ladder floor makes the server emit ONE
    // source-sized fallback rung whose id is `${height}p` — outside the
    // canonical set. RenditionId must admit it, and it must still round-trip
    // through pickDefaultRendition as an opaque string.
    const fallbackId: RenditionId = '144p';
    const ladder: Rendition[] = [rung(fallbackId, 144)];
    expect(pickDefaultRendition(ladder, fallbackId)?.id).toBe('144p');
    // A persisted pin that matches no rung → median fallback (the sole rung here).
    expect(pickDefaultRendition(ladder, '200p')?.id).toBe('144p');
  });

  it('declares dash_url on both transcode shapes, absent on Rendition (S325)', () => {
    // phlix-server S59 restored what S11 removed: the transcode start/status
    // responses carry `dash_url` ALWAYS, typed `string | null` — a signed URL
    // when the job published a `manifest.mpd` (every fMP4 job, the shipped
    // default since S60), null for the `mpegts` rollback and pre-flip jobs.
    //
    // S325 pins the PRESENCE (this test reddens against the pre-S325 shape,
    // where the key did not exist). The rung-level `Rendition` stays without
    // one: a rendition is a ladder rung, never a DASH endpoint — a playback
    // preview rung has no job at all.
    //
    // `Exact<…, true>` (not a bare assignability check) so that re-declaring
    // the member as optional is just as RED as removing it.
    expect(assertExact<Exact<HasKey<TranscodeStartResponse, 'dash_url'>, true>>(true)).toBe(true);
    expect(assertExact<Exact<HasKey<TranscodeStatusResponse, 'dash_url'>, true>>(true)).toBe(true);
    expect(assertExact<Exact<HasKey<Rendition, 'dash_url'>, false>>(true)).toBe(true);

    // The value admits null: an mpegts rollback job has no manifest to point at.
    expect(assertExact<Exact<null extends TranscodeStartResponse['dash_url'] ? true : false, true>>(true)).toBe(true);
    expect(assertExact<Exact<null extends TranscodeStatusResponse['dash_url'] ? true : false, true>>(true)).toBe(true);

    // Counterweight: the helper must be capable of reporting both answers,
    // otherwise the assertions above would pass against any type at all.
    expect(assertExact<Exact<HasKey<TranscodeStartResponse, 'master_url'>, true>>(true)).toBe(true);
    expect(assertExact<Exact<HasKey<TranscodeStatusResponse, 'master_url'>, true>>(true)).toBe(true);
    expect(assertExact<Exact<HasKey<Rendition, 'url'>, true>>(true)).toBe(true);
  });

  it('adds an optional quality_ladder preview to PlaybackInfo (additive)', () => {
    const withLadder: PlaybackInfo = {
      item_id: 'a1',
      intro_marker: null,
      outro_marker: null,
      chapters: [],
      skip_button_spec: {
        skip_intro_start: null,
        skip_intro_end: null,
        skip_outro_start: null,
        skip_outro_end: null,
      },
      quality_ladder: [rung('1080p', 1080)],
    };
    // Unscanned item → whole field null; older servers may omit it entirely.
    const nullLadder: PlaybackInfo = { ...withLadder, quality_ladder: null };
    const omitted: PlaybackInfo = {
      item_id: 'a2',
      intro_marker: null,
      outro_marker: null,
      chapters: [],
      skip_button_spec: withLadder.skip_button_spec,
    };
    expect(withLadder.quality_ladder?.[0].url).toBeNull();
    expect(nullLadder.quality_ladder).toBeNull();
    expect(omitted.quality_ladder).toBeUndefined();
  });
});

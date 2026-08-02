/**
 * music.test — pins the `mediaItemId` key space on the three music interfaces.
 *
 * `mediaItemId` is a FK to `media_items.id`, a `CHAR(36)` UUID. It was typed
 * `number | null` / `number` here, mirroring the same wrong assumption that
 * phlix-server encoded as an `is_numeric()` test against a UUID (S121) — a test
 * that can never pass, so the field was silently `null`/`0` for the life of the
 * bug. These assertions exist so that reverting the type is a RED gate rather
 * than a silent regression.
 *
 * @copyright 2026 Joe Huss <detain@interserver.net>
 */

import { describe, it, expect } from 'vitest';
import type { MusicArtist, MusicAlbum, MusicTrack } from '../src/Music';

/**
 * `true` only when `A` and `B` are the SAME type, not merely assignable to one
 * another. Assignability is too weak here: `string` is assignable to
 * `string | number`, so an accidental widening would pass a subtype check.
 */
type Exact<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;

/**
 * Compile-time assertion. The type argument must resolve to exactly `true`;
 * anything else is a typecheck error, which fails `npm run typecheck`,
 * `npm run build` and the test run alike.
 */
function assertExact<T extends true>(value: T): T {
  return value;
}

// A real `media_items.id` value: CHAR(36), 8-4-4-4-12 hex with hyphens.
const MEDIA_ITEM_UUID = '9f8b1c2d-3e4f-4a5b-8c9d-0e1f2a3b4c5d';

describe('music mediaItemId key space', () => {
  it('types mediaItemId as `string | null` on all three interfaces', () => {
    // Each of these is a typecheck error if the member reverts to a numeric
    // type, or is widened to something like `string | number | null`.
    expect(assertExact<Exact<MusicArtist['mediaItemId'], string | null>>(true)).toBe(true);
    expect(assertExact<Exact<MusicAlbum['mediaItemId'], string | null>>(true)).toBe(true);
    expect(assertExact<Exact<MusicTrack['mediaItemId'], string | null>>(true)).toBe(true);
  });

  it('leaves the music tables own AUTO_INCREMENT keys as `number`', () => {
    // The counterweight to the assertion above: `id` / `artistId` / `albumId`
    // are a genuinely different key space and must NOT be swept to `string`.
    expect(assertExact<Exact<MusicArtist['id'], number>>(true)).toBe(true);
    expect(assertExact<Exact<MusicAlbum['id'], number>>(true)).toBe(true);
    expect(assertExact<Exact<MusicAlbum['artistId'], number>>(true)).toBe(true);
    expect(assertExact<Exact<MusicTrack['id'], number>>(true)).toBe(true);
    expect(assertExact<Exact<MusicTrack['albumId'], number>>(true)).toBe(true);
    expect(assertExact<Exact<MusicTrack['artistId'], number>>(true)).toBe(true);
  });

  it('constructs each shape with a real UUID and with null', () => {
    const artist: MusicArtist = {
      id: 1,
      mediaItemId: MEDIA_ITEM_UUID,
      name: 'Sigur Rós',
      sortName: 'Sigur Ros',
      biography: null,
      imageUrl: null,
    };

    const album: MusicAlbum = {
      id: 2,
      mediaItemId: null,
      artistId: 1,
      title: '( )',
      sortTitle: null,
      year: 2002,
      totalTracks: 8,
      totalDiscs: 1,
      albumArtUrl: null,
    };

    const track: MusicTrack = {
      id: 3,
      mediaItemId: MEDIA_ITEM_UUID,
      albumId: 2,
      artistId: 1,
      title: 'Untitled 3',
      trackNumber: 3,
      discNumber: 1,
      durationSecs: 402,
    };

    expect(artist.mediaItemId).toHaveLength(36);
    expect(album.mediaItemId).toBeNull();
    expect(track.mediaItemId).toBe(MEDIA_ITEM_UUID);
  });
});

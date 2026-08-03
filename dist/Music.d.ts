/**
 * Music library types — artist, album, track, and audio preference shapes.
 *
 * These mirror the server's JSON response shapes for the music library
 * ( populated by the P7-S1 scanner ) and are shared across all clients.
 *
 * ⚠ `id` / `artistId` / `albumId` are the music tables' own AUTO_INCREMENT
 * integer keys and stay `number`. `mediaItemId` is a DIFFERENT kind of key —
 * a foreign key into `media_items.id`, which is a `CHAR(36)` UUID — so it is
 * `string | null`. Do not "harmonise" the two; conflating them is what
 * produced phlix-server S121 (an `is_numeric()` test applied to a UUID made
 * the field silently `null` on every response for the life of the bug).
 *
 * ⚠ `phlix-ui` deliberately does NOT consume these interfaces. It maintains
 * its own `src/types/music.ts` with string ids and no `mediaItemId` member at
 * all. That divergence is INTENTIONAL and is not drift to be reconciled here:
 * the UI models what its own components render, while this file models the
 * server's wire shape. Reconciling them is a separate, deliberate decision.
 *
 * @copyright 2026 Joe Huss <detain@interserver.net>
 */
/**
 * A music artist with optional top tracks and album count.
 */
export interface MusicArtist {
    id: number;
    /**
     * FK to `media_items.id` — a `CHAR(36)` UUID, not an integer.
     * `null` when the artist has no backing `media_items` row.
     * Mirrors `MusicArtist::$mediaItemId` (`?string`) in phlix-server.
     */
    mediaItemId: string | null;
    name: string;
    sortName: string | null;
    biography: string | null;
    imageUrl: string | null;
    albumCount?: number;
    topTracks?: MusicTrack[];
}
/**
 * A music album with optional artist and track data.
 */
export interface MusicAlbum {
    id: number;
    /**
     * FK to `media_items.id` — a `CHAR(36)` UUID, not an integer.
     * `null` when the album has no backing `media_items` row.
     * Mirrors `MusicAlbum::$mediaItemId` (`?string`) in phlix-server.
     */
    mediaItemId: string | null;
    artistId: number;
    title: string;
    sortTitle: string | null;
    year: number | null;
    totalTracks: number;
    totalDiscs: number;
    albumArtUrl: string | null;
    artist?: MusicArtist;
    tracks?: MusicTrack[];
}
/**
 * A music track belonging to an album and artist.
 */
export interface MusicTrack {
    id: number;
    /**
     * FK to `media_items.id` — a `CHAR(36)` UUID, not an integer.
     *
     * ⚠ Also now NULLABLE, which it was not before. This shape was the worst of
     * the three: `MusicTrack` is the one class whose PHP fallback was `0` rather
     * than `null`, so a missing FK arrived as a plausible-looking id no caller
     * would recognise as absent. phlix-server made it `?string`; a `null` here
     * means "no backing `media_items` row", and that case must be handled.
     */
    mediaItemId: string | null;
    albumId: number;
    artistId: number;
    title: string;
    trackNumber: number | null;
    discNumber: number;
    durationSecs: number;
    artist?: MusicArtist;
    album?: MusicAlbum;
}
/**
 * Audio playback preferences — crossfade, gapless, and quality.
 */
export interface AudioPreferences {
    /** Crossfade duration in seconds. 0 = disabled. */
    crossfadeDuration: number;
    /** Fade-in fraction (0–1). */
    crossfadeFadeIn: number;
    /** Fade-out fraction (0–1). */
    crossfadeFadeOut: number;
    /** Enable gapless playback. */
    gaplessEnabled: boolean;
    /** Preferred audio quality tier. */
    preferredAudioQuality: 'low' | 'medium' | 'high' | 'lossless';
}

/**
 * Music library types — artist, album, track, and audio preference shapes.
 *
 * These mirror the server's JSON response shapes for the music library
 * ( populated by the P7-S1 scanner ) and are shared across all clients.
 * @copyright 2026 Joe Huss <detain@interserver.net>
 */

/**
 * A music artist with optional top tracks and album count.
 */
export interface MusicArtist {
  id: number;
  mediaItemId: number | null;
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
  mediaItemId: number | null;
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
  mediaItemId: number;
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

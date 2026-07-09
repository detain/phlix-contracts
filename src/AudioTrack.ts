/**
 * Audio track types for media streams.
 *
 * These types model the parsed audio track data from the `media_streams` table
 * (P3B-S2 server persistence). The language field uses BCP 47 tags (e.g.,
 * "en-US", "es-ES", "fr-FR") as specified by the server's `bc_p47_language`
 * column.
 *
 * @copyright 2026 Joe Huss <detain@interserver.net>
 */

/**
 * An audio track from the media_streams table.
 *
 * Mirrors the server's `media_streams` row where `stream_type = 'audio'`.
 * Language is a BCP 47 tag (e.g., "en-US", "ja-JP", "de-DE").
 *
 * Distinct from the playback.ts `AudioTrack` type which carries `display_title`
 * and `url` (用于 playback bundle).
 */
export interface StreamAudioTrack {
  id: string;
  codec: string;
  /** BCP 47 language tag (e.g., "en-US", "es-ES"). */
  language: string;
  channels: number;
  /** Bitrate in bits per second. */
  bitrate?: number;
  /** Track title (e.g., "Director's Commentary"). */
  title?: string;
}

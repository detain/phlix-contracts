/**
 * Subtitle track types for media streams.
 *
 * These types model the parsed subtitle track data from the `media_streams`
 * table (P3B-S2 server persistence). The language field uses BCP 47 tags
 * (e.g., "en-US", "es-ES", etc.) as specified by the server's
 * `bc_p47_language` column.
 *
 * @copyright 2026 Joe Huss <detain@interserver.net>
 */
/**
 * A subtitle track from the media_streams table.
 *
 * Mirrors the server's `media_streams` row where `stream_type = 'subtitle'`.
 * Language is a BCP 47 tag (e.g., "en-US", "ja-JP", "de-DE").
 *
 * Distinct from the playback.ts `SubtitleTrack` type which carries `display_title`
 * and `url` (用于 playback bundle).
 */
export interface StreamSubtitleTrack {
    id: string;
    codec: string;
    /** BCP 47 language tag (e.g., "en-US", "es-ES"). */
    language: string;
    /** Track title (e.g., "English (SDH)", "Spanish"). */
    title?: string;
    /** Whether this is a forced subtitle track (auto-displayed for foreign audio). */
    isForced?: boolean;
    /** Whether this is the default subtitle track. */
    isDefault?: boolean;
}

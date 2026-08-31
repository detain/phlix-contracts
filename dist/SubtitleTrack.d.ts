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
 * TWO VOCABULARIES (S404 ruling): this `Stream*` pair models DATABASE rows
 * (`media_streams` columns, camelCase app fields). The playback-info WIRE shape
 * — what `GET /api/v1/media/{id}/playback-info` emits through the server's
 * `StreamTrackShaper` — is the playback.ts `AudioTrack`/`SubtitleTrack` pair
 * (snake_case, incl. `index`/`stream_index`/`label`/`source`/
 * `hearing_impaired`/`url`). The wire never carries `title`/`isForced`/
 * `isDefault` on subtitles: it derives `label` server-side and has no forced/
 * default concept for subtitle rows. A client reading a playback-info response
 * MUST type it as the playback.ts wire shape, never as this DB mirror.
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

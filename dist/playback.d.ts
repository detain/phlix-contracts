/**
 * Playback / streaming wire shapes.
 *
 * Field names are the server's snake_case verbatim. The two playback-related
 * server endpoints are:
 *
 *   - `GET /api/v1/media/{id}/playback-info` — the PlaybackInfo marker +
 *     quality-ladder shape (`item_id`, `intro_marker`, `outro_marker`,
 *     `chapters[]`, `skip_button_spec`, `quality_ladder[]`), produced by
 *     `MediaItemController::getPlaybackInfo()`. (The distinct
 *     `GET /api/v1/media/{id}/playback` route returns a differently-wrapped
 *     `{playback_info:{…media_sources…}}` shape and is NOT this type.)
 *   - the play/stream descriptors the clients consume (`stream_url`, `url`,
 *     `protocol`, …).
 *
 * The {@link AudioTrack}/{@link SubtitleTrack} pair models the
 * `audio_tracks[]`/`subtitle_tracks[]` arrays exactly as the server's
 * `Media/Library/StreamTrackShaper.php` emits them (S404 authority ruling);
 * the DB-row mirrors live in `AudioTrack.ts`/`SubtitleTrack.ts` as the
 * `Stream*` types — do not conflate the two vocabularies.
 *
 * Consolidates the mobile (`playback.ts`) and windows (`api.ts`) declarations.
 * @copyright 2026 Joe Huss <detain@interserver.net>
 */
import type { MediaItem } from './media';
import type { ChapterMarker, TrickplaySprite } from './Chapter';
/** Stream transport protocol. */
export type StreamProtocol = 'hls' | 'http';
/** A direct-play / stream descriptor (mobile `StreamInfo`). */
export interface StreamInfo {
    url: string;
    /**
     * Short-lived signed direct-play URL (`/media/{id}/stream?exp&sig`). The
     * stream route is gated and native players are handed a bare URI with no
     * Authorization header, so when present the player MUST use this instead of
     * `url`. Optional: older servers omit it (fall back to `url`).
     */
    stream_url?: string;
    protocol: StreamProtocol;
    container: string;
    size: number;
    bitrate: number;
    duration_seconds: number;
}
/** A selectable media source (mobile `MediaSource`). */
export interface MediaSource {
    id: string;
    protocol: StreamProtocol;
    container: string;
    size: number;
    bitrate: number;
}
/**
 * The canonical rendition-rung ids. The server's `AbrLadder` normally emits one
 * of these stable lowercase strings; `'original'` IS a real rung (source
 * passthrough / stream-copy), not a sentinel. Highest-first in a `Rendition[]`.
 */
export type CanonicalRenditionId = '240p' | '360p' | '480p' | '720p' | '1080p' | '1440p' | '2160p' | 'original';
/**
 * A rendition-rung id as it appears on the wire. Almost always a
 * {@link CanonicalRenditionId}, but NOT a strictly closed set: for a source
 * SHORTER than the 240p ladder floor the server emits a single source-sized
 * fallback rung whose id is still `` `${height}p` `` (e.g. `'144p'`, `'200p'`)
 * — hence the open `` `${number}p` `` member. Treat the id as an opaque string
 * for equality/persistence; do not assume it is one of the canonical rungs.
 */
export type RenditionId = CanonicalRenditionId | `${number}p`;
/**
 * UI-only "let ABR decide" sentinel. NOT a {@link RenditionId} — the server
 * never sends it and no `Rendition.id` ever equals it; it exists purely so a
 * client can persist/expose an "Auto" choice distinct from a pinned rung.
 */
export declare const AUTO_QUALITY = "auto";
/** The `'auto'` sentinel type. */
export type AutoQuality = typeof AUTO_QUALITY;
/**
 * A persisted/exposed quality choice: a concrete rung id or the `'auto'`
 * sentinel. Keeps the ABR-vs-pinned distinction explicit at the type level.
 */
export type QualitySelection = RenditionId | AutoQuality;
/**
 * One rung of the ABR quality ladder (or the Original passthrough descriptor).
 * Mirrors the server's flat wire shape verbatim (snake_case), produced by
 * `Phlix\Media\Streaming\Rendition::toArray()` and served on transcode
 * start/status `variants[]` and on playback-info `quality_ladder[]`.
 *
 * `url` is a SIGNED path to this variant's own `media_v{id}.m3u8`; it is `null`
 * in the playback-info preview (no job exists yet) and non-null on a real job's
 * `variants[]`. All bitrates are in bits/second.
 */
export interface Rendition {
    id: RenditionId;
    label: string;
    width: number;
    height: number;
    /** Advertised peak BANDWIDTH (bps) — video maxrate + audio allowance. */
    bitrate: number;
    /** HLS `CODECS` string (avc1.* + mp4a.40.2). */
    codecs: string;
    /** Signed media-playlist path, or `null` in the playback-info preview. */
    url: string | null;
    is_original: boolean;
    is_copy: boolean;
    /** Target video encode bitrate (`-b:v`) in bps. */
    video_bitrate: number;
}
/**
 * A soft subtitle track on a transcode job (`variants`-adjacent). Distinct from
 * {@link SubtitleTrack}: the transcode pipeline emits `{index,language,label,
 * default,url}` (matching `TranscodeManager` job readiness), not the
 * playback-info {@link SubtitleTrack} wire shape (which carries
 * `id/index/stream_index/language/label/codec/source/hearing_impaired/url`).
 */
export interface TranscodeSubtitleTrack {
    index: number;
    language: string;
    label: string;
    default: boolean;
    url: string;
}
/**
 * Response from `POST /api/v1/media/{id}/transcode` (start / ensure job).
 * `variants` is the playable quality ladder; `null` only for a legacy pre-ABR
 * job (explicit key, so a client checks `!= null` rather than key absence).
 *
 * `dash_url` (S325): phlix-server S59 restored what S11 removed. The key is
 * ALWAYS present, `string | null` — a signed `/dash/{job}/manifest.mpd` when
 * the job actually published a manifest, null otherwise (an `mpegts` job —
 * the rollback — and jobs created before S60 flipped the shipped default to
 * `fmp4`, which always publishes one). A client branching on `dash_url !=
 * null` must treat a populated value as the DASH endpoint and a null as
 * "no DASH for this job". The presence (and null-admittance) is pinned by
 * `test/renditions.test.ts` ("declares dash_url on both transcode shapes").
 */
export interface TranscodeStartResponse {
    job_id: string;
    master_url: string;
    hls_url: string;
    /** Signed DASH manifest URL, or null when the job published no manifest. */
    dash_url: string | null;
    status: string;
    reused: boolean;
    subtitles: TranscodeSubtitleTrack[];
    variants: Rendition[] | null;
}
/**
 * Response from `GET /api/v1/transcode/{jobId}/status`. Same `variants` ladder
 * as {@link TranscodeStartResponse} (`null` for a legacy job); adds on-disk
 * readiness counters.
 *
 * `dash_url` here is gated exactly like the start response: always present,
 * `string | null` — see {@link TranscodeStartResponse}.
 */
export interface TranscodeStatusResponse {
    job_id: string;
    status: string;
    segments: number;
    playlist_ready: boolean;
    progress: number;
    master_url: string;
    /** Signed DASH manifest URL, or null when the job published no manifest. */
    dash_url: string | null;
    subtitles: TranscodeSubtitleTrack[];
    variants: Rendition[] | null;
}
/**
 * Pick a sensible bootstrap rendition before ABR takes over — deterministic and
 * side-effect free.
 *
 *   1. Empty list → `undefined`.
 *   2. A `preferredId` matching a rung's `id` → that rung (a user's pinned
 *      quality). The `'auto'` sentinel never matches a {@link RenditionId}, so
 *      an "Auto" preference correctly falls through to step 3.
 *   3. Otherwise a mid-tier rung: `variants` is highest-first, so the median
 *      index favours a conservative middle quality (and the sole rung when there
 *      is only one), avoiding both a heavy top rung and a needlessly low one.
 *
 * @param variants    Highest-first rendition list (as the server orders it).
 * @param preferredId Optional pinned rung id (or any persisted quality value).
 */
export declare function pickDefaultRendition(variants: Rendition[], preferredId?: string): Rendition | undefined;
/**
 * Ordered wire keys of {@link SubtitleTrack} — exported so
 * `test/trackShapeParity.test.ts` can compare them, EXACTLY and in order,
 * against the golden vectors captured from the server's
 * `StreamTrackShaper::subtitleTracks()`. Keep in lockstep with the interface
 * (the type-level tie below is a compile error if they diverge).
 */
export declare const SUBTITLE_TRACK_KEYS: readonly ["id", "index", "stream_index", "language", "label", "codec", "source", "hearing_impaired", "url"];
/**
 * A subtitle track on the `GET /api/v1/media/{id}/playback-info` wire —
 * one element of `subtitle_tracks[]`, emitted verbatim (snake_case) by the
 * server's authoritative `Phlix\Media\Library\StreamTrackShaper::
 * subtitleTracks()`.
 *
 * S404 authority ruling (2026-08-31, verified at server `01340633`): this is
 * the REAL wire shape. The pre-S404 declaration here carried a required
 * `display_title` and optional `url` — a fiction no endpoint ever emitted
 * (`git grep display_title` in phlix-server `src/`: ZERO hits). `label` is the
 * display string the server derives (`title ?? language ?? 'Subtitle N'`).
 *
 * - `index` — 0-based PER-TYPE ordinal in ffmpeg's `0:s:N` selector space
 *   (counts every subtitle row, including bitmap rows the extraction endpoint
 *   can't serve and that are therefore NOT emitted here).
 * - `stream_index` — the global ffprobe index from `media_streams.stream_index`.
 * - `language` — BCP 47 tag; `'und'` when the row stores none.
 * - `label` — always a non-empty display string (server-coerced).
 * - `source` — `null` for embedded rows; provenance for downloaded external
 *   subtitle rows (`media_streams.storage_path` rows).
 * - `hearing_impaired` — stored-flag boolean (never "forced": the wire has no
 *   forced concept).
 * - `url` — SIGNED path to the extraction endpoint
 *   (`/api/v1/media/{itemId}/subtitles/{index}`, external rows:
 *   `/subtitles/external/{rowId}`) carrying `?exp&sig`; `null` when the server
 *   has no itemId to mint against.
 */
export interface SubtitleTrack {
    id: string;
    index: number;
    stream_index: number;
    language: string;
    label: string;
    codec: string;
    source: string | null;
    hearing_impaired: boolean;
    url: string | null;
}
/**
 * Ordered wire keys of {@link AudioTrack} — exported for the golden-vector
 * parity test; keep in lockstep with the interface.
 */
export declare const AUDIO_TRACK_KEYS: readonly ["id", "index", "stream_index", "codec", "language", "channels", "bitrate", "title", "default"];
/**
 * An audio track on the `GET /api/v1/media/{id}/playback-info` wire — one
 * element of `audio_tracks[]`, emitted verbatim (snake_case) by the server's
 * authoritative `Phlix\Media\Library\StreamTrackShaper::audioTracks()`.
 *
 * S404 authority ruling: this is the REAL wire shape (see {@link SubtitleTrack}
 * for the `display_title` fiction this replaces). The audio wire carries NO
 * `url` (playback is the container stream; there is no per-audio-track
 * endpoint), NO `label`, and `bitrate` is ALWAYS present (nullable).
 *
 * - `index` — 0-based PER-TYPE ordinal in ffmpeg's `0:a:N` selector space.
 * - `stream_index` — the global ffprobe index.
 * - `language` — BCP 47 tag; `'und'` when the row stores none.
 * - `title` — raw stored track title or `null` (a display string is the
 *   consumer's call — mirror of the DB column, unlike the subtitle `label`).
 * - `default` — stored disposition when present, else the FIRST track is
 *   promoted so exactly one track is `default` whenever any exist.
 */
export interface AudioTrack {
    id: string;
    index: number;
    stream_index: number;
    codec: string;
    language: string;
    channels: number;
    bitrate: number | null;
    title: string | null;
    default: boolean;
}
/**
 * Compile-time tie between the interfaces and their ordered key-list consts:
 * every interface key is in the const and vice versa, so a field rename on ONE
 * side is a `tsc` error even where the runtime parity test (which compares the
 * consts against the golden server vectors) cannot see the type.
 */
type WireKeysExact<T, K extends readonly string[]> = [
    Exclude<keyof T & string, K[number]>,
    Exclude<K[number], keyof T & string>
] extends [never, never] ? true : false;
export type SubtitleTrackKeysTied = WireKeysExact<SubtitleTrack, typeof SUBTITLE_TRACK_KEYS>;
export type AudioTrackKeysTied = WireKeysExact<AudioTrack, typeof AUDIO_TRACK_KEYS>;
export declare const TRACK_KEY_TIES: {
    readonly subtitle: true;
    readonly audio: true;
};
/**
 * Client device profile driving direct-play vs transcode decisions. This is
 * the mobile snake_case shape (the canonical one). The windows client uses a
 * divergent PascalCase Jellyfin-style profile — see `WindowsDeviceProfile`.
 */
export interface DeviceProfile {
    name: string;
    platform: 'ios' | 'android';
    version: string;
    capabilities: {
        video_codecs: string[];
        audio_codecs: string[];
        max_resolution: number;
        max_bitrate: number;
        supports_4k: boolean;
        supports_hdr: boolean;
        supports_dolby_vision: boolean;
        supports_dolby_atmos: boolean;
        supports_dts: boolean;
    };
}
/**
 * The windows client's PascalCase Jellyfin-style device profile. Kept distinct
 * so the windows client can stop redeclaring it locally without forcing the
 * snake_case mobile shape on it.
 */
export interface WindowsDeviceProfile {
    Name: string;
    MaxStreamingBitrate: number;
    MaxStaticBitrate: number;
    SupportedMediaTypes: string[];
    DirectPlayProfiles: {
        Container: string;
        Type: string;
        VideoCodec?: string;
        AudioCodec?: string;
    }[];
    TranscodingProfiles: {
        Container: string;
        Type: string;
        VideoCodec: string;
        AudioCodec: string;
    }[];
}
/**
 * Flat skip-marker boundaries, the legacy `skip_button_spec` shape that both
 * clients already consume (mobile `SkipMarkers`, windows `PlaybackMarkers`).
 * Mirrors `Phlix\Media\Markers\SkipButtonSpec::toArray()`.
 */
export interface SkipButtonSpec {
    skip_intro_start: number | null;
    skip_intro_end: number | null;
    skip_outro_start: number | null;
    skip_outro_end: number | null;
}
/** Alias matching the mobile client's `SkipMarkers` name. */
export type SkipMarkers = SkipButtonSpec;
/** Alias matching the windows client's `PlaybackMarkers` name. */
export type PlaybackMarkers = SkipButtonSpec;
/** A start/end marker in seconds (intro/outro). */
export interface TimeMarker {
    start_seconds: number;
    end_seconds: number;
}
/**
 * The marker/skip + quality-ladder response from
 * `GET /api/v1/media/{id}/playback-info`, produced by
 * `MediaItemController::getPlaybackInfo()`. `intro_marker`/`outro_marker` are null
 * when no marker was detected. (Do not confuse with `GET …/playback`, a distinct
 * route returning a `{playback_info:{…media_sources…}}` wrapper.)
 */
export interface PlaybackInfo {
    item_id: string;
    intro_marker: TimeMarker | null;
    outro_marker: TimeMarker | null;
    skip_button_spec: SkipButtonSpec;
    /**
     * Pre-flight ABR ladder PREVIEW (D6): the quality rungs a play would produce,
     * built from persisted source metadata with NO live probing and NO job — so
     * every entry's `url` is `null`. The whole field is `null` when the item has
     * not been scanned/backfilled with source metadata yet. Additive: older
     * servers omit the key entirely, so it is optional.
     */
    quality_ladder?: Rendition[] | null;
    /** Chapter markers enriched with index (from ChapterTrack). */
    chapters?: ChapterMarker[];
    /** Trickplay sprite metadata for visual scrubbing. */
    trickplay?: TrickplaySprite | null;
}
/**
 * The mobile client's richer PlaybackInfo bundle (media source + tracks +
 * stream info + optional flat markers). Distinct from {@link PlaybackInfo}
 * which is the server marker endpoint; kept under its own name to preserve the
 * mobile client's existing field shape.
 */
export interface PlaybackBundle {
    media_source: MediaSource;
    play_session_id: string;
    stream_info: StreamInfo;
    subtitle_tracks: SubtitleTrack[];
    audio_tracks: AudioTrack[];
    markers?: SkipMarkers;
}
/**
 * The windows client's `PlaybackInfoResponse` — `{ item, playback_info }`
 * where `playback_info` carries the stream URL + container + mime type and
 * optional flat markers.
 */
export interface PlaybackInfoResponse {
    item: MediaItem;
    playback_info: {
        url: string;
        /** Signed direct-play URL; player uses this over `url` when present. */
        stream_url?: string;
        container: string;
        mime_type: string;
        markers?: PlaybackMarkers;
    };
}
/** Response from `POST /Sessions/Play` (windows `PlaybackStartResponse`). */
export interface PlaybackStartResponse {
    session_id: string;
    start_position_ticks: number;
}
/** Progress report payload (mobile `PlaybackProgress`). Ticks are 100-ns. */
export interface PlaybackProgress {
    position_ticks: number;
    duration_ticks: number;
    is_paused: boolean;
    volume_level: number;
}
/** An active playback session (mobile `PlaybackSession`). */
export interface PlaybackSession {
    id: string;
    user_id: string;
    media_item_id: string;
    server_id: string;
    client_name: string;
    device_id: string;
}
export {};

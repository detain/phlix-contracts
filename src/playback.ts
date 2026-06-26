/**
 * Playback / streaming wire shapes.
 *
 * Field names are the server's snake_case verbatim. The two playback-related
 * server endpoints are:
 *
 *   - `GET /api/v1/media/{id}/playback` — the PlaybackInfo marker shape
 *     (`item_id`, `intro_marker`, `outro_marker`, `chapters[]`,
 *     `skip_button_spec`), produced by `MediaItemController::playbackInfo()`.
 *   - the play/stream descriptors the clients consume (`stream_url`, `url`,
 *     `protocol`, …).
 *
 * Consolidates the mobile (`playback.ts`) and windows (`api.ts`) declarations.
 */

import type { MediaItem } from './media';

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

/** A subtitle track. `url` present when delivered as a soft track. */
export interface SubtitleTrack {
  id: string;
  codec: string;
  language: string;
  display_title: string;
  url?: string;
}

/** An audio track. */
export interface AudioTrack {
  id: string;
  codec: string;
  language: string;
  display_title: string;
  channels: number;
  url?: string;
}

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
  DirectPlayProfiles: Array<{
    Container: string;
    Type: string;
    VideoCodec?: string;
    AudioCodec?: string;
  }>;
  TranscodingProfiles: Array<{
    Container: string;
    Type: string;
    VideoCodec: string;
    AudioCodec: string;
  }>;
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

/** A chapter marker in seconds, with an optional title. */
export interface ChapterMarker {
  start_seconds: number;
  end_seconds: number;
  title?: string;
}

/**
 * The marker/skip response from `GET /api/v1/media/{id}/playback`, produced by
 * `MediaItemController::playbackInfo()`. `intro_marker`/`outro_marker` are null
 * when no marker was detected.
 */
export interface PlaybackInfo {
  item_id: string;
  intro_marker: TimeMarker | null;
  outro_marker: TimeMarker | null;
  chapters: ChapterMarker[];
  skip_button_spec: SkipButtonSpec;
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

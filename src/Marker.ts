/**
 * @copyright 2026 Joe Huss <detain@interserver.net>
 */

/** Marker types matching MarkerType PHP enum */
export type MarkerType = 'intro' | 'outro' | 'credits' | 'ad';

/** A single marker (chapter / skip point) on a media item */
export interface Marker {
  id: number;
  /** 'intro' | 'outro' | 'credits' | 'ad' */
  type: MarkerType;
  /** Start time in milliseconds */
  startMs: number;
  /** End time in milliseconds */
  endMs: number;
  /** Optional label (e.g. "Intro", "Credits") */
  label: string | null;
}

/** Player preference for skip durations */
export interface PlayerPrefs {
  /** Whether to auto-skip intros (milliseconds, 0 = off) */
  skipIntroMs: number;
  /** Whether to auto-skip outros (milliseconds, 0 = off) */
  skipOutroMs: number;
  /** Playback speed multiplier (e.g. 1.0, 1.5, 2.0) */
  playbackSpeed: number;
  /** Preferred audio track ID */
  audioTrackId: string | null;
  /** Preferred subtitle track ID ('off' means no subtitles) */
  subtitleTrackId: string | null;
}

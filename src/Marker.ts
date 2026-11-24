/**
 * @copyright 2026 Joe Huss <detain@interserver.net>
 */

import type { WireKeysExact } from './internal/wireKeys.js';

/**
 * Marker types matching MarkerType PHP enum — the literal union is now
 * DERIVED from the ordered const below, so the emitted vocabulary and the
 * pinned vocabulary cannot drift apart (S-contracts-02 / -002). The resolved
 * type is byte-for-byte the same four-member union as before.
 */
export const MARKER_TYPES = ['intro', 'outro', 'credits', 'ad'] as const;

/** Marker types matching MarkerType PHP enum */
export type MarkerType = (typeof MARKER_TYPES)[number];

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

/** Ordered key set of {@link Marker} (S-contracts-02 / -002). */
export const MARKER_KEYS = ['id', 'type', 'startMs', 'endMs', 'label'] as const;

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

/** Ordered key set of {@link PlayerPrefs} (S-contracts-02 / -002). */
export const PLAYER_PREFS_KEYS = [
  'skipIntroMs',
  'skipOutroMs',
  'playbackSpeed',
  'audioTrackId',
  'subtitleTrackId',
] as const;

// ---------------------------------------------------------------------------
// Compile-time ties (S-contracts-02 / -002). See `src/media.ts` for the law;
// these pin each wire interface to its ordered key-list const.
// ---------------------------------------------------------------------------

export type MarkerKeysTied = WireKeysExact<Marker, typeof MARKER_KEYS>;
export type PlayerPrefsKeysTied = WireKeysExact<PlayerPrefs, typeof PLAYER_PREFS_KEYS>;
export type MarkerTypeVocabularyTied = (typeof MARKER_TYPES)[number] extends MarkerType
  ? MarkerType extends (typeof MARKER_TYPES)[number]
    ? true
    : false
  : false;

const _markerKeysTied: MarkerKeysTied = true;
const _playerPrefsKeysTied: PlayerPrefsKeysTied = true;
const _markerTypeVocabularyTied: MarkerTypeVocabularyTied = true;

/** Every marker-family tie, aggregated for the runtime legs of the gate. */
export const MARKER_KEY_TIES = {
  marker: _markerKeysTied,
  prefs: _playerPrefsKeysTied,
  vocabulary: _markerTypeVocabularyTied,
} as const;

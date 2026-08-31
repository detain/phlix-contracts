/**
 * Audio track helpers for playback.
 *
 * @copyright 2026 Joe Huss <detain@interserver.net>
 */
import type { AudioTrack } from './playback';
/**
 * Select the best audio track matching user's preferred languages.
 *
 * Iterates through the user's preferred languages in order and returns the
 * index of the first audio track whose language matches. Language matching
 * is case-insensitive and uses the primary language subtag (e.g., "en-US"
 * matches "en"). Falls back to the first track (index 0) if no match is found.
 *
 * S404: retyped from the `StreamAudioTrack` DB mirror to the playback-info
 * WIRE `AudioTrack` (playback.ts) — the documented input ("tracks from
 * playback-info") is only honest against the wire shape, and the function
 * reads nothing but `language`. No estate consumer passed the DB mirror
 * (grep-verified), so the retype breaks no caller. The `?.` below stays as a
 * runtime guard: `AudioTrack.language` is typed `string` (the server coerces
 * `'und'`), but hand-built JS arrays can still carry a hole.
 *
 * @param tracks - Available audio tracks from playback-info (`audio_tracks[]`)
 * @param preferredLanguages - Ordered array of BCP47 language tags
 *                            (e.g., ['en-US', 'de-DE'])
 * @returns The selected track index, or 0 for first track as fallback
 */
export declare function pickDefaultAudio(tracks: AudioTrack[], preferredLanguages: string[]): number;

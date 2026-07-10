/**
 * Audio track helpers for playback.
 *
 * @copyright 2026 Joe Huss <detain@interserver.net>
 */
import type { StreamAudioTrack } from './AudioTrack';
/**
 * Select the best audio track matching user's preferred languages.
 *
 * Iterates through the user's preferred languages in order and returns the
 * index of the first audio track whose language matches. Language matching
 * is case-insensitive and uses the primary language subtag (e.g., "en-US"
 * matches "en"). Falls back to the first track (index 0) if no match is found.
 *
 * @param tracks - Available audio tracks from playback-info
 * @param preferredLanguages - Ordered array of BCP47 language tags
 *                            (e.g., ['en-US', 'de-DE'])
 * @returns The selected track index, or 0 for first track as fallback
 */
export declare function pickDefaultAudio(tracks: StreamAudioTrack[], preferredLanguages: string[]): number;

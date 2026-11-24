/**
 * Chapter markers and Trickplay sprite metadata.
 *
 * `ChapterTrack` carries the chapter + trickplay data associated with a
 * media item. `TrickplaySprite` describes the pre-generated thumbnail sprite
 * sheet used for scrubbing preview.
 * @copyright 2026 Joe Huss <detain@interserver.net>
 */
import type { Marker } from './Marker.js';
import type { WireKeysExact } from './internal/wireKeys.js';
/**
 * A chapter marker. `index` is the display order (0-based). `startSeconds`
 * and `endSeconds` are floats (e.g. 30.0) denoting the chapter boundaries.
 */
export interface ChapterMarker {
    index: number;
    title: string;
    startSeconds: number;
    endSeconds: number;
}
/**
 * Descriptor for a trickplay sprite sheet — a grid of timestamp thumbnails
 * used to render a visual scrubbing timeline.
 */
export interface TrickplaySprite {
    spritePath: string;
    timelinePath: string;
    /** Width of each thumbnail cell in pixels. */
    cellWidth: number;
    /** Height of each thumbnail cell in pixels. */
    cellHeight: number;
    /** Columns in the grid layout. */
    columns: number;
    /** Rows in the grid layout. */
    rows: number;
}
/**
 * Configuration for skip behavior.
 */
export interface SkipConfig {
    autoSkip: boolean;
    showButtons: boolean;
}
/**
 * The full chapter + trickplay track for a media item.
 */
export interface ChapterTrack {
    mediaItemId: string;
    markers: ChapterMarker[];
    trickplay?: TrickplaySprite;
}
/**
 * A chapter with full metadata including optional thumbnail image.
 * This is the client-facing type for chapter information.
 */
export interface ChapterInfo {
    index: number;
    title: string;
    startSeconds: number;
    endSeconds: number;
    imageUrl?: string;
}
/**
 * Trickplay preview data - client-facing alias for TrickplaySprite.
 */
export interface TrickplayInfo {
    spritePath: string;
    timelinePath: string;
    cellWidth: number;
    cellHeight: number;
    columns: number;
    rows: number;
}
/**
 * Timeline of all markers for a media item.
 * Groups intro, outro, and general markers with skip configuration.
 */
export interface MarkerTimeline {
    markers: Marker[];
    introMarker?: Marker;
    outroMarker?: Marker;
    skipButtonSpec?: SkipConfig;
}
/** Ordered key set of {@link ChapterMarker} (S-contracts-02 / -002). */
export declare const CHAPTER_MARKER_KEYS: readonly ["index", "title", "startSeconds", "endSeconds"];
/** Ordered key set of {@link TrickplaySprite} (S-contracts-02 / -002). */
export declare const TRICKPLAY_SPRITE_KEYS: readonly ["spritePath", "timelinePath", "cellWidth", "cellHeight", "columns", "rows"];
/** Ordered key set of {@link SkipConfig} (S-contracts-02 / -002). */
export declare const SKIP_CONFIG_KEYS: readonly ["autoSkip", "showButtons"];
/** Ordered key set of {@link ChapterTrack} (S-contracts-02 / -002). */
export declare const CHAPTER_TRACK_KEYS: readonly ["mediaItemId", "markers", "trickplay"];
/** Ordered key set of {@link ChapterInfo} (S-contracts-02 / -002). */
export declare const CHAPTER_INFO_KEYS: readonly ["index", "title", "startSeconds", "endSeconds", "imageUrl"];
/** Ordered key set of {@link TrickplayInfo} (S-contracts-02 / -002). */
export declare const TRICKPLAY_INFO_KEYS: readonly ["spritePath", "timelinePath", "cellWidth", "cellHeight", "columns", "rows"];
/** Ordered key set of {@link MarkerTimeline} (S-contracts-02 / -002). */
export declare const MARKER_TIMELINE_KEYS: readonly ["markers", "introMarker", "outroMarker", "skipButtonSpec"];
export type ChapterMarkerKeysTied = WireKeysExact<ChapterMarker, typeof CHAPTER_MARKER_KEYS>;
export type TrickplaySpriteKeysTied = WireKeysExact<TrickplaySprite, typeof TRICKPLAY_SPRITE_KEYS>;
export type SkipConfigKeysTied = WireKeysExact<SkipConfig, typeof SKIP_CONFIG_KEYS>;
export type ChapterTrackKeysTied = WireKeysExact<ChapterTrack, typeof CHAPTER_TRACK_KEYS>;
export type ChapterInfoKeysTied = WireKeysExact<ChapterInfo, typeof CHAPTER_INFO_KEYS>;
export type TrickplayInfoKeysTied = WireKeysExact<TrickplayInfo, typeof TRICKPLAY_INFO_KEYS>;
export type MarkerTimelineKeysTied = WireKeysExact<MarkerTimeline, typeof MARKER_TIMELINE_KEYS>;
/** Every chapter/trickplay tie, aggregated for the runtime legs of the gate. */
export declare const CHAPTER_KEY_TIES: {
    readonly marker: true;
    readonly sprite: true;
    readonly skipConfig: true;
    readonly track: true;
    readonly info: true;
    readonly trickplayInfo: true;
    readonly timeline: true;
};

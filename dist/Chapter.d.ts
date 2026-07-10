/**
 * Chapter markers and Trickplay sprite metadata.
 *
 * `ChapterTrack` carries the chapter + trickplay data associated with a
 * media item. `TrickplaySprite` describes the pre-generated thumbnail sprite
 * sheet used for scrubbing preview.
 * @copyright 2026 Joe Huss <detain@interserver.net>
 */
import type { Marker } from './Marker';
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

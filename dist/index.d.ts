/**
 * @phlix/contracts — framework-agnostic REST/wire DTO types + tiny pure helpers.
 *
 * The single source of truth for the Phlix media/playback/auth/hub/library/
 * event shapes, the estate error-code registry, the server route manifest,
 * and MCP scopes — shared across every Phlix client and both servers. Mirrors
 * the PHP `detain/phlix-shared` package and the server's JSON response shapes.
 * Pure TypeScript: NO Vue / React / axios / runtime framework deps.
 *
 *   import type { MediaItem, PlaybackInfo } from '@phlix/contracts';
 *   import { buildPhlixHeaders, ticksToSeconds, formatRuntime, EVENT } from '@phlix/contracts';
 * @copyright 2026 Joe Huss <detain@interserver.net>
 * @license MIT
 */
export * from './media.js';
export * from './playback.js';
export * from './auth.js';
export * from './hub.js';
export * from './library.js';
export * from './events.js';
export * from './mcp.js';
export * from './errors.js';
export * from './headers.js';
export * from './ticks.js';
export * from './Rating.js';
export * from './Chapter.js';
export * from './Marker.js';
export * from './Audio.js';
export * from './AudioTrack.js';
export * from './SubtitleTrack.js';
export * from './SimilarItem.js';
export * from './Recommendation.js';
export * from './Collection.js';
export * from './AccessSchedule.js';
export * from './ProfileTag.js';
export * from './SyncPlay.js';
export * from './StreamSession.js';
export * from './Music.js';
export * from './routeManifest.js';

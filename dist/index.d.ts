/**
 * @phlix/contracts — framework-agnostic REST/wire DTO types + tiny pure helpers.
 *
 * The single source of truth for the Phlix media/playback/auth/hub/library/
 * event shapes shared across the JS clients (mobile, windows, tizen). Mirrors
 * the PHP `detain/phlix-shared` package and the server's JSON response shapes.
 * Pure TypeScript: NO Vue / React / axios / runtime framework deps.
 *
 *   import type { MediaItem, PlaybackInfo } from '@phlix/contracts';
 *   import { buildPhlixHeaders, ticksToSeconds, formatRuntime, EVENT } from '@phlix/contracts';
 * @copyright 2026 Joe Huss <detain@interserver.net>
 */
export * from './media';
export * from './playback';
export * from './auth';
export * from './hub';
export * from './library';
export * from './events';
export * from './headers';
export * from './ticks';

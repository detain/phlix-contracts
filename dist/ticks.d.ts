/**
 * Tick math helpers.
 *
 * Phlix follows the Plex/Jellyfin convention: time is expressed in "ticks" of
 * 100 nanoseconds, so 1 second = 10,000,000 ticks. The clients already divide
 * by `10000000` (seconds), `600000000` (minutes), and `36000000000` (hours);
 * see mobile `src/utils/formatters.ts` and tizen `app/js/utils/Helpers.js`.
 * These helpers consolidate that math. All functions are pure.
 */
/** Ticks per second (100-ns ticks). */
export declare const TICKS_PER_SECOND = 10000000;
/** Ticks per minute. */
export declare const TICKS_PER_MINUTE = 600000000;
/** Ticks per hour. */
export declare const TICKS_PER_HOUR = 36000000000;
/** Convert ticks to fractional seconds (matches `positionTicks / 10000000`). */
export declare function ticksToSeconds(ticks: number): number;
/**
 * Convert seconds to whole ticks, flooring (matches the clients' integer tick
 * reporting, e.g. tizen `Math.floor(positionSeconds * 10000000)`).
 */
export declare function secondsToTicks(seconds: number): number;
/** Convert ticks to whole minutes, flooring (matches `floor(ticks / 600000000)`). */
export declare function ticksToMinutes(ticks: number): number;
/**
 * Format ticks as `H:MM:SS` (when >= 1 hour) or `M:SS`. Mirrors the clients'
 * `formatTime(seconds)` applied to `ticksToSeconds`, seconds-floored.
 */
export declare function ticksToHms(ticks: number): string;
/**
 * Format ticks as a coarse runtime label. Mirrors the mobile client's
 * `formatRuntime(ticks)` exactly: `"<n> min"` under an hour, else `"<h>h <m>m"`.
 *
 * NOTE — easy to confuse with {@link formatDuration}; they are NOT
 * interchangeable:
 *   - Under an hour: `formatRuntime` emits `"<n> min"` (e.g. `"45 min"`);
 *     `formatDuration` emits `"<m>m"` (e.g. `"45m"`).
 *   - Zero / falsy input: `formatRuntime(0)` returns `"0 min"` (never empty);
 *     `formatDuration(0)` returns `""` (empty string).
 *   - At/over an hour both emit the same `"<h>h <m>m"` form.
 * Use `formatRuntime` for the mobile "45 min" style; use `formatDuration` for
 * the tizen "45m" style that hides zero-length items.
 *
 * @see formatDuration
 */
export declare function formatRuntime(ticks: number): string;
/**
 * Format ticks as a duration label in the tizen `Helpers.formatDuration` style:
 * `"<h>h <m>m"` when >= 1 hour, else `"<m>m"`. Returns "" for falsy input
 * (0/NaN), matching the tizen implementation.
 *
 * NOTE — easy to confuse with {@link formatRuntime}; they are NOT
 * interchangeable:
 *   - Under an hour: `formatDuration` emits `"<m>m"` (e.g. `"45m"`);
 *     `formatRuntime` emits `"<n> min"` (e.g. `"45 min"`).
 *   - Zero / falsy input: `formatDuration(0)` returns `""` (empty string);
 *     `formatRuntime(0)` returns `"0 min"` (never empty).
 *   - At/over an hour both emit the same `"<h>h <m>m"` form.
 * Use `formatDuration` for the tizen "45m" style that hides zero-length items;
 * use `formatRuntime` for the mobile "45 min" style.
 *
 * @see formatRuntime
 */
export declare function formatDuration(ticks: number): string;

/**
 * Tick math helpers.
 *
 * Phlix follows the Plex/Jellyfin convention: time is expressed in "ticks" of
 * 100 nanoseconds, so 1 second = 10,000,000 ticks. The clients already divide
 * by `10000000` (seconds), `600000000` (minutes), and `36000000000` (hours);
 * see mobile `src/utils/formatters.ts` and tizen `app/js/utils/Helpers.js`.
 * These helpers consolidate that math. All functions are pure.
 * @copyright 2026 Joe Huss <detain@interserver.net>
 */

/** Ticks per second (100-ns ticks). */
export const TICKS_PER_SECOND = 10_000_000;
/** Ticks per minute. */
export const TICKS_PER_MINUTE = 600_000_000;
/** Ticks per hour. */
export const TICKS_PER_HOUR = 36_000_000_000;

/** Convert ticks to fractional seconds (matches `positionTicks / 10000000`). */
export function ticksToSeconds(ticks: number): number {
  return ticks / TICKS_PER_SECOND;
}

/**
 * Convert seconds to whole ticks, flooring (matches the clients' integer tick
 * reporting, e.g. tizen `Math.floor(positionSeconds * 10000000)`).
 */
export function secondsToTicks(seconds: number): number {
  return Math.floor(seconds * TICKS_PER_SECOND);
}

/** Convert ticks to whole minutes, flooring (matches `floor(ticks / 600000000)`). */
export function ticksToMinutes(ticks: number): number {
  return Math.floor(ticks / TICKS_PER_MINUTE);
}

/**
 * Format ticks as `H:MM:SS` (when >= 1 hour) or `M:SS`. Mirrors the clients'
 * `formatTime(seconds)` applied to `ticksToSeconds`, seconds-floored.
 */
export function ticksToHms(ticks: number): string {
  // Guard against non-finite (NaN/Infinity) and negative input: such values
  // would otherwise yield "NaN:NaN" / nonsensical output. Clamp to 0 so the
  // zero-fallback ("0:00") is returned. Valid input is unaffected.
  const safeTicks = Number.isFinite(ticks) && ticks > 0 ? ticks : 0;
  const total = Math.floor(ticksToSeconds(safeTicks));
  const hrs = Math.floor(total / 3600);
  const mins = Math.floor((total % 3600) / 60);
  const secs = Math.floor(total % 60);
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

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
export function formatRuntime(ticks: number): string {
  // Guard non-finite / negative input → clamp to 0 so the zero-fallback
  // ("0 min") is returned rather than "NaN min". Valid input is unaffected.
  const safeTicks = Number.isFinite(ticks) && ticks > 0 ? ticks : 0;
  const minutes = ticksToMinutes(safeTicks);
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
}

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
export function formatDuration(ticks: number): string {
  // Falsy (0/NaN) → "" (existing behavior). Also reject non-finite (Infinity)
  // and negative input, which would otherwise produce "NaN..."/nonsensical
  // output, returning the same "" fallback. Valid input is unaffected.
  if (!ticks || !Number.isFinite(ticks) || ticks < 0) {
    return '';
  }
  const hours = Math.floor(ticks / TICKS_PER_HOUR);
  const minutes = Math.floor((ticks % TICKS_PER_HOUR) / TICKS_PER_MINUTE);
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

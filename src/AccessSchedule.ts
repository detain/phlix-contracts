/**
 * Access-schedule wire shapes for time-based profile access control.
 *
 * Mirrors server-side `AccessSchedule` DTOs used to define when a profile
 * is permitted to stream (e.g. parental controls, time-of-day restrictions).
 *
 * @copyright 2026 Joe Huss <detain@interserver.net>
 */

/** Days of the week used in access schedules. */
export type DayOfWeek = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

/**
 * A time window during which a profile's streaming access is active.
 * `daysOfWeek` is an array of day literals (e.g. `['mon','wed','fri']`).
 * `startTime` / `endTime` are "HH:MM:SS" in 24-hour local server time.
 */
export interface AccessSchedule {
  id: number;
  profileId: number;
  name: string;
  /** Start of the window in "HH:MM:SS" (24-hour). */
  startTime: string;
  /** End of the window in "HH:MM:SS" (24-hour). */
  endTime: string;
  /** Ordered list of days this window applies. Empty = never active. */
  daysOfWeek: DayOfWeek[];
  /** Whether this schedule is currently enabled. */
  isActive: boolean;
}

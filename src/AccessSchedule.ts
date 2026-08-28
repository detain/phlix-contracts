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
 * `days_of_week` is an array of day literals (e.g. `['mon','wed','fri']`).
 * `start_time` / `end_time` are "HH:MM:SS" in 24-hour local server time.
 *
 * S234: the keys are the server's snake_case emission
 * (`Phlix\Access\AccessSchedule::toArray()`). The earlier camelCase
 * declaration (`startTime`/`endTime`/`daysOfWeek`/`isActive`) mirrored the
 * mobile/roku create bodies instead of the server, so every create those
 * clients posted 400'd. The server has accepted the camelCase spellings
 * additively since S234 so shipped clients keep working, but the declared
 * shape is the server's: snake_case.
 */
export interface AccessSchedule {
  id: number;
  /**
   * CHAR(36) UUID — `user_profiles.id` on the server. Was wrongly typed
   * `number` (an `(int)` cast of a UUID is 0 or a leading digit-run).
   *
   * NOTE (S234 scope): the interface keeps the historical `profileId` name —
   * the step's fix is the number→string TYPE correction, not a rename. The
   * server's wire emission for this key is `profile_id` (snake_case, per
   * `Phlix\Access\AccessSchedule::toArray()`); a client reading a list
   * response should map `profile_id` here.
   */
  profileId: string;
  name: string;
  /** Start of the window in "HH:MM:SS" (24-hour). */
  start_time: string;
  /** End of the window in "HH:MM:SS" (24-hour). */
  end_time: string;
  /** Ordered list of days this window applies. Empty = never active. */
  days_of_week: DayOfWeek[];
  /** Whether this schedule is currently enabled. */
  is_active: boolean;
}

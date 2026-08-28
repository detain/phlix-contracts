/**
 * Profile-tag wire shapes for content-labelling / filtering.
 *
 * Mirrors server-side `ProfileTag` DTOs used to tag profiles with
 * descriptive labels (e.g. "kids", "work") that drive filtering and
 * content-block / allow-listing decisions.
 *
 * @copyright 2026 Joe Huss <detain@interserver.net>
 */

/**
 * A label applied to a profile, typed as either a block or allow rule.
 * `tag` is an arbitrary string identifier (case-sensitive).
 *
 * S234: the wire key is `tag_type` — the server's snake_case emission
 * (`Phlix\Access\ProfileTag::toArray()`, the DB column name). The earlier
 * camelCase `tagType` declaration mirrored the mobile/roku create bodies
 * instead of the server, so every create those clients posted 400'd
 * (accepted by neither S233 spelling). The server has accepted `tagType`
 * additively since S234 so shipped clients keep working, but the declared
 * shape is the server's: `tag_type`.
 */
export interface ProfileTag {
  id: number;
  /**
   * CHAR(36) UUID — `user_profiles.id` on the server. Was wrongly typed
   * `number` (an `(int)` cast of a UUID is 0 or a leading digit-run).
   */
  profileId: string;
  /** Arbitrary tag string, e.g. "kids" or "restricted". */
  tag: string;
  /** Controls whether this tag blocks or allows matching content. */
  tag_type: 'blocked' | 'allowed';
}
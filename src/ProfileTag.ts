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
 */
export interface ProfileTag {
  id: number;
  profileId: number;
  /** Arbitrary tag string, e.g. "kids" or "restricted". */
  tag: string;
  /** Controls whether this tag blocks or allows matching content. */
  tagType: 'blocked' | 'allowed';
}

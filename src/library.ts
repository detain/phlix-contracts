/**
 * Library query parameters + server settings shapes.
 *
 * `LibraryQuery` mirrors `phlix-shared/schemas/library-query.schema.json` (the
 * canonical `GET /api/v1/media` query shape). `ServerSettings` is a partial,
 * hand-maintained illustration of the admin settings key vocabulary — the
 * authoritative writable allow-list is `phlix-shared/schemas/
 * server-settings.schema.json` plus the `meta` block served live by
 * `GET /api/v1/admin/settings`; see the interface docblock.
 * @copyright 2026 Joe Huss <detain@interserver.net>
 */

import type { ContentRating } from './media';

/** Sort field for the media list. */
export type LibrarySort = 'name' | 'year' | 'rating' | 'date_added' | 'runtime';

/** Sort direction. */
export type SortOrder = 'asc' | 'desc';

/**
 * Query parameters for `GET /api/v1/media`. All optional — omitting a field
 * means "no filter on this dimension". Array filters OR their members.
 *
 * `companies[]` is the clickable-studios filter added server-side (see memory:
 * detail enrichment); it sits alongside the schema's documented dimensions.
 */
export interface LibraryQuery {
  /** Full-text / fuzzy search on the item name. */
  search?: string;
  /** OR-filter on genres. */
  genres?: string[];
  /** Minimum release year (inclusive). */
  yearFrom?: number;
  /** Maximum release year (inclusive). */
  yearTo?: number;
  /** OR-filter on content ratings. */
  ratings?: ContentRating[];
  /** OR-filter on actor name (partial match). */
  actors?: string[];
  /** OR-filter on production company name. */
  companies?: string[];
  /** Sort field. Defaults to "name". */
  sort?: LibrarySort;
  /** Sort direction. Defaults to "asc". */
  order?: SortOrder;
  /** Page size, 1-100. Defaults to 50. */
  limit?: number;
  /** Pagination offset. Defaults to 0. */
  offset?: number;
  /** Scope to a single library by id. */
  libraryId?: string;
  /** Scope to the direct children of one item. Mutually exclusive w/ topLevel. */
  parentId?: string;
  /** Return only top-level items (no parent). Mutually exclusive w/ parentId. */
  topLevel?: boolean;
}

/** Self-service signup mode (server-settings `auth.signup_mode`). */
export type SignupMode = 'open' | 'approval' | 'disabled';

/**
 * Editable server settings exposed by `/api/v1/admin/settings` — a PARTIAL,
 * HAND-MAINTAINED mirror, NOT an allow-list.
 *
 * The single source of truth for the writable admin surface is
 * `phlix-shared/schemas/server-settings.schema.json` (84 properties as of
 * 2026-10-30) plus the runtime `meta` block of
 * `GET /api/v1/admin/settings` — that is what a settings form or gate must
 * read, per the same retirement law already recorded in
 * `phlix-ui/src/types/server-settings.ts`. This interface has NO schema-drift
 * gate and is known to lag: measured at this stamp it lacks 72 schema keys
 * (including the entire F7 `auth.<provider>.enabled` quintet and the
 * rate-limit/webhooks/DLNA families) and still advertises 7 GHOST keys the
 * schema no longer defines (`subtitles.enabled`, `subtitles.burn_in_by_default`,
 * `hwaccel.probe_timeout`, `marker_detection.similarity_threshold`,
 * `marker_detection.intro_max_duration`, `discovery.discovery_port`,
 * `trickplay.interval_seconds`) which the server will 400. Absence here does
 * NOT mean "not writable"; presence does NOT mean "writable". All listed keys
 * are optional — the GET endpoint returns the runtime defaults, which live in
 * server config, not the schema. `index signature` is intentionally NOT added
 * because membership here is illustrative, not current. Deriving this type at
 * build time from a vendored schema (with a `git diff` freshness gate like the
 * registry JSONs get) or retiring the public export entirely is an
 * API-shape/tag-wave decision — this package is pinned by git tag and a
 * type-shape move is breaking for it.
 */
export interface ServerSettings {
  'hwaccel.enabled'?: boolean;
  'hwaccel.prefer_hardware'?: boolean;
  'hwaccel.probe_timeout'?: number;
  'tmdb.api_key'?: string;
  'auth.signup_mode'?: SignupMode;
  'marker_detection.similarity_threshold'?: number;
  'marker_detection.intro_max_duration'?: number;
  'subtitles.enabled'?: boolean;
  'subtitles.default_language'?: string;
  'subtitles.burn_in_by_default'?: boolean;
  'discovery.discovery_port'?: number;
  'trickplay.enabled'?: boolean;
  'trickplay.interval_seconds'?: number;
  'newsletter.enabled'?: boolean;
  'newsletter.send_hour'?: number;
  'port-forward.port_forwarding.upnp_enabled'?: boolean;
  'trakt.client_id'?: string;
  'trakt.client_secret'?: string;
  'trakt.redirect_uri'?: string;
}

/**
 * Library query parameters + server settings shapes.
 *
 * `LibraryQuery` mirrors `phlix-shared/schemas/library-query.schema.json` (the
 * canonical `GET /api/v1/media` query shape). `ServerSettings` mirrors
 * `server-settings.schema.json` — the literal dotted setting keys the admin
 * settings endpoint accepts.
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
 * Editable server settings exposed by `/api/v1/admin/settings`.
 *
 * Keys are the literal dotted setting keys from server-settings.schema.json
 * (the single source of truth for the writable allow-list). All optional — the
 * GET endpoint returns the runtime defaults, which live in server config, not
 * the schema. `index signature` is intentionally NOT added: this is the exact
 * allow-list.
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

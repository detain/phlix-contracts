/**
 * Media item + library REST shapes.
 *
 * Canonical wire field names are snake_case, mirroring the server's JSON
 * responses (`GET /api/v1/media`, `GET /api/v1/libraries/{id}/items`,
 * `GET /api/v1/media/{id}`) and `phlix-shared/schemas/media-item.schema.json`.
 *
 * The mobile and windows clients historically declared divergent shapes
 * (mobile: camelCase-ish snake_case with `run_time_ticks`; windows: PascalCase
 * Jellyfin-style `Id`/`Name`/`Type`). Neither matches the actual Phlix server
 * output. THIS module is the single correct union — it follows the server +
 * JSON Schema verbatim.
 */

/**
 * Media type discriminator. `series`/`season`/`episode` form the TV/anime
 * hierarchy. Matches the `type` enum in media-item.schema.json.
 */
export type MediaType = 'movie' | 'series' | 'season' | 'episode' | 'audio' | 'image';

/**
 * MPAA-style content rating, as returned in `rating` and accepted by the
 * `ratings[]` query filter.
 */
export type ContentRating = 'G' | 'PG' | 'PG-13' | 'R' | 'NC-17' | 'X' | 'UNRATED';

/**
 * A person in the rich `cast[]`/`crew[]` blocks the DETAIL endpoint adds (via
 * `MediaItemShaper::shapeDetail`). Cast entries carry `role`; crew entries
 * carry `job`. Both are optional here so a single interface serves both lists.
 */
export interface MediaPerson {
  name: string;
  /** Character/role name — populated on `cast[]` entries. */
  role?: string;
  /** Job/department — populated on `crew[]` entries. */
  job?: string;
  /** Profile photo URL, or null when unknown. */
  profile_url: string | null;
}

/** A production company in the detail-only `production_companies[]` block. */
export interface ProductionCompany {
  name: string;
  logo_url: string | null;
  origin_country: string | null;
}

/**
 * A media stream row (video/audio/subtitle) from the `media_streams` table,
 * surfaced verbatim on the DETAIL endpoint under `streams[]`.
 */
export interface MediaStream {
  id: string;
  media_item_id: string;
  stream_index: number;
  /** e.g. "video" | "audio" | "subtitle" (server `stream_type` column). */
  stream_type: string;
  codec: string;
  language: string | null;
  bitrate: number | null;
  width: number | null;
  height: number | null;
}

/**
 * A single media item, as returned by the browse/list endpoints.
 *
 * Required fields per the schema are `id`, `name`, `type`. All other base
 * fields are always present on list responses (null when unknown). The
 * detail-only fields (`cast`, `crew`, `production_companies`, `studio`,
 * `streams`, `stream_url`) are optional — they appear ONLY on
 * `GET /api/v1/media/{id}`.
 *
 * Landmine: `actors` is a FLAT string[] and stays flat — the rich objects live
 * on `cast[]`. Do not "upgrade" `actors` to objects.
 */
export interface MediaItem {
  id: string;
  name: string;
  type: MediaType;
  /**
   * Article-stripped sort title ("The Plot" → "Plot"), emitted on EVERY row by
   * `MediaItemShaper::shape()` (`'sort_title' => SortTitle::from($name)`, always
   * a non-null string). Optional here because legacy/older servers may omit it.
   */
  sort_title?: string;
  parent_id?: string | null;
  season_number?: number | null;
  episode_number?: number | null;
  episode_title?: string | null;
  path?: string;
  poster_url?: string | null;
  /**
   * Responsive poster `srcset` (TMDB width variants), emitted on EVERY row by
   * `MediaItemShaper::shape()` (`'poster_srcset' => PosterSrcset::forPosterUrl(...)`).
   * Null for non-TMDB posters → the card falls back to `poster_url`.
   */
  poster_srcset?: string | null;
  genres?: string[];
  year?: number | null;
  rating?: ContentRating | null;
  /** Total runtime in MINUTES from TMDB (NOT ticks). Null when unknown. */
  runtime?: number | null;
  /**
   * Precise probed media length in SECONDS (distinct from `runtime`, which is
   * TMDB minutes). Emitted on EVERY row by `MediaItemShaper::shape()`
   * (`'duration' => (int) metadata.duration_seconds`); null until probed.
   */
  duration?: number | null;
  overview?: string | null;
  /** Flat actor-name list. Stays flat — see `cast` for rich objects. */
  actors?: string[];
  director?: string | null;
  /** ISO 8601 timestamp. */
  created_at?: string | null;
  /** ISO 8601 timestamp. */
  updated_at?: string | null;

  // ---- Detail-only extras (present on GET /api/v1/media/{id}) ----
  /** Rich cast objects (detail only). */
  cast?: MediaPerson[];
  /** Rich crew objects (detail only). */
  crew?: MediaPerson[];
  /** Production companies (detail only). */
  production_companies?: ProductionCompany[];
  /** Studio name (detail only), or null. */
  studio?: string | null;
  /** Media streams (detail only). */
  streams?: MediaStream[];
  /** Signed direct-play URL minted on the detail response. */
  stream_url?: string;
}

/**
 * Per-user playback/watch state for an item. Phlix records resume position in
 * 100-ns ticks (see `ticks.ts`). The mobile client also reads `played` /
 * `is_watched` / `favorite`; this is the consolidated union of those.
 */
export interface UserData {
  /** Resume position in 100-ns ticks. */
  resume_position_ticks?: number;
  /** Last reported playback position in 100-ns ticks. */
  playback_position_ticks?: number;
  /** True when the item is fully watched (>= 90% per Phlix convention). */
  played?: boolean;
  /** Mobile alias for `played`. */
  is_watched?: boolean;
  /** Star rating 0-10, when set. */
  rating?: number;
  favorite?: boolean;
}

/**
 * A library (collection root). The server lists libraries via
 * `GET /api/v1/libraries`.
 */
export interface Library {
  id: string;
  name: string;
  /** Library media kind. Server returns a free string; common values map to
   * MediaType-ish kinds (movie/series/music/photo/audiobook). */
  type: string;
  /**
   * Count of items in the library, when the server includes it. Verified
   * snake_case `item_count` against the server: both
   * `WebPortalRouter::getLibraries()` and `LibraryController::index()` emit
   * `$lib['item_count'] = $this->itemRepository->countByType(...)`. The
   * single-library detail (`GET /api/v1/libraries/{id}`) omits it.
   */
  item_count?: number;
}

/**
 * Paged media list envelope returned by `GET /api/v1/media`.
 *
 * The server's primary list responses are `{ items }`; paged/grid responses
 * add `total` (and may echo `limit`/`offset`). All optional except `items`.
 */
export interface MediaItemsResponse {
  items: MediaItem[];
  total?: number;
  limit?: number;
  offset?: number;
}

/** A single-item detail envelope: `GET /api/v1/media/{id}` returns `{ item }`. */
export interface MediaItemResponse {
  item: MediaItem;
}

/** A `series` top-level item. */
export interface Series extends MediaItem {
  type: 'series';
}

/** A `movie` top-level item. */
export interface Movie extends MediaItem {
  type: 'movie';
}

/** A `season` item (parent = its series). */
export interface Season extends MediaItem {
  type: 'season';
  season_number: number | null;
}

/** An `episode` item (parent = its season, or the series when no season row). */
export interface Episode extends MediaItem {
  type: 'episode';
  season_number: number | null;
  episode_number: number | null;
}

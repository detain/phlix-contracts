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
 * Per-user favorite/rating block attached ONLY to the DETAIL endpoint
 * (`GET /api/v1/media/{id}`) by `WebPortalRouter::resolveUserData()`.
 *
 * The server returns `array{favorite: bool, rating: int|null}|null`: the whole
 * block is `null` when the request is unauthenticated or the favorites store is
 * unwired; otherwise `favorite` defaults to `false` and `rating` to `null` when
 * the user has no row yet. Rating is the user's 0-10 star value (`int|null`).
 *
 * NOTE: this is a DIFFERENT shape from `UserData` (which models resume/watch
 * ticks). Do not conflate the two.
 */
export interface MediaItemUserData {
  favorite: boolean;
  rating: number | null;
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
  /**
   * Per-user favorite/rating block (detail only). `null` when the request is
   * unauthenticated or the favorites store is unwired; absent on list
   * responses. See `MediaItemUserData`.
   */
  user_data?: MediaItemUserData | null;
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
 * Envelope for the library LIST endpoint `GET /api/v1/libraries`.
 *
 * Verified: both `WebPortalRouter::getLibraries()` and
 * `LibraryController::index()` return `json(['libraries' => $libraries])`.
 */
export interface LibrariesResponse {
  libraries: Library[];
}

/**
 * Envelope for the single-library detail endpoint
 * `GET /api/v1/libraries/{id}`.
 *
 * Verified: `WebPortalRouter::getLibrary()` returns
 * `json(['library' => $library])` — the library is WRAPPED (not bare). The
 * single-library payload omits `item_count` (see `Library`).
 */
export interface LibraryResponse {
  library: Library;
}

/**
 * Base media list envelope. The server has TWO list surfaces with different
 * shapes:
 *  - `GET /api/v1/libraries/{id}/items` (`getLibraryItems`) returns
 *    `{ items, limit, offset }` — NO `total`.
 *  - `GET /api/v1/media` (`getMedia`) returns `{ items, total, limit, offset }`.
 *
 * Therefore `total`/`limit`/`offset` are OPTIONAL here (a bare `{ items }`
 * surface must satisfy this type). For the paged grid path that always carries
 * the page counters, prefer the tighter `PagedMediaItemsResponse`.
 */
export interface MediaItemsResponse {
  items: MediaItem[];
  total?: number;
  limit?: number;
  offset?: number;
}

/**
 * The paged grid response from `GET /api/v1/media` (`WebPortalRouter::getMedia()`),
 * which ALWAYS includes `total`/`limit`/`offset` (unlike the bare
 * `getLibraryItems` `{ items, limit, offset }` surface, which omits `total`).
 */
export interface PagedMediaItemsResponse extends MediaItemsResponse {
  total: number;
  limit: number;
  offset: number;
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

/**
 * Discriminated union over the four hierarchy item shapes, narrowable on the
 * `type` discriminant. Consumers can `switch (item.type)` and let the compiler
 * enforce exhaustiveness (a default branch typed `never` flags an unhandled
 * variant).
 *
 * NOTE: this union covers the `movie`/`series`/`season`/`episode` discriminants
 * only; the broader `MediaType` also includes `audio`/`image`, which have no
 * dedicated interface yet (they surface as plain `MediaItem`). All members
 * inherit the base `MediaItem` fields, including the detail-only `user_data`.
 */
export type AnyMediaItem = Movie | Series | Season | Episode;

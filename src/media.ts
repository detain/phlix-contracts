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
 * @copyright 2026 Joe Huss <detain@interserver.net>
 */

/**
 * Media type discriminator — the full `media_items.type` column ENUM, in schema
 * order. Authoritative sources, which this MUST track verbatim: the server
 * migrations (001 → 011 → 034), `MediaItemShaper::VALID_TYPES`, and the `type`
 * enum in `phlix-shared/schemas/media-item.schema.json`.
 *
 * Roughly grouped: video hierarchy (`movie`…`episode`), music hierarchy
 * (`track`…`artist`), and standalone kinds (`video`…`audiobook`).
 *
 * Landmine: the photo kind is named `photo`, NOT `image`. `image` is a
 * scanner-side label keying the media scanner's file-extension set and is never
 * emitted on the wire — this union carried a bogus `image` member for a long
 * time, as did the `phlix-ui` and `phlix-mobile-client` copies (now re-exported
 * from here) and `MediaItemShaper::VALID_TYPES`, where it caused real
 * photo/book/audiobook/track rows to be relabelled `"movie"` in API responses
 * (phlix-server#527). Do not reintroduce it.
 */
export type MediaType =
  | 'movie'
  | 'series'
  | 'season'
  | 'episode'
  | 'track'
  | 'music'
  | 'album'
  | 'artist'
  | 'video'
  | 'audio'
  | 'book'
  | 'photo'
  | 'audiobook';

/**
 * Content rating, as returned in `rating` and accepted by the `ratings[]` query
 * filter. Covers BOTH the MPAA film scale (`G`…`UNRATED`) and the US TV Parental
 * Guidelines scale (`TV-Y`…`TV-MA`), matching the server's `ContentRating`
 * vocabulary and the `rating` enum in media-item.schema.json.
 *
 * Landmine: `NR` (not rated) is normalized to `UNRATED` server-side and is NEVER
 * emitted — do not add it here.
 */
export type ContentRating =
  | 'G'
  | 'PG'
  | 'PG-13'
  | 'R'
  | 'NC-17'
  | 'X'
  | 'UNRATED'
  | 'TV-Y'
  | 'TV-Y7'
  | 'TV-G'
  | 'TV-PG'
  | 'TV-14'
  | 'TV-MA';

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
   * Responsive poster `srcset`, emitted on EVERY row by
   * `MediaItemShaper::shape()`. Its value has one of two shapes depending on
   * whether the server has cached the artwork locally (SV-3.4 `ArtworkStorage`):
   *
   * - **Local artwork srcset (preferred).** Once the poster is downloaded and
   *   resized on match, this carries the server's own sized-variant URLs
   *   pointing at its local artwork route, e.g.
   *   `"/api/v1/artwork/{id}?size=w185 185w, /api/v1/artwork/{id}?size=w342 342w, /api/v1/artwork/{id}?size=w500 500w, /api/v1/artwork/{id}?size=w780 780w"`
   *   (widths 185/342/500/780, plus an `original` full-size variant). These are
   *   relative paths served by the server's `/api/v1/artwork/{id}?size=…` route
   *   with cache headers (SV-2.5), so offline/LAN installs get posters without
   *   reaching TMDB. The srcset entries are unsigned relative paths (the
   *   artwork route accepts session auth or a signed URL); the companion
   *   `poster_url` carries the signed `w500` variant.
   * - **TMDB width-swap fallback.** When no local variant is cached, the shaper
   *   falls back to `PosterSrcset::forPosterUrl($poster_url)` — an
   *   `image.tmdb.org` CDN width srcset — or `null` for non-TMDB posters (the
   *   card then falls back to `poster_url`).
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
  /**
   * Primary trailer URL (detail only), captured at scan time from TMDB `videos`
   * — e.g. a YouTube watch URL. Absent on list responses; null when no trailer
   * is available.
   */
  trailer_url?: string | null;
  /**
   * Provider-native trailer key (detail only) accompanying `trailer_url` — e.g.
   * a YouTube video id — so a client can embed the player directly. Absent on
   * list responses; null when unavailable.
   */
  trailer_key?: string | null;
  /**
   * Hosting site for the trailer (detail only) — e.g. `"YouTube"` — accompanying
   * `trailer_url`/`trailer_key`. Absent on list responses; null when unavailable.
   */
  trailer_site?: string | null;
  /**
   * Transparent title-logo URL (detail only, PNG) for overlaying the title
   * treatment on the hero backdrop. Localized/cached server-side when possible.
   * Absent on list responses; null when unavailable.
   */
  logo_url?: string | null;
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
  /**
   * Episode still-frame URL (detail only, episodes only) — a landscape thumbnail
   * from TMDB. Absent on list responses; null when TMDB has no still for the
   * episode (the client then falls back to the season/series poster).
   */
  still_url?: string | null;
}

/**
 * Any item whose `type` has no dedicated interface — everything outside the
 * `movie`/`series`/`season`/`episode` video hierarchy (`track`, `music`,
 * `album`, `artist`, `video`, `audio`, `book`, `photo`, `audiobook`). These
 * surface as a plain `MediaItem` with the discriminant narrowed.
 *
 * Deriving the type via `Exclude` rather than listing the members keeps this
 * automatically correct when `MediaType` gains a member: the new member lands
 * here until it earns its own interface, so `AnyMediaItem` stays total.
 */
export interface OtherMediaItem extends MediaItem {
  type: Exclude<MediaType, 'movie' | 'series' | 'season' | 'episode'>;
}

/**
 * Discriminated union over every item shape the server can emit, narrowable on
 * the `type` discriminant. `Movie`/`Series`/`Season`/`Episode` carry the
 * hierarchy-specific fields; everything else is an `OtherMediaItem`. All members
 * inherit the base `MediaItem` fields, including the detail-only `user_data`.
 *
 * Exhaustiveness: a `switch (item.type)` that handles the four hierarchy cases
 * does NOT exhaust this union, and a `default` branch typed `never` will not
 * compile — which is the point. Real responses contain `photo`/`book`/`track`
 * rows, so a `never` default was always a lie about the runtime data; it merely
 * failed to say so while `MediaType` was missing those members. Narrow the
 * `default` branch to `OtherMediaItem` and handle it, or switch on the specific
 * discriminants you support and fall through for the rest.
 */
export type AnyMediaItem = Movie | Series | Season | Episode | OtherMediaItem;

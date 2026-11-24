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

import type { WireKeysExact } from './internal/wireKeys.js';

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

/** Ordered key set of {@link MediaPerson} (S-contracts-02 / -002). */
export const MEDIA_PERSON_KEYS = ['name', 'role', 'job', 'profile_url'] as const;

/** A production company in the detail-only `production_companies[]` block. */
export interface ProductionCompany {
  name: string;
  logo_url: string | null;
  origin_country: string | null;
}

/** Ordered key set of {@link ProductionCompany} (S-contracts-02 / -002). */
export const PRODUCTION_COMPANY_KEYS = ['name', 'logo_url', 'origin_country'] as const;

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
 * Ordered key set of {@link MediaStream} (S-contracts-02 / -002) — the
 * `media_streams` row keys the server surfaces verbatim under `streams[]` on
 * the detail endpoint.
 */
export const MEDIA_STREAM_KEYS = [
  'id',
  'media_item_id',
  'stream_index',
  'stream_type',
  'codec',
  'language',
  'bitrate',
  'width',
  'height',
] as const;

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
  /**
   * ADD-ONLY child-list fields. Rows of `GET /api/v1/media?parentId=<id>`
   * (season/episode drill-down lists) carry a `user_data` block of
   * `{watched, position_ticks, duration_ticks, progress_percent}` (and NOT
   * `favorite`/`rating`) so clients can paint watched/progress marks without a
   * per-row detail fetch. `watched` is true for a manual mark OR completed
   * history; the tick fields are 100-ns ticks, 0 when never played;
   * `progress_percent` is 0-100.
   */
  watched?: boolean;
  position_ticks?: number;
  duration_ticks?: number;
  progress_percent?: number;
}

/**
 * The LIST-scope media item — exactly the keys `MediaItemShaper::shape()`
 * emits, in the return-array's order (S-contracts-02 / phlix-contracts-010).
 *
 * Where the flat {@link MediaItem} union grew one optional member per field
 * ever seen on ANY media surface (so a list row type could not promise that a
 * key it always carries was there, and a detail type could not promise the
 * detail-only keys either), this interface is the browse/grid scope: every one
 * of the 27 keys is PRESENT on every `GET /api/v1/media` row,
 * `getLibraryItems` row, continue-watching / most-watched rail element
 * (`MediaItemShaper::shape()` array literal, server
 * `src/Media/Library/MediaItemShaper.php` — the whole ordered set is pinned
 * by `test/mediaShapeParity.test.ts` reading that file at run time). Values
 * stay nullable exactly where the shaper emits nulls.
 *
 * List rows do NOT carry `cast`, `crew`, `tags`, `external_ids`,
 * `backdrop_url_large`, `theme_audio_url`, `trailer_*`, `logo_url`,
 * `streams`, `stream_url`, `user_data`, or `files` — reading those off a
 * summary-typed value is a compile error, which is the point of the split.
 */
export interface MediaItemSummary {
  /** Non-null: the shaper coerces malformed ids to `''`, never null. */
  id: string;
  /** Non-null: coerced (`name ?? id ?? 'Untitled'`) by the shaper. */
  name: string;
  /** Non-null string: `SortTitle::from($name)` on every row. */
  sort_title: string;
  /** Non-null: enum-constrained, malformed types coerce to `'movie'`. */
  type: MediaType;
  /**
   * Basename-reduced path for non-admin views (null when the raw path is
   * missing/empty). shapeDetail() re-expands it to the full path for admins.
   */
  path: string | null;
  /** Scalar-coerced library id, null when absent (server shape():261). */
  library_id: string | null;
  poster_url: string | null;
  poster_srcset: string | null;
  /** Row-sized (w780-class) backdrop for hero strips; null when no art. */
  backdrop_url: string | null;
  backdrop_srcset: string | null;
  /** Flat de-duplicated genre list — never an object map. */
  genres: string[];
  year: number | null;
  /** Normalized, enum-constrained; NR folds to UNRATED upstream. */
  rating: ContentRating | null;
  /** TMDB runtime in MINUTES (not ticks). */
  runtime: number | null;
  /** Probed length in SECONDS; null until transcode probe. */
  duration: number | null;
  overview: string | null;
  /** Flat actor-name list — the rich objects live on `cast[]` (detail). */
  actors: string[];
  director: string | null;
  parent_id: string | null;
  season_number: number | null;
  episode_number: number | null;
  episode_title: string | null;
  /** ISO date string from air_date/first_aired/aired/premiered/release_date. */
  air_date: string | null;
  /** Music metadata; null for non-audio items. */
  artist: string | null;
  album: string | null;
  created_at: string | null;
  updated_at: string | null;
}

/**
 * Ordered 27-key LIST scope of {@link MediaItemSummary} — the exact key order
 * of `MediaItemShaper::shape()`'s return-array literal (server
 * `src/Media/Library/MediaItemShaper.php` :236–:332 at the authority commit
 * `262f01d3`). {@link file://./../../phlix-server/src/Media/Library/MediaItemShaper.php}
 * is the runtime authority: `test/mediaShapeParity.test.ts` parses the shape()
 * body out of that file and asserts this list key-for-key, in order.
 */
export const MEDIA_ITEM_SUMMARY_KEYS = [
  'id',
  'name',
  'sort_title',
  'type',
  'path',
  'library_id',
  'poster_url',
  'poster_srcset',
  'backdrop_url',
  'backdrop_srcset',
  'genres',
  'year',
  'rating',
  'runtime',
  'duration',
  'overview',
  'actors',
  'director',
  'parent_id',
  'season_number',
  'episode_number',
  'episode_title',
  'air_date',
  'artist',
  'album',
  'created_at',
  'updated_at',
] as const;

/**
 * The detail-only fields `MediaItemShaper::shapeDetail()` assigns onto the
 * merged row AFTER spreading `shape()` — in the order the shaper assigns them
 * (server `src/Media/Library/MediaItemShaper.php` :363–:448 at the authority
 * commit `262f01d3`). `backdrop_url`/`backdrop_srcset`/`path` are RE-ASSIGNED
 * (hero budget / full admin path) but do not enter the list as additions —
 * they were already carried by shape().
 */
export const MEDIA_ITEM_DETAIL_ADDITION_KEYS = [
  'streams',
  'cast',
  'crew',
  'tags',
  'production_companies',
  'studio',
  'backdrop_url_large',
  'theme_audio_url',
  'trailer_url',
  'trailer_key',
  'trailer_site',
  'logo_url',
  'external_ids',
] as const;

/**
 * One entry of the admin-gated `files[]` block `shapeDetail()` adds for admin
 * callers (`buildFilesBlock`; keys are its literal).
 */
export interface MediaFileEntry {
  path: string;
  size_bytes: number | null;
  container: string | null;
  codec: string | null;
  resolution: string | null;
}

/** Ordered key set of {@link MediaFileEntry} (S-contracts-02 / -002). */
export const MEDIA_FILE_ENTRY_KEYS = [
  'path',
  'size_bytes',
  'container',
  'codec',
  'resolution',
] as const;

/**
 * A single media item — the FLAT union across every media surface (list rows,
 * child-list rows with `user_data`, detail responses with `cast`/`crew`/
 * `streams`, admin details with `files`). Kept as the wide compat shape:
 * scopes are optional so any real or synthetic row satisfies it.
 *
 * New code that knows which endpoint produced a value should type it with the
 * scoped pair: {@link MediaItemSummary} (browse/grid rows — every key present)
 * and {@link MediaItemDetail} (detail rows), both pinned key-for-key against
 * the server shapers by `test/mediaShapeParity.test.ts`.
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

  // ---- S-contracts-02 (phlix-contracts-010): the ten keys the server always
  // emitted and this union never declared, plus the admin-gated `files`
  // block. Additive only: every member above keeps its name, type and
  // optionality — no rename, no removal (those are compile breaks for
  // consumers per this repo's growth law). ----
  /** Scalar-coerced owning-library id (server shape():261), null when absent. */
  library_id?: string | null;
  /** Row-sized backdrop (list) / hero backdrop (detail); null when no art. */
  backdrop_url?: string | null;
  /** Responsive backdrop srcset candidates; null for non-TMDB backdrops. */
  backdrop_srcset?: string | null;
  /** Episode/series air date (ISO string) from metadata; null when unknown. */
  air_date?: string | null;
  /** Music: track artist; null for non-audio items. */
  artist?: string | null;
  /** Music: album name; null for non-audio items. */
  album?: string | null;
  /** Detail-only tag/keyword list (`shapeDetail()` :374). */
  tags?: string[];
  /**
   * Detail-only curated provider-id map (`shapeDetail()` :448): `{tmdb, imdb,
   * tvdb, anidb, …}` → stringified id. Present on the detail shape (empty map
   * when no ids), never on the list shape.
   */
  external_ids?: Record<string, string>;
  /** Detail-only theme/OP audio URL (`shapeDetail()` :410). */
  theme_audio_url?: string | null;
  /** Detail-only full-resolution (`/original`) backdrop (`shapeDetail()` :408). */
  backdrop_url_large?: string | null;
  /**
   * Admin-only per-file block (`shapeDetail()`'s `$isAdmin` arm). Non-admin
   * responses never carry it.
   */
  files?: MediaFileEntry[];
}

/**
 * Ordered key set of {@link MediaItemUserData} (S-contracts-02 / -002).
 */
export const MEDIA_ITEM_USER_DATA_KEYS = [
  'favorite',
  'rating',
  'watched',
  'position_ticks',
  'duration_ticks',
  'progress_percent',
] as const;

/**
 * The COMPLETE media-item key set — the 27 {@link MEDIA_ITEM_SUMMARY_KEYS}
 * followed by the {@link MEDIA_ITEM_DETAIL_ADDITION_KEYS} plus `files` (the
 * admin-gated `shapeDetail()` block), then the two controller-applied keys.
 * Ties BOTH {@link MediaItem} (flat union) and {@link MediaItemDetail}: same
 * keys, different optionality — that difference is exactly what the scope
 * split buys. Order is pinned by `test/mediaShapeParity.test.ts` (the
 * 27-key prefix against the live server source); membership is tied by
 * `WireKeysExact` at compile time.
 */
export const MEDIA_ITEM_KEYS = [
  ...MEDIA_ITEM_SUMMARY_KEYS,
  ...MEDIA_ITEM_DETAIL_ADDITION_KEYS,
  'files',
  'stream_url',
  'user_data',
] as const;

/**
 * The DETAIL-scope media item — every {@link MediaItemSummary} key plus the
 * fields `shapeDetail()` / the detail controllers add. Required where the
 * detail endpoint always emits the key (`streams`, `cast`, `crew`, `tags`,
 * `production_companies`, `studio`, `backdrop_url_large`, `theme_audio_url`,
 * `trailer_url`, `trailer_key`, `trailer_site`, `logo_url`, `external_ids` —
 * the shaper assigns every one of them on every detail response, some as
 * `null`/empty); optional only where emission is genuinely conditional (the
 * admin-only `files` block, the profile-gated `stream_url` mint, and the
 * portal-only `user_data` block).
 *
 * Key set is exactly {@link MEDIA_ITEM_KEYS}, pinned by
 * `test/mediaShapeParity.test.ts` against the server shapers.
 */
export interface MediaItemDetail extends MediaItemSummary {
  /** Always assigned by `shapeDetail()` (`$merged['streams']`), possibly empty. */
  streams: MediaStream[];
  /** Rich cast objects; empty list when metadata carries none. */
  cast: MediaPerson[];
  /** Rich crew objects; empty list when metadata carries none. */
  crew: MediaPerson[];
  /** Tag/keyword list (`shapeDetail()` :374); empty when none. */
  tags: string[];
  production_companies: ProductionCompany[];
  studio: string | null;
  /** Full-resolution `/original` backdrop (`shapeDetail()` :408). */
  backdrop_url_large: string | null;
  /** Theme/OP audio URL (`shapeDetail()` :410). */
  theme_audio_url: string | null;
  trailer_url: string | null;
  trailer_key: string | null;
  trailer_site: string | null;
  logo_url: string | null;
  /** Curated provider-id map (`shapeDetail()` :448); always present, may be empty. */
  external_ids: Record<string, string>;
  /**
   * Admin-gated per-file block (`buildFilesBlock`). Absent on non-admin
   * responses.
   */
  files?: MediaFileEntry[];
  /** Signed direct-play URL, minted by the controllers after shaping. */
  stream_url?: string;
  /** Portal-only per-user block (`WebPortalRouter::resolveUserData`). */
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

/** Ordered key set of {@link UserData} (S-contracts-02 / -002). */
export const USER_DATA_KEYS = [
  'resume_position_ticks',
  'playback_position_ticks',
  'played',
  'is_watched',
  'rating',
  'favorite',
] as const;

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

/** Ordered key set of {@link Library} (S-contracts-02 / -002). */
export const LIBRARY_KEYS = ['id', 'name', 'type', 'item_count'] as const;

/**
 * Envelope for the library LIST endpoint `GET /api/v1/libraries`.
 *
 * Verified: both `WebPortalRouter::getLibraries()` and
 * `LibraryController::index()` return `json(['libraries' => $libraries])`.
 */
export interface LibrariesResponse {
  libraries: Library[];
}

/** Ordered key set of {@link LibrariesResponse} (S-contracts-02 / -002). */
export const LIBRARIES_RESPONSE_KEYS = ['libraries'] as const;

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

/** Ordered key set of {@link LibraryResponse} (S-contracts-02 / -002). */
export const LIBRARY_RESPONSE_KEYS = ['library'] as const;

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
 * Ordered key set of {@link MediaItemsResponse} — and of
 * {@link PagedMediaItemsResponse}, which narrows the same four keys.
 * (S-contracts-02 / -002.)
 */
export const MEDIA_ITEMS_RESPONSE_KEYS = ['items', 'total', 'limit', 'offset'] as const;

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

/** Ordered key set of {@link MediaItemResponse} (S-contracts-02 / -002). */
export const MEDIA_ITEM_RESPONSE_KEYS = ['item'] as const;

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

// ---------------------------------------------------------------------------
// Compile-time ties (S-contracts-02 / -002).
//
// `WireKeysExact` fails to resolve to `true` (type-level error) when an
// interface and its ordered key-list const drift apart on EITHER side — the
// interface grows a member the const never learned about, or the const names
// a key the interface dropped. The ordered pins of the server source live in
// `test/mediaShapeParity.test.ts`; this block is the type-side of the same
// law. Style mirrors `src/playback.ts` / `src/StreamSession.ts` /
// `src/SyncPlay.ts`: exported `*KeysTied` aliases, `_`-prefixed `= true`
// locals, one aggregated `MEDIA_KEY_TIES` object the suite asserts over.
// ---------------------------------------------------------------------------

export type MediaItemSummaryKeysTied = WireKeysExact<MediaItemSummary, typeof MEDIA_ITEM_SUMMARY_KEYS>;
export type MediaItemKeysTied = WireKeysExact<MediaItem, typeof MEDIA_ITEM_KEYS>;
export type MediaItemDetailKeysTied = WireKeysExact<MediaItemDetail, typeof MEDIA_ITEM_KEYS>;
export type MediaItemUserDataKeysTied = WireKeysExact<MediaItemUserData, typeof MEDIA_ITEM_USER_DATA_KEYS>;
export type MediaPersonKeysTied = WireKeysExact<MediaPerson, typeof MEDIA_PERSON_KEYS>;
export type ProductionCompanyKeysTied = WireKeysExact<ProductionCompany, typeof PRODUCTION_COMPANY_KEYS>;
export type MediaStreamKeysTied = WireKeysExact<MediaStream, typeof MEDIA_STREAM_KEYS>;
export type MediaFileEntryKeysTied = WireKeysExact<MediaFileEntry, typeof MEDIA_FILE_ENTRY_KEYS>;
export type UserDataKeysTied = WireKeysExact<UserData, typeof USER_DATA_KEYS>;
export type LibraryKeysTied = WireKeysExact<Library, typeof LIBRARY_KEYS>;
export type LibrariesResponseKeysTied = WireKeysExact<LibrariesResponse, typeof LIBRARIES_RESPONSE_KEYS>;
export type LibraryResponseKeysTied = WireKeysExact<LibraryResponse, typeof LIBRARY_RESPONSE_KEYS>;
export type MediaItemsResponseKeysTied = WireKeysExact<MediaItemsResponse, typeof MEDIA_ITEMS_RESPONSE_KEYS>;
export type PagedMediaItemsResponseKeysTied = WireKeysExact<PagedMediaItemsResponse, typeof MEDIA_ITEMS_RESPONSE_KEYS>;
export type MediaItemResponseKeysTied = WireKeysExact<MediaItemResponse, typeof MEDIA_ITEM_RESPONSE_KEYS>;

const _mediaItemSummaryKeysTied: MediaItemSummaryKeysTied = true;
const _mediaItemKeysTied: MediaItemKeysTied = true;
const _mediaItemDetailKeysTied: MediaItemDetailKeysTied = true;
const _mediaItemUserDataKeysTied: MediaItemUserDataKeysTied = true;
const _mediaPersonKeysTied: MediaPersonKeysTied = true;
const _productionCompanyKeysTied: ProductionCompanyKeysTied = true;
const _mediaStreamKeysTied: MediaStreamKeysTied = true;
const _mediaFileEntryKeysTied: MediaFileEntryKeysTied = true;
const _userDataKeysTied: UserDataKeysTied = true;
const _libraryKeysTied: LibraryKeysTied = true;
const _librariesResponseKeysTied: LibrariesResponseKeysTied = true;
const _libraryResponseKeysTied: LibraryResponseKeysTied = true;
const _mediaItemsResponseKeysTied: MediaItemsResponseKeysTied = true;
const _pagedMediaItemsResponseKeysTied: PagedMediaItemsResponseKeysTied = true;
const _mediaItemResponseKeysTied: MediaItemResponseKeysTied = true;

/** Every media-family tie, aggregated for the runtime legs of the gate. */
export const MEDIA_KEY_TIES = {
  summary: _mediaItemSummaryKeysTied,
  item: _mediaItemKeysTied,
  detail: _mediaItemDetailKeysTied,
  userData: _mediaItemUserDataKeysTied,
  person: _mediaPersonKeysTied,
  productionCompany: _productionCompanyKeysTied,
  stream: _mediaStreamKeysTied,
  fileEntry: _mediaFileEntryKeysTied,
  resume: _userDataKeysTied,
  library: _libraryKeysTied,
  librariesResponse: _librariesResponseKeysTied,
  libraryResponse: _libraryResponseKeysTied,
  mediaItemsResponse: _mediaItemsResponseKeysTied,
  pagedMediaItemsResponse: _pagedMediaItemsResponseKeysTied,
  mediaItemResponse: _mediaItemResponseKeysTied,
} as const;

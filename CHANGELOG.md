# Changelog

All notable changes to `@phlix/contracts` are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- `media`: new `MediaItemUserData` interface (`{ favorite: boolean; rating:
  number | null }`) plus a `user_data?: MediaItemUserData | null` field on
  `MediaItem`. The detail endpoint (`GET /api/v1/media/{id}`) attaches this
  per-user favorite/rating block via `WebPortalRouter::resolveUserData()`, which
  returns `array{favorite: bool, rating: int|null}|null` (`null` when
  unauthenticated or the favorites store is unwired). Optional + nullable models
  both "absent on list responses" and "null when unauthenticated". This is a
  DIFFERENT shape from the existing `UserData` (resume/watch ticks) and is a
  separate type by design (B2).
- `media`: new `LibrariesResponse` (`{ libraries: Library[] }`) and
  `LibraryResponse` (`{ library: Library }`) envelopes. Verified against the
  server: `WebPortalRouter::getLibraries()` / `LibraryController::index()` emit
  `{ libraries: [...] }`, and `WebPortalRouter::getLibrary()` emits
  `{ library: ... }` (the single library is WRAPPED, not bare) (B3).
- `media`: new `PagedMediaItemsResponse extends MediaItemsResponse` pinning
  `total`/`limit`/`offset` as required, for the `GET /api/v1/media`
  (`getMedia`) grid path which ALWAYS sends them. `MediaItemsResponse` keeps
  those counters optional and its docblock now explains why: the bare
  `GET /api/v1/libraries/{id}/items` (`getLibraryItems`) surface returns
  `{ items, limit, offset }` and OMITS `total`, so making `total` required on
  the base would break that consumer (B6).

### Fixed

- `README`: corrected the Usage example and Conventions note that wrongly
  treated `MediaItem.runtime` as **seconds** (a 60× error). `runtime` is TMDB
  **minutes** (per `MediaItemShaper::shape()` → `(int) metadata.runtime`);
  `duration` is the probed length in **seconds**. The example now prefers
  `item.duration` (seconds) and falls back to `item.runtime * 60` when deriving
  ticks. Docs-only; no code or type change.
- `playback`: corrected the server method name in the two `playback.ts`
  docblocks from `MediaItemController::playbackInfo()` to the real
  `MediaItemController::getPlaybackInfo()` (the shape was already correct).
  Docs-only; no code or type change.

### Changed

- `auth`: `JwtClaims` docblock now carries a prominent SECURITY warning — a
  *decoded* JWT is NOT a *verified* JWT. Never gate access or make
  authorization decisions client-side from decoded claims (`scope` / `sub` /
  `serverId`); treat them as display-only / hints, since only the server can
  verify the signature. Docs-only; no type change.
- `ticks`: `formatRuntime` and `formatDuration` docblocks now cross-reference
  each other (with `@see`), spelling out the differences — `"<n> min"` vs
  `"<m>m"` under an hour, and `"0 min"` vs `""` for zero/falsy input. Docs-only;
  no behavior change.

## [0.1.1] - 2026-06-26

### Added

- `media`: `MediaItem` now declares three fields the server emits on EVERY row
  (verified against `MediaItemShaper::shape()`): `sort_title?: string`
  (article-stripped sort title, `SortTitle::from($name)`),
  `poster_srcset?: string | null` (responsive TMDB poster `srcset`,
  `PosterSrcset::forPosterUrl()`; null for non-TMDB posters), and
  `duration?: number | null` (precise probed media length in SECONDS, distinct
  from `runtime` which is TMDB minutes; null until probed).

### Fixed

- `playback`: `ChapterMarker.title` changed from `title?: string` to
  `title: string | null` — `MediaItemController::getPlaybackInfo()` ALWAYS sets
  the `title` key but its value may be null, so the key is required and the
  value nullable (it was previously typed as an optional/absent key).
- `media`: corrected the `MediaItem.runtime` doc — it is TMDB MINUTES, not
  seconds (the seconds value is the new `duration` field). Confirmed the library
  item-count wire key is snake_case `item_count` (both
  `WebPortalRouter::getLibraries()` and `LibraryController::index()`).

## [0.1.0] - 2026-06-26

### Added

- Initial release: framework-agnostic TypeScript REST/wire DTO types + tiny
  pure helpers for Phlix, mirroring `detain/phlix-shared` and the server's JSON
  response shapes. No runtime framework dependencies.
- `media`: `MediaType`, `ContentRating`, `MediaItem` (full snake_case shape with
  detail-only `cast`/`crew`/`production_companies`/`studio`/`streams`/
  `stream_url`), `MediaPerson`, `ProductionCompany`, `MediaStream`, `UserData`,
  `Library`, `MediaItemsResponse`, `MediaItemResponse`, `Series`, `Movie`,
  `Season`, `Episode`.
- `playback`: `StreamInfo`, `MediaSource`, `SubtitleTrack`, `AudioTrack`,
  `DeviceProfile`, `WindowsDeviceProfile`, `SkipButtonSpec` (+ `SkipMarkers` /
  `PlaybackMarkers` aliases), `TimeMarker`, `ChapterMarker`, `PlaybackInfo`,
  `PlaybackBundle`, `PlaybackInfoResponse`, `PlaybackStartResponse`,
  `PlaybackProgress`, `PlaybackSession`.
- `auth`: `User`, `UserInfo`, `AuthResult`, `ProviderAuthResult`, `Session`,
  `JwtClaims`, and `JWT_ISS` / `JWT_AUD` / `JWT_TYPE` constants.
- `hub`: `HeartbeatDto`, `HeartbeatLibrary`, `ServerInfoDto`, `ClaimRequest`,
  `ClaimResponse`, `SERVER_STATUS` (camelCase payload keys, per the PHP
  `toPayload()`).
- `library`: `LibraryQuery`, `ServerSettings`, `SignupMode`.
- `events`: PSR-14 plugin event payload interfaces, webhook event interfaces,
  and `PLUGIN_EVENT` / `WEBHOOK_EVENT` / `WEBHOOK_EVENT_RESERVED` / `EVENT`
  name constants.
- `headers`: `X_PHLIX_DEVICE_ID` / `X_PHLIX_DEVICE_NAME` / `X_PHLIX_DEVICE_TYPE`
  / `X_PHLIX_SESSION_ID` constants, `DeviceType` union, and the pure
  `buildPhlixHeaders()` helper.
- `ticks`: `TICKS_PER_SECOND` / `_MINUTE` / `_HOUR`, `ticksToSeconds`,
  `secondsToTicks`, `ticksToMinutes`, `ticksToHms`, `formatRuntime`,
  `formatDuration` — all pure, matching the math in mobile `formatters.ts` and
  tizen `Helpers.js`.

[0.1.1]: https://github.com/detain/phlix-contracts/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/detain/phlix-contracts/releases/tag/v0.1.0

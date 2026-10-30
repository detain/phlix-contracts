# @phlix/contracts

[![CI](https://github.com/detain/phlix-contracts/actions/workflows/ci.yml/badge.svg)](https://github.com/detain/phlix-contracts/actions/workflows/ci.yml)
[![Version](https://img.shields.io/github/v/tag/detain/phlix-contracts?label=version&sort=semver)](https://github.com/detain/phlix-contracts/tags)
[![License: MIT](https://img.shields.io/badge/license-MIT-green)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

Framework-agnostic TypeScript REST/wire DTO types **plus** a handful of tiny
pure helpers for Phlix. This is the single source of truth for the
media / playback / auth / hub / library / event shapes, the estate error-code
registry, the server route manifest, and MCP scopes — shared across every
Phlix client and both servers, so they stop redeclaring divergent local types.

- **No runtime framework deps** — no Vue, React, axios, or Pinia. Types + pure
  functions only.
- Mirrors the PHP `detain/phlix-shared` package and the Phlix server's JSON
  response shapes.
- **REST/wire types use the server's `snake_case` field names verbatim.**
- **Hub DTOs use the `camelCase` payload keys** the PHP `toPayload()` emits.

## Install

`@phlix/contracts` is distributed as a **git-tagged dependency** (not published to
npm). Pin an exact tag:

```jsonc
// package.json
{
  "dependencies": {
    "@phlix/contracts": "github:detain/phlix-contracts#v0.5.3"
  }
}
```

```sh
npm install
```

## Usage

```ts
import type {
  MediaItem,
  MediaItemsResponse,
  PlaybackInfo,
  LibraryQuery,
  HeartbeatDto,
  JwtClaims,
} from '@phlix/contracts';

import {
  buildPhlixHeaders,
  ticksToSeconds,
  secondsToTicks,
  formatRuntime,
  TICKS_PER_SECOND,
  EVENT,
  X_PHLIX_DEVICE_ID,
} from '@phlix/contracts';

// The example assumes values a live client already holds: `accessToken` is the
// bearer token from the auth store, `sessionId` identifies the SyncPlay session
// the user joined, and `item` is a `MediaItem` (imported above) from a media
// response.
const headers = buildPhlixHeaders({
  deviceId: 'win-123',
  deviceName: 'Living Room PC',
  deviceType: 'windows',
  token: accessToken,
  sessionId,
});

// `runtime` is in minutes (TMDB); `duration` is probed seconds.
// Prefer the probed seconds field when present:
const runtimeTicks = secondsToTicks(item.duration ?? (item.runtime ?? 0) * 60);
const seconds = ticksToSeconds(runtimeTicks);
const label = formatRuntime(runtimeTicks); // "1h 30m"
```

## Modules

| Module        | Exports |
|---------------|---------|
| `media.ts`    | `MediaType`, `ContentRating`, `MediaItem`, `MediaPerson`, `ProductionCompany`, `MediaStream`, `UserData`, `Library`, `MediaItemsResponse`, `MediaItemResponse`, `Series`, `Movie`, `Season`, `Episode`, `OtherMediaItem`, `AnyMediaItem` |
| `playback.ts` | `StreamProtocol`, `StreamInfo`, `MediaSource`, `CanonicalRenditionId`/`RenditionId`, `AUTO_QUALITY`/`AutoQuality`/`QualitySelection`, `Rendition`, `TranscodeSubtitleTrack`, `TranscodeStartResponse`, `TranscodeStatusResponse`, `pickDefaultRendition`, `SubtitleTrack`, `AudioTrack`, `SUBTITLE_TRACK_KEYS`/`AUDIO_TRACK_KEYS`/`TRACK_KEY_TIES`, `DeviceProfile`, `WindowsDeviceProfile`, `SkipButtonSpec`/`SkipMarkers`/`PlaybackMarkers`, `TimeMarker`, `ChapterMarker`, `PlaybackInfo` (+ optional `quality_ladder`), `PlaybackBundle`, `PlaybackInfoResponse`, `PlaybackStartResponse`, `PlaybackProgress`, `PlaybackSession` |
| `auth.ts`     | `User`, `UserInfo`, `AuthResult`, `ProviderAuthResult`, `Session`, `JwtClaims`, `JWT_ISS`/`JWT_AUD`/`JWT_TYPE` (+ type aliases) |
| `hub.ts`      | `HeartbeatDto`, `HeartbeatLibrary`, `ServerInfoDto`, `ClaimRequest`, `ClaimResponse`, `SERVER_STATUS`/`ServerStatus` |
| `library.ts`  | `LibraryQuery`, `LibrarySort`, `SortOrder`, `ServerSettings`, `SignupMode` |
| `events.ts`   | event payload interfaces + `PLUGIN_EVENT`, `WEBHOOK_EVENT`, `WEBHOOK_EVENT_RESERVED`, `EVENT` |
| `mcp.ts`      | `MCP_SCOPE`, `McpScope`, `MCP_SCOPES`, `MCP_TOKEN_PREFIX` (mirrored to `dist/mcp-scopes.json`) |
| `errors.ts`   | `ERROR_CODE`, `ERROR_CODES`, `ERROR_DOMAINS`, `ErrorCode`, per-domain code lists + unions, `SyncPlayErrorCode`, `LEGACY_SYNCPLAY_ERROR_CODES`, `SYNCPLAY_ERROR_CODE_TWINS` (mirrored to `dist/error-codes.json`) |
| `headers.ts`  | `X_PHLIX_*` header-name constants, `DeviceType`, `buildPhlixHeaders` |
| `ticks.ts`    | `TICKS_PER_SECOND`/`_MINUTE`/`_HOUR`, `ticksToSeconds`, `secondsToTicks`, `ticksToMinutes`, `ticksToHms`, `formatRuntime`, `formatDuration` |
| `Rating.ts`   | `Rating`, `MediaRatings`, `RatingValue`, `RatingSortKey`, `MinRatingFilter`, `MaxRatingFilter`, `SmartRuleField`, `MediaItemRatingSource`, `pickDisplayRating`, `ManualMatchOverride` |
| `Chapter.ts`  | `ChapterMarker`, `ChapterTrack`, `ChapterInfo`, `TrickplaySprite`, `TrickplayInfo`, `SkipConfig`, `MarkerTimeline` |
| `Marker.ts`   | `MarkerType`, `Marker`, `PlayerPrefs` |
| `Audio.ts`    | `pickDefaultAudio` (takes the wire `AudioTrack` from `playback.ts`) |
| `AudioTrack.ts` / `SubtitleTrack.ts` | `StreamAudioTrack`, `StreamSubtitleTrack` (DB-row mirrors, not the playback-info wire) |
| `SimilarItem.ts` | `SimilarItem` |
| `Recommendation.ts` | `UserRecommendation`, `RecommendationList` |
| `Collection.ts` | `CollectionBoxSet`, `CollectionMember` |
| `AccessSchedule.ts` | `DayOfWeek`, `AccessSchedule` |
| `ProfileTag.ts` | `ProfileTag` |
| `StreamSession.ts` | `ProfileStreamLimit`, `StreamType`, `ActiveStream` |
| `Music.ts`    | `MusicArtist`, `MusicAlbum`, `MusicTrack`, `AudioPreferences` |
| `SyncPlay.ts` | `SyncPlayRole`, `SyncPlayPermission`, `SyncPlayMember`/`SyncPlayMembersDict`, `SyncPlayQueueItem`, `SyncPlayGroup` (`SyncPlayRoom` is a deprecated alias), `SyncPlayGroupListItem`, the REST envelopes (`SyncPlayListGroupsResponse`, `SyncPlayCreateGroupResponse`, `SyncPlayGetGroupResponse`, `SyncPlayJoinGroupResponse`, `SyncPlayLeaveGroupResponse`, `SyncPlayErrorResponse`), `SYNC_PLAY_*_KEYS`, `SYNC_PLAY_KEY_TIES` |
| `routeManifest.generated.ts` | `SERVER_ROUTE_MANIFEST`, `SERVER_ROUTE_MANIFEST_PROVENANCE` (generated — see `scripts/generate-server-route-manifest.mjs`) |

## Conventions

- Ticks are 100-nanosecond units (Plex/Jellyfin convention):
  `1 second = 10,000,000 ticks`. `runtime` on `MediaItem` is in **minutes**
  (TMDB), `duration` is the probed length in **seconds** — neither is ticks;
  playback positions are in ticks.
- `MediaType` mirrors the full `media_items.type` column ENUM (13 members, in
  schema order) and must track the server migrations,
  `MediaItemShaper::VALID_TYPES`, and `media-item.schema.json` verbatim. The
  photo kind is `photo`, never `image` — `image` is a scanner-side label that
  never reaches the wire.
- `AnyMediaItem` is total: `Movie`/`Series`/`Season`/`Episode` plus the
  `OtherMediaItem` catch-all (derived with `Exclude`), so a `switch (item.type)`
  `default` branch narrows to `OtherMediaItem` rather than `never`.
- `MediaItem.actors` is a flat `string[]` and stays flat. The rich cast objects
  live on the detail-only `cast[]`.
- Detail-only fields (`cast`, `crew`, `production_companies`, `studio`,
  `streams`, `stream_url`) appear only on `GET /api/v1/media/{id}`.
- The stable machine error code on the wire is the SSOT for *what went wrong*
  (`errors.ts`, mirrored to `dist/error-codes.json`): clients localize by code,
  the server's English `message`/`error` text is a debug fallback, and there is
  no server-side i18n or protocol locale negotiation. Wire values are never
  renamed lightly — a rename is a wire break.
- **Break-on-upgrade is the contract for exhaustive error-code consumers**:
  minting codes is additive and lands as a minor bump, but a consumer typed
  `Record<ErrorCode, …>` (or over any per-domain `…ErrorCode` union) must gain
  a row for every newly minted code — expect a red type-check on the upgrade
  that adds registry rows; that is by design, it is how a new wire code cannot
  silently slip past a handler. A consumer that must not break on upgrade pins
  `Partial<…ErrorCode, …>` plus a default fallback instead. Release entries
  that move registry bytes carry this standing line.
- **Emitted-bundle syntax ceiling**: `vite.config.ts` pins
  `build.target: 'es2019'`, so `dist/phlix-contracts.js` and
  `dist/phlix-contracts.umd.cjs` never exceed ES2019 syntax — TV webview
  consumers may load the committed `dist/` bundles directly.
- `src/routeManifest.generated.ts`, `dist/mcp-scopes.json`,
  `dist/error-codes.json` and
  `dist/server-route-manifest.json` are generated — regenerate them, never
  hand-edit. Wire shapes with an exported key-list const (`AUDIO_TRACK_KEYS`,
  `SUBTITLE_TRACK_KEYS`, `SYNC_PLAY_*_KEYS`) are gated against the captured
  server fixtures in `test/fixtures/`.

## Development

```bash
npm install
npm run lint        # eslint (no-explicit-any)
npm run typecheck   # tsc --noEmit (strict)
npm run build       # typecheck + vite lib (ES+CJS) + d.ts + dist/mcp-scopes.json + dist/server-route-manifest.json + dist/error-codes.json
npm run test:run    # vitest run
npm run test:run -- --coverage   # + v8 coverage; writes ./coverage/lcov.info (CI uploads it to Codacy)
npm run verify:cites  # dev-side cite tripwire over src/errors.ts file:line
                      # cites (needs sibling phlix-hub/phlix-server checkouts,
                      # or PHLIX_CONTRACTS_HUB_REPO / PHLIX_CONTRACTS_SRV_REPO;
                      # deliberately NOT in CI — private siblings + heuristics)

# regenerate src/routeManifest.generated.ts from a phlix-server checkout
node scripts/generate-server-route-manifest.mjs <phlix-server-checkout>
```

Building this package (not consuming it) needs the CI toolchain: Node 24, per
`.github/workflows/ci.yml`. The `engines.node >=18` field describes the
CONSUMABLE `dist/`, not the vite-8 build itself.

### Reading conventions

Notation the README, source docblocks, and CHANGELOG use throughout:

- **`(+N)`** — in an emit-site cite (e.g. ``srv AuthMiddleware.php:62 (+24 controller/helper sites)``),
  "N further emit sites are not enumerated"; the full set lives in the server source.
- **`#NNN`** — a GitHub PR/issue number in the repo the surrounding prose names.
- **`SNNN`** — an estate audit-programme ticket (S280 = the route-manifest generation
  programme; S249 = the MCP-scope census this package also vendors).
- **`W1`/`W1b`/`W2`/`W3`/`W5`** — the numbered server/hub emit-wave lanes that promoted
  wire literals onto the dotted `code` channel (each tag names the lane its codes landed in).
- **`tripwire`** — `npm run verify:cites` (`scripts/check-error-cites.mjs`), which
  token-verifies every SRV-HTTP/HUB cite against the sibling working trees.
- **`mint`** — to coin a new `ErrorCode` registry entry; the registry is frozen outside
  deliberate mint commits.
- **`carrier`** — an endpoint that relays another service's error verbatim instead of
  owning its own emit site.
- **`dual placement`** — a transitional server response that sets the dotted code on
  `code` while the legacy literal rides the `error` text field.
- **`stamp`** — the currency annotation (a date plus repo/sha) naming what a verification
  pass last checked against.

## License

MIT

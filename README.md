# @phlix/contracts

[![CI](https://github.com/detain/phlix-contracts/actions/workflows/ci.yml/badge.svg)](https://github.com/detain/phlix-contracts/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/detain/phlix-contracts/graph/badge.svg)](https://codecov.io/gh/detain/phlix-contracts)
[![Version](https://img.shields.io/github/v/tag/detain/phlix-contracts?label=version&sort=semver)](https://github.com/detain/phlix-contracts/tags)
[![License: MIT](https://img.shields.io/badge/license-MIT-green)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

Framework-agnostic TypeScript REST/wire DTO types **plus** a handful of tiny
pure helpers for Phlix. This is the single source of truth for the
media / playback / auth / hub / library / event shapes that the JS clients
(mobile, windows, tizen) consume, so they stop redeclaring divergent local
types.

- **No runtime framework deps** — no Vue, React, axios, or Pinia. Types + pure
  functions only.
- Mirrors the PHP `detain/phlix-shared` package and the Phlix server's JSON
  response shapes.
- **REST/wire types use the server's `snake_case` field names verbatim.**
- **Hub DTOs use the `camelCase` payload keys** the PHP `toPayload()` emits.

## Install

```bash
npm install @phlix/contracts
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
| `SyncPlay.ts` | `SyncPlayRole`, `SyncPlayPermission`, `SyncPlayMember`/`SyncPlayMembersDict`, `SyncPlayQueueItem`, `SyncPlayGroup`/`SyncPlayRoom`, `SyncPlayGroupListItem`, the REST envelopes (`SyncPlayListGroupsResponse`, `SyncPlayCreateGroupResponse`, `SyncPlayGetGroupResponse`, `SyncPlayJoinGroupResponse`, `SyncPlayLeaveGroupResponse`, `SyncPlayErrorResponse`), `SYNC_PLAY_*_KEYS`, `SYNC_PLAY_KEY_TIES` |
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
- `src/routeManifest.generated.ts`, `dist/mcp-scopes.json` and
  `dist/server-route-manifest.json` are generated — regenerate them, never
  hand-edit. Wire shapes with an exported key-list const (`AUDIO_TRACK_KEYS`,
  `SUBTITLE_TRACK_KEYS`, `SYNC_PLAY_*_KEYS`) are gated against the captured
  server fixtures in `test/fixtures/`.

## Development

```bash
npm install
npm run lint        # eslint (no-explicit-any)
npm run typecheck   # tsc --noEmit (strict)
npm run build       # typecheck + vite lib (ES+CJS) + d.ts + dist/mcp-scopes.json + dist/server-route-manifest.json
npm run test:run    # vitest run
npm run test:run -- --coverage   # + v8 coverage; writes ./coverage/lcov.info (CI uploads it to Codacy)

# regenerate src/routeManifest.generated.ts from a phlix-server checkout
node scripts/generate-server-route-manifest.mjs <phlix-server-checkout>
```

## License

MIT

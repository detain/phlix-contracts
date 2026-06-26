# @phlix/contracts

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

// `runtime` is in seconds (server schema); convert when you need ticks:
const runtimeTicks = secondsToTicks(item.runtime ?? 0);
const seconds = ticksToSeconds(runtimeTicks);
const label = formatRuntime(runtimeTicks); // "1h 30m"
```

## Modules

| Module        | Exports |
|---------------|---------|
| `media.ts`    | `MediaType`, `ContentRating`, `MediaItem`, `MediaPerson`, `ProductionCompany`, `MediaStream`, `UserData`, `Library`, `MediaItemsResponse`, `MediaItemResponse`, `Series`, `Movie`, `Season`, `Episode` |
| `playback.ts` | `StreamProtocol`, `StreamInfo`, `MediaSource`, `SubtitleTrack`, `AudioTrack`, `DeviceProfile`, `WindowsDeviceProfile`, `SkipButtonSpec`/`SkipMarkers`/`PlaybackMarkers`, `TimeMarker`, `ChapterMarker`, `PlaybackInfo`, `PlaybackBundle`, `PlaybackInfoResponse`, `PlaybackStartResponse`, `PlaybackProgress`, `PlaybackSession` |
| `auth.ts`     | `User`, `UserInfo`, `AuthResult`, `ProviderAuthResult`, `Session`, `JwtClaims`, `JWT_ISS`/`JWT_AUD`/`JWT_TYPE` (+ type aliases) |
| `hub.ts`      | `HeartbeatDto`, `HeartbeatLibrary`, `ServerInfoDto`, `ClaimRequest`, `ClaimResponse`, `SERVER_STATUS`/`ServerStatus` |
| `library.ts`  | `LibraryQuery`, `LibrarySort`, `SortOrder`, `ServerSettings`, `SignupMode` |
| `events.ts`   | event payload interfaces + `PLUGIN_EVENT`, `WEBHOOK_EVENT`, `WEBHOOK_EVENT_RESERVED`, `EVENT` |
| `headers.ts`  | `X_PHLIX_*` header-name constants, `DeviceType`, `buildPhlixHeaders` |
| `ticks.ts`    | `TICKS_PER_SECOND`/`_MINUTE`/`_HOUR`, `ticksToSeconds`, `secondsToTicks`, `ticksToMinutes`, `ticksToHms`, `formatRuntime`, `formatDuration` |

## Conventions

- Ticks are 100-nanosecond units (Plex/Jellyfin convention):
  `1 second = 10,000,000 ticks`. `runtime` on `MediaItem` is in **seconds**,
  not ticks (per the server's media-item schema); playback positions are in
  ticks.
- `MediaItem.actors` is a flat `string[]` and stays flat. The rich cast objects
  live on the detail-only `cast[]`.
- Detail-only fields (`cast`, `crew`, `production_companies`, `studio`,
  `streams`, `stream_url`) appear only on `GET /api/v1/media/{id}`.

## Development

```bash
npm install
npm run lint        # eslint (no-explicit-any)
npm run typecheck   # tsc --noEmit (strict)
npm run build       # typecheck + vite lib (ES+CJS) + d.ts emit
npm run test:run    # vitest run
```

## License

MIT

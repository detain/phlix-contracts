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
- **REST/wire response types use the server's `snake_case` field names
  verbatim.** Two deliberate `camelCase` exceptions: `LibraryQuery`'s query
  params (`yearFrom`, `yearTo`, `libraryId`, `parentId`, `topLevel`) follow
  `library-query.schema.json`, and `JwtClaims.serverId` follows the PHP
  `JwtClaims::toPayload()` claim key.
- **Hub DTOs use the `camelCase` payload keys** the PHP `toPayload()` emits.

## Install

`@phlix/contracts` is distributed as a **git-tagged dependency** (not published to
npm). Pin an exact tag — the current release at this writing (the
[tags page](https://github.com/detain/phlix-contracts/tags) is the authority
for the newest one):

```jsonc
// package.json
{
  "dependencies": {
    "@phlix/contracts": "github:detain/phlix-contracts#v0.5.7"
  }
}
```

```sh
npm install
```

Consumers pin the tag, never a branch or a bare commit sha — the hub S181
pin-skew gate rejects non-tag forms estate-wide. When a new tag is cut, the
rotation checklist (bump every consumer pin and carry its lockwalk/pin tests)
lives in `CONTRIBUTING.md`.

### Consuming the registries

The three machine-readable registries ship inside the tagged tarball as
prebuilt `dist/` artifacts — **reading them costs no build toolchain** (only
building this package does; see Development). The exported subpaths are
`./dist/error-codes.json`, `./dist/mcp-scopes.json`, and
`./dist/server-route-manifest.json`:

```ts
// ESM — JSON module import attribute (Node >=20.10, modern bundlers)
import errorCodes from '@phlix/contracts/dist/error-codes.json' with { type: 'json' };
```

```js
// CommonJS — plain require works straight from the tarball
const errorCodes = require('@phlix/contracts/dist/error-codes.json');
```

- **TypeScript consumers** usually skip the JSON subpaths entirely: the same
  data is typed at the root export (`ERROR_CODES`, per-domain unions, and
  `SERVER_ROUTE_MANIFEST` from `routeManifest.generated.ts`).
- **PHP-side vendoring idiom** (as phlix-server and phlix-hub do): copy the
  registry JSON into the repo's contract-test fixture path and keep that
  repo's `ErrorCodesContractTest` byte-pin green — the pin test is the
  rotation authority, never a silent overwrite of the vendored copy.

## Usage

```ts
import type { MediaItem } from '@phlix/contracts';

import {
  buildPhlixHeaders,
  ticksToSeconds,
  secondsToTicks,
  formatRuntime,
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
| `media.ts`    | `MediaType`, `ContentRating`, `MediaItem`, `MediaPerson`, `ProductionCompany`, `MediaStream`, `MediaItemUserData`, `UserData`, `Library`, `LibrariesResponse`, `LibraryResponse`, `MediaItemsResponse`, `PagedMediaItemsResponse`, `MediaItemResponse`, `Series`, `Movie`, `Season`, `Episode`, `OtherMediaItem`, `AnyMediaItem` |
| `playback.ts` | `StreamProtocol`, `StreamInfo`, `MediaSource`, `CanonicalRenditionId`/`RenditionId`, `AUTO_QUALITY`/`AutoQuality`/`QualitySelection`, `Rendition`, `TranscodeSubtitleTrack`, `TranscodeStartResponse`, `TranscodeStatusResponse`, `pickDefaultRendition`, `SubtitleTrack`, `AudioTrack`, `SUBTITLE_TRACK_KEYS`/`AUDIO_TRACK_KEYS`/`TRACK_KEY_TIES`, `DeviceProfile`, `WindowsDeviceProfile`, `SkipButtonSpec`/`SkipMarkers`/`PlaybackMarkers`, `TimeMarker`, `PlaybackInfo` (+ optional `quality_ladder`), `PlaybackBundle`, `PlaybackInfoResponse`, `PlaybackStartResponse`, `PlaybackProgress`, `PlaybackSession` |
| `auth.ts`     | `User`, `UserInfo`, `AuthResult`, `ProviderAuthResult`, `Session`, `JwtClaims`, `JWT_ISS`/`JWT_AUD`/`JWT_TYPE`, `COOKIE_MODE` (+ type aliases) — token custody modes (COOKIE-DESIGN.md §2.1: `cookie` = browser class, `bearer` = device class + http-LAN fallback) |
| `hub.ts`      | `HeartbeatDto`, `HeartbeatLibrary`, `ServerInfoDto`, `ClaimRequest`, `ClaimResponse`, `SERVER_STATUS`/`ServerStatus` |
| `library.ts`  | `LibraryQuery`, `LibrarySort`, `SortOrder`, `ServerSettings`, `SignupMode` |
| `events.ts`   | event payload interfaces + `PLUGIN_EVENT`, `WEBHOOK_EVENT`, `WEBHOOK_EVENT_RESERVED`, `EVENT` |
| `mcp.ts`      | `MCP_SCOPE`, `McpScope`, `MCP_SCOPES`, `MCP_TOKEN_PREFIX` (mirrored to `dist/mcp-scopes.json`) |
| `errors.ts`   | `ERROR_CODE`, `ERROR_CODES`, `ERROR_DOMAINS`, `ErrorCode`, per-domain code lists + unions, `SyncPlayErrorCode`, `LEGACY_SYNCPLAY_ERROR_CODES`, `SYNCPLAY_ERROR_CODE_TWINS` (mirrored to `dist/error-codes.json`) |
| `headers.ts`  | `X_PHLIX_*` header-name constants, `DeviceType`, `buildPhlixHeaders` (its `X-Phlix-Device-Type` header is the server's cookie opt-out signal — COOKIE-DESIGN.md §2.1) |
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

Registry provenance, deliberately:

- `dist/mcp-scopes.json` is emitted from `src/mcp.ts`, `dist/error-codes.json`
  from `src/errors.ts`, and `dist/server-route-manifest.json` from
  `src/routeManifest.generated.ts` — all three regenerate inside `npm run build`
  and are byte-exact-gated in CI; nothing under `dist/` is ever hand-edited.
- `auth.ts`, `media.ts`, and `library.ts` mirror the SERVER wire;
  `library.ts`'s `ServerSettings` carries the server's dotted
  `server_settings` keys (`hwaccel.*`, `tmdb.api_key`, `auth.signup_mode`, …),
  not the hub's settings schema — that lives in `detain/phlix-shared`.
- `hub.ts` is the HUB portal's own DTO shape only; the server-relay proxy
  envelope is deliberately not part of this package.

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
  minting codes is additive on the wire and lands as a **last-position
  (patch-numbered) bump** per this package's own precedent — `v0.5.1` carried
  +55 codes and `v0.5.3` carried +2, both patch-numbered — but the number
  understates it: every mint grows the exported unions, so a consumer typed
  `Record<ErrorCode, …>` (or over any per-domain `…ErrorCode` union) must gain
  a row for every newly minted code — expect a red type-check on the upgrade
  that adds registry rows; that is by design, it is how a new wire code cannot
  silently slip past a handler. A consumer that must not break on upgrade pins
  `Partial<Record<…ErrorCode, …>>` plus a default fallback instead. Release
  entries that move registry bytes carry this standing line.
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
                      # cites (needs sibling phlix-hub/phlix-server checkouts;
                      # --hub/--srv set their paths, or env
                      # PHLIX_CONTRACTS_HUB_REPO / PHLIX_CONTRACTS_SRV_REPO
                      # override the ../ defaults; --window N / --json tweak
                      # the sweep; deliberately NOT in CI — private siblings +
                      # heuristics)

# regenerate the server-verified wire fixtures — server checkout is REQUIRED
# as argv 1 (never defaulted), regenerate ONLY against the provenance
# serverSha each fixture records, then re-run the parity suites:
php scripts/dump-server-track-vectors.php /path/to/phlix-server \
  > test/fixtures/stream-track-vectors.json          # pure array IO: no DB
php scripts/dump-server-syncplay-vectors.php /path/to/phlix-server \
  > test/fixtures/syncplay-envelope-vectors.json     # needs a THROWAWAY MySQL:
  # PHLIX_VEC_MYSQL_HOST / PHLIX_VEC_MYSQL_PORT / PHLIX_VEC_MYSQL_USER /
  # PHLIX_VEC_MYSQL_PASSWORD env — never point it at estate data

# regenerate src/routeManifest.generated.ts from a phlix-server checkout
node scripts/generate-server-route-manifest.mjs <phlix-server-checkout>
```

Building this package (not consuming it) needs the CI toolchain: Node 24, per
`.github/workflows/ci.yml` — which also holds `dist/` byte-fresh: CI re-runs
`npm run build` and fails on any `git diff` under `dist/`, so the regenerated
`dist/` commits in the same change as its source. The `engines.node >=18`
field describes the CONSUMABLE `dist/`, not the vite-8 build itself.

### Reading conventions

Notation the README, source docblocks, and CHANGELOG use throughout:

- **`(+N)`** — in an emit-site cite (e.g. ``srv AuthMiddleware.php:62 (+24 controller/helper sites)``),
  "N further emit sites are not enumerated"; the full set lives in the server source.
- **`#NNN`** — a GitHub PR/issue number in the repo the surrounding prose names.
- **`SNNN`** — an estate audit-programme ticket (S280 = the route-manifest generation
  programme; S249 = the MCP-scope census this package also vendors).
- **`W1`/`W1b`/`W2`/`W3`/`W5`** — the numbered server/hub emit-wave lanes that promoted
  wire literals onto the dotted `code` channel (each tag names the lane its codes landed in).
  The `W`-prefix is shared vocabulary: the settings-programme lanes number their own
  sequence the same way, so a lone `W4` in this repo's CHANGELOG-era prose names the
  server settings wave 4 (a header-file lane), never an emit wave.
- **`tripwire`** — `npm run verify:cites` (`scripts/check-error-cites.mjs`), which
  token-verifies every `hub`/`srv`-prefixed `File.php:NN` cite in `src/errors.ts`
  against the sibling working trees.
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

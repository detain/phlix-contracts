# Changelog
<!-- markdownlint-disable MD024 -->

All notable changes to `@phlix/contracts` are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

> **⚠ Tag-order note — `v0.3.13` and `v0.4.1` are the same commit.** Both tags
> point at `8b355ce`. `v0.3.13` was published first (2026-08-04) but numbers
> *below* `v0.4.0` (published 2026-08-02), whose entire content it contains, so
> the same commit was re-published unchanged as `v0.4.1` (2026-08-05). Both tags
> are live on the remote and **must not be deleted, moved or re-pointed** — the
> clients pin this package by git tag (`github:detain/phlix-contracts#<tag>`),
> so retagging breaks their installs and lockfiles. The sections below are
> ordered by **publication date**, which is why the version numbers are not
> monotonic between `0.4.1` and `0.4.0`. Details in the `0.3.13` section below.

## [Unreleased]

### Changed — W22: manifest provenance re-pin (no route change)

- Regenerated `src/routeManifest.generated.ts` + `dist/server-route-manifest.json`
  against server master `01340633` (one CI-only commit above the previous
  provenance `8f72faec`). All 400 tuples are byte-identical; only provenance
  (serverSha + generatedAt) moves. `test/routeManifest.test.ts` sha pins follow.

### Added — S280: the canonical server route manifest export

- `scripts/generate-server-route-manifest.mjs` derives the UNION of the two
  phlix-server `ROUTE_MANIFEST` constants (`Application` 364 + `WebPortal` 47,
  11 shared) — **400 `[method, pathTemplate]` tuples at server commit
  `8f72faec`** — into the checked-in `src/routeManifest.generated.ts`
  (`SERVER_ROUTE_MANIFEST`, `SERVER_ROUTE_MANIFEST_PROVENANCE`). The manifest
  is derived from the SERVER, never from any client it checks. Generalises the
  phlix-ui s280ui prototype (`phlix-ui/scripts/generate-server-route-manifest.mjs`).
- `scripts/emit-server-route-manifest.mjs` (wired into `npm run build`) emits
  `dist/server-route-manifest.json`, the JSON projection non-TS clients vendor
  — same staleness-test pattern as `dist/mcp-scopes.json` (S249).
- `test/routeManifest.test.ts` pins the count, provenance sha, structural
  invariants, the known-unserved syncplay/rooms + notifications negatives, the
  hub-addressed negatives, and TS↔JSON agreement.
- **No tag in this wave** (coordinator decision): clients vendor the JSON copy
  from master; their manifest-vending and gates ship in the same wave
  (mobile, roku); tizen/console gates + hub manifest gate follow in W19.

## [0.4.6] - 2026-09-01

SyncPlay type-truth release (S415, part of the S279 collapse). **Breaking for
type consumers**: `SyncPlayGroup` changed vocabulary to the server's real
group-state emission and seven never-emitted types were retired. The only
estate consumer of any of these names is phlix-tizen-client's sync-play store
(enumerated estate-wide at the tips — ui/mobile/roku/console import none);
it retypes in the same wave, pinned to this tag. `dist/` is rebuilt and
committed; `dist/server-route-manifest.json` is byte-identical to 0.4.5 — the
route-manifest generator did NOT run (its regen remains its own wave).

### Fixed (S415 — SyncPlay.ts := the honest wire, ruling at server `01340633`)

- `SyncPlayGroup` now declares EXACTLY the twelve keys
  `GroupState::getState()` emits, in emission order: `group_id, group_name,
  member_count, members (DICTIONARY keyed by member id — not an array),
  host_id (nullable), current_media_id (nullable), current_media_duration,
  playback_position, playback_state, queue, created_at, last_activity_at`.
  The pre-fix type extended the LIST-ROW interface and claimed
  `id/name/has_password/current_media/is_playing` + array members on the full
  state — keys the server emits on list rows only (and `has_password` exists
  NOWHERE on the state rail). `members` values are `{id, name, is_host,
  joined_at}`; queue entries are `{media_id, media_info, added_at, added_by}`
  (new `SyncPlayQueueItem`).
- `SyncPlayGroupListItem` keeps the list-row vocabulary — verified exact —
  and is now the ONLY type carrying `id/name/has_password/current_media/
  is_playing`.
- New wrapper types for the five REST envelopes + the error arm, per
  `SyncPlayController`: `SyncPlayListGroupsResponse` (`{groups}`),
  `SyncPlayCreateGroupResponse` / `SyncPlayJoinGroupResponse`
  (`{success:true, group}`), `SyncPlayGetGroupResponse` (`{group}` — NO
  success key on that rail), `SyncPlayLeaveGroupResponse`
  (`{success:true, message}` — message ALWAYS present, nullable), and
  `SyncPlayErrorResponse` (`{error}` @400/@404).
- New exported ordered key-list consts for every type above plus
  compile-time interface↔const ties — a rename on one side without the
  other is a `tsc` error.
- New cross-language golden-vector gate:
  `scripts/dump-server-syncplay-vectors.php` drives the REAL server
  controller + manager + snapshot service (reads exercised against a real
  MySQL scratch DB seeded from the server's own migration; the script
  refuses to run at any server sha other than the ruling commit) and the
  REAL `getState()`; the capture is
  `test/fixtures/syncplay-envelope-vectors.json`;
  `test/syncPlayShapeParity.test.ts` asserts every vector's key list equals
  the TS consts — exact, ordered, never substring. Mutation-verified in
  both directions at ship time.
- **RETIRING THE GHOSTS (S415)** — these exported interfaces described
  shapes the live server never emits (each verified by field-shape grep at
  `01340633`; the only historical hosts were two dead classes,
  `src/Server/WebSocket/SyncPlay/SyncPlayRoom.php` and `.../Protocol.php`,
  which have zero live callers — re-enumerated at this release):
  - `SyncPlaySession` — no live emitter; the group state supersedes it.
  - `SyncPlayUser` — no live emitter; `SyncPlayMember` is the emitted
    participant shape.
  - `SyncPlayParticipant` — no live emitter; superseded by `SyncPlayMember`.
  - `SyncPlayChatMessage` — chat rows are internal to `GroupState` and are
    NOT part of `getState()`; no REST rail emits them.
  - `SyncPlayMessage` — no live emitter; the WS frame vocabulary is owned by
    the `@phlix/syncplay` lib's SPEC, not by phantom shapes here.
  - `SyncPlayStateUpdate` — no live emitter (`session_id` appears only in
    the dead Protocol class).
  - `SyncPlayPlaybackCommand` — no live emitter on any REST rail; the
    server's inbound WS command vocabulary is validated by
    `Messages.php`, whose shapes differ entirely.
  All seven had ZERO estate importers outside tizen's store (which drops
  them in the paired cascade); `@deprecated` shims were rejected as
  roadkill-fuel — delete, and let the compiler find anyone who ever
  materializes a live emitter.
- `SyncPlayRole` / `SyncPlayPermission` are KEPT unchanged (WS-side
  vocabulary; no wire claim made for them). `SyncPlayRoom` remains a
  `@deprecated` alias of `SyncPlayGroup`.

## [0.4.5] - 2026-08-31

Track-shape authority release (S404). **Consumers must bump deliberately**:
the playback-info track pair changed shape (a type-level correction of a
long-standing fiction), so tizen/mobile/ui pins move to this tag in the same
wave. `dist/` is rebuilt and committed; `dist/server-route-manifest.json` is
byte-identical to 0.4.4 (the S280 export was NOT regenerated here).

### Fixed (S404 — playback.ts track shapes := the honest wire)

- `AudioTrack` (src/playback.ts) now declares exactly what
  `Phlix\Media\Library\StreamTrackShaper::audioTracks()` emits at server
  `01340633`: `id, index, stream_index, codec, language, channels,
  bitrate (ALWAYS present, nullable), title (nullable), default (stored
  disposition else first-track promotion)`. The pre-fix declaration carried
  a REQUIRED `display_title` and an optional `url` — no server endpoint has
  ever emitted either (`display_title`: zero hits in phlix-server `src/`).
- `SubtitleTrack` now declares the shaper's emission: `id, index,
  stream_index, language, label (= title ?? language ?? 'Subtitle N'),
  codec, source, hearing_impaired, url (signed path, null without an
  itemId)`. `display_title` gone; the display string is the server-derived
  `label`.
- `pickDefaultAudio` (src/Audio.ts) retyped from the `StreamAudioTrack` DB
  mirror to the wire `AudioTrack` — its docblock always said "tracks from
  playback-info" while the signature lied. No estate caller exists
  (grep-verified), so the retype strands nobody.
- New exported ordered key-list consts `AUDIO_TRACK_KEYS` /
  `SUBTITLE_TRACK_KEYS` plus a compile-time interface↔const tie — a rename
  on one side without the other is a `tsc` error.
- New cross-language golden-vector gate:
  `scripts/dump-server-track-vectors.php` captures the REAL server shaper's
  output (fixture provenance records the server sha; minted subtitle URLs
  are asserted to the signed shape then stored path-only),
  `test/fixtures/stream-track-vectors.json` is that capture, and
  `test/trackShapeParity.test.ts` asserts every vector's key set equals the
  TS consts — exact, ordered, never substring. The gate was
  mutation-verified in both directions: a fixture `title`→`display_title`
  rename turns the suite red; an interface rename turns `tsc` red.
- `StreamAudioTrack`/`StreamSubtitleTrack` (AudioTrack.ts / SubtitleTrack.ts)
  are KEPT — they are `media_streams` DATABASE mirrors, not wire shapes —
  with docblocks now stating the two-vocabulary split explicitly.

## [0.4.4] - 2026-08-28

Wire-shape correction release (S234 + the S325 half of the coordinated
contracts release). **Consumers must bump deliberately**: the mobile client
bumps in this step (S234); the ui/tizen/console bumps for the S325 half are
the named W18 follow-up. `dist/` is rebuilt and committed.

### Changed (S234 — parental-controls create shapes)

- `ProfileTag`: the tag-type wire key is now `tag_type` (the server's
  snake_case emission, `Phlix\Access\ProfileTag::toArray()`, and the DB
  column name). The previous `tagType` declaration mirrored the mobile/roku
  create bodies instead of the server, so every create those clients posted
  400'd (accepted by neither S233 spelling). The server has accepted
  `tagType` additively since S234 so shipped clients keep working, but the
  declared shape is the server's. `tagType` is gone from the interface;
  re-adding it reddens `test/profiletag.test.ts`.
- `ProfileTag.profileId` / `AccessSchedule.profileId`: `number` → `string`
  (CHAR(36) `user_profiles.id` UUID; an `(int)` cast of a UUID is 0 or a
  leading digit-run).
- `AccessSchedule`: the schedule keys are now snake_case (`start_time`,
  `end_time`, `days_of_week`, `is_active`), matching the server's
  `AccessSchedule::toArray()` emission. The camelCase spellings
  (`startTime`/`endTime`/`daysOfWeek`/`isActive`) that mobile/roku posted
  are accepted additively by the server since S234 but are not the declared
  shape; re-adding them reddens `test/profiletag.test.ts`.

### Changed (S325 — `dash_url` on the transcode shapes)

- `TranscodeStartResponse` / `TranscodeStatusResponse`: `dash_url:
  string | null` is now declared on both (always present, null when the job
  published no `manifest.mpd`). phlix-server S59 restored what S11 removed;
  the previous absence pin was itself the regression. The presence and
  null-admittance are pinned by `test/renditions.test.ts` ("declares
  dash_url on both transcode shapes, absent on Rendition (S325)") — the test
  fails on the pre-fix shape. `Rendition` still declares no `dash_url` (a
  ladder rung is never a DASH endpoint).

## [0.4.3] - 2026-08-07

Changelog-accuracy release. **Zero runtime change**: nothing under `src/`
changed, and the built `dist/` is byte-identical to `v0.4.2` (verified —
`git diff --stat v0.4.2 HEAD -- dist` is empty). The only tracked changes are
this file and the `version` field in `package.json`. Consumers gain nothing by
bumping their pin from `v0.4.2`, and lose nothing by staying on it.

### Fixed

- `CHANGELOG.md`: the `[Unreleased]` section described **six changes that had
  already shipped** — the oldest of them (`poster_srcset`, commit `4b7ffd2`) in
  `v0.3.12`, four tags before `v0.4.2` — while four
  published tags (`v0.3.12`, `v0.3.13`, `v0.4.0`, `v0.4.1`) had no section at
  all. Every bullet has been moved to the release that actually contains it.
  The attribution was derived per bullet from `git log -S'<string>' -- src` for
  the introducing commit, then `git tag --contains <sha>` combined with each
  tag's own creation date (`%(taggerdate)`) for the first release that carried
  it — not from the bullet's position in the file or from commit dates alone,
  which disagree here because `v0.3.13` was tagged after `v0.4.0`.
- `CHANGELOG.md`: two "impact today" assessments that were accurate when written
  in early August had since gone stale — `phlix-mobile-client`'s local copy has
  dropped `dash_url` of its own accord, and `phlix-windows-client` both moved
  its pin to `v0.4.1` and deleted the two music fixtures named. Corrected in
  place, with each correction dated — see the ⚠ follow-ups under `0.4.0`.
- `CHANGELOG.md`: the `[…]` compare links at the foot of the file were missing
  for eight versions with a section (`0.4.1`, `0.3.13`, `0.4.0`, `0.3.12`,
  `0.3.11`, `0.3.10`, `0.3.8`, `0.2.1`); links are now present for all of them
  except `0.3.10`, which has no tag to link to.
  - ⚠ Two numbering anomalies are left as-is because fixing either would mean
    moving a published tag: there is **no `v0.3.10` tag** even though this file
    has a `## [0.3.10]` section (that work is inside the `v0.3.11` tag), and
    there is a **`v0.3.9` tag with no section**. `0.3.10` therefore gets no
    compare link rather than a link that would 404.

## [0.4.2] - 2026-08-07

### Added

- `mcp`: **new module** — the MCP personal-access-token vocabulary, so the hub
  and the JS clients can pin against a shared third party instead of against
  each other's working trees. Exports `MCP_SCOPE` (the four constants, keyed by
  the hub's PHP constant names), `MCP_SCOPES` (the full list in
  `McpScopes::all()` order), the `McpScope` union, and `MCP_TOKEN_PREFIX`.
  - Authored **from** `phlix-hub/src/Mcp/McpScopes.php` and
    `McpTokenService.php`, which remain the source of truth. It is deliberately
    NOT generated from any client's copy — a vocabulary derived from its own
    consumer can never disagree with that consumer.
  - Includes **`mcp:playback:control`** (hub S63), the write scope, which
    phlix-ui's local copy did not carry.
  - **Why (phlix-ui S249):** phlix-ui pinned its `MCP_SCOPES` by reading the
    hub's PHP file off the filesystem under
    `it.runIf(existsSync(<sibling phlix-hub path>))`. CI has no `phlix-hub`
    checkout, so the assertion never ran and reported as **passing** — while on
    a developer box it went red whenever the sibling tree moved. Measured on
    phlix-ui `6efe3588`: with the sibling present the suite is `1 failed |
    5101 passed | 10 skipped`; with it absent (CI's situation, same commit,
    same live drift) it is `259 files passed, 5100 passed | 12 skipped` — fully
    green.
  - ⚠ Consumers must compare the whole list **exactly and in order**.
    `'mcp:playback'` is a prefix of `'mcp:playback:control'`, so any
    `includes` / `startsWith` check silently accepts a rename. The order is
    part of the stored representation (`McpScopes::parse()` emits in this order
    into `mcp_tokens.scopes`), so appending is safe and reordering is not.
  - ⚠ Anti-vacuity: an equality check against an export that resolves to
    `undefined` or `[]` passes trivially. Assert a floor on the length;
    `test/mcp.test.ts` pins `MCP_SCOPES.length >= 4`.

- `dist/mcp-scopes.json` — the same vocabulary as plain JSON, emitted by
  `scripts/emit-mcp-scopes.mjs` during `npm run build`. **phlix-hub is PHP with
  no `package.json` and no npm step in its CI**, so it cannot import this
  package the way the JS clients do; it can `json_decode()` a file. Generated
  from the built bundle rather than hand-maintained, and `test/mcp.test.ts`
  asserts the committed artifact still equals `MCP_SCOPES` — so a stale file
  (someone edited `src/mcp.ts` and skipped the build) is a RED, not a wrong
  vocabulary the hub then gates against.

## [0.4.1] - 2026-08-04

Commit `8b355ce`, tag published 2026-08-05. Byte-identical to `v0.3.13` — see
the next section for why the same commit carries two tags.

### Changed

- **syncplay**: Rename `SyncPlayRoom` → `SyncPlayGroup`, keeping `SyncPlayRoom`
  as a `@deprecated` alias (`src/SyncPlay.ts`). Field names aligned with the
  server's actual `/syncplay/groups` routes — `member_count`, `has_password`,
  `current_media`, `is_playing`, `playback_position` — and a five-route comment
  block added. (C1.0)
  - ⚠ `package.json` at this commit still reads `0.4.0`: the version field was
    not bumped for either `v0.3.13` or `v0.4.1`, so an install from either tag
    self-reports `0.4.0`. Corrected from `v0.4.2` onward; not retro-fixable
    without moving a published tag.

## [0.3.13] - 2026-08-04

**Superseded numbering — not a distinct release.** This tag points at the exact
same commit as `v0.4.1` (`8b355ce`) and ships identical bytes. It contains
nothing that `v0.4.1` does not.

It was tagged 2026-08-04, *after* `v0.4.0` had been published on 2026-08-02, so
its number sorts below a release whose entire content it contains — a consumer
resolving "latest" by version order would have gone backwards. The same commit
was therefore re-published unchanged as `v0.4.1` on 2026-08-05.

Both tags stay on the remote deliberately. The clients pin this package by git
tag (`github:detain/phlix-contracts#<tag>`), so deleting or re-pointing a
published tag breaks their installs and lockfiles. **Do not "fix" this by
retagging or by deleting `v0.3.13`.** New pins should use `v0.4.1` or later.

## [0.4.0] - 2026-08-02

Two breaking type corrections. Both are type-level only — the server payloads
were already what these types now say.

### Added

- The missing MIT `LICENSE` file at the repo root. `package.json` had declared
  `"license": "MIT"` since `v0.1.0` with no license text in the tree.

### Removed

- 🔴 **BREAKING** — `playback`: `dash_url` is gone from both
  `TranscodeStartResponse` and `TranscodeStatusResponse`. It was declared
  **required** (`dash_url: string`) on both, but the server has never sent it
  since phlix-server **S11** — real DASH is unbuilt (tracked as S56-S60), so the
  advertised `/dash/{job}/manifest.mpd` always 404'd.
  - Declaring it was strictly worse than omitting it: a consumer trusting the
    type got a compile-time guarantee of a field that is `undefined` at runtime,
    with no `strictNullChecks` warning to catch the difference.
  - Removed outright rather than relaxed to `dash_url?: string`. An optional
    member invites every consumer to keep testing for a key that is never
    emitted. When DASH actually ships it returns as a required field, in
    lockstep with the server payload.
  - The absence is pinned at the type level in `test/renditions.test.ts`
    ("declares no dash_url on either transcode shape") using the same
    `Exact<A, B>` invariant helper as `test/music.test.ts`, via
    `Exact<HasKey<T, 'dash_url'>, false>`. Because `keyof` includes optional
    members, re-adding `dash_url?: string` is just as RED as re-adding it
    required. ⚠ The killing gate is `tsc --noEmit` (`npm run typecheck`, and
    again inside `npm run build`) — vitest transpiles without type-checking and
    stays green on the mutant.
  - **Impact today: none observed.** Repo-wide greps found no reader of
    `dash_url` in `phlix-ui`, `phlix-windows-client` or `phlix-console-client`.
    `phlix-mobile-client` keeps its own local copy of these shapes plus a
    fixture that sets the key; it does not import them from here yet, so it is
    unaffected until it switches over. The clients pin `@phlix/contracts` by
    **git tag**, so this change is inert for each of them until that pin is
    deliberately bumped.
  - ⚠ **Follow-up, verified 2026-08-07** (correction filed in `0.4.3`): the
    mobile-client sentence above is now out of date. `phlix-mobile-client` has
    since removed `dash_url` from its own `src/types/playback.ts` and pins the
    absence in `src/types/__tests__/playback.test.ts` ("declares no dash_url on
    either transcode shape"), matching this package. Re-grepped for the literal
    `dash_url` across the five sibling client checkouts under `/home/sites/phlix`
    (`phlix-ui`, `phlix-windows-client`, `phlix-console-client`,
    `phlix-mobile-client`, `phlix-tizen-client`, excluding
    `node_modules`/`.git`/`dist`): the only hits are those mobile-client
    comments and absence-pins. No repo reads the field.

### Changed

- 🔴 **BREAKING** — `music`: `MusicArtist.mediaItemId`, `MusicAlbum.mediaItemId`
  and `MusicTrack.mediaItemId` are now `string | null`. They were
  `number | null`, `number | null` and `number` respectively. The column is
  `media_items.id`, a **`CHAR(36)` UUID** — it was never a number.
  - This is the type-level half of phlix-server **S121**, where the same wrong
    assumption was encoded as an `is_numeric()` test against a UUID. That test
    can never pass, so the field was silently `null` on `MusicArtist` /
    `MusicAlbum` and silently `0` on `MusicTrack` for the whole life of the bug.
    phlix-server corrected all three PHP DTOs to `?string`; this aligns the
    contract to them.
  - `MusicTrack.mediaItemId` additionally becomes **nullable**. `0` was never a
    real id — it was the coercion's fallback masquerading as one — so consumers
    must now handle the absent case explicitly rather than reading a plausible
    integer.
  - `id`, `artistId` and `albumId` are unchanged and remain `number`: those are
    the music tables' own AUTO_INCREMENT keys, a genuinely different key space
    from the `media_items` UUID.
  - **Impact today: none observed.** No client in the estate reads
    `mediaItemId` off these three interfaces, and the server does not emit the
    field in these payloads (S121 shipped zero payload change deliberately).
    The risk this closes is the first consumer to read it inheriting a wrong
    type. `phlix-windows-client` imports `MusicArtist` / `MusicAlbum` but pins
    `@phlix/contracts` to the `v0.3.12` tag, so it is unaffected until that pin
    is deliberately bumped — at which point its two music test fixtures
    (`tests/unit/MusicAlbumCard.test.tsx:15` `mediaItemId: 100` and `:55`, and
    `tests/unit/MusicArtistCard.test.tsx:15` `mediaItemId: null`) need the
    numeric literal replaced with a UUID string. `phlix-ui` does not use these
    interfaces at all.
  - ⚠ **Follow-up, verified 2026-08-07** (correction filed in `0.4.3`): the
    windows-client sentence above is now out of date and its action item is
    moot. `phlix-windows-client` has moved its pin to `v0.4.1` (which contains
    this change) and separately deleted both named fixtures along with the local
    `MusicAlbumCard`/`MusicArtistCard` components in favour of `@phlix/ui`
    (commit `8e52a08`). A repo-wide grep for `mediaItemId` in
    `phlix-windows-client` now returns **zero** hits. Current pins across the
    four sibling repos that declare a `@phlix/contracts` dependency in
    `package.json`: `phlix-ui` `v0.4.2`, `phlix-windows-client` `v0.4.1`,
    `phlix-mobile-client` `v0.4.0`, `phlix-tizen-client` `v0.3.12` — so only
    tizen still predates this change.

## [0.3.12] - 2026-07-20

⚠ Numbered as a patch, but the `MediaType` change below is **breaking** for any
consumer that had exhaustively switched on the old six-member union. The number
understates it; it is not retro-fixable without moving a published tag.

### Added

- `media`: `MediaType` widened from a stale six members to the **full 13-member
  `media_items.type` column ENUM, in schema order** — `movie`, `series`,
  `season`, `episode`, `track`, `music`, `album`, `artist`, `video`, `audio`,
  `book`, `photo`, `audiobook`. Eight members were missing (`track`, `music`,
  `album`, `artist`, `video`, `book`, `photo`, `audiobook`). The authoritative
  sources this must track verbatim are the server migrations (001 → 011 → 034),
  `MediaItemShaper::VALID_TYPES`, and the `type` enum in
  `phlix-shared/schemas/media-item.schema.json`.
- `media`: new `OtherMediaItem` interface — any item whose `type` has no
  dedicated interface, i.e. everything outside the
  `movie`/`series`/`season`/`episode` video hierarchy. Its discriminant is
  **derived** as `Exclude<MediaType, 'movie'|'series'|'season'|'episode'>`
  rather than listed by hand, so a future `MediaType` member lands here
  automatically and cannot silently escape the union.
- `media`: Phase C metadata sync. `ContentRating` now covers the US TV Parental
  Guidelines scale (`TV-Y`, `TV-Y7`, `TV-G`, `TV-PG`, `TV-14`, `TV-MA`) alongside
  the existing MPAA film scale — matching the server's expanded `ContentRating`
  vocabulary and the `rating`/`ratings[]` enums in phlix-shared. `NR` is
  normalized to `UNRATED` server-side and is deliberately absent. Purely additive.
- `media`: four new OPTIONAL, nullable detail-only fields on `MediaItem`
  (`trailer_url`, `trailer_key`, `trailer_site`, `logo_url`) plus `still_url`
  (episodes only, on `Episode`). These appear on `GET /api/v1/media/{id}` and are
  absent from the lean list shape; null when unavailable. Regenerated
  `dist/media.d.ts`. Backward-compatible — existing consumers are unaffected.

### Changed

- 🔴 **BREAKING** — `media`: `AnyMediaItem` is now
  `Movie | Series | Season | Episode | OtherMediaItem` and is **total**. It
  previously covered only the four hierarchy discriminants while the wire could
  carry `photo`/`book`/`track` rows, so the old docblock's advice to
  `switch (item.type)` with a `default` branch typed `never` was a lie about the
  runtime data — it just could not say so while `MediaType` omitted those
  members. A `default: never` over the widened union no longer compiles, which
  is the point: narrow `default` to `OtherMediaItem` and handle it, or switch on
  the specific discriminants you support and fall through for the rest.
- `media`: corrected the `MediaItem.poster_srcset` doc-comment (and the
  `test/types.test.ts` fixture) to describe the server's SV-3.4 local artwork
  cache. Once artwork is downloaded and resized on match, the server now emits
  a LOCAL sized-variant srcset pointing at its own
  `/api/v1/artwork/{id}?size=…` route (widths 185/342/500/780 + an `original`
  variant, served with cache headers), so offline/LAN installs get posters
  without reaching TMDB; the shaper only falls back to the `image.tmdb.org` CDN
  width-swap srcset (or `null`) when no local variant is cached. The
  `poster_srcset` TYPE is unchanged (`string | null`) — only the documented
  value shape and example fixture were stale (they described only the old TMDB
  CDN srcset). Producer-side sync point for the UI's responsive-poster support
  (U-N7).

### Removed

- 🔴 **BREAKING** — `media`: the bogus `'image'` member of `MediaType`. The
  photo kind is named **`photo`**; `image` is a scanner-side label keying the
  media scanner's file-extension set and is never emitted on the wire. The same
  stale list in `MediaItemShaper::VALID_TYPES` was silently relabelling real
  photo/book/audiobook/track rows as `"movie"` in API responses
  (phlix-server#527). These client-side unions are unchecked casts, so nothing
  failed at runtime — they were simply wrong. Do not reintroduce it. The same
  bogus member existed in the `phlix-ui` and `phlix-mobile-client` copies; this
  release was cut so they could repin and import from here instead of keeping a
  third and fourth divergent copy. Verified 2026-08-07: both now do
  (`phlix-ui/src/types/media-item.ts:19` and
  `phlix-mobile-client/src/types/media.ts:41` each
  `import type { MediaType } from '@phlix/contracts'`).

## [0.3.11] - 2026-07-10

### Added

- `events`: `WEBHOOK_EVENT.MEDIA_PLAYED: 'media.played'` for P9-S1 media.played webhook events.

## [0.3.10] - 2026-07-10

### Added

- `Audio`: `pickDefaultAudio` helper function to auto-select a audio track based on user's preferred BCP47 language tags.

## [0.3.8] - 2026-07-09

### Added

- `events`: `WEBHOOK_EVENT.MEDIA_ADDED: 'media.added'` for P9-S1 media.played/added webhook events.

## [0.3.7] - 2026-07-08

### Added

- `media`: `RatingValue` type for P1-S6 rating representation.
- `playback`: `ChapterInfo`, `TrickplayInfo`, and `MarkerTimeline` types for P2-S3 enhanced playback markers.

## [0.3.6] - 2026-07-08

### Added

- `library`: `MusicArtist`, `MusicAlbum`, `MusicTrack`, and `AudioPreferences` types for P7-S4 music library support.
- `playback`: `SyncPlay` group and session types for P8-S2 collaborative playback.

## [0.3.5] - 2026-07-08

### Added

- `media`: `AccessSchedule`, `ProfileTag`, and `StreamSession` types for P5-S4 access control and streaming sessions.

## [0.3.4] - 2026-07-08

### Added

- `media`: `SimilarItem`, `Recommendation`, and `Collection` types for P4-S4 recommendations.

## [0.3.3] - 2026-07-08

### Updated

- `playback`: `Chapter` and `Trickplay` types updated per P2-S3 spec.

## [0.3.2] - 2026-07-08

### Added

- `playback`: `AudioTrack` and `SubtitleTrack` types for P3B-S4.

## [0.3.1] - 2026-07-08

### Added

- `playback`: `Marker` and `PlayerPrefs` types for P3-S2.

## [0.3.0] - 2026-07-08

### Added

- `media`: `RatingSet` types, smart-rule `min_rating` filter, and manual-match types for P1-S6.

## [0.2.1] - 2026-07-08

### Fixed

- `playback`: `RenditionId` is no longer a strictly closed union. The server's
  `AbrLadder` emits a single source-sized fallback rung (`` `${height}p` ``,
  e.g. `'144p'`) for a source shorter than the 240p ladder floor — which the
  old fixed union could never represent, contradicting its own "the server
  emits exactly these" invariant. Split into `CanonicalRenditionId` (the
  documented canonical rungs) and `RenditionId = CanonicalRenditionId |
  `${number}p`` so the fallback id type-checks. Additive/widening only — no
  breaking removal; runtime values (`AUTO_QUALITY`, `pickDefaultRendition`) are
  unchanged (I1 cross-repo review finding).
- `playback`: corrected the endpoint attribution in the module + `PlaybackInfo`
  docblocks — the marker + `quality_ladder` shape is served by
  `GET /api/v1/media/{id}/playback-info` (`MediaItemController::getPlaybackInfo`),
  NOT `GET /api/v1/media/{id}/playback` (a distinct route returning a
  `{playback_info:{…media_sources…}}` wrapper). Docs-only (I1 finding).

## [0.2.0] - 2026-07-08

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
- `media`: new `AnyMediaItem` discriminated union
  (`Movie | Series | Season | Episode`), narrowable on the `type` discriminant
  so consumers can `switch (item.type)` with compiler-enforced exhaustiveness
  (a `never`-typed default branch flags unhandled variants). All members inherit
  the base `MediaItem` fields, including the detail-only `user_data` block (F4).
- `playback`: contracts foundation for the multi-variant stream-quality / ABR
  feature — the client-side mirror of the server's ABR ladder types, verified
  field-for-field against `Phlix\Media\Streaming\Rendition::toArray()` and the
  `TranscodeController::start()`/`status()` responses. Consumed by the upcoming
  `phlix-ui` quality picker (E3) and native client rollouts (G1/G2/G3) (B1):
  - `Rendition` — one rung of the ladder (or the Original passthrough
    descriptor): snake_case wire shape `{id, label, width, height, bitrate,
    codecs, url, is_original, is_copy, video_bitrate}`. `url` is a signed
    per-variant media-playlist path, `null` in a playback-info preview (no job
    yet) and non-null on a real job's `variants[]`.
  - `RenditionId` — the 8 fixed lowercase rung ids (`'240p'` … `'2160p'`,
    `'original'`); `'original'` is a real rung (source passthrough), not a
    sentinel.
  - `AUTO_QUALITY` constant (`'auto'`) + `AutoQuality`/`QualitySelection`
    types — a UI-only "let ABR decide" sentinel kept provably distinct from a
    pinned `RenditionId` at the type level.
  - `TranscodeSubtitleTrack` — the transcode-job subtitle shape
    (`{index, language, label, default, url}`), distinct from the existing
    library `SubtitleTrack`.
  - `TranscodeStartResponse` (`POST /api/v1/media/{id}/transcode`) and
    `TranscodeStatusResponse` (`GET /api/v1/transcode/{jobId}/status`) — new
    interfaces mirroring the two transcode controller endpoints exactly, each
    carrying `variants: Rendition[] | null` (`null` only for a legacy pre-ABR
    job).
  - `PlaybackInfo.quality_ladder?: Rendition[] | null` — the pre-flight ABR
    ladder preview from `GET /api/v1/media/{id}/playback` (every entry's `url`
    is `null`; the whole field is `null` when the item lacks probed source
    metadata, and absent entirely on pre-A7 servers).
  - `pickDefaultRendition(variants, preferredId?)` — pure helper picking a
    sensible bootstrap rendition before ABR takes over: empty list →
    `undefined`; a matching `preferredId` → that rung; otherwise the median
    rung of the highest-first list (a conservative mid-tier default, and the
    sole rung when there is only one).

### Fixed

- `ticks`: `ticksToHms`, `formatRuntime`, and `formatDuration` now guard against
  non-finite (`NaN`/`Infinity`) and negative input — previously `ticksToHms(NaN)`
  yielded `"NaN:NaN"`. Such input is clamped to `0` and each function returns its
  existing zero-fallback (`"0:00"` / `"0 min"` / `""`). Valid-input output is
  unchanged (Q3).

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

[Unreleased]: https://github.com/detain/phlix-contracts/compare/v0.4.4...HEAD
[0.4.4]: https://github.com/detain/phlix-contracts/compare/v0.4.3...v0.4.4
[0.4.3]: https://github.com/detain/phlix-contracts/compare/v0.4.2...v0.4.3
[0.4.2]: https://github.com/detain/phlix-contracts/compare/v0.4.1...v0.4.2
[0.4.1]: https://github.com/detain/phlix-contracts/compare/v0.4.0...v0.4.1
[0.3.13]: https://github.com/detain/phlix-contracts/compare/v0.4.0...v0.3.13
[0.4.0]: https://github.com/detain/phlix-contracts/compare/v0.3.12...v0.4.0
[0.3.12]: https://github.com/detain/phlix-contracts/compare/v0.3.11...v0.3.12
[0.3.11]: https://github.com/detain/phlix-contracts/compare/v0.3.9...v0.3.11
[0.3.8]: https://github.com/detain/phlix-contracts/compare/v0.3.7...v0.3.8
[0.3.7]: https://github.com/detain/phlix-contracts/compare/v0.3.6...v0.3.7
[0.3.6]: https://github.com/detain/phlix-contracts/compare/v0.3.5...v0.3.6
[0.3.5]: https://github.com/detain/phlix-contracts/compare/v0.3.4...v0.3.5
[0.3.4]: https://github.com/detain/phlix-contracts/compare/v0.3.3...v0.3.4
[0.3.3]: https://github.com/detain/phlix-contracts/compare/v0.3.2...v0.3.3
[0.3.2]: https://github.com/detain/phlix-contracts/compare/v0.3.1...v0.3.2
[0.3.1]: https://github.com/detain/phlix-contracts/compare/v0.3.0...v0.3.1
[0.3.0]: https://github.com/detain/phlix-contracts/compare/v0.2.1...v0.3.0
[0.2.1]: https://github.com/detain/phlix-contracts/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/detain/phlix-contracts/compare/v0.1.1...v0.2.0
[0.1.1]: https://github.com/detain/phlix-contracts/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/detain/phlix-contracts/releases/tag/v0.1.0

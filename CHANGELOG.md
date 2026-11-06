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

### Fixed — LW-011/040/070 docblock sweep, WireKeysExact hoist, importable match law — 2026-11-07

- **Docblock style sweep (LW-011):** `src/errors.ts` standardizes on the
  README W-notation for emit-wave labels (every `Wave 1`/`Wave-1b`/
  `WAVE 1b`/`Wave 1b` spelling is now `W1`/`W1b`; doctrine-era references
  read `W2-era`), backticks for every code token where blocks used mixed
  quote styles, the two misaligned continuation-star docblocks (auth domain,
  `profile.not_found`) re-flanged to the file's own 2-space domain / 4-space
  entry rhythm, the 33 single-line docblocks over 100 columns wrapped to the
  file's near-80 rhythm with every `File.php:NN` cite kept one-line and
  colon-joined (the `scripts/check-error-cites.mjs` MALFORMED-WRAP leg stays
  green: `ok=435 problems=0` before and after — zero cite semantics moved),
  the garden-path currency sentence recast ("cites in files untouched since
  a stamp remain verified by that sweep's spot-checks") and the accidental
  `trip-\nwire` hyphen-break healed. `scripts/emit-error-codes.mjs`,
  `scripts/emit-mcp-scopes.mjs` and `scripts/check-error-cites.mjs` gain the
  `@license MIT` tag so every script header carries the same kit as
  `scripts/emit-server-route-manifest.mjs` (and `src/index.ts`). Docs-only:
  no code, no wire, no registry bytes.
- **`WireKeysExact` hoisted to one definition (LW-040):** the helper that was
  copy-pasted module-privately in `src/playback.ts` and `src/SyncPlay.ts`
  (justified by a self-containment rationale the single-bundle build
  disproves) now lives once in `src/internal/wireKeys.ts`, deliberately NOT
  re-exported from `src/index.ts` — the exports map governs the public
  surface. The shared docblock states the order law plainly instead of adding
  a second type: `WireKeysExact` ties SET membership; key ORDER is carried by
  the golden fixtures, whose ordered `Object.keys` comparisons already redden
  a reorder (`test/trackShapeParity.test.ts`,
  `test/syncPlayShapeParity.test.ts`). Mutation proof: renaming one interface
  key is now a `tsc` error through the single helper (2 errors at the tie and
  its consumer).
- **The manifest match law becomes importable (LW-070):** the client-side
  matching semantics (anchored regex, `{param}` spans exactly one path
  segment, never substring, never prefix — the rule that prevents
  sibling-wildcard absorption) existed only as a helper inside
  `test/routeManifest.test.ts`, unimportable by the estate clients, which is
  how roku/mobile/console/windows each ended up re-deriving it — the drift
  class this package exists to kill. New `src/routeManifest.ts` re-exports
  the generated tuples and provenance unchanged and exports
  `isServedRoute` through the bundle (root import and a new
  `@phlix/contracts/routeManifest` subpath declared in `package.json`
  `exports`); the test file now consumes the shipped definition instead of
  restating it. Two new exports-hygiene tests pin the subpath's files as
  committed and resolve the predicate BY PACKAGE NAME through the real Node
  loader (ESM and CJS), reproducing the law's cases through the shipped
  bundle. Additive API only: no error-code union, registry token, or wire
  literal moved — all three registry md5s are byte-identical across this
  commit (`error-codes.json 5d1783a7…`, `server-route-manifest.json
  90b79e35…`, `mcp-scopes.json 8c92c070…`). Suite 171 to 173 tests
  (the two hygiene pins); `dist/` rebuilt deterministically (×2 byte-equal),
  `.d.ts` maps re-VLQ per the docblock churn.

### Fixed — LW-007/008/009/010/012 + w01L8-review carry prose (docs/comments/tests only; zero wire, zero registry change) — 2026-11-07

- **README break-on-upgrade bullet made truthful (LW-007):** the bullet said
  minting codes "lands as a minor bump" and quoted the escape-hatch pin type
  as `Partial<…ErrorCode, …>` — an invalid two-type-argument `Partial`. Both
  contradicted the source law (the `src/errors.ts` SEMVER & COMPATIBILITY
  header): registry mints land as LAST-POSITION (patch-numbered) bumps per
  this package's own precedent (`v0.5.1` carried +55 codes, `v0.5.3` carried
  +2, both patch-numbered), the number understates the type-level break (the
  repo's own "Numbered as a patch, but TYPE-breaking" release line), and a
  consumer that must not break on upgrade pins `Partial<Record<…ErrorCode,
  …>>` plus a default fallback. The bullet now states exactly that.
- **CHANGELOG compare-link footer repaired (LW-008):** `[Unreleased]` compared
  against v0.4.4 — twelve headings stale — now re-pointed to
  `v0.5.6...HEAD`; the version sections `[0.4.5]` through `[0.5.6]` had no
  footer link definitions at all (recent headings rendered as literal
  brackets) — every missing pair is now defined against consecutive tags,
  each URL's refs existence verified against origin's live tag list, not
  memory; and `[0.3.11]` based its compare on tag v0.3.9, deleted in the
  2026-10-02 orphan-tag cleanup (dead link) — re-based onto v0.3.8, its
  nearest surviving ancestor (ancestry proven via git). Honest remainder:
  the `[0.3.10]` era heading carries no compare link because that tag was
  never published (nor was 0.3.9, whose number the CHANGELOG skips entirely)
  — the content shipped inside v0.3.11 — so the heading stays plain text by
  construction rather than links a fabricated range.
- **Wrapped cites re-anchored into the grammar; malformed-cite leg added
  (LW-009):** the `stream.limit_exceeded` and `oauth.invalid_redirect_uri`
  docblocks split two cites across line breaks (`File.php:` at end of line,
  digits on the next). Premise correction, measured: they were NOT silently
  killed at HEAD — `normalizeComment` space-joins comment lines before
  scanning, so both still parsed and verified (tamper probes: mutating either
  span reddens with DRIFT, and the wrapped-era total was the same ok=435).
  But parsing-by-join-accident is the undocumented fragility the review
  targeted: one refactor of the join and both cites would vanish green. Both
  docblocks are re-wrapped so every `File.php:NN` token sits on one line
  (matching the documented grammar); `scripts/check-error-cites.mjs` gains a
  MALFORMED-WRAP leg that fails the sweep on any errors.ts line ending in
  `.php:` (teeth proven in a scratch clone: replanting the old wrap exits 1
  with MALFORMED-WRAP); the script's grammar header now states the
  single-line law explicitly. `npm run verify:cites` at hub `30012378` /
  server `a63dc0db`: ok=435 problems=0, identical before and after —
  registry bytes and the coordinate set untouched.
- **Golden-vector headers made honest (LW-010):** the
  `test/syncPlayShapeParity.test.ts` and `test/trackShapeParity.test.ts`
  headers read like live tripwires; the fixtures are photographs frozen at
  their provenance SHAs. Both headers now say so — server-side renames
  redden only when a human re-runs the dump scripts (the live backstop for
  that direction is the server's own guard tests), TS-side drift reddens the
  moment it lands, and readers should check the pinned sha before treating a
  fixture as today's wire.
- **cs#47 ritual-token test given teeth (LW-012):** its surviving assertion
  checked a locally-defined literal's length and charset — permanently green
  under any state of any artifact. It now cross-checks the paired hub-side
  const in `tests/Unit/Http/Controllers/S280ContractsRouteManifestParityTest.php`
  whenever a hub checkout is co-located (same `PHLIX_CONTRACTS_HUB_REPO`
  convention as the cites tripwire): either side drifting alone reddens
  (mutation-proven both ways), and where the private sibling is absent —
  public CI — the case reports SKIPPED rather than pretending coverage. The
  token bytes themselves are unchanged.
- **Forward-corrections from the w01L8 review carry:** the entry below
  (LW-001..LW-006 currency, 2026-11-06) narrates one cured relay-rail cite as
  "the srv RelayController `NOT_IMPLEMENTED_VIA_HTTP` arm" — the file is
  HUB's (`src/Http/Controllers/RelayController.php`); the corrected cites in
  `src/errors.ts` themselves carry the right `hub` prefix, only the prose
  mislabeled the repo. History stays verbatim; this note is the correction.
  Also cured: the doubled "The The" in `CONTRIBUTING.md`'s dist-freshness
  paragraph.
- **Trio held:** all three `dist/` registry md5s byte-identical to the 0.5.6
  era — `error-codes.json` `5d1783a71a3c4e128b2021327cad3717`,
  `server-route-manifest.json` `90b79e355055307d5ba2cc0ef98e2300`,
  `mcp-scopes.json` `8c92c0703eae8a429c509ff16e0d185d`.
  Docs/comments/tests-only by construction; moves-together-or-not-at-all held
  at zero movement.

### Fixed — LW-001..LW-006 docs currency (comments/README only; zero wire, zero registry change) — 2026-11-06

- **`not_found` reserved→LIVE truth (LW-001):** the registry entry's docblock
  still narrated the pre-`e5aa57e2` reserved-rail story while hub `e5aa57e2`
  had promoted the code to LIVE emitters. The entry now cites its real emit
  sites — the hub `/auth/{action}` default arm and the router's 404 envelope
  builder — and the common-domain header sentence states the all-LIVE count.
  `dist/error-codes.json` bytes unchanged (md5 stays
  `5d1783a71a3c4e128b2021327cad3717`).
- **Relay-rail cite drifts cured (adjacent, disclosed):** the two coordinates
  the tripwire measured stale at hub `30012378` / server `a63dc0db` — the srv
  RelayController `NOT_IMPLEMENTED_VIA_HTTP` arm and the
  `relay.ws_http_endpoint` pair — were re-read at their current emit lines.
  `npm run verify:cites` now reports **ok=435 / problems=0** (the WAVE-4 era's
  433 plus the two new `not_found` coords); the header COORDINATE CURRENCY
  paragraph is re-stamped to this era.
- **Header openapi quote refreshed (LW-004):** the hub `openapi.yaml`
  description quoted in the `src/errors.ts` header had drifted from the hub's
  current wording; the quote is replaced with a drift-proof paraphrase. The
  server quote is still verbatim-true and stays.
- **`ticks.ts` docblock field-name drift (LW-003):** the misnamed `run_time`
  reference now reads `runtime`, matching the `media.ts` SSOT field.
- **README + CONTRIBUTING (LW-002/LW-005/LW-006):** install pin raised to
  `github:detain/phlix-contracts#v0.5.6` with the tag-form law stated; new
  "Consuming the registries" section (ESM import-attribute, CJS require, and
  the PHP vendoring byte-pin idiom the server/hub `ErrorCodesContractTest`
  gates practice); Modules table corrected — `media.ts` gains the exported
  `MediaItemUserData`, `LibrariesResponse`, `LibraryResponse`, and
  `PagedMediaItemsResponse`, `playback.ts` drops `ChapterMarker` (it ships
  only from `Chapter.ts`); generated-registry provenance spelled out; the
  Development block gains the fixture dumper commands (throwaway-MySQL law
  included), the tripwire's `--window/--json/--hub/--srv` flags, and the CI
  `git diff --exit-code -- dist/` freshness note; a new `CONTRIBUTING.md`
  carries the mint checklist, route-tuple regeneration, and the release
  ritual with consumer pin rotation.
- **Trio held:** all three `dist/` registry md5s are byte-identical to the
  0.5.6 era — docs-only by construction (they move together-or-not-at-all;
  this commit moves none).

## [0.5.6] - 2026-11-04

### Fixed — WAVE-4 coordinate re-anchor of all drifted `src/errors.ts` cites (comment currency only; zero wire change) — 2026-11-04

- **112 drifted coordinates (plus 10 adjacent stale coords inside the same
  comments) re-anchored at source** against the campaign-final tips hub
  `ee481593` / server `009ae7fb` — every moved cite was re-read at the current
  emit site in the (read-only) working trees, never guessed from offsets. The
  dev-only tripwire `npm run verify:cites` goes **ok=321 / problems=112 →
  ok=433 / problems=0**; the 433 parsed cites stay above the tool's 400-cite
  anti-vacuity floor. Families moved: the srv SyncPlayManager carrier wraps and
  legacy SCREAMING sites (dispatch-copy commits `9b75bf70`/`d390f2a1` shifted
  them), the hub-token/account-link rail (the SRV-M22 envelope rebuild at
  `009ae7fb` relocated the `HubTokenController` trio off its old prose coords),
  the quick-connect consent/pairing legs (`dd9c848c`), the srv rate-limit wrap,
  the LDAP + OIDC/GitHub provider and identity rails, and on the hub side the
  proxy tunnel/scope/quota/stream rows plus the federation/invite CRUD
  families. No emit site itself changed; only docblock prose moved.
- **Two-site pairs re-anchored by handler identity, disclosed:**
  `offer_not_found` `:905,:959`, `offer_already_responded` `:913,:967`,
  `missing_offer_id` `:898,:952`, `master_only` `:1005,:1056` — the tripwire's
  nearest-token suggestion would have collapsed each pair onto one emit; the
  pairs were mapped to their two handlers in old-cite order instead.
- **Manifest regen probed and honestly omitted:** the route-manifest generator
  was re-run against the final server tip `009ae7fb`; the 415-tuple payload is
  byte-identical to regen #36 (`90b79e35`) — only the provenance stamp would
  move — so no content regen and no provenance-only churn was committed. The
  owner D2 call (tag `v0.5.6` vs the untagged regen #36) is unaffected: the
  payload is stable at the final tips.
- **Build bytes:** `dist/errors.d.ts` and both source maps re-vendored (docblock
  text + the re-stamped header shift `sourcesContent`/VLQ); the JS bundles are
  byte-identical and the trio `dist/error-codes.json` /
  `dist/server-route-manifest.json` / `dist/mcp-scopes.json` md5s
  (`5d1783a7` / `90b79e35` / `8c92c070`) all held unchanged. Zero registry
  values moved, zero new wire codes.

### Changed — route-manifest regen #36: CONTENT 412→415 tuples at server `58530ec2`

- **Trigger: phlix-server master advanced `758f9149` → `58530ec2` with route
  movement.** Regenerated `src/routeManifest.generated.ts` + the committed dist
  with the repo's own `scripts/generate-server-route-manifest.mjs` against the
  live server checkout. CONTENT regen: the server's history-alias commit
  (`a86e0999`) adds the two watch-history GET tuples to the WebPortal guard
  table (48→50) and `8bb435cf` adds `GET /api/v1/servers/{id}` to the
  Application table (375→376); the shared overlap holds at 11, so the union
  grows 412→415 `[method, path]` tuples. The empirical tuple diff is EXACTLY
  those three additions — zero removals, zero other movement. The span's other
  commits that touched the guard files (the markers signature fix, the copy
  clusters, the collections route regroup) moved only the
  ` -> Handler [Middleware]` annotations the generator strips.
- **Test pins rotate in the same commit** (regen #35 precedent): provenance
  sha, source/total counts, and the byte-freeze md5 re-pinned to the new
  committed artifact. The cs#47 merge-ritual survival token deliberately does
  NOT rotate: it is a PAIR with the hub-side const and advances only in a
  coordinated consumer re-vendor leg — which lands on hub in the immediately
  following commit of this same currency wave.
- **Consumers verified unperturbed.** Every downstream master gate reads a
  VENDORED copy pinned to a release tag, not this master artifact; the new
  bytes are master-only until the next release tag, exactly as in regen #35.
  Zero registry movement: 205 codes / frozen error-codes bytes held;
  `dist/mcp-scopes.json` byte-identical. Gates: lint 0, typecheck 0, tests
  green, `npm run build` re-run leaves `dist/` clean (CI committed-freshness
  leg).

### Fixed — WAVE-3 coordinate re-anchor of all drifted `src/errors.ts` cites (comment currency only; zero wire change) — 2026-11-03

- **159 drifted coordinates re-anchored at source** against the campaign-final
  tips hub `bd47bc5a` / server `de38620b` — every moved cite was re-read at the
  current emit site in the (read-only) working trees, never guessed from
  offsets. The dev-only tripwire `npm run verify:cites` goes **ok=270 /
  problems=159 → ok=433 / problems=0**, and the 433 parsed cites stay above the
  tool's 400-cite anti-vacuity floor. No emit site changed; only docblock
  prose moved.
- **One semantic re-map disclosed:** the `server.not_owned` docblock no longer
  rides the hub-proxy ownership leg — that leg is now the M-HUB-27
  byte-identical-404 law (hub `ServerProxyController.php:1029` era, which never
  emits `not_owned`). Its cites now name the owner-known emitting surfaces hub
  `ServerManageController.php:73,117`, `ServerDetailController.php:92` and
  `ClientRelayTokenController.php:103`.
- **Build bytes:** `dist/errors.d.ts` and both source maps re-vendored (docblock
  text + the two added header-stamp lines shift `sourcesContent`/VLQ); the JS
  bundle `dist/phlix-contracts.js` is byte-identical and the frozen trio
  `dist/error-codes.json` / `dist/server-route-manifest.json` /
  `dist/mcp-scopes.json` md5s all held unchanged. Zero registry values moved,
  zero new wire codes.

## [0.5.5] - 2026-11-03

### Added — one RESERVED mint: `common.not_found` (census 204 → 205) + three no-byte wave rulings — contracts wave over `.reviews/CONTRACTS-WAVE-BRIEF.md` — 2026-11-03

- **⚠ Numbered as a patch, but TYPE-breaking for exhaustive consumers.** Under
  the `src/errors.ts` SEMVER & COMPATIBILITY union-growth law, this release
  grows the `ErrorCode` union by one member, so any consumer holding an
  exhaustive `Record<ErrorCode, string>` / `switch` with a `default: never`
  reddens at re-pin (TS2741 class) before it can ship the new row. Measured
  victim, named so nobody rediscovers it: **phlix-ui** keeps seven such catalogs
  — `EN`/`ES`/`FR`/`DE`/`IT`/`PT_BR`/`JA` at `src/i18n/errors.ts:47,336,602,837,1074,1308,1542`,
  all typed `PhlixErrorCatalog = Record<ErrorCode, string>` — so re-pinning to
  this tag reds **7 typecheck errors** until a `not_found` row lands in each
  locale. Mobile's `syncplayErrors` is `Record<SyncPlayErrorCode, string>` and
  the `syncplay` domain did not move, so it is NOT in the blast radius. The wire
  itself stays additive: no existing code changed a byte or an order.
- **`common.not_found` (RESERVED, `not_found`).** Registered on request
  (R-HUB-W2-C1) for the hub's two unmatched-route fallbacks: hub
  `AuthController.php:67` (the `default =>` arm of the `/auth/{action}`
  dispatcher — 404, body `['error' => 'Not Found']`) and hub `Router.php:443`
  (`notFound()` — 404, body `['error' => 'Not Found', 'message' => …]`). Both
  emit prose-only bodies with no `code`, and the hub's own vendored-registry
  law (`tests/Unit/Contracts/ErrorCodesContractTest.php`) forbids emitting an
  unregistered word — this entry is that permission. The entry docblock records
  the unification ruling the hub leg implements: one human sentence co-mirrored
  in `error` AND `message` (the pinned `extractError` read order is
  error-then-message), the machine word in `code`, and the sentence chosen is
  Router's shipped `The requested resource was not found` rather than the HTTP
  phrase `Not Found` — the latter is on the hub envelope test's member-facing
  HTTP-phrase ban list. Kept undotted on purpose: the fallback knows no
  resource, which is why the generic word was never registered before. **No wire
  byte carries it until the hub flips the two literals and rotates its own
  fixture + law pins in the release that pins this tag.**
- **Three rulings that move NO registry bytes.** (1) R-TIZEN-W2-C1 — the
  QuickConnect approve rail's vocabulary is verified COMPLETE at srv
  `20a4749d`: the six `quickconnect` rows plus `common.invalid_request`
  (:259, :302) and `common.invalid_payload` (:381-:407) are every literal the
  controller emits, and `POST /api/v1/auth/quick-connect/{code}/approve` is
  already in the generated manifest. An external approver surface needs no mint;
  what is missing is a client that offers the button (ui/mobile feature ask).
  (2) R-SP-W2-01 — `legacy.PROTOCOL_VERSION_MISMATCH` is ruled THE registered
  protocol-version refusal rail (`:8097` emits it and drops the frame); no
  dotted `syncplay.*` twin minted for the same condition. The rest of that wave
  item (a one-time "client too old" signal, the `:8804` inbound value-check, the
  MUST read of `protocol_version` on every receiver) is handshake law for the
  syncplay SPEC and its producers, and rides as a cascade item; if the wave
  later needs its own code, that arrives as a fresh mint. (3) R-SRV-W2-03 — the
  playback-position unit question is answered by what already ships here:
  `src/ticks.ts` IS the estate's normative unit table (100-ns ticks;
  `TICKS_PER_SECOND` = 10,000,000 plus `_MINUTE`/`_HOUR`), re-confirmed against
  the server's own payload example at srv `f50e2df3` (`position_ticks:
  36000000000` at `progress_percent: 45.5` = 60 minutes) and against `media.ts`
  (`resume_position_ticks`, `playback_position_ticks`). The file header now
  states the three-scale map on purpose, so nothing conflates ticks with the
  MILLISECONDS of SyncPlay group state (`SyncPlay.ts`) or the MINUTES of
  `run_time`. The undecided halves stay open by design — a parallel `_ms` key on
  the REST rails, and whether server payload docblocks name the unit inline —
  both producer-side calls tracked for v0.5.6; no field's meaning moved here.
- **Dist moves INTENTIONALLY:** `dist/error-codes.json` 204 → 205 codes, md5
  `40c1da48787f37d00a6fc9af6c64a1ac` → `5d1783a71a3c4e128b2021327cad3717`
  (ordered insertion at the end of `common`; every existing position untouched),
  plus `errors.d.ts`, both bundles and both maps. The other two artifacts of the
  trio are FROZEN and re-asserted: `dist/server-route-manifest.json` stays
  `915796837d38a77733c169996d97640c` (412 tuples @ srv `758f9149` — no route
  added this wave) and `dist/mcp-scopes.json` stays
  `8c92c0703eae8a429c509ff16e0d185d`. Build ×2 deterministic, whole-dist
  aggregate md5 `63cfaa33306d4429299609618090a228` (the wave's three
  doc-block-only rebuilds each re-emit the maps and `.d.ts`; the bundles and all
  three registry JSONs are byte-stable across them). The wave docblocks'
  coordinates on sites that do not emit this word yet are prose (`line NN`), not
  `File.php:NN` cites — a cite on a pre-flip site is a claim the currency
  tripwire cannot check, and the re-anchor wave converts them when the producers
  flip. `npm run verify:cites` reports zero problems in any region this wave
  touched — measured twice, at hub `51e415ee` / srv `f50e2df3` and again at the
  release prep against hub `51e415ee` / srv `358719c4`: `ok=270 problems=159`
  both times, and every one of the 159 is pre-existing estate drift owned by the
  tag-wave re-anchor (it does not gate the cut; no shipped artifact reads
  docblock coordinates).
- **Test pins updated by measurement, in the adding commit:** the mint reddened
  exactly four assertions — the exact-count pin (204 → 205), the `common`
  ordered-list pin (extended with the RESERVED provenance note), and the two
  committed-`dist/error-codes.json` freshness pins (ordered-vocabulary mirror +
  byte-identical re-emit). Suite holds 171/171 serial across 14 files; no new
  test was needed (the family pattern for one additive row is pin extension).
- **Consumers that owe work at re-pin (this is the cascade list, not a claim
  that any of it is done here):** phlix-server and phlix-hub must re-vendor the
  byte-copy fixtures (`tests/Fixtures/Contracts/error-codes.json`,
  `tests/fixtures/contracts/error-codes.json`) and rotate their md5/count pins;
  phlix-hub additionally owns the two producer flips +
  `ErrorCodesContractTest`/`ErrorCodesOpenApiEnumContractTest` law pins;
  phlix-ui must add the `not_found` row to all seven locale catalogs (⚠ above);
  tizen/windows/mobile/roku carry prose pin-cites of `40c1da48…`
  (`phlix-tizen-client/tests/unit/routeManifest.gate.test.ts:69`,
  `phlix-windows-client/scripts/lockwalk.mjs:161`,
  `phlix-mobile-client/src/__tests__/syncplay/syncplayErrors.test.ts:31`) that
  are comment-only at their pins and advance when those repos next move codes.

## [0.5.4] - 2026-11-02

### Changed — v0.5.4: additive exports surface + whole-dist freshness gate + release law and docblock truths — **registry byte-FROZEN this mint** (no mints; 204 codes / 412 tuples / 4 scopes held)

- **No ⚠ callout to carry — zero codes minted.** Under the `src/errors.ts`
  SEMVER & COMPATIBILITY union-growth law this release itself adopted
  (M-CONTRACTS-01/06), mint-class entries must carry the TS2741-class
  type-break warning for exhaustive consumers; this release ships **no
  registry growth** — all three artifacts byte-frozen since `v0.5.3`
  (`error-codes.json` md5 `40c1da48787f37d00a6fc9af6c64a1ac`, 204 codes /
  37 domains; `server-route-manifest.json` md5 `915796837d38a77733c169996d97640c`,
  412 tuples @ srv `758f9149`; `mcp-scopes.json` md5
  `8c92c0703eae8a429c509ff16e0d185d`, 4 scopes), md5-proven at tag↔master
  and re-asserted after fresh rebuilds at this prep commit. A consumer
  re-pinning `#v0.5.3` → `#v0.5.4` sees **no union member added**: no
  exhaustive `Record<…ErrorCode, …>` map or `default: never` switch can
  break in this bump class (the mobile TS2741 incident class — absent by
  construction).
- **Additive import surface (`fa6a435`, M-CONTRACTS-02):** the `exports`
  map now ships the three md5-pinned registry-JSON subpaths +
  `./package.json`, types-first order — estate consumers can import the
  canonical artifacts instead of vendoring byte copies. `sideEffects:
  false` and the `source-map-js` override ride the same batch (`709abc1`).
- **CI gate hardening (`be98131`, M-CONTRACTS-03/05):** committed-
  freshness check folded from three JSON diffs to the WHOLE `dist/` tree
  — stale bundles, `.d.ts` and sourcemaps can no longer ship inside a
  tag; mutation-proven at the step itself.
- **Release law + docblock truths:** the union-growth header (`0919f63`,
  M-CONTRACTS-01) and its README twin; `ServerSettings` authority claim
  retired to measured partial-mirror honesty (`b33bf55`, M-CONTRACTS-04);
  the registry-growth forward-correction entry (`0d56622`, M-CONTRACTS-06);
  CHANGELOG banner hygiene — tag-proven headers for `0.5.1`/`0.5.0`/
  `0.4.7` (`dc5d387`, M-CONTRACTS-07) and the single-top `[Unreleased]`
  fold (`33c6c0c`, W-min25).
- **Minors batches W-min26/-27/-28** (`addc3a8`/`2ca4877`/`709abc1`,
  16 items): ES2019 build target (compatibility contract), route-manifest
  generator authz-semantics cure, README legend/Usage/assumption truths,
  `verify:cites` anti-vacuity exit floor + Node-floor dev docs, errors.ts
  tense and wording cures, dotted-name correction.
- **Cite-currency sweeps — comment-only, zero wire movement:** `54977ea`
  (13 spans @ hub `256aa25f` / srv `c42e166a`), `6519b53` (74 spans @
  `5a048a6` / `f4326191`), `53b5d7a` (provider helper cites), `adcacab`
  (3 spans @ srv `e55e0ee0`), `bcb6bab`/`ecbb00c` (syncplay family +
  `rate_limited` re-anchors), `da06733` (53 spans @ hub `250486c` / srv
  `99eda9c0`), `e615acd` (R-CONTRACTS-01 claim-exchange cluster @ hub
  `5b9de574` / srv `0fa8f515`); the deferred-mint pair flipped RESERVED →
  LIVE doc-side (`0be4146`) once hub `f44275f` + srv `7baa398a` landed
  the wire.
- **Honest tripwire state at cut (disclosed, non-gating):** `verify:cites`
  is a DEV-ONLY tripwire, deliberately not a CI step (needs sibling
  checkouts). Measured at this prep commit: exit 1, `ok=334 problems=95`
  against sibling tips hub `de19413e` / server `5980afc4` (planner's
  pre-server-move read at tag-wave planning was `ok=354 problems=75`;
  the delta is later server LDAP/SyncPlay churn — pre-existing currency
  debt, NOT introduced by any entry in this release). The full estate
  re-anchor is **Wave 3's remit** (`.reviews/TAGWAVE-MATRIX.md` §1.3-P4);
  it does not gate this cut because cite coordinates live in docblocks
  only — no shipped wire or type artifact reads them.
- **Gate evidence (at this prep commit):** `npm run build` ×2
  deterministic; whole-dist committed-freshness `git diff --exit-code --
  dist/` = 0 (bundles embed no package version — the bump moves no dist
  bytes); vitest serial **171/171** (14 files); `npm run lint` clean;
  trio md5 re-asserted post-build (emitters re-derive from frozen src).
- **Fold mechanics (verbatim-history law):** the previous `##
  [Unreleased]` header takes its released identity `## [0.5.4] -
  2026-11-02`; entry bodies are untouched. A fresh empty `[Unreleased]`
  placeholder stays at the top. Pre-`v0.5.3` detail entries that rode
  under the old banner since the tag prep (`430981e` left them there) are
  re-bannered to a batch-2 carried-forward header at their true boundary
  below — W-min25/M-CONTRACTS-07 precedent, headers only, bodies verbatim.

### Fixed — `src/errors.ts` gains the SEMVER & COMPATIBILITY union-growth law; mint releases documented as TYPE-breaking for exhaustive consumers (M-CONTRACTS-01) — 2026-10-30

- **Premise (verified at fix tip):** the module header carried DOCTRINE /
  SHAPE / NAMING / COORDINATE CURRENCY and zero semver-growth law; grep for
  `semver|exhaustive|TS2741` over `src/errors.ts` hit nothing. The README
  half of the finding was already cured at W-min28 (the Conventions
  break-on-upgrade bullet, README.md:132) — disclosed, not re-landed. This
  commit lands the remaining durable half: the header itself.
- **Cure:** new `SEMVER & COMPATIBILITY (union-growth law)` header section
  stating, at the vocabulary's own source: mints land last-position per the
  repo's precedent (`v0.5.1` +55, `v0.5.3` +2); the numbering is wire-true
  and type-false for exhaustive `Record<…ErrorCode,…>`/`default: never`
  consumers (TS2741-class break at re-pin — the mobile cascade named as the
  real incident); break-on-upgrade is by design; `Partial<Record<…>>` +
  default is the must-not-break posture; the PHP-side fixture-pin-rotation
  counterpart; and the going-forward release law adopting the 0.3.12
  ⚠-callout wording for every mint entry (cross-referenced to the
  M-CONTRACTS-06 forward-correction CHANGELOG entry).
- **Bundle-law movement, kept together:** src + `dist/errors.d.ts` (+23
  comment lines) + both committed sourcemaps (header line-shift only) in one
  commit. `dist/phlix-contracts.js`/`.umd.cjs` bytes UNMOVED; all three
  registry JSONs byte-frozen (md5 `40c1da48`/`91579683`/`8c92c070` held).
- **Tripwire-neutral by construction:** the section cites no hub/server
  file coordinates; `npm run verify:cites` reads `ok=354 problems=75` before
  AND after (pre-existing owner tag-wave debt, disclosed raw — see the
  header's own COORDINATE CURRENCY paragraph). Suite 171/171 serial, lint
  clean, build deterministic.

### Fixed — `ServerSettings` authority claim retired: honest partial-mirror docblocks, measured drift disclosed (M-CONTRACTS-04) — 2026-10-30

- **Premise re-measured at fix time against `phlix-shared` master**
  (`server-settings.schema.json`, 84 properties): the 19-key interface lacks
  **72** schema keys (the whole F7 `auth.<provider>.enabled` quintet, the
  rate-limit/webhooks/DLNA families) and advertises **7 ghost keys** the
  schema no longer defines (server 400s them: `subtitles.enabled`,
  `subtitles.burn_in_by_default`, `hwaccel.probe_timeout`,
  `marker_detection.similarity_threshold`, `marker_detection.intro_max_duration`,
  `discovery.discovery_port`, `trickplay.interval_seconds`). (The review era
  read 73 missing against an older shared tip; 72 is the truth at this stamp.)
- **Cure (the review's bottom line, "Do not keep the claim"):** the interface
  docblock and the `src/library.ts` file header no longer claim "the exact
  allow-list" / "mirrors the schema"; they name the real SSOTs — the shared
  schema + the runtime `meta` block of `GET /api/v1/admin/settings` (the same
  retirement law `phlix-ui/src/types/server-settings.ts` records) — spell out
  that absence ≠ not-writable and presence ≠ writable, and enumerate the
  ghosts with the measurement stamp.
- **API shape deliberately NOT moved:** deleting the public export or
  build-deriving the type from a vendored schema is a breaking type-shape
  change in a git-tag-pinned package — owner tag-wave territory, named in the
  docblock itself. The shipped `.d.ts` delta is comment-only (diff proof:
  zero non-comment lines); all three registry JSONs byte-frozen.
  `test/types.test.ts:385` two-key pin green UNMODIFIED; suite 171/171.

### Fixed — CI committed-freshness gate folded from three JSONs to the WHOLE `dist/` tree — bundles, `.d.ts` and maps can no longer ship stale in the tag (M-CONTRACTS-03 + M-CONTRACTS-05) — 2026-10-30

- **Premise (verified at tip):** `ci.yml` ran `npm run build` then exactly
  three `git diff --exit-code` steps — `dist/error-codes.json`,
  `dist/mcp-scopes.json`, `dist/server-route-manifest.json`. The build ALSO
  rewrites `dist/phlix-contracts.js`, `.umd.cjs`, all `*.d.ts` and the
  maps — none of those had a freshness gate, so a src change committed
  without re-running the build shipped a stale runtime bundle and stale
  types inside `"files": ["dist"]` with CI fully green. Both reviews (fedev
  M2 / seceng M2 — this repo's twin queue IDs) name the same defect; the
  whole-tree fold is seceng's stated stronger shape and subsumes fedev's
  per-file list.
- **Cure:** single `git diff --exit-code -- dist/` step after the build,
  with the doctrine comment rewritten honestly (determinism rationale: the
  emit scripts derive `generatedAt` from TS provenance, not wall-clock).
- **Prerequisite proven, not assumed:** full rebuild at this tip leaves
  `dist/` byte-clean. **Teeth proven by index-level mutation** (no commits
  touched): a planted stale `dist/error-codes.json` blob reddens the step
  (exit 1, restored 0) — and a planted stale `dist/index.d.ts` reddens it
  too, the exact class the three-JSON gates were blind to. Workflow YAML
  re-parsed with `yaml.safe_load`: valid.
- **Zero artifact movement:** workflow + CHANGELOG only; `dist/` bytes and
  all three md5 pins untouched.

### Fixed — `exports` map now ships the three registry JSON subpaths the estate md5-pins (M-CONTRACTS-02) — 2026-10-30

- **Premise (verified at tip):** `exports` admitted only `"."` and
  `"./package.json"`, so `@phlix/contracts/dist/error-codes.json`,
  `dist/mcp-scopes.json` and `dist/server-route-manifest.json` — the canonical
  artifacts the estate md5-pins — were NOT importable under Node ESM/vite
  (`ERR_PACKAGE_PATH_NOT_EXPORTED`). The ui vendoring + md5/sha pin ceremony
  (and the tizen `package/` copies) exists because of this field.
- **Cure:** explicit subpath entries for exactly the three JSONs (narrower
  than the `"./dist/*"` wildcard alternative — no incidental file exposure).
  Purely additive: zero bytes move in `dist/`, zero behavior change for any
  consumer importing `"."`.
- **Live proof:** Node self-reference import of all three subpaths resolves
  green post-fix (JSON assertions pass), and an unlisted `dist/` path still
  throws `ERR_PACKAGE_PATH_NOT_EXPORTED` — the map is teeth-live, not widened
  past the contract.

### Fixed — forward-correction: registry-growth releases are TYPE-breaking for exhaustive consumers; the "Additive only" label is wire-true and type-false (M-CONTRACTS-06) — 2026-10-30

- **What the `[0.5.3]` entry underplays (entry itself kept verbatim):** its
  "**Additive only.**" bullet is true of the wire vocabulary and the JSON
  registry bytes, but the two mints widened the exported `ErrorCode` union
  (via the federation + syncplay domains) and the `SyncPlayErrorCode` family
  19 → 20 (202 → 204 census). For any consumer holding an exhaustive
  `Record<…ErrorCode, …>` map or a `switch` closed with `default: never`, a
  union growth is a COMPILE-TIME BREAK the moment it re-pins — not an
  addition. This is documented-true, not hypothetical: the estate's own mobile
  client hit TS2741 on `queue_limit_exceeded` re-pinning at this exact tag and
  needed a coordinated catalog fix (the v0.5.3 consumer-cascade record).
- **Same law, earlier victim:** the W1b expansion shipped as `v0.5.1` under
  "strictly additive" prose while growing the union 147 → 202 (a 39%
  widening) with no type-consumer warning.
- **Going-forward release-note law (durable statement now in the
  `src/errors.ts` module header, SEMVER & COMPATIBILITY section, and the
  README Conventions break-on-upgrade bullet):** every release entry that
  mints registry codes carries the type-level-break callout in the words of
  the repo's own 0.3.12 precedent — "⚠ Numbered as a …, but … **breaking** for
  any consumer that had exhaustively switched on the old … union. The number
  understates it." — plus the PHP-side counterpart line (registry-JSON
  fixture-pin rotation), which `v0.5.3` already shipped for that audience.
- **History untouched:** the `[0.5.3]`, W1b and W1 entries stay verbatim per
  the house history-verbatim rule; this entry is the correction-forward.
  CHANGELOG-only; `dist/` bytes untouched.

### Fixed — CHANGELOG version-banner hygiene: the three orphaned published tags get their headers (M-CONTRACTS-07) — 2026-10-30

- **What was broken:** tags `v0.5.1`, `v0.5.0` and `v0.4.7` existed on the
  remote but had no `## [x.y.z]` sections — their shipped content (including
  the entire W1b +55-code expansion, the largest registry change in the
  package's life) sat under neighbor banners. A consumer scanning "what
  shipped in 0.5.1?" could not locate it.
- **Forward-only cure (no history rewrite, per the review's own shape):**
  inserted `## [0.5.1] - 2026-09-23`, `## [0.5.0] - 2026-09-23` and
  `## [0.4.7] - 2026-09-13` immediately above their entry blocks. Tag→content
  mapping proven from git, not memory: at tag `v0.4.7` (`625a5625`) the newest
  entry is W83; at `v0.5.0` (`8ef65d30`) the additions since are W1/W111/W89/
  W85; at `v0.5.1` (`e3c14f07`) the addition is W1b alone. Dates from
  `git log -1 --format=%ad` on each tag. Entry bodies verbatim.
- **Already cured before this commit (disclosed, not re-landed):** the
  three-`[Unreleased]`-banners and ordering half of the finding was folded by
  W-min25 (`144`-era entry, disk-verified at this tip): one `[Unreleased]` at
  the very top, the interleaved duplicates renamed
  `[0.5.3]`/`[0.5.2] — carried-forward notes`.
- **Zero artifact movement:** CHANGELOG only; `dist/` bytes untouched.

### Fixed — W-rMOP1 rider: claim-exchange cites re-anchored at hub `5b9de574` / server `0fa8f515`; header currency stamp re-cut — 2026-10-30

- **Trigger (R-CONTRACTS-01, from the `M-HUB-12` disclosure).** The hub claim
  refactor retired the per-guess `logFailedAuth` blocks and restructured
  `ClaimRequestHandler` / `ServerClaimController`, shifting the claim-code
  throw and `mapError` sites — the disclosure predicted ~4 lines; against the
  actual origin/master tips the drift is +76 to +170 (later claim-lane churn
  stacks on the disclosed removals). Re-anchored AT SOURCE (not by blanket
  delta) against FRESH clones of hub `5b9de574` and server `0fa8f515`, every
  emit re-read before taking its number — the shared sibling working trees
  carry live fixer lanes and were deliberately not consulted.
- **Cites moved (six comment blocks, the full claim-exchange cluster):**
  `claim.code_not_found` → throws at `ClaimRequestHandler` 288/326, 404 arm
  254-259 (anchor 256); `claim.code_expired` → throw 340, 410 arm 260-265
  (262); `claim.code_already_claimed` → throw 349, 409 arm 266-271 (268);
  `server.key_invalid` → the four JWK-structure throws 677/680/683/687, 400
  arm 296-301 (298); claim-route `auth.unauthenticated` → 200. The rider's
  three named cites plus its two same-file siblings — one physical drift,
  one honest unit; nothing outside the two claim files was touched.
- **Comment-only proof.** Bundles rebuild cmp-IDENTICAL
  (`phlix-contracts.js` `6c6039eb…`, `phlix-contracts.umd.cjs` `b1184fe7…`);
  the frozen trio holds byte-ident — `error-codes.json`
  `40c1da48787f37d00a6fc9af6c64a1ac` (204 codes), `server-route-manifest.json`
  `915796837d38a77733c169996d97640c` (412 tuples), `mcp-scopes.json`
  `8c92c0703eae8a429c509ff16e0d185d`. `errors.d.ts` and the two bundle maps
  carry the docblock delta; `sourcesContent` moves only in the `errors.ts`
  entry and byte-matches disk. Parsed-cite census holds at 429.
- **Tripwire state (honest, disclosed).** `npm run verify:cites` against the
  fresh clone tips: before this entry `ok=361 problems=68`, after `ok=378
  problems=51` — the 17 greened coordinates are exactly the claim cluster.
  The 51 residuals (hub proxy/share/invite/mount churn, three mixed-file
  claim-controller cites in the `hub` section, two srv `SyncPlayManager`
  wraps) are pre-existing currency debt owned by the owner tag-wave full
  re-sweep, untouched here by scope, not introduced here. `test:run`
  **171/171** · eslint clean · `tsc --noEmit` clean.
- **No new tag, no version bump** — docblock/CHANGELOG/dist-re-derivation
  only; nothing a tag-pinned consumer resolves changes value.

### Fixed — W-min28 minors cluster: ES2019 build target (compatibility contract); README break-on-upgrade Record law + syntax-ceiling note; `sideEffects: false`; cite-walk symlink hardening — 2026-10-30

- **Compatibility target (fedev):** `vite.config.ts` pins
  `build.target: 'es2019'`, turning the bundle's syntax ceiling from an
  accident of the vite default into a mechanical guarantee — esbuild now
  LOWERS optional chaining and friends (pre-cure `dist/phlix-contracts.js`
  carried `?.` at :427). README Conventions states the ceiling for the TV
  webview consumers that load `dist/` directly. Bundles re-emitted
  (ES `43267ee2…` → `6c6039eb…`, UMD `453d2a1f…` → `b1184fe7…`, maps with
  them); both formats runtime-smoke-tested; the three byte-frozen JSONs
  re-verified UNCHANGED (`40c1da48…` / `91579683…` / `8c92c070…`).
- **Exhaustive-Record law (fedev):** README Conventions now documents the
  break-on-upgrade contract for `Record<…ErrorCode, …>` consumers — additive
  mints are minor bumps, consumers must add the new rows (or pin
  `Partial<…ErrorCode, …>` + default fallback), and a red type-check on the
  upgrade is by design. Release entries that move registry bytes carry this
  standing line (forward-only practice; history sections stay verbatim).
- **Tree-shaking honesty (fedev):** `package.json` declares
  `"sideEffects": false` — true for a constants + pure-functions package, and
  it stops Metro (mobile) paying the flattened-bundle retention tax.
- **Symlink recursion (seceng m3):** `walkPhp` in
  `scripts/check-error-cites.mjs` switched `statSync` → `lstatSync`: a
  symlinked directory cycle inside a sibling checkout previously crashed the
  dev tool with an uncaught `ELOOP` (probe-verified both sides); the walk now
  skips symlinked dirs and still reads symlinked `.php` files normally.

### Fixed — W-min27 minors cluster: README codecov-badge removal, `verify:cites` + Node-floor dev docs, three-artifact self-description; `exports` types-first; `verify:cites` anti-vacuity exit floor — 2026-10-30

- **Codecov badge (docmaint / writer, same defect twice):** the README badge
  advertised a Codecov integration that has never existed in this repo — CI
  uploads coverage to Codacy only (`ci.yml`). The badge line is deleted;
  standing up a real Codecov/Codacy-badge upload is a CI-lane decision, not a
  doc edit.
- **`verify:cites` discoverability (docmaint / fedev, same defect twice):** the
  README Development block now carries the command with its sibling-checkout
  precondition and its deliberate NOT-in-CI status, plus a line naming the
  build toolchain floor: CI builds on Node 24 while `engines.node >=18`
  describes the CONSUMABLE dist, not the vite-8 build.
- **Self-description (writer):** README intro, `package.json` `description` and
  the `src/index.ts` module docblock now name all three most-consumed artifacts
  — the estate error-code registry, the server route manifest, and MCP scopes —
  "shared across every Phlix client and both servers". `dist/index.d.ts`
  re-emitted for the docblock gutter only (bundles and sourcemaps carry no
  source comments — byte-ident); the three byte-frozen JSONs untouched
  (`40c1da48…` / `91579683…` / `8c92c070…` held).
- **`exports` condition order (fedev):** `"types"` moved FIRST in the `"."`
  object so node16/nodenext resolvers cannot fall through the JS conditions
  before seeing the declaration map.
- **Vacuous pass (seceng m2):** `scripts/check-error-cites.mjs` now exits 2
  when fewer than `MIN_VERIFIED_CITES` (400) cites were parsed at all — a
  `CITE_RE` grammar break can no longer "pass" by verifying nothing. Floor
  measured against 429 parsed (ok=364, problems=65) at this stamp; the 65
  drift reds are the owner-queued re-anchor wave input, untouched here.

### Fixed — W-min26 minors cluster: route-manifest authz-semantics cure (generator + generated header); README legend + Usage assumptions; errors.ts pending-promote tense; claimCode/hub-UI wording; SyncPlayRoom deprecation label — 2026-10-30

- **Manifest authz semantics (seceng m1):** `src/routeManifest.generated.ts` and the
  `scripts/generate-server-route-manifest.mjs` template that emits it now state what the
  list does NOT say: it records ROUTING at the recorded server commit, not authorization
  — runtime checks (maintenance, registration, auth, ownership, rate limits, schedules,
  subscriptions) all happen outside it, a listed entry never proves permission and an
  absent entry never proves non-service. "EVERY client route gate" is now "every client
  route EXISTENCE gate". The emitted JSON `$comment` stays un-rotated by design: the
  manifest md5 is byte-frozen for the cs#22 consumer cascade — comment rotation is a
  coordinated re-vendor leg, not a minors batch.
- **README (writer MIN-3/6/8):** new "Reading conventions" legend under Development
  glossing the notation the package uses throughout (`(+N)`, `#NNN`, `SNNN`, emit-wave
  tags, tripwire, mint, carrier, dual placement, stamp); the Quick-start example now
  states where `accessToken`/`sessionId`/`item` come from; the modules table marks
  `SyncPlayRoom` a deprecated alias (matching `src/SyncPlay.ts`'s `@deprecated`).
- **errors.ts tense (writer MIN-7):** the seven pending emit-wave notes ("the
  (server )emit-wave promotes it/them …") now read "will promote" — every one of those
  waves is still future (each site says clients match in `error` text until then); the
  landed past-tense forms ("was promoted by the server W2 emit-wave") are untouched.
  (writer MIN-8 sibling: `src/hub.ts` `ClaimResponse.claimCode` says what actually
  happens — the server owner pastes the code into the hub web UI; "portal" named
  nothing this estate serves.)
- **Measured:** vitest 14 files / 171 tests green (baseline-identical); eslint +
  `tsc --noEmit` clean; build ×2 deterministic; the canonical dist artifacts are
  byte-identical (`phlix-contracts.js` 43267ee2…, `phlix-contracts.umd.cjs` 453d2a1f…,
  error-codes `40c1da48…`, route-manifest `91579683…`, mcp-scopes `8c92c070…` — the
  frozen trio held); only docblock-carrying d.ts files and the two bundle maps
  (sourcesContent) moved. `verify:cites` unchanged at ok=364/problems=65 — the 65 are
  pre-existing currency drift against moved sibling trees, not introduced here.

### Fixed — W-min25 minors cluster: README install cure recorded; `[Unreleased]` structure folded; errors.ts currency header slimmed; dotted-name correction — 2026-10-30

- **README install idiom (cure `e39ed2b`, recorded here per this file's own
  "all notable changes" promise):** the Install section had instructed
  `npm install @phlix/contracts` for a package that is not published to the
  registry — a trap for exactly the tag-pinned consumers this repo serves.
  Corrected to the `github:detain/phlix-contracts#<tag>` form.
- **Notation correction (forward; history kept verbatim):** the pre-`v0.5.3`
  "two deferred mints" entry below prints
  `federation.leaf_hub_id_already_bound`; the registered wire value is the
  BARE `leaf_hub_id_already_bound` (the `v0.5.3` section spells it correctly)
  — the dotted federation-domain form has never existed on the wire and must
  not be pinned. Sanctioned prose spellings in this package: the wire value
  itself, or `DOMAIN.KEY` uppercase for registry coordinates. The
  `user.NOT_FOUND` entry comment carried the same defect class
  (`admin.user_not_found`; the admin-domain wire value is bare
  `user_not_found`) and is corrected in place.
- **CHANGELOG structure:** the live `[Unreleased]` now sits above
  `[0.5.3]` as Keep a Changelog prescribes (the file's own header claim);
  the two stale duplicated `[Unreleased]` headers that sat between released
  sections are renamed to carried-forward notes of `[0.5.3]` / `[0.5.2]` —
  the releases that actually shipped their content. Entry text untouched,
  verbatim (house rule).
- **`src/errors.ts` module header:** the append-only coordinate-currency
  narrative (twelve re-anchor eras re-narrated in full — duplicating the
  CHANGELOG, with visible gutter-indent accretion — net −168 lines)
  collapses to doctrine + ONE current stamp; the sweep forensics live in
  the CHANGELOG alone. The narrative had carried thirteen parsed cites of
  its own (two drifted `RelayProxyManager` follows + eleven passing
  spot-verification refs), retired with it: the `verify:cites` parsed
  census moves 442 → 429 accordingly.
- **Comment-only proof.** `src/errors.ts` and `dist/errors.d.ts` diffs are
  100% comment gutters (mechanical check: zero changed non-comment lines).
  Registry bytes frozen: `dist/error-codes.json` md5
  `40c1da48787f37d00a6fc9af6c64a1ac` (204 codes); route manifest
  `915796837d38a77733c169996d97640c` (412 tuples) and `dist/mcp-scopes.json`
  `8c92c0703eae8a429c509ff16e0d185d` untouched. Bundles `dist/phlix-contracts.js`
  (`43267ee2…`) and `dist/phlix-contracts.umd.cjs` (`453d2a1f…`) rebuild
  cmp-IDENTICAL; `errors.d.ts` carries the −168 docblock-line delta (+11/−179,
  same disclosed class as the +31/+17 carries above). Maps: exactly the 857
  segments whose source is `../src/errors.ts` move by a uniform −168
  sourceLine delta (VLQ re-encode; genCol/sourceCol/nameIndex otherwise
  unmoved; non-errors.ts segments byte-ident; `sourcesContent` moves only in
  the errors.ts entry, byte-matching disk). One disclosed toolchain-era
  artifact rode the honest rebuild: the committed maps had been emitted with
  `names: []` while the CURRENT lock's toolchain materializes names (112
  entries, 266 nameIndex-bearing segments) — proven by a control rebuild at
  clean `e39ed2b` in a throwaway worktree BEFORE this commit's source edits,
  which moved the maps identically; the bundles and all three JSON mirrors
  are byte-stable across both eras, so nothing consumer-pinned depends on
  it. `dist/` re-derived here; aggregate md5 `ea8feca7df504edf2898d0a2dea61cb7`
  build ×2 deterministic.
- **Tripwire state (honest, disclosed).** `npm run verify:cites` against the
  EXISTING sibling working trees: at HEAD `ok=375 problems=67` (442), here
  `ok=364 problems=65` (429) — hub `0558d83e` / srv `3012bba9` (the latter
  the known local ghost-divergence tree, 4 paths dirty) have both moved
  since the stamped base `250486c`/`99eda9c0`; the 65 reds are pre-existing
  entry-currency debt for a separate re-anchor sweep (da06733 precedent),
  not introduced here. `test:run` **171/171** · lint clean · build green.
- **No new tag, no version bump** — docblock/CHANGELOG only; nothing a
  tag-pinned consumer resolves has changed (the `v0.5.3` line ships the same
  registry bytes as before this entry).

### Changed — docblock cites re-anchored at hub `250486c` / server `99eda9c0` (49 flagged drifts + 4 window-masked, SRV-HTTP handoff + hub lanes; tripwire 442/0) — 2026-10-15

- **Trigger: the SRV-HTTP lane's close report (tip `fa68f6ca`) handed off the
  re-anchor duty; executed as a full tripwire re-sweep.** The first run
  measured **ok=393 problems=49** (442 cites) against the sibling working
  trees; the report's own shift table was under-inclusive — the tripwire also
  caught drifts the handoff missed (srv `Workerman/HttpHandler.php` 194, hub
  `Application.php` 204, and the whole hub `ClaimRequestHandler.php` claim
  family from the R19/R20 hub-DB lanes), plus four **window-masked stale cites**
  the ±3 proximity check let pass on coincidental tokens (the bare `:688` and
  `:1875` follows in the syncplay comments). All 53 coordinates re-read at
  source, not by blanket delta.
- **Family moves.** srv `Core/Application.php` 429 emit 2827 to 2837 (SRV-HTTP
  reaper/throttle insertions above it; both the sweep-stamp narrative cite and
  the `common.RATE_LIMITED` entry re-anchored); srv `Workerman/HttpHandler.php`
  CSRF gate 194 to 203 (85c06de1 static-path denial); hub `Application.php` 429
  emit 204 to 237 (23a96bf/57b7d88); hub `ClaimRequestHandler.php` throws 205 →
  212, 232 to 248, 242 to 260, 249 to 267, and 455,458,461,465 to
  497,500,503,507 (85b1929 + 2b04edb claim transaction and audit arms — the
  four JWK throws are an identical +42 relocation); the srv
  `SyncPlayManager.php` family moved 626 to 636, 629 to 639, 688 to 698,
  780 to 790, 828 to 838, 833 to 843, 1042/1050/1055 to 1058/1066/1071,
  1403/1408/1413 to 1419/1424/1429, queue-cap guard 1240 to 1253 (literal
  riding 1256), create wrap 1790 to 1806, leave emit 1875 to 1914.
- **Join wrap semantic re-anchor (the one REWRITE, not relocation).** The
  server R17-04 lane restructured the join tail: the `$result['error_code'] ??
  'syncplay.join_failed'` wrap is now the `$errorCode` local at line 1865,
  with the per-connection password-throttle arm rejecting-closing inline
  above the final send — the cite follows the wrap decision, and the legacy
  `JOIN_FAILED` entry comment gained a literal `syncplay.join_failed` anchor
  because the SCREAMING word no longer occurs near the wrap line.
- **Mid-sweep tip move, disclosed.** The server tree advanced `d8cce76c` to
  `99eda9c0` while the sweep ran (a sibling PSR-12 debt pass shifted the leave
  emit 1910 to 1914); every coordinate was re-verified against the stamped
  tips with both trees clean before commit.
- **Comment-only proof.** `src/errors.ts` diff has **zero changed lines
  outside comment gutters** (mechanical census). Registry bytes frozen:
  `dist/error-codes.json` md5 `40c1da48787f37d00a6fc9af6c64a1ac` (204 codes);
  route manifest `915796837d38a77733c169996d97640c` (412 tuples) and
  `dist/mcp-scopes.json` `8c92c0703eae8a429c509ff16e0d185d` untouched.
  Bundles `dist/phlix-contracts.js` (`43267ee2…`) and
  `dist/phlix-contracts.umd.cjs` (`453d2a1f…`) rebuild cmp-IDENTICAL;
  `dist/errors.d.ts` comment-stripped identical (raw delta = the +31
  docblock-line carry). Maps churn is pure VLQ source-line re-encode: both
  `.js.map` and `.umd.cjs.map` move exactly the 857 segments whose source is
  `../src/errors.ts` by a uniform **+31** sourceLine delta — zero other-field
  changes across all segments (genCol/sourceCol/nameIndex verified),
  non-errors.ts segments byte-ident; `sourcesContent` moves only in the
  errors.ts entry, byte-matching `src/errors.ts`. `adcacab`/`6519b53`
  precedent class.
- **Gates.** `npm run verify:cites` **ok=442 problems=0** exit 0 at hub
  `250486c` / srv `99eda9c0` · lint clean · `test:run` green ·
  `npm run build` re-derived dist (post-build the only dist churn is the
  comment-carry class above).

### Changed — docblock cites re-anchored at hub `8aba9c9` / server `e55e0ee0` (3 drifts, B2 provider-parity lane; tripwire 442/0) — 2026-10-07

- **Trigger: the tripwire fired as designed.** After the server B2
  provider-parity merge, `npm run verify:cites` measured **ok=439
  problems=3** at hub `8aba9c9` / srv `e55e0ee0` — exactly the three
  `provider`-family cites on `srv AuthProviderController.php`. All three
  drifted cites re-anchored; every other cite re-ran green unchanged at
  these tips.
- **All three drifts are pure relocations, re-read at source (not blanket
  delta).** Each cited statement is byte-unchanged — only its line moved:
  the enable-path 409 `'not_configured'` emit `143` to `154` (a +11
  zero-transaction design docblock inserted above it in `enableProvider`),
  the `unknownProvider` helper's 404 `'unknown_provider'` emit `226` to
  `264`, and the `getConfigSchema` registry-miss 404 `'provider_not_found'`
  emit `246` to `284` (both +38: the disableProvider B2 docblock and the
  restructured guard arm above them). The old coordinates matched the
  handoff's claims exactly.
- **Moved vs wrapped, stated honestly.** The disable refusal envelopes
  (422 `AuthMethodLockoutException` arm, 500
  `AuthMethodGuardCheckFailedException` arm) were WRAPPED in the new `guardAndPersist` protocol, not
  relocated — the 422 body lines are byte-identical, the arm restructured
  around the typed exception — and no registry cite rides them, so nothing
  changed doc-side there. No new `provider.not_configured`-style emit sites
  needed citing: `e55e0ee0` adds no new wire-code emitters (scope: comment
  currency only).
- **Stamped base.** Module-header currency stamp extended; base moves from
  hub `e5f5dd9` / srv `759b0a79` to hub `8aba9c9` / srv `e55e0ee0`. Hub
  `FederationController.php` is byte-unchanged since `e5f5dd9` (the only
  hub merges since are the SUPPLEMENTAL_META retirement and
  ServerProxyController doc prose — neither carries a registry cite).
- **Comment-only proof.** `src/errors.ts` diff is 100% docblock lines
  (mechanical census: zero changed lines outside comment gutters).
  Registry bytes frozen: `dist/error-codes.json` md5
  `40c1da48787f37d00a6fc9af6c64a1ac` (204 codes); route manifest
  `915796837d38a77733c169996d97640c` (412 tuples) and
  `dist/mcp-scopes.json` `8c92c0703eae8a429c509ff16e0d185d` untouched.
  Bundles `dist/phlix-contracts.js` (`43267ee2…`) and
  `dist/phlix-contracts.umd.cjs` (`453d2a1f…`) rebuild cmp-IDENTICAL;
  `dist/errors.d.ts` comment-stripped identical (its raw delta is the +17
  docblock-line carry, same class as `53b5d7a`'s +13/+5). Maps churn is
  pure VLQ source-line re-encode: both `.js.map` and `.umd.cjs.map` move
  exactly the 857 segments whose source is `../src/errors.ts` by a uniform
  +17 sourceLine delta — zero other-field changes across all segments
  (genCol/sourceCol/nameIndex verified), non-errors.ts segments byte-ident;
  `sourcesContent` moves only in the errors.ts entry, exactly matching
  `src/errors.ts`. `0be4146`/`6519b53` precedent class.
- **Gates.** `npm run verify:cites` **ok=442 problems=0** exit 0 at hub
  `8aba9c9` / srv `e55e0ee0` · lint clean · `test:run` **171/171** ·
  `npm run build` re-derived dist (post-build the only dist churn is the
  comment-carry class above).

### Added — docs: `provider.not_configured` gains its hub-side cite at the `guardFederationDisabled` helper (tripwire 440 → 442/0) — 2026-10-07

- **Decision resolved — this entry supersedes and closes the deferral
  flagged in `6519b53` ("Scope honesty" bullet of the 2026-10-03 entry
  below, kept verbatim as history per the forward-correction precedent).**
  That sweep deliberately left uncited hub `98a10ca`'s new
  `provider.not_configured` emitter — the `guardFederationDisabled` gate
  the eleven FederationController mutators funnel through — pending a
  semantic re-vendor call. Owner-ratified option A2 resolved it: cite
  the helper.
- **Helper cite, call-site enumeration rejected.** The
  `provider.NOT_CONFIGURED` entry docblock now reads
  `hub FederationController.php:94` (the `guardFederationDisabled`
  signature) plus `:100` (its 409 emit line). All eleven
  FederationController mutators funnel through this single guard (the
  twelfth mention is the constructor seam, not an emit), so the helper
  is cited once instead of the call-sites — a future mutator insertion
  costs zero tripwire churn by construction.
- **Module-header currency stamp** extended with the resolution note and
  the new stamped base, hub `e5f5dd9` / srv `759b0a79`. Provenance of
  the base moves: hub `FederationController.php` is byte-unchanged
  between the `5a048a6` stamp and `e5f5dd9` (`git log` over the file is
  empty), and the lone server merge since `f4326191` is the phlix-shared
  v0.51.0 vendor re-vendor (no `src/` changes, zero cite impact) — every
  prior cite re-ran green unchanged at the newer tips.
- **Comment-only proof.** `src/errors.ts` diff is 100% docblock lines
  (mechanical census: zero changed lines outside comment gutters).
  Registry bytes frozen: `dist/error-codes.json` md5
  `40c1da48787f37d00a6fc9af6c64a1ac` (204 codes) untouched.
- **Gates.** `npm run verify:cites` **ok=442 problems=0** exit 0 at hub
  `e5f5dd9` / srv `759b0a79` · lint clean · `test:run` counts and
  dist-identity evidence recorded in the lane report; `0be4146`/`6519b53`
  precedent class (bundles cmp-identical, d.ts comment-stripped
  identical, maps churn are pure VLQ source-line re-encodes).

### Changed — docblock cites re-anchored at hub `5a048a6` / server `f4326191` (74 drifts; tripwire 440/0) — 2026-10-03

- **Trigger: the tripwire fired as designed.** After the hub W5 and server
  F7/W4 merges `npm run verify:cites` measured **ok=366 problems=74** (was
  440/0 at hub `df39fc9` / srv `4f06573a`). Drift sources, all additive
  insertions above cited lines: hub `98a10ca` (W5 Phase-6 — the
  federation.enabled resolver, the `guardFederationDisabled` helper and the
  per-mutator guards shifted FederationController cites +33 to +77,
  InviteLinkController +27/+36, LibraryShareController +9,
  ServerClaimController +6, ClaimRequestHandler +43/+56), server `1f8a09cc`
  (F7 auth-method toggles — the three AuthProviderController cites +19,
  +51, +51) and server `f4ac242f` (W4 header settings — HttpHandler
  CSRF-gate cite +12).
- **74 anchors re-anchored, per family:** FederationController 35 (incl.
  the eight leaf-hub-id mentions across the module-header f44275f stamp and
  the `LEAF_HUB_ID_ALREADY_BOUND` entry: parse sites 274→311 and 356→397,
  409 conflict 378→419), InviteLinkController 12, LibraryShareController
  12, ClaimRequestHandler 8 (throws 162/189→205/232, 199→242, 206→249,
  399/402/405/409→455/458/461/465), ServerClaimController 3 — with the
  `(400 arm 166-171)` span re-derived from the arm's six-line shape to
  172-177 (the neighbouring 404/410/409 arm spans sit above the insertion
  point and held unchanged) — AuthProviderController 3 (124→143, 175→226,
  195→246) and Workerman/HttpHandler 1 (182→194).
- **Method: diff-mapped, not blanket-delta.** Every new coordinate comes
  from a difflib old→new line map of the cited FILE between the previous
  stamped base and the current tip, requiring the cited statement text to
  survive verbatim at the mapped line — then the leaf-hub-id sites and both
  ServerClaimController arm clusters were additionally re-read in place to
  disambiguate identical token lines. This mattered: the tool's
  nearest-token hints pointed at ADJACENT emit sites for several cites (e.g.
  cite 795 hint "nearest :810 (+15)" while the true bindPeer-response site
  moved +69 to 864), exactly the window-mask failure class the `256aa25f`
  sweep logged. Zero cites reported MISS; no semantics changed, position
  only.
- **Mid-sweep base move recorded honestly.** The hub tip advanced
  `8a8780c` → `5a048a6` (FederationPeerManager docs-truth pass) while this
  sweep ran; `git diff 8a8780c..5a048a6` over the five cited hub files is
  EMPTY, so every anchor holds unchanged at the newer tip and `5a048a6` is
  the stamped base (module header carries the note).
- **Scope honesty.** `98a10ca` also introduced NEW `provider.not_configured`
  emitters hub-side (`guardFederationDisabled` across 11 federation
  mutators). The registry already carries that value and this is a
  comment-only currency sweep — no cite was added for the new emit sites;
  that is a future semantic re-vendor call, not docs currency.
- **Comment-only proof.** `src/errors.ts` diff is 100% docblock lines
  (changed-line census: every added/removed line matches a comment gutter).
  Registry bytes frozen: `dist/error-codes.json` md5
  `40c1da48787f37d00a6fc9af6c64a1ac` (204 codes) unchanged before/after.
  `npm run build` (tsc --noEmit + vite + declaration emit + all three emit
  scripts) → 30 of 33 dist files byte-identical; `dist/phlix-contracts.js`
  and `dist/phlix-contracts.umd.cjs` cmp-IDENTICAL; `dist/errors.d.ts`
  comment-STRIPPED is byte-identical (doc comments re-embedded only); the
  two `.map` files churn in exactly 2 tokens each, both pure VLQ
  source-LINE-delta re-encodings (`C8K1B`→`CiM1B`, `C71Ca`→`Ch3Ca`) with
  6,303/6,285 tokens identical — the `0be4146` precedent class.
- **Gates.** `npm run verify:cites` **ok=440 problems=0** exit 0 at hub
  `5a048a6` / srv `f4326191` · `npm run lint` clean · `npm run test:run`
  **171/171** (measured this lane) · registry md5 re-checked on disk.

### Fixed — prose-currency: `54977ea`'s commit message mislabeled the comment-only proof instrument as esbuild — actual proof surface was vite build + d.ts strip — 2026-10-03

- **What was said.** The `54977ea` commit message claimed "Comment-only
  proof: `esbuild --minify` of `src/errors.ts` byte-identical HEAD vs
  working". This repo has no standalone esbuild step: `npm run build` is
  `tsc --noEmit && vite build && tsc --declaration --emitDeclarationOnly`
  plus the emit scripts (`package.json`), and esbuild is present only
  transitively as a vite dependency. Commit messages are immutable, so the
  correction is recorded forward here.
- **What stands.** The comment-only claim itself stands, independently
  evidenced by the same commit's other recorded facts: the registry stayed
  byte-frozen (`dist/error-codes.json` md5 `40c1da48787f37d00a6fc9af6c64a1ac`,
  204 codes), `dist/phlix-contracts.js` was byte-identical, and the real
  instrument was the reproducible `vite build` plus the strip-comments diff
  of `dist/errors.d.ts` (maps churning only in embedded sourcesContent
  comments) — the classification the entry below already carries.
- **No fictional prose in repo files.** `src/errors.ts` header and
  `scripts/check-error-cites.mjs` header grepped for esbuild-instrument
  prose: zero occurrences estate-wide (`grep -rn esbuild` over
  `src/ scripts/ CHANGELOG.md package.json` hit nothing before this entry) —
  the mislabel never propagated out of the commit message. CHANGELOG-only
  correction; no source, dist, or registry change.
- **Gates.** `npm run verify:cites` **440/0** re-run with the hub sibling at
  `df39fc9` (hub's newest commit is a test-file docblock carrying no cited
  coordinate — zero cite drift) · registry md5 re-checked on disk.

### Changed — docblock cites re-anchored at hub `256aa25f` / server `c42e166a` (tripwire 440/0)

- **Trigger: docs-currency sweep against the advanced sibling tips.** The
  standing tripwire reported `ok=420 problems=13` since the siblings moved
  past the previous stamp (`433/0` at hub `56e36d9` / server `da430a9d`).
  Cause: hub `7748d79` (RequestContext retirement) shifted the
  `AuthMiddleware.php` trio −5, and hub `3843f8b` + `256aa25f`
  (ServerProxyController doc expansions, +23 and +11 net) pushed the whole
  proxy cite family +34 uniform; server `43b04158` (collections
  ownership) moved the 429 `rate_limited` emit from `Core/Application.php`
  2842 to 2827. All 13 spans were re-read at source per the `480ba9f`
  precedent (not blanket offsets): the `proxy.scope_denied` pair re-derived
  to 1078/1093 despite the tripwire's nearest-token hint pointing at 1078
  twice, and two window-masked cites inside unchanged files surfaced by the
  ±3-line heuristic (`RelayProxyBridge.php` 313→315, hub
  `Application.php` 203→204) were corrected alongside the server 429
  re-anchor to :2827 — thirteen problems, fifteen coordinate moves.
- **Header stamp.** The COORDINATE CURRENCY paragraph now records hub
  `256aa25f` / server `c42e166a` and the drift attribution above; the
  parsed cite count rose 433 → 440 because the stamp itself carries seven
  new current-state colon-cites (the unchanged-neighbor spot-checks
  re-verified in place: srv `AuthMiddleware.php:62`, hub
  `McpController.php:352`, `RelayProxyManager.php:554,696`,
  `SubdomainController.php:128`, plus the `scope_denied` pair anchor and
  the server 429 site). Historical coordinates stay colon-less prose so
  they never load on the tripwire.
- **Comment-only proof.** Strip-comments diff of `src/errors.ts` shows zero
  changed non-comment lines; the registry stays frozen at
  `dist/error-codes.json` md5 `40c1da48787f37d00a6fc9af6c64a1ac`
  (204 codes), `dist/errors.js` byte-identical, and `dist/errors.d.ts` /
  maps churn only in source-embedded comments (VLQ line-offset re-encode),
  exactly the `bcb6bab` classification.
- **Gates.** `npm run verify:cites` 440/0 at hub `256aa25f` /
  server `c42e166a` · `npm run build` reproducible with a clean
  `git status --porcelain` afterwards · `npm run test:run` 171/171 · lint
  clean.

### Changed — docblock cites re-anchored at server `da430a9d` (tripwire 433/0 at hub `56e36d9`) + stale RESERVED test wording flipped to LIVE

- **Trigger: docs-currency sweep against the advanced sibling tips.** Server
  `1ef503b7` (MED-2 syncplay room-visibility) shifted the whole
  `SyncPlayManager.php` cite family (inner-path, carrier-fallback, queue-cap
  and legacy SCREAMING anchors, +10 to +70 per site) and, together with
  `da430a9d` (LiveTV parental gate), moved the 429 `rate_limited` emit to
  `Core/Application.php:2842`. All 55 flagged spans were re-read at source
  at server tip `da430a9d` (not by blanket delta; the stale pending-drift
  `(+11)/(+7)/(+4)` annotations retired per the `480ba9f` precedent); every
  hub cite re-ran green unchanged at hub tip `56e36d9`. The three historical
  stamp lines that narrated the 2026-09-29 and deferred-mint sweeps had
  their coordinates colon-faded (prose, not live cites) so the tripwire
  keeps verifying only current-state claims.
- **`test/errors.test.ts` wording flip:** the queue-cap suite title and the
  TWINS-map comment still said `RESERVED … stretch` — stale since `0be4146`
  flipped `syncplay.queue_limit_exceeded` LIVE (emit shipped at srv
  `7baa398a`). The row's exclusion from `SYNCPLAY_ERROR_CODE_TWINS` stands;
  its reason is now truthfully "LIVE, never a SCREAMING twin". Assertions
  untouched (status-independent).
- **Comment-coordinate + test-wording only:** census holds 204 codes /
  37 domains; `dist/error-codes.json` byte-frozen md5
  `40c1da48787f37d00a6fc9af6c64a1ac` re-proven after regen;
  `errors.d.ts`/sourcemaps regenerate as comment-line diffs (bundle `.js`
  byte-identical). Header COORDINATE CURRENCY narrative carries the
  `da430a9d`/`56e36d9` stamp.
- **Gates:** `npm run verify:cites` exit 0 (**433** cites, 0 problems at hub
  `56e36d9` / srv `da430a9d`), `npm run test:run` **171/171**, `lint` clean,
  build re-derives `dist`. No new tag — registry bytes unchanged; tagging
  remains owner-gated.

### Changed — docblock cite only: srv `rate_limited` re-anchored at server `e1f1fa05` (tripwire 443/0 at hub `ccefe28`)

- **Trigger: hub federation channel-bridge lane ran the
  `verify:cites` tripwire against its new hub tip.** Hub `ccefe28` (the
  cross-process master-push channel bridge) moved zero cited hub lines —
  every FederationController/hub cite re-read green unchanged. The lone
  drift was inherited from the sibling **server** checkout having advanced
  `7baa398a` → `e1f1fa05` (device-M1 casting register): the `+33` net lines
  above the rate-limit helper pushed
  `common.RATE_LIMITED`'s srv cite `Core/Application.php:2805` to `:2838`
  (the 429 emit line — re-read at source; nearest-token drift report said
  `+19 vs cited span` to the docblock at :2824, and the emit, not the
  docblock, is what the header convention cites, matching the pre-move
  anchor's semantics). The header's COORDINATE CURRENCY narrative carries
  the ccefe28/e1f1fa05 stamp.
- **Zero wire/registry movement.** One comment coordinate: census holds at
  **204 codes / 37 domains**; `dist/error-codes.json` byte-frozen — md5
  `40c1da48787f37d00a6fc9af6c64a1ac` re-proven after regen. Committed
  `errors.d.ts`/sourcemaps regenerate from the docblocks only (comment
  lines; the bundle `.js` stays byte-identical). `npm run verify:cites`
  exits **0** (443 cites, 0 problems) at hub `ccefe28` + server `e1f1fa05`;
  `npm test` **171/171**. **No new tag** — nothing consumers pin has
  changed; the next tag remains an owner-gated decision.

### Changed — docblock wording only: deferred-mint pair flipped RESERVED → LIVE (hub `f44275f` + server `7baa398a`)

- **Trigger: the two v0.5.3 deferred mints landed on the wire.** Hub
  `f44275f3bb1bbf1eb5ccb16a55e8bd2ae3d831b0` flipped all three `leaf_hub_id`
  sites onto the dedicated `leaf_hub_id_already_bound` — the malformed-UUID
  400 parse sites at hub FederationController.php:274 (`createPeer`) and
  :356 (`bindPeerLeafHubId`), plus the 409 already-bound conflict at :378 —
  re-read from the sibling checkout at the tip before writing. Server
  `7baa398ad81532c8560668bd8d3ca01e357a4132` switched the playback-queue cap
  at srv SyncPlayManager.php:1230 to emit `syncplay.queue_limit_exceeded`,
  with the group-count cap keeping `syncplay.group_limit_reached` at :676 —
  the documented split. The doc-side flips follow the code (fe9b9ef
  precedent shape): the two entry docblocks, the syncplay domain docblock
  (now ALL EIGHT rows LIVE), header CONTENTS #3, the `GROUP_LIMIT_REACHED`
  queue-cap stretch note, the `SyncPlayErrorCode` vocabulary line and the
  `SYNCPLAY_ERROR_CODE_TWINS` absence rationale now state the shipped truth;
  the COORDINATE CURRENCY header carries the f44275f/7baa398a stamp and its
  stale "now ride the `invalid_request` generic" clause was re-tensed to the
  f30e8a7-era past.
- **Zero wire/registry movement.** Docblock-only: no code added, renamed or
  removed — census holds at **204 codes / 37 domains**.
  `dist/error-codes.json` byte-frozen — md5
  `40c1da48787f37d00a6fc9af6c64a1ac` proven pre/post regen; committed
  `errors.d.ts`/sourcemaps regenerated from the docblocks only (diff is
  100% comment lines; the bundle `.js` stays byte-identical — JSDoc does not
  emit into JS). `npm run verify:cites` exits **0** against hub `f44275f` +
  server `7baa398a` (431/0 pre-flip → **443/0** post-flip; the added cites
  are the three hub emit sites and the :676/:1230 split named in the new
  wording). **No new tag** — nothing consumers pin has changed; the next
  tag remains an owner-gated decision.

## [0.5.3] — carried-forward notes (batch 2)
> Re-bannered forward-only at the `v0.5.4` cut (2026-11-02): these bodies
> shipped in `v0.5.3` — every entry below is an ancestor of the tag commit
> `430981e` (`git merge-base --is-ancestor` proven at this prep) — but rode
> under the `[Unreleased]` banner because the tag prep left them there.
> Entries kept verbatim per the house history rule; the `## [0.5.3]`
> summary further below stays the authoritative release note for them.
> (Batch 1 of this class was renamed by W-min25 — its header sits under
> the `## [0.5.3]` section.)

### Changed — route-manifest regen #35: CONTENT 410→412 tuples at server `758f9149` + cite-currency re-stamp

- **Trigger: phlix-server master advanced `730e55b7` → `758f9149`.**
  Regenerated `src/routeManifest.generated.ts` + the committed dist with the
  repo's own `scripts/generate-server-route-manifest.mjs` against the live
  server checkout. CONTENT regen: the two book-progress rails added by the
  server's M-6 commit (`GET|POST /api/v1/books/{id}/progress`) lift the
  Application guard inventory 373→375; the WebPortal table is byte-identical
  across the span and the shared overlap holds at 11, so the union grows
  410→412 `[method, path]` tuples. The empirical tuple diff is EXACTLY those
  two additions — zero removals, zero other movement — confirming the span's
  remaining manifest-file commits (the L-1/L-2 route gates, the music/scan
  middleware move) changed only the ` -> Handler [Middleware]` annotations the
  generator strips.
- **Test pins rotate in the same commit** (regen #34 precedent): provenance
  sha, source/total counts, and the byte-freeze md5 re-pinned to the new
  committed artifact. The cs#47 merge-ritual survival token deliberately does
  NOT rotate: it is a PAIR with the hub-side const and marks the wave in which
  consumers re-vendored together — a contracts-only regen leaves the vendored
  downstream bytes untouched, so the pair advances only in a coordinated
  re-vendor leg.
- **Consumers verified unperturbed.** Every downstream master gate
  (phlix-ui `routeGate.api.test.ts`, tizen `routeManifest.gate.test.ts`,
  mobile/roku vendored JSON, hub's S280 parity fixtures) reads a VENDORED copy
  pinned at the v0.5.2-era bytes (md5 `06ce7ec9…`) — no repo's tests read
  `dist/server-route-manifest.json` from a sibling contracts checkout, so the
  new bytes are master-only until the next release tag (no-retag standing).
  The only sibling reads in this lane are this repo's own `verify:cites`
  against the server checkout.
- **Cite currency: no drift, header re-stamped.** `npm run verify:cites`
  exits 0 — 431 cites, 0 problems — at hub `db7ea738` / server `758f9149`:
  neither post-L-bundle security merge (admin-gated `/app/library/scan` SPA
  route; `isAdminUser` ACTIVE-admin predicate) moved a cite-referenced file
  beyond the ±3 window. The COORDINATE CURRENCY header now stamps that state.
- **Zero registry movement** — census holds at 204 codes / 37 domains;
  `dist/error-codes.json` byte-frozen (md5 `40c1da48787f37d00a6fc9af6c64a1ac`
  proven pre/post). `errors.d.ts` / sourcemaps regenerated docblock-only.
  **No new tag** (02a306e / 480ba9f precedent).

### Changed — docblock cites only: srv L-bundle hygiene re-anchor at `b3aece4e`

- **Trigger: server `b3aece4e530d3f721d3f8196d0ab86597305375e`** (L-bundle
  security hygiene: `/system/info` fingerprint drop, library-paths admin gate,
  HubJwtMiddleware deletion, cast 500 sanitization, CSP guard/prose, router
  debug-log removal, M-3 fastpath twin).
- **`hub.jwt_invalid` cite re-pointed.** L-5 deleted the dead-wired
  `HubJwtMiddleware` (its `:73` emit site is gone); the cite now names the two
  live emitters verified at source: `AccountLinkController.php:432,444` and
  `HubTokenController.php:91`. The code itself stays LIVE — no registry move.
- **Four cites line-shifted by server insertions and were re-read at source:**
  `stream.limit_exceeded` (`StreamLimitMiddleware.php:113-117→139-143`,
  `PreRouterFastPaths.php:569-575→580-582` — the synthetic-bucket extraction
  and twin rework shifted the emits), `profile.not_found`
  (`StreamLimitMiddleware.php:88-91,95-98→93-96,100-103` tightened even where
  the ±3 window still passed, `PreRouterFastPaths.php:597-602→608-610`),
  `library.delete_all.confirm_required` (`LibraryController.php:965→990`, the
  L-4 admin-gate insertions above it) and `rate_limited`
  (`Core/Application.php:2741→2805`; all shifts re-derived from the tree at
  `b3aece4e`).
- **Zero registry movement** — census holds at 204 codes / 37 domains;
  docblock-only, `dist/error-codes.json` byte-frozen (md5
  `40c1da48787f37d00a6fc9af6c64a1ac` proven pre/post regen). `errors.d.ts` /
  sourcemaps regenerated from the docblocks (comment lines only). COORDINATE
  CURRENCY header re-stamped — the stamp paragraph itself now carries the
  `AccountLinkController.php:432,444 · HubTokenController.php:91` spans, which
  the tripwire counts and verifies (that is the +3 vs the 428 at `480ba9f`:
  431 cites, 0 problems). **No new tag** (02a306e /
  480ba9f precedent).

### Changed — docblock cites only: hub FederationController re-anchored at f30e8a7

- **Trigger: hub `f30e8a7a62a3ab1392214b12dcf76f9589c28c8e`.** The
  FederationController unregistered-`invalid_leaf_hub_id` fix reworked
  `badRequest()`: the two malformed-UUID 400 sites now emit the registered
  generic `invalid_request` with the condition in a free-form `reason`
  (409-sibling precedent in the same controller). The inserted docblock
  comments shifted every later emit — +3 lines from line 268, +5 from
  line 351.
- **25 cite spans re-anchored from source, not by the blanket delta.** The
  17 spans the `verify:cites` tripwire flagged (all +5) now read the true
  hub coordinates; additionally swept the 7 spans in the 268–354 band the
  ±3 window only masked at exactly +3 (`invalid_url` second site
  288→291, `missing_url` 275→278, `missing_public_key` 279→282,
  `missing_name` 283→286, `peer_url_exists` 296→299, `peer_key_exists`
  305→308, `missing_peer_id` 344→347), and the
  `leaf_hub_id_already_bound` 409 anchor 373→378, which passed only
  because `invalid_request` recurs beside the stale coord. Three spans
  confirmed unmoved (`invalid_body` 106, `invalid_role` 123, `invalid_url`
  first site 139); their stale pending-drift "(+N)" annotations — prose
  the tripwire never parses — are retired with the re-anchor.
- **`leaf_hub_id_already_bound` RESERVED docblock made current.** The mint
  entry described only the 409 bind conflict; f30e8a7 unified the whole
  leaf_hub_id family onto the generic+reason shape, so the docblock now
  names the two 400 parse sites (274, 356) alongside the 409 site (378)
  and records the dropped literal as never-registered. The deferred-mint
  emit-switch note now covers the family.
- **Zero registry movement.** Census holds at 204 codes / 37 domains;
  docblock-only, so `dist/error-codes.json` is byte-frozen vs `7fc864c`
  (md5 `40c1da48787f37d00a6fc9af6c64a1ac` proven pre/post regen — the
  202-code `b919…` hash was superseded by the 7fc864c mints).
  `errors.d.ts`/sourcemaps regenerated from the docblocks (diff is
  comment lines only). COORDINATE CURRENCY header re-stamped at hub
  `f30e8a7` / srv `9e765895` (tip-at-run-time; no srv cite moved under the
  post-`62923c92` websocket-doc commits). `npm run verify:cites` exits 0
  (428 cites, 0 problems — 426 plus the two honest new sites in the
  RESERVED docblock). **No new tag** — nothing consumers pin has changed
  (02a306e precedent).
- **Post-review method-name fix:** the RESERVED docblock's `:274` site now
  reads `createPeer` (hub :250) — the hub has no `registerPeer`.

### Added — two deferred mints: `leaf_hub_id_already_bound` + `syncplay.queue_limit_exceeded` (census 202 → 204)

- **`federation.leaf_hub_id_already_bound` (RESERVED).** The hub
  FederationController leaf-hub-id bind conflict (409 at hub
  FederationController.php:373) currently emits the registered generic
  `invalid_request` with the condition in the `reason` field; the entry
  docblock records the site and the emit-switch note — the hub flips the
  literal when the next contracts release pins this vocabulary.
- **`syncplay.queue_limit_exceeded` (RESERVED).** The playback-queue cap
  (srv SyncPlayManager.php:1230) today stretches `syncplay.group_limit_reached`
  onto it; the entry splits the two conditions with the same deferred-mint
  note, and the `syncplay.group_limit_reached` docblock gained the honest
  `:1230` stretch cite. The row is deliberately absent from
  `SYNCPLAY_ERROR_CODE_TWINS` (it splits a dotted condition, not a SCREAMING
  legacy value); the map's totality is now expressed against the new
  `SyncPlayLegacyTwinErrorCode` (`Exclude` of the queue-cap row, documented).
- **Cite corrections from the 5b8305a review:** `peer_not_found` gained its
  sixth emit site — re-derived at hub `8a5dc12`: sites 358/410/458/514/605/917,
  cite `(+4)` → `(+5)`; module-header COORDINATE CURRENCY re-stamped with the
  tripwire re-run at hub `8a5dc12` / srv `c11bd4ac`.
- **Dist moves INTENTIONALLY this time:** `dist/error-codes.json` 202 → 204
  codes (ordered insertion; every existing position untouched), `errors.d.ts`
  + bundles regenerated. Test pins updated by measurement: exact-count
  202 → 204, federation and syncplay ordered-list pins extended; suite holds
  171/171. `npm run verify:cites` exits 0 (426 cites, 0 problems) against
  hub `8a5dc12942dd37b6a9154321b8af6414bbba6bfb` + srv
  `c11bd4ac19809fbd58231be2ade89c4d78bf60e9`.
- **No tag, no version bump** (additive-master precedent of `884e261`:
  registry growth lands on master; the release tag follows when the mint
  cascade is scheduled). Consumers' content pins stay at `#v0.5.2` (202-code)
  until the re-tag; the fixture-pin cascade (hub/server/client censuses that
  byte-pin the JSON) lands with the release tag, NOT with this commit.

### Changed — coordinate sweep only: 82 drifted cites re-anchored at hub `14a8a55` / srv `9d3e92b2` (2026-09-29)

- **Trigger: hub H-4/H-5 federation rework + server queue-cap/password-gate
  lanes** moved the error-emit files below the previous stamps (hub
  `b83639fa`, srv `9b2394ee`). `npm run verify:cites` fired on 82 cites; each
  was re-anchored by re-reading the emit site in the sibling checkouts: 40
  srv SyncPlayManager.php cites (trio carriers 1588/1627/1659 →
  1720/1773/1805, inner-path 621/702/741/745 → 676/768/816/821, the legacy
  SCREAMING set to their post-lane lines), 27 hub FederationController.php
  cites (post-rework region deltas +13/+31/+41/+106/+122/+129), 3 hub
  AuthMiddleware (+4), 3 hub ClientMountController (+13), 4 hub
  RelayProxyManager (+20/+74 — `server.no_tunnel` anchored on the emit at
  :251, not the comment at :239 the tripwire first surfaced), 1 srv
  Core/Application.php `rate_limited` (2731 → 2741) and the
  EnrollmentJwtMiddleware entry, whose docblock now describes the rework's
  `unauthorized()` → `invalidToken()`/`expired()` split routing with the
  current gate/helper coordinates.
- **Honesty re-anchors (drifted but window-absorbed, not flagged):** 9 hub
  InviteLinkController cites (+3), 3 hub RequestController cites (296/352/384
  → 299/355/387) and 3 srv AuthController cites (194/264/336,354 →
  195/265/337,355) in files that also changed since the stamp — every one
  re-read at the current tips.
- **Zero registry movement.** Docblock comments only: 202 codes / 37 domains;
  `dist/error-codes.json` byte-frozen (md5 `b919685d3816940fc76f2f67c9b9eee2`
  proven pre/post); `errors.d.ts` + source maps regenerated docblock-only.
  `verify:cites` exits 0 (420 cites, 0 problems) against hub `14a8a5574f9db2d605efff19823b3ec2da198713`
  + srv `9d3e92b2a8c87d78851d06333e9d208aa20533d2`; full build + 171/171 tests
  green. No tag.

### Changed — docblock wording only: syncplay `_failed` trio flipped RESERVED → LIVE

- **Trigger: server PR #798 merged at `9b2394eea631739dff8f6e039d50f910c4304d97`.**
  The three carrier fallbacks in SyncPlayManager.php now emit the dotted
  registry twins — `syncplay.create_failed` at srv SyncPlayManager.php:1588,
  `syncplay.join_failed` at srv SyncPlayManager.php:1627 and
  `syncplay.leave_failed` (direct) at srv SyncPlayManager.php:1659 — all
  re-read from a read-only server checkout before writing. The doc-side flip
  follows the code: header CONTENTS #3 and the syncplay domain docblock now
  state ALL SEVEN twin rows LIVE with the new evidence coordinates (+2/+4/+7
  line drift from the blessed pre-flip cites, stamped honestly in the
  COORDINATE CURRENCY header); `SYNCPLAY_ERROR_CODE_TWINS` status updated
  accordingly.
- **Legacy SCREAMING trio marked with honest status.** `CREATE_FAILED`/
  `JOIN_FAILED`/`LEAVE_FAILED` remain REGISTERED — wire history: older
  servers and in-flight frames still speak them and every client resolves
  either shape (console #167 + roku #90). Their entries now read "retired
  from current server emit at srv #798; still resolved client-side for
  old-server compatibility" instead of "coarse carrier". Header CONTENTS #2
  and the `legacy` block docblock got the same truth.
- **Zero wire/registry movement.** The flip is docblock-only (server #798
  changed emit literals that were already registered here; no code added,
  renamed or removed — census holds at 202 codes / 37 domains).
  `dist/error-codes.json` byte-frozen — md5
  `b919685d3816940fc76f2f67c9b9eee2` proven pre/post regen; committed
  `errors.d.ts`/sourcemaps regenerated from the docblocks only (diff is
  100% comment lines). `npm run verify:cites` exits 0 against server
  `9b2394ee` + hub `7915fdf9` (415 cites, 0 problems). **No new tag** —
  nothing consumers pin has changed (#84 precedent).

## [0.5.3] - 2026-10-01

### Added — registry +2 RESERVED mints (202 → 204 codes) + route-manifest regen #35 (410 → 412 tuples) + cite-currency sweeps — first tag since `v0.5.1` to ship new registry bytes

- **Two new RESERVED codes minted (`7fc864c`):**
  `leaf_hub_id_already_bound` (federation 409 — the three hub sites that
  today answer bare `conflict`/400 flip to this code in the next coordinated
  leg) and `syncplay.queue_limit_exceeded` (playback queue-cap, the eighth
  row of the syncplay family table). Both are declared, not yet emitted —
  census **204 codes / 37 domains**.
- **Registry bytes move for the first time since #78 (`v0.5.1`).**
  `dist/error-codes.json` md5 `b919685d…` →
  **`40c1da48787f37d00a6fc9af6c64a1ac`**. Unlike `v0.5.2` (byte-identical),
  this tag REQUIRES the downstream PHP registry-JSON fixture pins
  (phlix-server, phlix-hub) to rotate when they re-pin to it.
- **Route-manifest regen #35 (`e2f2d53`):** the server's M-6 book-progress
  rails add `GET|POST /api/v1/books/{id}/progress` at server `758f9149` —
  union 410 → **412 tuples**, exactly those two additions, zero removals.
  `dist/server-route-manifest.json` md5 `915796837d38a77733c169996d97640c`.
  Consumers still read v0.5.2-era vendored bytes (md5 `06ce7ec9…`) until
  they re-pin to this tag — this release opens that coordinated re-vendor
  leg (hub S280 parity fixtures, ui/tizen gates, mobile/roku vendored JSON).
- **Cite-currency sweeps of `src/errors.ts` docblocks** — `5b8305a`
  re-anchored 82 drifted spans at hub `14a8a55` / srv `9d3e92b2`; `480ba9f`
  re-anchored 25 FederationController spans at hub `f30e8a7`; `cf17cab`
  corrected the `:274` cite's enclosing method to `createPeer`; `bc4d62e`
  re-anchored 5 spans at srv `b3aece4e`. `npm run verify:cites` is green AT
  TAG: **431 cites / 0 problems** against sibling tips hub `c9d2900` /
  server `fa3a15ff`.
- **Docblock status truth, zero wire effect** (`0f248e0`/`72cb28d` #84,
  `02a306e`/`fe9b9ef` #85): syncplay twin docblocks made forensic; the
  `_failed` trio flipped RESERVED → LIVE at srv `9b2394ee`.
- **Additive only.** The entire `src/` delta since `v0.5.2` is `errors.ts`
  (additive entries + docblocks) and `routeManifest.generated.ts`; no DTO,
  route-shape, or scope change. `dist/mcp-scopes.json` ships byte-stable
  (4 scopes). Third-position bump per the repo's own additive-registry
  precedent `v0.5.1` (the +55-code #78 expansion also took the last
  position).
- **Gate evidence (at this prep commit):** `npm run build` re-derived
  `dist/` byte-identically (post-build `git status` empty); census re-emitted
  204 codes; `test:run` **171/171**; `lint` clean; `verify:cites` 431/0.

## [0.5.3] — carried-forward notes
> Renamed 2026-10-30 (W-min25) from a duplicated `[Unreleased]` header —
> this body shipped in `v0.5.3` (its syncplay-twin forensic pass is named in
> the tag section). Entries kept verbatim per the house history rule.

### Changed — docblock wording only: syncplay twin wire-status made forensic

- **`src/errors.ts` syncplay twin docblocks corrected.** The prior wording
  ("create/join now emit the twin") overstated the server state: re-reading
  the read-only server origin at `1113c67d` (SyncPlayManager.php unchanged
  since the `e0e010b` cite sweep) shows only the FOUR inner-path
  specializations are LIVE on the wire today —
  `syncplay.group_limit_reached` (:621), `syncplay.group_not_found` (:702),
  `syncplay.invalid_password` (:741), `syncplay.group_full` (:745) —
  forwarded through the `??` wrap sites (:1586/:1623). The `_failed` trio
  (`syncplay.create_failed`/`join_failed`/`leave_failed`) stays RESERVED and
  un-emitted: the wrap sites still fall back to SCREAMING `CREATE_FAILED`/
  `JOIN_FAILED` and :1652 still emits raw `LEAVE_FAILED` — the trio remains
  canonical for those shapes. Recorded the flip-unblocking fact: console
  #167 + roku #90 prove both clients already resolve either shape — clients
  prepped, flip ready. Header currency stamp extended honestly to
  `1113c67d`; `SYNCPLAY_ERROR_CODE_TWINS` docblock status sharpened.
- **Zero wire/registry movement.** `dist/error-codes.json` byte-frozen (md5
  `b919685d3816940fc76f2f67c9b9eee2` proven pre/post); committed
  `errors.d.ts`/maps regenerated from the docblocks only. `npm run
  verify:cites` exits 0. No new tag — nothing consumers pin has changed.

## [0.5.2] - 2026-09-25

### Changed — version-field alignment ONLY (`0.4.7` → `0.5.2`) — registry content untouched

- **This release kills a documented version skew at the source.** The
  `v0.5.0` and `v0.5.1` tags shipped ahead of the `package.json` `version`
  field, which still read `0.4.7` in both tagged trees — so tag-pinned
  consumers (`github:detain/phlix-contracts#<tag>`) installed metadata that
  disagreed with the tag they pinned. This release aligns the field to the
  published tag line: **`version` `0.4.7` → `0.5.2`, and nothing else is
  semantic** — no wire shape, error code, scope or DTO changed.
- **Registry content unchanged since `v0.5.1` (#78, the W1b expansion).**
  Everything merged since (#79 CI freshness gates + honest test claims,
  #80 `server.not_found` reuse-target docblock, #81 the third `src/errors.ts`
  coordinate re-sweep + `npm run verify:cites` tripwire, plus #82's
  `.gitattributes` LF shield) is tooling, docblock and CI work only.
  Census holds at **202 codes / 37 domains**.
- **Artifact byte-identity pin.** `dist/error-codes.json` is byte-identical
  before/after the release rebuild — md5
  `b919685d3816940fc76f2f67c9b9eee2` (proven pre/post in the release PR; the
  CI committed-freshness `git diff --exit-code` gates re-prove it on every
  push). The committed bundles embed **no** version string, so the entire
  `dist/` tree ships unchanged; downstream PHP fixture pins of the registry
  JSON (phlix-server, phlix-hub) stay valid across this tag.

## [0.5.2] — carried-forward notes
> Renamed 2026-10-30 (W-min25) from a duplicated `[Unreleased]` header —
> the 2026-09-24 artifact-freshness/CI-gates/coordinate work shipped in
> `v0.5.2`; the 2026-09-23 W1b expansion it annotates shipped earlier as
> `v0.5.1` (#78). Entries kept verbatim per the house history rule.

### Fixed — registry tickets: honest artifact-freshness claims + CI gates, docblock coordinate currency — 2026-09-24

- **Committed-artifact staleness claims corrected (R2 carry-forward of #77's
  error-codes fix).** `test/mcp.test.ts` and `test/routeManifest.test.ts` (plus
  the `emit-mcp-scopes.mjs` / `emit-server-route-manifest.mjs` headers) claimed
  their tests detect a stale *committed* dist JSON. They do not: the tests read
  working-copy bytes and CI's `npm run build` heals them before the suite runs.
  The comments now state the real scope (working-copy only, reddening a
  forgotten regen locally) and name the actual committed-freshness gate.
- **CI gained the missing gates**: `git diff --exit-code --
  dist/mcp-scopes.json` and `git diff --exit-code -- dist/server-route-manifest.json`
  immediately after `npm run build`, mirroring the #77 `dist/error-codes.json`
  step exactly. Red-proofed in a throwaway clone: a stale committed artifact
  turns the step non-zero.
- **`src/errors.ts` docblock coordinate currency**: ~30 stale file:line cites
  re-synced against phlix-server `e0e010b0` / phlix-hub `f92669a` (the only
  drift universe is the files the server-W2 / hub-W3 emit-waves touched after
  the W1b re-verification base `838da686`/`c023a341`). Notably the syncplay
  twins moved `:1580/:1615/:1644` → `:1586/:1623/:1652`, hub claim/auth/hub
  entries now document W3's dual placement (dotted on `code`, SCREAMING parked
  in `error` TEXT), and server-W2 promotions (stream/access/profile.not_found)
  are rewritten from "landing" to landed prose. **Docblock-only: zero wire
  changes — `dist/error-codes.json` and `dist/mcp-scopes.json` are
  byte-identical before/after (md5-proven), so no tag is cut; the next natural
  tag carries this.**

## [0.5.1] - 2026-09-23

### Added — W1b (errors): registry expansion — the complete emit-wave vocabulary — 2026-09-23

- **`src/errors.ts` grows from 147 codes / 31 domains to 202 codes / 37
  domains — strictly additive** (no code removed, renamed, or re-parented).
  Every former Wave-2 triage family now has its dotted vocabulary registered so
  the server/hub emit-waves can ship without further registry changes. All 55
  new entries re-verified file:line against phlix-server `838da686` and
  phlix-hub `c023a341`:
  - `auth` +5: `auth.unauthenticated` / `auth.enrollment_expired` (dotted
    forward twins of the SCREAMING values that already ride the hub `code`
    channel today — `ServerClaimController.php:103`,
    `EnrollmentJwtMiddleware.php:46,51,56`), `auth.server_mismatch` (← hub
    `AUTHORIZATION_FAILED` text, `ServerController.php:73,131,164,195`),
    `auth.missing_credentials` / `auth.invalid_credentials` (← srv
    `AccountLinkController.php:295,332` text).
  - `hub` +2: `hub.protocol_unsupported`, `hub.internal_error` (← text-field
    pseudo-codes on `ServerClaimController`/`ServerController`/
    `HubProtocolMiddleware` refusals and mapError defaults).
  - `claim` NEW (3): `claim.code_not_found` / `code_expired` /
    `code_already_claimed` (← hub `CLAIM_CODE_*` text traps,
    `ServerClaimController.php:133-142` ← `ClaimRequestHandler` throws).
  - `server` +1: `server.key_invalid` (← hub `SERVER_KEY_INVALID` text,
    `ServerClaimController.php:149-150`).
  - `alexa` +14: dotted twins for every `ALEXA_*` value
    `AlexaSignatureMiddleware::reject()` places on `code` (header gate, cert
    chain, signature, timestamp families).
  - `stream` +1 / `access` NEW (1) / `profile` +1: `stream.limit_exceeded`,
    `access.scheduled`, `profile.not_found` (← srv CamelCase `error`-text
    pseudo-codes and `denial_type` machine values in `StreamLimitMiddleware`,
    `AccessScheduleMiddleware`, `PreRouterFastPaths`). The
    `CastingEnabledMiddleware` ucfirst-interpolated site already emits the
    registered `casting.disabled` on `code` — no new code needed, documented
    in the module header.
  - `identity` NEW (7), `provider` NEW (7), `oauth` NEW (6), `ldap` NEW (7):
    the server text-snake family promoted from the Wave-2 triage list —
    AccountLink/AuthProvider/OIDC/GitHub-callback/LDAP surfaces, mapped 1:1 to
    the emitted snake words (with `provider.not_configured` unifying today's
    `not_configured`/`provider_not_configured` spellings). These are
    estate-chosen words, distinct from the hub's RFC-6749/6750-mandated OAuth
    `error` values, which stay excluded.
- **Field-placement caveats.** Every domain that gained text-field (or
  `denial_type`) codes carries a caveat docblock modeled on the Wave-1
  `profile.*` precedent: "rides the error TEXT field today; Wave 2 promotes to
  the `code` channel; clients match in `error` text until then." The module
  header's triage inventory was rewritten accordingly: relay-handshake worker
  diagnostics, RFC OAuth values, JSON-RPC/SOAP numerics, and never-emitted
  constants stay excluded with reasoning; hub text words that are display
  aliases of registered codes (`SERVER_NOT_FOUND`, `MISSING_SERVER_ID`,
  `UNAUTHORIZED`, `UPGRADE_REQUIRED`, `NOT_IMPLEMENTED*`) are documented as
  reuse targets, not new vocabulary.
- **SyncPlay twin flip.** The seven `syncplay.*` codes are no longer marked
  "RESERVED, servers do not emit" — the server emit-wave is landing; the
  `SYNCPLAY_ERROR_CODE_TWINS` migration table and all structural test laws
  (ordered pins, legacy-only SCREAMING, byte-frozen artifact) are unchanged.
- **Gates:** `npm run typecheck`, `npm run lint`, `npm run test:run` (repo
  suite 171 passed; `errors.test.ts` 34 passed — five new per-domain pin
  blocks added), `npm run build` + double-emit md5 idempotency of
  `dist/error-codes.json`, clean `git status`.

## [0.5.0] - 2026-09-23

### Added — W1 (errors): estate error-code registry, Wave 1 of the error-code doctrine — 2026-09-23

- **`src/errors.ts` + `scripts/emit-error-codes.mjs` + `dist/error-codes.json`.**
  The owner-approved doctrine: the stable machine error code on the wire is the
  SSOT for *what went wrong*; clients localize by code, the server's English
  message text is a debug fallback, and there is no server-side i18n and no
  protocol locale negotiation. This registry is the vocabulary that doctrine
  needs, derived code-first from the emitting sources rather than transcribed
  from any prior inventory: every dotted and bare-snake code actually placed on
  the wire today by `phlix-server` or `phlix-hub` is listed VERBATIM (each entry
  carries its source file:line refs in the docblock), 147 codes across 31
  domain namespaces. The SyncPlay WebSocket's 12 SCREAMING_SNAKE `error_code`
  literals are pinned under `legacy` exactly as emitted (the test restates the
  set independently of the registry and asserts it is the registry's *only*
  uppercase content); Wave 2 will introduce their dotted twins server-side
  without touching today's wire.
- **Reserved dotted twins.** Seven new `syncplay.*` codes pre-register the
  coarse prose-carrier families — the `CREATE_FAILED`/`JOIN_FAILED`/
  `LEAVE_FAILED` arms that today wrap distinct failures ('Maximum group limit
  reached', 'Group not found', 'Invalid password', 'Group is full') inside
  English message text — with `SYNCPLAY_ERROR_CODE_TWINS` as the explicit
  migration map (twin → legacy original). Clients may localize the twins now so
  the Wave-2 server cutover is wire-only, needing no client release.
- **Wave-2 triage is documented, not registered.** Hub SCREAMING families
  (`ALEXA_*`, `CLAIM_*`, `HUB_*`), server CamelCase pseudo-codes in the `error`
  text field (`StreamLimitExceeded`, `AccessScheduled`), the RFC-6749/6750
  OAuth `error` values (frozen by the RFC, not estate codes), JSON-RPC and
  SOAP numeric codes, and defined-but-never-emitted constants
  (`profile.not_owned`) are enumerated in the module header as known-but-
  unregistered, so the SCREAMING-pin invariant stays exactly true.
- **Emit pipeline mirrors the mcp-scopes precedent end to end**: generated from
  the built bundle (cannot drift from `src/errors.ts`), plain ordered string
  array plus a `$comment` provenance marker for the Node-less PHP consumers,
  fail-fast guard against emitting an empty vocabulary, wired as the last step
  of `npm run build`, and COMMITTED under `dist/` like its siblings.
  `test/errors.test.ts` (29 tests) restates every domain's ordered vocabulary
  from the PHP sources, pins the exact 147-code census, enforces the wire-shape
  regex (lowercase dotted/snake, uppercase only inside `legacy`), verifies the
  twin map's totality over pinned legacy members, and byte-freezes the
  committed artifact against a fresh deterministic emit.

### Changed — W111 (cs47): CONTENT manifest regen (404→410 tuples — S518 adds six quick-connect/telemetry routes) — 2026-09-16

- **cs#47 currency cascade (lane cs47a).** Regenerated
  `src/routeManifest.generated.ts` + `dist/server-route-manifest.json` against
  the current phlix-server master tip. This is a CONTENT regen: the server
  span since the previous pin is S518's quick-connect device-pairing surface
  (initiate, status, token exchange, and session-identity approve rails) plus
  the consent-gated client telemetry pair (public heartbeat and its
  admin-side clients listing) — six new routes, all registered by the
  Application router, which lifts that guard constant's inventory from 367 to
  373 while the WebPortal table is byte-identical across the span and the
  shared overlap holds at 11, so the union grows from 404 to 410 `[method,
  path]` tuples (373 + 48 − 11). Because the route bytes genuinely moved, the
  provenance-stripped route-content digest and the sorted-tuple fence digest
  both shift this wave — the hub-side fence is re-derived, never transcribed.
  The `test/routeManifest.test.ts` sha-, count-, and byte-freeze-md5 pins
  follow in the same commit and the lane survival token rotates to this
  wave's value (two code homes only, as ever). Consumers re-vendor the new
  bytes from master in their cs47 legs, hub last.
  **UN-TAGGED regen — thirty-fourth by design**: the `v0.4.7` tag stays put.

### Changed — W89 (S495): PROVENANCE-ONLY manifest regen (404 tuples — route bytes unmoved) — 2026-09-15

- **S495 provenance regen (lane s495hub; batch44-P1 plan-gap amendment).**
  Re-pinned and regenerated `src/routeManifest.generated.ts` +
  `dist/server-route-manifest.json` against the then-current phlix-server
  master tip. The server span since the cs45 pin is two provenance-only
  dependency-bump merges (#783 bundle rebuild, #784 tokens tag-archive dist
  form) — nothing under `include/`, `src/`, or `public/` moved and both
  `ROUTE_MANIFEST` guard-test sources are byte-identical across the span, so
  this is a pure provenance regen: the `[method, path]` tuples are
  byte-for-byte identical, `total` holds at 404 (union of 367 + 48 − 11
  shared), the sorted-tuple content fence holds at its then-current value,
  and the hub-side
  S332 digest therefore holds unchanged. Only the embedded provenance moves —
  the source sha and generation timestamp — which rotates the export md5 and
  every downstream vendored copy,
  while the route surface they describe is the same set. The
  `test/routeManifest.test.ts` sha- and byte-freeze-md5 pins follow in the
  same commit. The lane survival token is deliberately NOT rotated: this is
  a step lane (S495), not a currency-sync cs wave, and the cs45 token lives
  as a matched pair (one const here, one in the hub parity test) which the
  hub-side AC4 protects verbatim — rotating one side would orphan the pair.
  Consumers re-vendor the new bytes from master; hub lands its three-file
  currency commit against them. **UN-TAGGED regen — thirty-third by
  design**: the `v0.4.7` tag stays put; master drifts provenance-only ahead,
  accepted estate posture.

### Changed — W85 (cs45): PROVENANCE-ONLY manifest regen (404 tuples — route bytes unmoved) — 2026-09-13

- **cs#45 currency cascade (lane cs45).** Re-pinned and regenerated
  `src/routeManifest.generated.ts` + `dist/server-route-manifest.json` against
  the current phlix-server master tip. The server span since the previous pin
  is a web-ui dependency bump only — not even a bundle rebuild: the committed
  front-end output came through byte-identical, and nothing under `include/`,
  `src/`, or `public/` moved — so this is a pure provenance regen: the
  `[method, path]` tuples are byte-for-byte identical to the prior era, `total`
  holds at 404 (union of 367 + 48 − 11 shared), the provenance-stripped
  route-content digest is unmoved, and the hub-side sorted-tuple fence
  therefore holds unchanged. Only the embedded provenance moves — the source
  sha and generation timestamp — which is enough to rotate the export md5 and
  every downstream vendored copy, while the route surface they describe is the
  same set. The `test/routeManifest.test.ts` sha- and byte-freeze-md5 pins
  follow in the same commit and the lane survival token rotates to this wave's
  value (two code homes only, as ever). Consumers re-vendor the new bytes from
  master in their cs45 legs, hub last.
  **UN-TAGGED regen — thirty-second by design**: the `v0.4.7` tag stays put.

## [0.4.7] - 2026-09-13

### Changed — W83 (cs44): PROVENANCE-ONLY manifest regen (404 tuples — route bytes unmoved) — 2026-09-13

- **cs#44 currency cascade (lane cs44).** Re-pinned and regenerated
  `src/routeManifest.generated.ts` + `dist/server-route-manifest.json` against
  the current phlix-server master tip. Unlike the previous wave's content
  regen, the server span since that pin is bundle-only — no route-registration
  file and nothing under `include/` or `src/` moved — so this is a provenance
  regen: the `[method, path]` tuples are byte-for-byte identical to the prior
  era, `total` holds at 404 (union of 367 + 48 − 11 shared), the
  provenance-stripped route-content digest is unmoved, and the hub-side
  sorted-tuple fence therefore holds unchanged. Only the embedded provenance
  moves — the source sha and generation timestamp — which is enough to rotate
  the export md5 and every downstream vendored copy, while the route surface
  they describe is the same set. The `test/routeManifest.test.ts` sha- and
  byte-freeze-md5 pins follow in the same commit and the lane survival token
  rotates to this wave's value (two code homes only, as ever). Consumers
  re-vendor the new bytes from master in their cs44 legs, hub last.
  **UN-TAGGED regen — thirty-first by design**: the `v0.4.6` tag stays put.

### Changed — W81 (cs43): CONTENT manifest regen (404 tuples — S240 adds two music query-param GET routes) — 2026-09-12

- **cs#43 currency cascade (lane cs43).** Regenerated
  `src/routeManifest.generated.ts` + `dist/server-route-manifest.json` against
  the current phlix-server master tip. Unlike the pure re-pin waves, this is a
  CONTENT regen: the server span since the previous pin is S240's additive
  music lookup-by-name surface (a `GET /api/v1/music/artist` and a
  `GET /api/v1/music/album` query-param pair, alongside the existing mbid-path
  routes) plus a following policy commit. Both new rails are registered by the
  Application router, so the Application guard-constant count rises by two and
  the union grows from 402 to 404 `[method, path]` tuples. Because the route
  bytes genuinely moved, the provenance-stripped route-content digest and the
  sorted-tuple fence digest both shift this wave — the hub-side fence is
  re-derived, never transcribed. The `test/routeManifest.test.ts` sha-,
  count-, and byte-freeze-md5 pins follow in the same commit and the lane
  survival token rotates to this wave's value (two code homes only, as ever).
  Consumers re-vendor the new bytes from master in their cs43 legs, hub last.
  **UN-TAGGED regen — thirtieth by design**: the `v0.4.6` tag stays put.

### Changed — W79 (cs42): PURE manifest provenance re-pin (402 tuples unchanged) — 2026-09-12

- **cs#42 currency re-pin cascade (lane cs42).** Regenerated
  `src/routeManifest.generated.ts` + `dist/server-route-manifest.json` against
  the current phlix-server master tip. Route purity re-proven before
  regenerating: the manifest is derived ONLY from the two router-wire guard
  constants, and the server span since the previous pin is four commits of
  SyncPlay bridge/worker, catalog-pin and documentation work touching no
  route-registration file — the scoped span probe on the two guard-constant
  files measures empty and the span shows zero files under the route-bearing
  public and include directories — so the 402 `[method, path]` tuples are
  byte-for-byte unchanged. The provenance-stripped route-content digest and the
  sorted-tuple fence digest measure equal old-vs-new and the source counts hold.
  Only serverSha + generatedAt move; the `test/routeManifest.test.ts` sha- and
  byte-freeze-md5 pins follow in the same commit and the lane survival token
  rotates to this wave's value (two code homes only, as ever). Consumers
  re-vendor the new bytes from master in their cs42 legs, hub last.
  **UN-TAGGED regen — twenty-ninth by design**: the `v0.4.6` tag stays put.

### Changed — W75 (cs41): PURE manifest provenance re-pin (402 tuples unchanged) — 2026-09-12

- **cs#41 currency re-pin cascade (lane cs41).** Regenerated
  `src/routeManifest.generated.ts` + `dist/server-route-manifest.json` against
  the current phlix-server master tip. Route purity re-proven before
  regenerating: the manifest is derived ONLY from the two router-wire guard
  constants, and the server span since the previous pin is one
  parallel-test-harness determinism merge (junit-merge output-shape guard tests
  and its emitter note, plus the release-journal entry) touching no
  route-registration file — the scoped span probe under the server's
  route-bearing source directories measures empty — so the 402 `[method, path]`
  tuples are byte-for-byte unchanged. The provenance-stripped route-content
  digest and the sorted-tuple fence digest measure equal old-vs-new and the
  source counts hold. Only serverSha + generatedAt move; the
  `test/routeManifest.test.ts` sha- and byte-freeze-md5 pins follow in the same
  commit and the lane survival token rotates to this wave's value (two code
  homes only, as ever). Consumers re-vendor the new bytes from master in their
  cs41 legs, hub last. **UN-TAGGED regen — twenty-eighth by design**: the
  `v0.4.6` tag stays put.

### Changed — W72 (cs40): PURE manifest provenance re-pin (402 tuples unchanged) — 2026-09-12

- **cs#40 currency re-pin cascade (lane cs40).** Regenerated
  `src/routeManifest.generated.ts` + `dist/server-route-manifest.json` against
  the current phlix-server master tip. Route purity re-proven before
  regenerating: the manifest is derived ONLY from the two router-wire guard
  constants, and the server span since the previous pin is three merges of
  parallel-harness plumbing and release-journal bookkeeping (suite runner
  dispatch tweaks, ignore-rule tidy, changelog entries) touching no
  route-registration file — the scoped span probe under the server's
  route-bearing source directories measures empty — so the 402 `[method, path]`
  tuples are byte-for-byte unchanged. The provenance-stripped route-content
  digest and the sorted-tuple fence digest measure equal old-vs-new and the
  source counts hold. Only serverSha + generatedAt move; the
  `test/routeManifest.test.ts` sha- and byte-freeze-md5 pins follow in the same
  commit and the lane survival token rotates to this wave's value (two code
  homes only, as ever). Consumers re-vendor the new bytes from master in their
  cs40 legs, hub last. **UN-TAGGED regen — twenty-seventh by design**: the
  `v0.4.6` tag stays put.

### Changed — W70 (cs39): PURE manifest provenance re-pin (402 tuples unchanged) — 2026-09-11

- **cs#39 currency re-pin cascade (lane cs39).** Regenerated
  `src/routeManifest.generated.ts` + `dist/server-route-manifest.json` against
  the current phlix-server master tip. Route purity re-proven before
  regenerating: the manifest is derived ONLY from the two router-wire guard
  constants, and the server span since the previous pin is one
  packaging-and-installation merge (third-party clone pin updates demanded by
  the install script, plus a folded release-process journal section) touching no
  route-registration file — the scoped span probe under the server's
  route-bearing source directories measures empty — so the 402 `[method, path]`
  tuples are byte-for-byte unchanged. The provenance-stripped route-content
  digest and the sorted-tuple fence digest measure equal old-vs-new and the
  source counts hold. Only serverSha + generatedAt move; the
  `test/routeManifest.test.ts` sha- and byte-freeze-md5 pins follow in the same
  commit and the lane survival token rotates to this wave's value (two code
  homes only, as ever). Consumers re-vendor the new bytes from master in their
  cs39 legs, hub last. **UN-TAGGED regen — twenty-sixth by design**: the
  `v0.4.6` tag stays put.

### Changed — W67 (cs38): PURE manifest provenance re-pin (402 tuples unchanged) — 2026-09-11

- **cs#38 currency re-pin cascade (lane cs38).** Regenerated
  `src/routeManifest.generated.ts` + `dist/server-route-manifest.json` against
  the current phlix-server master tip. Route purity re-proven before
  regenerating: the manifest is derived ONLY from the two router-wire guard
  constants, and the server span since the previous pin is two packaging-and-
  operations merges (immutable sha-suffixed tags published for all server
  runtime images, then helm charts and docker examples demanding those
  immutable image pins — loud over silent) touching no route-registration
  file; the scoped span probe under the server's route-bearing source
  directories measures empty — so the 402 `[method, path]` tuples are
  byte-for-byte unchanged. The provenance-stripped route-content digest and
  the sorted-tuple fence digest measure equal old-vs-new and the source counts
  hold. Only serverSha + generatedAt move; the `test/routeManifest.test.ts`
  sha- and byte-freeze-md5 pins follow in the same commit and the lane survival
  token rotates to this wave's value (two code homes only, as ever). Consumers
  re-vendor the new bytes from master in their cs38 legs, hub last.
  **UN-TAGGED regen — twenty-fifth by design**: the `v0.4.6` tag stays put.

### Changed — W63 (cs37): PURE manifest provenance re-pin (402 tuples unchanged) — 2026-09-11

- **cs#37 currency re-pin cascade (lane cs37).** Regenerated
  `src/routeManifest.generated.ts` + `dist/server-route-manifest.json` against
  the current phlix-server master tip. Route purity re-proven before
  regenerating: the manifest is derived ONLY from the two router-wire guard
  constants, and the server span since the previous pin is two test-and-CI-only
  merges (a pooled-connection concurrency test, a request dynamic-property
  census executable test, a third-party clone pin guard test, plus two CI
  workflow files and the browser-e2e prerequisite helper) touching no
  route-registration file — so the 402 `[method, path]` tuples are byte-for-byte
  unchanged. The provenance-stripped route-content digest and the sorted-tuple
  fence digest measure equal old-vs-new and the 365+48−11 source counts hold.
  Only serverSha + generatedAt move; the `test/routeManifest.test.ts` sha- and
  byte-freeze-md5 pins follow in the same commit and the lane survival token
  rotates to this wave's value (two code homes only, as ever). Consumers
  re-vendor the new bytes from master in their cs37 legs, hub last.
  **UN-TAGGED regen — twenty-fourth by design**: the `v0.4.6` tag stays put.

### Changed — W61 (cs36): PURE manifest provenance re-pin (402 tuples unchanged) — 2026-09-11

- **cs#36 currency re-pin cascade (lane cs36).** Regenerated
  `src/routeManifest.generated.ts` + `dist/server-route-manifest.json` against
  the current phlix-server master tip. Route purity re-proven before
  regenerating: the manifest is derived ONLY from the two router-wire guard
  constants, and the server span since the previous pin is a single test-only
  change (a transcoding test race fix plus changelog prose) touching no
  route-registration file — so the 402 `[method, path]` tuples are byte-for-byte
  unchanged. The provenance-stripped route-content digest and the sorted-tuple
  fence digest measure equal old-vs-new and the 365+48−11 source counts hold.
  Only serverSha + generatedAt move; the `test/routeManifest.test.ts` sha- and
  byte-freeze-md5 pins follow in the same commit and the lane survival token
  rotates to this wave's value (two code homes only, as ever). Consumers
  re-vendor the new bytes from master in their cs36 legs, hub last.
  **UN-TAGGED regen — twenty-third by design**: the `v0.4.6` tag stays put.

### Changed — W59 (cs35): manifest regen with a route add (402 tuples) — 2026-09-11

- **cs#35 currency re-pin cascade (lane cs35).** Regenerated
  `src/routeManifest.generated.ts` + `dist/server-route-manifest.json` against
  the current phlix-server master tip. Unlike the previous pure provenance
  waves, this span is a genuine route change: server change S73 registers a new
  WebPortal read for a person's photo, so the WebPortal router-wire guard grows
  by one entry and the manifest total moves from 401 to 402 tuples (365
  Application + 48 WebPortal − 11 shared). The Application router count holds at
  365 and the shared count at 11; only the WebPortal count and total shift, and
  the added `[method, path]` tuple is the single person-photo read. Because the
  tuple set itself changed, the provenance-stripped route-content digest, the
  sorted-tuple fence digest, and the full-file export md5 all move as intended —
  there is nothing here to hold equal, and the byte-freeze pin in
  `test/routeManifest.test.ts` re-pins to the new export in the same commit
  alongside the updated source and total counts. The lane survival token rotates
  to this wave's value (two code homes only, as ever). Consumers re-vendor the
  new bytes from master in their cs35 legs, hub last. **UN-TAGGED regen —
  twenty-second by design**: the `v0.4.6` tag stays put.



- **cs#34 currency re-pin cascade (lane cs34).** Regenerated
  `src/routeManifest.generated.ts` + `dist/server-route-manifest.json` against
  the current phlix-server master tip. Route purity re-proven before
  regenerating: the manifest is derived ONLY from the two router-wire guard
  constants, and both generator-input guard blobs hash identically at the
  previous pin and the new target, so the 401 `[method, path]` tuples are
  byte-for-byte unchanged — the provenance-stripped route-content md5 and the
  sorted-tuple fence digest measure equal old-vs-new and the 365+47−11 source
  counts hold. The server-side deltas between the two pins (S256 static-analysis
  work under scripts/config/tests and the S72 person-keyed shared artwork cache
  under Media/Metadata and Media/Library, plus CI workflow definitions and
  changelog prose) touch no route-registration file. Only serverSha +
  generatedAt move; the `test/routeManifest.test.ts` sha- and byte-freeze-md5
  pins follow in the same commit and the lane survival token rotates to this
  wave's value (two code homes only, as ever). Consumers re-vendor the new bytes
  from master in their cs34 legs, hub last. **UN-TAGGED regen — twenty-first by
  design**: the `v0.4.6` tag stays put.

### Changed — W57 (cs33): PURE manifest provenance re-pin (401 tuples unchanged) — 2026-09-10

- **cs#33 currency re-pin cascade (lane cs33).** Regenerated
  `src/routeManifest.generated.ts` + `dist/server-route-manifest.json` against
  the current phlix-server master tip. Route purity re-proven before
  regenerating: the routing surface from the previous pin to the new target is
  byte-for-byte unchanged (the only server-side deltas since the previous pin sit
  in CI workflow definitions, changelog prose and test-support scripts, no
  route-registration files), and both generator-input guard blobs hash
  identically at both ends — so the 401 `[method, path]` tuples are unchanged,
  the provenance-stripped route-content md5 and the sorted-tuple fence digest
  measure equal old-vs-new, and the 365+47−11 source counts hold. Only
  serverSha + generatedAt move; the `test/routeManifest.test.ts` sha- and
  byte-freeze-md5 pins follow in the same commit and the lane survival token
  rotates to this wave's value (two code homes only, as ever). Consumers
  re-vendor the new bytes from master in their cs33 legs, hub last.
  **UN-TAGGED regen — twentieth by design**: the `v0.4.6` tag stays put.

### Changed — W55 (cs32): PURE manifest provenance re-pin (401 tuples unchanged) — 2026-09-10

- **cs#32 currency re-pin cascade (lane cs32).** Regenerated
  `src/routeManifest.generated.ts` + `dist/server-route-manifest.json` against
  the current phlix-server master tip. Route purity re-proven before
  regenerating: the routing surface from the previous pin to the new target is
  byte-for-byte unchanged (the only server-side deltas since the previous pin sit
  in media storage + the rebuilt asset bundle, no route-registration files), and
  both generator-input guard blobs hash identically at both ends — so the 401
  `[method, path]` tuples are unchanged, the provenance-stripped route-content
  md5 measures equal old-vs-new, and the 365+47−11 source counts hold. Only
  serverSha + generatedAt move; the `test/routeManifest.test.ts` sha- and
  byte-freeze-md5 pins follow in the same commit and the lane survival token
  rotates to this wave's value (two code homes only, as ever). Consumers
  re-vendor the new bytes from master in their cs32 legs, hub last.
  **UN-TAGGED regen — nineteenth by design**: the `v0.4.6` tag stays put.

### Changed — W53 (cs31): PURE manifest provenance re-pin (401 tuples unchanged) — 2026-09-10

- **cs#31 currency re-pin cascade (lane cs31).** Regenerated
  `src/routeManifest.generated.ts` + `dist/server-route-manifest.json` against
  the current phlix-server master tip. Route purity re-proven before
  regenerating: the `include` + `src` + `public` span from the previous pin to
  the new target is empty, and both generator-input guard blobs hash
  identically at both ends — so the 401 `[method, path]` tuples are unchanged,
  the provenance-stripped route-content md5 measures equal old-vs-new, and the
  365+47−11 source counts hold. Only serverSha + generatedAt move; the
  `test/routeManifest.test.ts` sha- and byte-freeze-md5 pins follow in the same
  commit and the lane survival token rotates to this wave's value (two
  code homes only, as ever). Consumers re-vendor the new bytes from master in
  their cs31 legs, hub last. **UN-TAGGED regen — eighteenth by design**: the
  `v0.4.6` tag stays put.

### Changed — W50 (cs30 era-2): PURE manifest provenance re-pin (401 tuples unchanged) — 2026-09-09

- **cs#30 re-cascade (server moved mid-wave).** phlix-server master advanced one merge
  (`32183f5b` → `5986b61d`, S210 #749 — docker boot-gate bounds only: workflows +
  `scripts/docker-boot-smoke.sh` + guard test). Re-proven route-zero before regenerating:
  `Router.php`, `Application.php`, both wire-path guard tests, and the whole `Routes/` +
  `FastPath/` trees are byte-identical across the span; zero route-wiring hunks. Manifest
  regenerated from the live server checkout — counts hold at 365 + 47 − 11 = **401**, the
  stripped route-content md5 **holds exactly** (`508a…`); only provenance lines move, so the
  full-file md5 advances. Test pins (`sourceSha`, manifest md5, title cite) follow in the
  same commit; lane ritual token unchanged; consumers re-vendor in their own cs30b PRs.

### Changed — W49 (cs30): PURE manifest provenance re-pin (401 tuples unchanged) — 2026-09-09

- **cs#30 currency re-pin cascade (lane cs30a).** Regenerated
  `src/routeManifest.generated.ts` + `dist/server-route-manifest.json` against
  server master `32183f5b`. The span `e15d9543` → `32183f5b` is two merges
  (S266 #747 deterministic Timer-probe outcomes for the six LiveTv/Relay
  cases, S171 #748 resolve the unserved `public/index.php` front controller),
  both route-zero: the full route-authority set — both generator-source
  guard tests, `Router.php`, and the `Routes/` + `FastPath/` trees — is
  blob- and tree-identical across it, `WebPortalRouter.php` moves only in
  comments (its strip-whitespace md5 is equal at both ends), and the deleted
  front controller carried zero route-wiring hits, so the 401 `[method,
  path]` tuples are unchanged — the provenance-stripped route-content md5
  measures equal old-vs-new and the 365+47−11 source counts hold. Only
  serverSha + generatedAt move; `test/routeManifest.test.ts` sha- and
  byte-freeze-md5 pins follow. **UN-TAGGED regen — seventeenth by
  design**: the `v0.4.6` tag stays put; consumers vendor the JSON bytes from
  master and re-vendor in lock-step.

### Changed — W48 (cs29): PURE manifest provenance re-pin (401 tuples unchanged) — 2026-09-09

- **cs#29 currency re-pin cascade (lane cs29a).** Regenerated
  `src/routeManifest.generated.ts` + `dist/server-route-manifest.json` against
  server master `e15d9543`. The span `a5cde27e` → `e15d9543` is two merges
  (S211 #745 absolute config-dir resolution, S114 #746 stats_storage unique
  key), both route-zero: the full route-authority set — both generator-source
  guard tests, `Router.php`, `WebPortalRouter.php`, and the `Routes/` +
  `FastPath/` trees — is blob- and tree-identical across it, and
  `Application.php` (moved by S211) carries zero route-wiring hunks, so the
  401 `[method, path]` tuples are unchanged — the provenance-stripped
  route-content md5 measures equal old-vs-new and the 365+47−11 source counts
  hold. Only serverSha + generatedAt move; `test/routeManifest.test.ts`
  sha- and byte-freeze-md5 pins follow. **UN-TAGGED regen — sixteenth by
  design**: the `v0.4.6` tag stays put; consumers vendor the JSON bytes from
  master and re-vendor in lock-step.

### Changed — W47 (cs28): PURE manifest provenance re-pin (401 tuples unchanged) — 2026-09-09

- **cs#28 currency re-pin cascade (lane cs28a).** Regenerated
  `src/routeManifest.generated.ts` + `dist/server-route-manifest.json` against
  server master `a5cde27e`. The span `afe54c7c` → `a5cde27e` is one merge
  (S187 unused-import reflow, route-zero): all five route-authority files
  (both generator-source guard tests + the three router bootstraps) are
  byte-identical across it, so the 401 `[method, path]` tuples are unchanged —
  the provenance-stripped route-content md5 measures equal old-vs-new and the
  365+47−11 source counts hold. Only serverSha + generatedAt move; `test/routeManifest.test.ts`
  sha- and byte-freeze-md5 pins follow. **UN-TAGGED regen — fifteenth by
  design**: the `v0.4.6` tag stays put; consumers vendor the JSON bytes from
  master and re-vendor in lock-step.

### Changed — W46 (cs27): PURE manifest provenance re-pin (401 tuples unchanged) — 2026-09-09

- **cs#27 currency re-pin cascade (lane cs27a).** Regenerated
  `src/routeManifest.generated.ts` + `dist/server-route-manifest.json` against
  server master `afe54c7c`. The span `1e14b539` → `afe54c7c` covers seven
  merges (`d91ae83e` S155, `5fd2f62d` S87, `f5c7b6a4` S322+S130, `148fe3ce`
  S88, `798adc46` S154, `ff8cac9c` S61, `afe54c7c` S89), all route-zero: both
  generator-source guard-test files are byte-identical across the span
  (measured, not assumed), so the 401 `[method, path]` tuples are unchanged
  (provenance-stripped route-set md5 equal old-vs-new). Only serverSha +
  generatedAt move; the 365+47−11 source counts hold. `test/routeManifest.test.ts`
  sha- and byte-freeze-md5 pins follow. **UN-TAGGED regen — fourteenth by
  design**: the `v0.4.6` tag stays put; consumers vendor the JSON bytes from
  master and re-vendor in lock-step.

### Changed — W43 (cs26): manifest regen — REAL route add (non-pure, 401 tuples) — 2026-09-08

- **cs#26 currency cascade (lane s273b).** Regenerated
  `src/routeManifest.generated.ts` + `dist/server-route-manifest.json` against
  server master `1e14b539` (spanning S449 `e450f0b8` — artwork URLs re-minted
  only from raw query bytes, decode-reemit breakout closed —, S132 `9206faff`
  — doc-only rescope — and S273 `1e14b539` — `POST /api/v1/admin/updates/check`,
  the cached status-refresh trigger endpoint). UNLIKE cs#23–25 this regen is
  NON-PURE: the Application-router guard file gained the 365th tuple
  (WebPortal stays 47, shared stays 11 → union 400 → **401**). The new
  `['POST', '/api/v1/admin/updates/check']` tuple is the only route-set delta;
  provenance `serverSha`/`generatedAt` and the byte-freeze md5 move with it.
  `test/routeManifest.test.ts` short- and full-sha pins, source count 365,
  length 401 + md5 gate follow. **UN-TAGGED regen — thirteenth by design**:
  consumers vendor the JSON bytes from master, not a tag; the six downstream
  re-vendor in lock-step.

### Changed — W39 (cs25): manifest provenance re-pin (no route change) — 2026-09-08

- **cs#25 currency cascade (lane cs25a re-pin).** Regenerated
  `src/routeManifest.generated.ts` + `dist/server-route-manifest.json` against
  server master `2746677e` (spanning S166 `a15fd786` — plugin composer
  ClassLoader unregistered on disable/uninstall, leak closed — and S112
  `2746677e` — the five MediaItemShaper URL surfaces validated at emission).
  Both generator-source guard-test files are byte-identical across
  `df6aa8e5` → `2746677e`, so the 400 `[method, path]` tuples are
  byte-identical (provenance-stripped deep-equal, added=[] removed=[]);
  only serverSha + generatedAt move. `test/routeManifest.test.ts` short- and
  full-sha pins + byte-freeze md5 gate follow; vector-authority `01340633`
  fixture pins deliberately untouched. **UN-TAGGED regen — twelfth by design**:
  consumers vendor the JSON bytes from master, not a tag; the six downstream
  re-vendor in lock-step.

### Changed — W38 (cs24): manifest provenance re-pin (no route change) — 2026-09-07

- **cs#24 currency cascade (lane cs24a re-pin).** Regenerated
  `src/routeManifest.generated.ts` + `dist/server-route-manifest.json` against
  server master `df6aa8e5` (spanning S306 `bcf47cd0` — tests/ under Psalm at
  measured L5 via `psalm-tests.xml` + CI scope gate —, S161 `614cf766` —
  migrations 096/097 + `Deduper` detect UNIQUE index by SHAPE, not just name —,
  and S227 `df6aa8e5` — ThemeRegistry dead-island deletion, the second fake
  theming subsystem beside the real one). Both generator-source guard-test files
  are byte-identical across `bab33ff2` → `df6aa8e5`, so the 400 `[method, path]`
  tuples are byte-identical (provenance-stripped deep-equal, added=[] removed=[]);
  only serverSha + generatedAt move. `test/routeManifest.test.ts` short- and
  full-sha pins + byte-freeze md5 gate follow; vector-authority `01340633`
  fixture pins deliberately untouched. **UN-TAGGED regen — eleventh by design**:
  consumers vendor the JSON bytes from master, not a tag; the six downstream
  re-vendor in lock-step.

### Changed — W38 (cs23): manifest provenance re-pin (no route change) — 2026-09-06

- **cs#23 currency cascade (lane cs23a re-pin).** Regenerated
  `src/routeManifest.generated.ts` + `dist/server-route-manifest.json` against
  server master `bab33ff2` (spanning S289 `4555dce3` — one SyncPlay identity
  across REST and WS —, S291 `de32575f` — reported-position semantics —, and
  S443 `bab33ff2` — `Uuid::v4` CSPRNG entropy + order-seed fuzz / real-DB
  dup-PK proof). Both generator-source guard-test files are byte-identical
  across `8a90e20e` → `bab33ff2`, so the 400 `[method, path]` tuples are
  byte-identical (provenance-stripped deep-equal, added=[] removed=[]); only
  serverSha + generatedAt move. `test/routeManifest.test.ts` short- and full-sha
  pins + byte-freeze md5 gate follow; vector-authority `01340633` fixture pins
  deliberately untouched. **UN-TAGGED regen — tenth by design**: consumers vendor
  the JSON bytes from master, not a tag; the six downstream re-vendor in lock-step.

### Changed — W38 (cs22): manifest provenance re-pin (no route change) — 2026-09-06

- **cs#22 currency cascade.** Regenerated `src/routeManifest.generated.ts` +
  `dist/server-route-manifest.json` against server master `e4853f0f` (previous
  provenance `e729d48a` → `e4853f0f`, spanning S438 `f17cafe6` — markWatched
  finalize path + real-DB finish tests — and S439 `e4853f0f` — test-suite
  zero-residue close-out). S439 touched one generator-source file,
  `ApplicationRouterWirePathGuardTest.php`, but only its `tearDown()` residue
  sweep — zero `ROUTE_MANIFEST` entries added or removed; S438 touched no guard
  test. All 400 `[method, path]` tuples are byte-identical (provenance-stripped
  deep-equal, added=[] removed=[], order-preserving list equality); only
  provenance (serverSha + generatedAt) moves. New manifest md5
  `791235d4b9dde49dfc3b85853238446a` (was `7accd31d1d4d180c5c1c59ea87cbcc96`).
  `test/routeManifest.test.ts` short- and full-sha pins follow; vector-authority
  `01340633` fixture pins deliberately untouched (cs21b precedent). **UN-TAGGED
  regen — eighth by design**: consumers vendor the JSON bytes from master, not a
  tag; the six downstream re-vendor in lock-step.
- **cs#22 continuation (lane cs22f re-pin).** Same regen re-run at server master
  `8a90e20e` (spanning S215 `1ff724a7` — auto-collection sync enqueue — and
  S252+S220 `8a90e20e` — badge live/enabled signals). Both generator-source
  guard-test files are byte-identical across `e4853f0f` → `8a90e20e`, so the
  400 `[method, path]` tuples are byte-identical (provenance-stripped
  deep-equal, added=[] removed=[]); only serverSha + generatedAt move.
  `test/routeManifest.test.ts` sha pins + byte-freeze md5 gate follow;
  vector-authority `01340633` fixture pins untouched. **UN-TAGGED regen —
  ninth by design.**

### Changed — W37 (cs21): manifest provenance re-pin (no route change) — 2026-09-05

- **cs#21 currency cascade.** Regenerated `src/routeManifest.generated.ts` +
  `dist/server-route-manifest.json` against server master `55625dd4` (previous
  provenance `f35a5742` → `55625dd4`, spanning S433–S437). The only route-surface
  change in that span is S437's `[] → [AuthMiddleware]` pin on the two health
  routes: it lands in the ROUTE column of the guard test, which
  `generate-server-route-manifest.mjs` strips, so the `[method, path]` tuple set
  is untouched. All 400 tuples are byte-identical; only provenance (serverSha +
  generatedAt) moves. `test/routeManifest.test.ts` sha pins follow.
  **UN-TAGGED regen — sixth by design**: consumers vendor the JSON bytes from
  master, not a tag; the six downstream re-vendor in lock-step.
- **cs#21b micro-re-pin to server `e729d48a` (caliber-sync tip; routes byte-identical,
  400 tuples).** A direct-to-master owner-authorized Caliber doc-sync commit moved server
  master from `55625dd4` to `e729d48a`; the delta is doc/mirror `.md` files only — zero
  route, generator or guard-test change. Hub currency compares the fixture `source_sha`
  against server tip, so the whole cascade follows `e729d48a`. Regenerated
  `src/routeManifest.generated.ts` + `dist/server-route-manifest.json` at that tip; all
  400 `[method, path]` tuples are byte-identical (provenance-stripped deep-equal, added/removed
  empty), only provenance (serverSha + generatedAt) moves. `test/routeManifest.test.ts`
  short- and full-sha pins follow. **UN-TAGGED regen — seventh by design**: consumers vendor
  the JSON bytes from master, not a tag; the six downstream re-vendor in lock-step.

### Changed — W34 (cs20retag): manifest provenance re-pin (no route change) — 2026-09-05

- **cs#20 combined re-tag + currency cascade.** Regenerated `src/routeManifest.generated.ts` +
  `dist/server-route-manifest.json` against server master `f35a5742` (one commit above the previous
  provenance `3a253991` — the web-ui `@phlix/ui` v0.99.0→v0.99.1 re-pin: package.json + lockfile +
  CHANGELOG only, zero PHP, zero route hunks). All 400 tuples are byte-identical; only provenance
  (serverSha + generatedAt) moves. `test/routeManifest.test.ts` sha pins follow.
  **UN-TAGGED regen — fifth by design**: consumers vendor the JSON bytes from master, not a tag;
  the six downstream copies re-vendor in lock-step.

### Changed — W33 (cs19): manifest provenance re-pin (no route change) — 2026-09-05

- **cs#19 currency cascade.** Regenerated `src/routeManifest.generated.ts` +
  `dist/server-route-manifest.json` against server master `3a253991` (one
  commit above the previous provenance `e74cdc88` — S431 executable Request
  dynamic-property census, touching CHANGELOG + one census test only: no
  `src/`, neither generator-source guard test, zero route hunks). All 400
  tuples are byte-identical; only provenance (serverSha + generatedAt) moves.
  `test/routeManifest.test.ts` sha pins follow.
  **UN-TAGGED regen — `v0.4.6` is unchanged**: consumers vendor the JSON bytes
  from master, not a tag; the six downstream re-vendored in lock-step.

### Changed — W31 (cs18): manifest provenance re-pin (no route change) — 2026-09-05

- **cs#18 currency cascade.** Regenerated `src/routeManifest.generated.ts` +
  `dist/server-route-manifest.json` against server master `e74cdc88` (two
  commits above the previous provenance `4b620f59` — S427 `__get`/`__isset`
  reachability guard and S228 colors.css parity guard, neither moving a route
  tuple). All 400 tuples are byte-identical; only provenance (serverSha +
  generatedAt) moves. `test/routeManifest.test.ts` sha pins follow.
  **UN-TAGGED regen — `v0.4.6` is unchanged**: consumers vendor the JSON bytes
  from master, not a tag; the six downstream re-vendored in lock-step.

### Changed — W29 (cs17): manifest provenance re-pin (no route change) — 2026-09-04

- **cs#17 currency cascade.** Regenerated `src/routeManifest.generated.ts` +
  `dist/server-route-manifest.json` against server master `4b620f59` (two
  commits above the previous provenance `888a42b2` — S423 auth-posture and
  S271 `jsonBody` adoption, neither moving a route tuple). All 400 tuples are
  byte-identical; only provenance (serverSha + generatedAt) moves.
  `test/routeManifest.test.ts` sha pins follow. **UN-TAGGED regen — `v0.4.6`
  is unchanged**: no consumer takes a tag this wave; the seven consumers
  re-vendored the JSON copy from master in lock-step.

### Changed — W26 (cs16): manifest provenance re-pin (no route change)

- Regenerated `src/routeManifest.generated.ts` + `dist/server-route-manifest.json`
  against server master `888a42b2` (one commit above the previous provenance
  `01340633` — S415 touched SyncPlay envelope sources only, zero route sources).
  All 400 tuples are byte-identical; only provenance (serverSha + generatedAt)
  moves. `test/routeManifest.test.ts` sha pins follow. The stream-track and
  syncplay-envelope vector-authority pins deliberately stay at `01340633` —
  that is when their vectors were dumped, and their sources are unchanged.

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

[Unreleased]: https://github.com/detain/phlix-contracts/compare/v0.5.6...HEAD
[0.5.6]: https://github.com/detain/phlix-contracts/compare/v0.5.5...v0.5.6
[0.5.5]: https://github.com/detain/phlix-contracts/compare/v0.5.4...v0.5.5
[0.5.4]: https://github.com/detain/phlix-contracts/compare/v0.5.3...v0.5.4
[0.5.3]: https://github.com/detain/phlix-contracts/compare/v0.5.2...v0.5.3
[0.5.2]: https://github.com/detain/phlix-contracts/compare/v0.5.1...v0.5.2
[0.5.1]: https://github.com/detain/phlix-contracts/compare/v0.5.0...v0.5.1
[0.5.0]: https://github.com/detain/phlix-contracts/compare/v0.4.7...v0.5.0
[0.4.7]: https://github.com/detain/phlix-contracts/compare/v0.4.6...v0.4.7
[0.4.6]: https://github.com/detain/phlix-contracts/compare/v0.4.5...v0.4.6
[0.4.5]: https://github.com/detain/phlix-contracts/compare/v0.4.4...v0.4.5
[0.4.4]: https://github.com/detain/phlix-contracts/compare/v0.4.3...v0.4.4
[0.4.3]: https://github.com/detain/phlix-contracts/compare/v0.4.2...v0.4.3
[0.4.2]: https://github.com/detain/phlix-contracts/compare/v0.4.1...v0.4.2
[0.4.1]: https://github.com/detain/phlix-contracts/compare/v0.4.0...v0.4.1
[0.3.13]: https://github.com/detain/phlix-contracts/compare/v0.4.0...v0.3.13
[0.4.0]: https://github.com/detain/phlix-contracts/compare/v0.3.12...v0.4.0
[0.3.12]: https://github.com/detain/phlix-contracts/compare/v0.3.11...v0.3.12
[0.3.11]: https://github.com/detain/phlix-contracts/compare/v0.3.8...v0.3.11
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

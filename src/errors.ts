/**
 * errors.ts — the estate error-code registry (Wave 1 of the error-code doctrine).
 *
 * DOCTRINE (owner-approved): the stable machine error code carried on the wire
 * is the single source of truth for *what went wrong*. Clients localize by code;
 * the server's English `message`/`error` text is a debug fallback, never a
 * parsing target. There is NO server-side i18n and NO protocol-level locale
 * negotiation — servers speak codes, clients speak languages.
 *
 * SHAPE ON THE WIRE:
 *  - REST (server + hub `Error` envelope): `{ error: <human text>, code: <machine
 *    code> }`. The server openapi declares `code` as a "Machine-readable dotted
 *    error code (e.g. auth.not_admin)"; the hub openapi as "Stable machine code,
 *    e.g. auth.required, user.not_found, rate_limited".
 *  - SyncPlay WebSocket (`ErrorPayload`, defined in the `phlix-syncplay`
 *    package, not here): `{ error_code?: string, code?: string, message: string }`
 *    with the SPEC read order `error_code` first, then `code`. Servers keep
 *    emitting that payload shape; this module is the code *vocabulary*, not the
 *    envelope.
 *
 * NAMING (forward doctrine): new codes are `domain.snake_case` dotted. Legacy
 * wire values are listed VERBATIM — they are live traffic and renaming one is a
 * breaking wire change (that is a Wave-2 tagged cascade, not a Wave-1 edit).
 *
 * COORDINATE CURRENCY: every hub/server file:line cite below was re-anchored
 * against a read-only checkout of each repo at head — hub coords verified @
 * b83639fa9c5979bc93ca961b059e4a39466c1cf8 (post hub #318/#321/#322), server
 * coords verified @ e0e010b07c7f4cc21baf10d9a945bac24edab45c (post server
 * #793/#794/#795) — 2026-09-24. Re-sweep with `npm run verify:cites`
 * (scripts/check-error-cites.mjs) after any hub/server error-file churn.
 *
 * CONTENTS:
 *  1. Every dotted and bare-snake code actually emitted on the wire today by
 *     phlix-server or phlix-hub, PLUS the Wave-1b dotted twins of every
 *     code-shaped value the server/hub emit-waves will place on the wire
 *     (verified at source; file:line in per-entry refs). FIELD PLACEMENT: the
 *     registry describes vocabulary, not channel. Most entries ride the machine
 *     `code`/`error_code` field today; a documented minority still ride the
 *     human `error` TEXT field (or a machine sub-field like `denial_type`) and
 *     each such domain carries a caveat docblock. The SCREAMING-form values the
 *     first drafts flagged for flipping (`UNAUTHENTICATED`,
 *     `ENROLLMENT_TOKEN_EXPIRED`, `ALEXA_*`, the hub claim/protocol/relay
 *     families) have LANDED dual placement in hub W3: the dotted forward form
 *     rides `code` and the legacy SCREAMING literal is parked byte-identical
 *     in the same payload's `error` TEXT — clients may match either channel.
 *     The server text-only families (`identity.*`, `provider.*`, `oauth.*`,
 *     `ldap.*`, `auth.missing_credentials` / `auth.invalid_credentials` and
 *     the four profile text traps) are the remaining `error`-TEXT minority;
 *     their per-domain "promote in Wave 2" caveats stay until they land.
 *  2. `legacy` — the 12 SCREAMING_SNAKE codes the SyncPlay WebSocket emits in
 *     `error_code` today (the exact `sendError`/`Messages::error` literal set in
 *     `phlix-server/src/Session/SyncPlay/SyncPlayManager.php` and
 *     `phlix-server/src/Server/WebSocket/MessageHandler.php`). Canonical while
 *     the Wave-2 SyncPlay cutover lands (create/join carriers now wrap these
 *     behind `?? ` fallbacks; the rest still emit raw); do not remove.
 *  3. `syncplay` — dotted twins for the coarse `*_FAILED` prose-carrier
 *     family. The server emit-wave has landed on the wrap sites: `create`/
 *     `join` now flow `Messages::error($result['error_code'] ?? '..._FAILED',
 *     ...)` so the twins reach the wire (the `SYNCPLAY_ERROR_CODE_TWINS` map
 *     below is the migration table); the `leave` carrier still emits raw.
 *     Clients localize them now, so the remaining switch needs no client
 *     release.
 *
 * REGISTERED IN WAVE 1b (previously Wave-2 triage; every emit site re-verified
 * at phlix-server 838da686 / phlix-hub c023a341):
 *  - Hub server-lifecycle text-field traps → dotted twins:
 *    `HUB_PROTOCOL_UNSUPPORTED` → `hub.protocol_unsupported`, `HUB_INTERNAL_ERROR` →
 *    `hub.internal_error`, `SERVER_KEY_INVALID` → `server.key_invalid`, the
 *    `CLAIM_CODE_*` trio → `claim.*`, `AUTHORIZATION_FAILED` ("Server ID
 *    mismatch") → `auth.server_mismatch`.
 *  - Hub code-channel SCREAMING values → dotted forward-form twins:
 *    `UNAUTHENTICATED` → `auth.unauthenticated`, `ENROLLMENT_TOKEN_EXPIRED` →
 *    `auth.enrollment_expired`, the 14 `ALEXA_*` rejection codes → `alexa.*`.
 *  - Server middleware pseudo-codes/machine sub-fields → `stream.limit_exceeded`
 *    (← `StreamLimitExceeded` + `denial_type=stream_limit_exceeded`),
 *    `access.scheduled` (← `AccessScheduled`), `profile.not_found` (←
 *    `denial_type=profile_not_found`). The CastingEnabledMiddleware site
 *    already emits the registered `casting.disabled` on `code` with only prose
 *    in the interpolated `error` text — no new code needed there.
 *  - Server text-snake family (AccountLink/AuthProvider/OIDC/GitHub/LDAP
 *    surfaces) → `identity.*`, `provider.*`, `oauth.*`, `ldap.*`, plus
 *    `auth.missing_credentials` / `auth.invalid_credentials`.
 *
 * NOT IN THIS REGISTRY (still excluded — registering these would freeze a lie):
 *  - Hub relay handshake internals `INVALID_TOKEN` and `SERVER_MISMATCH`:
 *    `InvalidArgumentException` MESSAGES thrown by `onConnect` in hub
 *    RelayServerHandler.php:78,83,87 on the WS server-attach path. The handler
 *    has no production caller of `onConnect` yet (dormant path); were it live,
 *    the throws would be logged by relay-worker catch sites — they never surface
 *    as a `code`-field value or client-reachable code-shaped text, so they are
 *    worker diagnostics, not wire codes.
 *  - RFC 6749/6750 OAuth codes the hub emits in the `error` field
 *    (`invalid_client`, `invalid_grant`, `access_denied`, `server_error`,
 *    `invalid_token`, `insufficient_scope`, …) — those are spec-mandated OAuth
 *    wire values, frozen by the RFC, not estate codes.
 *  - Numeric codes: JSON-RPC `-32700…-32603` (hub `JsonRpc.php`) and UPnP/DLNA
 *    SOAP fault codes (server `Dlna/*`) — different channel, different type.
 *  - Defined-but-never-emitted constants: `profile.not_owned`
 *    (`ProfileNotOwnedException`, swallowed in `AuthManager::resolveProfile-
 *    ForUser`), server `HubClient` fallbacks `UNKNOWN`/`UNAUTHORIZED`/
 *    `HEARTBEAT_FAILED` (internal server↔hub diagnostics), and the
 *    `Messages::error` docblock examples `GROUP_FULL`/`INVALID_PASSWORD`.
 *  - Text words that are display aliases of ALREADY-registered codes — the
 *    hub W3 emit-wave co-emits them with their twins, no new vocabulary:
 *    `SERVER_NOT_FOUND` (hub ServerController.php:181-186,238-243, and the
 *    hub SubdomainController.php:128 allocation 404 where hub #322 landed the
 *    dual placement — dotted on `code`, legacy literal parked in `error`
 *    TEXT; clients may match either) → `server.not_found`;
 *    `MISSING_SERVER_ID` (hub SubdomainController.php:77,173,209,
 *    RelayController.php:61, ClientMountController.php:89 — dotted
 *    `missing_server_id` on `code`, legacy text parked) → `missing_server_id`
 *    (common); `UNAUTHORIZED` (hub SubdomainController.php:92,102,109,115,120,219,229,236,242,247,
 *    RelayController.php:76,86,93,99,104 — 401 enrollment gates; the hub wave
 *    attached `auth.required` / `auth.enrollment_expired` /
 *    `auth.server_mismatch` on `code` per message, legacy text parked);
 *    `UPGRADE_REQUIRED` (hub RelayController.php:113,
 *    ClientMountController.php:121) co-emits `relay.ws_http_endpoint` /
 *    `relay.client_ws_endpoint` on `code`; `NOT_IMPLEMENTED_VIA_HTTP` and
 *    `NOT_IMPLEMENTED` (hub ClientMountController.php:133,
 *    RelayController.php:134, SubdomainController.php:185) co-emit the
 *    registered `relay.*`/`tls.*` codes on `code` in the same payload —
 *    covered.
 *
 * The JSON mirror `dist/error-codes.json` is generated by
 * `scripts/emit-error-codes.mjs` from the built bundle — same bridge as
 * `dist/mcp-scopes.json` for PHP consumers (hub/server have no Node step).
 * `test/errors.test.ts` pins every wire value independently and byte-freezes
 * the WORKING-COPY artifact; committed-freshness is gated in CI by the
 * `git diff --exit-code -- dist/error-codes.json` step that runs immediately
 * after `npm run build` (the build heals the working copy before the suite
 * runs, so the test alone cannot see a stale COMMITTED file in CI).
 *
 * @copyright 2026 Joe Huss <detain@interserver.net>
 */

/**
 * The registry, nested by domain namespace. Key = stable identifier, value =
 * exact wire string. Insertion order is contractual: `ERROR_CODES` and
 * `dist/error-codes.json` preserve it, so consumers may pin the list ordered.
 */
const CODES = {
   /**
    * Authentication/authorization gate failures, spoken by BOTH servers.
    * CAVEAT (Wave 1b, updated post-hub-W3): the hub emit-wave promoted
    * `auth.unauthenticated`, `auth.enrollment_expired` and
    * `auth.server_mismatch` to the dotted forward form on the `code` channel —
    * the legacy SCREAMING values (`UNAUTHENTICATED`,
    * `ENROLLMENT_TOKEN_EXPIRED`, `AUTHORIZATION_FAILED`) now ride the `error`
    * TEXT field of the same payloads, so clients may match either channel.
    * `auth.missing_credentials` / `auth.invalid_credentials` (server
    * AccountLink surface) still ride the `error` TEXT field only; the server
    * emit-wave promotes them.
    */
  auth: {
    /** srv AuthMiddleware.php:62 (+24 controller/helper sites) · hub AuthMiddleware.php:113 */
    REQUIRED: 'auth.required',
    /** srv AdminMiddleware.php:101 (+9) · hub AdminMiddleware.php:62 */
    NOT_ADMIN: 'auth.not_admin',
    /** hub AuthMiddleware.php:118, McpController.php:352 */
    INVALID_TOKEN: 'auth.invalid_token',
    /** hub AuthMiddleware.php:129 — token subject has no user row */
    USER_NOT_FOUND: 'auth.user_not_found',
    /** srv SignupDisabledException.php:28 → srv AuthController.php:194 (`SignupDisabledException::ERROR_CODE` passthrough) */
    SIGNUPS_DISABLED: 'auth.signups_disabled',
    /** srv AccountInactiveException.php:31 → srv AuthController.php:264 (`errorCode` passthrough) */
    ACCOUNT_PENDING: 'auth.account_pending',
    /** srv AccountInactiveException.php:32 */
    ACCOUNT_DISABLED: 'auth.account_disabled',
    /** srv PasswordChangeRequiredException.php:30 */
    PASSWORD_CHANGE_REQUIRED: 'auth.password_change_required',
    /**
     * hub ServerClaimController.php:110 — 401 on the claim route when no user
     * resolves. Hub W3 promoted the site: dotted `auth.unauthenticated` rides
     * the `code` channel, the SCREAMING `UNAUTHENTICATED` is parked in the
     * `error` TEXT field of the same payload (dual placement).
     */
    UNAUTHENTICATED: 'auth.unauthenticated',
    /**
     * hub EnrollmentJwtMiddleware.php:46,51,56 → `unauthorized()` helper
     * (:76) emits the dotted forward form on the `code` channel with the
     * SCREAMING `ENROLLMENT_TOKEN_EXPIRED` parked in the `error` TEXT
     * (W3 dual placement); hub ServerController.php:232-237 mapError arm does
     * the same (throw sources: DeregisterHandler.php:51,
     * RenewHandler.php:57, HeartbeatHandler.php:65,69).
     */
    ENROLLMENT_EXPIRED: 'auth.enrollment_expired',
    /**
     * hub ServerController.php:76,138,173,208 — 403 refusals when the
     * enrollment token's serverId doesn't match the path serverId. Hub W3
     * promoted: dotted `auth.server_mismatch` rides `code`, the legacy
     * `AUTHORIZATION_FAILED` is parked in the `error` TEXT field (dual
     * placement). The "Server ID mismatch" arms of the hub 401 enrollment
     * gates landed the same dual placement in hub W3: hub
     * SubdomainController.php:115,242 and hub RelayController.php:99 now
     * attach `auth.server_mismatch` to `code` with the legacy `UNAUTHORIZED`
     * parked in the `error` TEXT — the pre-W3 `unauthorized()`-helper
     * deferral described by earlier drafts is obsolete.
     */
    SERVER_MISMATCH: 'auth.server_mismatch',
    /**
     * srv AccountLinkController.php:295 — 400 when the link-identity POST
     * carries no credentials; the TEXT today is 'missing_credentials'. Rides
     * the `error` TEXT field only; the server emit-wave promotes it to the
     * `code` channel; clients match in `error` text until then.
     */
    MISSING_CREDENTIALS: 'auth.missing_credentials',
    /**
     * srv AccountLinkController.php:332 — 401 when submitted credentials fail
     * to verify; the TEXT today is 'invalid_credentials'. Rides the `error`
     * TEXT field only; the server emit-wave promotes it to the `code` channel;
     * clients match in `error` text until then.
     */
    INVALID_CREDENTIALS: 'auth.invalid_credentials',
  },

  /**
   * Server↔hub conversation failures: the server-side account-linking family
   * (phlix-server, all three on the `code` channel) plus the hub-side
   * protocol-envelope failures (phlix-hub). CAVEAT (Wave 1b, updated
   * post-hub-W3): the last two entries were SCREAMING pseudo-codes
   * (`HUB_PROTOCOL_UNSUPPORTED`, `HUB_INTERNAL_ERROR`) on
   * ServerClaimController/ServerController refusals and mapError defaults;
   * hub W3 promoted them — the dotted form now rides the `code` channel and
   * the SCREAMING originals ride the `error` TEXT field (dual placement).
   */
  hub: {
    /** srv AccountLinkController.php:412, HubTokenController.php:67 */
    NOT_ENROLLED: 'hub.not_enrolled',
    /** srv AccountLinkController.php:422, HubTokenController.php:79 */
    TOKEN_REQUIRED: 'hub.token_required',
    /** srv AccountLinkController.php:432,444, HubJwtMiddleware.php:73 */
    JWT_INVALID: 'hub.jwt_invalid',
    /**
     * hub ServerClaimController.php:49,162 · hub ServerController.php:64,126 ·
     * hub HubProtocolMiddleware.php:41-42 — 400 when the `protocol` header is
     * absent or not `phlix-hub`. Hub W3 promoted: dotted rides `code`, the
     * SCREAMING `HUB_PROTOCOL_UNSUPPORTED` is parked in the `error` TEXT of
     * the same payload (dual placement; clients may match either).
     */
    PROTOCOL_UNSUPPORTED: 'hub.protocol_unsupported',
    /**
     * hub ServerClaimController.php:174 · hub ServerController.php:246 —
     * the mapError default 500. Hub W3 promoted: dotted rides `code`, the
     * SCREAMING `HUB_INTERNAL_ERROR` is parked in the `error` TEXT (dual
     * placement; clients may match either).
     */
    INTERNAL_ERROR: 'hub.internal_error',
  },

  /**
   * Hub claim-code exchange failures (phlix-hub `ClaimRequestHandler` →
   * `ServerClaimController::mapError`). CAVEAT (Wave 1b, updated post-hub-W3):
   * the three arms rode the `error` TEXT field as SCREAMING pseudo-codes; hub
   * W3 promoted them — every arm now carries the dotted form on the `code`
   * channel with the SCREAMING original parked byte-identical in the same
   * payload's `error` TEXT (dual placement; clients may match either).
   */
  claim: {
    /**
     * hub ServerClaimController.php:144 (404 arm 142-147) ← throws at
     * hub ClaimRequestHandler.php:162,189 — dotted on `code`, SCREAMING
     * `CLAIM_CODE_NOT_FOUND` parked in `error` text (dual).
     */
    CODE_NOT_FOUND: 'claim.code_not_found',
    /**
     * hub ServerClaimController.php:150 (410 arm 148-153) ← throw at
     * hub ClaimRequestHandler.php:199 — dotted on `code`, SCREAMING
     * `CLAIM_CODE_EXPIRED` parked in `error` text (dual).
     */
    CODE_EXPIRED: 'claim.code_expired',
    /**
     * hub ServerClaimController.php:156 (409 arm 154-159) ← throw at
     * hub ClaimRequestHandler.php:206 — dotted on `code`, SCREAMING
     * `CLAIM_CODE_ALREADY_CLAIMED` parked in `error` text (dual).
     */
    CODE_ALREADY_CLAIMED: 'claim.code_already_claimed',
  },

  /** Hub-side server lookup/tunnel failures (phlix-hub). */
  server: {
    /**
     * hub ServerProxyController.php:978 (+4 controllers). REUSE TARGET —
     * LANDED (hub #322): hub SubdomainController.php:128 — the
     * subdomain-allocation 404 now carries `server.not_found` on the `code`
     * channel with the legacy SCREAMING `SERVER_NOT_FOUND` parked
     * byte-identical in the same payload's `error` TEXT (dual placement;
     * clients may match either channel).
     */
    NOT_FOUND: 'server.not_found',
    /** hub ServerProxyController.php:982 (+3 controllers) */
    NOT_OWNED: 'server.not_owned',
    /** hub ServerProxyController.php:1000 — relay manager absent */
    RELAY_UNAVAILABLE: 'server.relay_unavailable',
    /** hub ServerProxyController.php:1007, RelayProxyManager.php:480 */
    OFFLINE: 'server.offline',
    /** hub RelayProxyManager.php:231 */
    NO_TUNNEL: 'server.no_tunnel',
    /**
     * hub ServerClaimController.php:168 (400 arm 166-171) ← throws at
     * hub ClaimRequestHandler.php:399,402,405,409 — the server's Ed25519 key
     * failed validation during claim. Hub W3 promoted: dotted rides `code`,
     * the SCREAMING `SERVER_KEY_INVALID` is parked in the `error` TEXT (dual
     * placement; clients may match either).
     */
    KEY_INVALID: 'server.key_invalid',
  },

  /** Hub reverse-proxy scope gates. */
  proxy: {
    /** hub ServerProxyController.php:1044,1059 */
    SCOPE_DENIED: 'proxy.scope_denied',
  },

  /** Hub bandwidth quota gate. */
  quota: {
    /** hub ServerProxyController.php:1019 */
    EXCEEDED: 'quota.exceeded',
  },

  /**
   * Concurrent-stream throttle gates (hub proxy + server middleware).
   * CAVEAT (Wave 1b, updated post-server-W2): `stream.limit` rides the hub
   * `code` channel. The server twin below was promoted by the server W2
   * emit-wave: `stream.limit_exceeded` now rides the `code` channel
   * positionally, the CamelCase pseudo-code `StreamLimitExceeded` is parked in
   * the `error` TEXT field and the `denial_type` machine mirror is kept
   * (dual placement; clients may match `code`, `error` text or `denial_type`).
   */
  stream: {
    /** hub ServerProxyController.php:1098 */
    LIMIT: 'stream.limit',
    /**
     * srv StreamLimitMiddleware.php:113-117 (429) · PreRouterFastPaths.php:
     * 569-575 (429) — `'code' => 'stream.limit_exceeded'` alongside the
     * parked `'error' => 'StreamLimitExceeded'` and `'denial_type' =>
     * 'stream_limit_exceeded'` mirror (server W2 dual placement).
     */
    LIMIT_EXCEEDED: 'stream.limit_exceeded',
  },

  /**
   * Server scheduled-access window gate (phlix-server). CAVEAT (Wave 1b,
   * updated post-server-W2): promoted by the server W2 emit-wave —
   * `access.scheduled` rides the `code` channel positionally, the CamelCase
   * pseudo-code `AccessScheduled` is parked in the `error` TEXT field
   * (dual placement; clients may match either).
   */
  access: {
    /**
     * srv AccessScheduleMiddleware.php:99-101,109-111,117-119 — 403 outside
     * the profile's allowed window; `'code' => 'access.scheduled'` with
     * `'error' => 'AccessScheduled'` parked in text (server W2).
     */
    SCHEDULED: 'access.scheduled',
  },

  /** Hub→server upstream gateway failures. */
  gateway: {
    /** hub ServerProxyController.php:1131, RelayProxyManager.php:622, RelayProxyBridge.php:313 */
    TIMEOUT: 'gateway.timeout',
  },

  /** Hub relay endpoint-shape refusals. */
  relay: {
    /** hub ClientMountController.php:122,134 — HTTP hit on the client WS mount */
    CLIENT_WS_ENDPOINT: 'relay.client_ws_endpoint',
    /** hub RelayController.php:113,135 — HTTP hit on the server WS endpoint */
    WS_HTTP_ENDPOINT: 'relay.ws_http_endpoint',
    /** hub RelayProxyManager.php:258 */
    ENCODE_ERROR: 'relay.encode_error',
  },

  /** Hub MCP-surface tool-protocol failures (machine `code`, not JSON-RPC numbers). */
  mcp: {
    /** hub McpToolRegistry.php:154 */
    UNKNOWN_TOOL: 'mcp.unknown_tool',
    /** hub McpToolRegistry.php:166 */
    SCOPE_DENIED: 'mcp.scope_denied',
    /** hub McpToolContext.php:231 */
    STREAMING_UNSUPPORTED: 'mcp.streaming_unsupported',
    /** hub McpController.php:238 */
    SSE_NOT_ACCEPTABLE: 'mcp.sse_not_acceptable',
    /** hub McpController.php:305 */
    UNSUPPORTED_PROTOCOL_VERSION: 'mcp.unsupported_protocol_version',
  },

  /** Hub MCP personal-access-token CRUD. */
  mcp_token: {
    /** hub McpTokenController.php:139 */
    NO_VALID_SCOPES: 'mcp_token.no_valid_scopes',
    /** hub McpTokenController.php:183 */
    NOT_FOUND: 'mcp_token.not_found',
  },

  /**
   * Hub Alexa adapter failures on the machine channel. CAVEAT (Wave 1b,
   * updated post-hub-W3): the fourteen signature-verification entries below
   * used to ride the `code` channel in SCREAMING form — every
   * `AlexaSignatureMiddleware` reject() payload carried `'code' => 'ALEXA_*'`.
   * Hub W3 landed the flip: reject() (hub AlexaSignatureMiddleware.php:745-771)
   * maps each legacy literal through `REJECTION_CODE_MAP` (:208-222), putting
   * the dotted form on `code` and parking the `ALEXA_*` literal byte-identical
   * in the `error` TEXT (dual placement; clients may match either). An
   * unmapped literal now fails fast with a `LogicException` inside reject() —
   * the registry is load-bearing there.
   */
  alexa: {
    /** hub AlexaMediaGateway.php:203 — 501 payload */
    STREAMING_UNSUPPORTED: 'alexa.streaming_unsupported',
    /** hub AlexaSkillController.php:215 */
    MALFORMED_ENVELOPE: 'alexa.malformed_envelope',
    /**
     * hub AlexaSignatureMiddleware.php:288 — fail-closed catch around
     * verification itself. W3 dual placement: dotted on `code`, legacy
     * 'ALEXA_VERIFICATION_ERROR' parked in `error` TEXT (map row :209).
     */
    VERIFICATION_ERROR: 'alexa.verification_error',
    /**
     * hub AlexaSignatureMiddleware.php:301 — no cert-chain-Url header.
     * 'ALEXA_MISSING_CERT_CHAIN_URL' parked in TEXT (map row :210).
     */
    MISSING_CERT_CHAIN_URL: 'alexa.missing_cert_chain_url',
    /**
     * hub AlexaSignatureMiddleware.php:306 — no Signature header.
     * 'ALEXA_MISSING_SIGNATURE_HEADER' parked in TEXT (map row :211).
     */
    MISSING_SIGNATURE_HEADER: 'alexa.missing_signature_header',
    /**
     * hub AlexaSignatureMiddleware.php:311 — empty request body.
     * 'ALEXA_EMPTY_BODY' parked in TEXT (map row :212).
     */
    EMPTY_BODY: 'alexa.empty_body',
    /**
     * hub AlexaSignatureMiddleware.php:317 — cert URL outside the Amazon
     * allowlist. 'ALEXA_CERT_URL_REJECTED' parked in TEXT (map row :213).
     */
    CERT_URL_REJECTED: 'alexa.cert_url_rejected',
    /**
     * hub AlexaSignatureMiddleware.php:473 (`ChainVerification::rejected`
     * arm, forwarded at the `errorCode()` site :323) — Amazon cert fetch
     * failed. 'ALEXA_CERT_FETCH_FAILED' parked in TEXT (map row :214).
     */
    CERT_FETCH_FAILED: 'alexa.cert_fetch_failed',
    /**
     * hub AlexaSignatureMiddleware.php:334 + `errorCode()`-forwarded arms
     * :516,522,529,556,562 (via :323) — 'ALEXA_CERT_CHAIN_MALFORMED'
     * parked in TEXT (map row :215), plus the hub ChainVerification.php:97
     * fallback.
     */
    CERT_CHAIN_MALFORMED: 'alexa.cert_chain_malformed',
    /**
     * hub AlexaSignatureMiddleware.php:329,338 — signature check failed.
     * 'ALEXA_SIGNATURE_INVALID' parked in TEXT (map row :216).
     */
    SIGNATURE_INVALID: 'alexa.signature_invalid',
    /**
     * hub AlexaSignatureMiddleware.php:535 (`ChainVerification::rejected`
     * arm, forwarded at the `errorCode()` site :323) — cert validity
     * window. 'ALEXA_CERT_EXPIRED' parked in TEXT (map row :217).
     */
    CERT_EXPIRED: 'alexa.cert_expired',
    /**
     * hub AlexaSignatureMiddleware.php:542 (`ChainVerification::rejected`
     * arm, forwarded at the `errorCode()` site :323) — cert SAN is not an
     * Alexa domain. 'ALEXA_CERT_SAN_MISMATCH' parked in TEXT
     * (map row :218).
     */
    CERT_SAN_MISMATCH: 'alexa.cert_san_mismatch',
    /**
     * hub AlexaSignatureMiddleware.php:549 (`ChainVerification::rejected`
     * arm, forwarded at the `errorCode()` site :323) — chain does not anchor
     * on the Amazon root. 'ALEXA_CERT_CHAIN_UNTRUSTED' parked
     * in TEXT (map row :219).
     */
    CERT_CHAIN_UNTRUSTED: 'alexa.cert_chain_untrusted',
    /**
     * hub AlexaSignatureMiddleware.php:689,704,710 ('rejectTimestamp') —
     * Timestamp header unparseable. 'ALEXA_TIMESTAMP_MALFORMED' parked in
     * TEXT (map row :220).
     */
    TIMESTAMP_MALFORMED: 'alexa.timestamp_malformed',
    /**
     * hub AlexaSignatureMiddleware.php:694,699 ('rejectTimestamp') — no
     * Timestamp header. 'ALEXA_TIMESTAMP_MISSING' parked in TEXT (map row
     * :221).
     */
    TIMESTAMP_MISSING: 'alexa.timestamp_missing',
    /**
     * hub AlexaSignatureMiddleware.php:716 ('rejectTimestamp') — timestamp
     * older than the skew window. 'ALEXA_TIMESTAMP_STALE' parked in TEXT
     * (map row :222).
     */
    TIMESTAMP_STALE: 'alexa.timestamp_stale',
  },

  /** Hub subdomain/TLS provisioning. */
  tls: {
    /** hub SubdomainController.php:186 */
    ACME_NOT_IMPLEMENTED: 'tls.acme_not_implemented',
  },

  /** Server CSRF origin gate. */
  csrf: {
    /** srv Workerman/HttpHandler.php:182 */
    INVALID_ORIGIN: 'csrf.invalid_origin',
  },

  /** The actor resolved from the token itself (hub /me). */
  user: {
    /** hub MeController.php:58 — dotted; distinct from admin.user_not_found */
    NOT_FOUND: 'user.not_found',
  },

  /** Server plugin admin/catalog surface. */
  plugin: {
    /** srv PluginAdminController.php:139 */
    NAME_REQUIRED: 'plugin.name.required',
    /** srv PluginAdminController.php:145 */
    NOT_FOUND: 'plugin.not_found',
    /** srv PluginAdminController.php:282 */
    URL_REQUIRED: 'plugin.url.required',
    /** srv PluginAdminController.php:293 */
    URL_INVALID_SCHEME: 'plugin.url.invalid_scheme',
    /** srv PluginAdminController.php:309 */
    URL_BLOCKED: 'plugin.url.blocked',
    /** srv PluginAdminController.php:330 */
    INSTALL_FAILED: 'plugin.install.failed',
    /** srv PluginAdminController.php:383 */
    ENABLE_FAILED: 'plugin.enable.failed',
    /** srv PluginAdminController.php:197,506 */
    SETTINGS_INVALID: 'plugin.settings.invalid',
    /** srv PluginAdminController.php:238 */
    SETTINGS_VALIDATION_FAILED: 'plugin.settings.validation_failed',
    /** srv PluginAdminController.php:522 */
    TEST_NOT_SUPPORTED: 'plugin.test_not_supported',
    /** srv PluginCatalogController.php:149 */
    UPDATE_FAILED: 'plugin.update.failed',
    /** srv PluginCatalogController.php:151 */
    UPDATE_NO_SOURCE: 'plugin.update.no_source',
    /** srv PluginCatalogController.php:279 */
    CATALOG_URL_REQUIRED: 'plugin.catalog.url.required',
    /** srv PluginCatalogController.php:289 */
    CATALOG_URL_DUPLICATE: 'plugin.catalog.url.duplicate',
    /** srv PluginCatalogController.php:291 */
    CATALOG_URL_INVALID: 'plugin.catalog.url.invalid',
    /** srv PluginCatalogController.php:202 */
    AUTO_UPDATE_INVALID: 'plugin.auto_update.invalid',
    /** srv PluginCatalogController.php:248 */
    CATALOG_CHANNEL_INVALID: 'plugin.catalog.channel.invalid',
  },

  /** Server library CRUD. */
  library: {
    /** srv LibraryController.php:965 */
    DELETE_ALL_CONFIRM_REQUIRED: 'library.delete_all.confirm_required',
  },

  /** Server TMDB metadata lookups. */
  metadata: {
    /** srv TmdbUnconfiguredException.php:31 */
    TMDB_UNCONFIGURED: 'metadata.tmdb_unconfigured',
    /** srv MediaPosterController.php:147, MediaMatchController.php:148,218 */
    TMDB_UNREACHABLE: 'metadata.tmdb_unreachable',
    /** srv MediaMatchController.php:131 */
    NO_QUERY: 'metadata.no_query',
    /** srv MediaMatchController.php:199 */
    BAD_TMDB_ID: 'metadata.bad_tmdb_id',
    /** srv MediaMatchController.php:225 */
    NO_MATCH: 'metadata.no_match',
  },

  /** Server poster management. */
  poster: {
    /** srv MediaPosterController.php:235 */
    MISSING_URL: 'poster.missing_url',
    /** srv MediaPosterController.php:243 */
    POSTER_NOT_CANDIDATE: 'poster.poster_not_candidate',
  },

  /**
   * Server profile PIN/switch/denial gates. Dotted wire values that CURRENTLY
   * RIDE A NON-`code` FIELD, not the `code` channel: the first four emit the
   * string with NO `code` key — srv ProfilesController.php:215
   * 'profile.use_switch', srv ProfilesController.php:274 'profile.last_profile',
   * srv ProfilesController.php:403 'profile.no_pin', srv
   * ProfilesController.php:407 'profile.pin_mismatch'. `profile.not_found` was
   * promoted by the server W2 emit-wave and now rides the `code` channel with
   * the `denial_type` machine mirror kept (see its ref). The Wave-1b text-field
   * families named in the module header carry the same promote-in-Wave-2
   * caveat per domain. Until then, clients match the first four strings in
   * `error` text, not in `code`.
   */
  profile: {
    /** srv ProfilesController.php:215 */
    USE_SWITCH: 'profile.use_switch',
    /** srv ProfilesController.php:274 */
    LAST_PROFILE: 'profile.last_profile',
    /** srv ProfilesController.php:403 */
    NO_PIN: 'profile.no_pin',
    /** srv ProfilesController.php:407 */
    PIN_MISMATCH: 'profile.pin_mismatch',
    /**
     * srv StreamLimitMiddleware.php:88-91,95-98 (403) ·
     * srv PreRouterFastPaths.php:597-602 (403) — the request carries a profile
     * that doesn't exist. Server W2 promoted it: `'code' =>
     * 'profile.not_found'` rides the `code` channel alongside the parked
     * `'error' => 'StreamLimitExceeded'` and the machine `'denial_type' =>
     * 'profile_not_found'` mirror (dual placement; clients may match any).
     */
    NOT_FOUND: 'profile.not_found',
  },

  /** Server DLNA allowlist gate. */
  dlna: {
    /** srv DlnaAllowlistMiddleware.php:138 */
    FORBIDDEN: 'dlna.forbidden',
  },

  /** Server casting feature flag gate. */
  casting: {
    /** srv CastingEnabledMiddleware.php:119 */
    DISABLED: 'casting.disabled',
  },

  /** Server QuickConnect device-pairing rail (bare snake on the `code` field). */
  quickconnect: {
    /** srv QuickConnectController.php:245 */
    UNAUTHORIZED: 'unauthorized',
    /** srv QuickConnectController.php:269 */
    INVALID_SECRET: 'invalid_secret',
    /** srv QuickConnectController.php:272 */
    PAIRING_NOT_PENDING: 'pairing_not_pending',
    /** srv QuickConnectController.php:372 — consent gate on telemetry heartbeat */
    CONSENT_REQUIRED: 'consent_required',
    /** srv QuickConnectController.php:483 */
    PAIRING_NOT_FOUND: 'pairing_not_found',
    /** srv QuickConnectController.php:494 */
    STORAGE_UNAVAILABLE: 'storage_unavailable',
  },

  /**
   * Cross-surface validation/envelope codes: bare snake words carrying no
   * resource name, emitted by more than one controller (or by both servers).
   */
  common: {
    /** srv Core/Application.php:2731 · hub Application.php:203 (+3) */
    RATE_LIMITED: 'rate_limited',
    /** srv AuthController.php:336,354 (LDAP) */
    PROVIDER_UNAVAILABLE: 'provider_unavailable',
    /** srv QuickConnectController.php:258,301 · hub InviteLinkController.php:107 */
    INVALID_REQUEST: 'invalid_request',
    /** hub FederationController.php:93 (+5) · InviteLinkController.php:53 · LibraryShareController.php:52,240 */
    INVALID_BODY: 'invalid_body',
    /** srv QuickConnectController.php:380-406 · hub AdminUpdatesController.php:109 */
    INVALID_PAYLOAD: 'invalid_payload',
    /** hub InviteLinkController.php:113 (+3) · LibraryShareController.php:138 (+2) */
    UNKNOWN_ERROR: 'unknown_error',
    /** hub AdminUserController.php:469 */
    VALIDATION_FAILED: 'validation_failed',
    /** hub RequestController.php:384 · UserQuotaController.php:332 · AdminUpdatesController.php:165 */
    ADMIN_REQUIRED: 'admin_required',
    /** hub FederationController.php:714,761 */
    MASTER_ONLY: 'master_only',
    /** hub FederationController.php:126,257 */
    INVALID_URL: 'invalid_url',
    /** hub FederationController.php:110 */
    INVALID_ROLE: 'invalid_role',
    /** hub FederationController.php:504 (also LibraryShareController.php:275) */
    INVALID_PERMISSION: 'invalid_permission',
    /** hub FederationController.php:244 */
    MISSING_URL: 'missing_url',
    /** hub FederationController.php:252 */
    MISSING_NAME: 'missing_name',
    /** hub FederationController.php:248 */
    MISSING_PUBLIC_KEY: 'missing_public_key',
    /** hub FederationController.php:781 · UserQuotaController.php:350 */
    MISSING_USER_ID: 'missing_user_id',
    /** hub InviteLinkController.php:71 · LibraryController.php:54 · LibraryShareController.php:77 */
    MISSING_SERVER_ID: 'missing_server_id',
    /** hub InviteLinkController.php:100 · LibraryController.php:62 · LibraryShareController.php:118 */
    NOT_SERVER_OWNER: 'not_server_owner',
  },

  /** Hub federation peer/offer/delegation CRUD (bare snake on `code`). */
  federation: {
    /** hub FederationController.php:265 */
    PEER_URL_EXISTS: 'peer_url_exists',
    /** hub FederationController.php:274 */
    PEER_KEY_EXISTS: 'peer_key_exists',
    /** hub FederationController.php:310 (+4) */
    PEER_NOT_FOUND: 'peer_not_found',
    /** hub FederationController.php:618,668 */
    OFFER_NOT_FOUND: 'offer_not_found',
    /** hub FederationController.php:626,676 */
    OFFER_ALREADY_RESPONDED: 'offer_already_responded',
    /** hub FederationController.php:822 */
    DELEGATION_NOT_FOUND: 'delegation_not_found',
    /** hub FederationController.php:303 (+3) */
    MISSING_PEER_ID: 'missing_peer_id',
    /** hub FederationController.php:611,661 */
    MISSING_OFFER_ID: 'missing_offer_id',
    /** hub FederationController.php:815 */
    MISSING_DELEGATION_ID: 'missing_delegation_id',
    /** hub FederationController.php:488 (also LibraryShareController.php:84) */
    MISSING_LIBRARY_ID: 'missing_library_id',
    /** hub FederationController.php:508 (also LibraryShareController.php:91) */
    MISSING_LIBRARY_NAME: 'missing_library_name',
  },

  /** Hub library-share CRUD (bare snake on `code`). */
  share: {
    /** hub FederationController.php:553 · LibraryShareController.php:196,262 */
    NOT_FOUND: 'share_not_found',
    /** hub FederationController.php:546 · LibraryShareController.php:184,232 */
    MISSING_SHARE_ID: 'missing_share_id',
    /** hub LibraryShareController.php:70 */
    MISSING_COLLABORATOR_EMAIL: 'missing_collaborator_email',
    /** hub LibraryShareController.php:125 */
    EXISTS: 'share_exists',
    /** hub LibraryShareController.php:202,268 */
    NOT_OWNER: 'not_share_owner',
    /** hub LibraryShareController.php:249 */
    MISSING_PERMISSION: 'missing_permission',
  },

  /** Hub invite-link lifecycle (bare snake on `code`). */
  invite: {
    /** hub InviteLinkController.php:157 */
    MISSING_LINK_ID: 'missing_link_id',
    /** hub InviteLinkController.php:169,227 */
    LINK_NOT_FOUND: 'invite_link_not_found',
    /** hub InviteLinkController.php:175 */
    NOT_LINK_OWNER: 'not_link_owner',
    /** hub InviteLinkController.php:206 */
    MISSING_TOKEN: 'missing_token',
    /** hub InviteLinkController.php:220 */
    INVALID: 'invalid_invite',
    /** hub InviteLinkController.php:233 — 410 */
    EXPIRED_OR_EXHAUSTED: 'invite_expired_or_exhausted',
  },

  /** Hub media-request workflow (bare snake on `code`). */
  request: {
    /** hub RequestController.php:83 */
    INVALID_TYPE: 'invalid_type',
    /** hub RequestController.php:92 */
    INVALID_TMDB_ID: 'invalid_tmdb_id',
    /** hub RequestController.php:100 */
    MISSING_TITLE: 'missing_title',
    /** hub RequestController.php:173 (+3) */
    MISSING_REQUEST_ID: 'missing_request_id',
    /** hub RequestController.php:181 (+3) */
    NOT_FOUND: 'request_not_found',
    /** hub RequestController.php:187,224 */
    NOT_OWNER: 'not_request_owner',
    /** hub RequestController.php:296 */
    APPROVE_FAILED: 'approve_failed',
    /** hub RequestController.php:352 */
    DENY_FAILED: 'deny_failed',
  },

  /** Hub admin user/quota management (bare snake on `code`). */
  admin: {
    /** hub AdminUserController.php:446 — bare; distinct from auth.user_not_found / user.not_found */
    USER_NOT_FOUND: 'user_not_found',
    /** hub AdminUserController.php:243 */
    CANNOT_DELETE_SELF: 'cannot_delete_self',
    /** hub AdminUserController.php:246,277 */
    LAST_ADMIN: 'last_admin',
    /** hub AdminUserController.php:274 */
    CANNOT_DEMOTE_SELF: 'cannot_demote_self',
    /** hub UserQuotaController.php:358 */
    INVALID_QUOTA: 'invalid_quota',
    /** hub UserQuotaController.php:367 */
    INVALID_THROTTLE: 'invalid_throttle',
  },

  /**
   * Server core-update admin surface (bare snake on the `code` field). The
   * update surface's generic envelope words (`invalid_payload`,
   * `admin_required`) live in `common` with their cross-surface siblings;
   * operation-specific failures belong here.
   */
  updates: {
    /** srv AdminUpdatesController.php:214 — 503 when `checkNow()` throws synchronously on POST /admin/updates/check */
    CHECK_DISPATCH_FAILED: 'update_check_dispatch_failed',
  },

  /**
   * Server linked-identity failures (account linking + OIDC/GitHub callback
   * completion). CAVEAT (Wave 1b): all seven ride the `error` TEXT field today
   * as bare snake pseudo-codes with no `code` key; the emit-wave promotes them
   * to the `code` channel — clients match in `error` text until then. Where a
   * twin name collapses two coexisting text spellings (e.g.
   * `invalid_identity` → `identity.invalid`), the dotted form is the single
   * forward value for both sites.
   */
  identity: {
    /** srv AccountLinkController.php:211 (400) — today text 'missing_identity_id' */
    MISSING_ID: 'identity.missing_id',
    /** srv AccountLinkController.php:230 (404) — today text 'identity_not_found' */
    NOT_FOUND: 'identity.not_found',
    /**
     * srv AccountLinkController.php:244 (409) — unlink refused: last sign-in
     * method. Today text 'last_sign_in_method'.
     */
    LAST_SIGN_IN_METHOD: 'identity.last_sign_in_method',
    /**
     * srv AccountLinkController.php:583 · OidcCallbackController.php:743 ·
     * GithubCallbackController.php:740 (409) — provider account already bound
     * to another identity. Today text 'identity_already_linked'.
     */
    ALREADY_LINKED: 'identity.already_linked',
    /**
     * srv OidcCallbackController.php:632 · GithubCallbackController.php:646
     * (400) — provider returned no usable identity. Today text
     * 'invalid_identity'.
     */
    INVALID: 'identity.invalid',
    /**
     * srv OidcCallbackController.php:623 · GithubCallbackController.php:638
     * (503) — identity repository absent, linking disabled. Today text
     * 'link_unavailable'.
     */
    LINK_UNAVAILABLE: 'identity.link_unavailable',
    /**
     * srv OidcCallbackController.php:615 · GithubCallbackController.php:630
     * (400) — link flow state lost its initiating user. Today text
     * 'invalid_link_state'.
     */
    INVALID_LINK_STATE: 'identity.invalid_link_state',
  },

  /**
   * Server authentication-provider config/lookup failures (account-link
   * rail + OIDC/GitHub admin forms). CAVEAT (Wave 1b): all seven ride the
   * `error` TEXT field today as bare snake pseudo-codes with no `code` key;
   * the emit-wave promotes them to the `code` channel — clients match in
   * `error` text until then. `provider.not_configured` unifies today's two
   * spellings (`not_configured`, `provider_not_configured`) into ONE forward
   * value.
   */
  provider: {
    /**
     * srv AuthProviderController.php:124 (409, text 'not_configured') ·
     * OidcCallbackController.php:281,488 · GithubCallbackController.php:249,
     * 421 (text 'provider_not_configured').
     */
    NOT_CONFIGURED: 'provider.not_configured',
    /** srv AuthProviderController.php:175 (404) — toggle for an unlisted provider. Today text 'unknown_provider'. */
    UNKNOWN: 'provider.unknown',
    /** srv AuthProviderController.php:195 (404) — provider row missing. Today text 'provider_not_found'. */
    NOT_FOUND: 'provider.not_found',
    /** srv OidcCallbackController.php:289 — registered provider isn't OIDC. Today text 'invalid_provider_type'. */
    INVALID_TYPE: 'provider.invalid_type',
    /** srv OidcAdminController.php:243 · GithubAdminController.php:151 — admin form word 'missing_client_id'. */
    MISSING_CLIENT_ID: 'provider.missing_client_id',
    /** srv OidcAdminController.php:236 — admin form word 'missing_provider_url'. */
    MISSING_URL: 'provider.missing_url',
    /** srv OidcAdminController.php:250 — admin form word 'invalid_provider_url'. */
    INVALID_URL: 'provider.invalid_url',
  },

  /**
   * Server OAuth browser-callback flow failures (OIDC + GitHub callback and
   * admin redirect validation). CAVEAT (Wave 1b): all six ride the `error`
   * TEXT field today as bare snake pseudo-codes with no `code` key; the
   * emit-wave promotes them to the `code` channel — clients match in `error`
   * text until then. NOT to be confused with the hub's RFC-6749/6750-mandated
   * `error` values (`invalid_grant`, …), which stay excluded per the module
   * header — these six are estate-chosen words, not RFC vocabulary.
   */
  oauth: {
    /** srv OidcCallbackController.php:381 · GithubCallbackController.php:326 — text 'missing_code'. */
    MISSING_CODE: 'oauth.missing_code',
    /** srv OidcCallbackController.php:388 · GithubCallbackController.php:333 — text 'missing_state'. */
    MISSING_STATE: 'oauth.missing_state',
    /**
     * srv OidcCallbackController.php:396,419,436,463 ·
     * GithubCallbackController.php:341,362,378,397 — state cookie missing/
     * mismatched/expired (463: state not bound to this browser, 403). Text
     * 'invalid_state'.
     */
    INVALID_STATE: 'oauth.invalid_state',
    /** srv OidcCallbackController.php:254 · GithubCallbackController.php:226 — text 'missing_redirect_uri'. */
    MISSING_REDIRECT_URI: 'oauth.missing_redirect_uri',
    /**
     * srv OidcCallbackController.php:267,412 · GithubCallbackController.php:
     * 236,355 · OidcAdminController.php:283 · GithubAdminController.php:181 —
     * redirect URI not on the allowlist. Text 'invalid_redirect_uri'.
     */
    INVALID_REDIRECT_URI: 'oauth.invalid_redirect_uri',
    /** srv OidcCallbackController.php:815 · GithubCallbackController.php:808 — server has no configured callback URL. Text 'callback_url_not_configured'. */
    CALLBACK_URL_NOT_CONFIGURED: 'oauth.callback_url_not_configured',
  },

  /**
   * Server LDAP provider admin surface (connection form + test). CAVEAT
   * (Wave 1b): all seven ride the `error` TEXT field today — as form-gate
   * snake pseudo-codes (no `code` key) and, for the last four, as the
   * `'error'` value of the `testConnection` arrays that srv
   * LdapAdminController.php:352-354 passes THROUGH to the client as JSON
   * (catch-arm `'connection_failed'` at srv LdapAdminController.php:358) —
   * the emit-wave promotes them to the `code` channel; clients match in
   * `error` text until then.
   */
  ldap: {
    /** srv LdapAdminController.php:132,327 — form word 'missing_host'. */
    MISSING_HOST: 'ldap.missing_host',
    /** srv LdapAdminController.php:139,334 — form word 'missing_base_dn'. */
    MISSING_BASE_DN: 'ldap.missing_base_dn',
    /** srv LdapAdminController.php:146 — form word 'invalid_port'. */
    INVALID_PORT: 'ldap.invalid_port',
    /** srv LdapAdminController.php:358 (catch arm) — today text 'connection_failed', also returned at srv LdapConnection.php:259 (surfaced via the srv LdapAdminController.php:352-354 `testConnection` passthrough). */
    CONNECTION_FAILED: 'ldap.connection_failed',
    /** srv LdapConnection.php:268 (`testConnection` array, surfaced via the srv LdapAdminController.php:352-354 passthrough) — 'bind_failed'. */
    BIND_FAILED: 'ldap.bind_failed',
    /** srv LdapConnection.php:281 (`testConnection` array, via srv LdapAdminController.php:352-354) — 'ldap_error'. */
    ERROR: 'ldap.error',
    /** srv LdapConnection.php:287 (`testConnection` array, via srv LdapAdminController.php:352-354) — 'runtime_error'. */
    RUNTIME_ERROR: 'ldap.runtime_error',
  },

  /**
   * SyncPlay WebSocket domain — dotted twins. The server emit-wave has
   * landed on the wrap-site carriers: `create`/`join` now emit the twin
   * `syncplay.*_failed` code on `error_code` with the SCREAMING fallback if
   * the inner handler set no code (`sendError($connection,
   * $result['error_code'] ?? 'CREATE_FAILED', ...)` at srv
   * SyncPlayManager.php:1586,1623 — the `JOIN_FAILED` twin at :1623); the
   * `leave`
   * carrier (srv SyncPlayManager.php:1652) still emits raw `LEAVE_FAILED` — its
   * inner failure paths carry no `error_code` yet. See
   * `SYNCPLAY_ERROR_CODE_TWINS` for the migration table; `error_code` channel
   * and read order are untouched. Clients localize these codes; the legacy
   * SCREAMING carriers remain pinned under `legacy` for in-flight and
   * older-server traffic.
   */
  syncplay: {
    /** twin of legacy `CREATE_FAILED` (srv SyncPlayManager.php:1586) */
    CREATE_FAILED: 'syncplay.create_failed',
    /** twin of legacy `JOIN_FAILED` (srv SyncPlayManager.php:1623) */
    JOIN_FAILED: 'syncplay.join_failed',
    /** twin of legacy `LEAVE_FAILED` (srv SyncPlayManager.php:1652) */
    LEAVE_FAILED: 'syncplay.leave_failed',
    /** was prose 'Maximum group limit reached' inside `CREATE_FAILED` (srv SyncPlayManager.php:621) */
    GROUP_LIMIT_REACHED: 'syncplay.group_limit_reached',
    /** was prose 'Group not found' inside `JOIN_FAILED` (srv SyncPlayManager.php:702) */
    GROUP_NOT_FOUND: 'syncplay.group_not_found',
    /** was prose 'Invalid password' inside `JOIN_FAILED` (srv SyncPlayManager.php:741) */
    INVALID_PASSWORD: 'syncplay.invalid_password',
    /** was prose 'Group is full' inside `JOIN_FAILED` (srv SyncPlayManager.php:745) */
    GROUP_FULL: 'syncplay.group_full',
  },

  /**
   * Legacy SyncPlay WS codes — the VERBATIM SCREAMING_SNAKE set servers emit in
   * `error_code` today. Canonical until Wave 2; renaming breaks live clients.
   * Sources: phlix-server Session/SyncPlay/SyncPlayManager.php sendError() sites
   * and Server/WebSocket/MessageHandler.php Messages::error() sites.
   */
  legacy: {
    /** srv SyncPlayManager.php:576 */
    UNKNOWN_MESSAGE: 'UNKNOWN_MESSAGE',
    /** srv SyncPlayManager.php:579 */
    HANDLER_ERROR: 'HANDLER_ERROR',
    /** srv SyncPlayManager.php:944 (+11) · srv MessageHandler.php:156 */
    NOT_AUTHENTICATED: 'NOT_AUTHENTICATED',
    /** srv SyncPlayManager.php:952 (+7) */
    NOT_IN_GROUP: 'NOT_IN_GROUP',
    /** srv SyncPlayManager.php:957 (+4) */
    NOT_HOST: 'NOT_HOST',
    /** srv SyncPlayManager.php:1278 */
    INVALID_NEW_HOST: 'INVALID_NEW_HOST',
    /** srv SyncPlayManager.php:1283 */
    MEMBER_NOT_FOUND: 'MEMBER_NOT_FOUND',
    /** srv SyncPlayManager.php:1288 */
    SAME_HOST: 'SAME_HOST',
    /** srv SyncPlayManager.php:1586 — coarse carrier, see syncplay.create_failed twin */
    CREATE_FAILED: 'CREATE_FAILED',
    /** srv SyncPlayManager.php:1623 — coarse carrier, see syncplay.join_failed twins */
    JOIN_FAILED: 'JOIN_FAILED',
    /** srv SyncPlayManager.php:1652 — coarse carrier, see syncplay.leave_failed twin */
    LEAVE_FAILED: 'LEAVE_FAILED',
    /** srv MessageHandler.php:188-191 */
    PROTOCOL_VERSION_MISMATCH: 'PROTOCOL_VERSION_MISMATCH',
  },
} as const;

/** The registry itself, nested by domain. */
export const ERROR_CODE = CODES;

/** The domain namespaces of the registry. */
export type ErrorDomain = keyof typeof CODES;

/** Wire strings belonging to one domain. */
export type ErrorCodeIn<D extends ErrorDomain> = (typeof CODES)[D][keyof (typeof CODES)[D]];

/** Every wire string in the registry, as a union. */
export type ErrorCode = { [D in ErrorDomain]: ErrorCodeIn<D> }[ErrorDomain];

/** Registry domains in emission order — the order `ERROR_CODES` and the JSON mirror use. */
export const ERROR_DOMAINS = [
  'auth',
  'hub',
  'claim',
  'server',
  'proxy',
  'quota',
  'stream',
  'access',
  'gateway',
  'relay',
  'mcp',
  'mcp_token',
  'alexa',
  'tls',
  'csrf',
  'user',
  'plugin',
  'library',
  'metadata',
  'poster',
  'profile',
  'dlna',
  'casting',
  'quickconnect',
  'common',
  'federation',
  'share',
  'invite',
  'request',
  'admin',
  'updates',
  'identity',
  'provider',
  'oauth',
  'ldap',
  'syncplay',
  'legacy',
] as const satisfies readonly ErrorDomain[];

/** Per-domain code lists, in registry order. */
export const AUTH_ERROR_CODES: readonly AuthErrorCode[] = Object.values(CODES.auth);
export const HUB_ERROR_CODES: readonly HubErrorCode[] = Object.values(CODES.hub);
export const CLAIM_ERROR_CODES: readonly ClaimErrorCode[] = Object.values(CODES.claim);
export const SERVER_ERROR_CODES: readonly ServerErrorCode[] = Object.values(CODES.server);
export const PROXY_ERROR_CODES: readonly ProxyErrorCode[] = Object.values(CODES.proxy);
export const QUOTA_ERROR_CODES: readonly QuotaErrorCode[] = Object.values(CODES.quota);
export const STREAM_ERROR_CODES: readonly StreamErrorCode[] = Object.values(CODES.stream);
export const ACCESS_ERROR_CODES: readonly AccessErrorCode[] = Object.values(CODES.access);
export const GATEWAY_ERROR_CODES: readonly GatewayErrorCode[] = Object.values(CODES.gateway);
export const RELAY_ERROR_CODES: readonly RelayErrorCode[] = Object.values(CODES.relay);
export const MCP_ERROR_CODES: readonly McpErrorCode[] = Object.values(CODES.mcp);
export const MCP_TOKEN_ERROR_CODES: readonly McpTokenErrorCode[] = Object.values(CODES.mcp_token);
export const ALEXA_ERROR_CODES: readonly AlexaErrorCode[] = Object.values(CODES.alexa);
export const TLS_ERROR_CODES: readonly TlsErrorCode[] = Object.values(CODES.tls);
export const CSRF_ERROR_CODES: readonly CsrfErrorCode[] = Object.values(CODES.csrf);
export const USER_ERROR_CODES: readonly UserErrorCode[] = Object.values(CODES.user);
export const PLUGIN_ERROR_CODES: readonly PluginErrorCode[] = Object.values(CODES.plugin);
export const LIBRARY_ERROR_CODES: readonly LibraryErrorCode[] = Object.values(CODES.library);
export const METADATA_ERROR_CODES: readonly MetadataErrorCode[] = Object.values(CODES.metadata);
export const POSTER_ERROR_CODES: readonly PosterErrorCode[] = Object.values(CODES.poster);
export const PROFILE_ERROR_CODES: readonly ProfileErrorCode[] = Object.values(CODES.profile);
export const DLNA_ERROR_CODES: readonly DlnaErrorCode[] = Object.values(CODES.dlna);
export const CASTING_ERROR_CODES: readonly CastingErrorCode[] = Object.values(CODES.casting);
export const QUICKCONNECT_ERROR_CODES: readonly QuickConnectErrorCode[] =
  Object.values(CODES.quickconnect);
export const COMMON_ERROR_CODES: readonly CommonErrorCode[] = Object.values(CODES.common);
export const FEDERATION_ERROR_CODES: readonly FederationErrorCode[] =
  Object.values(CODES.federation);
export const SHARE_ERROR_CODES: readonly ShareErrorCode[] = Object.values(CODES.share);
export const INVITE_ERROR_CODES: readonly InviteErrorCode[] = Object.values(CODES.invite);
export const REQUEST_ERROR_CODES: readonly RequestErrorCode[] = Object.values(CODES.request);
export const ADMIN_ERROR_CODES: readonly AdminErrorCode[] = Object.values(CODES.admin);
export const UPDATES_ERROR_CODES: readonly UpdatesErrorCode[] = Object.values(CODES.updates);
export const IDENTITY_ERROR_CODES: readonly IdentityErrorCode[] = Object.values(CODES.identity);
export const PROVIDER_ERROR_CODES: readonly ProviderErrorCode[] = Object.values(CODES.provider);
export const OAUTH_ERROR_CODES: readonly OAuthErrorCode[] = Object.values(CODES.oauth);
export const LDAP_ERROR_CODES: readonly LdapErrorCode[] = Object.values(CODES.ldap);
export const SYNCPLAY_TWIN_ERROR_CODES: readonly SyncPlayTwinErrorCode[] =
  Object.values(CODES.syncplay);
export const LEGACY_SYNCPLAY_ERROR_CODES: readonly LegacySyncPlayErrorCode[] =
  Object.values(CODES.legacy);

/** Boundary parse: the nested `as const` tree is flattened once, via this map. */
const CODES_BY_DOMAIN: { readonly [D in ErrorDomain]: readonly ErrorCodeIn<D>[] } = {
  auth: AUTH_ERROR_CODES,
  hub: HUB_ERROR_CODES,
  claim: CLAIM_ERROR_CODES,
  server: SERVER_ERROR_CODES,
  proxy: PROXY_ERROR_CODES,
  quota: QUOTA_ERROR_CODES,
  stream: STREAM_ERROR_CODES,
  access: ACCESS_ERROR_CODES,
  gateway: GATEWAY_ERROR_CODES,
  relay: RELAY_ERROR_CODES,
  mcp: MCP_ERROR_CODES,
  mcp_token: MCP_TOKEN_ERROR_CODES,
  alexa: ALEXA_ERROR_CODES,
  tls: TLS_ERROR_CODES,
  csrf: CSRF_ERROR_CODES,
  user: USER_ERROR_CODES,
  plugin: PLUGIN_ERROR_CODES,
  library: LIBRARY_ERROR_CODES,
  metadata: METADATA_ERROR_CODES,
  poster: POSTER_ERROR_CODES,
  profile: PROFILE_ERROR_CODES,
  dlna: DLNA_ERROR_CODES,
  casting: CASTING_ERROR_CODES,
  quickconnect: QUICKCONNECT_ERROR_CODES,
  common: COMMON_ERROR_CODES,
  federation: FEDERATION_ERROR_CODES,
  share: SHARE_ERROR_CODES,
  invite: INVITE_ERROR_CODES,
  request: REQUEST_ERROR_CODES,
  admin: ADMIN_ERROR_CODES,
  updates: UPDATES_ERROR_CODES,
  identity: IDENTITY_ERROR_CODES,
  provider: PROVIDER_ERROR_CODES,
  oauth: OAUTH_ERROR_CODES,
  ldap: LDAP_ERROR_CODES,
  syncplay: SYNCPLAY_TWIN_ERROR_CODES,
  legacy: LEGACY_SYNCPLAY_ERROR_CODES,
};

/** Every wire string, in registry declaration order. */
export const ERROR_CODES: readonly ErrorCode[] = ERROR_DOMAINS.flatMap(
  (domain) => CODES_BY_DOMAIN[domain],
);

/** Per-domain code unions. */
export type AuthErrorCode = ErrorCodeIn<'auth'>;
export type HubErrorCode = ErrorCodeIn<'hub'>;
export type ClaimErrorCode = ErrorCodeIn<'claim'>;
export type ServerErrorCode = ErrorCodeIn<'server'>;
export type ProxyErrorCode = ErrorCodeIn<'proxy'>;
export type QuotaErrorCode = ErrorCodeIn<'quota'>;
export type StreamErrorCode = ErrorCodeIn<'stream'>;
export type AccessErrorCode = ErrorCodeIn<'access'>;
export type GatewayErrorCode = ErrorCodeIn<'gateway'>;
export type RelayErrorCode = ErrorCodeIn<'relay'>;
export type McpErrorCode = ErrorCodeIn<'mcp'>;
export type McpTokenErrorCode = ErrorCodeIn<'mcp_token'>;
export type AlexaErrorCode = ErrorCodeIn<'alexa'>;
export type TlsErrorCode = ErrorCodeIn<'tls'>;
export type CsrfErrorCode = ErrorCodeIn<'csrf'>;
export type UserErrorCode = ErrorCodeIn<'user'>;
export type PluginErrorCode = ErrorCodeIn<'plugin'>;
export type LibraryErrorCode = ErrorCodeIn<'library'>;
export type MetadataErrorCode = ErrorCodeIn<'metadata'>;
export type PosterErrorCode = ErrorCodeIn<'poster'>;
export type ProfileErrorCode = ErrorCodeIn<'profile'>;
export type DlnaErrorCode = ErrorCodeIn<'dlna'>;
export type CastingErrorCode = ErrorCodeIn<'casting'>;
export type QuickConnectErrorCode = ErrorCodeIn<'quickconnect'>;
export type CommonErrorCode = ErrorCodeIn<'common'>;
export type FederationErrorCode = ErrorCodeIn<'federation'>;
export type ShareErrorCode = ErrorCodeIn<'share'>;
export type InviteErrorCode = ErrorCodeIn<'invite'>;
export type RequestErrorCode = ErrorCodeIn<'request'>;
export type AdminErrorCode = ErrorCodeIn<'admin'>;
export type UpdatesErrorCode = ErrorCodeIn<'updates'>;
export type IdentityErrorCode = ErrorCodeIn<'identity'>;
export type ProviderErrorCode = ErrorCodeIn<'provider'>;
export type OAuthErrorCode = ErrorCodeIn<'oauth'>;
export type LdapErrorCode = ErrorCodeIn<'ldap'>;
export type SyncPlayTwinErrorCode = ErrorCodeIn<'syncplay'>;
export type LegacySyncPlayErrorCode = ErrorCodeIn<'legacy'>;

/** The full SyncPlay vocabulary: legacy SCREAMING on the wire today ∪ reserved dotted twins. */
export type SyncPlayErrorCode = LegacySyncPlayErrorCode | SyncPlayTwinErrorCode;

/** Legacy + twins, legacy first (what a Wave-2 SyncPlay client must understand). */
export const SYNCPLAY_ERROR_CODES: readonly SyncPlayErrorCode[] = [
  ...LEGACY_SYNCPLAY_ERROR_CODES,
  ...SYNCPLAY_TWIN_ERROR_CODES,
];

/**
 * Wave-2 migration map: each dotted twin → the coarse/legacy code it replaces
 * (or un-wraps from a prose carrier). The server emit-wave is landing; the
 * wire channel (`error_code`) and the read order never change.
 */
export const SYNCPLAY_ERROR_CODE_TWINS = {
  'syncplay.create_failed': 'CREATE_FAILED',
  'syncplay.group_limit_reached': 'CREATE_FAILED',
  'syncplay.join_failed': 'JOIN_FAILED',
  'syncplay.group_not_found': 'JOIN_FAILED',
  'syncplay.invalid_password': 'JOIN_FAILED',
  'syncplay.group_full': 'JOIN_FAILED',
  'syncplay.leave_failed': 'LEAVE_FAILED',
} as const satisfies Record<SyncPlayTwinErrorCode, LegacySyncPlayErrorCode>;

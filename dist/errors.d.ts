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
 * CONTENTS:
 *  1. Every dotted and bare-snake code actually emitted on the wire today by
 *     phlix-server or phlix-hub, PLUS the Wave-1b dotted twins of every
 *     code-shaped value the server/hub emit-waves will place on the wire
 *     (verified at source; file:line in per-entry refs). FIELD PLACEMENT: the
 *     registry describes vocabulary, not channel. Most entries ride the machine
 *     `code`/`error_code` field today; a documented minority currently ride the
 *     human `error` TEXT field (or a machine sub-field like `denial_type`) and
 *     each such domain carries a caveat docblock: "rides the error TEXT field
 *     today; Wave 2 promotes it to the `code` channel; clients match it in
 *     `error` text until then". SCREAMING-form values that live on the `code`
 *     channel today (`UNAUTHENTICATED`, `ENROLLMENT_TOKEN_EXPIRED`, `ALEXA_*`)
 *     get dotted forward-form twins here; the emit-wave flips the server/hub to
 *     the dotted form and the SCREAMING originals then become legacy.
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
 *  - Hub server-lifecycle text-field traps → dotted twins: `HUB_PROTOCOL_-
 *    UNSUPPORTED` → `hub.protocol_unsupported`, `HUB_INTERNAL_ERROR` →
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
 *  - Hub relay handshake internals `INVALID_TOKEN`/`SERVER_MISMATCH`:
 *    `InvalidArgumentException` MESSAGES thrown by `RelayServerHandler::onConnect`
 *    (RelayServerHandler.php:78,83,87) on the WS server-attach path. The handler
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
 *    emit-waves map them onto their existing twins, no new vocabulary:
 *    `SERVER_NOT_FOUND` (hub ServerController.php:181-186,238-243) →
 *    `server.not_found`; `MISSING_SERVER_ID` (hub SubdomainController.php:61,152,189,
 *    RelayController.php:57, ClientMountController.php:86) → `missing_server_id`
 *    (common); `UNAUTHORIZED` (hub SubdomainController.php:77,200,240,
 *    RelayController.php:73,144 — 401 enrollment gates, no `code` key) →
 *    `auth.required` / `auth.enrollment_expired` / `auth.server_mismatch` per
 *    message; `UPGRADE_REQUIRED` (hub RelayController.php:103,
 *    ClientMountController.php:116) → `relay.ws_http_endpoint` /
 *    `relay.client_ws_endpoint`; `NOT_IMPLEMENTED_VIA_HTTP`/`NOT_IMPLEMENTED`
 *    (hub ClientMountController.php:128, RelayController.php:124,
 *    SubdomainController.php:164) co-emit the registered `relay.*`/`tls.*`
 *    codes on `code` in the same payload — covered.
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
declare const CODES: {
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
    readonly auth: {
        /** srv AuthMiddleware.php:62 (+24 controller/helper sites) · hub AuthMiddleware.php:113 */
        readonly REQUIRED: "auth.required";
        /** srv AdminMiddleware.php:101 (+9) · hub AdminMiddleware.php:62 */
        readonly NOT_ADMIN: "auth.not_admin";
        /** hub AuthMiddleware.php:118, McpController.php:352 */
        readonly INVALID_TOKEN: "auth.invalid_token";
        /** hub AuthMiddleware.php:129 — token subject has no user row */
        readonly USER_NOT_FOUND: "auth.user_not_found";
        /** srv SignupDisabledException.php:28 → AuthController.php:194 */
        readonly SIGNUPS_DISABLED: "auth.signups_disabled";
        /** srv AccountInactiveException.php:31 → AuthController.php:264 */
        readonly ACCOUNT_PENDING: "auth.account_pending";
        /** srv AccountInactiveException.php:32 */
        readonly ACCOUNT_DISABLED: "auth.account_disabled";
        /** srv PasswordChangeRequiredException.php:30 */
        readonly PASSWORD_CHANGE_REQUIRED: "auth.password_change_required";
        /**
         * hub ServerClaimController.php:107 — 401 on the claim route when no user
         * resolves. Hub W3 promoted the site: dotted `auth.unauthenticated` rides
         * the `code` channel, the SCREAMING `UNAUTHENTICATED` is parked in the
         * `error` TEXT field of the same payload (dual placement).
         */
        readonly UNAUTHENTICATED: "auth.unauthenticated";
        /**
         * hub EnrollmentJwtMiddleware.php:46,51,56 → `unauthorized()` helper
         * (:76) emits the dotted forward form on the `code` channel with the
         * SCREAMING `ENROLLMENT_TOKEN_EXPIRED` parked in the `error` TEXT
         * (W3 dual placement); hub ServerController.php:232-237 mapError arm does
         * the same (throw sources: DeregisterHandler.php:51,
         * RenewHandler.php:57, HeartbeatHandler.php:65,69).
         */
        readonly ENROLLMENT_EXPIRED: "auth.enrollment_expired";
        /**
         * hub ServerController.php:76,138,173,208 — 403 refusals when the
         * enrollment token's serverId doesn't match the path serverId. Hub W3
         * promoted: dotted `auth.server_mismatch` rides `code`, the legacy
         * `AUTHORIZATION_FAILED` is parked in the `error` TEXT field (dual
         * placement). The "Server ID mismatch" arms of the hub 401 enrollment
         * gates (SubdomainController.php:218, RelayController.php, via their
         * `unauthorized()` helpers, today bare `UNAUTHORIZED` text) remain
         * deferred — that promotion is not on the wire yet.
         */
        readonly SERVER_MISMATCH: "auth.server_mismatch";
        /**
         * srv AccountLinkController.php:295 — 400 when the link-identity POST
         * carries no credentials. Rides the `error` TEXT field today; Wave 2
         * promotes to the `code` channel; clients match in `error` text until
         * then.
         */
        readonly MISSING_CREDENTIALS: "auth.missing_credentials";
        /**
         * srv AccountLinkController.php:332 — 401 when submitted credentials fail
         * to verify. Rides the `error` TEXT field today; Wave 2 promotes to the
         * `code` channel; clients match in `error` text until then.
         */
        readonly INVALID_CREDENTIALS: "auth.invalid_credentials";
    };
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
    readonly hub: {
        /** srv AccountLinkController.php:412, HubTokenController.php:67 */
        readonly NOT_ENROLLED: "hub.not_enrolled";
        /** srv AccountLinkController.php:422, HubTokenController.php:79 */
        readonly TOKEN_REQUIRED: "hub.token_required";
        /** srv AccountLinkController.php:432,444, HubJwtMiddleware.php:73 */
        readonly JWT_INVALID: "hub.jwt_invalid";
        /**
         * hub ServerClaimController.php:49,159 · ServerController.php:64,126 ·
         * HubProtocolMiddleware.php:41-42 — 400 when the `protocol` header is
         * absent or not `phlix-hub`. Hub W3 promoted: dotted rides `code`, the
         * SCREAMING `HUB_PROTOCOL_UNSUPPORTED` is parked in the `error` TEXT of
         * the same payload (dual placement; clients may match either).
         */
        readonly PROTOCOL_UNSUPPORTED: "hub.protocol_unsupported";
        /**
         * hub ServerClaimController.php:171 · ServerController.php:246 —
         * the mapError default 500. Hub W3 promoted: dotted rides `code`, the
         * SCREAMING `HUB_INTERNAL_ERROR` is parked in the `error` TEXT (dual
         * placement; clients may match either).
         */
        readonly INTERNAL_ERROR: "hub.internal_error";
    };
    /**
     * Hub claim-code exchange failures (phlix-hub `ClaimRequestHandler` →
     * `ServerClaimController::mapError`). CAVEAT (Wave 1b, updated post-hub-W3):
     * the three arms rode the `error` TEXT field as SCREAMING pseudo-codes; hub
     * W3 promoted them — every arm now carries the dotted form on the `code`
     * channel with the SCREAMING original parked byte-identical in the same
     * payload's `error` TEXT (dual placement; clients may match either).
     */
    readonly claim: {
        /**
         * hub ServerClaimController.php:141 (404 arm 139-144) ← throws at
         * ClaimRequestHandler.php:162,189 — dotted on `code`, SCREAMING
         * `CLAIM_CODE_NOT_FOUND` parked in `error` text (dual).
         */
        readonly CODE_NOT_FOUND: "claim.code_not_found";
        /**
         * hub ServerClaimController.php:147 (410 arm 145-150) ← throw at
         * ClaimRequestHandler.php:199 — dotted on `code`, SCREAMING
         * `CLAIM_CODE_EXPIRED` parked in `error` text (dual).
         */
        readonly CODE_EXPIRED: "claim.code_expired";
        /**
         * hub ServerClaimController.php:153 (409 arm 151-156) ← throw at
         * ClaimRequestHandler.php:206 — dotted on `code`, SCREAMING
         * `CLAIM_CODE_ALREADY_CLAIMED` parked in `error` text (dual).
         */
        readonly CODE_ALREADY_CLAIMED: "claim.code_already_claimed";
    };
    /** Hub-side server lookup/tunnel failures (phlix-hub). */
    readonly server: {
        /** hub ServerProxyController.php:978 (+4 controllers) */
        readonly NOT_FOUND: "server.not_found";
        /** hub ServerProxyController.php:982 (+3 controllers) */
        readonly NOT_OWNED: "server.not_owned";
        /** hub ServerProxyController.php:1000 — relay manager absent */
        readonly RELAY_UNAVAILABLE: "server.relay_unavailable";
        /** hub ServerProxyController.php:1007, RelayProxyManager.php:480 */
        readonly OFFLINE: "server.offline";
        /** hub RelayProxyManager.php:231 */
        readonly NO_TUNNEL: "server.no_tunnel";
        /**
         * hub ServerClaimController.php:165 (400 arm 163-168) ← throws at
         * ClaimRequestHandler.php:399,402,405,409 — the server's Ed25519 key
         * failed validation during claim. Hub W3 promoted: dotted rides `code`,
         * the SCREAMING `SERVER_KEY_INVALID` is parked in the `error` TEXT (dual
         * placement; clients may match either).
         */
        readonly KEY_INVALID: "server.key_invalid";
    };
    /** Hub reverse-proxy scope gates. */
    readonly proxy: {
        /** hub ServerProxyController.php:1044,1059 */
        readonly SCOPE_DENIED: "proxy.scope_denied";
    };
    /** Hub bandwidth quota gate. */
    readonly quota: {
        /** hub ServerProxyController.php:1019 */
        readonly EXCEEDED: "quota.exceeded";
    };
    /**
     * Concurrent-stream throttle gates (hub proxy + server middleware).
     * CAVEAT (Wave 1b, updated post-server-W2): `stream.limit` rides the hub
     * `code` channel. The server twin below was promoted by the server W2
     * emit-wave: `stream.limit_exceeded` now rides the `code` channel
     * positionally, the CamelCase pseudo-code `StreamLimitExceeded` is parked in
     * the `error` TEXT field and the `denial_type` machine mirror is kept
     * (dual placement; clients may match `code`, `error` text or `denial_type`).
     */
    readonly stream: {
        /** hub ServerProxyController.php:1098 */
        readonly LIMIT: "stream.limit";
        /**
         * srv StreamLimitMiddleware.php:113-117 (429) · PreRouterFastPaths.php:
         * 569-575 (429) — `'code' => 'stream.limit_exceeded'` alongside the
         * parked `'error' => 'StreamLimitExceeded'` and `'denial_type' =>
         * 'stream_limit_exceeded'` mirror (server W2 dual placement).
         */
        readonly LIMIT_EXCEEDED: "stream.limit_exceeded";
    };
    /**
     * Server scheduled-access window gate (phlix-server). CAVEAT (Wave 1b,
     * updated post-server-W2): promoted by the server W2 emit-wave —
     * `access.scheduled` rides the `code` channel positionally, the CamelCase
     * pseudo-code `AccessScheduled` is parked in the `error` TEXT field
     * (dual placement; clients may match either).
     */
    readonly access: {
        /**
         * srv AccessScheduleMiddleware.php:99-101,109-111,117-119 — 403 outside
         * the profile's allowed window; `'code' => 'access.scheduled'` with
         * `'error' => 'AccessScheduled'` parked in text (server W2).
         */
        readonly SCHEDULED: "access.scheduled";
    };
    /** Hub→server upstream gateway failures. */
    readonly gateway: {
        /** hub ServerProxyController.php:1131, RelayProxyManager.php:622, RelayProxyBridge.php:313 */
        readonly TIMEOUT: "gateway.timeout";
    };
    /** Hub relay endpoint-shape refusals. */
    readonly relay: {
        /** hub ClientMountController.php:117,129 — HTTP hit on the client WS mount */
        readonly CLIENT_WS_ENDPOINT: "relay.client_ws_endpoint";
        /** hub RelayController.php:125 — HTTP hit on the server WS endpoint */
        readonly WS_HTTP_ENDPOINT: "relay.ws_http_endpoint";
        /** hub RelayProxyManager.php:258 */
        readonly ENCODE_ERROR: "relay.encode_error";
    };
    /** Hub MCP-surface tool-protocol failures (machine `code`, not JSON-RPC numbers). */
    readonly mcp: {
        /** hub McpToolRegistry.php:154 */
        readonly UNKNOWN_TOOL: "mcp.unknown_tool";
        /** hub McpToolRegistry.php:166 */
        readonly SCOPE_DENIED: "mcp.scope_denied";
        /** hub McpToolContext.php:231 */
        readonly STREAMING_UNSUPPORTED: "mcp.streaming_unsupported";
        /** hub McpController.php:238 */
        readonly SSE_NOT_ACCEPTABLE: "mcp.sse_not_acceptable";
        /** hub McpController.php:305 */
        readonly UNSUPPORTED_PROTOCOL_VERSION: "mcp.unsupported_protocol_version";
    };
    /** Hub MCP personal-access-token CRUD. */
    readonly mcp_token: {
        /** hub McpTokenController.php:139 */
        readonly NO_VALID_SCOPES: "mcp_token.no_valid_scopes";
        /** hub McpTokenController.php:183 */
        readonly NOT_FOUND: "mcp_token.not_found";
    };
    /**
     * Hub Alexa adapter failures on the machine channel. CAVEAT (Wave 1b): the
     * fourteen signature-verification entries below already ride the `code`
     * channel today, but in SCREAMING form — every `AlexaSignatureMiddleware-
     * ::reject()` payload carries `'code' => 'ALEXA_*'` (helper at :700-719).
     * These dotted entries are the forward form; the emit-wave flips the
     * middleware to dotted values and the SCREAMING originals become legacy —
     * clients match `ALEXA_*` in `code` until then.
     */
    readonly alexa: {
        /** hub AlexaMediaGateway.php:203 — 501 payload */
        readonly STREAMING_UNSUPPORTED: "alexa.streaming_unsupported";
        /** hub AlexaSkillController.php:215 */
        readonly MALFORMED_ENVELOPE: "alexa.malformed_envelope";
        /**
         * hub AlexaSignatureMiddleware.php:245 — fail-closed catch around
         * verification itself. Today `code: 'ALEXA_VERIFICATION_ERROR'`.
         */
        readonly VERIFICATION_ERROR: "alexa.verification_error";
        /**
         * hub AlexaSignatureMiddleware.php:258 — no cert-chain-Url header.
         * Today `code: 'ALEXA_MISSING_CERT_CHAIN_URL'`.
         */
        readonly MISSING_CERT_CHAIN_URL: "alexa.missing_cert_chain_url";
        /**
         * hub AlexaSignatureMiddleware.php:263 — no Signature header.
         * Today `code: 'ALEXA_MISSING_SIGNATURE_HEADER'`.
         */
        readonly MISSING_SIGNATURE_HEADER: "alexa.missing_signature_header";
        /**
         * hub AlexaSignatureMiddleware.php:268 — empty request body.
         * Today `code: 'ALEXA_EMPTY_BODY'`.
         */
        readonly EMPTY_BODY: "alexa.empty_body";
        /**
         * hub AlexaSignatureMiddleware.php:274 — cert URL outside the Amazon
         * allowlist. Today `code: 'ALEXA_CERT_URL_REJECTED'`.
         */
        readonly CERT_URL_REJECTED: "alexa.cert_url_rejected";
        /**
         * hub AlexaSignatureMiddleware.php:430 (`ChainVerification::rejected`
         * arms forwarded through :280) — Amazon cert fetch failed.
         * Today `code: 'ALEXA_CERT_FETCH_FAILED'`.
         */
        readonly CERT_FETCH_FAILED: "alexa.cert_fetch_failed";
        /**
         * hub AlexaSignatureMiddleware.php:291 + forwarded ChainVerification
         * arms :473,479,486,513,519, plus the ChainVerification.php:97 fallback —
         * today `code: 'ALEXA_CERT_CHAIN_MALFORMED'`.
         */
        readonly CERT_CHAIN_MALFORMED: "alexa.cert_chain_malformed";
        /**
         * hub AlexaSignatureMiddleware.php:286,295 — signature check failed.
         * Today `code: 'ALEXA_SIGNATURE_INVALID'`.
         */
        readonly SIGNATURE_INVALID: "alexa.signature_invalid";
        /**
         * hub AlexaSignatureMiddleware.php:492 (forwarded through :280) — cert
         * validity window. Today `code: 'ALEXA_CERT_EXPIRED'`.
         */
        readonly CERT_EXPIRED: "alexa.cert_expired";
        /**
         * hub AlexaSignatureMiddleware.php:499 (forwarded through :280) — cert
         * SAN isn't an Alexa domain. Today `code: 'ALEXA_CERT_SAN_MISMATCH'`.
         */
        readonly CERT_SAN_MISMATCH: "alexa.cert_san_mismatch";
        /**
         * hub AlexaSignatureMiddleware.php:506 (forwarded through :280) — chain
         * doesn't anchor on the Amazon root. Today `code: 'ALEXA_CERT_CHAIN_UNTRUSTED'`.
         */
        readonly CERT_CHAIN_UNTRUSTED: "alexa.cert_chain_untrusted";
        /**
         * hub AlexaSignatureMiddleware.php:646,661,667 (`rejectTimestamp`) —
         * Timestamp header unparseable. Today `code: 'ALEXA_TIMESTAMP_MALFORMED'`.
         */
        readonly TIMESTAMP_MALFORMED: "alexa.timestamp_malformed";
        /**
         * hub AlexaSignatureMiddleware.php:651,656 (`rejectTimestamp`) — no
         * Timestamp header. Today `code: 'ALEXA_TIMESTAMP_MISSING'`.
         */
        readonly TIMESTAMP_MISSING: "alexa.timestamp_missing";
        /**
         * hub AlexaSignatureMiddleware.php:673 (`rejectTimestamp`) — timestamp
         * older than the skew window. Today `code: 'ALEXA_TIMESTAMP_STALE'`.
         */
        readonly TIMESTAMP_STALE: "alexa.timestamp_stale";
    };
    /** Hub subdomain/TLS provisioning. */
    readonly tls: {
        /** hub SubdomainController.php:165 */
        readonly ACME_NOT_IMPLEMENTED: "tls.acme_not_implemented";
    };
    /** Server CSRF origin gate. */
    readonly csrf: {
        /** srv Workerman/HttpHandler.php:182 */
        readonly INVALID_ORIGIN: "csrf.invalid_origin";
    };
    /** The actor resolved from the token itself (hub /me). */
    readonly user: {
        /** hub MeController.php:58 — dotted; distinct from admin.user_not_found */
        readonly NOT_FOUND: "user.not_found";
    };
    /** Server plugin admin/catalog surface. */
    readonly plugin: {
        /** srv PluginAdminController.php:139 */
        readonly NAME_REQUIRED: "plugin.name.required";
        /** srv PluginAdminController.php:145 */
        readonly NOT_FOUND: "plugin.not_found";
        /** srv PluginAdminController.php:282 */
        readonly URL_REQUIRED: "plugin.url.required";
        /** srv PluginAdminController.php:293 */
        readonly URL_INVALID_SCHEME: "plugin.url.invalid_scheme";
        /** srv PluginAdminController.php:309 */
        readonly URL_BLOCKED: "plugin.url.blocked";
        /** srv PluginAdminController.php:330 */
        readonly INSTALL_FAILED: "plugin.install.failed";
        /** srv PluginAdminController.php:383 */
        readonly ENABLE_FAILED: "plugin.enable.failed";
        /** srv PluginAdminController.php:197,506 */
        readonly SETTINGS_INVALID: "plugin.settings.invalid";
        /** srv PluginAdminController.php:238 */
        readonly SETTINGS_VALIDATION_FAILED: "plugin.settings.validation_failed";
        /** srv PluginAdminController.php:522 */
        readonly TEST_NOT_SUPPORTED: "plugin.test_not_supported";
        /** srv PluginCatalogController.php:149 */
        readonly UPDATE_FAILED: "plugin.update.failed";
        /** srv PluginCatalogController.php:151 */
        readonly UPDATE_NO_SOURCE: "plugin.update.no_source";
        /** srv PluginCatalogController.php:279 */
        readonly CATALOG_URL_REQUIRED: "plugin.catalog.url.required";
        /** srv PluginCatalogController.php:289 */
        readonly CATALOG_URL_DUPLICATE: "plugin.catalog.url.duplicate";
        /** srv PluginCatalogController.php:291 */
        readonly CATALOG_URL_INVALID: "plugin.catalog.url.invalid";
        /** srv PluginCatalogController.php:202 */
        readonly AUTO_UPDATE_INVALID: "plugin.auto_update.invalid";
        /** srv PluginCatalogController.php:248 */
        readonly CATALOG_CHANNEL_INVALID: "plugin.catalog.channel.invalid";
    };
    /** Server library CRUD. */
    readonly library: {
        /** srv LibraryController.php:965 */
        readonly DELETE_ALL_CONFIRM_REQUIRED: "library.delete_all.confirm_required";
    };
    /** Server TMDB metadata lookups. */
    readonly metadata: {
        /** srv TmdbUnconfiguredException.php:31 */
        readonly TMDB_UNCONFIGURED: "metadata.tmdb_unconfigured";
        /** srv MediaPosterController.php:147, MediaMatchController.php:148,218 */
        readonly TMDB_UNREACHABLE: "metadata.tmdb_unreachable";
        /** srv MediaMatchController.php:131 */
        readonly NO_QUERY: "metadata.no_query";
        /** srv MediaMatchController.php:199 */
        readonly BAD_TMDB_ID: "metadata.bad_tmdb_id";
        /** srv MediaMatchController.php:225 */
        readonly NO_MATCH: "metadata.no_match";
    };
    /** Server poster management. */
    readonly poster: {
        /** srv MediaPosterController.php:235 */
        readonly MISSING_URL: "poster.missing_url";
        /** srv MediaPosterController.php:243 */
        readonly POSTER_NOT_CANDIDATE: "poster.poster_not_candidate";
    };
    /**
     * Server profile PIN/switch/denial gates. Dotted wire values that CURRENTLY
     * RIDE A NON-`code` FIELD, not the `code` channel: the first four emit
     * `'error' => 'profile.use_switch'` etc. with NO `code` key (verified at
     * srv ProfilesController.php:215,274,403,407). `profile.not_found` was
     * promoted by the server W2 emit-wave and now rides the `code` channel with
     * the `denial_type` machine mirror kept (see its ref). The Wave-1b text-field
     * families named in the module header carry the same promote-in-Wave-2
     * caveat per domain. Until then, clients match the first four strings in
     * `error` text, not in `code`.
     */
    readonly profile: {
        /** srv ProfilesController.php:215 */
        readonly USE_SWITCH: "profile.use_switch";
        /** srv ProfilesController.php:274 */
        readonly LAST_PROFILE: "profile.last_profile";
        /** srv ProfilesController.php:403 */
        readonly NO_PIN: "profile.no_pin";
        /** srv ProfilesController.php:407 */
        readonly PIN_MISMATCH: "profile.pin_mismatch";
        /**
         * srv StreamLimitMiddleware.php:88-91,95-98 (403) ·
         * PreRouterFastPaths.php:597-602 (403) — the request carries a profile
         * that doesn't exist. Server W2 promoted it: `'code' =>
         * 'profile.not_found'` rides the `code` channel alongside the parked
         * `'error' => 'StreamLimitExceeded'` and the machine `'denial_type' =>
         * 'profile_not_found'` mirror (dual placement; clients may match any).
         */
        readonly NOT_FOUND: "profile.not_found";
    };
    /** Server DLNA allowlist gate. */
    readonly dlna: {
        /** srv DlnaAllowlistMiddleware.php:138 */
        readonly FORBIDDEN: "dlna.forbidden";
    };
    /** Server casting feature flag gate. */
    readonly casting: {
        /** srv CastingEnabledMiddleware.php:119 */
        readonly DISABLED: "casting.disabled";
    };
    /** Server QuickConnect device-pairing rail (bare snake on the `code` field). */
    readonly quickconnect: {
        /** srv QuickConnectController.php:245 */
        readonly UNAUTHORIZED: "unauthorized";
        /** srv QuickConnectController.php:269 */
        readonly INVALID_SECRET: "invalid_secret";
        /** srv QuickConnectController.php:272 */
        readonly PAIRING_NOT_PENDING: "pairing_not_pending";
        /** srv QuickConnectController.php:372 — consent gate on telemetry heartbeat */
        readonly CONSENT_REQUIRED: "consent_required";
        /** srv QuickConnectController.php:483 */
        readonly PAIRING_NOT_FOUND: "pairing_not_found";
        /** srv QuickConnectController.php:494 */
        readonly STORAGE_UNAVAILABLE: "storage_unavailable";
    };
    /**
     * Cross-surface validation/envelope codes: bare snake words carrying no
     * resource name, emitted by more than one controller (or by both servers).
     */
    readonly common: {
        /** srv Core/Application.php:2731 · hub Application.php:203 (+3) */
        readonly RATE_LIMITED: "rate_limited";
        /** srv AuthController.php:336,354 (LDAP) */
        readonly PROVIDER_UNAVAILABLE: "provider_unavailable";
        /** srv QuickConnectController.php:258,301 · hub InviteLinkController.php:107 */
        readonly INVALID_REQUEST: "invalid_request";
        /** hub FederationController.php:93 (+5) · InviteLinkController.php:53 · LibraryShareController.php:52,240 */
        readonly INVALID_BODY: "invalid_body";
        /** srv QuickConnectController.php:380-406 · hub AdminUpdatesController.php:109 */
        readonly INVALID_PAYLOAD: "invalid_payload";
        /** hub InviteLinkController.php:113 (+3) · LibraryShareController.php:138 (+2) */
        readonly UNKNOWN_ERROR: "unknown_error";
        /** hub AdminUserController.php:469 */
        readonly VALIDATION_FAILED: "validation_failed";
        /** hub RequestController.php:384 · UserQuotaController.php:332 · AdminUpdatesController.php:165 */
        readonly ADMIN_REQUIRED: "admin_required";
        /** hub FederationController.php:714,761 */
        readonly MASTER_ONLY: "master_only";
        /** hub FederationController.php:126,257 */
        readonly INVALID_URL: "invalid_url";
        /** hub FederationController.php:110 */
        readonly INVALID_ROLE: "invalid_role";
        /** hub FederationController.php:504 (also LibraryShareController.php:275) */
        readonly INVALID_PERMISSION: "invalid_permission";
        /** hub FederationController.php:244 */
        readonly MISSING_URL: "missing_url";
        /** hub FederationController.php:252 */
        readonly MISSING_NAME: "missing_name";
        /** hub FederationController.php:248 */
        readonly MISSING_PUBLIC_KEY: "missing_public_key";
        /** hub FederationController.php:781 · UserQuotaController.php:350 */
        readonly MISSING_USER_ID: "missing_user_id";
        /** hub InviteLinkController.php:71 · LibraryController.php:54 · LibraryShareController.php:77 */
        readonly MISSING_SERVER_ID: "missing_server_id";
        /** hub InviteLinkController.php:100 · LibraryController.php:62 · LibraryShareController.php:118 */
        readonly NOT_SERVER_OWNER: "not_server_owner";
    };
    /** Hub federation peer/offer/delegation CRUD (bare snake on `code`). */
    readonly federation: {
        /** hub FederationController.php:265 */
        readonly PEER_URL_EXISTS: "peer_url_exists";
        /** hub FederationController.php:274 */
        readonly PEER_KEY_EXISTS: "peer_key_exists";
        /** hub FederationController.php:310 (+4) */
        readonly PEER_NOT_FOUND: "peer_not_found";
        /** hub FederationController.php:618,668 */
        readonly OFFER_NOT_FOUND: "offer_not_found";
        /** hub FederationController.php:626,676 */
        readonly OFFER_ALREADY_RESPONDED: "offer_already_responded";
        /** hub FederationController.php:822 */
        readonly DELEGATION_NOT_FOUND: "delegation_not_found";
        /** hub FederationController.php:303 (+3) */
        readonly MISSING_PEER_ID: "missing_peer_id";
        /** hub FederationController.php:611,661 */
        readonly MISSING_OFFER_ID: "missing_offer_id";
        /** hub FederationController.php:815 */
        readonly MISSING_DELEGATION_ID: "missing_delegation_id";
        /** hub FederationController.php:488 (also LibraryShareController.php:84) */
        readonly MISSING_LIBRARY_ID: "missing_library_id";
        /** hub FederationController.php:508 (also LibraryShareController.php:91) */
        readonly MISSING_LIBRARY_NAME: "missing_library_name";
    };
    /** Hub library-share CRUD (bare snake on `code`). */
    readonly share: {
        /** hub FederationController.php:553 · LibraryShareController.php:196,262 */
        readonly NOT_FOUND: "share_not_found";
        /** hub FederationController.php:546 · LibraryShareController.php:184,232 */
        readonly MISSING_SHARE_ID: "missing_share_id";
        /** hub LibraryShareController.php:70 */
        readonly MISSING_COLLABORATOR_EMAIL: "missing_collaborator_email";
        /** hub LibraryShareController.php:125 */
        readonly EXISTS: "share_exists";
        /** hub LibraryShareController.php:202,268 */
        readonly NOT_OWNER: "not_share_owner";
        /** hub LibraryShareController.php:249 */
        readonly MISSING_PERMISSION: "missing_permission";
    };
    /** Hub invite-link lifecycle (bare snake on `code`). */
    readonly invite: {
        /** hub InviteLinkController.php:157 */
        readonly MISSING_LINK_ID: "missing_link_id";
        /** hub InviteLinkController.php:169,227 */
        readonly LINK_NOT_FOUND: "invite_link_not_found";
        /** hub InviteLinkController.php:175 */
        readonly NOT_LINK_OWNER: "not_link_owner";
        /** hub InviteLinkController.php:206 */
        readonly MISSING_TOKEN: "missing_token";
        /** hub InviteLinkController.php:220 */
        readonly INVALID: "invalid_invite";
        /** hub InviteLinkController.php:233 — 410 */
        readonly EXPIRED_OR_EXHAUSTED: "invite_expired_or_exhausted";
    };
    /** Hub media-request workflow (bare snake on `code`). */
    readonly request: {
        /** hub RequestController.php:83 */
        readonly INVALID_TYPE: "invalid_type";
        /** hub RequestController.php:92 */
        readonly INVALID_TMDB_ID: "invalid_tmdb_id";
        /** hub RequestController.php:100 */
        readonly MISSING_TITLE: "missing_title";
        /** hub RequestController.php:173 (+3) */
        readonly MISSING_REQUEST_ID: "missing_request_id";
        /** hub RequestController.php:181 (+3) */
        readonly NOT_FOUND: "request_not_found";
        /** hub RequestController.php:187,224 */
        readonly NOT_OWNER: "not_request_owner";
        /** hub RequestController.php:296 */
        readonly APPROVE_FAILED: "approve_failed";
        /** hub RequestController.php:352 */
        readonly DENY_FAILED: "deny_failed";
    };
    /** Hub admin user/quota management (bare snake on `code`). */
    readonly admin: {
        /** hub AdminUserController.php:446 — bare; distinct from auth.user_not_found / user.not_found */
        readonly USER_NOT_FOUND: "user_not_found";
        /** hub AdminUserController.php:243 */
        readonly CANNOT_DELETE_SELF: "cannot_delete_self";
        /** hub AdminUserController.php:246,277 */
        readonly LAST_ADMIN: "last_admin";
        /** hub AdminUserController.php:274 */
        readonly CANNOT_DEMOTE_SELF: "cannot_demote_self";
        /** hub UserQuotaController.php:358 */
        readonly INVALID_QUOTA: "invalid_quota";
        /** hub UserQuotaController.php:367 */
        readonly INVALID_THROTTLE: "invalid_throttle";
    };
    /**
     * Server core-update admin surface (bare snake on the `code` field). The
     * update surface's generic envelope words (`invalid_payload`,
     * `admin_required`) live in `common` with their cross-surface siblings;
     * operation-specific failures belong here.
     */
    readonly updates: {
        /** srv AdminUpdatesController.php:214 — 503 when `checkNow()` throws synchronously on POST /admin/updates/check */
        readonly CHECK_DISPATCH_FAILED: "update_check_dispatch_failed";
    };
    /**
     * Server linked-identity failures (account linking + OIDC/GitHub callback
     * completion). CAVEAT (Wave 1b): all seven ride the `error` TEXT field today
     * as bare snake pseudo-codes with no `code` key; the emit-wave promotes them
     * to the `code` channel — clients match in `error` text until then. Where a
     * twin name collapses two coexisting text spellings (e.g.
     * `invalid_identity` → `identity.invalid`), the dotted form is the single
     * forward value for both sites.
     */
    readonly identity: {
        /** srv AccountLinkController.php:211 (400) — today text 'missing_identity_id' */
        readonly MISSING_ID: "identity.missing_id";
        /** srv AccountLinkController.php:230 (404) — today text 'identity_not_found' */
        readonly NOT_FOUND: "identity.not_found";
        /**
         * srv AccountLinkController.php:244 (409) — unlink refused: last sign-in
         * method. Today text 'last_sign_in_method'.
         */
        readonly LAST_SIGN_IN_METHOD: "identity.last_sign_in_method";
        /**
         * srv AccountLinkController.php:583 · OidcCallbackController.php:743 ·
         * GithubCallbackController.php:740 (409) — provider account already bound
         * to another identity. Today text 'identity_already_linked'.
         */
        readonly ALREADY_LINKED: "identity.already_linked";
        /**
         * srv OidcCallbackController.php:632 · GithubCallbackController.php:646
         * (400) — provider returned no usable identity. Today text
         * 'invalid_identity'.
         */
        readonly INVALID: "identity.invalid";
        /**
         * srv OidcCallbackController.php:623 · GithubCallbackController.php:638
         * (503) — identity repository absent, linking disabled. Today text
         * 'link_unavailable'.
         */
        readonly LINK_UNAVAILABLE: "identity.link_unavailable";
        /**
         * srv OidcCallbackController.php:615 · GithubCallbackController.php:630
         * (400) — link flow state lost its initiating user. Today text
         * 'invalid_link_state'.
         */
        readonly INVALID_LINK_STATE: "identity.invalid_link_state";
    };
    /**
     * Server authentication-provider config/lookup failures (account-link
     * rail + OIDC/GitHub admin forms). CAVEAT (Wave 1b): all seven ride the
     * `error` TEXT field today as bare snake pseudo-codes with no `code` key;
     * the emit-wave promotes them to the `code` channel — clients match in
     * `error` text until then. `provider.not_configured` unifies today's two
     * spellings (`not_configured`, `provider_not_configured`) into ONE forward
     * value.
     */
    readonly provider: {
        /**
         * srv AuthProviderController.php:124 (409, text 'not_configured') ·
         * OidcCallbackController.php:281,488 · GithubCallbackController.php:249,
         * 421 (text 'provider_not_configured').
         */
        readonly NOT_CONFIGURED: "provider.not_configured";
        /** srv AuthProviderController.php:175 (404) — toggle for an unlisted provider. Today text 'unknown_provider'. */
        readonly UNKNOWN: "provider.unknown";
        /** srv AuthProviderController.php:195 (404) — provider row missing. Today text 'provider_not_found'. */
        readonly NOT_FOUND: "provider.not_found";
        /** srv OidcCallbackController.php:289 — registered provider isn't OIDC. Today text 'invalid_provider_type'. */
        readonly INVALID_TYPE: "provider.invalid_type";
        /** srv OidcAdminController.php:243 · GithubAdminController.php:151 — admin form word 'missing_client_id'. */
        readonly MISSING_CLIENT_ID: "provider.missing_client_id";
        /** srv OidcAdminController.php:236 — admin form word 'missing_provider_url'. */
        readonly MISSING_URL: "provider.missing_url";
        /** srv OidcAdminController.php:250 — admin form word 'invalid_provider_url'. */
        readonly INVALID_URL: "provider.invalid_url";
    };
    /**
     * Server OAuth browser-callback flow failures (OIDC + GitHub callback and
     * admin redirect validation). CAVEAT (Wave 1b): all six ride the `error`
     * TEXT field today as bare snake pseudo-codes with no `code` key; the
     * emit-wave promotes them to the `code` channel — clients match in `error`
     * text until then. NOT to be confused with the hub's RFC-6749/6750-mandated
     * `error` values (`invalid_grant`, …), which stay excluded per the module
     * header — these six are estate-chosen words, not RFC vocabulary.
     */
    readonly oauth: {
        /** srv OidcCallbackController.php:381 · GithubCallbackController.php:326 — text 'missing_code'. */
        readonly MISSING_CODE: "oauth.missing_code";
        /** srv OidcCallbackController.php:388 · GithubCallbackController.php:333 — text 'missing_state'. */
        readonly MISSING_STATE: "oauth.missing_state";
        /**
         * srv OidcCallbackController.php:396,419,436,463 ·
         * GithubCallbackController.php:341,362,378,397 — state cookie missing/
         * mismatched/expired (463: state not bound to this browser, 403). Text
         * 'invalid_state'.
         */
        readonly INVALID_STATE: "oauth.invalid_state";
        /** srv OidcCallbackController.php:254 · GithubCallbackController.php:226 — text 'missing_redirect_uri'. */
        readonly MISSING_REDIRECT_URI: "oauth.missing_redirect_uri";
        /**
         * srv OidcCallbackController.php:267,412 · GithubCallbackController.php:
         * 236,355 · OidcAdminController.php:283 · GithubAdminController.php:181 —
         * redirect URI not on the allowlist. Text 'invalid_redirect_uri'.
         */
        readonly INVALID_REDIRECT_URI: "oauth.invalid_redirect_uri";
        /** srv OidcCallbackController.php:815 · GithubCallbackController.php:808 — server has no configured callback URL. Text 'callback_url_not_configured'. */
        readonly CALLBACK_URL_NOT_CONFIGURED: "oauth.callback_url_not_configured";
    };
    /**
     * Server LDAP provider admin surface (connection form + test). CAVEAT
     * (Wave 1b): all seven ride the `error` TEXT field today — as form-gate
     * snake pseudo-codes (no `code` key) and, for the last four, as the
     * `'error'` value of the `LdapConnection::testConnection()` arrays that
     * `LdapAdminController.php:352-354` passes THROUGH to the client as JSON
     * (catch-arm text at :358) — the emit-wave promotes them to the `code`
     * channel; clients match in `error` text until then.
     */
    readonly ldap: {
        /** srv LdapAdminController.php:132,327 — form word 'missing_host'. */
        readonly MISSING_HOST: "ldap.missing_host";
        /** srv LdapAdminController.php:139,334 — form word 'missing_base_dn'. */
        readonly MISSING_BASE_DN: "ldap.missing_base_dn";
        /** srv LdapAdminController.php:146 — form word 'invalid_port'. */
        readonly INVALID_PORT: "ldap.invalid_port";
        /** srv LdapAdminController.php:358 (catch arm) · LdapConnection.php:259 (via :352-354 passthrough) — 'connection_failed'. */
        readonly CONNECTION_FAILED: "ldap.connection_failed";
        /** srv LdapConnection.php:268 (via LdapAdminController.php:352-354 passthrough) — 'bind_failed'. */
        readonly BIND_FAILED: "ldap.bind_failed";
        /** srv LdapConnection.php:281 (via :352-354 passthrough) — 'ldap_error'. */
        readonly ERROR: "ldap.error";
        /** srv LdapConnection.php:287 (via :352-354 passthrough) — 'runtime_error'. */
        readonly RUNTIME_ERROR: "ldap.runtime_error";
    };
    /**
     * SyncPlay WebSocket domain — dotted twins. The server emit-wave has
     * landed on the wrap-site carriers: `create`/`join` now emit the twin
     * `syncplay.*_failed` code on `error_code` with the SCREAMING fallback if
     * the inner handler set no code (`Messages::error($result['error_code'] ??
     * 'CREATE_FAILED', ...)` at SyncPlayManager.php:1586,1623); the `leave`
     * carrier (SyncPlayManager.php:1652) still emits raw `LEAVE_FAILED` — its
     * inner failure paths carry no `error_code` yet. See
     * `SYNCPLAY_ERROR_CODE_TWINS` for the migration table; `error_code` channel
     * and read order are untouched. Clients localize these codes; the legacy
     * SCREAMING carriers remain pinned under `legacy` for in-flight and
     * older-server traffic.
     */
    readonly syncplay: {
        /** twin of legacy CREATE_FAILED (SyncPlayManager.php:1586) */
        readonly CREATE_FAILED: "syncplay.create_failed";
        /** twin of legacy JOIN_FAILED (SyncPlayManager.php:1623) */
        readonly JOIN_FAILED: "syncplay.join_failed";
        /** twin of legacy LEAVE_FAILED (SyncPlayManager.php:1652) */
        readonly LEAVE_FAILED: "syncplay.leave_failed";
        /** was prose 'Maximum group limit reached' inside CREATE_FAILED (:621) */
        readonly GROUP_LIMIT_REACHED: "syncplay.group_limit_reached";
        /** was prose 'Group not found' inside JOIN_FAILED (:702) */
        readonly GROUP_NOT_FOUND: "syncplay.group_not_found";
        /** was prose 'Invalid password' inside JOIN_FAILED (:741) */
        readonly INVALID_PASSWORD: "syncplay.invalid_password";
        /** was prose 'Group is full' inside JOIN_FAILED (:745) */
        readonly GROUP_FULL: "syncplay.group_full";
    };
    /**
     * Legacy SyncPlay WS codes — the VERBATIM SCREAMING_SNAKE set servers emit in
     * `error_code` today. Canonical until Wave 2; renaming breaks live clients.
     * Sources: phlix-server Session/SyncPlay/SyncPlayManager.php sendError() sites
     * and Server/WebSocket/MessageHandler.php Messages::error() sites.
     */
    readonly legacy: {
        /** SyncPlayManager.php:576 */
        readonly UNKNOWN_MESSAGE: "UNKNOWN_MESSAGE";
        /** SyncPlayManager.php:579 */
        readonly HANDLER_ERROR: "HANDLER_ERROR";
        /** SyncPlayManager.php:944 (+11) · MessageHandler.php:156 */
        readonly NOT_AUTHENTICATED: "NOT_AUTHENTICATED";
        /** SyncPlayManager.php:952 (+7) */
        readonly NOT_IN_GROUP: "NOT_IN_GROUP";
        /** SyncPlayManager.php:957 (+4) */
        readonly NOT_HOST: "NOT_HOST";
        /** SyncPlayManager.php:1278 */
        readonly INVALID_NEW_HOST: "INVALID_NEW_HOST";
        /** SyncPlayManager.php:1283 */
        readonly MEMBER_NOT_FOUND: "MEMBER_NOT_FOUND";
        /** SyncPlayManager.php:1288 */
        readonly SAME_HOST: "SAME_HOST";
        /** SyncPlayManager.php:1586 — coarse carrier, see syncplay.create_failed twin */
        readonly CREATE_FAILED: "CREATE_FAILED";
        /** SyncPlayManager.php:1623 — coarse carrier, see syncplay.join_failed twins */
        readonly JOIN_FAILED: "JOIN_FAILED";
        /** SyncPlayManager.php:1652 — coarse carrier, see syncplay.leave_failed twin */
        readonly LEAVE_FAILED: "LEAVE_FAILED";
        /** MessageHandler.php:188-191 */
        readonly PROTOCOL_VERSION_MISMATCH: "PROTOCOL_VERSION_MISMATCH";
    };
};
/** The registry itself, nested by domain. */
export declare const ERROR_CODE: {
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
    readonly auth: {
        /** srv AuthMiddleware.php:62 (+24 controller/helper sites) · hub AuthMiddleware.php:113 */
        readonly REQUIRED: "auth.required";
        /** srv AdminMiddleware.php:101 (+9) · hub AdminMiddleware.php:62 */
        readonly NOT_ADMIN: "auth.not_admin";
        /** hub AuthMiddleware.php:118, McpController.php:352 */
        readonly INVALID_TOKEN: "auth.invalid_token";
        /** hub AuthMiddleware.php:129 — token subject has no user row */
        readonly USER_NOT_FOUND: "auth.user_not_found";
        /** srv SignupDisabledException.php:28 → AuthController.php:194 */
        readonly SIGNUPS_DISABLED: "auth.signups_disabled";
        /** srv AccountInactiveException.php:31 → AuthController.php:264 */
        readonly ACCOUNT_PENDING: "auth.account_pending";
        /** srv AccountInactiveException.php:32 */
        readonly ACCOUNT_DISABLED: "auth.account_disabled";
        /** srv PasswordChangeRequiredException.php:30 */
        readonly PASSWORD_CHANGE_REQUIRED: "auth.password_change_required";
        /**
         * hub ServerClaimController.php:107 — 401 on the claim route when no user
         * resolves. Hub W3 promoted the site: dotted `auth.unauthenticated` rides
         * the `code` channel, the SCREAMING `UNAUTHENTICATED` is parked in the
         * `error` TEXT field of the same payload (dual placement).
         */
        readonly UNAUTHENTICATED: "auth.unauthenticated";
        /**
         * hub EnrollmentJwtMiddleware.php:46,51,56 → `unauthorized()` helper
         * (:76) emits the dotted forward form on the `code` channel with the
         * SCREAMING `ENROLLMENT_TOKEN_EXPIRED` parked in the `error` TEXT
         * (W3 dual placement); hub ServerController.php:232-237 mapError arm does
         * the same (throw sources: DeregisterHandler.php:51,
         * RenewHandler.php:57, HeartbeatHandler.php:65,69).
         */
        readonly ENROLLMENT_EXPIRED: "auth.enrollment_expired";
        /**
         * hub ServerController.php:76,138,173,208 — 403 refusals when the
         * enrollment token's serverId doesn't match the path serverId. Hub W3
         * promoted: dotted `auth.server_mismatch` rides `code`, the legacy
         * `AUTHORIZATION_FAILED` is parked in the `error` TEXT field (dual
         * placement). The "Server ID mismatch" arms of the hub 401 enrollment
         * gates (SubdomainController.php:218, RelayController.php, via their
         * `unauthorized()` helpers, today bare `UNAUTHORIZED` text) remain
         * deferred — that promotion is not on the wire yet.
         */
        readonly SERVER_MISMATCH: "auth.server_mismatch";
        /**
         * srv AccountLinkController.php:295 — 400 when the link-identity POST
         * carries no credentials. Rides the `error` TEXT field today; Wave 2
         * promotes to the `code` channel; clients match in `error` text until
         * then.
         */
        readonly MISSING_CREDENTIALS: "auth.missing_credentials";
        /**
         * srv AccountLinkController.php:332 — 401 when submitted credentials fail
         * to verify. Rides the `error` TEXT field today; Wave 2 promotes to the
         * `code` channel; clients match in `error` text until then.
         */
        readonly INVALID_CREDENTIALS: "auth.invalid_credentials";
    };
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
    readonly hub: {
        /** srv AccountLinkController.php:412, HubTokenController.php:67 */
        readonly NOT_ENROLLED: "hub.not_enrolled";
        /** srv AccountLinkController.php:422, HubTokenController.php:79 */
        readonly TOKEN_REQUIRED: "hub.token_required";
        /** srv AccountLinkController.php:432,444, HubJwtMiddleware.php:73 */
        readonly JWT_INVALID: "hub.jwt_invalid";
        /**
         * hub ServerClaimController.php:49,159 · ServerController.php:64,126 ·
         * HubProtocolMiddleware.php:41-42 — 400 when the `protocol` header is
         * absent or not `phlix-hub`. Hub W3 promoted: dotted rides `code`, the
         * SCREAMING `HUB_PROTOCOL_UNSUPPORTED` is parked in the `error` TEXT of
         * the same payload (dual placement; clients may match either).
         */
        readonly PROTOCOL_UNSUPPORTED: "hub.protocol_unsupported";
        /**
         * hub ServerClaimController.php:171 · ServerController.php:246 —
         * the mapError default 500. Hub W3 promoted: dotted rides `code`, the
         * SCREAMING `HUB_INTERNAL_ERROR` is parked in the `error` TEXT (dual
         * placement; clients may match either).
         */
        readonly INTERNAL_ERROR: "hub.internal_error";
    };
    /**
     * Hub claim-code exchange failures (phlix-hub `ClaimRequestHandler` →
     * `ServerClaimController::mapError`). CAVEAT (Wave 1b, updated post-hub-W3):
     * the three arms rode the `error` TEXT field as SCREAMING pseudo-codes; hub
     * W3 promoted them — every arm now carries the dotted form on the `code`
     * channel with the SCREAMING original parked byte-identical in the same
     * payload's `error` TEXT (dual placement; clients may match either).
     */
    readonly claim: {
        /**
         * hub ServerClaimController.php:141 (404 arm 139-144) ← throws at
         * ClaimRequestHandler.php:162,189 — dotted on `code`, SCREAMING
         * `CLAIM_CODE_NOT_FOUND` parked in `error` text (dual).
         */
        readonly CODE_NOT_FOUND: "claim.code_not_found";
        /**
         * hub ServerClaimController.php:147 (410 arm 145-150) ← throw at
         * ClaimRequestHandler.php:199 — dotted on `code`, SCREAMING
         * `CLAIM_CODE_EXPIRED` parked in `error` text (dual).
         */
        readonly CODE_EXPIRED: "claim.code_expired";
        /**
         * hub ServerClaimController.php:153 (409 arm 151-156) ← throw at
         * ClaimRequestHandler.php:206 — dotted on `code`, SCREAMING
         * `CLAIM_CODE_ALREADY_CLAIMED` parked in `error` text (dual).
         */
        readonly CODE_ALREADY_CLAIMED: "claim.code_already_claimed";
    };
    /** Hub-side server lookup/tunnel failures (phlix-hub). */
    readonly server: {
        /** hub ServerProxyController.php:978 (+4 controllers) */
        readonly NOT_FOUND: "server.not_found";
        /** hub ServerProxyController.php:982 (+3 controllers) */
        readonly NOT_OWNED: "server.not_owned";
        /** hub ServerProxyController.php:1000 — relay manager absent */
        readonly RELAY_UNAVAILABLE: "server.relay_unavailable";
        /** hub ServerProxyController.php:1007, RelayProxyManager.php:480 */
        readonly OFFLINE: "server.offline";
        /** hub RelayProxyManager.php:231 */
        readonly NO_TUNNEL: "server.no_tunnel";
        /**
         * hub ServerClaimController.php:165 (400 arm 163-168) ← throws at
         * ClaimRequestHandler.php:399,402,405,409 — the server's Ed25519 key
         * failed validation during claim. Hub W3 promoted: dotted rides `code`,
         * the SCREAMING `SERVER_KEY_INVALID` is parked in the `error` TEXT (dual
         * placement; clients may match either).
         */
        readonly KEY_INVALID: "server.key_invalid";
    };
    /** Hub reverse-proxy scope gates. */
    readonly proxy: {
        /** hub ServerProxyController.php:1044,1059 */
        readonly SCOPE_DENIED: "proxy.scope_denied";
    };
    /** Hub bandwidth quota gate. */
    readonly quota: {
        /** hub ServerProxyController.php:1019 */
        readonly EXCEEDED: "quota.exceeded";
    };
    /**
     * Concurrent-stream throttle gates (hub proxy + server middleware).
     * CAVEAT (Wave 1b, updated post-server-W2): `stream.limit` rides the hub
     * `code` channel. The server twin below was promoted by the server W2
     * emit-wave: `stream.limit_exceeded` now rides the `code` channel
     * positionally, the CamelCase pseudo-code `StreamLimitExceeded` is parked in
     * the `error` TEXT field and the `denial_type` machine mirror is kept
     * (dual placement; clients may match `code`, `error` text or `denial_type`).
     */
    readonly stream: {
        /** hub ServerProxyController.php:1098 */
        readonly LIMIT: "stream.limit";
        /**
         * srv StreamLimitMiddleware.php:113-117 (429) · PreRouterFastPaths.php:
         * 569-575 (429) — `'code' => 'stream.limit_exceeded'` alongside the
         * parked `'error' => 'StreamLimitExceeded'` and `'denial_type' =>
         * 'stream_limit_exceeded'` mirror (server W2 dual placement).
         */
        readonly LIMIT_EXCEEDED: "stream.limit_exceeded";
    };
    /**
     * Server scheduled-access window gate (phlix-server). CAVEAT (Wave 1b,
     * updated post-server-W2): promoted by the server W2 emit-wave —
     * `access.scheduled` rides the `code` channel positionally, the CamelCase
     * pseudo-code `AccessScheduled` is parked in the `error` TEXT field
     * (dual placement; clients may match either).
     */
    readonly access: {
        /**
         * srv AccessScheduleMiddleware.php:99-101,109-111,117-119 — 403 outside
         * the profile's allowed window; `'code' => 'access.scheduled'` with
         * `'error' => 'AccessScheduled'` parked in text (server W2).
         */
        readonly SCHEDULED: "access.scheduled";
    };
    /** Hub→server upstream gateway failures. */
    readonly gateway: {
        /** hub ServerProxyController.php:1131, RelayProxyManager.php:622, RelayProxyBridge.php:313 */
        readonly TIMEOUT: "gateway.timeout";
    };
    /** Hub relay endpoint-shape refusals. */
    readonly relay: {
        /** hub ClientMountController.php:117,129 — HTTP hit on the client WS mount */
        readonly CLIENT_WS_ENDPOINT: "relay.client_ws_endpoint";
        /** hub RelayController.php:125 — HTTP hit on the server WS endpoint */
        readonly WS_HTTP_ENDPOINT: "relay.ws_http_endpoint";
        /** hub RelayProxyManager.php:258 */
        readonly ENCODE_ERROR: "relay.encode_error";
    };
    /** Hub MCP-surface tool-protocol failures (machine `code`, not JSON-RPC numbers). */
    readonly mcp: {
        /** hub McpToolRegistry.php:154 */
        readonly UNKNOWN_TOOL: "mcp.unknown_tool";
        /** hub McpToolRegistry.php:166 */
        readonly SCOPE_DENIED: "mcp.scope_denied";
        /** hub McpToolContext.php:231 */
        readonly STREAMING_UNSUPPORTED: "mcp.streaming_unsupported";
        /** hub McpController.php:238 */
        readonly SSE_NOT_ACCEPTABLE: "mcp.sse_not_acceptable";
        /** hub McpController.php:305 */
        readonly UNSUPPORTED_PROTOCOL_VERSION: "mcp.unsupported_protocol_version";
    };
    /** Hub MCP personal-access-token CRUD. */
    readonly mcp_token: {
        /** hub McpTokenController.php:139 */
        readonly NO_VALID_SCOPES: "mcp_token.no_valid_scopes";
        /** hub McpTokenController.php:183 */
        readonly NOT_FOUND: "mcp_token.not_found";
    };
    /**
     * Hub Alexa adapter failures on the machine channel. CAVEAT (Wave 1b): the
     * fourteen signature-verification entries below already ride the `code`
     * channel today, but in SCREAMING form — every `AlexaSignatureMiddleware-
     * ::reject()` payload carries `'code' => 'ALEXA_*'` (helper at :700-719).
     * These dotted entries are the forward form; the emit-wave flips the
     * middleware to dotted values and the SCREAMING originals become legacy —
     * clients match `ALEXA_*` in `code` until then.
     */
    readonly alexa: {
        /** hub AlexaMediaGateway.php:203 — 501 payload */
        readonly STREAMING_UNSUPPORTED: "alexa.streaming_unsupported";
        /** hub AlexaSkillController.php:215 */
        readonly MALFORMED_ENVELOPE: "alexa.malformed_envelope";
        /**
         * hub AlexaSignatureMiddleware.php:245 — fail-closed catch around
         * verification itself. Today `code: 'ALEXA_VERIFICATION_ERROR'`.
         */
        readonly VERIFICATION_ERROR: "alexa.verification_error";
        /**
         * hub AlexaSignatureMiddleware.php:258 — no cert-chain-Url header.
         * Today `code: 'ALEXA_MISSING_CERT_CHAIN_URL'`.
         */
        readonly MISSING_CERT_CHAIN_URL: "alexa.missing_cert_chain_url";
        /**
         * hub AlexaSignatureMiddleware.php:263 — no Signature header.
         * Today `code: 'ALEXA_MISSING_SIGNATURE_HEADER'`.
         */
        readonly MISSING_SIGNATURE_HEADER: "alexa.missing_signature_header";
        /**
         * hub AlexaSignatureMiddleware.php:268 — empty request body.
         * Today `code: 'ALEXA_EMPTY_BODY'`.
         */
        readonly EMPTY_BODY: "alexa.empty_body";
        /**
         * hub AlexaSignatureMiddleware.php:274 — cert URL outside the Amazon
         * allowlist. Today `code: 'ALEXA_CERT_URL_REJECTED'`.
         */
        readonly CERT_URL_REJECTED: "alexa.cert_url_rejected";
        /**
         * hub AlexaSignatureMiddleware.php:430 (`ChainVerification::rejected`
         * arms forwarded through :280) — Amazon cert fetch failed.
         * Today `code: 'ALEXA_CERT_FETCH_FAILED'`.
         */
        readonly CERT_FETCH_FAILED: "alexa.cert_fetch_failed";
        /**
         * hub AlexaSignatureMiddleware.php:291 + forwarded ChainVerification
         * arms :473,479,486,513,519, plus the ChainVerification.php:97 fallback —
         * today `code: 'ALEXA_CERT_CHAIN_MALFORMED'`.
         */
        readonly CERT_CHAIN_MALFORMED: "alexa.cert_chain_malformed";
        /**
         * hub AlexaSignatureMiddleware.php:286,295 — signature check failed.
         * Today `code: 'ALEXA_SIGNATURE_INVALID'`.
         */
        readonly SIGNATURE_INVALID: "alexa.signature_invalid";
        /**
         * hub AlexaSignatureMiddleware.php:492 (forwarded through :280) — cert
         * validity window. Today `code: 'ALEXA_CERT_EXPIRED'`.
         */
        readonly CERT_EXPIRED: "alexa.cert_expired";
        /**
         * hub AlexaSignatureMiddleware.php:499 (forwarded through :280) — cert
         * SAN isn't an Alexa domain. Today `code: 'ALEXA_CERT_SAN_MISMATCH'`.
         */
        readonly CERT_SAN_MISMATCH: "alexa.cert_san_mismatch";
        /**
         * hub AlexaSignatureMiddleware.php:506 (forwarded through :280) — chain
         * doesn't anchor on the Amazon root. Today `code: 'ALEXA_CERT_CHAIN_UNTRUSTED'`.
         */
        readonly CERT_CHAIN_UNTRUSTED: "alexa.cert_chain_untrusted";
        /**
         * hub AlexaSignatureMiddleware.php:646,661,667 (`rejectTimestamp`) —
         * Timestamp header unparseable. Today `code: 'ALEXA_TIMESTAMP_MALFORMED'`.
         */
        readonly TIMESTAMP_MALFORMED: "alexa.timestamp_malformed";
        /**
         * hub AlexaSignatureMiddleware.php:651,656 (`rejectTimestamp`) — no
         * Timestamp header. Today `code: 'ALEXA_TIMESTAMP_MISSING'`.
         */
        readonly TIMESTAMP_MISSING: "alexa.timestamp_missing";
        /**
         * hub AlexaSignatureMiddleware.php:673 (`rejectTimestamp`) — timestamp
         * older than the skew window. Today `code: 'ALEXA_TIMESTAMP_STALE'`.
         */
        readonly TIMESTAMP_STALE: "alexa.timestamp_stale";
    };
    /** Hub subdomain/TLS provisioning. */
    readonly tls: {
        /** hub SubdomainController.php:165 */
        readonly ACME_NOT_IMPLEMENTED: "tls.acme_not_implemented";
    };
    /** Server CSRF origin gate. */
    readonly csrf: {
        /** srv Workerman/HttpHandler.php:182 */
        readonly INVALID_ORIGIN: "csrf.invalid_origin";
    };
    /** The actor resolved from the token itself (hub /me). */
    readonly user: {
        /** hub MeController.php:58 — dotted; distinct from admin.user_not_found */
        readonly NOT_FOUND: "user.not_found";
    };
    /** Server plugin admin/catalog surface. */
    readonly plugin: {
        /** srv PluginAdminController.php:139 */
        readonly NAME_REQUIRED: "plugin.name.required";
        /** srv PluginAdminController.php:145 */
        readonly NOT_FOUND: "plugin.not_found";
        /** srv PluginAdminController.php:282 */
        readonly URL_REQUIRED: "plugin.url.required";
        /** srv PluginAdminController.php:293 */
        readonly URL_INVALID_SCHEME: "plugin.url.invalid_scheme";
        /** srv PluginAdminController.php:309 */
        readonly URL_BLOCKED: "plugin.url.blocked";
        /** srv PluginAdminController.php:330 */
        readonly INSTALL_FAILED: "plugin.install.failed";
        /** srv PluginAdminController.php:383 */
        readonly ENABLE_FAILED: "plugin.enable.failed";
        /** srv PluginAdminController.php:197,506 */
        readonly SETTINGS_INVALID: "plugin.settings.invalid";
        /** srv PluginAdminController.php:238 */
        readonly SETTINGS_VALIDATION_FAILED: "plugin.settings.validation_failed";
        /** srv PluginAdminController.php:522 */
        readonly TEST_NOT_SUPPORTED: "plugin.test_not_supported";
        /** srv PluginCatalogController.php:149 */
        readonly UPDATE_FAILED: "plugin.update.failed";
        /** srv PluginCatalogController.php:151 */
        readonly UPDATE_NO_SOURCE: "plugin.update.no_source";
        /** srv PluginCatalogController.php:279 */
        readonly CATALOG_URL_REQUIRED: "plugin.catalog.url.required";
        /** srv PluginCatalogController.php:289 */
        readonly CATALOG_URL_DUPLICATE: "plugin.catalog.url.duplicate";
        /** srv PluginCatalogController.php:291 */
        readonly CATALOG_URL_INVALID: "plugin.catalog.url.invalid";
        /** srv PluginCatalogController.php:202 */
        readonly AUTO_UPDATE_INVALID: "plugin.auto_update.invalid";
        /** srv PluginCatalogController.php:248 */
        readonly CATALOG_CHANNEL_INVALID: "plugin.catalog.channel.invalid";
    };
    /** Server library CRUD. */
    readonly library: {
        /** srv LibraryController.php:965 */
        readonly DELETE_ALL_CONFIRM_REQUIRED: "library.delete_all.confirm_required";
    };
    /** Server TMDB metadata lookups. */
    readonly metadata: {
        /** srv TmdbUnconfiguredException.php:31 */
        readonly TMDB_UNCONFIGURED: "metadata.tmdb_unconfigured";
        /** srv MediaPosterController.php:147, MediaMatchController.php:148,218 */
        readonly TMDB_UNREACHABLE: "metadata.tmdb_unreachable";
        /** srv MediaMatchController.php:131 */
        readonly NO_QUERY: "metadata.no_query";
        /** srv MediaMatchController.php:199 */
        readonly BAD_TMDB_ID: "metadata.bad_tmdb_id";
        /** srv MediaMatchController.php:225 */
        readonly NO_MATCH: "metadata.no_match";
    };
    /** Server poster management. */
    readonly poster: {
        /** srv MediaPosterController.php:235 */
        readonly MISSING_URL: "poster.missing_url";
        /** srv MediaPosterController.php:243 */
        readonly POSTER_NOT_CANDIDATE: "poster.poster_not_candidate";
    };
    /**
     * Server profile PIN/switch/denial gates. Dotted wire values that CURRENTLY
     * RIDE A NON-`code` FIELD, not the `code` channel: the first four emit
     * `'error' => 'profile.use_switch'` etc. with NO `code` key (verified at
     * srv ProfilesController.php:215,274,403,407). `profile.not_found` was
     * promoted by the server W2 emit-wave and now rides the `code` channel with
     * the `denial_type` machine mirror kept (see its ref). The Wave-1b text-field
     * families named in the module header carry the same promote-in-Wave-2
     * caveat per domain. Until then, clients match the first four strings in
     * `error` text, not in `code`.
     */
    readonly profile: {
        /** srv ProfilesController.php:215 */
        readonly USE_SWITCH: "profile.use_switch";
        /** srv ProfilesController.php:274 */
        readonly LAST_PROFILE: "profile.last_profile";
        /** srv ProfilesController.php:403 */
        readonly NO_PIN: "profile.no_pin";
        /** srv ProfilesController.php:407 */
        readonly PIN_MISMATCH: "profile.pin_mismatch";
        /**
         * srv StreamLimitMiddleware.php:88-91,95-98 (403) ·
         * PreRouterFastPaths.php:597-602 (403) — the request carries a profile
         * that doesn't exist. Server W2 promoted it: `'code' =>
         * 'profile.not_found'` rides the `code` channel alongside the parked
         * `'error' => 'StreamLimitExceeded'` and the machine `'denial_type' =>
         * 'profile_not_found'` mirror (dual placement; clients may match any).
         */
        readonly NOT_FOUND: "profile.not_found";
    };
    /** Server DLNA allowlist gate. */
    readonly dlna: {
        /** srv DlnaAllowlistMiddleware.php:138 */
        readonly FORBIDDEN: "dlna.forbidden";
    };
    /** Server casting feature flag gate. */
    readonly casting: {
        /** srv CastingEnabledMiddleware.php:119 */
        readonly DISABLED: "casting.disabled";
    };
    /** Server QuickConnect device-pairing rail (bare snake on the `code` field). */
    readonly quickconnect: {
        /** srv QuickConnectController.php:245 */
        readonly UNAUTHORIZED: "unauthorized";
        /** srv QuickConnectController.php:269 */
        readonly INVALID_SECRET: "invalid_secret";
        /** srv QuickConnectController.php:272 */
        readonly PAIRING_NOT_PENDING: "pairing_not_pending";
        /** srv QuickConnectController.php:372 — consent gate on telemetry heartbeat */
        readonly CONSENT_REQUIRED: "consent_required";
        /** srv QuickConnectController.php:483 */
        readonly PAIRING_NOT_FOUND: "pairing_not_found";
        /** srv QuickConnectController.php:494 */
        readonly STORAGE_UNAVAILABLE: "storage_unavailable";
    };
    /**
     * Cross-surface validation/envelope codes: bare snake words carrying no
     * resource name, emitted by more than one controller (or by both servers).
     */
    readonly common: {
        /** srv Core/Application.php:2731 · hub Application.php:203 (+3) */
        readonly RATE_LIMITED: "rate_limited";
        /** srv AuthController.php:336,354 (LDAP) */
        readonly PROVIDER_UNAVAILABLE: "provider_unavailable";
        /** srv QuickConnectController.php:258,301 · hub InviteLinkController.php:107 */
        readonly INVALID_REQUEST: "invalid_request";
        /** hub FederationController.php:93 (+5) · InviteLinkController.php:53 · LibraryShareController.php:52,240 */
        readonly INVALID_BODY: "invalid_body";
        /** srv QuickConnectController.php:380-406 · hub AdminUpdatesController.php:109 */
        readonly INVALID_PAYLOAD: "invalid_payload";
        /** hub InviteLinkController.php:113 (+3) · LibraryShareController.php:138 (+2) */
        readonly UNKNOWN_ERROR: "unknown_error";
        /** hub AdminUserController.php:469 */
        readonly VALIDATION_FAILED: "validation_failed";
        /** hub RequestController.php:384 · UserQuotaController.php:332 · AdminUpdatesController.php:165 */
        readonly ADMIN_REQUIRED: "admin_required";
        /** hub FederationController.php:714,761 */
        readonly MASTER_ONLY: "master_only";
        /** hub FederationController.php:126,257 */
        readonly INVALID_URL: "invalid_url";
        /** hub FederationController.php:110 */
        readonly INVALID_ROLE: "invalid_role";
        /** hub FederationController.php:504 (also LibraryShareController.php:275) */
        readonly INVALID_PERMISSION: "invalid_permission";
        /** hub FederationController.php:244 */
        readonly MISSING_URL: "missing_url";
        /** hub FederationController.php:252 */
        readonly MISSING_NAME: "missing_name";
        /** hub FederationController.php:248 */
        readonly MISSING_PUBLIC_KEY: "missing_public_key";
        /** hub FederationController.php:781 · UserQuotaController.php:350 */
        readonly MISSING_USER_ID: "missing_user_id";
        /** hub InviteLinkController.php:71 · LibraryController.php:54 · LibraryShareController.php:77 */
        readonly MISSING_SERVER_ID: "missing_server_id";
        /** hub InviteLinkController.php:100 · LibraryController.php:62 · LibraryShareController.php:118 */
        readonly NOT_SERVER_OWNER: "not_server_owner";
    };
    /** Hub federation peer/offer/delegation CRUD (bare snake on `code`). */
    readonly federation: {
        /** hub FederationController.php:265 */
        readonly PEER_URL_EXISTS: "peer_url_exists";
        /** hub FederationController.php:274 */
        readonly PEER_KEY_EXISTS: "peer_key_exists";
        /** hub FederationController.php:310 (+4) */
        readonly PEER_NOT_FOUND: "peer_not_found";
        /** hub FederationController.php:618,668 */
        readonly OFFER_NOT_FOUND: "offer_not_found";
        /** hub FederationController.php:626,676 */
        readonly OFFER_ALREADY_RESPONDED: "offer_already_responded";
        /** hub FederationController.php:822 */
        readonly DELEGATION_NOT_FOUND: "delegation_not_found";
        /** hub FederationController.php:303 (+3) */
        readonly MISSING_PEER_ID: "missing_peer_id";
        /** hub FederationController.php:611,661 */
        readonly MISSING_OFFER_ID: "missing_offer_id";
        /** hub FederationController.php:815 */
        readonly MISSING_DELEGATION_ID: "missing_delegation_id";
        /** hub FederationController.php:488 (also LibraryShareController.php:84) */
        readonly MISSING_LIBRARY_ID: "missing_library_id";
        /** hub FederationController.php:508 (also LibraryShareController.php:91) */
        readonly MISSING_LIBRARY_NAME: "missing_library_name";
    };
    /** Hub library-share CRUD (bare snake on `code`). */
    readonly share: {
        /** hub FederationController.php:553 · LibraryShareController.php:196,262 */
        readonly NOT_FOUND: "share_not_found";
        /** hub FederationController.php:546 · LibraryShareController.php:184,232 */
        readonly MISSING_SHARE_ID: "missing_share_id";
        /** hub LibraryShareController.php:70 */
        readonly MISSING_COLLABORATOR_EMAIL: "missing_collaborator_email";
        /** hub LibraryShareController.php:125 */
        readonly EXISTS: "share_exists";
        /** hub LibraryShareController.php:202,268 */
        readonly NOT_OWNER: "not_share_owner";
        /** hub LibraryShareController.php:249 */
        readonly MISSING_PERMISSION: "missing_permission";
    };
    /** Hub invite-link lifecycle (bare snake on `code`). */
    readonly invite: {
        /** hub InviteLinkController.php:157 */
        readonly MISSING_LINK_ID: "missing_link_id";
        /** hub InviteLinkController.php:169,227 */
        readonly LINK_NOT_FOUND: "invite_link_not_found";
        /** hub InviteLinkController.php:175 */
        readonly NOT_LINK_OWNER: "not_link_owner";
        /** hub InviteLinkController.php:206 */
        readonly MISSING_TOKEN: "missing_token";
        /** hub InviteLinkController.php:220 */
        readonly INVALID: "invalid_invite";
        /** hub InviteLinkController.php:233 — 410 */
        readonly EXPIRED_OR_EXHAUSTED: "invite_expired_or_exhausted";
    };
    /** Hub media-request workflow (bare snake on `code`). */
    readonly request: {
        /** hub RequestController.php:83 */
        readonly INVALID_TYPE: "invalid_type";
        /** hub RequestController.php:92 */
        readonly INVALID_TMDB_ID: "invalid_tmdb_id";
        /** hub RequestController.php:100 */
        readonly MISSING_TITLE: "missing_title";
        /** hub RequestController.php:173 (+3) */
        readonly MISSING_REQUEST_ID: "missing_request_id";
        /** hub RequestController.php:181 (+3) */
        readonly NOT_FOUND: "request_not_found";
        /** hub RequestController.php:187,224 */
        readonly NOT_OWNER: "not_request_owner";
        /** hub RequestController.php:296 */
        readonly APPROVE_FAILED: "approve_failed";
        /** hub RequestController.php:352 */
        readonly DENY_FAILED: "deny_failed";
    };
    /** Hub admin user/quota management (bare snake on `code`). */
    readonly admin: {
        /** hub AdminUserController.php:446 — bare; distinct from auth.user_not_found / user.not_found */
        readonly USER_NOT_FOUND: "user_not_found";
        /** hub AdminUserController.php:243 */
        readonly CANNOT_DELETE_SELF: "cannot_delete_self";
        /** hub AdminUserController.php:246,277 */
        readonly LAST_ADMIN: "last_admin";
        /** hub AdminUserController.php:274 */
        readonly CANNOT_DEMOTE_SELF: "cannot_demote_self";
        /** hub UserQuotaController.php:358 */
        readonly INVALID_QUOTA: "invalid_quota";
        /** hub UserQuotaController.php:367 */
        readonly INVALID_THROTTLE: "invalid_throttle";
    };
    /**
     * Server core-update admin surface (bare snake on the `code` field). The
     * update surface's generic envelope words (`invalid_payload`,
     * `admin_required`) live in `common` with their cross-surface siblings;
     * operation-specific failures belong here.
     */
    readonly updates: {
        /** srv AdminUpdatesController.php:214 — 503 when `checkNow()` throws synchronously on POST /admin/updates/check */
        readonly CHECK_DISPATCH_FAILED: "update_check_dispatch_failed";
    };
    /**
     * Server linked-identity failures (account linking + OIDC/GitHub callback
     * completion). CAVEAT (Wave 1b): all seven ride the `error` TEXT field today
     * as bare snake pseudo-codes with no `code` key; the emit-wave promotes them
     * to the `code` channel — clients match in `error` text until then. Where a
     * twin name collapses two coexisting text spellings (e.g.
     * `invalid_identity` → `identity.invalid`), the dotted form is the single
     * forward value for both sites.
     */
    readonly identity: {
        /** srv AccountLinkController.php:211 (400) — today text 'missing_identity_id' */
        readonly MISSING_ID: "identity.missing_id";
        /** srv AccountLinkController.php:230 (404) — today text 'identity_not_found' */
        readonly NOT_FOUND: "identity.not_found";
        /**
         * srv AccountLinkController.php:244 (409) — unlink refused: last sign-in
         * method. Today text 'last_sign_in_method'.
         */
        readonly LAST_SIGN_IN_METHOD: "identity.last_sign_in_method";
        /**
         * srv AccountLinkController.php:583 · OidcCallbackController.php:743 ·
         * GithubCallbackController.php:740 (409) — provider account already bound
         * to another identity. Today text 'identity_already_linked'.
         */
        readonly ALREADY_LINKED: "identity.already_linked";
        /**
         * srv OidcCallbackController.php:632 · GithubCallbackController.php:646
         * (400) — provider returned no usable identity. Today text
         * 'invalid_identity'.
         */
        readonly INVALID: "identity.invalid";
        /**
         * srv OidcCallbackController.php:623 · GithubCallbackController.php:638
         * (503) — identity repository absent, linking disabled. Today text
         * 'link_unavailable'.
         */
        readonly LINK_UNAVAILABLE: "identity.link_unavailable";
        /**
         * srv OidcCallbackController.php:615 · GithubCallbackController.php:630
         * (400) — link flow state lost its initiating user. Today text
         * 'invalid_link_state'.
         */
        readonly INVALID_LINK_STATE: "identity.invalid_link_state";
    };
    /**
     * Server authentication-provider config/lookup failures (account-link
     * rail + OIDC/GitHub admin forms). CAVEAT (Wave 1b): all seven ride the
     * `error` TEXT field today as bare snake pseudo-codes with no `code` key;
     * the emit-wave promotes them to the `code` channel — clients match in
     * `error` text until then. `provider.not_configured` unifies today's two
     * spellings (`not_configured`, `provider_not_configured`) into ONE forward
     * value.
     */
    readonly provider: {
        /**
         * srv AuthProviderController.php:124 (409, text 'not_configured') ·
         * OidcCallbackController.php:281,488 · GithubCallbackController.php:249,
         * 421 (text 'provider_not_configured').
         */
        readonly NOT_CONFIGURED: "provider.not_configured";
        /** srv AuthProviderController.php:175 (404) — toggle for an unlisted provider. Today text 'unknown_provider'. */
        readonly UNKNOWN: "provider.unknown";
        /** srv AuthProviderController.php:195 (404) — provider row missing. Today text 'provider_not_found'. */
        readonly NOT_FOUND: "provider.not_found";
        /** srv OidcCallbackController.php:289 — registered provider isn't OIDC. Today text 'invalid_provider_type'. */
        readonly INVALID_TYPE: "provider.invalid_type";
        /** srv OidcAdminController.php:243 · GithubAdminController.php:151 — admin form word 'missing_client_id'. */
        readonly MISSING_CLIENT_ID: "provider.missing_client_id";
        /** srv OidcAdminController.php:236 — admin form word 'missing_provider_url'. */
        readonly MISSING_URL: "provider.missing_url";
        /** srv OidcAdminController.php:250 — admin form word 'invalid_provider_url'. */
        readonly INVALID_URL: "provider.invalid_url";
    };
    /**
     * Server OAuth browser-callback flow failures (OIDC + GitHub callback and
     * admin redirect validation). CAVEAT (Wave 1b): all six ride the `error`
     * TEXT field today as bare snake pseudo-codes with no `code` key; the
     * emit-wave promotes them to the `code` channel — clients match in `error`
     * text until then. NOT to be confused with the hub's RFC-6749/6750-mandated
     * `error` values (`invalid_grant`, …), which stay excluded per the module
     * header — these six are estate-chosen words, not RFC vocabulary.
     */
    readonly oauth: {
        /** srv OidcCallbackController.php:381 · GithubCallbackController.php:326 — text 'missing_code'. */
        readonly MISSING_CODE: "oauth.missing_code";
        /** srv OidcCallbackController.php:388 · GithubCallbackController.php:333 — text 'missing_state'. */
        readonly MISSING_STATE: "oauth.missing_state";
        /**
         * srv OidcCallbackController.php:396,419,436,463 ·
         * GithubCallbackController.php:341,362,378,397 — state cookie missing/
         * mismatched/expired (463: state not bound to this browser, 403). Text
         * 'invalid_state'.
         */
        readonly INVALID_STATE: "oauth.invalid_state";
        /** srv OidcCallbackController.php:254 · GithubCallbackController.php:226 — text 'missing_redirect_uri'. */
        readonly MISSING_REDIRECT_URI: "oauth.missing_redirect_uri";
        /**
         * srv OidcCallbackController.php:267,412 · GithubCallbackController.php:
         * 236,355 · OidcAdminController.php:283 · GithubAdminController.php:181 —
         * redirect URI not on the allowlist. Text 'invalid_redirect_uri'.
         */
        readonly INVALID_REDIRECT_URI: "oauth.invalid_redirect_uri";
        /** srv OidcCallbackController.php:815 · GithubCallbackController.php:808 — server has no configured callback URL. Text 'callback_url_not_configured'. */
        readonly CALLBACK_URL_NOT_CONFIGURED: "oauth.callback_url_not_configured";
    };
    /**
     * Server LDAP provider admin surface (connection form + test). CAVEAT
     * (Wave 1b): all seven ride the `error` TEXT field today — as form-gate
     * snake pseudo-codes (no `code` key) and, for the last four, as the
     * `'error'` value of the `LdapConnection::testConnection()` arrays that
     * `LdapAdminController.php:352-354` passes THROUGH to the client as JSON
     * (catch-arm text at :358) — the emit-wave promotes them to the `code`
     * channel; clients match in `error` text until then.
     */
    readonly ldap: {
        /** srv LdapAdminController.php:132,327 — form word 'missing_host'. */
        readonly MISSING_HOST: "ldap.missing_host";
        /** srv LdapAdminController.php:139,334 — form word 'missing_base_dn'. */
        readonly MISSING_BASE_DN: "ldap.missing_base_dn";
        /** srv LdapAdminController.php:146 — form word 'invalid_port'. */
        readonly INVALID_PORT: "ldap.invalid_port";
        /** srv LdapAdminController.php:358 (catch arm) · LdapConnection.php:259 (via :352-354 passthrough) — 'connection_failed'. */
        readonly CONNECTION_FAILED: "ldap.connection_failed";
        /** srv LdapConnection.php:268 (via LdapAdminController.php:352-354 passthrough) — 'bind_failed'. */
        readonly BIND_FAILED: "ldap.bind_failed";
        /** srv LdapConnection.php:281 (via :352-354 passthrough) — 'ldap_error'. */
        readonly ERROR: "ldap.error";
        /** srv LdapConnection.php:287 (via :352-354 passthrough) — 'runtime_error'. */
        readonly RUNTIME_ERROR: "ldap.runtime_error";
    };
    /**
     * SyncPlay WebSocket domain — dotted twins. The server emit-wave has
     * landed on the wrap-site carriers: `create`/`join` now emit the twin
     * `syncplay.*_failed` code on `error_code` with the SCREAMING fallback if
     * the inner handler set no code (`Messages::error($result['error_code'] ??
     * 'CREATE_FAILED', ...)` at SyncPlayManager.php:1586,1623); the `leave`
     * carrier (SyncPlayManager.php:1652) still emits raw `LEAVE_FAILED` — its
     * inner failure paths carry no `error_code` yet. See
     * `SYNCPLAY_ERROR_CODE_TWINS` for the migration table; `error_code` channel
     * and read order are untouched. Clients localize these codes; the legacy
     * SCREAMING carriers remain pinned under `legacy` for in-flight and
     * older-server traffic.
     */
    readonly syncplay: {
        /** twin of legacy CREATE_FAILED (SyncPlayManager.php:1586) */
        readonly CREATE_FAILED: "syncplay.create_failed";
        /** twin of legacy JOIN_FAILED (SyncPlayManager.php:1623) */
        readonly JOIN_FAILED: "syncplay.join_failed";
        /** twin of legacy LEAVE_FAILED (SyncPlayManager.php:1652) */
        readonly LEAVE_FAILED: "syncplay.leave_failed";
        /** was prose 'Maximum group limit reached' inside CREATE_FAILED (:621) */
        readonly GROUP_LIMIT_REACHED: "syncplay.group_limit_reached";
        /** was prose 'Group not found' inside JOIN_FAILED (:702) */
        readonly GROUP_NOT_FOUND: "syncplay.group_not_found";
        /** was prose 'Invalid password' inside JOIN_FAILED (:741) */
        readonly INVALID_PASSWORD: "syncplay.invalid_password";
        /** was prose 'Group is full' inside JOIN_FAILED (:745) */
        readonly GROUP_FULL: "syncplay.group_full";
    };
    /**
     * Legacy SyncPlay WS codes — the VERBATIM SCREAMING_SNAKE set servers emit in
     * `error_code` today. Canonical until Wave 2; renaming breaks live clients.
     * Sources: phlix-server Session/SyncPlay/SyncPlayManager.php sendError() sites
     * and Server/WebSocket/MessageHandler.php Messages::error() sites.
     */
    readonly legacy: {
        /** SyncPlayManager.php:576 */
        readonly UNKNOWN_MESSAGE: "UNKNOWN_MESSAGE";
        /** SyncPlayManager.php:579 */
        readonly HANDLER_ERROR: "HANDLER_ERROR";
        /** SyncPlayManager.php:944 (+11) · MessageHandler.php:156 */
        readonly NOT_AUTHENTICATED: "NOT_AUTHENTICATED";
        /** SyncPlayManager.php:952 (+7) */
        readonly NOT_IN_GROUP: "NOT_IN_GROUP";
        /** SyncPlayManager.php:957 (+4) */
        readonly NOT_HOST: "NOT_HOST";
        /** SyncPlayManager.php:1278 */
        readonly INVALID_NEW_HOST: "INVALID_NEW_HOST";
        /** SyncPlayManager.php:1283 */
        readonly MEMBER_NOT_FOUND: "MEMBER_NOT_FOUND";
        /** SyncPlayManager.php:1288 */
        readonly SAME_HOST: "SAME_HOST";
        /** SyncPlayManager.php:1586 — coarse carrier, see syncplay.create_failed twin */
        readonly CREATE_FAILED: "CREATE_FAILED";
        /** SyncPlayManager.php:1623 — coarse carrier, see syncplay.join_failed twins */
        readonly JOIN_FAILED: "JOIN_FAILED";
        /** SyncPlayManager.php:1652 — coarse carrier, see syncplay.leave_failed twin */
        readonly LEAVE_FAILED: "LEAVE_FAILED";
        /** MessageHandler.php:188-191 */
        readonly PROTOCOL_VERSION_MISMATCH: "PROTOCOL_VERSION_MISMATCH";
    };
};
/** The domain namespaces of the registry. */
export type ErrorDomain = keyof typeof CODES;
/** Wire strings belonging to one domain. */
export type ErrorCodeIn<D extends ErrorDomain> = (typeof CODES)[D][keyof (typeof CODES)[D]];
/** Every wire string in the registry, as a union. */
export type ErrorCode = {
    [D in ErrorDomain]: ErrorCodeIn<D>;
}[ErrorDomain];
/** Registry domains in emission order — the order `ERROR_CODES` and the JSON mirror use. */
export declare const ERROR_DOMAINS: readonly ["auth", "hub", "claim", "server", "proxy", "quota", "stream", "access", "gateway", "relay", "mcp", "mcp_token", "alexa", "tls", "csrf", "user", "plugin", "library", "metadata", "poster", "profile", "dlna", "casting", "quickconnect", "common", "federation", "share", "invite", "request", "admin", "updates", "identity", "provider", "oauth", "ldap", "syncplay", "legacy"];
/** Per-domain code lists, in registry order. */
export declare const AUTH_ERROR_CODES: readonly AuthErrorCode[];
export declare const HUB_ERROR_CODES: readonly HubErrorCode[];
export declare const CLAIM_ERROR_CODES: readonly ClaimErrorCode[];
export declare const SERVER_ERROR_CODES: readonly ServerErrorCode[];
export declare const PROXY_ERROR_CODES: readonly ProxyErrorCode[];
export declare const QUOTA_ERROR_CODES: readonly QuotaErrorCode[];
export declare const STREAM_ERROR_CODES: readonly StreamErrorCode[];
export declare const ACCESS_ERROR_CODES: readonly AccessErrorCode[];
export declare const GATEWAY_ERROR_CODES: readonly GatewayErrorCode[];
export declare const RELAY_ERROR_CODES: readonly RelayErrorCode[];
export declare const MCP_ERROR_CODES: readonly McpErrorCode[];
export declare const MCP_TOKEN_ERROR_CODES: readonly McpTokenErrorCode[];
export declare const ALEXA_ERROR_CODES: readonly AlexaErrorCode[];
export declare const TLS_ERROR_CODES: readonly TlsErrorCode[];
export declare const CSRF_ERROR_CODES: readonly CsrfErrorCode[];
export declare const USER_ERROR_CODES: readonly UserErrorCode[];
export declare const PLUGIN_ERROR_CODES: readonly PluginErrorCode[];
export declare const LIBRARY_ERROR_CODES: readonly LibraryErrorCode[];
export declare const METADATA_ERROR_CODES: readonly MetadataErrorCode[];
export declare const POSTER_ERROR_CODES: readonly PosterErrorCode[];
export declare const PROFILE_ERROR_CODES: readonly ProfileErrorCode[];
export declare const DLNA_ERROR_CODES: readonly DlnaErrorCode[];
export declare const CASTING_ERROR_CODES: readonly CastingErrorCode[];
export declare const QUICKCONNECT_ERROR_CODES: readonly QuickConnectErrorCode[];
export declare const COMMON_ERROR_CODES: readonly CommonErrorCode[];
export declare const FEDERATION_ERROR_CODES: readonly FederationErrorCode[];
export declare const SHARE_ERROR_CODES: readonly ShareErrorCode[];
export declare const INVITE_ERROR_CODES: readonly InviteErrorCode[];
export declare const REQUEST_ERROR_CODES: readonly RequestErrorCode[];
export declare const ADMIN_ERROR_CODES: readonly AdminErrorCode[];
export declare const UPDATES_ERROR_CODES: readonly UpdatesErrorCode[];
export declare const IDENTITY_ERROR_CODES: readonly IdentityErrorCode[];
export declare const PROVIDER_ERROR_CODES: readonly ProviderErrorCode[];
export declare const OAUTH_ERROR_CODES: readonly OAuthErrorCode[];
export declare const LDAP_ERROR_CODES: readonly LdapErrorCode[];
export declare const SYNCPLAY_TWIN_ERROR_CODES: readonly SyncPlayTwinErrorCode[];
export declare const LEGACY_SYNCPLAY_ERROR_CODES: readonly LegacySyncPlayErrorCode[];
/** Every wire string, in registry declaration order. */
export declare const ERROR_CODES: readonly ErrorCode[];
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
export declare const SYNCPLAY_ERROR_CODES: readonly SyncPlayErrorCode[];
/**
 * Wave-2 migration map: each dotted twin → the coarse/legacy code it replaces
 * (or un-wraps from a prose carrier). The server emit-wave is landing; the
 * wire channel (`error_code`) and the read order never change.
 */
export declare const SYNCPLAY_ERROR_CODE_TWINS: {
    readonly 'syncplay.create_failed': "CREATE_FAILED";
    readonly 'syncplay.group_limit_reached': "CREATE_FAILED";
    readonly 'syncplay.join_failed': "JOIN_FAILED";
    readonly 'syncplay.group_not_found': "JOIN_FAILED";
    readonly 'syncplay.invalid_password': "JOIN_FAILED";
    readonly 'syncplay.group_full': "JOIN_FAILED";
    readonly 'syncplay.leave_failed': "LEAVE_FAILED";
};
export {};

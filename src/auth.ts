/**
 * Auth wire shapes + token-custody law.
 *
 * Mirrors `phlix-shared` Auth DTOs (`AuthResult`, `UserInfo`, `JwtClaims`) and
 * the server's `POST /api/v1/Auth/Login` JSON response shape consumed by the
 * windows client (`User`, `AuthResult`, `Session`).
 *
 * Note: the PHP `JwtClaims` uses camelCase `serverId` in its payload (see
 * `JwtClaims::toPayload()`), so we keep `serverId` camelCase here. The REST
 * login response uses snake_case (`session_id`), so those stay snake_case.
 *
 * Token custody is a DESIGNED, permanent bifurcation (COOKIE-DESIGN.md §2.1,
 * owner rulings CD-1a..CD-8a 2026-11-05 — CP-001 records it in types/docs;
 * ZERO wire payload and ZERO error-code change, §3): CLASS BROWSER — the SPA
 * rendered at same-origin `/app` on server or hub — authenticates with the
 * server-issued httpOnly + SameSite=Lax pair `phlix_session` (access) and
 * `phlix_refresh` (7d, rotating) and holds NO long-lived secret in
 * JavaScript. CLASS DEVICE — windows, mobile, tizen, roku, console, plugins,
 * CLI, servers-talking-to-servers — keeps bearer custody in the body +
 * `Authorization` header exactly as today. The server-side discriminator is
 * presence of `X-Phlix-Device-Type` (headers.ts — that header IS the cookie
 * opt-out signal) or a non-browser Origin/Sec-Fetch-Dest class: such requests
 * NEVER receive Set-Cookie. Cookie mode activates only over https or
 * localhost (§2.4 Secure law, CD-3a); on plain http-LAN the server issues no
 * cookies and the SPA falls back to the body-token mode below — reduced
 * custody, never silent, with `PHLIX_COOKIE_INSECURE=1` as the explicit
 * operator opt-in. During the dual-emit compat window (CD-2a: two ui majors)
 * browser-class login/refresh/logout bodies stay byte-identical to the
 * device shapes in this file; the ui simply stops reading the token fields.
 * Cross-origin cookie-authenticated state-changing requests are refused with
 * the already-registered `csrf.invalid_origin` (`ERROR_CODE.csrf`,
 * src/errors.ts) — the CSRF posture is SameSite=Lax + the shipped Origin
 * guard, not a new token system (§2.5).
 * @copyright 2026 Joe Huss <detain@interserver.net>
 */

/** A local Phlix user, as returned in the login response. */
export interface User {
  id: string;
  name: string;
  email?: string;
}

/**
 * External-provider identity, mirroring `Phlix\Shared\Auth\UserInfo`.
 * Provider claims live in `rawAttributes` (camelCase payload, per the PHP DTO).
 */
export interface UserInfo {
  externalId: string;
  email?: string | null;
  displayName?: string | null;
  avatarUrl?: string | null;
  rawAttributes?: Record<string, unknown>;
}

/**
 * Result of `POST /Auth/Login` (windows REST shape): bearer token + session id
 * + the authenticated user. This is the wire/REST AuthResult.
 *
 * Cookie Program envelope law (§3, CD-2a): device-class requests receive this
 * body and NEVER a Set-Cookie. Browser-class requests receive the SAME
 * byte-identical body (same keys, same order) during the dual-emit compat
 * window while the session also rides the httpOnly cookie pair — old bundles
 * keep working untouched; no key here is added, removed or re-typed by the
 * program. `test/cookieMode.test.ts` pins the key set and casing.
 */
export interface AuthResult {
  token: string;
  session_id: string;
  user: User;
}

/**
 * Result of an external-provider authentication attempt, mirroring
 * `Phlix\Shared\Auth\AuthResult` (camelCase). Distinct from the REST login
 * {@link AuthResult}; kept under its own name.
 */
export interface ProviderAuthResult {
  success: boolean;
  userId?: string | null;
  externalId?: string | null;
  error?: string | null;
  attributes?: Record<string, unknown>;
}

/** A device session (windows `Session`). */
export interface Session {
  id: string;
  device_id: string;
  user_id: string;
}

/**
 * Token-custody modes (COOKIE-DESIGN.md §2.1/§3 — the marker type CP-001
 * adds; no wire field is keyed by it).
 *
 * - {@link COOKIE_MODE.COOKIE}: CLASS BROWSER. The same-origin `/app` SPA
 *   rides the httpOnly + SameSite=Lax cookie pair `phlix_session` (access,
 *   1h default per TokenTtlPolicy) + `phlix_refresh` (7d, rotating);
 *   JavaScript never holds or reads a token. The ui `CookieTokenStore`
 *   reports `mode = 'cookie'` (§4.3): reads return null and writes are
 *   no-ops BY DESIGN, not as an error — the secret simply is not there.
 * - {@link COOKIE_MODE.BEARER}: CLASS DEVICE (windows, mobile, tizen, roku,
 *   console, plugins, CLI, server-to-server — device vaults where they
 *   exist: windows DPAPI, mobile Keychain, both already live) AND the
 *   browser fallback posture on plain http-LAN, where the server issues no
 *   cookies at all (§2.4, owner ruling CD-3a).
 *
 * The class is chosen per REQUEST, never per user: presence of
 * `X-Phlix-Device-Type` (headers.ts) or a non-browser Origin/Sec-Fetch-Dest
 * class forces bearer-only and suppresses Set-Cookie (§2.1 discriminator).
 * Devices cannot hold cookies (no cookie jar / cross-origin by design);
 * this split is permanent and documented, not debt.
 */
export const COOKIE_MODE = {
  /** httpOnly session-cookie custody (browser-class, same-origin /app). */
  COOKIE: 'cookie',
  /** body/header bearer custody (device-class; also the http-LAN posture). */
  BEARER: 'bearer',
} as const;
export type CookieMode = (typeof COOKIE_MODE)[keyof typeof COOKIE_MODE];

/** JWT issuer constants (mirror `JwtClaims::ISS_*`). */
export const JWT_ISS = {
  PHLIX: 'phlix',
  PHLIX_HUB: 'phlix-hub',
} as const;
export type JwtIssuer = (typeof JWT_ISS)[keyof typeof JWT_ISS];

/** JWT audience constants (mirror `JwtClaims::AUD_*`). */
export const JWT_AUD = {
  SERVER: 'server',
  HUB: 'hub',
  CLIENT: 'client',
} as const;
export type JwtAudience = (typeof JWT_AUD)[keyof typeof JWT_AUD];

/** JWT token-kind constants (mirror `JwtClaims::TYPE_*`). */
export const JWT_TYPE = {
  ACCESS: 'access',
  REFRESH: 'refresh',
} as const;
export type JwtType = (typeof JWT_TYPE)[keyof typeof JWT_TYPE];

/**
 * Decoded Phlix JWT payload, mirroring `Phlix\Shared\Auth\JwtClaims`.
 *
 * RFC 7519 required fields (`iss`, `aud`, `sub`, `iat`, `exp`, `type`) are
 * always present; `nbf`, `jti`, `scope`, `serverId` are optional and omitted
 * by the PHP `toPayload()` when null/empty.
 *
 * ⚠️ SECURITY — a *decoded* JWT is NOT a *verified* JWT. These fields describe
 * the shape of the token's payload AFTER decoding (e.g. via `jwtDecode`), which
 * performs **no** signature check. Anyone can forge a token with any `scope`,
 * `sub`, or `serverId` they like. NEVER gate access or make any authorization
 * decision on the client side from decoded claims — only the server, which
 * holds the signing key, can verify a token. Treat decoded claims here as
 * **display-only / hints** (e.g. showing the logged-in user's id, or an
 * optimistic UI affordance the server will still re-check). The authoritative
 * answer always comes from a server round-trip.
 */
export interface JwtClaims {
  iss: string;
  aud: string;
  sub: string;
  /** Issued-at, UNIX seconds. */
  iat: number;
  /** Expires-at, UNIX seconds. */
  exp: number;
  /** Not-before, UNIX seconds. Optional. */
  nbf?: number | null;
  type: string;
  /** Refresh-only token identifier. Optional. */
  jti?: string | null;
  /** Permissions list, e.g. `["library:read","playback:write"]`. */
  scope?: string[];
  /** Server UUID for hub-minted client tokens. Optional. */
  serverId?: string | null;
}

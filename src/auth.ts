/**
 * Auth wire shapes.
 *
 * Mirrors `phlix-shared` Auth DTOs (`AuthResult`, `UserInfo`, `JwtClaims`) and
 * the server's `POST /api/v1/Auth/Login` JSON response shape consumed by the
 * windows client (`User`, `AuthResult`, `Session`).
 *
 * Note: the PHP `JwtClaims` uses camelCase `serverId` in its payload (see
 * `JwtClaims::toPayload()`), so we keep `serverId` camelCase here. The REST
 * login response uses snake_case (`session_id`), so those stay snake_case.
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

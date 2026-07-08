/**
 * Hub ↔ server wire DTOs.
 *
 * Field names are the camelCase payload keys the PHP `toPayload()` emits — NOT
 * snake_case. Mirrors `phlix-shared` `Phlix\Shared\Hub\{HeartbeatDto,
 * ServerInfoDto, ClaimRequest, ClaimResponse}`.
 * @copyright 2026 Joe Huss <detain@interserver.net>
 */

/** A library entry inside a heartbeat (snake_case, per the PHP payload). */
export interface HeartbeatLibrary {
  library_id: string;
  library_name: string;
}

/**
 * Server → Hub heartbeat, sent every ~60s once enrolled.
 * Mirrors `HeartbeatDto::toPayload()`.
 */
export interface HeartbeatDto {
  /** Server UUID minted by the hub. */
  serverId: string;
  /** Current server semver. */
  version: string;
  /** UNIX seconds at heartbeat send time. */
  timestamp: number;
  /** How long the server process has been running, in seconds. */
  uptimeSeconds: number;
  /** Concurrent playback session count. */
  activeSessions: number;
  /** Concurrent transcode count. */
  activeTranscodes: number;
  /** Reachable hostnames discovered since last heartbeat. */
  hostnameCandidates: string[];
  /** Libraries on this server. */
  libraries: HeartbeatLibrary[];
}

/** Lifecycle status of an enrolled server (mirror `ServerInfoDto::STATUS_*`). */
export const SERVER_STATUS = {
  ONLINE: 'online',
  OFFLINE: 'offline',
  CLAIMING: 'claiming',
  DISABLED: 'disabled',
} as const;
export type ServerStatus = (typeof SERVER_STATUS)[keyof typeof SERVER_STATUS];

/**
 * Hub-side projection of an enrolled server, returned from
 * `GET /api/v1/users/{id}/servers`. Mirrors `ServerInfoDto::toPayload()`.
 */
export interface ServerInfoDto {
  /** UUID minted by the hub on successful claim. */
  serverId: string;
  /** Owner UUID. */
  userId: string;
  /** From the original ClaimRequest. */
  serverName: string;
  /** Server semver, refreshed on heartbeat. */
  version: string;
  /** UNIX seconds. Null when never reached out. */
  lastSeenAt: number | null;
  /** One of ServerStatus. */
  status: string;
  /** Last known reachable hostnames. */
  hostnameCandidates: string[];
  /** Whether a WSS reverse tunnel is currently open. */
  relayActive: boolean;
  /** Number of libraries last reported via heartbeat; null when none yet. */
  libraryCount: number | null;
}

/**
 * Server → Hub claim-flow start payload. Mirrors `ClaimRequest::toPayload()`.
 */
export interface ClaimRequest {
  /** Operator-chosen friendly name (e.g. "Alice's NAS"). */
  serverName: string;
  /** Server semver. */
  version: string;
  /** JWKS the server publishes for hub-minted token validation. */
  publicKeysJwk: Record<string, unknown>;
  /** Hostnames/IPs the server thinks it's reachable at. */
  hostnameCandidates: string[];
  /** Spec version — starts at "v1". */
  protocolVersion: string;
}

/**
 * Hub → Server response to a {@link ClaimRequest}. Mirrors
 * `ClaimResponse::toPayload()`.
 */
export interface ClaimResponse {
  /** Human-friendly code like "ABCD-1234" the operator pastes on the portal. */
  claimCode: string;
  /** Seconds the claim code is valid (master plan says 600). */
  expiresIn: number;
  /** UUID — opaque token the server stores so it can poll claim status. */
  claimId: string;
  /** Where the server should send heartbeats once enrolled. */
  hubBaseUrl: string;
}

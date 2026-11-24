/**
 * Hub ↔ server wire DTOs.
 *
 * Field names are the camelCase payload keys the PHP `toPayload()` emits — NOT
 * snake_case. Mirrors `phlix-shared` `Phlix\Shared\Hub\{HeartbeatDto,
 * ServerInfoDto, ClaimRequest, ClaimResponse}`.
 * @copyright 2026 Joe Huss <detain@interserver.net>
 */

import type { WireKeysExact } from './internal/wireKeys.js';

/** A library entry inside a heartbeat (snake_case, per the PHP payload). */
export interface HeartbeatLibrary {
  library_id: string;
  library_name: string;
}

/** Ordered key set of {@link HeartbeatLibrary} (S-contracts-02 / -002). */
export const HEARTBEAT_LIBRARY_KEYS = ['library_id', 'library_name'] as const;

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

/**
 * Ordered key set of {@link HeartbeatDto} (S-contracts-02 / -002) — camelCase
 * per `HeartbeatDto::toPayload()` (mirrored from `phlix-shared`).
 */
export const HEARTBEAT_DTO_KEYS = [
  'serverId',
  'version',
  'timestamp',
  'uptimeSeconds',
  'activeSessions',
  'activeTranscodes',
  'hostnameCandidates',
  'libraries',
] as const;

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

/** Ordered key set of {@link ServerInfoDto} (S-contracts-02 / -002). */
export const SERVER_INFO_DTO_KEYS = [
  'serverId',
  'userId',
  'serverName',
  'version',
  'lastSeenAt',
  'status',
  'hostnameCandidates',
  'relayActive',
  'libraryCount',
] as const;

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

/** Ordered key set of {@link ClaimRequest} (S-contracts-02 / -002). */
export const CLAIM_REQUEST_KEYS = [
  'serverName',
  'version',
  'publicKeysJwk',
  'hostnameCandidates',
  'protocolVersion',
] as const;

/**
 * Hub → Server response to a {@link ClaimRequest}. Mirrors
 * `ClaimResponse::toPayload()`.
 */
export interface ClaimResponse {
  /** Human-friendly code like "ABCD-1234" the server owner pastes into the hub web UI. */
  claimCode: string;
  /** Seconds the claim code is valid (master plan says 600). */
  expiresIn: number;
  /** UUID — opaque token the server stores so it can poll claim status. */
  claimId: string;
  /** Where the server should send heartbeats once enrolled. */
  hubBaseUrl: string;
}

/** Ordered key set of {@link ClaimResponse} (S-contracts-02 / -002). */
export const CLAIM_RESPONSE_KEYS = [
  'claimCode',
  'expiresIn',
  'claimId',
  'hubBaseUrl',
] as const;

// ---------------------------------------------------------------------------
// Compile-time ties (S-contracts-02 / -002). See `src/media.ts` for the law;
// these pin each hub DTO to its ordered key-list const.
// ---------------------------------------------------------------------------

export type HeartbeatLibraryKeysTied = WireKeysExact<HeartbeatLibrary, typeof HEARTBEAT_LIBRARY_KEYS>;
export type HeartbeatDtoKeysTied = WireKeysExact<HeartbeatDto, typeof HEARTBEAT_DTO_KEYS>;
export type ServerInfoDtoKeysTied = WireKeysExact<ServerInfoDto, typeof SERVER_INFO_DTO_KEYS>;
export type ClaimRequestKeysTied = WireKeysExact<ClaimRequest, typeof CLAIM_REQUEST_KEYS>;
export type ClaimResponseKeysTied = WireKeysExact<ClaimResponse, typeof CLAIM_RESPONSE_KEYS>;

const _heartbeatLibraryKeysTied: HeartbeatLibraryKeysTied = true;
const _heartbeatDtoKeysTied: HeartbeatDtoKeysTied = true;
const _serverInfoDtoKeysTied: ServerInfoDtoKeysTied = true;
const _claimRequestKeysTied: ClaimRequestKeysTied = true;
const _claimResponseKeysTied: ClaimResponseKeysTied = true;

/** Every hub-DTO tie, aggregated for the runtime legs of the gate. */
export const HUB_KEY_TIES = {
  heartbeatLibrary: _heartbeatLibraryKeysTied,
  heartbeat: _heartbeatDtoKeysTied,
  serverInfo: _serverInfoDtoKeysTied,
  claimRequest: _claimRequestKeysTied,
  claimResponse: _claimResponseKeysTied,
} as const;

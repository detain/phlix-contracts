/**
 * SyncPlay collaborative playback wire types.
 *
 * Mirrors what phlix-server ACTUALLY puts on the SyncPlay REST wire, per the
 * S415 authority ruling (server source, live paths only, verified at commit
 * 01340633):
 *
 *   - Full group state  — `Phlix\Session\SyncPlay\GroupState::getState()`
 *   - List rows         — `Phlix\Session\SyncPlay\SyncPlaySnapshotService::listGroups()`
 *   - REST envelopes    — `Phlix\Server\Http\Controllers\SyncPlayController`
 *
 * Server routes (all under /api/v1/syncplay, auth-grouped):
 *   GET    /api/v1/syncplay/groups              -> { groups }
 *   POST   /api/v1/syncplay/groups              -> { success, group }
 *   GET    /api/v1/syncplay/groups/{id}         -> { group }
 *   POST   /api/v1/syncplay/groups/{id}/join    -> { success, group }
 *   POST   /api/v1/syncplay/groups/{id}/leave   -> { success, message }  (POST, not DELETE)
 *   errors                                     -> { error } @400/@404
 *
 * The pre-S415 revision of this file claimed list-row vocabulary on the full
 * group and shipped seven types the server never emits (Session, User,
 * Participant, ChatMessage, Message, StateUpdate, PlaybackCommand). Those are
 * retired; the golden-vector gate (test/syncPlayShapeParity.test.ts against
 * test/fixtures/syncplay-envelope-vectors.json, dumped from the real server
 * code) keeps every key list below pinned to the wire.
 *
 * @copyright 2026 Joe Huss <detain@interserver.net>
 */

export type SyncPlayRole = 'none' | 'contributor' | 'editor' | 'owner';

export type SyncPlayPermission = 'play' | 'pause' | 'seek' | 'chat' | 'control';

/**
 * Compile-time tie: K holds exactly the keys of T in some order — a rename on
 * the interface that does not follow the const (or vice versa) is a type
 * error. (Same idiom as playback.ts; kept local so SyncPlay.ts stays
 * self-contained.)
 */
type WireKeysExact<T, K extends readonly string[]> =
  [Exclude<keyof T & string, K[number]>, Exclude<K[number], keyof T & string>] extends [never, never] ? true : false;

/**
 * A member inside a SyncPlay group state — one VALUE of the `members`
 * dictionary emitted by `GroupState::getState()`. The dictionary KEY is the
 * member id and always equals the value's `id`.
 */
export const SYNC_PLAY_MEMBER_KEYS = [
  'id',
  'name',
  'is_host',
  'joined_at',
] as const;

export interface SyncPlayMember {
  id: string;
  name: string;
  is_host: boolean;
  joined_at: number; // unix timestamp (seconds)
}

/**
 * The `members` field of a full group state is a DICTIONARY keyed by member
 * id — NOT an array. (`GroupState::getState()` builds `$membersDict[$id]`.)
 * Consumers that previously did `Array.isArray(group.members)` silently
 * dropped every member; see phlix-syncplay S416.
 */
export type SyncPlayMembersDict = Record<string, SyncPlayMember>;

/** Ordered key list of one playback-queue entry inside `SyncPlayGroup.queue`. */
export const SYNC_PLAY_QUEUE_ITEM_KEYS = [
  'media_id',
  'media_info',
  'added_at',
  'added_by',
] as const;

/**
 * One entry of the group's playback queue as emitted inside
 * `GroupState::getState()['queue']`.
 */
export interface SyncPlayQueueItem {
  media_id: string;
  media_info: Record<string, unknown>;
  added_at: number; // unix timestamp (seconds)
  added_by: string | null; // member id; null when no host had been set
}

/**
 * Full SyncPlay group state — the verbatim emission of
 * `GroupState::getState()`, carried by GET /groups/{id}, POST /groups and
 * POST /groups/{id}/join.
 *
 * S415 authority ruling: these are the EXACT twelve keys, in the EXACT order
 * the server builds them. The group's identity on this rail is `group_id`
 * (NOT `id` — `id`/`name`/`has_password`/`current_media`/`is_playing` belong
 * to list rows, see {@link SyncPlayGroupListItem}). There is NO
 * `has_password` on the state wire, and NO `current_media`/`is_playing`
 * aliases.
 *
 * - `members` — dictionary keyed by member id ({@link SyncPlayMembersDict}).
 * - `playback_state` — the server stores the string it was handed
 *   (`updatePlayback()` is unvalidated); the emitted vocabulary today is
 *   `'playing' | 'paused' | 'buffering' | 'stopped'` with `'stopped'` the
 *   initial state.
 * - `playback_position` / `current_media_duration` — milliseconds.
 */
export const SYNC_PLAY_GROUP_KEYS = [
  'group_id',
  'group_name',
  'member_count',
  'members',
  'host_id',
  'current_media_id',
  'current_media_duration',
  'playback_position',
  'playback_state',
  'queue',
  'created_at',
  'last_activity_at',
] as const;

export interface SyncPlayGroup {
  group_id: string;
  group_name: string;
  member_count: number;
  members: SyncPlayMembersDict;
  host_id: string | null;
  current_media_id: string | null;
  current_media_duration: number; // ms
  playback_position: number; // ms
  playback_state: string;
  queue: SyncPlayQueueItem[];
  created_at: number; // unix timestamp (seconds)
  last_activity_at: number; // unix timestamp (seconds)
}

/**
 * A SyncPlay group — the server route is /syncplay/groups.
 * Lightweight summary row returned inside the GET /groups list envelope
 * (`SyncPlaySnapshotService::listGroups()`).
 *
 * S415 authority ruling: this list-row vocabulary (`id`, `name`,
 * `has_password`, `current_media`, `is_playing`) is REAL but belongs to LIST
 * ROWS ONLY — the full group state spells the same facts differently
 * (`group_id`, `group_name`, no password field, `current_media_id`,
 * `playback_state`).
 */
export const SYNC_PLAY_GROUP_LIST_ITEM_KEYS = [
  'id',
  'name',
  'member_count',
  'has_password',
  'current_media',
  'is_playing',
] as const;

export interface SyncPlayGroupListItem {
  id: string;
  name: string;
  member_count: number;
  has_password: boolean;
  current_media: string | null;
  is_playing: boolean;
}

/** @deprecated Use SyncPlayGroup. The server route is /syncplay/groups. */
export type SyncPlayRoom = SyncPlayGroup;

/**
 * `GET /api/v1/syncplay/groups` — the list envelope. Every element is a
 * LIST ROW ({@link SyncPlayGroupListItem}), not a group state.
 */
export const SYNC_PLAY_LIST_GROUPS_RESPONSE_KEYS = ['groups'] as const;

export interface SyncPlayListGroupsResponse {
  groups: SyncPlayGroupListItem[];
}

/**
 * `POST /api/v1/syncplay/groups` — create. `group` is the full state
 * ({@link SyncPlayGroup}).
 */
export const SYNC_PLAY_CREATE_GROUP_RESPONSE_KEYS = ['success', 'group'] as const;

export interface SyncPlayCreateGroupResponse {
  success: true;
  group: SyncPlayGroup;
}

/**
 * `GET /api/v1/syncplay/groups/{id}` — single group read. NO `success` key
 * on this rail; the group rides alone.
 */
export const SYNC_PLAY_GET_GROUP_RESPONSE_KEYS = ['group'] as const;

export interface SyncPlayGetGroupResponse {
  group: SyncPlayGroup;
}

/**
 * `POST /api/v1/syncplay/groups/{id}/join` — same envelope as create:
 * `{ success, group }` with the full state.
 */
export const SYNC_PLAY_JOIN_GROUP_RESPONSE_KEYS = ['success', 'group'] as const;

export interface SyncPlayJoinGroupResponse {
  success: true;
  group: SyncPlayGroup;
}

/**
 * `POST /api/v1/syncplay/groups/{id}/leave` — `{ success, message }`.
 * `message` is ALWAYS PRESENT on the wire and NULLABLE (the controller
 * emits `$result['message'] ?? null`; the no-group branch returns no
 * message).
 */
export const SYNC_PLAY_LEAVE_GROUP_RESPONSE_KEYS = ['success', 'message'] as const;

export interface SyncPlayLeaveGroupResponse {
  success: true;
  message: string | null;
}

/** Every SyncPlay error arm (@400 and @404) is the single-key `{ error }` body. */
export const SYNC_PLAY_ERROR_RESPONSE_KEYS = ['error'] as const;

export interface SyncPlayErrorResponse {
  error: string;
}

// Compile-time ties: each interface and its ordered key const must contain
// exactly the same names, in both directions. `tsc --noEmit` reddens on drift.
export type SyncPlayMemberKeysTied = WireKeysExact<SyncPlayMember, typeof SYNC_PLAY_MEMBER_KEYS>;
export type SyncPlayQueueItemKeysTied = WireKeysExact<SyncPlayQueueItem, typeof SYNC_PLAY_QUEUE_ITEM_KEYS>;
export type SyncPlayGroupKeysTied = WireKeysExact<SyncPlayGroup, typeof SYNC_PLAY_GROUP_KEYS>;
export type SyncPlayGroupListItemKeysTied = WireKeysExact<SyncPlayGroupListItem, typeof SYNC_PLAY_GROUP_LIST_ITEM_KEYS>;
export type SyncPlayListGroupsResponseKeysTied = WireKeysExact<SyncPlayListGroupsResponse, typeof SYNC_PLAY_LIST_GROUPS_RESPONSE_KEYS>;
export type SyncPlayCreateGroupResponseKeysTied = WireKeysExact<SyncPlayCreateGroupResponse, typeof SYNC_PLAY_CREATE_GROUP_RESPONSE_KEYS>;
export type SyncPlayGetGroupResponseKeysTied = WireKeysExact<SyncPlayGetGroupResponse, typeof SYNC_PLAY_GET_GROUP_RESPONSE_KEYS>;
export type SyncPlayJoinGroupResponseKeysTied = WireKeysExact<SyncPlayJoinGroupResponse, typeof SYNC_PLAY_JOIN_GROUP_RESPONSE_KEYS>;
export type SyncPlayLeaveGroupResponseKeysTied = WireKeysExact<SyncPlayLeaveGroupResponse, typeof SYNC_PLAY_LEAVE_GROUP_RESPONSE_KEYS>;
export type SyncPlayErrorResponseKeysTied = WireKeysExact<SyncPlayErrorResponse, typeof SYNC_PLAY_ERROR_RESPONSE_KEYS>;

const _memberKeysTied: SyncPlayMemberKeysTied = true;
const _queueItemKeysTied: SyncPlayQueueItemKeysTied = true;
const _groupKeysTied: SyncPlayGroupKeysTied = true;
const _groupListItemKeysTied: SyncPlayGroupListItemKeysTied = true;
const _listGroupsResponseKeysTied: SyncPlayListGroupsResponseKeysTied = true;
const _createGroupResponseKeysTied: SyncPlayCreateGroupResponseKeysTied = true;
const _getGroupResponseKeysTied: SyncPlayGetGroupResponseKeysTied = true;
const _joinGroupResponseKeysTied: SyncPlayJoinGroupResponseKeysTied = true;
const _leaveGroupResponseKeysTied: SyncPlayLeaveGroupResponseKeysTied = true;
const _errorResponseKeysTied: SyncPlayErrorResponseKeysTied = true;

export const SYNC_PLAY_KEY_TIES = {
  member: _memberKeysTied,
  queueItem: _queueItemKeysTied,
  group: _groupKeysTied,
  groupListItem: _groupListItemKeysTied,
  listGroupsResponse: _listGroupsResponseKeysTied,
  createGroupResponse: _createGroupResponseKeysTied,
  getGroupResponse: _getGroupResponseKeysTied,
  joinGroupResponse: _joinGroupResponseKeysTied,
  leaveGroupResponse: _leaveGroupResponseKeysTied,
  errorResponse: _errorResponseKeysTied,
} as const;

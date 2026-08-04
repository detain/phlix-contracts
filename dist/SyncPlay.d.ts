/**
 * SyncPlay collaborative playback wire types.
 *
 * Mirrors server-side SyncPlay session/group DTOs for coordinated
 * multi-user playback with roles, permissions, and chat.
 *
 * Server routes (all under /api/v1/syncplay):
 *   GET    /api/v1/syncplay/groups
 *   POST   /api/v1/syncplay/groups
 *   GET    /api/v1/syncplay/groups/{id}
 *   POST   /api/v1/syncplay/groups/{id}/join
 *   POST   /api/v1/syncplay/groups/{id}/leave     <- POST, not DELETE
 *
 * @copyright 2026 Joe Huss <detain@interserver.net>
 */
export type SyncPlayRole = 'none' | 'contributor' | 'editor' | 'owner';
export type SyncPlayPermission = 'play' | 'pause' | 'seek' | 'chat' | 'control';
export interface SyncPlaySession {
    id: string;
    roomId: string;
    serverId: string;
    createdBy: string;
    createdAt: string;
    state: 'waiting' | 'playing' | 'paused' | 'ended';
    playbackPosition: number;
    playbackRate: number;
    serverTime: number;
    lastSync: string;
    activeUsers: SyncPlayUser[];
    roles: Record<string, SyncPlayRole>;
    permissions: Record<string, SyncPlayPermission[]>;
}
export interface SyncPlayUser {
    id: string;
    name: string;
    profileId: number;
    role: SyncPlayRole;
    isOnline: boolean;
    lastSeen: string;
}
/**
 * A SyncPlay group — the server route is /syncplay/groups.
 * Lightweight summary shape returned by GET /groups (list).
 */
export interface SyncPlayGroupListItem {
    id: string;
    name: string;
    member_count: number;
    has_password: boolean;
    current_media: string | null;
    is_playing: boolean;
}
/**
 * Full SyncPlay group state returned by GET /groups/{id}, join, and leave.
 * Contains all sync state including members, playback position, queue, etc.
 */
export interface SyncPlayGroup extends SyncPlayGroupListItem {
    members: SyncPlayMember[];
    host_id: string;
    current_media_id: string | null;
    current_media_duration: number | null;
    playback_position: number;
    playback_state: string;
    queue: unknown[];
    created_at: number;
    last_activity_at: number;
}
/**
 * A member within a SyncPlay group.
 */
export interface SyncPlayMember {
    id: string;
    name: string;
    is_host: boolean;
    joined_at: number;
}
/** @deprecated Use SyncPlayGroup. The server route is /syncplay/groups. */
export type SyncPlayRoom = SyncPlayGroup;
export interface SyncPlayChatMessage {
    id: string;
    group_id: string;
    user_id: string;
    user_name: string;
    content: string;
    timestamp: string;
}
/**
 * A participant in a SyncPlay group, including sync state and latency.
 */
export interface SyncPlayParticipant {
    user_id: string;
    username: string;
    role: SyncPlayRole;
    is_synced: boolean;
    last_position: number;
    latency: number;
}
/**
 * A SyncPlay wire protocol message for playback synchronization.
 * Carried over the signal channel (WebSocket / SSE) to synchronize
 * play / pause / seek / sync events across all participants.
 */
export interface SyncPlayMessage {
    type: 'play' | 'pause' | 'seek' | 'sync';
    timestamp: string;
    position: number;
    group_id: string;
}
export interface SyncPlayStateUpdate {
    session_id: string;
    playback_position: number;
    playback_rate: number;
    server_time: number;
    timestamp: string;
}
export interface SyncPlayPlaybackCommand {
    type: 'play' | 'pause' | 'seek' | 'sync';
    position?: number;
    rate?: number;
    issued_by: string;
    issued_at: string;
}

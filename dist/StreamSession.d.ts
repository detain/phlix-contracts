/**
 * Stream-session wire shapes for concurrent-stream management.
 *
 * Mirrors the server-side DTOs the `StreamLimitController` embeds verbatim:
 * `Phlix\Access\ProfileStreamLimit::toArray()` as `{ stream_limits }` and the
 * row maps built by `Phlix\Access\StreamSessionService::
 * getActiveStreamsForProfile()` as `{ active_streams, count }`, on
 * `GET/PUT /api/v1/[admin/]profiles/{profileId}/stream-limits` and
 * `GET /api/v1/[admin/]profiles/{profileId}/active-streams`.
 *
 * LW-065 (estate review contracts__srphp #8 [Info]): this mirror was never
 * pinned to the wire. The pre-cure declaration claimed camelCase members, a
 * NUMERIC `profileId`, ISO-8601 `startedAt`, and omitted `last_heartbeat_at`
 * entirely. The executed dump `test/fixtures/stream-session-vectors.json`
 * (scripts/dump-server-stream-session-vectors.php, server `a63dc0db`) is the
 * authority: snake_case members, UUID-string `profile_id`, MySQL DATETIME
 * (`YYYY-MM-DD HH:MM:SS`) stamps passed through from the DB client, and an
 * int `id`. Pinned by `test/streamSessionShapeParity.test.ts`.
 *
 * @copyright 2026 Joe Huss <detain@interserver.net>
 */
import type { WireKeysExact } from './internal/wireKeys';
/**
 * Ordered wire keys of {@link ProfileStreamLimit} — exported so the parity
 * test can compare them, EXACTLY and in order, against the executed server
 * emission. Keep in lockstep with the interface (the type-level tie below is
 * a compile error if they diverge).
 */
export declare const PROFILE_STREAM_LIMIT_KEYS: readonly ["profile_id", "max_concurrent_streams", "max_total_bandwidth_kbps"];
/**
 * Stream concurrency and bandwidth limits for a profile — the exact
 * `ProfileStreamLimit::toArray()` shape the wire carries.
 *
 * `profile_id` is the profile's UUID STRING (char(36) column; the old
 * `profileId: number` claim matched no server emission). `max_total_bandwidth_kbps`
 * is `null` when no bandwidth cap is enforced — and the KEY is always present.
 * A profile with no explicit limit row falls back to the shipped default
 * (`max_concurrent_streams: 1`, null bandwidth), verified in the dump.
 */
export interface ProfileStreamLimit {
    profile_id: string;
    /** Maximum concurrent streams allowed for this profile. */
    max_concurrent_streams: number;
    /** Cap on total bandwidth in kbps, or `null` for unlimited. */
    max_total_bandwidth_kbps: number | null;
}
/** How a stream is being delivered — the `active_streams.stream_type` ENUM. */
export type StreamType = 'direct' | 'transcode' | 'relay';
/**
 * Ordered wire keys of {@link ActiveStream} — see
 * {@link PROFILE_STREAM_LIMIT_KEYS} for the tie discipline.
 */
export declare const ACTIVE_STREAM_KEYS: readonly ["id", "profile_id", "device_id", "session_id", "started_at", "last_heartbeat_at", "stream_type"];
/**
 * A currently-active streaming session belonging to a profile — one row of
 * `getActiveStreamsForProfile()` (SELECT * FROM active_streams ORDER BY
 * started_at DESC, mapped key-by-key server-side).
 *
 * Datetime members are MySQL DATETIME strings (`YYYY-MM-DD HH:MM:SS`) passed
 * through by the server's DB client — NOT ISO-8601 (the old mirror's claim).
 * `last_heartbeat_at` was simply MISSING before LW-065. Rows are profile-
 * scoped server-side; `id` is the table's AUTO_INCREMENT key (int).
 */
export interface ActiveStream {
    id: number;
    profile_id: string;
    /** Client-side device identifier. */
    device_id: string;
    /** Server-assigned unique stream session id. */
    session_id: string;
    /** MySQL DATETIME (`YYYY-MM-DD HH:MM:SS`) when the stream started. */
    started_at: string;
    /** MySQL DATETIME of the last heartbeat refresh. */
    last_heartbeat_at: string;
    /** How the stream is being delivered. */
    stream_type: StreamType;
}
/** Compile-time ties between the interfaces and their ordered key-list consts. */
export type ProfileStreamLimitKeysTied = WireKeysExact<ProfileStreamLimit, typeof PROFILE_STREAM_LIMIT_KEYS>;
export type ActiveStreamKeysTied = WireKeysExact<ActiveStream, typeof ACTIVE_STREAM_KEYS>;
export declare const STREAM_SESSION_KEY_TIES: {
    readonly profileStreamLimit: true;
    readonly activeStream: true;
};

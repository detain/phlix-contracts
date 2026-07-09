/**
 * Stream-session wire shapes for concurrent-stream management.
 *
 * Mirrors server-side `ProfileStreamLimit` and `ActiveStream` DTOs used
 * to track how many simultaneous streams a profile is running and what
 * device each stream originates from.
 *
 * @copyright 2026 Joe Huss <detain@interserver.net>
 */
/**
 * Stream concurrency and bandwidth limits for a profile.
 * `maxTotalBandwidthKbps` is `null` when no bandwidth cap is enforced.
 */
export interface ProfileStreamLimit {
    profileId: number;
    /** Maximum concurrent streams allowed for this profile. */
    maxConcurrentStreams: number;
    /** Cap on total bandwidth in kbps, or `null` for unlimited. */
    maxTotalBandwidthKbps: number | null;
}
/** The delivery mechanism of an active stream. */
export type StreamType = 'direct' | 'transcode' | 'relay';
/**
 * A currently-active streaming session belonging to a profile.
 * `sessionId` is the server-assigned unique stream identifier.
 */
export interface ActiveStream {
    id: number;
    profileId: number;
    /** Client-side device identifier. */
    deviceId: string;
    /** Server-assigned unique stream session id. */
    sessionId: string;
    /** How the stream is being delivered. */
    streamType: StreamType;
    /** ISO-8601 datetime when the stream started. */
    startedAt: string;
}

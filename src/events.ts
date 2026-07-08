/**
 * Event payload interfaces + name constants.
 *
 * Two distinct event vocabularies live here, matching `phlix-shared`:
 *
 *  1. PSR-14 plugin events (`Phlix\Shared\Events\**`) — in-process events with
 *     a `phlix.*` "manifest alias". Their payloads are the constructor props of
 *     the PHP event classes (camelCase). Every concrete event also carries a
 *     `timestamp` (UNIX seconds) from `AbstractEvent`.
 *  2. Webhook event types (`phlix-shared/schemas/webhook-events.json`) — the
 *     dotted vocabulary a webhook subscription may select. DISTINCT from the
 *     plugin aliases.
 * @copyright 2026 Joe Huss <detain@interserver.net>
 */

/** Common base every PSR-14 event carries (`AbstractEvent::$timestamp`). */
export interface PhlixEvent {
  /** UNIX seconds at event construction time. */
  timestamp: number;
}

// ---- Playback events ----

export interface PlaybackStartedEvent extends PhlixEvent {
  sessionId: string;
  userId: string;
  mediaItemId: string;
  deviceId: string;
  /** Initial playback position in 100-ns ticks. */
  positionTicks: number;
}

export interface PlaybackPausedEvent extends PhlixEvent {
  sessionId: string;
  userId: string;
  mediaItemId: string;
  deviceId: string;
  positionTicks: number;
}

export interface PlaybackResumedEvent extends PhlixEvent {
  sessionId: string;
  userId: string;
  mediaItemId: string;
  deviceId: string;
  positionTicks: number;
}

export interface PlaybackStoppedEvent extends PhlixEvent {
  sessionId: string;
  userId: string;
  mediaItemId: string;
  deviceId: string;
  /** Final playback position in 100-ns ticks. */
  finalPositionTicks: number;
  /** True when the item should be treated as fully watched. */
  reachedEnd: boolean;
}

// ---- Library events ----

export interface LibraryScanStartedEvent extends PhlixEvent {
  libraryId: string;
  libraryName: string;
  path: string;
}

export interface LibraryScanCompletedEvent extends PhlixEvent {
  libraryId: string;
  itemsAdded: number;
  itemsUpdated: number;
  itemsRemoved: number;
  /** Wall-clock scan duration in milliseconds. */
  durationMs: number;
}

export interface MediaItemAddedEvent extends PhlixEvent {
  mediaItemId: string;
  libraryId: string;
  path: string;
  type: string;
}

export interface MediaItemUpdatedEvent extends PhlixEvent {
  mediaItemId: string;
  /** Ordered list of changed column/field names. */
  changedFields: string[];
}

export interface MediaItemRemovedEvent extends PhlixEvent {
  mediaItemId: string;
  libraryId: string;
}

// ---- Auth events ----

export interface UserCreatedEvent extends PhlixEvent {
  userId: string;
  username: string;
  email: string;
}

export interface UserLoggedInEvent extends PhlixEvent {
  userId: string;
  sessionId: string;
  /** Client IP, "" when unavailable. */
  ipAddress: string;
  /** Raw User-Agent, "" when unavailable. */
  userAgent: string;
}

export interface UserLoggedOutEvent extends PhlixEvent {
  userId: string;
  sessionId: string;
  reason: string;
}

/**
 * PSR-14 plugin event "manifest aliases" — the `phlix.*` names plugins
 * subscribe to. Mirrors the `Manifest alias` of each `Phlix\Shared\Events\**`
 * class.
 */
export const PLUGIN_EVENT = {
  PLAYBACK_STARTED: 'phlix.playback.started',
  PLAYBACK_PAUSED: 'phlix.playback.paused',
  PLAYBACK_RESUMED: 'phlix.playback.resumed',
  PLAYBACK_STOPPED: 'phlix.playback.stopped',
  LIBRARY_SCAN_STARTED: 'phlix.library.scan.started',
  LIBRARY_SCAN_COMPLETED: 'phlix.library.scan.completed',
  LIBRARY_ITEM_ADDED: 'phlix.library.item.added',
  LIBRARY_ITEM_UPDATED: 'phlix.library.item.updated',
  LIBRARY_ITEM_REMOVED: 'phlix.library.item.removed',
  USER_CREATED: 'phlix.user.created',
  USER_LOGGED_IN: 'phlix.user.logged_in',
  USER_LOGGED_OUT: 'phlix.user.logged_out',
} as const;
export type PluginEventName = (typeof PLUGIN_EVENT)[keyof typeof PLUGIN_EVENT];

/**
 * Webhook event types a subscription may select. Mirrors the `events[]` of
 * `phlix-shared/schemas/webhook-events.json`. DISTINCT from {@link PLUGIN_EVENT}.
 */
export const WEBHOOK_EVENT = {
  PLAYBACK_STARTED: 'playback.started',
  PLAYBACK_ENDED: 'playback.ended',
  LIBRARY_UPDATED: 'library.updated',
  DOWNLOAD_COMPLETE: 'download.complete',
  RECORDING_STARTED: 'recording.started',
  RECORDING_STOPPED: 'recording.stopped',
  ALERT: 'alert',
} as const;
export type WebhookEventType = (typeof WEBHOOK_EVENT)[keyof typeof WEBHOOK_EVENT];

/**
 * Reserved internal webhook event, fired only by the admin "Test webhook"
 * action; not user-subscribable.
 */
export const WEBHOOK_EVENT_RESERVED = {
  TEST: 'webhook.test',
} as const;

/**
 * The aggregate constants object spec requires (the single `EVENT` export
 * grouping plugin + webhook vocabularies).
 */
export const EVENT = {
  plugin: PLUGIN_EVENT,
  webhook: WEBHOOK_EVENT,
  webhookReserved: WEBHOOK_EVENT_RESERVED,
} as const;

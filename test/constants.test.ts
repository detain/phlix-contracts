/**
 * constants.test — completeness + schema-parity pins for the vocabulary consts.
 *
 * Two laws live here (S-contracts-07 / phlix-contracts-008, -009):
 *
 *  1. EXHAUSTIVE PINS. The per-member membership asserts restate wire values
 *     one key at a time; alone they cannot see a key ADDED or DROPPED (the
 *     WEBHOOK_EVENT.MEDIA_ADDED alias rode entirely unasserted). Every const
 *     object exercised by this file is now additionally pinned to its exact
 *     ordered key list, exact ordered value list, length, and value
 *     uniqueness — a hand-edit in any direction reddens this file.
 *  2. EXECUTABLE PARITY. `src/events.ts` names `phlix-shared/schemas/
 *     webhook-events.json` as the authority for `WEBHOOK_EVENT`, but the
 *     membership asserts were self-referential (the mirror checked against
 *     same-file literals). The schema bytes are therefore vendored here under
 *     test/fixtures/ — the sanctioned interim pattern, phlix-ui's
 *     webhooks.test.ts precedent — md5-frozen, and compared as SET EQUALITY
 *     against the mirror, so drift against the authority is a test signal.
 *
 * @copyright 2026 Joe Huss <detain@interserver.net>
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { PLUGIN_EVENT, WEBHOOK_EVENT, WEBHOOK_EVENT_RESERVED, EVENT } from '../src/events';
import { JWT_ISS, JWT_AUD, JWT_TYPE } from '../src/auth';
import { SERVER_STATUS } from '../src/hub';

// ── vendored webhook-events schema (S-contracts-07 / phlix-contracts-009) ───
//
// Byte-identical copy of phlix-shared `schemas/webhook-events.json`, vendored
// from shared commit 9cc4083e1c898cac36a071a43a454e22c524df52 (generatedAt
// stamp 2026-11-24 — the S-contracts-08 widening to the full 10-event
// vocabulary that the server's WebhookEventCatalog had carried all along).
// Rotation ritual, never re-typing: re-copy the bytes from the shared repo,
// update SCHEMA_MD5 below, and let the set-equality law force src/events.ts
// to keep pace (or the mirror to lead, honestly labelled).

const SCHEMA_FILE = resolve(__dirname, 'fixtures', 'webhook-events.json');
const SCHEMA_MD5 = 'bf4911b60f5e21fb2389e484e629ca71';

interface SchemaEvent {
  type: string;
  group: string;
  label: string;
  description: string;
}

interface SchemaReserved {
  type: string;
  internal?: boolean;
  description: string;
}

const schemaBytes = readFileSync(SCHEMA_FILE);
const schema = JSON.parse(schemaBytes.toString('utf8')) as {
  events: SchemaEvent[];
  reserved: SchemaReserved[];
};

/**
 * The single documented departure of the mirror from the schema: the retained
 * legacy alias (`src/events.ts` docblock — the server normalizes it to
 * `library.updated` via WebhookEventCatalog::LEGACY_ALIASES). Exactly one,
 * named here; any second non-schema value in WEBHOOK_EVENT reddens parity.
 */
const LEGACY_ALIASES = ['media.added'];

/**
 * Pin a string-valued const object to its exact shape: ordered key names,
 * length, ordered values, and no duplicate values.
 */
function expectExactTable(
  label: string,
  actualKeys: string[],
  actualValues: string[],
  keys: readonly string[],
  values: readonly string[],
): void {
  expect(actualKeys, `${label}: exact key list (names, order, length)`).toEqual([...keys]);
  expect(actualKeys, `${label}: length`).toHaveLength(keys.length);
  expect(actualValues, `${label}: exact value list (order, length)`).toEqual([...values]);
  expect(new Set(actualValues).size, `${label}: no duplicate values`).toBe(values.length);
}

describe('plugin event aliases', () => {
  it('match the phlix.* manifest aliases', () => {
    expect(PLUGIN_EVENT.PLAYBACK_STARTED).toBe('phlix.playback.started');
    expect(PLUGIN_EVENT.PLAYBACK_PAUSED).toBe('phlix.playback.paused');
    expect(PLUGIN_EVENT.PLAYBACK_RESUMED).toBe('phlix.playback.resumed');
    expect(PLUGIN_EVENT.PLAYBACK_STOPPED).toBe('phlix.playback.stopped');
    expect(PLUGIN_EVENT.LIBRARY_SCAN_STARTED).toBe('phlix.library.scan.started');
    expect(PLUGIN_EVENT.LIBRARY_SCAN_COMPLETED).toBe('phlix.library.scan.completed');
    expect(PLUGIN_EVENT.LIBRARY_ITEM_ADDED).toBe('phlix.library.item.added');
    expect(PLUGIN_EVENT.LIBRARY_ITEM_UPDATED).toBe('phlix.library.item.updated');
    expect(PLUGIN_EVENT.LIBRARY_ITEM_REMOVED).toBe('phlix.library.item.removed');
    expect(PLUGIN_EVENT.USER_CREATED).toBe('phlix.user.created');
    expect(PLUGIN_EVENT.USER_LOGGED_IN).toBe('phlix.user.logged_in');
    expect(PLUGIN_EVENT.USER_LOGGED_OUT).toBe('phlix.user.logged_out');
  });
});

describe('webhook event types', () => {
  it('match the webhook-events.json catalog', () => {
    expect(WEBHOOK_EVENT.PLAYBACK_STARTED).toBe('playback.started');
    expect(WEBHOOK_EVENT.PLAYBACK_ENDED).toBe('playback.ended');
    expect(WEBHOOK_EVENT.LIBRARY_UPDATED).toBe('library.updated');
    expect(WEBHOOK_EVENT.DOWNLOAD_COMPLETE).toBe('download.complete');
    expect(WEBHOOK_EVENT.RECORDING_STARTED).toBe('recording.started');
    expect(WEBHOOK_EVENT.RECORDING_STOPPED).toBe('recording.stopped');
    // phlix-contracts-008: this 8th value rode entirely unasserted until the
    // completeness era; kept explicit here for the legacy-alias doctrine.
    expect(WEBHOOK_EVENT.MEDIA_ADDED).toBe('media.added');
    expect(WEBHOOK_EVENT.ALERT).toBe('alert');
    expect(WEBHOOK_EVENT.USER_LOGIN).toBe('user.login');
    expect(WEBHOOK_EVENT.USER_LOGOUT).toBe('user.logout');
    expect(WEBHOOK_EVENT.USER_CREATED).toBe('user.created');
    expect(WEBHOOK_EVENT_RESERVED.TEST).toBe('webhook.test');
  });

  it('groups both vocabularies under EVENT', () => {
    expect(EVENT.plugin).toBe(PLUGIN_EVENT);
    expect(EVENT.webhook).toBe(WEBHOOK_EVENT);
    expect(EVENT.webhookReserved).toBe(WEBHOOK_EVENT_RESERVED);
  });
});

describe('jwt + server-status constants', () => {
  it('match the PHP DTO constants', () => {
    expect(JWT_ISS.PHLIX).toBe('phlix');
    expect(JWT_ISS.PHLIX_HUB).toBe('phlix-hub');
    expect(JWT_AUD.SERVER).toBe('server');
    expect(JWT_AUD.HUB).toBe('hub');
    expect(JWT_AUD.CLIENT).toBe('client');
    expect(JWT_TYPE.ACCESS).toBe('access');
    expect(JWT_TYPE.REFRESH).toBe('refresh');
    expect(SERVER_STATUS.ONLINE).toBe('online');
    expect(SERVER_STATUS.OFFLINE).toBe('offline');
    expect(SERVER_STATUS.CLAIMING).toBe('claiming');
    expect(SERVER_STATUS.DISABLED).toBe('disabled');
  });
});

describe('completeness pins — exact key sets + lengths (S-contracts-07 / phlix-contracts-008)', () => {
  it('PLUGIN_EVENT carries exactly its 12 keys and 12 aliases', () => {
    expectExactTable(
      'PLUGIN_EVENT',
      Object.keys(PLUGIN_EVENT),
      Object.values(PLUGIN_EVENT),
      [
        'PLAYBACK_STARTED',
        'PLAYBACK_PAUSED',
        'PLAYBACK_RESUMED',
        'PLAYBACK_STOPPED',
        'LIBRARY_SCAN_STARTED',
        'LIBRARY_SCAN_COMPLETED',
        'LIBRARY_ITEM_ADDED',
        'LIBRARY_ITEM_UPDATED',
        'LIBRARY_ITEM_REMOVED',
        'USER_CREATED',
        'USER_LOGGED_IN',
        'USER_LOGGED_OUT',
      ],
      [
        'phlix.playback.started',
        'phlix.playback.paused',
        'phlix.playback.resumed',
        'phlix.playback.stopped',
        'phlix.library.scan.started',
        'phlix.library.scan.completed',
        'phlix.library.item.added',
        'phlix.library.item.updated',
        'phlix.library.item.removed',
        'phlix.user.created',
        'phlix.user.logged_in',
        'phlix.user.logged_out',
      ],
    );
  });

  it('WEBHOOK_EVENT carries exactly its 11 keys and 11 dotted types (schema 10 + the legacy alias)', () => {
    expectExactTable(
      'WEBHOOK_EVENT',
      Object.keys(WEBHOOK_EVENT),
      Object.values(WEBHOOK_EVENT),
      [
        'PLAYBACK_STARTED',
        'PLAYBACK_ENDED',
        'LIBRARY_UPDATED',
        'DOWNLOAD_COMPLETE',
        'RECORDING_STARTED',
        'RECORDING_STOPPED',
        'MEDIA_ADDED',
        'ALERT',
        'USER_LOGIN',
        'USER_LOGOUT',
        'USER_CREATED',
      ],
      [
        'playback.started',
        'playback.ended',
        'library.updated',
        'download.complete',
        'recording.started',
        'recording.stopped',
        'media.added',
        'alert',
        'user.login',
        'user.logout',
        'user.created',
      ],
    );
  });

  it('WEBHOOK_EVENT_RESERVED carries exactly its 1 key', () => {
    expectExactTable(
      'WEBHOOK_EVENT_RESERVED',
      Object.keys(WEBHOOK_EVENT_RESERVED),
      Object.values(WEBHOOK_EVENT_RESERVED),
      ['TEST'],
      ['webhook.test'],
    );
  });

  it('JWT_ISS carries exactly its 2 issuers', () => {
    expectExactTable(
      'JWT_ISS',
      Object.keys(JWT_ISS),
      Object.values(JWT_ISS),
      ['PHLIX', 'PHLIX_HUB'],
      ['phlix', 'phlix-hub'],
    );
  });

  it('JWT_AUD carries exactly its 3 audiences', () => {
    expectExactTable(
      'JWT_AUD',
      Object.keys(JWT_AUD),
      Object.values(JWT_AUD),
      ['SERVER', 'HUB', 'CLIENT'],
      ['server', 'hub', 'client'],
    );
  });

  it('JWT_TYPE carries exactly its 2 token kinds', () => {
    expectExactTable(
      'JWT_TYPE',
      Object.keys(JWT_TYPE),
      Object.values(JWT_TYPE),
      ['ACCESS', 'REFRESH'],
      ['access', 'refresh'],
    );
  });

  it('SERVER_STATUS carries exactly its 4 statuses', () => {
    expectExactTable(
      'SERVER_STATUS',
      Object.keys(SERVER_STATUS),
      Object.values(SERVER_STATUS),
      ['ONLINE', 'OFFLINE', 'CLAIMING', 'DISABLED'],
      ['online', 'offline', 'claiming', 'disabled'],
    );
  });

  it('EVENT groups exactly the three vocabularies', () => {
    expect(Object.keys(EVENT), 'EVENT: exact key list').toEqual(['plugin', 'webhook', 'webhookReserved']);
    expect(Object.keys(EVENT), 'EVENT: length').toHaveLength(3);
  });
});

describe('webhook-events schema parity (S-contracts-07 / phlix-contracts-009)', () => {
  it('the vendored fixture is byte-frozen at the pinned md5', () => {
    expect(
      createHash('md5').update(schemaBytes).digest('hex'),
      'test/fixtures/webhook-events.json drifted from the vendored bytes — re-vendor and rotate SCHEMA_MD5, never re-type',
    ).toBe(SCHEMA_MD5);
  });

  it('WEBHOOK_EVENT values equal the schema vocabulary plus the single documented legacy alias', () => {
    const schemaTypes = schema.events.map((e) => e.type);
    // Schema-side: every schema event must be carried by the mirror. The
    // length floor is anti-vacuity (ui precedent): an empty/partial schema
    // array cannot silently satisfy the loop.
    expect(schemaTypes).toHaveLength(10);
    const constValues = new Set<string>(Object.values(WEBHOOK_EVENT));
    for (const type of schemaTypes) {
      expect(constValues.has(type), `WEBHOOK_EVENT is missing schema event ${type}`).toBe(true);
    }
    // Mirror-side: the ONLY non-schema value the mirror may carry is the
    // documented legacy alias — an undeclared addition reddens here.
    expect(Object.values(WEBHOOK_EVENT).filter((v) => !schemaTypes.includes(v))).toEqual(LEGACY_ALIASES);
    // Both directions at once.
    expect(new Set<string>([...schemaTypes, ...LEGACY_ALIASES])).toEqual(constValues);
  });

  it('WEBHOOK_EVENT_RESERVED mirrors schema.reserved exactly', () => {
    expect(Object.values(WEBHOOK_EVENT_RESERVED)).toEqual(schema.reserved.map((r) => r.type));
    expect(schema.reserved).toHaveLength(1);
  });

  it('the schema itself does not list media.added — the alias stays legacy-by-documentation, not schema', () => {
    // Guards the doctrine, not just the data: if the schema ever absorbs
    // media.added, this reddens and the LEGACY_ALIASES carve-out folds away.
    expect(schema.events.map((e) => e.type)).not.toContain('media.added');
  });
});

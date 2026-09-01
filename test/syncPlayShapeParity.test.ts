/**
 * syncPlayShapeParity.test — S415 cross-language golden-vector gate.
 *
 * `test/fixtures/syncplay-envelope-vectors.json` was captured by
 * `scripts/dump-server-syncplay-vectors.php` driving phlix-server's REAL
 * SyncPlayController, SyncPlayManager, SyncPlaySnapshotService (against a real
 * MySQL scratch database) and GroupState::getState() — provenance sha recorded
 * inside the fixture. This suite asserts every captured vector's key list
 * equals the TS interface's exported ordered key-list const — EXACTLY and IN
 * ORDER — so a key rename on either side (the S415 bug class: contracts once
 * claimed list-row `id/name/has_password/…` vocabulary on the full group state
 * and shipped seven never-emitted ghost types) reddens one shared gate.
 *
 * The interface↔const tie is compile-time (`tsc`, via the SYNC_PLAY_KEY_TIES
 * exports); the const↔fixture tie is runtime here. Together neither side may
 * rename alone.
 *
 * @copyright 2026 Joe Huss <detain@interserver.net>
 * @license MIT
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  SYNC_PLAY_GROUP_KEYS,
  SYNC_PLAY_MEMBER_KEYS,
  SYNC_PLAY_GROUP_LIST_ITEM_KEYS,
  SYNC_PLAY_QUEUE_ITEM_KEYS,
  SYNC_PLAY_LIST_GROUPS_RESPONSE_KEYS,
  SYNC_PLAY_CREATE_GROUP_RESPONSE_KEYS,
  SYNC_PLAY_GET_GROUP_RESPONSE_KEYS,
  SYNC_PLAY_JOIN_GROUP_RESPONSE_KEYS,
  SYNC_PLAY_LEAVE_GROUP_RESPONSE_KEYS,
  SYNC_PLAY_ERROR_RESPONSE_KEYS,
  SYNC_PLAY_KEY_TIES,
} from '../src/SyncPlay';
import type {
  SyncPlayMemberKeysTied,
  SyncPlayQueueItemKeysTied,
  SyncPlayGroupKeysTied,
  SyncPlayGroupListItemKeysTied,
  SyncPlayListGroupsResponseKeysTied,
  SyncPlayCreateGroupResponseKeysTied,
  SyncPlayGetGroupResponseKeysTied,
  SyncPlayJoinGroupResponseKeysTied,
  SyncPlayLeaveGroupResponseKeysTied,
  SyncPlayErrorResponseKeysTied,
} from '../src/SyncPlay';

// Compile-time ties: these initializations only typecheck while each key-list
// const contains EXACTLY the keys of its interface (both directions).
export const memberKeysTied: SyncPlayMemberKeysTied = true;
export const queueItemKeysTied: SyncPlayQueueItemKeysTied = true;
export const groupKeysTied: SyncPlayGroupKeysTied = true;
export const groupListItemKeysTied: SyncPlayGroupListItemKeysTied = true;
export const listGroupsResponseKeysTied: SyncPlayListGroupsResponseKeysTied = true;
export const createGroupResponseKeysTied: SyncPlayCreateGroupResponseKeysTied = true;
export const getGroupResponseKeysTied: SyncPlayGetGroupResponseKeysTied = true;
export const joinGroupResponseKeysTied: SyncPlayJoinGroupResponseKeysTied = true;
export const leaveGroupResponseKeysTied: SyncPlayLeaveGroupResponseKeysTied = true;
export const errorResponseKeysTied: SyncPlayErrorResponseKeysTied = true;

interface Rail {
  status: number;
  response: Record<string, unknown>;
}

interface VectorFixture {
  provenance: {
    serverRepo: string;
    serverSha: string;
    generator: string;
    authority: string;
    marker: string;
  };
  rails: Record<string, Rail>;
  groupState: { case: string; state: Record<string, unknown> };
}

const here = dirname(fileURLToPath(import.meta.url));
const FIXTURE_PATH = resolve(here, 'fixtures', 'syncplay-envelope-vectors.json');
const fixture = JSON.parse(readFileSync(FIXTURE_PATH, 'utf8')) as VectorFixture;

/** The S415 authority ruling was verified at this server commit. */
const AUTHORITY_SERVER_SHA = '0134063318bf601dcc152c6c175368cdf9168378';

/**
 * Key names the PRE-S415 contracts fiction claimed on the full group state.
 * If any live rail ever emits one, the authority changed without a re-ruling.
 */
const STATE_FICTION_KEYS = ['id', 'name', 'has_password', 'current_media', 'is_playing'];

describe('SyncPlayShapeParity', () => {
  describe('fixture integrity (empty-set defences)', () => {
    it('provenance points at the real SyncPlay rails at the ruling commit', () => {
      expect(fixture.provenance.serverRepo).toBe('detain/phlix-server');
      expect(fixture.provenance.serverSha).toBe(AUTHORITY_SERVER_SHA);
      expect(fixture.provenance.generator).toBe('scripts/dump-server-syncplay-vectors.php');
      expect(fixture.provenance.marker).toBe('syncplay-vectors-v1');
      expect(SYNC_PLAY_KEY_TIES).toEqual({
        member: true,
        queueItem: true,
        group: true,
        groupListItem: true,
        listGroupsResponse: true,
        createGroupResponse: true,
        getGroupResponse: true,
        joinGroupResponse: true,
        leaveGroupResponse: true,
        errorResponse: true,
      });
    });

    it('carries every rail and never a vacuous payload', () => {
      for (const name of [
        'listGroups',
        'createGroup',
        'getGroup',
        'joinGroup',
        'leaveGroup',
        'createGroupError',
        'getGroupNotFound',
      ]) {
        expect(fixture.rails[name], `rail ${name} missing from the fixture`).toBeDefined();
      }
      expect((fixture.rails.listGroups.response.groups as unknown[]).length).toBeGreaterThan(0);
      const members = fixture.groupState.state.members as Record<string, unknown>;
      expect(Object.keys(members).length, 'the groupState vector has an empty members dict').toBeGreaterThan(0);
      const queue = fixture.groupState.state.queue as unknown[];
      expect(queue.length, 'the groupState vector has an empty queue — queue items would go unpinned').toBeGreaterThan(0);
    });
  });

  describe('full group state — GroupState::getState() emission', () => {
    it('the hand-built state vector carries the EXACT ordered wire keys', () => {
      expect(Object.keys(fixture.groupState.state)).toEqual([...SYNC_PLAY_GROUP_KEYS]);
    });

    it('create/join/get rails all carry the same state keys', () => {
      for (const rail of ['createGroup', 'joinGroup', 'getGroup']) {
        const group = fixture.rails[rail].response.group as Record<string, unknown>;
        expect(Object.keys(group), `rail ${rail}`).toEqual([...SYNC_PLAY_GROUP_KEYS]);
      }
    });

    it('members is a DICT keyed by member id and every value carries the exact ordered member keys', () => {
      const state = fixture.groupState.state;
      expect(Array.isArray(state.members), 'server regressed to array members — re-rule before typing').toBe(false);
      const members = state.members as Record<string, Record<string, unknown>>;
      for (const [id, value] of Object.entries(members)) {
        expect(Object.keys(value)).toEqual([...SYNC_PLAY_MEMBER_KEYS]);
        expect(value.id, 'dict key must equal the member id').toBe(id);
      }
      expect(members.alpha.is_host, 'the host member must be marked').toBe(true);
      expect(members.beta.is_host, 'a non-host member must be marked false').toBe(false);
    });

    it('queue items carry the exact ordered emitted keys', () => {
      const queue = fixture.groupState.state.queue as Record<string, unknown>[];
      for (const item of queue) {
        expect(Object.keys(item)).toEqual([...SYNC_PLAY_QUEUE_ITEM_KEYS]);
      }
    });

    it('no state rail carries the pre-S415 list-row fiction', () => {
      for (const rail of ['createGroup', 'joinGroup', 'getGroup']) {
        const keys = Object.keys(fixture.rails[rail].response.group as Record<string, unknown>);
        for (const fiction of STATE_FICTION_KEYS) {
          expect(keys, `${rail} emitted '${fiction}' — authority changed without re-ruling`).not.toContain(fiction);
        }
      }
    });
  });

  describe('list rows — the REAL id/name/has_password vocabulary lives HERE', () => {
    it('the list envelope carries exactly { groups }', () => {
      expect(Object.keys(fixture.rails.listGroups.response)).toEqual([...SYNC_PLAY_LIST_GROUPS_RESPONSE_KEYS]);
    });

    it('every list row carries the exact ordered wire keys', () => {
      const rows = fixture.rails.listGroups.response.groups as Record<string, unknown>[];
      for (const row of rows) {
        expect(Object.keys(row)).toEqual([...SYNC_PLAY_GROUP_LIST_ITEM_KEYS]);
      }
      // The password witness: a password-protected group lists has_password=true
      // through the REAL publish/read round-trip (the S414 console bug class).
      expect(rows[0].has_password).toBe(true);
      expect(rows[0].is_playing).toBe(false);
      expect(typeof rows[0].id).toBe('string');
    });
  });

  describe('the five REST envelopes + error arm', () => {
    it('POST /groups → { success, group }', () => {
      expect(Object.keys(fixture.rails.createGroup.response)).toEqual([...SYNC_PLAY_CREATE_GROUP_RESPONSE_KEYS]);
      expect(fixture.rails.createGroup.response.success).toBe(true);
    });

    it('GET /groups/{id} → { group } — NO success key on this rail', () => {
      expect(Object.keys(fixture.rails.getGroup.response)).toEqual([...SYNC_PLAY_GET_GROUP_RESPONSE_KEYS]);
    });

    it('POST join → { success, group }', () => {
      expect(Object.keys(fixture.rails.joinGroup.response)).toEqual([...SYNC_PLAY_JOIN_GROUP_RESPONSE_KEYS]);
      expect(fixture.rails.joinGroup.response.success).toBe(true);
    });

    it('POST leave → { success, message } with message STRING on the normal arm', () => {
      expect(Object.keys(fixture.rails.leaveGroup.response)).toEqual([...SYNC_PLAY_LEAVE_GROUP_RESPONSE_KEYS]);
      expect(typeof fixture.rails.leaveGroup.response.message).toBe('string');
    });

    it('both error arms → { error } at the right statuses', () => {
      expect(fixture.rails.createGroupError.status).toBe(400);
      expect(Object.keys(fixture.rails.createGroupError.response)).toEqual([...SYNC_PLAY_ERROR_RESPONSE_KEYS]);
      expect(fixture.rails.getGroupNotFound.status).toBe(404);
      expect(Object.keys(fixture.rails.getGroupNotFound.response)).toEqual([...SYNC_PLAY_ERROR_RESPONSE_KEYS]);
    });
  });
});

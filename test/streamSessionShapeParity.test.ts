/**
 * streamSessionShapeParity.test — LW-065 cross-language golden-vector gate.
 *
 * `test/fixtures/stream-session-vectors.json` was captured by
 * `scripts/dump-server-stream-session-vectors.php` driving phlix-server's REAL
 * `Phlix\Access\StreamSessionService` against a real MySQL scratch database
 * migrated by the server's own MigrationRunner — provenance sha recorded
 * inside the fixture. These are the EXACT arrays `StreamLimitController`
 * embeds as `{ stream_limits }` (GET/PUT
 * `/api/v1/[admin/]profiles/{profileId}/stream-limits`) and
 * `{ active_streams, count }` (GET `.../active-streams`).
 *
 * LW-065 (estate review contracts__srphp #8 [Info]): the pre-cure
 * `ProfileStreamLimit` / `ActiveStream` mirror in `src/StreamSession.ts` was
 * never pinned to the wire — it claimed camelCase members, a NUMERIC
 * `profileId`, ISO-8601 `startedAt`, and omitted `last_heartbeat_at` entirely.
 * The wire is snake_case with a UUID-string profile_id, MySQL DATETIME
 * (`YYYY-MM-DD HH:MM:SS`) stamps, and an int `id`.
 *
 * WHAT THIS GATE IS — a photograph, not a live wire oracle (estate review
 * LW-010 law, as in syncPlayShapeParity.test.ts).
 *
 * @copyright 2026 Joe Huss <detain@interserver.net>
 * @license MIT
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  PROFILE_STREAM_LIMIT_KEYS,
  ACTIVE_STREAM_KEYS,
  STREAM_SESSION_KEY_TIES,
} from '../src/StreamSession';
import type {
  ProfileStreamLimitKeysTied,
  ActiveStreamKeysTied,
} from '../src/StreamSession';

export const profileStreamLimitKeysTied: ProfileStreamLimitKeysTied = true;
export const activeStreamKeysTied: ActiveStreamKeysTied = true;

interface VectorFixture {
  provenance: {
    serverRepo: string;
    serverSha: string;
    generator: string;
    authority: string;
    marker: string;
  };
  streamLimitKeys: string[];
  activeStreamKeys: string[];
  rails: {
    configured: Record<string, unknown>;
    fallback: Record<string, unknown>;
    active: Record<string, unknown>[];
    activeEmpty: unknown[];
  };
}

const here = dirname(fileURLToPath(import.meta.url));
const FIXTURE_PATH = resolve(here, 'fixtures', 'stream-session-vectors.json');
const fixture = JSON.parse(readFileSync(FIXTURE_PATH, 'utf8')) as VectorFixture;

/** The LW-065 authority ruling was verified at this server commit. */
const AUTHORITY_SERVER_SHA = 'a63dc0db72d67beed7e1e9b7824cfec6b5ac80d0';

/** MySQL DATETIME as the server's client hands it through — NOT ISO-8601. */
const DATETIME_RE = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

describe('StreamSessionShapeParity (LW-065)', () => {
  it('provenance points at the REAL StreamSessionService emission at the ruling commit', () => {
    expect(fixture.provenance.serverRepo).toBe('detain/phlix-server');
    expect(fixture.provenance.serverSha).toBe(AUTHORITY_SERVER_SHA);
    expect(fixture.provenance.generator).toBe('scripts/dump-server-stream-session-vectors.php');
    expect(fixture.provenance.marker).toBe('stream-session-vectors-v1');
    expect(STREAM_SESSION_KEY_TIES).toEqual({ profileStreamLimit: true, activeStream: true });
  });

  describe('ProfileStreamLimit (getStreamLimit()->toArray())', () => {
    it('configured row emits the exact ordered snake_case keys', () => {
      expect(Object.keys(fixture.rails.configured)).toEqual([...PROFILE_STREAM_LIMIT_KEYS]);
      expect(fixture.rails.configured).toEqual({
        profile_id: 'dddddddd-0000-4000-8000-000000000001',
        max_concurrent_streams: 3,
        max_total_bandwidth_kbps: 25000,
      });
    });

    it('no limit row → the shipped default with NULL bandwidth (never omitted)', () => {
      expect(Object.keys(fixture.rails.fallback)).toEqual([...PROFILE_STREAM_LIMIT_KEYS]);
      expect(fixture.rails.fallback).toEqual({
        profile_id: 'dddddddd-0000-4000-8000-000000000002',
        max_concurrent_streams: 1,
        max_total_bandwidth_kbps: null,
      });
    });

    it('profile_id is a UUID STRING — the camelCase/number mirror was fiction', () => {
      for (const rail of [fixture.rails.configured, fixture.rails.fallback]) {
        expect(typeof rail.profile_id).toBe('string');
        expect(rail.profile_id as string).toMatch(UUID_RE);
        expect(rail).not.toHaveProperty('profileId');
        expect(rail).not.toHaveProperty('maxConcurrentStreams');
        expect(rail).not.toHaveProperty('maxTotalBandwidthKbps');
      }
    });
  });

  describe('ActiveStream (getActiveStreamsForProfile())', () => {
    it('every row carries the exact ordered keys INCLUDING last_heartbeat_at', () => {
      expect(fixture.rails.active.length, 'the ordering witness list is empty').toBe(3);
      for (const row of fixture.rails.active) {
        expect(Object.keys(row)).toEqual([...ACTIVE_STREAM_KEYS]);
        expect(typeof row.id).toBe('number');
        expect(row.profile_id as string).toMatch(UUID_RE);
        expect(row.started_at as string).toMatch(DATETIME_RE);
        expect(row.last_heartbeat_at as string).toMatch(DATETIME_RE);
      }
      // The old mirror's fictions must never appear on the wire.
      for (const row of fixture.rails.active) {
        expect(row).not.toHaveProperty('profileId');
        expect(row).not.toHaveProperty('deviceId');
        expect(row).not.toHaveProperty('sessionId');
        expect(row).not.toHaveProperty('streamType');
        expect(row).not.toHaveProperty('startedAt');
      }
    });

    it('ORDER BY started_at DESC + scope: newest first, other profiles never leak', () => {
      expect(fixture.rails.active.map((row) => row.session_id)).toEqual(['ses-late', 'ses-mid', 'ses-early']);
      expect(fixture.rails.active.map((row) => row.started_at)).toEqual([
        '2026-11-01 10:00:00',
        '2026-11-01 09:00:00',
        '2026-11-01 08:00:00',
      ]);
      for (const row of fixture.rails.active) {
        expect(row.profile_id).toBe('dddddddd-0000-4000-8000-000000000001');
      }
    });

    it('stream_type is the ENUM passthrough union', () => {
      expect(fixture.rails.active.map((row) => row.stream_type)).toEqual(['relay', 'transcode', 'direct']);
    });

    it('a profile with no streams yields the empty list (controller count: 0)', () => {
      expect(fixture.rails.activeEmpty).toEqual([]);
    });
  });
});

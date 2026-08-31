/**
 * routeManifest.test — the S280 server route manifest export.
 *
 * Pinned here once, consumed everywhere: the TS artifact is derived from
 * phlix-server (see `scripts/generate-server-route-manifest.mjs`), and every
 * client gate asserts its request-issuing code against the JSON projection
 * (`dist/server-route-manifest.json`) vended from this repo.
 *
 * These tests restate facts INDEPENDENTLY of the generated file — the count,
 * the provenance sha, structural invariants, known-served and
 * known-UNSERED tuples — so an accidental hand-edit of the artifact, a
 * regeneration against the wrong ref, or a stale committed JSON is a RED here,
 * never a silently agreed-upon change.
 *
 * @copyright 2026 Joe Huss <detain@interserver.net>
 * @license MIT
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  SERVER_ROUTE_MANIFEST,
  SERVER_ROUTE_MANIFEST_PROVENANCE,
} from '../src/routeManifest.generated';

const VERBS = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']);

/** `[method, pathTemplate]` as the flat `"VERB /path"` key. */
function key(method: string, pathTemplate: string): string {
  return `${method} ${pathTemplate}`;
}

const KEYS = new Set(SERVER_ROUTE_MANIFEST.map(([m, p]) => key(m, p)));

/**
 * The client-side matching rule, pinned as a helper so consumers (and the
 * known-route tests below) share ONE definition: anchored, `{param}` spans
 * exactly one path segment, never a substring, never a prefix. This is what
 * makes `/media/{id}` unable to absorb `/media/{id}/markers`
 * (sibling-wildcard absorption).
 */
function isServed(method: string, concretePath: string): boolean {
  return SERVER_ROUTE_MANIFEST.some(([m, template]) => {
    if (m !== method) return false;
    const anchored = new RegExp(
      `^${template.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\\\{[^}]*\\\}/g, '[^/]+')}$`,
    );
    return anchored.test(concretePath);
  });
}

describe('SERVER_ROUTE_MANIFEST — derivation provenance', () => {
  it('is derived from phlix-server master 8f72faec (s81 profiles + cs13 hub-link included)', () => {
    // Full sha, not a prefix: a prefix match against a different commit object
    // is exactly the self-adjusting drift this pin exists to catch.
    expect(SERVER_ROUTE_MANIFEST_PROVENANCE.serverSha).toBe(
      '8f72faec6ef85c9df1382148d4f294a450d71bed',
    );
  });

  it('is the union of the two server ROUTE_MANIFEST constants, deduped', () => {
    expect(SERVER_ROUTE_MANIFEST_PROVENANCE.sources).toEqual([
      {
        file: 'tests/Unit/Server/Core/ApplicationRouterWirePathGuardTest.php',
        count: 364,
      },
      {
        file: 'tests/Unit/Server/WebPortal/WebPortalRouterWirePathGuardTest.php',
        count: 47,
      },
    ]);
    expect(SERVER_ROUTE_MANIFEST_PROVENANCE.shared).toBe(11);
    expect(SERVER_ROUTE_MANIFEST.length).toBe(400);
    expect(SERVER_ROUTE_MANIFEST_PROVENANCE.total).toBe(SERVER_ROUTE_MANIFEST.length);
  });
});

describe('SERVER_ROUTE_MANIFEST — structural invariants (parsed at the boundary)', () => {
  it('is non-vacuous: every tuple is [knownVerb, absolutePath] and the set is big', () => {
    expect(SERVER_ROUTE_MANIFEST.length).toBeGreaterThanOrEqual(300);
    for (const [method, route] of SERVER_ROUTE_MANIFEST) {
      expect(VERBS.has(method)).toBe(true);
      expect(route.startsWith('/')).toBe(true);
      expect(route).not.toContain('*');
      expect(route.endsWith('/')).toBe(false);
    }
  });

  it('has no duplicate tuples', () => {
    expect(KEYS.size).toBe(SERVER_ROUTE_MANIFEST.length);
  });

  it('is emitted in deterministic verb-major, then path order', () => {
    const sorted = [...SERVER_ROUTE_MANIFEST].sort((a, b) =>
      a[0] !== b[0] ? (a[0] < b[0] ? -1 : 1) : a[1] !== b[1] ? (a[1] < b[1] ? -1 : 1) : 0,
    );
    expect(SERVER_ROUTE_MANIFEST).toEqual(sorted);
  });

  it('has well-formed {param} placeholders', () => {
    for (const [, route] of SERVER_ROUTE_MANIFEST) {
      const stripped = route.replace(/\{[^{}]+\}/g, '');
      expect(stripped).not.toMatch(/[{}]/);
    }
  });
});

describe('SERVER_ROUTE_MANIFEST — known tuples (independent restatement)', () => {
  it('carries routes the estate expects served', () => {
    for (const k of [
      key('GET', '/api/v1/syncplay/groups'),
      key('POST', '/api/v1/syncplay/groups/{id}/leave'),
      key('POST', '/auth/identities/link/hub'),
      key('GET', '/api/v1/profiles'),
      key('POST', '/api/v1/profiles/{profileId}/switch'),
      key('POST', '/api/v1/auth/refresh'),
      key('GET', '/api/v1/admin/livetv/channels/{id}/stream'),
      key('GET', '/health'),
    ]) {
      expect(KEYS.has(k)).toBe(true);
    }
  });

  it('does NOT carry the unserved URLs the S276/S279/S280 defect class produced', () => {
    // These are the exact URLs clients wrongly called. They must stay OUT of
    // the manifest: if one ever appears (a new server route named `rooms`, say),
    // a client still calling it would silently become legal — that day the
    // client fix must be re-checked, so this reds loudly rather than quietly.
    for (const k of [
      key('GET', '/api/v1/syncplay/rooms'),
      key('POST', '/api/v1/syncplay/rooms/{id}/join'),
      key('DELETE', '/api/v1/syncplay/rooms/{id}/leave'),
      key('GET', '/api/v1/syncplay/groups/{id}/members'),
      key('GET', '/api/v1/users/me/notifications'),
      key('PUT', '/api/v1/users/me/notifications'),
    ]) {
      expect(KEYS.has(k)).toBe(false);
    }
  });

  it('does NOT carry hub-addressed routes (a different registry — see s280ui partition)', () => {
    for (const k of [
      key('GET', '/api/v1/me/servers'),
      key('POST', '/api/v1/me/servers/{serverId}/relay-token'),
      key('GET', '/api/v1/me/invite-links'),
      key('GET', '/api/v1/me/mcp-tokens'),
    ]) {
      expect(KEYS.has(k)).toBe(false);
    }
  });
});

describe('isServed — tuple-exact, never substring, never sibling-wildcard', () => {
  it('rejects the sibling-absorbing path a prefix matcher would accept', () => {
    expect(isServed('GET', '/api/v1/media/item-1')).toBe(true);
    expect(isServed('GET', '/api/v1/media/item-1/markers')).toBe(true);
    expect(isServed('DELETE', '/api/v1/media/item-1/markers/m-1')).toBe(true);
    // `/media/{id}` (and every other registered template) MUST NOT absorb
    // unregistered DEEPER paths: `{param}` spans exactly ONE segment, so a
    // two-segment tail can only match a template that actually registers it.
    expect(isServed('GET', '/api/v1/media/item-1/not-a-route')).toBe(false);
    expect(isServed('GET', '/api/v1/media/item-1/markers/m-1/extra')).toBe(false);
    // right path, wrong method is not served
    expect(isServed('PATCH', '/api/v1/media/item-1/markers/m-1')).toBe(false);
  });
});

describe('the committed dist/server-route-manifest.json artifact', () => {
  // Non-TypeScript consumers (phlix-roku-client; future PHP/other clients)
  // vendor this JSON verbatim. Like dist/mcp-scopes.json (S249) it is COMMITTED,
  // so it can go stale — someone regenerates the TS artifact and skips
  // `npm run build`. This is the detector: the JSON must agree with the TS
  // manifest, tuple-for-tuple, order-for-order, provenance-for-provenance.
  const artifact = JSON.parse(
    readFileSync(resolve(__dirname, '..', 'dist', 'server-route-manifest.json'), 'utf8'),
  ) as {
    provenance: { serverSha: string; total: number; generatedAt: string };
    routes: [string, string][];
  };

  it('is non-vacuous', () => {
    expect(Array.isArray(artifact.routes)).toBe(true);
    expect(artifact.routes.length).toBeGreaterThanOrEqual(300);
    expect(artifact.provenance.serverSha).toMatch(/^[0-9a-f]{40}$/);
  });

  it('matches SERVER_ROUTE_MANIFEST exactly, in order', () => {
    expect(artifact.routes).toEqual(SERVER_ROUTE_MANIFEST.map(([m, p]) => [m, p]));
  });

  it('carries the same provenance as the TS artifact', () => {
    expect(artifact.provenance.serverSha).toBe(SERVER_ROUTE_MANIFEST_PROVENANCE.serverSha);
    expect(artifact.provenance.generatedAt).toBe(SERVER_ROUTE_MANIFEST_PROVENANCE.generatedAt);
    expect(artifact.provenance.total).toBe(SERVER_ROUTE_MANIFEST_PROVENANCE.total);
  });
});

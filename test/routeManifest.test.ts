/**
 * routeManifest.test — the S280 server route manifest export.
 *
 * Pinned here once, consumed everywhere: the TS artifact is derived from
 * phlix-server (see `scripts/generate-server-route-manifest.mjs`), and every
 * client gate asserts its request-issuing code against the JSON projection
 * (`dist/server-route-manifest.json`) vended from this repo. The client-side
 * MATCHING law (anchored regex, `{param}` spans exactly one segment — never
 * substring, never prefix) is no longer restated here: it ships as
 * `isServedRoute` from `src/routeManifest.ts`, exported through the bundle and
 * the `./routeManifest` subpath (LW-070), so every consumer shares ONE
 * definition instead of re-deriving it. This file is that definition's first
 * consumer, and the exports-hygiene describe proves clients can resolve the
 * predicate by package name.
 *
 * These tests restate facts INDEPENDENTLY of the generated file — the count,
 * the provenance sha, structural invariants, known-served and
 * known-UNSERED tuples — so a regeneration against the wrong ref (which moves
 * the TS source these assertions are pinned against) is a RED here, never a
 * silently agreed-upon change. The committed-artifact asserts below read the
 * WORKING-COPY bytes: locally that catches a hand-edit or a stale committed
 * JSON, but in CI `npm run build` heals the working copy first, so committed
 * freshness is enforced by the whole-tree CI step `git diff --exit-code --
 * dist/` (see the final describe for the full scope).
 *
 * @copyright 2026 Joe Huss <detain@interserver.net>
 * @license MIT
 */

import { describe, it, expect } from 'vitest';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync, spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import {
  SERVER_ROUTE_MANIFEST,
  SERVER_ROUTE_MANIFEST_PROVENANCE,
  isServedRoute,
  type HttpMethod,
  type ServerRouteManifest,
} from '../src/routeManifest';

const VERBS = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']);

/** `[method, pathTemplate]` as the flat `"VERB /path"` key. */
function key(method: string, pathTemplate: string): string {
  return `${method} ${pathTemplate}`;
}

const KEYS = new Set(SERVER_ROUTE_MANIFEST.map(([m, p]) => key(m, p)));

/** The path column as a literal union — empty-widened only if `as const` teeth are gone. */
type RoutePathUnion = (typeof SERVER_ROUTE_MANIFEST)[number][1];

/** `true` while the table keeps its literal types; `never` if a widened `string` ever returns. */
type NotWidened = string extends RoutePathUnion ? never : true;

describe('SERVER_ROUTE_MANIFEST — derivation provenance', () => {
  it('is derived from phlix-server master 262f01d3 (regen #39 GENERATOR regen — S-contracts-04 fixed phlix-contracts-005 (the const is emitted UN-annotated so `as const` carries the literal table; a separate ServerRouteManifest alias supplies the widened readonly-array view), -020 (parseTuple now REJECTS any route character outside [A-Za-z0-9{}/_.-] at the boundary — the old structural guards excluded quotes/backslash only by coincidence) and -021 (each source file is deduped BEFORE the shared subtraction, so `shared` is honestly |A ∩ B|). Both server ROUTE_MANIFEST files moved bytes since 413765b6, but the extracted 418-tuple set is UNCHANGED (zero added, zero removed) and carries ZERO intra-file duplicates, so sources 379/50 and shared 11 all hold — only the sha stamp rotates; this note is the record)', () => {
    // Full sha, not a prefix: a prefix match against a different commit object
    // is exactly the self-adjusting drift this pin exists to catch.
    expect(SERVER_ROUTE_MANIFEST_PROVENANCE.serverSha).toBe(
      '262f01d3785f9a674ab18293809f3462c64ea077',
    );
  });

  it('is the union of the two server ROUTE_MANIFEST constants, deduped', () => {
    expect(SERVER_ROUTE_MANIFEST_PROVENANCE.sources).toEqual([
      {
        file: 'tests/Unit/Server/Core/ApplicationRouterWirePathGuardTest.php',
        count: 379,
      },
      {
        file: 'tests/Unit/Server/WebPortal/WebPortalRouterWirePathGuardTest.php',
        count: 50,
      },
    ]);
    expect(SERVER_ROUTE_MANIFEST_PROVENANCE.shared).toBe(11);
    expect(SERVER_ROUTE_MANIFEST.length).toBe(418);
    expect(SERVER_ROUTE_MANIFEST_PROVENANCE.total).toBe(SERVER_ROUTE_MANIFEST.length);
  });
});

describe('SERVER_ROUTE_MANIFEST — literal HttpMethod typing (CTR-9)', () => {
  it('tuples carry the HttpMethod literal union, not a widened string', () => {
    const m: HttpMethod = SERVER_ROUTE_MANIFEST[0][0];
    expect(VERBS.has(m)).toBe(true);
    // @ts-expect-error — an arbitrary string is not an HttpMethod
    const bad: HttpMethod = 'TRACE';
    expect(bad).toBe('TRACE');
  });

  it('is emitted UN-ANNOTATED so `as const` survives (phlix-contracts-005)', () => {
    // Compile-time teeth: a `ReadonlyArray<readonly [HttpMethod, string]> =`
    // annotation defeats the trailing `as const` and widens the path column to
    // `string`. If a regeneration ever brings the annotation back, this file's
    // own `tsc` pass goes RED — `string extends RoutePathUnion` becomes TRUE,
    // `NotWidened` collapses to `never`, and `true` is not assignable to it.
    // (test/** is in tsconfig, so `npm run typecheck` and `npm run build` both
    // execute this check.) Not a @ts-expect-error case: the error must surface
    // under the project tsconfig rather than be swallowed locally.
    const literalTableIntact: NotWidened = true;
    expect(literalTableIntact).toBe(true);
    // The widened view is DELIBERATE — it exists, but as a separate alias so
    // the const keeps its 418-member literal table.
    const view: ServerRouteManifest = SERVER_ROUTE_MANIFEST;
    expect(Array.isArray(view)).toBe(true);
  });

  it('generates the const without annotation plus the separate view alias', () => {
    const generated = readFileSync(
      resolve(__dirname, '..', 'src', 'routeManifest.generated.ts'),
      'utf8',
    );
    expect(generated).toContain('export const SERVER_ROUTE_MANIFEST = [');
    // The shape finding -005 repaired: the const declaration line carries no
    // type annotation (a `:` right after the name means the annotation is back).
    expect(generated).not.toMatch(/export const SERVER_ROUTE_MANIFEST:/);
    expect(generated).toContain(
      'export type ServerRouteManifest = ReadonlyArray<readonly [HttpMethod, string]>;',
    );
  });
});

describe('generate-server-route-manifest — boundary laws (S-contracts-04)', () => {
  const GENERATOR = resolve(__dirname, '..', 'scripts', 'generate-server-route-manifest.mjs');

  /** Materialize a scratch phlix-server tree with the given ROUTE_MANIFEST bodies. */
  function scratchServerTree(appEntries: string[], portalEntries: string[]): string {
    const dir = mkdtempSync(join(tmpdir(), 'phlix-ctr04-'));
    const sources: [string, string[]][] = [
      ['tests/Unit/Server/Core/ApplicationRouterWirePathGuardTest.php', appEntries],
      ['tests/Unit/Server/WebPortal/WebPortalRouterWirePathGuardTest.php', portalEntries],
    ];
    for (const [rel, entries] of sources) {
      const file = join(dir, rel);
      mkdirSync(join(file, '..'), { recursive: true });
      const body = entries.map((e) => `        '${e}',`).join('\n');
      writeFileSync(
        file,
        `<?php\n\nclass ScratchRoutes\n{\n    private const ROUTE_MANIFEST = [\n${body}\n    ];\n}\n`,
        'utf8',
      );
    }
    return dir;
  }

  function runGenerator(dir: string) {
    return spawnSync(
      process.execPath,
      [GENERATOR, dir, '--out', join(dir, 'out.ts'), '--server-sha', '0'.repeat(40)],
      { encoding: 'utf8' },
    );
  }

  it('rejects a route containing quote bytes — the emit-safe whitelist (phlix-contracts-020)', () => {
    // The generator interpolates `'${verb}', '${route}'` into TS source with no
    // escaping. A route carrying a single quote would break out of that
    // literal and forge emit-time content; the parse-time whitelist rejects
    // such routes at the boundary instead of trusting the structural guards to
    // coincidentally exclude them. PHP `\'` is captured by the entry regex as
    // literal backslash+quote, so this fixture lands in the route column.
    const dir = scratchServerTree(
      [`GET /api/v1/poison\\'s -> PoisonController::handle [AuthMiddleware]`],
      ['GET /ok -> OkController::handle [AuthMiddleware]'],
    );
    try {
      const result = runGenerator(dir);
      expect(result.status).not.toBe(0);
      expect(`${result.stderr}\n${result.stdout}`).toMatch(/outside the emit-safe whitelist/);
      expect(`${result.stderr}\n${result.stdout}`).toContain('/api/v1/poison');
      // Nothing is written when the boundary rejects — a partial emit would be
      // worse than a failed run.
      expect(existsSync(join(dir, 'out.ts'))).toBe(false);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('emits when every route stays inside the whitelist (positive control)', () => {
    const dir = scratchServerTree(
      ['GET /ok -> OkController::handle [AuthMiddleware]'],
      ['POST /ok -> OkController::create [AuthMiddleware]'],
    );
    try {
      const result = runGenerator(dir);
      expect(result.status, `generator failed: ${result.stderr}`).toBe(0);
      expect(existsSync(join(dir, 'out.ts'))).toBe(true);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('dedupes each source BEFORE the shared subtraction (phlix-contracts-021)', () => {
    // The arithmetic must read: per-file DISTINCT counts − |A ∩ B| = union.
    // A raw entry count would bill an intra-file repeat as cross-router
    // sharing (the pre-fix formula reports shared 2 below); collapsing per
    // file first keeps `shared` honest, and the collapse is LOUD on stderr.
    const dir = scratchServerTree(
      [
        'GET /x -> A::a [M]',
        'GET /x -> A::a [M]', // intra-file duplicate
        'GET /y -> A::b [M]',
        'POST /z -> A::c [M]',
      ],
      ['GET /x -> B::a [M]', 'GET /w -> B::b [M]'],
    );
    try {
      const result = runGenerator(dir);
      expect(result.status, `generator failed: ${result.stderr}`).toBe(0);
      expect(result.stderr).toMatch(/collapsed 1 intra-file duplicate/);
      const emitted = readFileSync(join(dir, 'out.ts'), 'utf8');
      // App: 4 entries → 3 distinct (count billed at 3, not 4); Portal: 2.
      // Union: GET /x, GET /y, POST /z, GET /w = 4; shared = |A ∩ B| = 1
      // (only GET /x is registered by both routers).
      expect(emitted).toContain('{ file: ' + "'tests/Unit/Server/Core/ApplicationRouterWirePathGuardTest.php'" + ', count: 3 }');
      expect(emitted).toContain('shared: 1,');
      expect(emitted).toContain('total: 4,');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
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
      key('POST', '/api/v1/auth/logout'),
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

describe('isServedRoute — tuple-exact, never substring, never sibling-wildcard', () => {
  it('rejects the sibling-absorbing path a prefix matcher would accept', () => {
    expect(isServedRoute('GET', '/api/v1/media/item-1')).toBe(true);
    expect(isServedRoute('GET', '/api/v1/media/item-1/markers')).toBe(true);
    expect(isServedRoute('DELETE', '/api/v1/media/item-1/markers/m-1')).toBe(true);
    // `/media/{id}` (and every other registered template) MUST NOT absorb
    // unregistered DEEPER paths: `{param}` spans exactly ONE segment, so a
    // two-segment tail can only match a template that actually registers it.
    expect(isServedRoute('GET', '/api/v1/media/item-1/not-a-route')).toBe(false);
    expect(isServedRoute('GET', '/api/v1/media/item-1/markers/m-1/extra')).toBe(false);
    // right path, wrong method is not served
    expect(isServedRoute('PATCH', '/api/v1/media/item-1/markers/m-1')).toBe(false);
  });
});

describe('isServedRoute — packaged surface (exports hygiene, LW-070)', () => {
  // The whole point of hoisting the predicate is that clients IMPORT it:
  // roku/mobile/console/windows used to re-implement the matching regex per
  // repo, and drift was invisible here. These two tests are the contract the
  // clients lean on — the subpath must be declared, its files committed, and
  // Node's own loader (not vitest's src aliasing) must resolve the predicate
  // by package name and reproduce the law.
  const pkgPath = resolve(__dirname, '..', 'package.json');

  it('publishes a ./routeManifest subpath whose entry files are committed', () => {
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as {
      exports: Record<string, { types?: string; import?: string; require?: string }>;
    };
    const entry = pkg.exports['./routeManifest'];
    expect(entry, 'package.json exports is missing the ./routeManifest subpath').toBeDefined();
    expect(entry.types).toBe('./dist/routeManifest.d.ts');
    expect(entry.import).toBe('./dist/phlix-contracts.js');
    expect(entry.require).toBe('./dist/phlix-contracts.umd.cjs');
    for (const rel of [entry.types, entry.import, entry.require]) {
      expect(rel && existsSync(resolve(__dirname, '..', rel)), `${rel} is not committed`).toBe(true);
    }
    const decl = readFileSync(resolve(__dirname, '..', String(entry.types)), 'utf8');
    expect(decl).toContain('isServedRoute');
  });

  it('resolves the predicate by package name through the real Node loader (ESM and CJS)', () => {
    // Law cases ride along with the resolution probe: existence without
    // semantics would let a stub ship green.
    const cases =
      '[typeof m.isServedRoute, ' +
      'm.isServedRoute("GET", "/api/v1/media/item-1"), ' +
      'm.isServedRoute("GET", "/api/v1/media/item-1/markers"), ' +
      'm.isServedRoute("GET", "/api/v1/media/item-1/not-a-route"), ' +
      'm.isServedRoute("PATCH", "/api/v1/media/item-1/markers/m-1")].join(",")';
    const opts = { cwd: resolve(__dirname, '..'), encoding: 'utf8' } as const;
    const esm = execFileSync(
      process.execPath,
      ['--input-type=module', '-e', `const m = await import("@phlix/contracts/routeManifest"); console.log(${cases});`],
      opts,
    ).trim();
    expect(esm).toBe('function,true,true,false,false');
    const cjs = execFileSync(
      process.execPath,
      ['-e', `const m = require("@phlix/contracts/routeManifest"); console.log(${cases});`],
      opts,
    ).trim();
    expect(cjs).toBe('function,true,true,false,false');
  });
});

describe('the committed dist/server-route-manifest.json artifact', () => {
  // Non-TypeScript consumers (phlix-roku-client; future PHP/other clients)
  // vendor this JSON verbatim. Like dist/mcp-scopes.json (S249) and
  // dist/error-codes.json it is COMMITTED, so it can go stale — someone
  // regenerates the TS artifact and skips `npm run build`. SCOPE OF THESE
  // TESTS: they read the WORKING-COPY bytes. Locally (no rebuild yet) that IS
  // the committed file, so the agreement and byte-freeze asserts below redden
  // a forgotten regen; but in CI `npm run build` heals the working copy before
  // the suite runs, so a stale COMMITTED artifact cannot be caught HERE. The
  // committed-freshness gate is the whole-tree CI step `git diff --exit-code
  // -- dist/` immediately after the build. What IS
  // caught in both modes: the JSON disagreeing with the TS manifest —
  // tuple-for-tuple, order-for-order, provenance-for-provenance — because the
  // build derives the JSON FROM that manifest, so a divergence means the
  // emit chain itself broke.
  const artifactPath = resolve(__dirname, '..', 'dist', 'server-route-manifest.json');
  const artifact = JSON.parse(readFileSync(artifactPath, 'utf8')) as {
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

  // cs#22 cascade figure of record: downstream consumers (ui/tizen/mobile/
  // roku/console/hub) vendor THIS JSON and key their currency pins on its md5.
  // Structural equality above cannot catch a formatting-only re-emit; this
  // byte-freeze can. Re-pin it in the same commit as an intentional re-vendor.
  // Regen #38 rotation: measured from the red at this commit (cd4673e1-era
  // bytes → 418-tuple payload @ server 413765b6).
  // Regen #39 rotation (S-contracts-04, generator-shape regen): PROVENANCE-ONLY
  // — serverSha 413765b6→262f01d3 + generatedAt 2026-11-24T20:49:36Z move; the
  // 418-tuple payload is byte-ident and `shared` UNMOVED at 11 (zero intra-file
  // duplicates on disk — the plan's 'dedupe moves shared' premise was verified
  // FALSE-to-disk; the -021 fix keeps the arithmetic honest for future input).
  // Measured from the red at this commit (c2111cd3-era bytes → 626e475b-era).
  const CS22_MANIFEST_MD5 = '626e475b3ad74a7b670d0554ae0c027e';

  it('is byte-frozen at the cs#22 cascade md5', () => {
    const bytes = createHash('md5').update(readFileSync(artifactPath)).digest('hex');
    expect(bytes).toBe(CS22_MANIFEST_MD5);
  });

  // cs#47 merge-ritual survival token — code-resident by design (one const in
  // this file, one in the hub parity test; zero hits in any .md).
  // Regen #35 deliberately does NOT rotate it: the token is a PAIR with the
  // hub-side const and marks the wave in which consumers re-vendored together.
  // A contracts-only regen leaves the vendored downstream bytes untouched, so
  // the pair advances only in a coordinated re-vendor leg (cs#47 precedent).
  // Teeth (estate review LW-012, 2026-11-07): the old shape-only asserts were
  // tautological — a locally-defined literal can never disagree with itself,
  // and the paired hub-side const was verified by nothing here. The pin now
  // cross-checks the PAIR: it reads the hub parity test and requires the two
  // consts to be the same 19-char token. Availability follows the same rule
  // as scripts/check-error-cites.mjs (PHLIX_CONTRACTS_HUB_REPO, default
  // ../phlix-hub): estate/dev trees check for real; public CI, which cannot
  // see the private sibling, reports the case SKIPPED — never silently green.
  const CS47_RITUAL_TOKEN = 'CS47CURRENCYPINX9X2';
  const CS47_HUB_PARTNER = resolve(
    __dirname, '..',
    process.env.PHLIX_CONTRACTS_HUB_REPO ?? '../phlix-hub',
    'tests/Unit/Http/Controllers/S280ContractsRouteManifestParityTest.php',
  );

  it.skipIf(!existsSync(CS47_HUB_PARTNER))(
    'pins the cs#47 token as the exact pair of the hub-side const (needs co-located hub)',
    () => {
      expect(CS47_RITUAL_TOKEN).toHaveLength(19);
      expect(CS47_RITUAL_TOKEN).toMatch(/^[A-Z0-9]+$/);
      const hub = readFileSync(CS47_HUB_PARTNER, 'utf8');
      const m = hub.match(/CS47_RITUAL_TOKEN\s*=\s*'([A-Z0-9]+)'/);
      expect(m, `no CS47_RITUAL_TOKEN const in ${CS47_HUB_PARTNER} — pair broken`).not.toBeNull();
      expect(m?.[1]).toBe(CS47_RITUAL_TOKEN);
    },
  );
});

describe('the dist/server-route-manifest.json export subpath (real-loader probe)', () => {
  // phlix-contracts-030: LW-070 taught Node to resolve the `./routeManifest`
  // predicate by package name, but the JSON subpath this file's clients
  // vendor (phlix-roku-client et al.) was declared in package.json without an
  // equivalent probe — a renamed or removed `./dist/server-route-manifest.json`
  // export key would have passed CI while breaking every consumer import.
  // Same two-law shape as the LW-070 describe above: declared + committed,
  // then resolved by package name through Node's OWN loader (not vitest's src
  // aliasing), with law cases — one served tuple, one permanently-unserved
  // tuple — riding along so a stub cannot ship green.
  const exportKey = './dist/server-route-manifest.json';

  it(`publishes a ${exportKey} export whose file is committed`, () => {
    const pkg = JSON.parse(readFileSync(resolve(__dirname, '..', 'package.json'), 'utf8')) as {
      exports: Record<string, unknown>;
    };
    const entry = pkg.exports[exportKey];
    expect(entry, `package.json exports is missing the ${exportKey} subpath`).toBeDefined();
    expect(entry).toBe(exportKey);
    expect(existsSync(resolve(__dirname, '..', String(entry))), `${String(entry)} is not committed`).toBe(true);
  });

  it('resolves by package name through the real Node loader (ESM and CJS)', () => {
    const cases =
      '[Array.isArray(m.routes), m.routes.length >= 300, ' +
      'm.routes.some(r => r[0] === "GET" && r[1] === "/api/v1/syncplay/groups"), ' +
      'm.routes.some(r => r[0] === "GET" && r[1] === "/api/v1/syncplay/rooms")].join(",")';
    const opts = { cwd: resolve(__dirname, '..'), encoding: 'utf8' } as const;
    const esm = execFileSync(
      process.execPath,
      [
        '--input-type=module',
        '-e',
        `const m = (await import("@phlix/contracts/dist/server-route-manifest.json", { with: { type: "json" } })).default; console.log(${cases});`,
      ],
      opts,
    ).trim();
    expect(esm).toBe('true,true,true,false');
    const cjs = execFileSync(
      process.execPath,
      ['-e', `const m = require("@phlix/contracts/dist/server-route-manifest.json"); console.log(${cases});`],
      opts,
    ).trim();
    expect(cjs).toBe('true,true,true,false');
  });
});

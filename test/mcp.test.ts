/**
 * mcp.test — the MCP scope vocabulary (S249).
 *
 * These restate the wire values independently of `src/mcp.ts` rather than
 * reading them back off it, so an accidental edit to a literal is a RED here
 * and not a silently agreed-upon change. The expected values are transcribed
 * from `phlix-hub/src/Mcp/McpScopes.php` and `McpTokenService.php`.
 *
 * @copyright 2026 Joe Huss <detain@interserver.net>
 */

import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { MCP_SCOPE, MCP_SCOPES, MCP_TOKEN_PREFIX } from '../src/mcp';

describe('mcp scope vocabulary', () => {
  it('matches the hub McpScopes constants', () => {
    expect(MCP_SCOPE.SERVERS_READ).toBe('mcp:servers:read');
    expect(MCP_SCOPE.LIBRARY_READ).toBe('mcp:library:read');
    expect(MCP_SCOPE.PLAYBACK_READ).toBe('mcp:playback:read');
    expect(MCP_SCOPE.PLAYBACK_CONTROL).toBe('mcp:playback:control');
  });

  it('enumerates every scope in McpScopes::all() order', () => {
    // Order is part of the stored representation (`McpScopes::parse()` emits in
    // this order into `mcp_tokens.scopes`), so this is an ORDERED comparison of
    // the whole list, never a membership check.
    expect([...MCP_SCOPES]).toEqual([
      'mcp:servers:read',
      'mcp:library:read',
      'mcp:playback:read',
      'mcp:playback:control',
    ]);
  });

  it('exposes every MCP_SCOPE member in MCP_SCOPES, and nothing else', () => {
    // Guards the two halves drifting apart: a constant added to MCP_SCOPE but
    // forgotten in the list would be invisible to the ordered check above only
    // if that check were also updated, so compare the sets directly.
    expect([...MCP_SCOPES].slice().sort()).toEqual(Object.values(MCP_SCOPE).slice().sort());
  });

  it('is non-vacuous: at least 4 scopes, each a non-empty mcp: string', () => {
    // Anti-vacuity floor. A consumer asserting equality against this list must
    // be able to trust that an empty or undefined export cannot pass as "equal".
    expect(MCP_SCOPES.length).toBeGreaterThanOrEqual(4);
    for (const scope of MCP_SCOPES) {
      expect(typeof scope).toBe('string');
      expect(scope.startsWith('mcp:')).toBe(true);
      expect(scope.length).toBeGreaterThan('mcp:'.length);
    }
  });

  it('has no duplicate members', () => {
    expect(new Set(MCP_SCOPES).size).toBe(MCP_SCOPES.length);
  });

  it('matches McpTokenService::TOKEN_PREFIX', () => {
    expect(MCP_TOKEN_PREFIX).toBe('phlix-mcp-');
  });
});

describe('the committed dist/mcp-scopes.json artifact', () => {
  // phlix-hub is PHP with no Node in CI, so it pins against this JSON rather
  // than importing the package. The artifact is COMMITTED, which means it can
  // go stale: someone edits src/mcp.ts, skips `npm run build`, and the hub
  // then gates against a vocabulary this package no longer declares. SCOPE OF
  // THESE TESTS: they read the WORKING-COPY bytes. Locally (no rebuild yet)
  // that IS the committed file, so the agreement, fresh-emit and byte-freeze
  // asserts below redden a forgotten regen; but in CI `npm run build` heals
  // the working copy before the suite runs, so a stale COMMITTED artifact
  // cannot be caught HERE. The committed-freshness gate is the whole-tree CI
  // step `git diff --exit-code -- dist/` immediately after the build — one
  // gate covering every emitted registry JSON (see the describe comment in
  // test/errors.test.ts for why the gate lives in CI rather than as an
  // in-test `git show HEAD:…` comparison).
  const artifactPath = resolve(__dirname, '..', 'dist', 'mcp-scopes.json');
  const bytes = readFileSync(artifactPath, 'utf8');
  const artifact = JSON.parse(bytes) as { scopes: string[]; tokenPrefix: string };

  it('is non-vacuous', () => {
    expect(Array.isArray(artifact.scopes)).toBe(true);
    expect(artifact.scopes.length).toBeGreaterThanOrEqual(4);
    expect(typeof artifact.tokenPrefix).toBe('string');
    expect(artifact.tokenPrefix.length).toBeGreaterThan(0);
  });

  it('matches MCP_SCOPES exactly, in order', () => {
    expect(artifact.scopes).toEqual([...MCP_SCOPES]);
  });

  it('matches MCP_TOKEN_PREFIX', () => {
    expect(artifact.tokenPrefix).toBe(MCP_TOKEN_PREFIX);
  });

  it('is byte-identical to a fresh emit (idempotency freeze)', () => {
    // Mirrors the errors.test.ts sibling (phlix-contracts-007): re-deriving
    // the emitter's exact serialization — scripts/emit-mcp-scopes.mjs builds
    // {$comment, scopes, tokenPrefix} and writes JSON.stringify(..., null, 2)
    // plus a trailing newline — freezes BOTH content and formatting against
    // the src constants this package declares. Before this test, a regen that
    // shuffled scope ordering or reformatted while keeping structure valid
    // would have passed mcp but reddened its two sibling manifests; the three
    // committed artifacts now answer to the same law.
    const regenerated = `${JSON.stringify(
      {
        $comment:
          'GENERATED by scripts/emit-mcp-scopes.mjs from src/mcp.ts. Do not edit. ' +
          'Order is significant: it is McpScopes::all() order and part of the stored ' +
          'representation of mcp_tokens.scopes.',
        scopes: [...MCP_SCOPES],
        tokenPrefix: MCP_TOKEN_PREFIX,
      },
      null,
      2,
    )}\n`;
    expect(bytes).toBe(regenerated);
  });

  it('is byte-frozen at the pinned mcp-scopes.json md5', () => {
    // Independent of the regenerated-bytes check above: a permutation that
    // the emitter reproduces faithfully still changes the md5 consumers key
    // on. This is the estate trio figure for mcp-scopes; re-pin it in the
    // same commit as an intentional coordinated re-vendor, never alone.
    const md5 = createHash('md5').update(readFileSync(artifactPath)).digest('hex');
    expect(md5).toBe('8c92c0703eae8a429c509ff16e0d185d');
  });
});

describe('the dist/mcp-scopes.json export subpath (real-loader probe)', () => {
  // phlix-contracts-030: the three `./dist/*.json` export keys were declared
  // in package.json but never resolved through Node's loader — this suite
  // (and errors.test.ts) read the files by relative path, so a renamed or
  // removed key would pass CI while breaking a consumer writing
  // `import ... from '@phlix/contracts/dist/mcp-scopes.json'`. Mirrors the
  // LW-070 packaged-surface pattern in routeManifest.test.ts: the subpath
  // must be declared, its file committed, and Node's OWN loader (not
  // vitest's src aliasing) must resolve it by package name. Law cases ride
  // along with the resolution probe: existence without semantics would let
  // a stub ship green.
  it('publishes a ./dist/mcp-scopes.json export whose file is committed', () => {
    const pkg = JSON.parse(readFileSync(resolve(__dirname, '..', 'package.json'), 'utf8')) as {
      exports: Record<string, unknown>;
    };
    const entry = pkg.exports['./dist/mcp-scopes.json'];
    expect(entry, 'package.json exports is missing the ./dist/mcp-scopes.json subpath').toBeDefined();
    expect(entry).toBe('./dist/mcp-scopes.json');
    expect(existsSync(resolve(__dirname, '..', String(entry))), `${String(entry)} is not committed`).toBe(true);
  });

  it('resolves by package name through the real Node loader (ESM and CJS)', () => {
    const cases = '[Array.isArray(m.scopes), m.scopes.join("|"), m.tokenPrefix].join("#")';
    const expected = 'true#mcp:servers:read|mcp:library:read|mcp:playback:read|mcp:playback:control#phlix-mcp-';
    const opts = { cwd: resolve(__dirname, '..'), encoding: 'utf8' } as const;
    const esm = execFileSync(
      process.execPath,
      [
        '--input-type=module',
        '-e',
        `const m = (await import("@phlix/contracts/dist/mcp-scopes.json", { with: { type: "json" } })).default; console.log(${cases});`,
      ],
      opts,
    ).trim();
    expect(esm).toBe(expected);
    const cjs = execFileSync(
      process.execPath,
      ['-e', `const m = require("@phlix/contracts/dist/mcp-scopes.json"); console.log(${cases});`],
      opts,
    ).trim();
    expect(cjs).toBe(expected);
  });
});

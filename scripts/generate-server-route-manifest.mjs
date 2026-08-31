#!/usr/bin/env node
/**
 * S280 — regenerate `src/routeManifest.generated.ts`, the canonical
 * phlix-server route manifest, from the server's ROUTE_MANIFEST constants.
 *
 * This is the estate-side generalisation of the phlix-ui prototype
 * (`phlix-ui/scripts/generate-server-route-manifest.mjs`, S280/s280ui): the
 * same derivation, promoted to `@phlix/contracts` so EVERY client gates
 * against one export instead of re-deriving its own copy. Clients vendor the
 * JSON projection (`dist/server-route-manifest.json`, emitted by
 * `scripts/emit-server-route-manifest.mjs` during `npm run build`).
 *
 * The gate exists to pin what a CLIENT requests against what the SERVER
 * registers. The expected set therefore MUST be read off the server side and
 * never off the client under test — a manifest derived from the client would
 * self-adjust to whatever the client happens to call and could never fail.
 *
 * The authoritative source is the two route tables phlix-server registers:
 *
 * - `tests/Unit/Server/Core/ApplicationRouterWirePathGuardTest.php`
 *   (`ApplicationRouterWirePathGuardTest::ROUTE_MANIFEST` — the Application
 *   router, exact-bijection with what it registers)
 * - `tests/Unit/Server/WebPortal/WebPortalRouterWirePathGuardTest.php`
 *   (`WebPortalRouterWirePathGuardTest::ROUTE_MANIFEST` — the WebPortal
 *   surface)
 *
 * The emitted set is the UNION of the two constants, because clients call
 * both routers. Both source files pin their entries as exact
 * `'VERB path -> Handler [Middleware]'` strings with NO substring matching —
 * the tuple-exact discipline this manifest inherits. The handler/middleware
 * suffix is stripped; the manifest is `[method, pathTemplate]` only.
 *
 * Usage:
 *
 *     node scripts/generate-server-route-manifest.mjs \
 *       /path/to/phlix-server-checkout \
 *       [--out src/routeManifest.generated.ts] \
 *       [--server-sha <full-commit-sha>]
 *
 * The phlix-server path is an ARGUMENT, never hardcoded — the generator is a
 * committed, reproducible tool; the checkout it reads is whatever the operator
 * points it at. When the source is a pinned ref exported read-only (e.g.
 * `git -C <server> show origin/master:<file>` into a scratch dir) rather than
 * a live worktree, pass `--server-sha` explicitly; otherwise the sha is read
 * from `git rev-parse HEAD` in the given checkout.
 *
 * Regenerate when phlix-server changes either ROUTE_MANIFEST: the generated
 * file records the exact server commit sha it was derived from, so a stale
 * manifest is visible at a glance.
 *
 * @copyright 2026 Joe Huss <detain@interserver.net>
 * @license MIT
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const MANIFEST_SOURCES = [
    {
        file: 'tests/Unit/Server/Core/ApplicationRouterWirePathGuardTest.php',
        label: 'ApplicationRouterWirePathGuardTest::ROUTE_MANIFEST (the Application router)',
    },
    {
        file: 'tests/Unit/Server/WebPortal/WebPortalRouterWirePathGuardTest.php',
        label: 'WebPortalRouterWirePathGuardTest::ROUTE_MANIFEST (the WebPortal router)',
    },
];

const HTTP_VERBS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];

/**
 * Extract one `private const ROUTE_MANIFEST = [ ... ];` block.
 *
 * Entries are PHP string-literal expressions, possibly concatenated across
 * lines (`'a' . ' -> B::c [D]'`), terminated by `,`. Doc comments and `//`
 * lines inside the block are skipped.
 *
 * @returns {Array<[string, string]>} `[VERB, pathTemplate]` tuples in manifest
 *   order, with the ` -> Handler [Middleware]` suffix stripped.
 */
function extractManifest(phpSource, fileLabel) {
    const start = phpSource.indexOf('private const ROUTE_MANIFEST = [');
    if (start === -1) {
        throw new Error(`${fileLabel}: ROUTE_MANIFEST constant not found`);
    }
    const blockStart = phpSource.indexOf('[', start) + 1;
    const blockEnd = phpSource.indexOf('];', blockStart);
    if (blockStart === 0 || blockEnd === -1) {
        throw new Error(`${fileLabel}: could not delimit the ROUTE_MANIFEST block`);
    }

    const entries = [];
    let buffer = '';
    let inBlockComment = false;
    for (const rawLine of phpSource.slice(blockStart, blockEnd).split('\n')) {
        const line = rawLine.trim();
        if (line === '') continue;
        if (inBlockComment) {
            if (line.includes('*/')) inBlockComment = false;
            continue;
        }
        if (line.startsWith('//')) continue;
        if (line.startsWith('/*')) {
            if (!line.includes('*/')) inBlockComment = true;
            continue;
        }
        if (line.startsWith('*')) continue;

        const literal = line.match(/^(?:\.\s*)?'((?:[^'\\]|\\.)*)'/);
        if (!literal) {
            throw new Error(`${fileLabel}: unparseable manifest line: ${line}`);
        }
        buffer += literal[1];
        if (line.endsWith(',')) {
            entries.push(buffer);
            buffer = '';
        }
    }
    if (buffer !== '') {
        throw new Error(`${fileLabel}: unterminated manifest entry: ${buffer}`);
    }

    return entries.map((entry) => {
        const match = entry.match(/^(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS) (\S+)/);
        if (!match) {
            throw new Error(`${fileLabel}: unparseable manifest entry: ${entry}`);
        }
        return [match[1], match[2]];
    });
}

function gitSha(repoPath) {
    try {
        return execFileSync('git', ['-C', repoPath, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
    } catch {
        throw new Error(
            `could not read the phlix-server commit sha at ${repoPath} — ` +
                'when the source is not a live checkout, pass --server-sha <sha>',
        );
    }
}

/**
 * Structural parse of one manifest tuple at generation time: this is the
 * boundary where a malformed route becomes a HARD generator error, so nothing
 * downstream (TS artifact, JSON projection, every client gate) ever has to
 * re-validate what was parsed here.
 */
function parseTuple([verb, route], fileLabel) {
    if (!HTTP_VERBS.includes(verb)) {
        throw new Error(`${fileLabel}: unknown HTTP verb: ${verb}`);
    }
    if (!route.startsWith('/')) {
        throw new Error(`${fileLabel}: route is not an absolute path: ${route}`);
    }
    if (route.includes('*')) {
        throw new Error(`${fileLabel}: wildcard route rejected (exact compare only): ${route}`);
    }
    if (route.length > 1 && route.endsWith('/')) {
        throw new Error(`${fileLabel}: route has a trailing slash: ${route}`);
    }
    if (/[{}]/.test(route.replace(/\{[^{}]*\}/g, ''))) {
        throw new Error(`${fileLabel}: unbalanced {param} placeholder: ${route}`);
    }
    return [verb, route];
}

const args = process.argv.slice(2);
const positional = args.filter((a) => !a.startsWith('--'));
const shaFlag = args.indexOf('--server-sha');
const serverPath = positional[0];
const outFlag = args.indexOf('--out');
const outPath = outFlag !== -1 ? args[outFlag + 1] : undefined;
if (!serverPath) {
    console.error(
        'usage: node scripts/generate-server-route-manifest.mjs <phlix-server-checkout> ' +
            '[--out src/routeManifest.generated.ts] [--server-sha <sha>]',
    );
    process.exit(2);
}

// ── extract both manifests ────────────────────────────────────────────────────
const union = new Map(); // "VERB path" -> [verb, path]; first occurrence wins
const perSource = [];
for (const { file, label } of MANIFEST_SOURCES) {
    const fullPath = path.join(serverPath, file);
    const tuples = extractManifest(readFileSync(fullPath, 'utf8'), label).map((t) => parseTuple(t, label));
    perSource.push({ label, file, count: tuples.length });
    for (const [verb, route] of tuples) {
        const key = `${verb} ${route}`;
        if (!union.has(key)) union.set(key, [verb, route]);
    }
}
const sharedCount = perSource.reduce((n, s) => n + s.count, 0) - union.size;
if (union.size === 0) {
    throw new Error('refusing to emit an empty route manifest — no entries parsed');
}

// Deterministic output: verb-major (alphabetical), then path — byte-stable order.
const tuples = [...union.values()].sort((a, b) =>
    a[0] === b[0]
        ? a[1] === b[1]
            ? 0
            : a[1] < b[1]
              ? -1
              : 1
        : a[0] < b[0]
          ? -1
          : 1,
);

const serverSha = shaFlag !== -1 && args[shaFlag + 1] ? args[shaFlag + 1] : gitSha(serverPath);
if (!/^[0-9a-f]{40}$/.test(serverSha)) {
    throw new Error(`provenance sha is not a full commit sha: ${serverSha}`);
}
const generatedAt = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
const generator = 'scripts/generate-server-route-manifest.mjs';
const selfPath = fileURLToPath(import.meta.url);
// Repo-root-relative generator path for the regeneration note in the output.
const generatorFromRoot = path.join('scripts', path.basename(selfPath));

const lines = [
    '/**',
    ' * GENERATED FILE — DO NOT EDIT BY HAND.',
    ' *',
    ' * S280 — the phlix-server route manifest: the UNION of',
    ' * `ApplicationRouterWirePathGuardTest::ROUTE_MANIFEST` and',
    ' * `WebPortalRouterWirePathGuardTest::ROUTE_MANIFEST` as',
    ' * `[method, pathTemplate]` tuples. This is the AUTHORITATIVE expected set',
    ' * for EVERY client route gate: every URL a Phlix client issues must be',
    ' * tuple-exact against one of these entries.',
    ' *',
    ' * Sources (phlix-server, read-only, at commit `' + serverSha + '`):',
    ...perSource.map((s) => ` * - \`${s.file}\` — ${s.label} (${s.count} entries)`),
    ' *',
    ` * Derivation: the UNION of the two ROUTE_MANIFEST constants — clients call`,
    ` * both routers. ${sharedCount} rails are registered by both routers and`,
    ` * counted once (${perSource.map((s) => s.count).join(' + ')} − ${sharedCount} shared = ${tuples.length}).`,
    ' * Tuple-exact: a request that matches only by substring or prefix is a',
    ' * defect (sibling-wildcard absorption is the failure mode this prevents).',
    ' *',
    ' * Generated by `' + generator + '` at ' + generatedAt + '.',
    ' * Regenerate: `node ' + generatorFromRoot + ' <phlix-server-checkout>`',
    ' * (optionally `--server-sha <sha>` when the source is a pinned ref exported',
    ' * read-only rather than a live worktree).',
    ' *',
    ' * @copyright 2026 Joe Huss <detain@interserver.net>',
    ' * @license MIT',
    ' */',
    '',
    '/**',
    ' * The EXACT set of `[method, pathTemplate]` tuples phlix-server registers,',
    ' * tuple-exact — a request that matches by substring or prefix is a defect.',
    ' */',
    'export const SERVER_ROUTE_MANIFEST: ReadonlyArray<readonly [string, string]> = [',
    ...tuples.map(([verb, route]) => `    ['${verb}', '${route}'],`),
    '] as const;',
    '',
    '/** Provenance — the server commit + generator this manifest was derived from. */',
    'export const SERVER_ROUTE_MANIFEST_PROVENANCE = {',
    `    serverSha: '${serverSha}',`,
    `    generatedAt: '${generatedAt}',`,
    `    generator: '${generator}',`,
    '    sources: [',
    ...perSource.map((s) => `        { file: '${s.file}', count: ${s.count} },`),
    '    ],',
    '    shared: ' + sharedCount + ',',
    '    total: ' + tuples.length + ',',
    '} as const;',
    '',
];

const target = outPath ?? path.join(path.dirname(selfPath), '..', 'src', 'routeManifest.generated.ts');
writeFileSync(target, lines.join('\n'));
console.log(
    `wrote ${target}: ${tuples.length} tuples (union of ${perSource.map((s) => s.count).join(' + ')} − ${sharedCount} shared), server ${serverSha}`,
);

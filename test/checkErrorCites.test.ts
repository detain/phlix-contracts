/**
 * checkErrorCites.test — golden parse cases for scripts/check-error-cites.mjs.
 *
 * Covers phlix-contracts-029 (S-contracts-16): the 435-cite tripwire had no
 * test of its own. Its MIN_VERIFIED_CITES floor guards against a vacuous
 * sweep, but the GRAMMAR that produces the counts was unpinned — and a
 * cite-grammar regression is exactly how the tripwire goes falsely green
 * (cites silently stop matching → counts shrink or re-anchor wrong → ok).
 * This suite pins the parser legs golden-case by golden-case: explicit/
 * continuation/bare cite attaching, the arm form, list/range parsing, the
 * token-pool filtering (STOP list, code-shape, contractions, call parens,
 * nested quotes), the comment extraction/normalization substrate, the
 * MALFORMED-WRAP detector, and the CLI contract through a real spawn (entry
 * guard, refusal exits). The exported parser is re-imported here — the CLI's
 * behavior itself is byte-identical to the pre-test refactor (re-running
 * `npm run verify:cites` shows the same ok/problems totals).
 * @copyright 2026 Joe Huss <detain@interserver.net>
 */

import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  CITE_RE,
  MALFORMED_WRAP_RE,
  STOP,
  candidateTokens,
  extractComments,
  followingEntryValue,
  normalizeComment,
  parseLineList,
  scanCites,
} from '../scripts/check-error-cites.mjs';
import type { ParsedCite } from '../scripts/check-error-cites.mjs';

// The real registry is the ultimate golden fixture: these tests read it
// exactly as the sweep does, so a grammar break in the parser or an unasked
// cite strip in errors.ts reddens the suite.
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SCRIPT = join(repoRoot, 'scripts', 'check-error-cites.mjs');
const SRC = readFileSync(join(repoRoot, 'src', 'errors.ts'), 'utf8');

// Sweep-scale truth stamped at S-contracts-16 (2026-11-24): `npm run
// verify:cites` reported ok=435 problems=0 against hub @ a77a9c78 / srv @
// 262f01d3, and the parser alone counts 435 cites across 211 cited comments
// with zero ORPHAN-BARE / NO-PREFIX / UNVERIFIABLE substrates. Rotates only
// with a LEGITIMATE cite add/removal (the same law as MIN_VERIFIED_CITES).
const REGISTRY_CITES = 435;
const REGISTRY_CITED_COMMENTS = 211;

const siblingsPresent =
  existsSync(join(repoRoot, '..', 'phlix-hub', 'src')) &&
  existsSync(join(repoRoot, '..', 'phlix-server', 'src'));

const spans = (cites: ParsedCite[]) => cites.map((c) => `${c.from}-${c.to}`);

describe('CITE_RE grammar — prefix forms', () => {
  it('parses an explicit hub/srv cite into file + single span', () => {
    expect(scanCites('hub Application.php:12')).toEqual([
      { from: 12, to: 12, prefix: 'hub', file: 'Application.php', index: 0 },
    ]);
    expect(scanCites('srv File.php:7')[0].prefix).toBe('srv');
  });

  it('accepts a path cite and prose between cites', () => {
    const cites = scanCites('legacy SCREAMING twin at hub A.php:10 and B.php:20');
    expect(spans(cites)).toEqual(['10-10', '20-20']);
    expect(cites[1]).toMatchObject({ file: 'B.php', prefix: 'hub' });
  });

  it('a continuation file cite inherits the last explicit prefix', () => {
    const cites = scanCites('hub X.php:1 srv Y.php:2 Z.php:3');
    expect(cites.map((c) => `${c.prefix} ${c.file}:${c.from}`)).toEqual([
      'hub X.php:1',
      'srv Y.php:2',
      'srv Z.php:3',
    ]);
  });

  it('a comma list and an N-M range parse as separate spans', () => {
    const cites = scanCites('hub X.php:100, 237-241');
    expect(spans(cites)).toEqual(['100-100', '237-241']);
    expect(cites.every((c) => c.file === 'X.php' && c.prefix === 'hub')).toBe(true);
  });

  it('does not fire on time-like colons (word char guards the lookbehind)', () => {
    expect(scanCites('timeout is 12:34 here')).toEqual([]);
  });

  it('does not fire on a protocol/port colon (dot and slash guard it)', () => {
    expect(scanCites('dial http://hub:8080 / srv:9001 today')).toEqual([]);
  });

  it('does not treat a digit-dot lead as a file cite', () => {
    expect(scanCites('version 1.2:34 shipped')).toEqual([]);
  });
});

describe('bare `:NN` continuation — attaches to the last cited file', () => {
  it('inherits file AND prefix from the last explicit cite in the comment', () => {
    const cites = scanCites('srv A.php:10 and B.php:20 :30');
    expect(cites).toHaveLength(3);
    const bare = cites[2];
    expect(bare).toMatchObject({ from: 30, to: 30, prefix: 'srv', file: 'B.php', bare: true });
  });

  it('a run of bare cites all stick to the same last file', () => {
    const cites = scanCites('hub X.php:10 :20 :30');
    expect(cites.every((c) => c.file === 'X.php')).toBe(true);
    expect(spans(cites)).toEqual(['10-10', '20-20', '30-30']);
    expect(cites.slice(1).every((c) => c.bare === true)).toBe(true);
  });

  it('a bare cite in a comment that names NO file parses fileless (ORPHAN-BARE substrate)', () => {
    const cites = scanCites('bare-first :77 orphan');
    expect(cites).toEqual([{ from: 77, to: 77, prefix: null, file: null, index: 11, bare: true }]);
  });

  it('the bare continuation never leaks across comments (per-comment scan)', () => {
    // Each comment is scanned as ITS OWN text by the sweep — lastFile state is
    // per-scan. A bare cite in a comment without a file stays fileless even
    // when the PREVIOUS comment cited one. Pinning this is the FALSE-GREEN
    // trap guard: a refactor that hoisted lastFile module-wide would silently
    // re-anchor hundreds of dead coords onto the wrong file.
    const first = scanCites(normalizeComment('/* hub A.php:10 */', 1).text);
    const second = scanCites(normalizeComment('/* :20 */', 2).text);
    expect(first).toHaveLength(1);
    expect(second).toHaveLength(1);
    expect(second[0]).toMatchObject({ from: 20, file: null, prefix: null, bare: true });
  });
});

describe('arm NN-MM prose form', () => {
  it('arm attaches to the last cited file with the arm flag', () => {
    const cites = scanCites('hub X.php:100, 237-241 arms 12-15');
    expect(spans(cites)).toEqual(['100-100', '237-241', '12-15']);
    const arm = cites[2];
    expect(arm).toMatchObject({ file: 'X.php', prefix: 'hub', arm: true });
  });
});

describe('parseLineList', () => {
  it('accepts singles and ascending ranges, drops descending/junk entries', () => {
    expect(parseLineList('12, 8-9, 30-10, x, 44')).toEqual([
      { from: 12, to: 12 },
      { from: 8, to: 9 },
      { from: 44, to: 44 },
    ]);
  });

  it('returns nothing for an empty/garbage list', () => {
    expect(parseLineList(' , ,')).toEqual([]);
    expect(parseLineList('')).toEqual([]);
  });
});

describe('token pool — STOP list and code-shape filtering', () => {
  it('carries the entry value plus backticked and single-quoted code words', () => {
    const text = "emit via `ALEXA_EMPTY_BODY` today text 'missing_identity_id' `code` `error` wire";
    const tokens = candidateTokens(text, 'alexa.empty_body');
    // entry value is always a candidate; code-shaped quoted words join it;
    // STOP-list vocabulary (`code`, `error`) is filtered; bare prose words
    // ('wire' — UNQUOTED) never enter the pool (they'd blanket-match).
    expect([...tokens].sort()).toEqual(['ALEXA_EMPTY_BODY', 'alexa.empty_body', 'missing_identity_id']);
  });

  it('STOP words never anchor even when backticked', () => {
    expect(candidateTokens('the `code` `error` `message` `server`', null)).toEqual(new Set());
    expect(STOP.has('code')).toBe(true);
    expect(STOP.has('hub')).toBe(true);
    expect(STOP.has('alexa.empty_body')).toBe(false);
  });

  it('rejects non-code-shaped words (too short / digit-leading / punctuation)', () => {
    const tokens = candidateTokens('`x` `3d` `ok` `foo-bar!` `Server.php` `snake_case_thing`', null);
    expect([...tokens].sort()).toEqual(['Server.php', 'snake_case_thing']);
  });

  it('strips a trailing call paren so call-site mentions anchor', () => {
    const tokens = candidateTokens('calls `getValue()` done', null);
    expect([...tokens]).toEqual(['getValue']);
  });

  it('unwraps a backtick-wrapped quoted literal and harvests inner quotes', () => {
    expect([...candidateTokens("sees `'AUTH_LOCKED'` here", null)]).toEqual(['AUTH_LOCKED']);
    expect([...candidateTokens('snippet `$x ?? \'CREATE_FAILED\'` mention', null)]).toEqual(['CREATE_FAILED']);
  });

  it('contraction apostrophes do not mis-pair into fake quoted tokens', () => {
    // prose like "isn't" leaves an ODD apostrophe that, uncollapsed, pairs
    // across the comment and swallows/mangles the real `'CODE'` tokens after
    // it. The (\w)'(\w) collapse must keep the real literals harvestable.
    const tokens = candidateTokens("prose isn't fine but 'CREATE_FAILED' stands", null);
    expect([...tokens]).toEqual(['CREATE_FAILED']);
  });

  it('an entryValue alone anchors a comment with no quoted words', () => {
    expect([...candidateTokens('plain prose with no literals', 'auth.required')]).toEqual(['auth.required']);
  });

  it('a comment with NO entry value and NO code-shaped words yields an empty pool (UNVERIFIABLE substrate)', () => {
    expect(candidateTokens('just some prose, no literals at all', null)).toEqual(new Set());
  });
});

describe('extractComments / normalizeComment / followingEntryValue substrate', () => {
  it('extracts block AND own-line comments, but never a mid-line // tail', () => {
    // Measured: the line-comment leg anchors ^[ \t]*// — errors.ts carries its
    // cites in docblocks and own-line comments; a trailing // after code is
    // not swept (keep cites out of end-of-line tails or they are invisible).
    expect(extractComments('/* c1 */\n// srv B.php:2\n')).toEqual([
      { startLine: 1, start: 0, end: 8, raw: '/* c1 */' },
      { startLine: 2, start: 9, end: 23, raw: '// srv B.php:2' },
    ]);
    expect(extractComments('/* c1 */\nconst X = 1; // srv B.php:2\n')).toHaveLength(1);
  });

  it('space-joins comment lines and maps every char back to its source line', () => {
    const { text, map } = normalizeComment('/* hub A.php:10\n * :20 */', 7);
    expect(text).toBe('hub A.php:10 :20 ');
    expect(map).toHaveLength(17);
    expect(map[0]).toBe(7);
    expect(map[11]).toBe(7); // last char of line 1
    expect(map[13]).toBe(8); // first char of line 2
    expect(map[map.length - 1]).toBe(8);
  });

  it('reads the KEY \'value\' registry line right after a docblock', () => {
    const src = "/* c1 */\n    RATE_LIMITED: 'rate.limited',\n";
    expect(followingEntryValue(src, 8)).toBe('rate.limited');
    // CRLF tolerated, indents tolerated…
    expect(followingEntryValue("/* c1 */\r\n    AB: 'a.b',\r\n", 8)).toBe('a.b');
    expect(followingEntryValue("/* c1 */\n        Q:   'q.v',\n", 8)).toBe('q.v');
    // …but prose between comment and entry kills the link (no anchor leak).
    expect(followingEntryValue("/* c1 */\nprose here\n    X: 'y',\n", 8)).toBeNull();
    // A cite ending its LINE at the colon is exactly why the newline is
    // load-bearing: the digits are gone from this line. (The sweep refuses
    // such wraps — MALFORMED-WRAP below.)
    expect(followingEntryValue("/* c1 */\n    X: 'y'", 8)).toBe('y');
  });
});

describe('MALFORMED-WRAP detector (cross-line digit hazard)', () => {
  it('refuses a cite that ends its line at the colon', () => {
    expect(MALFORMED_WRAP_RE.test('srv X.php:')).toBe(true);
    expect(MALFORMED_WRAP_RE.test('  hub Y/Z.php:\t')).toBe(true);
    expect(MALFORMED_WRAP_RE.test('srv X.php:44')).toBe(false);
    expect(MALFORMED_WRAP_RE.test('srv X.php:44-50')).toBe(false);
  });

  it('THE FALSE-GREEN TRAP: cross-line digits parse ONLY via the join', () => {
    // 'srv X.php:' + newline + '44' — normalizeComment space-joins, so the
    // join makes the wrapped cite LOOK valid (one cite at :44). That silence
    // is the hazard the MALFORMED-WRAP leg exists to convict; pinning the
    // parse documents precisely what the leg must catch.
    const wrapped = normalizeComment('/* srv X.php:\n44 */', 3);
    expect(scanCites(wrapped.text)).toHaveLength(1);
    expect(MALFORMED_WRAP_RE.test('/* srv X.php:')).toBe(true); // raw line 1 ends at the colon
    expect(SRC.split('\n').filter((l) => MALFORMED_WRAP_RE.test(l))).toEqual([]);
  });
});

describe('real-registry golden — the sweep substrate itself', () => {
  it('counts exactly the stamped cite total across the stamped cited-comment total', () => {
    // The tripwire's anti-vacuity property, measured: the parser sees every
    // cite of the registry. If CITE_RE or normalizeComment silently broke,
    // this count drops — long before MIN_VERIFIED_CITES could catch a
    // PARTIAL break (435→200 still clears a floor of 400? no — but 435→301
    // does, and would; this exact-count pin is the grammar's real teeth).
    let citedComments = 0;
    let cites = 0;
    for (const c of extractComments(SRC)) {
      const found = scanCites(normalizeComment(c.raw, c.startLine).text);
      if (found.length === 0) continue;
      citedComments++;
      cites += found.length;
    }
    expect(cites).toBe(REGISTRY_CITES);
    expect(citedComments).toBe(REGISTRY_CITED_COMMENTS);
  });

  it('every registry cite carries a file, a prefix, and an anchor token', () => {
    // ORPHAN-BARE / NO-PREFIX / UNVERIFIABLE are the sweep's problem classes;
    // at the stamp errors.ts is clean of all three (ok=435 problems=0). A new
    // entry violating the grammar reddens this pin at the parser level, even
    // on machines without the sibling checkouts.
    for (const c of extractComments(SRC)) {
      const { text } = normalizeComment(c.raw, c.startLine);
      const cites = scanCites(text);
      if (cites.length === 0) continue;
      const tokens = candidateTokens(text, followingEntryValue(SRC, c.end));
      expect(tokens.size, `no anchor token for comment at errors.ts:${c.startLine}`).toBeGreaterThan(0);
      for (const cite of cites) {
        expect(cite.file, `ORPHAN-BARE at errors.ts:${c.startLine}`).not.toBeNull();
        expect(cite.prefix, `NO-PREFIX at errors.ts:${c.startLine}`).not.toBeNull();
      }
    }
  });

  it('re-running the global CITE_RE is stable across texts (no lastIndex leak)', () => {
    // matchAll clones the regex per call today; a refactor that hoisted a
    // shared exec loop would leak lastIndex between comments and silently
    // skip leading cites. Pin: identical scans twice, and a cite at position
    // 0 is found right after a text whose last cite sat at the end.
    const a = scanCites('hub Long.php:1, 237-241 :300');
    const b = scanCites('hub X.php:10');
    expect(spans(a)).toEqual(['1-1', '237-241', '300-300']);
    expect(b).toHaveLength(1);
    expect(b[0].index).toBe(0);
    expect(scanCites('srv A.php:10 and B.php:20 :30')).toEqual(scanCites('srv A.php:10 and B.php:20 :30'));
  });
});

describe('CLI contract (spawned — entry guard + exits)', () => {
  it('imports as parser-only — this very file is the proof of life', () => {
    // The entry guard: this test file IMPORTED the module at collection time;
    // had the sweep run on import, it would have read sibling checkouts (which
    // may be absent) or process.exited the vitest worker — suite dead. The run
    // itself is therefore the load-bearing pin; assert the parser face it
    // guarantees and CITE_RE's global-flag contract (matchAll requires it and
    // must never observe lastIndex creep — scanner re-runs stay stateless).
    expect(CITE_RE.global).toBe(true);
    expect(CITE_RE.lastIndex).toBe(0);
    expect(typeof scanCites).toBe('function');
    expect(typeof candidateTokens).toBe('function');
  });

  it('exits 2 on a malformed --window (setup error, not a verdict)', () => {
    const r = spawnSync(process.execPath, [SCRIPT, '--window', 'x'], { encoding: 'utf8' });
    expect(r.status).toBe(2);
    expect(r.stderr).toContain('--window must be a non-negative integer');
  });

  it('exits 2 refusing to run without a sibling checkout', () => {
    const r = spawnSync(process.execPath, [SCRIPT, '--hub', join(repoRoot, 'no-such-dir')], {
      encoding: 'utf8',
    });
    expect(r.status).toBe(2);
    expect(r.stderr).toContain('missing hub checkout');
  });

  const itWithSiblings = siblingsPresent ? it : it.skip;
  itWithSiblings('with both checkouts it verifies the stamped totals (dev-only sweep runs)', () => {
    const r = spawnSync(process.execPath, [SCRIPT], { encoding: 'utf8' });
    // exit 0/1 are verdicts; 2 is setup. At the stamp: ok=435 problems=0.
    expect(r.status === 0 || r.status === 1).toBe(true);
    expect(r.stdout).toContain(`ok=${REGISTRY_CITES} `);
  });
});

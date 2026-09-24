#!/usr/bin/env node
/**
 * check-error-cites.mjs — dev-only drift sweep for the file:line cites embedded
 * in the docblocks of `src/errors.ts`.
 *
 * WHY: errors.ts is the estate error-code registry and every entry names its
 * emit sites as `hub File.php:NN` / `srv File.php:NN[,NN-MM …]`. Those coords
 * rot silently: every hub/server merge that touches an error-file shifts the
 * lines below the edit by ±delta. This script re-derives the truth from local
 * checkouts of phlix-hub and phlix-server and reports any cite whose anchor
 * token is no longer within ±WINDOW lines of the cited position.
 *
 * HOW it verifies: a bare line number carries no meaning, so each cite is
 * checked by TOKEN PROXIMITY. For the comment containing the cite we collect
 * candidate anchor tokens — the entry's wire value (e.g. `auth.required`) plus
 * every backticked code-shaped word in the comment (e.g. `ALEXA_EMPTY_BODY`,
 * `SERVER_KEY_INVALID`), minus generic channel vocabulary (`code`, `error`,
 * …). A cite PASSES when at least one candidate token occurs in the cited file
 * within ±WINDOW lines of the cited position (a range `N-M` widens to
 * `N-WINDOW … M+WINDOW`). DRIFT reports the nearest real occurrence so the fix
 * is mechanical; MISS means no candidate occurs in the file at all (renamed
 * emit, deleted site, or a comment without anchor tokens — read the code,
 * don't guess). It is a drift TRIPWIRE, not a proof of exactness: a token can
 * coincidentally reappear near a stale coord, so keep cites honest by re-reading
 * the emit site whenever the tripwire fires.
 *
 * Cite grammar recognized (keep errors.ts inside it):
 *   (hub|srv) Path/File.php:NN[-MM][,NN …]   explicit — the hub/srv prefix is
 *                                            REQUIRED on a comment's first cite
 *   File.php:NN…                             continuation — inherits the last
 *                                            explicit prefix in the comment
 *   :NN[-MM][,NN …]                          bare — attaches to the last file
 *                                            cited in the SAME comment; only
 *                                            for same-file follow-ups, else
 *                                            write the file name
 *   arm NN-MM                                prose arm range — same attaching
 *
 * Run:  npm run verify:cites  [ -- --window 3 | --json ]
 * Env:  PHLIX_CONTRACTS_HUB_REPO / PHLIX_CONTRACTS_SRV_REPO override the
 *       sibling-checkout defaults (../phlix-hub, ../phlix-server).
 * Exit: 0 every cite holds · 1 drift/miss/malformation found · 2 the tool
 *       cannot run (missing checkout, bad args) — fix the setup, never ignore.
 *
 * NOT wired into CI by design (estate review, 2026-09-24): CI cannot check out
 * the sibling private repos, and gating on a token-heuristic tripwire would
 * train people to ignore reds. Run it locally whenever hub/server error files
 * churn, then re-stamp the currency line in the errors.ts module header.
 *
 * @copyright 2026 Joe Huss <detain@interserver.net>
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// ─── args ────────────────────────────────────────────────────────────────────
const argv = process.argv.slice(2);
const flagValue = (name, fallback) => {
  const i = argv.indexOf(name);
  return i >= 0 && i + 1 < argv.length ? argv[i + 1] : fallback;
};
const WINDOW = Number(flagValue('--window', '3'));
if (!Number.isInteger(WINDOW) || WINDOW < 0) {
  console.error(`--window must be a non-negative integer, got ${flagValue('--window', 'unset')}`);
  process.exit(2);
}
const AS_JSON = argv.includes('--json');

// ─── resolve the cited repos; without the code there is nothing to verify ───
const REPOS = {
  hub: resolve(root, flagValue('--hub', process.env.PHLIX_CONTRACTS_HUB_REPO ?? '../phlix-hub')),
  srv: resolve(root, flagValue('--srv', process.env.PHLIX_CONTRACTS_SRV_REPO ?? '../phlix-server')),
};
for (const [kind, path] of Object.entries(REPOS)) {
  if (!existsSync(join(path, 'src'))) {
    console.error(
      `missing ${kind} checkout at ${path} — clone it or set ` +
        `PHLIX_CONTRACTS_${kind.toUpperCase()}_REPO. This script verifies cites ` +
        'against real code; with no code it verifies nothing, so it refuses to run.',
    );
    process.exit(2);
  }
}
const headSha = (path) => {
  try {
    return execFileSync('git', ['-C', path, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
  } catch {
    return 'NOT-A-GIT-CHECKOUT';
  }
};
const HEADS = { hub: headSha(REPOS.hub), srv: headSha(REPOS.srv) };

// ─── basename → absolute paths, so cites may omit directories ───────────────
function walkPhp(dir, out) {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) walkPhp(p, out);
    else if (entry.endsWith('.php')) out.push(p);
  }
}
const FILES = {};
for (const [kind, repo] of Object.entries(REPOS)) {
  const map = new Map();
  const phpFiles = [];
  walkPhp(join(repo, 'src'), phpFiles);
  for (const abs of phpFiles) {
    const rel = abs.slice(repo.length + 1);
    const base = rel.slice(rel.lastIndexOf('/') + 1);
    if (!map.has(base)) map.set(base, []);
    map.get(base).push(abs);
  }
  FILES[kind] = map;
}
function resolveFile(kind, citedPath) {
  const candidates = (FILES[kind].get(citedPath.slice(citedPath.lastIndexOf('/') + 1)) ?? []);
  if (candidates.length === 1) return { path: candidates[0] };
  if (candidates.length > 1) {
    const byRel = candidates.filter((abs) => abs.endsWith(`/${citedPath}`));
    if (byRel.length === 1) return { path: byRel[0] };
    return { error: `AMBIGUOUS '${citedPath}' in ${kind} repo (${candidates.length} matches) — cite the full relative path` };
  }
  return { error: `NOFILE '${citedPath}' not found under ${REPOS[kind]}/src` };
}
const CONTENT = new Map();
function linesOf(abs) {
  if (!CONTENT.has(abs)) CONTENT.set(abs, readFileSync(abs, 'utf8').split('\n'));
  return CONTENT.get(abs);
}

// ─── comments in src/errors.ts, with the registry value each annotates ─────
const SRC = readFileSync(join(root, 'src/errors.ts'), 'utf8');
const lineOf = (src, index) => {
  let line = 1;
  for (let i = 0; i < index; i++) if (src[i] === '\n') line++;
  return line;
};
function extractComments(src) {
  const out = [];
  for (const m of src.matchAll(/\/\*[\s\S]*?\*\//g)) {
    out.push({ startLine: lineOf(src, m.index), start: m.index, end: m.index + m[0].length, raw: m[0] });
  }
  for (const m of src.matchAll(/^[ \t]*\/\/[^\n]*/gm)) {
    out.push({ startLine: lineOf(src, m.index), start: m.index, end: m.index + m[0].length, raw: m[0] });
  }
  return out;
}
/** One-line prose + char→source-line map for drift reporting. */
function normalizeComment(raw, startLine) {
  const body = raw.replace(/^\/\*+/, '').replace(/\*\/$/, '').replace(/^\/\/[ \t]?/, '');
  const parts = body.split('\n').map((l) => l.replace(/^[ \t]*\*+[ \t]?/, '').replace(/^[ \t]+/, ''));
  const map = [];
  parts.forEach((p, i) => {
    for (let c = 0; c < p.length; c++) map.push(startLine + i);
    if (i < parts.length - 1) map.push(startLine + i); // the joining space
  });
  return { text: parts.join(' '), map };
}
/** The entry value a docblock annotates: a `KEY: 'value',` line right after it. */
function followingEntryValue(src, commentEnd) {
  const m = src.slice(commentEnd).match(/^[ \t]*\r?\n[ \t]*[A-Z0-9_]+:[ \t]*'([^']+)'/);
  return m ? m[1] : null;
}

// ─── anchor tokens per comment ───────────────────────────────────────────────
const STOP = new Set(['code', 'error', 'error_code', 'denial_type', 'create', 'join',
  'leave', 'legacy', 'twin', 'twins', 'hub', 'srv', 'server', 'client', 'true', 'false',
  'null', 'messages', 'message', 'today', 'wire', 'text', 'code-shaped', 'snake', 'dotted',
  'screaming', 'domain', 'entry', 'entries', 'forward', 'form']);
function candidateTokens(text, entryValue) {
  const tokens = new Set();
  if (entryValue) tokens.add(entryValue);
  // Backticked AND single-quoted code-shaped words are anchor candidates:
  // prose like `today text 'missing_identity_id'` names the exact PHP literal.
  // Collapse intra-word apostrophes (contractions like "isn't") before the
  // quote scan — an odd `'` mid-prose otherwise mis-pairs and swallows the
  // real quoted code tokens that follow it in the same comment.
  const scanned = text.replace(/(\w)'(\w)/g, '$1$2');
  const SHAPE = /^[A-Za-z][A-Za-z0-9_.:-]{2,}$/;
  const add = (raw) => {
    let tok = String(raw).trim();
    const wrapped = tok.match(/^'([^']*)'$/); // `'CODE'` backtick-wrapping a quote
    if (wrapped) tok = wrapped[1];
    tok = tok.replace(/\(\)?$/, '').trim(); // `foo()` -> foo (call-site mentions)
    if (!SHAPE.test(tok)) return;
    if (STOP.has(tok.toLowerCase())) return;
    tokens.add(tok);
  };
  for (const m of scanned.matchAll(/`([^`\n]+)`|'([^'\n]+)'/g)) {
    if (m[1] !== undefined) {
      add(m[1]);
      // A backticked CODE SNIPPET may embed quoted literals inside
      // (`$x ?? 'CREATE_FAILED'`) — harvest those as candidates too.
      for (const inner of m[1].matchAll(/'([^'\n]+)'/g)) add(inner[1]);
    } else {
      add(m[2]);
    }
  }
  return tokens;
}

// ─── cite scanner ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
const CITE_RE = new RegExp(
  [
    '(?:(?<prefix>hub|srv)\\s+)?(?<file>(?:[\\w-]+/)*[\\w-]+\\.php):[ \\t]*(?<lines>\\d[\\d,\\s-]*)',
    '(?<![\\w./:-]):[ \\t]*(?<blines>\\d[\\d,\\s-]*)',
    '\\b(?<arm>arms?)\\s+(?<alines>\\d+-\\d+)\\b',
  ].join('|'),
  'g',
);
function parseLineList(s) {
  return s
    .split(',')
    .map((t) => t.trim())
    .filter((t) => t.length > 0)
    .map((t) => {
      const m = t.match(/^(\d+)(?:-(\d+))?$/);
      if (!m) return null;
      const from = Number(m[1]);
      const to = m[2] === undefined ? from : Number(m[2]);
      return to >= from ? { from, to } : null;
    })
    .filter((c) => c !== null);
}
function scanCites(text) {
  const cites = [];
  let lastPrefix = null;
  let lastFile = null;
  for (const m of text.matchAll(CITE_RE)) {
    if (m.groups?.file !== undefined) {
      if (m.groups.prefix) lastPrefix = m.groups.prefix;
      const spans = parseLineList(m.groups.lines);
      for (const span of spans) {
        cites.push({ ...span, prefix: lastPrefix, file: m.groups.file, index: m.index });
      }
      lastFile = { prefix: lastPrefix, file: m.groups.file };
      continue;
    }
    if (m.groups?.blines !== undefined) {
      for (const span of parseLineList(m.groups.blines)) {
        cites.push({ ...span, prefix: lastFile?.prefix ?? null, file: lastFile?.file ?? null, index: m.index, bare: true });
      }
      continue;
    }
    if (m.groups?.alines !== undefined) {
      for (const span of parseLineList(m.groups.alines)) {
        cites.push({ ...span, prefix: lastFile?.prefix ?? null, file: lastFile?.file ?? null, index: m.index, arm: true });
      }
    }
  }
  return cites;
}

// ─── verification ─────────────────────────────────────────────────────────────
const problems = [];
let okCount = 0;
for (const c of extractComments(SRC)) {
  const { text, map } = normalizeComment(c.raw, c.startLine);
  const cites = scanCites(text);
  if (cites.length === 0) continue;
  const entryValue = followingEntryValue(SRC, c.end);
  const tokens = candidateTokens(text, entryValue);
  for (const cite of cites) {
    const at = `errors.ts:${map[Math.min(cite.index, map.length - 1)]}`;
    const label = `${cite.prefix ?? '?'} ${cite.file ?? '(bare)'}:${cite.from}${cite.to !== cite.from ? `-${cite.to}` : ''}`;
    if (!cite.file) {
      problems.push({ at, cite: label, status: 'ORPHAN-BARE', note: 'bare cite with no file in the same comment — name the file' });
      continue;
    }
    if (!cite.prefix) {
      problems.push({ at, cite: label, status: 'NO-PREFIX', note: 'first cite of the comment lacks a hub/srv prefix' });
      continue;
    }
    if (tokens.size === 0) {
      problems.push({ at, cite: label, status: 'UNVERIFIABLE', note: 'comment carries no anchor token — mention the wire value or SCREAMING legacy in backticks' });
      continue;
    }
    const r = resolveFile(cite.prefix, cite.file);
    if (r.error) {
      problems.push({ at, cite: label, status: 'FILE', note: r.error });
      continue;
    }
    const lines = linesOf(r.path);
    const lo = Math.max(1, cite.from - WINDOW);
    const hi = Math.min(lines.length, cite.to + WINDOW);
    let holds = false;
    for (let i = lo; i <= hi && !holds; i++) {
      if ([...tokens].some((t) => lines[i - 1].includes(t))) holds = true;
    }
    if (holds) {
      okCount++;
      continue;
    }
    let best = null;
    for (const t of tokens) {
      for (let i = 0; i < lines.length; i++) {
        if (!lines[i].includes(t)) continue;
        const ln = i + 1;
        const delta = ln < cite.from ? cite.from - ln : ln > cite.to ? ln - cite.to : 0;
        if (!best || delta < best.delta) best = { token: t, ln, delta };
      }
    }
    if (!best) {
      problems.push({ at, cite: label, status: 'MISS', note: `no anchor token occurs in ${cite.prefix} ${cite.file} — verify the emit site by hand` });
    } else {
      const signed = best.ln < cite.from ? best.ln - cite.from : best.ln > cite.to ? best.ln - cite.to : 0;
      problems.push({ at, cite: label, status: 'DRIFT', note: `no token within ±${WINDOW}; nearest '${best.token}' at :${best.ln} (${signed > 0 ? '+' : ''}${signed} vs cited span) — read the code, then re-anchor` });
    }
  }
}

// ─── report ───────────────────────────────────────────────────────────────────
if (AS_JSON) {
  console.log(JSON.stringify({ heads: HEADS, window: WINDOW, ok: okCount, problems }, null, 2));
} else {
  console.log(`check-error-cites: hub @ ${HEADS.hub} · srv @ ${HEADS.srv} · window ±${WINDOW}`);
  console.log(`ok=${okCount} problems=${problems.length}`);
  for (const p of problems) {
    console.log(`${p.status.padEnd(13)} ${p.at.padEnd(16)} ${p.cite.padEnd(58)} ${p.note}`);
  }
}
process.exit(problems.length > 0 ? 1 : 0);

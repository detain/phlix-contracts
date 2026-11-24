/**
 * check-error-cites.d.mts — declaration half of the S-contracts-16
 * refactor-to-export of scripts/check-error-cites.mjs.
 *
 * The sweep is a dev-only Node script (never bundled, never ships in dist);
 * its PURE parser legs are exported so test/checkErrorCites.test.ts pins the
 * cite grammar golden-case by golden-case (finding phlix-contracts-029: an
 * untested tripwire is a tripwire that can go silently green). This file adds
 * NO behavior: it types the exports the .mjs already provides, for the strict
 * TS test project (tsconfig has no allowJs, so an untyped .mjs import is
 * TS7016). Keep it byte-faithful to the implementation — the test suite
 * executes against the REAL module, so any drift reddens vitest, not just
 * this comment.
 *
 * @copyright 2026 Joe Huss <detain@interserver.net>
 */

/** A block or line comment as found in src/errors.ts, with its span. */
export interface ParsedComment {
  /** 1-based source line where the comment starts. */
  startLine: number;
  /** 0-based char offset of the comment's first character. */
  start: number;
  /** 0-based char offset just past the comment's last character. */
  end: number;
  /** The raw comment text exactly as written. */
  raw: string;
}

/** One-line prose plus a char→source-line map for drift reporting. */
export interface NormalizedComment {
  /** The comment with bullet gutters stripped and lines space-joined. */
  text: string;
  /** map[i] = source line of normalized-text char i (never empty). */
  map: number[];
}

/** A cited line span; a bare `N` normalizes to `{from:N, to:N}`. */
export interface LineSpan {
  from: number;
  to: number;
}

/** One parsed cite; null file/prefix feed the ORPHAN-BARE / NO-PREFIX legs. */
export interface ParsedCite extends LineSpan {
  /** `hub`/`srv` side, inherited by continuation, bare, and arm cites. */
  prefix: string | null;
  /** Cited file path; null on a bare cite whose comment names no file. */
  file: string | null;
  /** char offset of this cite inside the normalized comment text. */
  index: number;
  /** true on a bare `:NN` continuation. */
  bare?: true;
  /** true on a prose `arm(s) NN-MM` range. */
  arm?: true;
}

/** Block (`/* … *\/`) and own-line `//` comments, in source order. */
export function extractComments(src: string): ParsedComment[];

/** Strip comment gutters, space-join lines, and map chars back to lines. */
export function normalizeComment(raw: string, startLine: number): NormalizedComment;

/** Registry value (`KEY: 'value',` line) directly after a docblock. */
export function followingEntryValue(src: string, commentEnd: number): string | null;

/** Generic channel vocabulary — never anchor tokens (matched lowercase). */
export const STOP: Set<string>;

/** Anchor candidates for a comment: entry value + code-shaped quoted words. */
export function candidateTokens(text: string, entryValue: string | null): Set<string>;

/** The whole cite grammar, global flag, named groups. */
export const CITE_RE: RegExp;

/** A line whose cite ends at the colon (MALFORMED-WRAP detector). */
export const MALFORMED_WRAP_RE: RegExp;

/** `N`, `N-M`, comma lists → spans; malformed/descending entries dropped. */
export function parseLineList(s: string): LineSpan[];

/** All cites in a normalized comment text, prefix/file inheritance applied. */
export function scanCites(text: string): ParsedCite[];

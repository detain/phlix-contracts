/**
 * internal/wireKeys — the package-private key-set tie helper.
 *
 * Module-private machinery: `src/index.ts` deliberately does NOT re-export
 * it, because the public surface is governed by the package.json exports
 * map, not by intra-src imports (estate review LW-040 retired the earlier
 * "keep it local so the file stays self-contained" rationale — both
 * consumers ship in one bundle rolled up from one src tree anyway).
 *
 * @copyright 2026 Joe Huss <detain@interserver.net>
 * @license MIT
 */
/**
 * Compile-time tie between an interface and its ordered key-list const:
 * every interface key is in the const and vice versa, so a field rename on
 * ONE side is a `tsc` error even where the runtime parity test (which
 * compares the consts against the golden server vectors) cannot see the
 * type.
 *
 * Scope: SET membership only. Key ORDER is contract too, and it is pinned —
 * by the fixtures, not by this type: `test/trackShapeParity.test.ts` and
 * `test/syncPlayShapeParity.test.ts` compare `Object.keys(...)` of captured
 * server vectors against the key-list consts with ordered `toEqual`, so the
 * golden vectors carry the order. Where a future envelope has no fixture,
 * neither membership nor order is pinned and a dump leg must land first.
 */
export type WireKeysExact<T, K extends readonly string[]> = [
    Exclude<keyof T & string, K[number]>,
    Exclude<K[number], keyof T & string>
] extends [never, never] ? true : false;

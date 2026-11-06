/**
 * routeManifest — the server route manifest plus the client-side match law.
 *
 * S280 machinery: `src/routeManifest.generated.ts` (generated, never
 * hand-edited) holds the authoritative `[method, pathTemplate]` tuples
 * derived from phlix-server. This module is the hand-written companion that
 * makes the MATCHING semantics importable. Before LW-070 the rule existed
 * only as a helper inside `test/routeManifest.test.ts` — a test file is not a
 * consumable surface, so every client (roku, mobile, console, windows)
 * re-implemented the matcher per repo and drift between paraphrases was
 * invisible to this repo: the exact failure class the manifest machinery
 * exists to kill. Clients now import ONE definition:
 *
 *   import { isServedRoute } from '@phlix/contracts';
 *   import { isServedRoute } from '@phlix/contracts/routeManifest';
 *
 * Exported surface: the generated tuples and provenance (re-exported
 * unchanged) plus `isServedRoute` below. Routing only — a listed tuple never
 * means the caller is PERMITTED; see the generated file's header.
 *
 * @copyright 2026 Joe Huss <detain@interserver.net>
 * @license MIT
 */
export { SERVER_ROUTE_MANIFEST, SERVER_ROUTE_MANIFEST_PROVENANCE, } from './routeManifest.generated';
/**
 * The client-side matching law: `concretePath` is served by the manifest
 * under `method` ONLY by a tuple-exact match — anchored, `{param}` spans
 * exactly one path segment, never a substring, never a prefix. This is what
 * makes `GET /api/v1/media/{id}` unable to absorb
 * `GET /api/v1/media/{id}/not-a-route` (sibling-wildcard absorption: the
 * S276/S279/S280 defect family this package exists to prevent).
 */
export declare function isServedRoute(method: string, concretePath: string): boolean;

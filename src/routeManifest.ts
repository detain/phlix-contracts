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
 * unchanged), the widened `ServerRouteManifest` view type, and
 * `isServedRoute` below. Routing only — a listed tuple never means the caller
 * is PERMITTED; see the generated file's header.
 *
 * @copyright 2026 Joe Huss <detain@interserver.net>
 * @license MIT
 */

import { SERVER_ROUTE_MANIFEST, type HttpMethod } from './routeManifest.generated.js';

export type { HttpMethod, ServerRouteManifest } from './routeManifest.generated.js';
export {
  SERVER_ROUTE_MANIFEST,
  SERVER_ROUTE_MANIFEST_PROVENANCE,
} from './routeManifest.generated.js';

/**
 * Compiled-template cache: the manifest is immutable, so each `{param}`
 * template is escaped and compiled once on first use, never per call.
 */
const ANCHORED = new Map<string, RegExp>();

function anchoredTemplate(pathTemplate: string): RegExp {
  let anchored = ANCHORED.get(pathTemplate);
  if (anchored === undefined) {
    anchored = new RegExp(
      `^${pathTemplate.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\\\{[^}]*\\\}/g, '[^/]+')}$`,
    );
    ANCHORED.set(pathTemplate, anchored);
  }
  return anchored;
}

/**
 * Method-keyed pre-grouping (phlix-contracts-019): a lookup scans ONE
 * method's templates, never all 418 tuples. Eager at module scope — the
 * manifest is immutable, so one O(418) pass per process replaces a 418-row
 * scan per call, with no lazy-init state inside the predicate. Grouping
 * narrows WHICH templates a lookup tests; HOW a template is tested stays
 * entirely behind the `ANCHORED` memo above (regex build still happens at
 * most once per template, per process).
 */
const ROUTES_BY_METHOD = new Map<HttpMethod, string[]>();
for (const [method, template] of SERVER_ROUTE_MANIFEST) {
  const group = ROUTES_BY_METHOD.get(method);
  if (group === undefined) {
    ROUTES_BY_METHOD.set(method, [template]);
  } else {
    group.push(template);
  }
}

/**
 * The client-side matching law: `concretePath` is served by the manifest
 * under `method` ONLY by a tuple-exact match — anchored, `{param}` spans
 * exactly one path segment, never a substring, never a prefix. This is what
 * makes `GET /api/v1/media/{id}` unable to absorb
 * `GET /api/v1/media/{id}/not-a-route` (sibling-wildcard absorption: the
 * S276/S279/S280 defect family this package exists to prevent).
 *
 * A `method` the manifest never registers (an empty group, or a value
 * outside `HttpMethod` arriving from an untyped caller) serves nothing and
 * returns false — the same answer the pre-grouping-free scan gave; the
 * exhaustive differential pin in `test/routeManifest.test.ts` is what keeps
 * the grouping from ever changing that meaning.
 */
export function isServedRoute(method: HttpMethod, concretePath: string): boolean {
  const templates = ROUTES_BY_METHOD.get(method);
  if (templates === undefined) {
    return false;
  }
  return templates.some((template) => anchoredTemplate(template).test(concretePath));
}

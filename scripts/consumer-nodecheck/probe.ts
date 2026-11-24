/**
 * consumer-nodecheck probe — the strict-consumer gate for S-contracts-01.
 *
 * Imports the SHIPPED surfaces of `@phlix/contracts` exactly as a strict
 * Node/TypeScript consumer does: bare package name and the `./routeManifest`
 * subpath, both resolved through the package.json `exports` map under
 * `moduleResolution: NodeNext`, with `skipLibCheck: false` so the emitted
 * declaration tree itself is checked (estate review phlix-contracts-001:
 * extensionless relative specifiers in dist/*.d.ts produce TS2834/TS2307
 * here, and with the more common `skipLibCheck: true` they degrade to a
 * SILENT loss of every named export — TS2305 — in consumer builds).
 *
 * Type-only: nothing is executed; the gate is `tsc -p` on this project.
 * Bundler-mode resolution (how the estate's four JS consumers build today)
 * hides this class; this fixture is what CI runs to keep it hidden never.
 *
 * @copyright 2026 Joe Huss <detain@interserver.net>
 * @license MIT
 */

import type {
  MediaItem,
  ErrorCode,
  PlaybackInfo,
  SyncPlayGroup,
  ActiveStream,
} from '@phlix/contracts';
import {
  ERROR_CODES,
  AUTO_QUALITY,
  isErrorCode,
  buildPhlixHeaders,
  ticksToSeconds,
} from '@phlix/contracts';
import type { HttpMethod } from '@phlix/contracts/routeManifest';
import {
  SERVER_ROUTE_MANIFEST,
  SERVER_ROUTE_MANIFEST_PROVENANCE,
  isServedRoute,
} from '@phlix/contracts/routeManifest';

/** The root entry resolves with real types: a failed d.ts graph would make
 *  every one of these `any`/missing, not silently absent. */
export type ProbedTypes = [
  MediaItem,
  ErrorCode,
  PlaybackInfo,
  SyncPlayGroup,
  ActiveStream,
  HttpMethod,
];

/** The runtime helpers are typed functions/constants, not unknown: this
 *  pins the named-export survival the finding says can silently vanish. */
export const PROBED_VALUES: [
  readonly ErrorCode[],
  string,
  (value: unknown) => value is ErrorCode,
  (options: Parameters<typeof buildPhlixHeaders>[0]) => Record<string, string>,
  (ticks: number) => number,
  (method: HttpMethod, concretePath: string) => boolean,
  typeof SERVER_ROUTE_MANIFEST,
  typeof SERVER_ROUTE_MANIFEST_PROVENANCE,
] = [ERROR_CODES, AUTO_QUALITY, isErrorCode, buildPhlixHeaders, ticksToSeconds, isServedRoute, SERVER_ROUTE_MANIFEST, SERVER_ROUTE_MANIFEST_PROVENANCE];

/** Keep the tuple types exercised through their shape, not only their name. */
export const PROBED_ROUTE_TUPLE: (typeof SERVER_ROUTE_MANIFEST)[number] = SERVER_ROUTE_MANIFEST[0] as (typeof SERVER_ROUTE_MANIFEST)[number];

/** A type-level survival pin: ErrorCode is a string-literal union, so if the
 *  declaration graph had failed to resolve this comparison would be false at
 *  compile time even under a silent-loss configuration. */
export const ERROR_CODE_IS_STRING: ErrorCode extends string ? true : false = true;

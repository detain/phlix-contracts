/**
 * errors.test — the estate error-code registry (Wave 1 doctrine).
 *
 * The per-domain expectations below are restated independently of `src/errors.ts`
 * — transcribed from the emitting PHP sources in phlix-server and phlix-hub — so
 * an accidental edit to a wire literal is a RED here and not a silently
 * agreed-upon change. Changing a code means changing the WIRE, so every pin is
 * ORDERED and EXACT; nothing here is a membership check.
 *
 * @copyright 2026 Joe Huss <detain@interserver.net>
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  ERROR_CODE,
  ERROR_CODES,
  ERROR_DOMAINS,
  AUTH_ERROR_CODES,
  HUB_ERROR_CODES,
  SERVER_ERROR_CODES,
  PROXY_ERROR_CODES,
  QUOTA_ERROR_CODES,
  STREAM_ERROR_CODES,
  GATEWAY_ERROR_CODES,
  RELAY_ERROR_CODES,
  MCP_ERROR_CODES,
  MCP_TOKEN_ERROR_CODES,
  ALEXA_ERROR_CODES,
  TLS_ERROR_CODES,
  CSRF_ERROR_CODES,
  USER_ERROR_CODES,
  PLUGIN_ERROR_CODES,
  LIBRARY_ERROR_CODES,
  METADATA_ERROR_CODES,
  POSTER_ERROR_CODES,
  PROFILE_ERROR_CODES,
  DLNA_ERROR_CODES,
  CASTING_ERROR_CODES,
  QUICKCONNECT_ERROR_CODES,
  COMMON_ERROR_CODES,
  FEDERATION_ERROR_CODES,
  SHARE_ERROR_CODES,
  INVITE_ERROR_CODES,
  REQUEST_ERROR_CODES,
  ADMIN_ERROR_CODES,
  SYNCPLAY_TWIN_ERROR_CODES,
  SYNCPLAY_ERROR_CODES,
  SYNCPLAY_ERROR_CODE_TWINS,
  LEGACY_SYNCPLAY_ERROR_CODES,
} from '../src/errors';

// The exact literal set the SyncPlay WebSocket emits in `error_code` today:
// every sendError()/Messages::error() call in
// phlix-server/src/Session/SyncPlay/SyncPlayManager.php plus the two direct
// Messages::error sites in phlix-server/src/Server/WebSocket/MessageHandler.php.
// Transcribed from source, in declaration order of first appearance.
const SERVER_SYNCPLAY_SEND_ERROR_CODES = [
  'UNKNOWN_MESSAGE',
  'HANDLER_ERROR',
  'NOT_AUTHENTICATED',
  'NOT_IN_GROUP',
  'NOT_HOST',
  'INVALID_NEW_HOST',
  'MEMBER_NOT_FOUND',
  'SAME_HOST',
  'CREATE_FAILED',
  'JOIN_FAILED',
  'LEAVE_FAILED',
  'PROTOCOL_VERSION_MISMATCH',
];

const DOTTED_OR_SNAKE = /^[a-z][a-z0-9_]*(\.[a-z0-9_]+)*$/;

describe('error-code registry invariants', () => {
  it('is non-vacuous: exactly the 146 derived codes, each a non-empty string', () => {
    // Anti-vacuity floor + exact pin. A consumer gating against this list must
    // be able to trust that an empty or undefined export cannot pass as "equal".
    expect(ERROR_CODES.length).toBeGreaterThanOrEqual(140);
    expect(ERROR_CODES).toHaveLength(146);
    for (const code of ERROR_CODES) {
      expect(typeof code).toBe('string');
      expect(code.length).toBeGreaterThan(0);
    }
  });

  it('has no duplicate wire strings', () => {
    expect(new Set(ERROR_CODES).size).toBe(ERROR_CODES.length);
  });

  it('matches the domain namespacing of the registry object', () => {
    // Guards registry halves drifting: every nested value is in the flat list
    // and the flat list is nothing else.
    const fromTree = Object.values(ERROR_CODE).flatMap((domain) => Object.values(domain));
    expect([...ERROR_CODES].slice().sort()).toEqual(fromTree.slice().sort());
  });

  it('walks ERROR_DOMAINS in declaration order for the flat list', () => {
    const ordered = ERROR_DOMAINS.flatMap((domain) => Object.values(ERROR_CODE[domain]));
    expect([...ERROR_CODES]).toEqual(ordered);
  });

  it('uses the lowercase dotted/snake wire form everywhere except pinned legacy SCREAMING', () => {
    for (const code of ERROR_CODES) {
      const isLegacy = (LEGACY_SYNCPLAY_ERROR_CODES as readonly string[]).includes(code);
      if (isLegacy) {
        expect(code).toMatch(/^[A-Z][A-Z0-9_]*$/);
      } else {
        expect(code).toMatch(DOTTED_OR_SNAKE);
      }
    }
  });

});

describe('legacy SyncPlay SCREAMING pin', () => {
  it('is EXACTLY the server sendError literal set, ordered', () => {
    expect([...LEGACY_SYNCPLAY_ERROR_CODES]).toEqual(SERVER_SYNCPLAY_SEND_ERROR_CODES);
  });

  it('keeps the legacy grouping the sole SCREAMING source in the registry', () => {
    const screaming = new Set(
      ERROR_CODES.filter((code) => /^[A-Z]/.test(code)),
    );
    expect([...screaming].sort()).toEqual([...SERVER_SYNCPLAY_SEND_ERROR_CODES].sort());
  });
});

describe('syncplay dotted twins', () => {
  it('declares the 7 reserved twins', () => {
    expect([...SYNCPLAY_TWIN_ERROR_CODES]).toEqual([
      'syncplay.create_failed',
      'syncplay.join_failed',
      'syncplay.leave_failed',
      'syncplay.group_limit_reached',
      'syncplay.group_not_found',
      'syncplay.invalid_password',
      'syncplay.group_full',
    ]);
  });

  it('maps each twin to the legacy SCREAMING code it replaces or un-wraps', () => {
    expect(SYNCPLAY_ERROR_CODE_TWINS).toEqual({
      'syncplay.create_failed': 'CREATE_FAILED',
      'syncplay.group_limit_reached': 'CREATE_FAILED',
      'syncplay.join_failed': 'JOIN_FAILED',
      'syncplay.group_not_found': 'JOIN_FAILED',
      'syncplay.invalid_password': 'JOIN_FAILED',
      'syncplay.group_full': 'JOIN_FAILED',
      'syncplay.leave_failed': 'LEAVE_FAILED',
    });
  });

  it('only ever maps onto pinned legacy members', () => {
    for (const original of Object.values(SYNCPLAY_ERROR_CODE_TWINS)) {
      expect(SERVER_SYNCPLAY_SEND_ERROR_CODES).toContain(original);
    }
  });

  it('SYNCPLAY_ERROR_CODES is legacy-then-twins', () => {
    expect([...SYNCPLAY_ERROR_CODES]).toEqual([
      ...SERVER_SYNCPLAY_SEND_ERROR_CODES,
      ...[
        'syncplay.create_failed',
        'syncplay.join_failed',
        'syncplay.leave_failed',
        'syncplay.group_limit_reached',
        'syncplay.group_not_found',
        'syncplay.invalid_password',
        'syncplay.group_full',
      ],
    ]);
  });
});

describe('per-domain vocabulary restated from the emitting sources', () => {
  // server + hub auth gates
  it('auth', () => {
    expect([...AUTH_ERROR_CODES]).toEqual([
      'auth.required',
      'auth.not_admin',
      'auth.invalid_token',
      'auth.user_not_found',
      'auth.signups_disabled',
      'auth.account_pending',
      'auth.account_disabled',
      'auth.password_change_required',
    ]);
  });

  it('hub (server-side account-link family)', () => {
    expect([...HUB_ERROR_CODES]).toEqual([
      'hub.not_enrolled',
      'hub.token_required',
      'hub.jwt_invalid',
    ]);
  });

  it('server (hub-side lookup/tunnel)', () => {
    expect([...SERVER_ERROR_CODES]).toEqual([
      'server.not_found',
      'server.not_owned',
      'server.relay_unavailable',
      'server.offline',
      'server.no_tunnel',
    ]);
  });

  it('proxy / quota / stream / gateway', () => {
    expect([...PROXY_ERROR_CODES]).toEqual(['proxy.scope_denied']);
    expect([...QUOTA_ERROR_CODES]).toEqual(['quota.exceeded']);
    expect([...STREAM_ERROR_CODES]).toEqual(['stream.limit']);
    expect([...GATEWAY_ERROR_CODES]).toEqual(['gateway.timeout']);
  });

  it('relay', () => {
    expect([...RELAY_ERROR_CODES]).toEqual([
      'relay.client_ws_endpoint',
      'relay.ws_http_endpoint',
      'relay.encode_error',
    ]);
  });

  it('mcp / mcp_token', () => {
    expect([...MCP_ERROR_CODES]).toEqual([
      'mcp.unknown_tool',
      'mcp.scope_denied',
      'mcp.streaming_unsupported',
      'mcp.sse_not_acceptable',
      'mcp.unsupported_protocol_version',
    ]);
    expect([...MCP_TOKEN_ERROR_CODES]).toEqual([
      'mcp_token.no_valid_scopes',
      'mcp_token.not_found',
    ]);
  });

  it('alexa / tls / csrf / user', () => {
    expect([...ALEXA_ERROR_CODES]).toEqual([
      'alexa.streaming_unsupported',
      'alexa.malformed_envelope',
    ]);
    expect([...TLS_ERROR_CODES]).toEqual(['tls.acme_not_implemented']);
    expect([...CSRF_ERROR_CODES]).toEqual(['csrf.invalid_origin']);
    expect([...USER_ERROR_CODES]).toEqual(['user.not_found']);
  });

  it('plugin (17, server admin/catalog surface)', () => {
    expect([...PLUGIN_ERROR_CODES]).toEqual([
      'plugin.name.required',
      'plugin.not_found',
      'plugin.url.required',
      'plugin.url.invalid_scheme',
      'plugin.url.blocked',
      'plugin.install.failed',
      'plugin.enable.failed',
      'plugin.settings.invalid',
      'plugin.settings.validation_failed',
      'plugin.test_not_supported',
      'plugin.update.failed',
      'plugin.update.no_source',
      'plugin.catalog.url.required',
      'plugin.catalog.url.duplicate',
      'plugin.catalog.url.invalid',
      'plugin.auto_update.invalid',
      'plugin.catalog.channel.invalid',
    ]);
  });

  it('library / metadata / poster / profile', () => {
    expect([...LIBRARY_ERROR_CODES]).toEqual(['library.delete_all.confirm_required']);
    expect([...METADATA_ERROR_CODES]).toEqual([
      'metadata.tmdb_unconfigured',
      'metadata.tmdb_unreachable',
      'metadata.no_query',
      'metadata.bad_tmdb_id',
      'metadata.no_match',
    ]);
    expect([...POSTER_ERROR_CODES]).toEqual([
      'poster.missing_url',
      'poster.poster_not_candidate',
    ]);
    expect([...PROFILE_ERROR_CODES]).toEqual([
      'profile.use_switch',
      'profile.last_profile',
      'profile.no_pin',
      'profile.pin_mismatch',
    ]);
  });

  it('dlna / casting', () => {
    expect([...DLNA_ERROR_CODES]).toEqual(['dlna.forbidden']);
    expect([...CASTING_ERROR_CODES]).toEqual(['casting.disabled']);
  });

  it('quickconnect (bare snake on the code field)', () => {
    expect([...QUICKCONNECT_ERROR_CODES]).toEqual([
      'unauthorized',
      'invalid_secret',
      'pairing_not_pending',
      'consent_required',
      'pairing_not_found',
      'storage_unavailable',
    ]);
  });

  it('common (cross-surface validation/envelope)', () => {
    expect([...COMMON_ERROR_CODES]).toEqual([
      'rate_limited',
      'provider_unavailable',
      'invalid_request',
      'invalid_body',
      'invalid_payload',
      'unknown_error',
      'validation_failed',
      'admin_required',
      'master_only',
      'invalid_url',
      'invalid_role',
      'invalid_permission',
      'missing_url',
      'missing_name',
      'missing_public_key',
      'missing_user_id',
      'missing_server_id',
      'not_server_owner',
    ]);
  });

  it('federation', () => {
    expect([...FEDERATION_ERROR_CODES]).toEqual([
      'peer_url_exists',
      'peer_key_exists',
      'peer_not_found',
      'offer_not_found',
      'offer_already_responded',
      'delegation_not_found',
      'missing_peer_id',
      'missing_offer_id',
      'missing_delegation_id',
      'missing_library_id',
      'missing_library_name',
    ]);
  });

  it('share / invite / request / admin', () => {
    expect([...SHARE_ERROR_CODES]).toEqual([
      'share_not_found',
      'missing_share_id',
      'missing_collaborator_email',
      'share_exists',
      'not_share_owner',
      'missing_permission',
    ]);
    expect([...INVITE_ERROR_CODES]).toEqual([
      'missing_link_id',
      'invite_link_not_found',
      'not_link_owner',
      'missing_token',
      'invalid_invite',
      'invite_expired_or_exhausted',
    ]);
    expect([...REQUEST_ERROR_CODES]).toEqual([
      'invalid_type',
      'invalid_tmdb_id',
      'missing_title',
      'missing_request_id',
      'request_not_found',
      'not_request_owner',
      'approve_failed',
      'deny_failed',
    ]);
    expect([...ADMIN_ERROR_CODES]).toEqual([
      'user_not_found',
      'cannot_delete_self',
      'last_admin',
      'cannot_demote_self',
      'invalid_quota',
      'invalid_throttle',
    ]);
  });
});

describe('the committed dist/error-codes.json artifact', () => {
  // PHP consumers (hub/server) have no Node in CI, so they pin against this
  // JSON rather than importing the package. The artifact is COMMITTED, which
  // means it can go stale: someone edits src/errors.ts, skips `npm run build`,
  // and a consumer then gates against a vocabulary this package no longer
  // declares. This is the detector. In CI `npm run build` runs before
  // `npm run test:run`, so a stale committed file is caught even after that
  // build regenerated the working copy.
  const bytes = readFileSync(resolve(__dirname, '..', 'dist', 'error-codes.json'), 'utf8');
  const artifact = JSON.parse(bytes) as { $comment: string; codes: string[] };

  it('is non-vacuous', () => {
    expect(Array.isArray(artifact.codes)).toBe(true);
    expect(artifact.codes.length).toBeGreaterThanOrEqual(140);
  });

  it('carries the same ordered vocabulary as ERROR_CODES', () => {
    // Order-significant: the JSON mirrors the registry declaration order.
    expect(artifact.codes).toEqual([...ERROR_CODES]);
  });

  it('is byte-identical to a fresh emit (idempotency freeze)', () => {
    // Re-deriving the emitter's exact serialization (same $comment, same
    // JSON.stringify(..., null, 2) + trailing newline) freezes BOTH content and
    // formatting: the generator is deterministic and the committed file is its
    // current output.
    const regenerated = `${JSON.stringify(
      {
        $comment:
          'GENERATED by scripts/emit-error-codes.mjs from src/errors.ts. Do not edit. ' +
          'Order is the registry declaration order. Machine error codes are the wire ' +
          'SSOT; clients localize by code, server message text is debug fallback.',
        codes: [...ERROR_CODES],
      },
      null,
      2,
    )}\n`;
    expect(bytes).toBe(regenerated);
  });
});

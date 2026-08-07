/**
 * MCP (Model Context Protocol) personal-access-token vocabulary.
 *
 * The single cross-repo home for the scope strings an MCP PAT may carry and
 * for the plaintext token prefix. Authored from the hub's PHP source of truth —
 * `phlix-hub/src/Mcp/McpScopes.php` (`McpScopes::all()`, the four `const string`
 * members) and `phlix-hub/src/Mcp/McpTokenService.php` (`TOKEN_PREFIX`) — and
 * NOT derived from any client's copy.
 *
 * ## Why this lives here and not in a client (S249)
 *
 * phlix-ui previously pinned its `MCP_SCOPES` against the hub by *reading the
 * PHP file off the filesystem*, guarded by `it.runIf(existsSync(...))`. CI has
 * no `phlix-hub` checkout, so that assertion never executed and reported as
 * PASSING, while on a developer box it went red whenever the sibling tree
 * moved. Contracts is the only place both repos can depend on: the JS clients
 * already pin `@phlix/contracts` by git tag, and the hub can gate its PHP
 * constants against this file in its own CI. Neither side needs the other's
 * working tree to check itself.
 *
 * ⚠ These are the WIRE values. A consumer must compare against them exactly —
 * `'mcp:playback'` is a prefix of `'mcp:playback:control'`, so any substring /
 * `startsWith` / `includes` check silently accepts a renamed scope.
 *
 * ⚠ Scopes only ever SUBTRACT from the hub's identity+ownership gate. Holding
 * every scope in {@link MCP_SCOPES} still does not let a token reach a server
 * its user does not own. Never treat a scope as an authorization decision on
 * the client side.
 * @copyright 2026 Joe Huss <detain@interserver.net>
 */

/**
 * The closed set of MCP token scopes, keyed by the hub's constant names
 * (mirror `McpScopes::SERVERS_READ` … `McpScopes::PLAYBACK_CONTROL`).
 */
export const MCP_SCOPE = {
  /** Enumerate the media servers the token's user owns. */
  SERVERS_READ: 'mcp:servers:read',
  /** Read library / media metadata from an owned server over the relay. */
  LIBRARY_READ: 'mcp:library:read',
  /** Read playback information (stream decisions) for an owned media item. */
  PLAYBACK_READ: 'mcp:playback:read',
  /**
   * Control an ALREADY-RUNNING cast/DLNA session on an owned server: pause,
   * resume, stop, seek (hub S63). The only WRITE scope in the set, and
   * deliberately separate from {@link MCP_SCOPE.PLAYBACK_READ} — a token minted
   * so an agent can answer "what would this play as?" must not thereby be able
   * to stop somebody's film.
   */
  PLAYBACK_CONTROL: 'mcp:playback:control',
} as const;

/** One of the scopes {@link MCP_SCOPE} enumerates. */
export type McpScope = (typeof MCP_SCOPE)[keyof typeof MCP_SCOPE];

/**
 * Every MCP scope this contract version knows, in `McpScopes::all()`'s order.
 *
 * ⚠ The ORDER is part of the stored representation. `McpScopes::parse()` emits
 * scopes in this order and `mcp_tokens.scopes` stores the result, so appending
 * is safe but REORDERING rewrites what every existing row compares equal to.
 * Read-only scopes first, then writes.
 */
export const MCP_SCOPES = [
  MCP_SCOPE.SERVERS_READ,
  MCP_SCOPE.LIBRARY_READ,
  MCP_SCOPE.PLAYBACK_READ,
  MCP_SCOPE.PLAYBACK_CONTROL,
] as const;

/**
 * The prefix every minted MCP plaintext token carries
 * (`McpTokenService::TOKEN_PREFIX`).
 *
 * ⚠ Display/verification hint ONLY. A string starting with this is not an
 * authenticated token; only the hub, which holds the SHA-256 hashes, can say
 * that. Never gate anything on it client-side.
 */
export const MCP_TOKEN_PREFIX = 'phlix-mcp-';

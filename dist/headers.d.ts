/**
 * Phlix custom HTTP header names + device identity helpers.
 *
 * The header names and `X-Phlix-Device-Type` values are verbatim from the
 * windows client (`api.ts`) and tizen client, which the server reads on every
 * authenticated request.
 *
 * Custody law (COOKIE-DESIGN.md §2.1 — an estate workspace-root doc, not
 * vendored in this package; CP-001 — doc-only pass, behavior
 * UNCHANGED): these device headers are also the server's cookie OPT-OUT
 * discriminator. A request carrying `X-Phlix-Device-Type` is CLASS DEVICE:
 * the server keeps it on bearer custody and NEVER emits Set-Cookie. The
 * browser SPA sends none of these headers, and its absence (browser
 * Origin/Sec-Fetch-Dest class) is what makes same-origin `/app` cookie mode
 * eligible. Nothing here changed — the enum values below are precisely the
 * wire truth that law rests on, which is why §3 leaves this file's code
 * untouched.
 * @copyright 2026 Joe Huss <detain@interserver.net>
 */
/** `X-Phlix-Device-ID` — stable per-install device identifier. */
export declare const X_PHLIX_DEVICE_ID = "X-Phlix-Device-ID";
/** `X-Phlix-Device-Name` — human-friendly device name. */
export declare const X_PHLIX_DEVICE_NAME = "X-Phlix-Device-Name";
/**
 * `X-Phlix-Device-Type` — client platform discriminator. Its presence IS the
 * cookie opt-out signal (COOKIE-DESIGN.md §2.1): device-class requests are
 * bearer-only and never receive Set-Cookie.
 */
export declare const X_PHLIX_DEVICE_TYPE = "X-Phlix-Device-Type";
/** `X-Phlix-Session-ID` — active session id (set after login). */
export declare const X_PHLIX_SESSION_ID = "X-Phlix-Session-ID";
/**
 * Client platform values the server recognizes for `X-Phlix-Device-Type`.
 * Every member is CLASS DEVICE on bearer custody (COOKIE-DESIGN.md
 * §2.1), and the union deliberately has NO browser member — a browser must
 * not device-class itself into cookie opt-out. The five wire spellings below
 * are exactly what the windows/tizen/roku/mobile clients send. Console and
 * plugin/CLI clients are also CLASS DEVICE bearer custody, but they carry no
 * cookie jar at all and identify through their own channels (console's
 * session create sends `device_type` in the REST body), which is why they
 * are absent from this header enum — the server's opt-out law keys on the
 * bearer CLASS the header signals, not on a closed member list.
 */
export type DeviceType = 'windows' | 'samsung-tizen' | 'android' | 'ios' | 'roku';
/** Options for {@link buildPhlixHeaders}. */
export interface BuildPhlixHeadersOptions {
    deviceId: string;
    deviceName: string;
    deviceType: DeviceType;
    /** Active session id — adds `X-Phlix-Session-ID` when present. */
    sessionId?: string;
    /** Bearer token — adds `Authorization: Bearer <token>` when present. */
    token?: string;
}
/**
 * Build the Phlix device/auth header set for an outgoing request.
 *
 * Always emits the three device headers. Adds `X-Phlix-Session-ID` when a
 * session id is given and `Authorization` when a token is given. Pure and
 * deterministic — returns a fresh object every call.
 */
export declare function buildPhlixHeaders(options: BuildPhlixHeadersOptions): Record<string, string>;

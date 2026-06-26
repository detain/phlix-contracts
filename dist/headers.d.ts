/**
 * Phlix custom HTTP header names + device identity helpers.
 *
 * The header names and `X-Phlix-Device-Type` values are verbatim from the
 * windows client (`api.ts`) and tizen client, which the server reads on every
 * authenticated request.
 */
/** `X-Phlix-Device-ID` — stable per-install device identifier. */
export declare const X_PHLIX_DEVICE_ID = "X-Phlix-Device-ID";
/** `X-Phlix-Device-Name` — human-friendly device name. */
export declare const X_PHLIX_DEVICE_NAME = "X-Phlix-Device-Name";
/** `X-Phlix-Device-Type` — client platform discriminator. */
export declare const X_PHLIX_DEVICE_TYPE = "X-Phlix-Device-Type";
/** `X-Phlix-Session-ID` — active session id (set after login). */
export declare const X_PHLIX_SESSION_ID = "X-Phlix-Session-ID";
/** Client platform values the server recognizes for `X-Phlix-Device-Type`. */
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

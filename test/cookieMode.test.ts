/**
 * cookieMode.test — CP-001 (Cookie Program) wire-law pins.
 *
 * Pins the TYPE-ONLY contract surface COOKIE-DESIGN.md §3 adds to this repo:
 * the CookieMode custody marker, the REST auth shapes that must stay
 * byte-identical through the dual-emit compat window (envelope law), and the
 * headers.ts DeviceType set that IS the server-side cookie opt-out
 * discriminator (§2.1). The wire trio (error-codes / route-manifest /
 * mcp-scopes registries) is untouched — this program registers ZERO new
 * error codes.
 * @copyright 2026 Joe Huss <detain@interserver.net>
 */

import { describe, it, expect } from 'vitest';
import { COOKIE_MODE } from '../src/auth';
import type { AuthResult, CookieMode } from '../src/auth';
import { X_PHLIX_DEVICE_TYPE, buildPhlixHeaders } from '../src/headers';
import type { DeviceType } from '../src/headers';

describe('COOKIE_MODE custody marker (COOKIE-DESIGN.md §2.1/§3)', () => {
  it('carries exactly the two designed custody modes', () => {
    expect(Object.values(COOKIE_MODE).sort()).toEqual(['bearer', 'cookie']);
  });

  it('spells the literals the ui store seam and the fallback posture use', () => {
    // 'cookie' is the mode flag the ui CookieTokenStore reports (§4.3);
    // 'bearer' covers both CLASS DEVICE custody and the http-LAN fallback
    // where the server issues NO cookies (§2.4, owner ruling CD-3a).
    expect(COOKIE_MODE.COOKIE).toBe('cookie');
    expect(COOKIE_MODE.BEARER).toBe('bearer');
  });

  it('is a closed union — a third mode must not typecheck', () => {
    const modes: CookieMode[] = [COOKIE_MODE.COOKIE, COOKIE_MODE.BEARER];
    // @ts-expect-error — the bifurcation is designed-permanent (§2.1); any
    // third custody mode is a design-doc change, never a silent widening.
    const stray: CookieMode = 'session';
    void stray;
    expect(modes).toHaveLength(2);
  });
});

describe('dual-emit envelope law (§3): REST auth shapes unchanged', () => {
  it('AuthResult carries exactly the device wire keys', () => {
    const wire: AuthResult = {
      token: 'jwt-access',
      session_id: 'sess-1',
      user: { id: 'u1', name: 'tester' },
    };
    // Browser-class bodies are byte-identical to this during the compat
    // window (owner ruling CD-2a: two ui majors); Set-Cookie is transport
    // additive — no body field is added, removed or re-typed.
    expect(Object.keys(wire).sort()).toEqual(['session_id', 'token', 'user']);
    expect(wire.token).toBeTypeOf('string');
    expect(wire.session_id).toBeTypeOf('string');
  });

  it('keeps the snake_case REST casing (no camelCase alias drifts in)', () => {
    // @ts-expect-error — `sessionId` was never the REST login-body spelling
    // (the JWT PAYLOAD uses camelCase `serverId`; the body stays snake_case).
    // This pin reddens the typecheck gate if a dual-emit refactor invents an
    // alias field instead of honoring the byte-ident envelope law.
    const drift: AuthResult = { token: 't', session_id: 's', sessionId: 'x', user: { id: 'u', name: 'n' } };
    void drift;
    expect(true).toBe(true);
  });
});

describe('DeviceType — the cookie opt-out discriminator (§2.1)', () => {
  it('has no browser member: absence of the header selects cookie mode', () => {
    const devices: DeviceType[] = ['windows', 'samsung-tizen', 'android', 'ios', 'roku'];
    // @ts-expect-error — the SPA never device-classes itself; a request
    // WITHOUT X-Phlix-Device-Type (browser Origin class) is what makes the
    // server eligible to Set-Cookie. Adding 'browser' here would launder
    // a browser into the bearer-only class.
    const fake: DeviceType = 'browser';
    void fake;
    expect(devices).toHaveLength(5);
  });

  it('is emitted verbatim by buildPhlixHeaders (the opt-out signal ships)', () => {
    const h = buildPhlixHeaders({ deviceId: 'd', deviceName: 'n', deviceType: 'roku' });
    // Behavior UNCHANGED by this program (§3): headers.ts already emits the
    // discriminator; the law gained here is the docblock truth that the
    // server refuses Set-Cookie whenever this header is present.
    expect(h[X_PHLIX_DEVICE_TYPE]).toBe('roku');
  });
});

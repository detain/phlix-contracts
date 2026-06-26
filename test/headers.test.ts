import { describe, it, expect } from 'vitest';
import {
  X_PHLIX_DEVICE_ID,
  X_PHLIX_DEVICE_NAME,
  X_PHLIX_DEVICE_TYPE,
  X_PHLIX_SESSION_ID,
  buildPhlixHeaders,
} from '../src/headers';

describe('header name constants', () => {
  it('match the server-expected literal header names', () => {
    expect(X_PHLIX_DEVICE_ID).toBe('X-Phlix-Device-ID');
    expect(X_PHLIX_DEVICE_NAME).toBe('X-Phlix-Device-Name');
    expect(X_PHLIX_DEVICE_TYPE).toBe('X-Phlix-Device-Type');
    expect(X_PHLIX_SESSION_ID).toBe('X-Phlix-Session-ID');
  });
});

describe('buildPhlixHeaders', () => {
  it('always emits the three device headers', () => {
    const h = buildPhlixHeaders({
      deviceId: 'dev-1',
      deviceName: 'My TV',
      deviceType: 'samsung-tizen',
    });
    expect(h).toEqual({
      'X-Phlix-Device-ID': 'dev-1',
      'X-Phlix-Device-Name': 'My TV',
      'X-Phlix-Device-Type': 'samsung-tizen',
    });
  });

  it('adds session and authorization headers when present', () => {
    const h = buildPhlixHeaders({
      deviceId: 'dev-2',
      deviceName: 'Desktop',
      deviceType: 'windows',
      sessionId: 'sess-9',
      token: 'jwt-abc',
    });
    expect(h['X-Phlix-Session-ID']).toBe('sess-9');
    expect(h.Authorization).toBe('Bearer jwt-abc');
  });

  it('omits session/auth headers for empty strings', () => {
    const h = buildPhlixHeaders({
      deviceId: 'd',
      deviceName: 'n',
      deviceType: 'ios',
      sessionId: '',
      token: '',
    });
    expect(h['X-Phlix-Session-ID']).toBeUndefined();
    expect(h.Authorization).toBeUndefined();
  });

  it('returns a fresh object each call (no shared mutable state)', () => {
    const a = buildPhlixHeaders({ deviceId: 'd', deviceName: 'n', deviceType: 'roku' });
    const b = buildPhlixHeaders({ deviceId: 'd', deviceName: 'n', deviceType: 'roku' });
    expect(a).not.toBe(b);
    expect(a).toEqual(b);
  });
});

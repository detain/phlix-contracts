import { describe, it, expect } from 'vitest';
import {
  TICKS_PER_SECOND,
  TICKS_PER_MINUTE,
  TICKS_PER_HOUR,
  ticksToSeconds,
  secondsToTicks,
  ticksToMinutes,
  ticksToHms,
  formatRuntime,
  formatDuration,
} from '../src/ticks';

describe('tick constants', () => {
  it('match the Plex/Jellyfin 100-ns convention', () => {
    expect(TICKS_PER_SECOND).toBe(10_000_000);
    expect(TICKS_PER_MINUTE).toBe(600_000_000);
    expect(TICKS_PER_HOUR).toBe(36_000_000_000);
    expect(TICKS_PER_MINUTE).toBe(TICKS_PER_SECOND * 60);
    expect(TICKS_PER_HOUR).toBe(TICKS_PER_MINUTE * 60);
  });
});

describe('ticksToSeconds / secondsToTicks', () => {
  it('converts ticks to seconds', () => {
    expect(ticksToSeconds(10_000_000)).toBe(1);
    expect(ticksToSeconds(0)).toBe(0);
    expect(ticksToSeconds(15_000_000)).toBe(1.5);
  });

  it('converts seconds to whole ticks (floored)', () => {
    expect(secondsToTicks(1)).toBe(10_000_000);
    expect(secondsToTicks(0)).toBe(0);
    expect(secondsToTicks(1.99999999)).toBe(19_999_999);
  });

  it('round-trips whole seconds exactly', () => {
    for (const s of [0, 1, 42, 3600, 7325]) {
      expect(ticksToSeconds(secondsToTicks(s))).toBe(s);
    }
  });
});

describe('ticksToMinutes', () => {
  it('floors to whole minutes', () => {
    expect(ticksToMinutes(TICKS_PER_MINUTE)).toBe(1);
    expect(ticksToMinutes(TICKS_PER_MINUTE * 90)).toBe(90);
    expect(ticksToMinutes(TICKS_PER_MINUTE - 1)).toBe(0);
  });
});

describe('ticksToHms', () => {
  it('formats M:SS under an hour', () => {
    expect(ticksToHms(secondsToTicks(0))).toBe('0:00');
    expect(ticksToHms(secondsToTicks(5))).toBe('0:05');
    expect(ticksToHms(secondsToTicks(65))).toBe('1:05');
  });

  it('formats H:MM:SS at or above an hour', () => {
    expect(ticksToHms(secondsToTicks(3600))).toBe('1:00:00');
    expect(ticksToHms(secondsToTicks(3661))).toBe('1:01:01');
    expect(ticksToHms(secondsToTicks(7325))).toBe('2:02:05');
  });

  it('clamps non-finite / negative input to the "0:00" fallback (Q3)', () => {
    expect(ticksToHms(NaN)).toBe('0:00');
    expect(ticksToHms(Infinity)).toBe('0:00');
    expect(ticksToHms(-Infinity)).toBe('0:00');
    expect(ticksToHms(-1)).toBe('0:00');
    // never returns a "NaN..." string
    expect(ticksToHms(NaN)).not.toContain('NaN');
    expect(ticksToHms(Infinity)).not.toContain('NaN');
  });
});

describe('formatRuntime (mobile parity)', () => {
  it('shows "<n> min" under an hour', () => {
    expect(formatRuntime(0)).toBe('0 min');
    expect(formatRuntime(TICKS_PER_MINUTE * 45)).toBe('45 min');
    expect(formatRuntime(TICKS_PER_MINUTE * 59)).toBe('59 min');
  });

  it('shows "<h>h <m>m" at or above an hour', () => {
    expect(formatRuntime(TICKS_PER_MINUTE * 60)).toBe('1h 0m');
    expect(formatRuntime(TICKS_PER_MINUTE * 90)).toBe('1h 30m');
    expect(formatRuntime(TICKS_PER_MINUTE * 125)).toBe('2h 5m');
  });

  it('clamps non-finite / negative input to the "0 min" fallback (Q3)', () => {
    expect(formatRuntime(NaN)).toBe('0 min');
    expect(formatRuntime(Infinity)).toBe('0 min');
    expect(formatRuntime(-Infinity)).toBe('0 min');
    expect(formatRuntime(-1)).toBe('0 min');
    expect(formatRuntime(NaN)).not.toContain('NaN');
    expect(formatRuntime(Infinity)).not.toContain('NaN');
  });
});

describe('formatDuration (tizen parity)', () => {
  it('returns "" for falsy input', () => {
    expect(formatDuration(0)).toBe('');
    expect(formatDuration(NaN)).toBe('');
  });

  it('returns "" for non-finite / negative input (Q3)', () => {
    expect(formatDuration(Infinity)).toBe('');
    expect(formatDuration(-Infinity)).toBe('');
    expect(formatDuration(-1)).toBe('');
    expect(formatDuration(NaN)).not.toContain('NaN');
    expect(formatDuration(Infinity)).not.toContain('NaN');
  });

  it('shows "<m>m" under an hour', () => {
    expect(formatDuration(TICKS_PER_MINUTE * 10)).toBe('10m');
  });

  it('shows "<h>h <m>m" at or above an hour', () => {
    // 36600000000 ticks = 1h 1m (the tizen smoke-test case)
    expect(formatDuration(36_600_000_000)).toBe('1h 1m');
    expect(formatDuration(TICKS_PER_HOUR * 2 + TICKS_PER_MINUTE * 5)).toBe('2h 5m');
  });
});

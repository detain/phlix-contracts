/**
 * profiletag.test.
 *
 * S234 — wire-shape pins for `ProfileTag` and `AccessSchedule`.
 *
 * The defect: the contracts declared camelCase keys (`tagType`,
 * `startTime`/`endTime`/`daysOfWeek`/`isActive`) and `profileId: number`
 * while the server emits snake_case (`tag_type`, `start_time`, …) and
 * stores `profile_id` as CHAR(36). Mobile/roku creates therefore 400'd.
 *
 * These pins are compile-time (executed by `tsc --noEmit`, like the
 * renditions pins): a spelling that drifts from the FIXED server contract
 * reddens the typecheck, not just a runtime assertion.
 *
 * @copyright 2026 Joe Huss <detain@interserver.net>
 */

import { describe, it, expect } from 'vitest';
import type { ProfileTag } from '../src/ProfileTag';
import type { AccessSchedule, DayOfWeek } from '../src/AccessSchedule';

/**
 * `true` only when `A` and `B` are the SAME type, not merely assignable to one
 * another. (Same helper as `test/music.test.ts` / `test/renditions.test.ts`.)
 */
type Exact<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;

/**
 * `true` iff `K` is a member of `keyof T`. `keyof` includes OPTIONAL members,
 * so this is RED for `tag_type?: …` just as it is for `tag_type: …`.
 */
type HasKey<T, K extends PropertyKey> = K extends keyof T ? true : false;

/** Compile-time assertion — see `renditions.test.ts`. */
function assertExact<T extends true>(value: T): T {
  return value;
}

// Type-level smoke: the literals must satisfy the exported interfaces at
// compile time (a field name/type/casing drift from the server contract
// fails `npm run typecheck` / `npm run build`).
describe('ProfileTag wire-shape pins (S234)', () => {
  it('declares the snake_case tag_type key and NOT the camelCase tagType', () => {
    expect(assertExact<Exact<HasKey<ProfileTag, 'tag_type'>, true>>(true)).toBe(true);
    expect(assertExact<Exact<HasKey<ProfileTag, 'tagType'>, false>>(true)).toBe(true);
  });

  it('types profileId as string (CHAR(36) UUID), not number', () => {
    expect(assertExact<Exact<ProfileTag['profileId'], string>>(true)).toBe(true);
  });

  it('keeps the blocked|allowed literal for tag_type', () => {
    const blocked: ProfileTag['tag_type'] = 'blocked';
    const allowed: ProfileTag['tag_type'] = 'allowed';
    // @ts-expect-error — a third value is not in the vocabulary.
    const bogus: ProfileTag['tag_type'] = 'bogus';
    expect(blocked).toBe('blocked');
    expect(allowed).toBe('allowed');
    void bogus;
  });

  it('constructs a snake_case ProfileTag verbatim (server toArray shape)', () => {
    const tag: ProfileTag = {
      id: 7,
      profileId: 'a1a1a1a1-1111-4111-8111-a1a1a1a1a1a1',
      tag: 'kids',
      tag_type: 'blocked',
    };
    expect(tag.tag_type).toBe('blocked');
    expect(tag.profileId).toHaveLength(36);
  });
});

describe('AccessSchedule wire-shape pins (S234)', () => {
  it('declares the snake_case schedule keys and NOT the camelCase spellings', () => {
    expect(assertExact<Exact<HasKey<AccessSchedule, 'start_time'>, true>>(true)).toBe(true);
    expect(assertExact<Exact<HasKey<AccessSchedule, 'end_time'>, true>>(true)).toBe(true);
    expect(assertExact<Exact<HasKey<AccessSchedule, 'days_of_week'>, true>>(true)).toBe(true);
    expect(assertExact<Exact<HasKey<AccessSchedule, 'is_active'>, true>>(true)).toBe(true);

    expect(assertExact<Exact<HasKey<AccessSchedule, 'startTime'>, false>>(true)).toBe(true);
    expect(assertExact<Exact<HasKey<AccessSchedule, 'endTime'>, false>>(true)).toBe(true);
    expect(assertExact<Exact<HasKey<AccessSchedule, 'daysOfWeek'>, false>>(true)).toBe(true);
    expect(assertExact<Exact<HasKey<AccessSchedule, 'isActive'>, false>>(true)).toBe(true);
  });

  it('types profileId as string (CHAR(36) UUID), not number', () => {
    expect(assertExact<Exact<AccessSchedule['profileId'], string>>(true)).toBe(true);
  });

  it('keeps the DayOfWeek literal set', () => {
    const days: DayOfWeek[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
    expect(days).toHaveLength(7);
  });

  it('constructs a snake_case AccessSchedule verbatim (server toArray shape)', () => {
    const schedule: AccessSchedule = {
      id: 3,
      profileId: 'a1a1a1a1-1111-4111-8111-a1a1a1a1a1a1',
      name: 'Bedtime',
      start_time: '20:00:00',
      end_time: '22:00:00',
      days_of_week: ['mon', 'tue'],
      is_active: true,
    };
    expect(schedule.start_time).toBe('20:00:00');
    expect(schedule.days_of_week).toEqual(['mon', 'tue']);
    expect(schedule.is_active).toBe(true);
  });
});

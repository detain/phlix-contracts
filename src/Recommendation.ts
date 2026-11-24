/**
 * Recommendation types for the P4-S2 because-you-watched engine.
 *
 * These types are shared across phlix-server (source of truth), phlix-contracts
 * (wire DTOs), and all client repos. Mirrors the recommendation API responses.
 * @copyright 2026 Joe Huss <detain@interserver.net>
 */

import type { WireKeysExact } from './internal/wireKeys.js';

/**
 * A single user recommendation returned by the because-you-watched engine.
 *
 * ComputedAt is an ISO 8601 timestamp of when the recommendation was generated.
 */
export interface UserRecommendation {
  id: string;
  title: string;
  posterUrl: string | null;
  year: number | null;
  score: number;
  reason: 'because_you_watched';
  /** ISO 8601 timestamp of when this recommendation was computed. */
  computedAt: string;
}

/**
 * A list of user recommendations.
 */
export interface RecommendationList {
  recommendations: UserRecommendation[];
}

/** Ordered key set of {@link UserRecommendation} (S-contracts-02 / -002). */
export const USER_RECOMMENDATION_KEYS = [
  'id',
  'title',
  'posterUrl',
  'year',
  'score',
  'reason',
  'computedAt',
] as const;

/** Ordered key set of {@link RecommendationList} (S-contracts-02 / -002). */
export const RECOMMENDATION_LIST_KEYS = ['recommendations'] as const;

// ---------------------------------------------------------------------------
// Compile-time ties (S-contracts-02 / -002). See `src/media.ts` for the law;
// these pin each wire interface to its ordered key-list const.
// ---------------------------------------------------------------------------

export type UserRecommendationKeysTied = WireKeysExact<UserRecommendation, typeof USER_RECOMMENDATION_KEYS>;
export type RecommendationListKeysTied = WireKeysExact<RecommendationList, typeof RECOMMENDATION_LIST_KEYS>;

const _userRecommendationKeysTied: UserRecommendationKeysTied = true;
const _recommendationListKeysTied: RecommendationListKeysTied = true;

/** Every recommendation tie, aggregated for the runtime legs of the gate. */
export const RECOMMENDATION_KEY_TIES = {
  item: _userRecommendationKeysTied,
  list: _recommendationListKeysTied,
} as const;

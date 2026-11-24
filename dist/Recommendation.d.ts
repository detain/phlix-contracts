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
export declare const USER_RECOMMENDATION_KEYS: readonly ["id", "title", "posterUrl", "year", "score", "reason", "computedAt"];
/** Ordered key set of {@link RecommendationList} (S-contracts-02 / -002). */
export declare const RECOMMENDATION_LIST_KEYS: readonly ["recommendations"];
export type UserRecommendationKeysTied = WireKeysExact<UserRecommendation, typeof USER_RECOMMENDATION_KEYS>;
export type RecommendationListKeysTied = WireKeysExact<RecommendationList, typeof RECOMMENDATION_LIST_KEYS>;
/** Every recommendation tie, aggregated for the runtime legs of the gate. */
export declare const RECOMMENDATION_KEY_TIES: {
    readonly item: true;
    readonly list: true;
};

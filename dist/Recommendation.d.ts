/**
 * Recommendation types for the P4-S2 because-you-watched engine.
 *
 * These types are shared across phlix-server (source of truth), phlix-contracts
 * (wire DTOs), and all client repos. Mirrors the recommendation API responses.
 * @copyright 2026 Joe Huss <detain@interserver.net>
 */
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

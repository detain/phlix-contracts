/**
 * Rating types for the P1-S6 rating storage feature.
 *
 * These types are shared across phlix-server (source of truth), phlix-contracts
 * (wire DTOs), and all client repos. Mirrors the rating storage schema in
 * phlix-shared and the rating API responses.
 * @copyright 2026 Joe Huss <detain@interserver.net>
 */
/**
 * A single rating record attached to a media item.
 *
 * Sources: 'tmdb' (TheMovieDB), 'imdb' (IMDb), or 'user' (per-user star rating).
 * Type: 'average' (weighted average across sources), 'user' (user star rating),
 * 'critic' (aggregated critic score), or 'meta' (Metacritic-style meta score).
 * Score is a 0.0 - 10.0 float. Votes is null for user ratings.
 */
export interface Rating {
    id: number;
    mediaItemId: string;
    source: 'tmdb' | 'imdb' | 'user';
    type: 'average' | 'user' | 'critic' | 'meta';
    /** 0.0 - 10.0 score value. */
    score: number;
    /** Total vote count. Null for user ratings. */
    votes: number | null;
}
/**
 * All ratings for a single media item, including the weighted aggregate.
 */
export interface MediaRatings {
    itemId: string;
    ratings: Rating[];
    /** Weighted average of all non-user ratings, or null when no ratings exist. */
    aggregateScore: number | null;
}
/** Sort by rating value. */
export interface RatingSortKey {
    kind: 'rating';
    direction: 'asc' | 'desc';
}
/** Filter to items with rating >= threshold. */
export interface MinRatingFilter {
    kind: 'min_rating';
    /** 0.0 - 10.0 minimum threshold (inclusive). */
    threshold: number;
}
/** Filter to items with rating <= threshold. */
export interface MaxRatingFilter {
    kind: 'max_rating';
    /** 0.0 - 10.0 maximum threshold (inclusive). */
    threshold: number;
}
/**
 * All valid field names that can appear in a smart-rule filter expression.
 * Extend this union as new filter dimensions are added.
 */
export type SmartRuleField = 'actor' | 'director' | 'decade' | 'rating_range' | 'tmdb_score' | 'studio' | 'network' | 'min_rating' | 'max_rating';
/**
 * A manual match override records when a provider ID (TMDB, IMDb, AniDB) was
 * manually linked to a local media item by a user or the system.
 */
export interface ManualMatchOverride {
    type: 'manual_match';
    provider: 'tmdb' | 'imdb' | 'anidb';
    providerId: string;
    /** Local media item this provider ID is linked to. */
    mediaItemId: string;
    /** 0.0 - 1.0 confidence score of the match. */
    confidence: number;
    /** ISO 8601 timestamp of when the match was created. */
    matchedAt: string;
    /** Whether this match was made by a user or the automated system. */
    matchedBy: 'user' | 'system';
}

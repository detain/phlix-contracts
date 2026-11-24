/**
 * SimilarItem types for the P4-S1 similar-items engine.
 *
 * These types are shared across phlix-server (source of truth), phlix-contracts
 * (wire DTOs), and all client repos. Mirrors the similar-items API responses.
 * @copyright 2026 Joe Huss <detain@interserver.net>
 */
import type { WireKeysExact } from './internal/wireKeys.js';
/**
 * A media item similar to another, returned by the similar-items engine.
 *
 * Score is a 0.000 - 1.000 float representing similarity confidence.
 * Reason explains why the item was recommended.
 */
export interface SimilarItem {
    id: string;
    title: string;
    posterUrl: string | null;
    year: number | null;
    /** 0.000 - 1.000 similarity confidence score. */
    score: number;
    /** Why this item was selected as similar. */
    reason: 'genre' | 'actor' | 'director' | 'rating' | 'year';
}
/** Ordered key set of {@link SimilarItem} (S-contracts-02 / -002). */
export declare const SIMILAR_ITEM_KEYS: readonly ["id", "title", "posterUrl", "year", "score", "reason"];
export type SimilarItemKeysTied = WireKeysExact<SimilarItem, typeof SIMILAR_ITEM_KEYS>;
/** Every similar-item tie, aggregated for the runtime legs of the gate. */
export declare const SIMILAR_ITEM_KEY_TIES: {
    readonly item: true;
};

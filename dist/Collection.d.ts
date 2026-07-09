/**
 * Collection types for box-set / collection groupings.
 *
 * These types are shared across phlix-server (source of truth), phlix-contracts
 * (wire DTOs), and all client repos. Mirrors the collection API responses.
 * @copyright 2026 Joe Huss <detain@interserver.net>
 */
/**
 * A collection box-set containing multiple items (e.g., a movie franchise).
 */
export interface CollectionBoxSet {
    id: string;
    name: string;
    overview: string | null;
    posterUrl: string | null;
    backdropUrl: string | null;
    items: CollectionMember[];
}
/**
 * A single member of a collection box-set.
 */
export interface CollectionMember {
    id: string;
    title: string;
    posterUrl: string | null;
    year: number | null;
    mediaType: 'movie' | 'tv';
    /** Display order within the collection. */
    order: number;
}

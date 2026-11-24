/**
 * Collection types for box-set / collection groupings.
 *
 * These types are shared across phlix-server (source of truth), phlix-contracts
 * (wire DTOs), and all client repos. Mirrors the collection API responses.
 * @copyright 2026 Joe Huss <detain@interserver.net>
 */

import type { WireKeysExact } from './internal/wireKeys.js';

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

/** Ordered key set of {@link CollectionBoxSet} (S-contracts-02 / -002). */
export const COLLECTION_BOX_SET_KEYS = [
  'id',
  'name',
  'overview',
  'posterUrl',
  'backdropUrl',
  'items',
] as const;

/** Ordered key set of {@link CollectionMember} (S-contracts-02 / -002). */
export const COLLECTION_MEMBER_KEYS = [
  'id',
  'title',
  'posterUrl',
  'year',
  'mediaType',
  'order',
] as const;

// ---------------------------------------------------------------------------
// Compile-time ties (S-contracts-02 / -002). See `src/media.ts` for the law;
// these pin each wire interface to its ordered key-list const.
// ---------------------------------------------------------------------------

export type CollectionBoxSetKeysTied = WireKeysExact<CollectionBoxSet, typeof COLLECTION_BOX_SET_KEYS>;
export type CollectionMemberKeysTied = WireKeysExact<CollectionMember, typeof COLLECTION_MEMBER_KEYS>;

const _collectionBoxSetKeysTied: CollectionBoxSetKeysTied = true;
const _collectionMemberKeysTied: CollectionMemberKeysTied = true;

/** Every collection tie, aggregated for the runtime legs of the gate. */
export const COLLECTION_KEY_TIES = {
  boxSet: _collectionBoxSetKeysTied,
  member: _collectionMemberKeysTied,
} as const;
